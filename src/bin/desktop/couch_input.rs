use std::cell::{Cell, RefCell};
use std::collections::BTreeSet;
use std::future::{poll_fn, Future};
use std::pin::Pin;
use std::rc::Rc;
use std::task::{Context, Poll, Waker};
use std::time::{Duration, Instant};

use super::runtime_protocol::GuiCommand;
use super::{FixtureRunner, GuiDriver, HostMouseReleaseLatch};
use systemless::{
    controller_data::{GameData, KeyOwner, Tuning, FRAME_MS},
    controller_router::{KeyOwners, PadRouter, PadState},
    controller_script::{run_steps, Pointer, ScriptHost, Stop},
};
use winit::keyboard::{KeyCode, PhysicalKey};

#[derive(Clone, Copy)]
struct MacKey(u8, u8);

impl PartialEq for MacKey {
    fn eq(&self, other: &Self) -> bool {
        self.0 == other.0
    }
}
impl Eq for MacKey {}

enum ScriptInput {
    Key(MacKey, bool),
    Pointer(Pointer, (i16, i16)),
}

#[derive(Default)]
struct ScriptIo {
    now: Cell<f64>,
    inputs: RefCell<Vec<ScriptInput>>,
    screens: RefCell<BTreeSet<String>>,
}

impl ScriptHost for ScriptIo {
    fn now_ms(&self) -> f64 {
        self.now.get()
    }

    fn cancelled(&self) -> bool {
        false // Cancellation drops the future and releases its inputs.
    }

    fn keys(&self, names: &[String], down: bool) {
        self.inputs.borrow_mut().extend(
            names
                .iter()
                .filter_map(|name| mac_key(name).map(|key| ScriptInput::Key(key, down))),
        );
    }

    fn pointer(&self, kind: Pointer, at: (i16, i16)) {
        self.inputs
            .borrow_mut()
            .push(ScriptInput::Pointer(kind, at));
    }

    async fn pause(&self, frames: f64) -> Result<(), Stop> {
        let deadline = self.now_ms() + frames * FRAME_MS;
        poll_fn(|_| {
            if self.now_ms() >= deadline {
                Poll::Ready(Ok(()))
            } else {
                Poll::Pending
            }
        })
        .await
    }

    async fn look(&self, names: &[&str]) -> Result<Vec<bool>, Stop> {
        Ok(names
            .iter()
            .map(|name| self.screens.borrow().contains(*name))
            .collect())
    }
}

type ScriptFuture = Pin<Box<dyn Future<Output = Result<(), Stop>>>>;

pub(super) struct CouchInput {
    data: Rc<GameData>,
    tuning: Tuning,
    epoch: Instant,
    keys: KeyOwners<MacKey>,
    host_held: [Option<MacKey>; 256],
    script: Option<ScriptFuture>,
    script_io: Rc<ScriptIo>,
    pad: PadRouter,
    #[cfg(target_os = "windows")]
    controller: Option<u32>,
    pointer_owner: Option<KeyOwner>,
    last_pointer: (i16, i16),
    cursor_fraction: [f32; 2],
    next_screen_sample: f64,
    launch_pending: bool,
}

impl CouchInput {
    pub fn new(data: GameData, tuning: Tuning) -> Self {
        Self {
            launch_pending: data.launch.is_some(),
            data: Rc::new(data),
            tuning,
            epoch: Instant::now(),
            keys: KeyOwners::default(),
            host_held: [None; 256],
            script: None,
            script_io: Rc::default(),
            pad: PadRouter::default(),
            #[cfg(target_os = "windows")]
            controller: None,
            pointer_owner: None,
            last_pointer: (0, 0),
            cursor_fraction: [0.0; 2],
            next_screen_sample: 0.0,
        }
    }

    fn start(&mut self, steps: Vec<systemless::controller_data::Step>) {
        let data = self.data.clone();
        let io = self.script_io.clone();
        self.next_screen_sample = 0.0;
        self.script = Some(Box::pin(async move {
            run_steps(&data, io.as_ref(), steps, 0).await
        }));
    }

    pub fn begin_quit(
        &mut self,
        runner: &mut FixtureRunner,
        latch: &mut HostMouseReleaseLatch,
    ) -> Duration {
        self.launch_pending = false;
        self.blur(runner, latch);
        let (steps, timeout) = self.data.quit_first.as_ref().map_or_else(
            || {
                (
                    vec![systemless::controller_data::Step::Press("Meta+q".into())],
                    360,
                )
            },
            |rule| (self.data.scripts[&rule.script].clone(), rule.timeout),
        );
        self.start(steps);
        Duration::from_secs_f64(f64::from(timeout) / 60.0)
    }

    pub fn blur(&mut self, runner: &mut FixtureRunner, latch: &mut HostMouseReleaseLatch) {
        self.host_held = [None; 256];
        self.keys.set(KeyOwner::Host, Vec::new());
        self.release(runner, latch);
    }

    fn release(&mut self, runner: &mut FixtureRunner, latch: &mut HostMouseReleaseLatch) {
        self.script = None;
        self.script_io.inputs.borrow_mut().clear();
        self.pad = PadRouter::default();
        #[cfg(target_os = "windows")]
        {
            self.controller = None;
        }
        self.keys.set(KeyOwner::Pad, Vec::new());
        self.keys.set(KeyOwner::Script, Vec::new());
        self.flush_keys(runner, false);
        self.release_pointer(runner, latch);
        self.cursor_fraction = [0.0; 2];
    }

    pub fn host_key(&mut self, runner: &mut FixtureRunner, key: u8, character: u8, down: bool) {
        // Winit can emit repeated downs. A physical key contributes at most one
        // hold; the Macintosh event manager supplies its own key repeat.
        let existing = self.host_held[usize::from(key)];
        if let Some(previous) = existing {
            if down {
                return;
            }
            self.keys.change(KeyOwner::Host, previous, false);
            self.host_held[usize::from(key)] = None;
        } else if down {
            let pair = MacKey(key, character);
            self.keys.change(KeyOwner::Host, pair, true);
            self.host_held[usize::from(key)] = Some(pair);
        }
        self.flush_keys(runner, self.script.is_some());
    }

    fn flush_keys(&mut self, runner: &mut FixtureRunner, script_exclusive: bool) {
        for (MacKey(key, character), down) in self.keys.transitions(script_exclusive) {
            if down {
                runner.push_key_down(key, character);
            } else {
                runner.push_key_up(key, character);
            }
        }
    }

    fn pointer(
        &mut self,
        runner: &mut FixtureRunner,
        latch: &mut HostMouseReleaseLatch,
        owner: KeyOwner,
        kind: Pointer,
        (v, h): (i16, i16),
    ) {
        self.last_pointer = (v, h);
        let command = match kind {
            Pointer::Move => GuiCommand::MouseMove { v, h },
            Pointer::Down => {
                self.pointer_owner = Some(owner);
                GuiCommand::MouseDown { v, h }
            }
            Pointer::Up => {
                self.pointer_owner = None;
                GuiCommand::MouseUp { v, h }
            }
        };
        GuiDriver::apply_guest_command(runner, latch, command);
    }

    fn release_pointer(&mut self, runner: &mut FixtureRunner, latch: &mut HostMouseReleaseLatch) {
        if let Some(owner) = self.pointer_owner {
            self.pointer(runner, latch, owner, Pointer::Up, self.last_pointer);
        }
    }

    pub fn frame(
        &mut self,
        runner: &mut FixtureRunner,
        latch: &mut HostMouseReleaseLatch,
        focused: bool,
        quitting: bool,
        now: Instant,
    ) {
        let now_ms = now.saturating_duration_since(self.epoch).as_secs_f64() * 1000.0;
        self.script_io.now.set(now_ms);
        // Scripts advance during a graceful quit even when the launcher has focus.
        if self.launch_pending && focused && !quitting {
            self.launch_pending = false;
            let script = self.data.launch.as_ref().unwrap();
            self.start(self.data.scripts[script].clone());
        }

        let sample = if focused && !quitting {
            self.read_pad()
        } else {
            None
        };
        if (sample.is_some() || self.script.is_some()) && now_ms >= self.next_screen_sample {
            self.script_io
                .screens
                .replace(self.data.matching_screens(runner));
            self.next_screen_sample = now_ms + 1000.0 / 30.0;
        }
        let data = self.data.clone();
        let output = self.pad.poll(&data, self.tuning, sample, now_ms, |screen| {
            self.script_io.screens.borrow().contains(screen)
        });
        if self.script.is_none() {
            if let Some(script) = output.script {
                self.release_pointer(runner, latch);
                self.start(data.scripts[script].clone());
            }
        }
        self.keys.set(
            KeyOwner::Pad,
            output.keys.into_iter().filter_map(mac_key).collect(),
        );
        self.flush_keys(runner, self.script.is_some());
        if let Some(script) = self.script.as_mut() {
            let result = script
                .as_mut()
                .poll(&mut Context::from_waker(Waker::noop()));
            let inputs = self.script_io.inputs.take();
            for input in inputs {
                match input {
                    ScriptInput::Key(key, down) => {
                        self.keys.change(KeyOwner::Script, key, down);
                        self.flush_keys(runner, true);
                    }
                    ScriptInput::Pointer(kind, at) => {
                        self.pointer(runner, latch, KeyOwner::Script, kind, at)
                    }
                }
            }
            if let Poll::Ready(result) = result {
                if let Err(error) = result {
                    eprintln!("[SYSTEMLESS] Controller script ended: {error:?}");
                }
                self.script = None;
                self.keys.set(KeyOwner::Script, Vec::new());
                self.flush_keys(runner, false);
                self.release_pointer(runner, latch);
            }
        } else {
            self.move_pad_pointer(runner, latch, output.cursor_delta, output.mouse_down);
        }
    }

    fn move_pad_pointer(
        &mut self,
        runner: &mut FixtureRunner,
        latch: &mut HostMouseReleaseLatch,
        [dx, dy]: [f32; 2],
        mouse_down: bool,
    ) {
        let (v, h) = runner.dispatcher().mouse_position();
        self.cursor_fraction[0] += dx;
        self.cursor_fraction[1] += dy;
        let [horizontal, vertical] = self.cursor_fraction.map(|value| value.trunc() as i16);
        self.cursor_fraction[0] -= f32::from(horizontal);
        self.cursor_fraction[1] -= f32::from(vertical);
        let (_, _, width, height, _) = runner.dispatcher().screen_mode;
        let at = (
            v.saturating_add(vertical)
                .clamp(0, height.saturating_sub(1) as i16),
            h.saturating_add(horizontal)
                .clamp(0, width.saturating_sub(1) as i16),
        );
        if at != (v, h) && (horizontal != 0 || vertical != 0) {
            self.pointer(runner, latch, KeyOwner::Pad, Pointer::Move, at);
        }
        match (mouse_down, self.pointer_owner == Some(KeyOwner::Pad)) {
            (true, false) => self.pointer(runner, latch, KeyOwner::Pad, Pointer::Down, at),
            (false, true) => self.pointer(runner, latch, KeyOwner::Pad, Pointer::Up, at),
            _ => {}
        }
    }

    #[cfg(target_os = "windows")]
    fn read_pad(&mut self) -> Option<PadState> {
        if let Some(slot) = self.controller {
            let sample = read_xinput(slot);
            if sample.is_none() {
                self.controller = None;
            }
            return sample;
        }
        for slot in 0..4 {
            if let Some(sample) = read_xinput(slot) {
                self.controller = Some(slot);
                return Some(sample);
            }
        }
        None
    }

    #[cfg(not(target_os = "windows"))]
    fn read_pad(&mut self) -> Option<PadState> {
        None
    }
}

#[cfg(target_os = "windows")]
fn read_xinput(slot: u32) -> Option<PadState> {
    use windows::Win32::UI::Input::XboxController::*;
    let mut state = XINPUT_STATE::default();
    if unsafe { XInputGetState(slot, &mut state) } != 0 {
        return None;
    }
    let gamepad = state.Gamepad;
    let flags = gamepad.wButtons.0;
    let mut buttons = [false; 17];
    for (index, flag) in [
        (0, XINPUT_GAMEPAD_A),
        (1, XINPUT_GAMEPAD_B),
        (2, XINPUT_GAMEPAD_X),
        (3, XINPUT_GAMEPAD_Y),
        (5, XINPUT_GAMEPAD_RIGHT_SHOULDER),
        (9, XINPUT_GAMEPAD_START),
        (10, XINPUT_GAMEPAD_LEFT_THUMB),
        (11, XINPUT_GAMEPAD_RIGHT_THUMB),
        (12, XINPUT_GAMEPAD_DPAD_UP),
        (13, XINPUT_GAMEPAD_DPAD_DOWN),
        (14, XINPUT_GAMEPAD_DPAD_LEFT),
        (15, XINPUT_GAMEPAD_DPAD_RIGHT),
    ] {
        buttons[index] = flags & flag.0 != 0;
    }
    buttons[7] = gamepad.bRightTrigger > XINPUT_GAMEPAD_TRIGGER_THRESHOLD.0 as u8;
    let axis = |value: i16| (f32::from(value) / f32::from(i16::MAX)).max(-1.0);
    Some(PadState {
        buttons,
        left: [axis(gamepad.sThumbLX), -axis(gamepad.sThumbLY)],
        right: [axis(gamepad.sThumbRX), -axis(gamepad.sThumbRY)],
    })
}

fn mac_key(name: &str) -> Option<MacKey> {
    let code = match name {
        "Meta" => KeyCode::SuperLeft,
        "Shift" => KeyCode::ShiftLeft,
        "Alt" => KeyCode::AltLeft,
        "Control" => KeyCode::ControlLeft,
        "Escape" => KeyCode::Escape,
        "Enter" => KeyCode::Enter,
        "Space" => KeyCode::Space,
        "Tab" => KeyCode::Tab,
        "ArrowUp" => KeyCode::ArrowUp,
        "ArrowDown" => KeyCode::ArrowDown,
        "ArrowLeft" => KeyCode::ArrowLeft,
        "ArrowRight" => KeyCode::ArrowRight,
        "Numpad2" => KeyCode::Numpad2,
        "Numpad4" => KeyCode::Numpad4,
        "Numpad6" => KeyCode::Numpad6,
        "Numpad8" => KeyCode::Numpad8,
        "[" => KeyCode::BracketLeft,
        "]" => KeyCode::BracketRight,
        _ => {
            const LETTERS: [KeyCode; 26] = [
                KeyCode::KeyA,
                KeyCode::KeyB,
                KeyCode::KeyC,
                KeyCode::KeyD,
                KeyCode::KeyE,
                KeyCode::KeyF,
                KeyCode::KeyG,
                KeyCode::KeyH,
                KeyCode::KeyI,
                KeyCode::KeyJ,
                KeyCode::KeyK,
                KeyCode::KeyL,
                KeyCode::KeyM,
                KeyCode::KeyN,
                KeyCode::KeyO,
                KeyCode::KeyP,
                KeyCode::KeyQ,
                KeyCode::KeyR,
                KeyCode::KeyS,
                KeyCode::KeyT,
                KeyCode::KeyU,
                KeyCode::KeyV,
                KeyCode::KeyW,
                KeyCode::KeyX,
                KeyCode::KeyY,
                KeyCode::KeyZ,
            ];
            const DIGITS: [KeyCode; 10] = [
                KeyCode::Digit0,
                KeyCode::Digit1,
                KeyCode::Digit2,
                KeyCode::Digit3,
                KeyCode::Digit4,
                KeyCode::Digit5,
                KeyCode::Digit6,
                KeyCode::Digit7,
                KeyCode::Digit8,
                KeyCode::Digit9,
            ];
            match name.as_bytes() {
                [letter @ b'a'..=b'z'] => LETTERS[usize::from(*letter - b'a')],
                [digit @ b'0'..=b'9'] => DIGITS[usize::from(*digit - b'0')],
                _ => return None,
            }
        }
    };
    let physical = PhysicalKey::Code(code);
    let key = super::keycode_to_mac(&physical);
    let character = match super::keycode_to_mac_char(&physical) {
        0 => super::keycode_to_mac_printable_char(&physical),
        special => special,
    };
    Some(MacKey(key, character))
}
