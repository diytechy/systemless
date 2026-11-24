use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::mpsc::{self, Receiver, Sender};
use std::time::{Duration, Instant};

use super::runtime_driver::GuiDriver;

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub(super) enum Operation {
    Status,
    Pause,
    Resume,
    FlushSaves,
    QuitGraceful,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Command {
    op: Operation,
}

pub(super) fn parse(line: &[u8]) -> Result<Operation, Value> {
    serde_json::from_slice::<Command>(line)
        .map(|command| command.op)
        .map_err(|error| failure(&error.to_string()))
}

pub(super) fn failure(error: &str) -> Value {
    json!({ "ok": false, "error": error })
}

pub(super) struct Request {
    pub op: Operation,
    pub reply: Sender<Reply>,
}

pub(super) struct Reply {
    pub value: Value,
    /// A quitting owner waits briefly for the pipe client to consume the reply
    /// before it tells the window thread to exit the process.
    pub drained: Option<Sender<()>>,
}

struct Quit {
    deadline: Instant,
    reply: Sender<Reply>,
}

#[derive(Default)]
pub(super) struct Control {
    pub paused: bool,
    quit: Option<Quit>,
}

impl Control {
    pub fn quitting(&self) -> bool {
        self.quit.is_some()
    }

    pub fn handle(&mut self, driver: &mut GuiDriver, request: Request, now: Instant) {
        let value = match request.op {
            Operation::Status => json!({
                "ok": true,
                "pid": std::process::id(),
                "paused": self.paused,
                "title": driver.game_config.window_title.as_deref()
                    .unwrap_or(super::DEFAULT_DESKTOP_TITLE),
                "saveRoot": driver.save_store.as_ref().map(|store| store.root()),
            }),
            Operation::Pause | Operation::Resume if !self.quitting() => {
                let paused = request.op == Operation::Pause;
                if self.paused != paused {
                    self.paused = paused;
                    driver.set_control_pause(paused);
                }
                json!({ "ok": true, "paused": self.paused })
            }
            Operation::FlushSaves => flush(driver),
            Operation::QuitGraceful if !self.quitting() => {
                self.paused = false;
                driver.set_control_pause(false);
                let timeout = driver.begin_graceful_quit();
                self.quit = Some(Quit {
                    deadline: now + timeout,
                    reply: request.reply,
                });
                return;
            }
            _ => failure("a graceful quit is already in progress"),
        };
        let _ = request.reply.send(Reply {
            value,
            drained: None,
        });
    }

    pub fn quit_ready(&self, guest_exited: bool, now: Instant) -> bool {
        self.quit
            .as_ref()
            .is_some_and(|quit| guest_exited || now >= quit.deadline)
    }

    pub fn finish_quit(&mut self, driver: &mut GuiDriver) {
        let Some(quit) = self.quit.take() else { return };
        let guest_exited = driver.guest_requested_exit();
        let mut value = flush(driver);
        value["guestExited"] = json!(guest_exited);
        value["timedOut"] = json!(!guest_exited && Instant::now() >= quit.deadline);
        let (drained, acknowledgement) = mpsc::channel();
        if quit
            .reply
            .send(Reply {
                value,
                drained: Some(drained),
            })
            .is_ok()
        {
            let _ = acknowledgement.recv_timeout(Duration::from_millis(750));
        }
    }

    pub fn receive(&mut self, driver: &mut GuiDriver, requests: Option<&Receiver<Request>>) {
        if let Some(request) = requests.and_then(|requests| requests.try_recv().ok()) {
            self.handle(driver, request, Instant::now());
        }
    }
}

fn flush(driver: &mut GuiDriver) -> Value {
    let Some(report) = driver.flush_saves() else {
        return failure("guest save store is unavailable");
    };
    let mut response = json!({
        "ok": report.failures == 0,
        "filesWritten": report.files_written,
        "saveRoot": driver.save_store.as_ref().unwrap().root(),
    });
    if report.failures != 0 {
        response["error"] = json!(format!("{} save operations failed", report.failures));
    }
    response
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_each_operation_and_rejects_bad_lines() {
        for (name, op) in [
            ("status", Operation::Status),
            ("pause", Operation::Pause),
            ("resume", Operation::Resume),
            ("flush-saves", Operation::FlushSaves),
            ("quit-graceful", Operation::QuitGraceful),
        ] {
            assert_eq!(
                parse(format!("{{\"op\":\"{name}\"}}\r\n").as_bytes()),
                Ok(op)
            );
        }
        for malformed in [
            r#"{"op":"other"}"#,
            r#"{"op":"pause","extra":1}"#,
            "{}",
            "[",
        ] {
            assert_eq!(parse(malformed.as_bytes()).unwrap_err()["ok"], false);
        }
    }

    #[test]
    fn flush_and_graceful_quit_persist_pending_forks_and_report_counts() {
        use super::super::{DesktopSaveStore, FixtureRunner, UiThemeId};
        use systemless::systems::macintosh::runner::VfsFileSnapshot;
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("saves");
        let mut runner = FixtureRunner::new(8 * 1024 * 1024, Default::default());
        let store = DesktopSaveStore::for_game_config(
            &temp.path().join("no-source-needed.img"),
            &mut runner,
            Some(&root),
            &["temporary items/excepted".into()],
        )
        .unwrap();
        let mut driver = GuiDriver::new(
            "test".into(),
            false,
            false,
            false,
            None,
            UiThemeId::ClassicSystem7,
        );
        driver.runner = Some(runner);
        driver.save_store = Some(store);
        let mut control = Control::default();
        let call = |control: &mut Control, driver: &mut GuiDriver, op| {
            let (reply, receive) = mpsc::channel();
            control.handle(driver, Request { op, reply }, Instant::now());
            receive.recv_timeout(Duration::from_secs(1)).unwrap().value
        };
        let status = call(&mut control, &mut driver, Operation::Status);
        assert_eq!(status["pid"], std::process::id());
        assert_eq!(status["paused"], false);
        assert_eq!(
            status["saveRoot"],
            json!(std::fs::canonicalize(&root).unwrap())
        );
        assert_eq!(
            call(&mut control, &mut driver, Operation::Pause)["paused"],
            true
        );
        assert_eq!(
            call(&mut control, &mut driver, Operation::Resume)["paused"],
            false
        );

        let file = |path: &str| VfsFileSnapshot {
            path: path.into(),
            data_fork: vec![1, 2],
            resource_fork: vec![3],
            file_type: u32::from_be_bytes(*b"SAVE"),
            creator: u32::from_be_bytes(*b"TEST"),
            finder_flags: 0,
            created_date: 1,
            modified_date: 1,
        };
        let allowed = file("Temporary Items/Excepted");
        let excluded = file("Temporary Items/Excluded");
        let last = file("Progress/Final");
        let runner = driver.runner.as_mut().unwrap();
        runner.import_vfs_file(&allowed);
        runner.import_vfs_file(&excluded);
        let flushed = call(&mut control, &mut driver, Operation::FlushSaves);
        assert_eq!(flushed["ok"], true);
        assert_eq!(flushed["filesWritten"], 1);
        assert_eq!(
            call(&mut control, &mut driver, Operation::FlushSaves)["filesWritten"],
            0
        );
        driver.runner.as_mut().unwrap().import_vfs_file(&last);
        let (reply, receive) = mpsc::channel();
        let start = Instant::now() - Duration::from_secs(7);
        control.handle(
            &mut driver,
            Request {
                op: Operation::QuitGraceful,
                reply,
            },
            start,
        );
        assert!(control.quit_ready(false, Instant::now()));
        let client = std::thread::spawn(move || {
            let response = receive.recv_timeout(Duration::from_secs(2)).unwrap();
            response.drained.unwrap().send(()).unwrap();
            response.value
        });
        control.finish_quit(&mut driver);
        let result = client.join().unwrap();
        assert_eq!(result["ok"], true);
        assert_eq!(result["filesWritten"], 1);
        assert_eq!(result["timedOut"], true);
        assert_eq!(result["guestExited"], false);
        let files = driver.save_store.as_mut().unwrap().load_saved_files();
        assert_eq!(files.len(), 2);
        assert!(files.contains(&allowed));
        assert!(files.contains(&last));
    }
}
