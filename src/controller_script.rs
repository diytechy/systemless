//! Host-independent interpretation of the controller script data.

use crate::controller_data::{GameData, Step, FRAME_MS, RUN_DEPTH};
use std::{future::Future, pin::Pin};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Pointer {
    Move,
    Down,
    Up,
}

#[allow(async_fn_in_trait)] // Both frontends execute scripts on the guest owner.
pub trait ScriptHost {
    fn now_ms(&self) -> f64;
    fn cancelled(&self) -> bool;
    fn keys(&self, names: &[String], down: bool);
    fn pointer(&self, kind: Pointer, at: (i16, i16));
    async fn pause(&self, frames: f64) -> Result<(), Stop>;
    async fn look(&self, names: &[&str]) -> Result<Vec<bool>, Stop>;
}

#[derive(Debug)]
pub enum Stop {
    /// Exit, the game quitting, or the page going away.
    Cancelled,
    /// A step said this is not the place for the script. Not a failure.
    NotHere(String),
    /// A screen the script waited for never came.
    Never(String),
    /// The machine stopped answering.
    NoMachine,
    /// Scripts ran scripts deeper than `RUN_DEPTH` (the data's check refuses that).
    TooDeep,
}

pub fn key_names(keys: &str) -> Vec<String> {
    keys.split('+')
        .filter(|key| !key.is_empty())
        .map(str::to_string)
        .collect()
}

async fn press(host: &impl ScriptHost, chord: &str) -> Result<(), Stop> {
    for chord in chord.split(',') {
        let names = key_names(chord);
        host.keys(&names, true);
        let held = host.pause(11.0).await;
        let mut reversed = names;
        reversed.reverse();
        if held.is_ok() {
            host.keys(&reversed, false);
        }
        held?;
        host.pause(4.0).await?;
    }
    Ok(())
}

/// Wait for one of the screens: its index, or which never came.
async fn until(
    host: &impl ScriptHost,
    names: &[&str],
    timeout: u32,
    wanted: bool,
) -> Result<usize, Stop> {
    let deadline = host.now_ms() + f64::from(timeout) * FRAME_MS;
    loop {
        let hold = host.look(names).await?;
        if let Some(index) = hold.iter().position(|hold| *hold == wanted) {
            return Ok(index);
        }
        if host.now_ms() >= deadline {
            return Err(Stop::Never(names.join("|")));
        }
        host.pause(4.0).await?;
    }
}

pub fn run_steps<'a>(
    game: &'a GameData,
    host: &'a impl ScriptHost,
    steps: Vec<Step>,
    depth: u8,
) -> Pin<Box<dyn Future<Output = Result<(), Stop>> + 'a>> {
    Box::pin(async move {
        for step in steps {
            if host.cancelled() {
                return Err(Stop::Cancelled);
            }
            match step {
                Step::Press(chord) => press(host, &chord).await?,
                Step::Hold(chord) => host.keys(&key_names(&chord), true),
                Step::Release(chord) => host.keys(&key_names(&chord), false),
                Step::Tap([x, y]) => {
                    let at = game.pointer_point(x, y);
                    host.pointer(Pointer::Move, at);
                    host.pointer(Pointer::Down, at);
                    let held = host.pause(8.0).await;
                    if held.is_ok() {
                        host.pointer(Pointer::Up, at);
                    }
                    held?;
                    host.pause(4.0).await?;
                }
                Step::Drag([x1, y1, x2, y2]) => {
                    let from = game.pointer_point(x1, y1);
                    let to = game.pointer_point(x2, y2);
                    host.pointer(Pointer::Move, from);
                    host.pointer(Pointer::Down, from);
                    host.pause(24.0).await?;
                    for part in 1..=8i32 {
                        let at = (
                            from.0 + ((i32::from(to.0) - i32::from(from.0)) * part / 8) as i16,
                            from.1 + ((i32::from(to.1) - i32::from(from.1)) * part / 8) as i16,
                        );
                        host.pointer(Pointer::Move, at);
                        host.pause(4.0).await?;
                    }
                    host.pause(18.0).await?;
                    host.pointer(Pointer::Up, to);
                    host.pause(4.0).await?;
                }
                Step::Wait(frames) => host.pause(f64::from(frames)).await?,
                Step::Until { screen, timeout } => {
                    until(host, &[screen.as_str()], timeout, true).await?;
                }
                Step::UntilNot { screen, timeout } => {
                    until(host, &[screen.as_str()], timeout, false).await?;
                }
                Step::UntilAny { screens, timeout } => {
                    let names: Vec<&str> = screens.iter().map(String::as_str).collect();
                    until(host, &names, timeout, true).await?;
                }
                Step::If { screen, then } => {
                    if host.look(&[screen.as_str()]).await?[0] {
                        run_steps(game, host, then, depth).await?;
                    }
                }
                Step::IfNot { screen, then } => {
                    if !host.look(&[screen.as_str()]).await?[0] {
                        run_steps(game, host, then, depth).await?;
                    }
                }
                Step::Retry {
                    press: chord,
                    until: screen,
                    every,
                    tries,
                } => {
                    let mut reached = host.look(&[screen.as_str()]).await?[0];
                    for _ in 0..tries {
                        if reached {
                            break;
                        }
                        press(host, &chord).await?;
                        reached = match until(host, &[screen.as_str()], every, true).await {
                            Ok(_) => true,
                            Err(Stop::Never(_)) => false,
                            Err(stop) => return Err(stop),
                        };
                    }
                    if !reached {
                        return Err(Stop::Never(screen));
                    }
                }
                Step::Run(name) => {
                    // The data's check refuses a chain this deep, and a script
                    // that runs itself; this is the second fence.
                    if depth >= RUN_DEPTH {
                        return Err(Stop::TooDeep);
                    }
                    let steps = game.scripts.get(&name).cloned().unwrap_or_default();
                    // A script that finds it has nothing to do here ends
                    // itself, not the script that ran it.
                    match run_steps(game, host, steps, depth + 1).await {
                        Ok(()) | Err(Stop::NotHere(_)) => {}
                        Err(stop) => return Err(stop),
                    }
                }
                Step::StopUnless(screen) => {
                    if !host.look(&[screen.as_str()]).await?[0] {
                        return Err(Stop::NotHere(screen));
                    }
                }
                Step::StopIf(screen) => {
                    if host.look(&[screen.as_str()]).await?[0] {
                        return Err(Stop::NotHere(screen));
                    }
                }
            }
        }
        Ok(())
    })
}
