use std::io;
use std::os::windows::io::{AsRawHandle, FromRawHandle, OwnedHandle};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    mpsc::{self, Receiver, SyncSender},
    Arc,
};
use std::time::{Duration, Instant};
use windows::core::{Error, HRESULT, PCWSTR, PWSTR};
use windows::Win32::{
    Foundation::{LocalFree, ERROR_IO_PENDING, ERROR_PIPE_CONNECTED, HANDLE, HLOCAL, WAIT_TIMEOUT},
    Security::{
        Authorization::{
            ConvertSidToStringSidW, ConvertStringSecurityDescriptorToSecurityDescriptorW,
        },
        GetTokenInformation, TokenUser, PSECURITY_DESCRIPTOR, SECURITY_ATTRIBUTES, TOKEN_QUERY,
        TOKEN_USER,
    },
    Storage::FileSystem::{
        FlushFileBuffers, ReadFile, WriteFile, FILE_FLAG_FIRST_PIPE_INSTANCE, FILE_FLAG_OVERLAPPED,
        PIPE_ACCESS_DUPLEX,
    },
    System::{
        Pipes::{
            ConnectNamedPipe, CreateNamedPipeW, DisconnectNamedPipe, PIPE_REJECT_REMOTE_CLIENTS,
        },
        Threading::{CreateEventW, GetCurrentProcess, OpenProcessToken, ResetEvent},
        IO::{CancelIoEx, GetOverlappedResult, GetOverlappedResultEx, OVERLAPPED},
    },
};

use super::control::{self, Request};

const MAX_LINE: usize = 4096;
const CLIENT_IDLE: Duration = Duration::from_secs(15);

pub(super) struct PipeServer(Arc<AtomicBool>);

impl PipeServer {
    pub fn start(name: &str) -> Result<(Self, Receiver<Request>), Box<dyn std::error::Error>> {
        let name = if name.is_empty() {
            format!("systemless.{}", std::process::id())
        } else {
            name.strip_prefix(r"\\.\pipe\").unwrap_or(name).to_owned()
        };
        if name.is_empty()
            || name.len() > 200
            || !name
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'-' | b'_'))
        {
            return Err(
                "invalid pipe name (use ASCII letters, digits, periods, hyphens or underscores)"
                    .into(),
            );
        }
        let path = format!(r"\\.\pipe\{name}");
        let pipe = create_pipe(&path)?;
        let event = own(unsafe { CreateEventW(None, true, false, PCWSTR::null())? });
        let (send, receive) = mpsc::sync_channel(1);
        let stopped = Arc::new(AtomicBool::new(false));
        let stop = stopped.clone();
        std::thread::Builder::new()
            .name("systemless-control-pipe".into())
            .spawn(move || {
                let pipe = PipeIo {
                    pipe: handle(&pipe),
                    event: handle(&event),
                    stop: &stop,
                };
                pipe.serve(send);
            })?;
        eprintln!("[SYSTEMLESS] Control pipe: {path}");
        Ok((Self(stopped), receive))
    }
}

impl Drop for PipeServer {
    fn drop(&mut self) {
        self.0.store(true, Ordering::Release);
    }
}

fn own(handle: HANDLE) -> OwnedHandle {
    // The caller transfers a freshly opened handle.
    unsafe { OwnedHandle::from_raw_handle(handle.0 as _) }
}

fn handle(owned: &OwnedHandle) -> HANDLE {
    HANDLE(owned.as_raw_handle() as isize)
}

fn wide(text: &str) -> Vec<u16> {
    text.encode_utf16().chain([0]).collect()
}

fn create_pipe(path: &str) -> windows::core::Result<OwnedHandle> {
    unsafe {
        let mut token = HANDLE::default();
        OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token)?;
        let token = own(token);
        let mut size = 0;
        let _ = GetTokenInformation(handle(&token), TokenUser, None, 0, &mut size);
        let mut user = vec![0usize; (size as usize).div_ceil(size_of::<usize>())];
        GetTokenInformation(
            handle(&token),
            TokenUser,
            Some(user.as_mut_ptr().cast()),
            size,
            &mut size,
        )?;
        let user = &*user.as_ptr().cast::<TOKEN_USER>();
        let mut sid = PWSTR::null();
        ConvertSidToStringSidW(user.User.Sid, &mut sid)?;
        let sid_string = sid.to_string();
        LocalFree(HLOCAL(sid.0 as _));
        let sid = sid_string?;
        let sddl = wide(&format!("O:{sid}D:P(A;;GA;;;{sid})"));
        let mut descriptor = PSECURITY_DESCRIPTOR::default();
        ConvertStringSecurityDescriptorToSecurityDescriptorW(
            PCWSTR(sddl.as_ptr()),
            1,
            &mut descriptor,
            None,
        )?;
        let security = SECURITY_ATTRIBUTES {
            nLength: size_of::<SECURITY_ATTRIBUTES>() as u32,
            lpSecurityDescriptor: descriptor.0,
            bInheritHandle: false.into(),
        };
        let path = wide(path);
        let pipe = CreateNamedPipeW(
            PCWSTR(path.as_ptr()),
            PIPE_ACCESS_DUPLEX | FILE_FLAG_OVERLAPPED | FILE_FLAG_FIRST_PIPE_INSTANCE,
            PIPE_REJECT_REMOTE_CLIENTS,
            1,
            MAX_LINE as u32,
            MAX_LINE as u32,
            0,
            Some(&security),
        );
        let result = if pipe.is_invalid() {
            Err(Error::from_win32())
        } else {
            Ok(own(pipe))
        };
        LocalFree(HLOCAL(descriptor.0 as _));
        result
    }
}

struct PipeIo<'a> {
    pipe: HANDLE,
    event: HANDLE,
    stop: &'a AtomicBool,
}

impl PipeIo<'_> {
    fn operation(
        &self,
        deadline: Option<Instant>,
        start: impl FnOnce(*mut OVERLAPPED) -> windows::core::Result<()>,
    ) -> io::Result<u32> {
        let mut overlapped = OVERLAPPED {
            hEvent: self.event,
            ..Default::default()
        };
        let mut count = 0;
        unsafe {
            ResetEvent(self.event)?;
            match start(&mut overlapped) {
                Ok(()) => GetOverlappedResult(self.pipe, &overlapped, &mut count, false)?,
                Err(error) if error.code() == HRESULT::from_win32(ERROR_PIPE_CONNECTED.0) => {}
                Err(error) if error.code() == HRESULT::from_win32(ERROR_IO_PENDING.0) => {
                    loop {
                        match GetOverlappedResultEx(self.pipe, &overlapped, &mut count, 100, false)
                        {
                            Ok(()) => break,
                            Err(error) if error.code() == HRESULT::from_win32(WAIT_TIMEOUT.0) => {
                                if self.stop.load(Ordering::Acquire)
                                    || deadline.is_some_and(|deadline| Instant::now() >= deadline)
                                {
                                    // Completion must be observed before releasing the
                                    // OVERLAPPED and its borrowed read/write buffer.
                                    let _ = CancelIoEx(self.pipe, Some(&overlapped));
                                    let _ = GetOverlappedResult(
                                        self.pipe,
                                        &overlapped,
                                        &mut count,
                                        true,
                                    );
                                    return Err(io::ErrorKind::TimedOut.into());
                                }
                            }
                            Err(error) => return Err(error.into()),
                        }
                    }
                }
                Err(error) => return Err(error.into()),
            }
        }
        Ok(count)
    }

    fn serve(&self, requests: SyncSender<Request>) {
        while !self.stop.load(Ordering::Acquire) {
            let connected = self.operation(None, |pending| unsafe {
                ConnectNamedPipe(self.pipe, Some(pending))
            });
            if connected.is_ok() {
                let _ = self.conversation(&requests);
            }
            let _ = unsafe { DisconnectNamedPipe(self.pipe) };
        }
    }

    fn conversation(&self, requests: &SyncSender<Request>) -> io::Result<()> {
        let mut buffer = [0; 1024];
        let mut line = Vec::new();
        loop {
            let deadline = Instant::now() + CLIENT_IDLE;
            let count = self.operation(Some(deadline), |pending| unsafe {
                ReadFile(self.pipe, Some(&mut buffer), None, Some(pending))
            })? as usize;
            if count == 0 {
                return Ok(());
            }
            for &byte in &buffer[..count] {
                if byte == b'\n' {
                    if self.respond(&line, requests)? {
                        return Ok(());
                    }
                    line.clear();
                } else if line.len() == MAX_LINE {
                    self.write_line(&control::failure("control line exceeds 4096 bytes"))?;
                    return Ok(());
                } else {
                    line.push(byte);
                }
            }
        }
    }

    fn respond(&self, line: &[u8], requests: &SyncSender<Request>) -> io::Result<bool> {
        let response = match control::parse(line) {
            Ok(op) => {
                let (reply, receive) = mpsc::channel();
                if requests.try_send(Request { op, reply }).is_ok() {
                    receive.recv_timeout(CLIENT_IDLE).ok()
                } else {
                    None
                }
            }
            Err(value) => Some(control::Reply {
                value,
                drained: None,
            }),
        };
        let Some(response) = response else {
            self.write_line(&control::failure("desktop runtime is unavailable"))?;
            return Ok(false);
        };
        self.write_line(&response.value)?;
        if let Some(drained) = response.drained {
            // On the quit path the owner caps its wait independently. A
            // disconnected or idle client can never hold up process exit.
            let _ = unsafe { FlushFileBuffers(self.pipe) };
            let _ = drained.send(());
            return Ok(true);
        }
        Ok(false)
    }

    fn write_line(&self, value: &serde_json::Value) -> io::Result<()> {
        let mut bytes = serde_json::to_vec(value)?;
        bytes.push(b'\n');
        let deadline = Instant::now() + Duration::from_secs(2);
        let mut remaining = bytes.as_slice();
        while !remaining.is_empty() {
            let count = self.operation(Some(deadline), |pending| unsafe {
                WriteFile(self.pipe, Some(remaining), None, Some(pending))
            })? as usize;
            if count == 0 {
                return Err(io::ErrorKind::WriteZero.into());
            }
            remaining = &remaining[count..];
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::control::Operation;
    use std::io::{BufRead, BufReader, Write};

    #[test]
    fn local_pipe_accepts_multiple_json_lines_and_delivers_quit_before_disconnect() {
        let name = format!("systemless.test.{}", std::process::id());
        let (_pipe, requests) = PipeServer::start(&name).unwrap();
        let client = std::fs::OpenOptions::new()
            .read(true)
            .write(true)
            .open(format!(r"\\.\pipe\{name}"))
            .unwrap();
        let mut client = BufReader::new(client);
        let owner = std::thread::spawn(move || {
            for op in [Operation::Status, Operation::QuitGraceful] {
                let request = requests.recv_timeout(Duration::from_secs(5)).unwrap();
                assert_eq!(request.op, op);
                let (drained, ack) = mpsc::channel();
                request
                    .reply
                    .send(control::Reply {
                        value: serde_json::json!({"ok": true}),
                        drained: (op == Operation::QuitGraceful).then_some(drained),
                    })
                    .unwrap();
                if op == Operation::QuitGraceful {
                    ack.recv_timeout(Duration::from_secs(5)).unwrap();
                }
            }
        });
        client
            .get_mut()
            .write_all(b"{\"op\":\"other\"}\n{\"op\":\"status\"}\n{\"op\":\"quit-graceful\"}\n")
            .unwrap();
        for ok in [false, true, true] {
            let mut line = String::new();
            assert_ne!(client.read_line(&mut line).unwrap(), 0);
            assert_eq!(
                serde_json::from_str::<serde_json::Value>(&line).unwrap()["ok"],
                ok
            );
        }
        owner.join().unwrap();
    }
}
