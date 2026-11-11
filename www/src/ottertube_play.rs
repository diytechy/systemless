//! The OtterTube add-on page at play: it recognises the game's screens, runs
//! the scripts that drive the game's own menus and dialogs, swallows touches a
//! child should not make, steps a stick that should step, and takes a game
//! controller's input. All of it is data per game (`ottertube_data`).
//!
//! Keys go through the game screen's one count of who holds each key (the
//! stick, a held button, a tap action, a script, the controller), so nothing
//! here can lift a key another owner still holds, or leave one down.
use crate::ottertube::wait_ms;
use crate::ottertube_data::{hash_text, GameData, Step, FRAME_MS};
use leptos::prelude::*;
use leptos::task::spawn_local;
use std::cell::{Cell, RefCell};
use std::collections::BTreeMap;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use wasm_bindgen::JsValue;

/// How the page asked the running machine for screen hashes.
pub enum ScreenRequest {
    /// The machine runs on this thread: here they are.
    Ready(Vec<u64>),
    /// Asked of the worker; the answer comes to `screen_reply` under the id.
    Posted,
    /// No machine is running.
    Unavailable,
}
pub type ScreenReader = Rc<dyn Fn(&[[u16; 4]], u32) -> ScreenRequest>;
/// Moves the guest's pointer: `mouseMove`, `mouseDown`, `mouseUp` at (v, h).
pub type GuestPointer = Rc<dyn Fn(&str, i16, i16)>;
/// Who is pressing: a tap action (each press counted), the controller
/// (everything it holds now, as one set), or a script (each press counted;
/// while a script runs its keys are the only ones down).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum KeyOwner {
    Tap,
    Pad,
    Script,
}
pub type TapKeys = Rc<dyn Fn(KeyOwner, Vec<String>, bool)>;
/// Told `true` when a script takes the game over, `false` when it lets go.
pub type Takeover = Rc<dyn Fn(bool)>;

/// What the page shows of all this.
#[derive(Clone, Copy)]
pub struct Signals {
    /// The script running now.
    pub busy: RwSignal<Option<String>>,
    /// The screens recognised now.
    pub screens: RwSignal<Vec<String>>,
    /// A standard game controller is connected.
    pub pad: RwSignal<bool>,
    /// The game is still being started: its launch script has not ended.
    pub starting: RwSignal<bool>,
}

#[derive(Default)]
struct Script {
    /// Raised to cancel whatever is running.
    generation: u32,
    running: Option<String>,
    /// Keys the running script holds down, to let go of when it ends.
    keys: Vec<String>,
    /// Where the running script holds the pointer down.
    pointer: Option<(i16, i16)>,
}

#[derive(Default)]
struct Stepper {
    /// The direction each source wants now: the on-screen stick, the controller.
    wanted: BTreeMap<&'static str, Vec<String>>,
    running: bool,
}

thread_local! {
    static GAME: RefCell<Rc<GameData>> = RefCell::new(Rc::new(GameData::default()));
    static READER: RefCell<Option<ScreenReader>> = const { RefCell::new(None) };
    static POINTER: RefCell<Option<GuestPointer>> = const { RefCell::new(None) };
    static KEYS: RefCell<Option<TapKeys>> = const { RefCell::new(None) };
    static TAKEOVER: RefCell<Vec<Takeover>> = const { RefCell::new(Vec::new()) };
    static SIGNALS: Cell<Option<Signals>> = const { Cell::new(None) };
    static NEXT_PROBE: Cell<u32> = const { Cell::new(1) };
    static REPLIES: RefCell<BTreeMap<u32, Vec<u64>>> = const { RefCell::new(BTreeMap::new()) };
    static SCREENS: RefCell<Vec<String>> = const { RefCell::new(Vec::new()) };
    static SCRIPT: RefCell<Script> = RefCell::new(Script::default());
    static STARTING: Cell<bool> = const { Cell::new(false) };
    static STEPPER: RefCell<Stepper> = RefCell::new(Stepper::default());
    /// Raised when the game is mounted again or unmounted: ends the watcher.
    static MOUNT: Cell<u32> = const { Cell::new(0) };
}

pub fn game() -> Rc<GameData> {
    GAME.with(|game| game.borrow().clone())
}

/// The game about to be shown, and where the page shows its state.
pub fn set_game(data: GameData, signals: Signals) {
    // Until the launch script has ended the page says the game is starting,
    // shows none of the game's buttons and takes no script from the child.
    let starting = data.launch.is_some();
    GAME.with(|game| *game.borrow_mut() = Rc::new(data));
    SIGNALS.with(|slot| slot.set(Some(signals)));
    set_starting(starting);
}

fn starting() -> bool {
    STARTING.with(|slot| slot.get())
}

fn set_starting(starting: bool) {
    STARTING.with(|slot| slot.set(starting));
    if let Some(signals) = SIGNALS.with(|slot| slot.get()) {
        let _ = signals.starting.try_set(starting);
    }
}

fn root() -> Option<web_sys::Element> {
    web_sys::window()?
        .document()?
        .query_selector(".app--ottertube")
        .ok()
        .flatten()
}

fn show(name: &str, value: &str) {
    if let Some(root) = root() {
        let _ = root.set_attribute(name, value);
    }
}

fn loopback() -> bool {
    web_sys::window()
        .and_then(|window| window.location().hostname().ok())
        .is_some_and(|host| matches!(host.as_str(), "127.0.0.1" | "localhost" | "[::1]"))
}

// ---------------------------------------------------------------------------
// What the game screen hands over, and takes back when the game goes away
// ---------------------------------------------------------------------------

/// The game screen is up. Its machine may not be running yet: the watcher
/// waits for it, then runs the game's launch script.
pub fn set_screen_reader(reader: Option<ScreenReader>) {
    let mounted = reader.is_some();
    READER.with(|slot| *slot.borrow_mut() = reader);
    let mount = MOUNT.with(|mount| {
        mount.set(mount.get().wrapping_add(1));
        mount.get()
    });
    if mounted {
        spawn_local(watch(mount));
    }
}

pub fn set_guest_pointer(pointer: Option<GuestPointer>) {
    POINTER.with(|slot| *slot.borrow_mut() = pointer);
}

pub fn set_tap_keys(keys: Option<TapKeys>) {
    KEYS.with(|slot| *slot.borrow_mut() = keys);
}

/// The parts of the game screen that carry the child's input (the keys held
/// on the controls, a finger on the picture) ask to be told when a script
/// takes the game over: they let go, and take the child's input up again when
/// the script has ended.
pub fn on_takeover(listener: Takeover) {
    TAKEOVER.with(|listeners| listeners.borrow_mut().push(listener));
}

fn takeover(running: bool) {
    let listeners = TAKEOVER.with(|listeners| listeners.borrow().clone());
    for listener in listeners {
        listener(running);
    }
}

/// The game screen is gone: nothing may run on, and nothing stays held.
pub fn game_unmounted() {
    cancel_script("the game closed");
    TAKEOVER.with(|listeners| listeners.borrow_mut().clear());
    crate::ottertube::set_save_scanner(None);
    set_screen_reader(None);
    set_guest_pointer(None);
    set_tap_keys(None);
    STEPPER.with(|stepper| stepper.borrow_mut().wanted.clear());
}

fn keys(owner: KeyOwner, names: Vec<String>, down: bool) {
    if let Some(keys) = KEYS.with(|slot| slot.borrow().clone()) {
        keys(owner, names, down);
    }
}

fn pointer(kind: &str, at: (i16, i16)) {
    if let Some(pointer) = POINTER.with(|slot| slot.borrow().clone()) {
        pointer(kind, at.0, at.1);
    }
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

/// The worker's answer to a screen question.
pub fn screen_reply(data: &JsValue) {
    let field = |name: &str| {
        js_sys::Reflect::get(data, &JsValue::from_str(name)).unwrap_or(JsValue::UNDEFINED)
    };
    let Some(id) = field("probeId").as_f64() else {
        return;
    };
    let hashes = js_sys::Array::from(&field("hashes"))
        .iter()
        .map(|hash| {
            hash.as_string()
                .and_then(|hash| u64::from_str_radix(&hash, 16).ok())
                .unwrap_or(0)
        })
        .collect();
    REPLIES.with(|replies| {
        let mut replies = replies.borrow_mut();
        // An answer nobody waited for (its asker gave up) must not pile up.
        if replies.len() > 32 {
            replies.clear();
        }
        replies.insert(id as u32, hashes);
    });
}

/// The hashes of these regions of the guest's screen now, or `None` when no
/// machine answers within about a second.
async fn region_hashes(regions: Vec<[u16; 4]>) -> Option<Vec<u64>> {
    if regions.is_empty() {
        return Some(Vec::new());
    }
    let reader = READER.with(|slot| slot.borrow().clone())?;
    let id = NEXT_PROBE.with(|next| next.replace(next.get().wrapping_add(1)));
    match reader(&regions, id) {
        ScreenRequest::Ready(hashes) => Some(hashes),
        ScreenRequest::Unavailable => None,
        ScreenRequest::Posted => {
            for _ in 0..200 {
                if let Some(hashes) = REPLIES.with(|replies| replies.borrow_mut().remove(&id)) {
                    return (hashes.len() == regions.len()).then_some(hashes);
                }
                wait_ms(6.0).await;
            }
            None
        }
    }
}

/// Which of `names` hold now. `None`: the machine did not answer.
async fn screens_hold(names: &[&str]) -> Option<Vec<bool>> {
    let game = game();
    let mut regions = Vec::new();
    let mut owners = Vec::new();
    for (index, name) in names.iter().enumerate() {
        for entry in game.screen_entries(name) {
            regions.push(entry.at);
            owners.push((index, entry.hash.clone()));
        }
    }
    let hashes = region_hashes(regions).await?;
    let mut hold = vec![false; names.len()];
    for ((index, expected), hash) in owners.into_iter().zip(hashes) {
        hold[index] |= hash_text(hash) == expected;
    }
    Some(hold)
}

async fn screen_holds(name: &str) -> Option<bool> {
    Some(screens_hold(&[name]).await?[0])
}

/// While the game is mounted: keep the recognised screens current (for the
/// buttons that show by screen, the blocked controls and the controller), and
/// once the machine first answers, run the game's launch script.
async fn watch(mount: u32) {
    let mounted = || MOUNT.with(|current| current.get()) == mount;
    let game = game();
    let mut names: Vec<&str> = game
        .screens
        .iter()
        .map(|screen| screen.name.as_str())
        .collect();
    names.dedup();
    names.sort_unstable();
    names.dedup();
    let mut launched = false;
    while mounted() {
        let hidden = web_sys::window()
            .and_then(|window| window.document())
            .is_some_and(|document| document.hidden());
        if !hidden {
            if let Some(hold) = screens_hold(&names).await {
                if !mounted() {
                    break;
                }
                let now: Vec<String> = names
                    .iter()
                    .zip(&hold)
                    .filter(|(_, hold)| **hold)
                    .map(|(name, _)| (*name).to_string())
                    .collect();
                let changed = SCREENS.with(|screens| {
                    let mut screens = screens.borrow_mut();
                    let changed = *screens != now;
                    *screens = now.clone();
                    changed
                });
                if changed {
                    show("data-kiosk-screen", &now.join(" "));
                    if let Some(signals) = SIGNALS.with(|slot| slot.get()) {
                        let _ = signals.screens.try_set(now);
                    }
                }
                if !launched {
                    launched = true;
                    show("data-kiosk-machine", "running");
                    if let Some(script) = &game.launch {
                        run_script(script);
                    }
                }
                probe().await;
            }
        }
        wait_ms(200.0).await;
    }
}

/// For whoever writes a game's data, on a loopback host only: the hashes of
/// the regions named in the root element's `data-kiosk-probe` ("x,y,w,h;...")
/// appear in `data-kiosk-probed`.
async fn probe() {
    if !loopback() {
        return;
    }
    let Some(asked) = root().and_then(|root| root.get_attribute("data-kiosk-probe")) else {
        return;
    };
    let regions: Vec<[u16; 4]> = asked
        .split(';')
        .filter_map(|region| {
            let numbers: Vec<u16> = region
                .split(',')
                .filter_map(|n| n.trim().parse().ok())
                .collect();
            (numbers.len() == 4).then(|| [numbers[0], numbers[1], numbers[2], numbers[3]])
        })
        .collect();
    if let Some(hashes) = region_hashes(regions).await {
        let text: Vec<String> = hashes.into_iter().map(hash_text).collect();
        show("data-kiosk-probed", &format!("{asked}={}", text.join(" ")));
    }
}

// ---------------------------------------------------------------------------
// Touches a child should not make
// ---------------------------------------------------------------------------

/// Does a touch at (v, h) on the picture do nothing? While a script runs,
/// everywhere; on the Mac menu bar; and on a blocked control when its screen
/// is showing. (v, h) is where the finger is, before the game's offset.
pub fn swallows_touch(v: i16, h: i16) -> bool {
    if busy() {
        return true;
    }
    let game = game();
    if v < game.menu_bar as i16 {
        return true;
    }
    SCREENS.with(|screens| {
        let screens = screens.borrow();
        game.blocks.iter().any(|block| {
            let [x, y, w, height] = block.at.map(i32::from);
            let inside =
                (x..x + w).contains(&i32::from(h)) && (y..y + height).contains(&i32::from(v));
            inside
                && block
                    .screen
                    .as_ref()
                    .is_none_or(|name| screens.iter().any(|shown| shown == name))
        })
    })
}

/// Where the guest's pointer goes for a finger at (v, h): moved by the game's
/// offset, kept on the screen.
pub fn guest_point(v: i16, h: i16) -> (i16, i16) {
    let [right, down] = game().pointer_offset;
    (
        v.saturating_add(down).max(0),
        h.saturating_add(right).max(0),
    )
}

// ---------------------------------------------------------------------------
// Scripts
// ---------------------------------------------------------------------------

#[derive(Debug)]
enum Stop {
    /// Exit, the game quitting, or the page going away.
    Cancelled,
    /// A step said this is not the place for the script. Not a failure.
    NotHere(String),
    /// A screen the script waited for never came.
    Never(String),
    /// The machine stopped answering.
    NoMachine,
}

pub fn busy() -> bool {
    SCRIPT.with(|script| script.borrow().running.is_some())
}

/// Run one of the game's scripts. One runs at a time: a second is refused.
/// While it runs the page shows that it is busy and the child's input to the
/// game is swallowed.
pub fn run_script(name: &str) -> bool {
    let game = game();
    let Some(steps) = game.scripts.get(name).cloned() else {
        return false;
    };
    let generation = SCRIPT.with(|script| {
        let mut script = script.borrow_mut();
        if script.running.is_some() {
            return None;
        }
        script.running = Some(name.to_string());
        Some(script.generation)
    });
    let Some(generation) = generation else {
        return false;
    };
    // The script has the game to itself: the keys the child holds go up and a
    // finger on the picture is let go of, for the length of the script.
    takeover(true);
    keys(KeyOwner::Pad, Vec::new(), false);
    STEPPER.with(|stepper| stepper.borrow_mut().wanted.clear());
    show("data-kiosk-busy", name);
    if let Some(signals) = SIGNALS.with(|slot| slot.get()) {
        let _ = signals.busy.try_set(Some(name.to_string()));
    }
    let name = name.to_string();
    spawn_local(async move {
        let result = run_steps(steps, generation, 0).await;
        let outcome = match &result {
            Ok(()) => "done".to_string(),
            Err(Stop::Cancelled) => "cancelled".to_string(),
            Err(Stop::NotHere(screen)) => format!("skipped:{screen}"),
            Err(Stop::Never(screen)) => format!("stopped:{screen}"),
            Err(Stop::NoMachine) => "stopped:no-machine".to_string(),
        };
        // A cancelled script was already cleaned up by whoever cancelled it,
        // and another may be running by now.
        if !matches!(result, Err(Stop::Cancelled)) {
            finish(&format!("{name}:{outcome}"));
        }
    });
    true
}

/// Let go of everything the script holds and show that nothing runs.
fn finish(outcome: &str) {
    let (held, pointer_at) = SCRIPT.with(|script| {
        let mut script = script.borrow_mut();
        script.running = None;
        (std::mem::take(&mut script.keys), script.pointer.take())
    });
    if !held.is_empty() {
        keys(KeyOwner::Script, held, false);
    }
    if let Some(at) = pointer_at {
        pointer("mouseUp", at);
    }
    takeover(false);
    if let Some(root) = root() {
        let _ = root.remove_attribute("data-kiosk-busy");
        let _ = root.set_attribute("data-kiosk-script", outcome);
    }
    if let Some(signals) = SIGNALS.with(|slot| slot.get()) {
        let _ = signals.busy.try_set(None);
    }
    // The launch script is over, however it ended: the game is the child's.
    if starting() && game().launch.as_deref() == outcome.split(':').next() {
        set_starting(false);
    }
}

/// Stop the running script, if any: Exit, the game quitting, the page going.
/// Its keys and its pointer are let go at once; its next step never runs.
pub fn cancel_script(why: &str) {
    let running = SCRIPT.with(|script| {
        let mut script = script.borrow_mut();
        script.generation = script.generation.wrapping_add(1);
        script.running.clone()
    });
    if let Some(name) = running {
        finish(&format!("{name}:cancelled:{why}"));
    }
}

fn cancelled(generation: u32) -> bool {
    SCRIPT.with(|script| script.borrow().generation != generation)
}

async fn pause(generation: u32, frames: f64) -> Result<(), Stop> {
    let mut left = frames * FRAME_MS;
    while left > 0.0 {
        if cancelled(generation) {
            return Err(Stop::Cancelled);
        }
        let slice = left.min(50.0);
        wait_ms(slice).await;
        left -= slice;
    }
    if cancelled(generation) {
        Err(Stop::Cancelled)
    } else {
        Ok(())
    }
}

fn key_names(keys: &str) -> Vec<String> {
    keys.split('+')
        .filter(|key| !key.is_empty())
        .map(str::to_string)
        .collect()
}

fn script_keys(names: &[String], down: bool) {
    SCRIPT.with(|script| {
        let mut script = script.borrow_mut();
        for name in names {
            if down {
                script.keys.push(name.clone());
            } else if let Some(index) = script.keys.iter().position(|held| held == name) {
                script.keys.remove(index);
            }
        }
    });
    keys(KeyOwner::Script, names.to_vec(), down);
}

async fn press(generation: u32, chord: &str) -> Result<(), Stop> {
    let names = key_names(chord);
    script_keys(&names, true);
    let held = pause(generation, 11.0).await;
    let mut reversed = names;
    reversed.reverse();
    if held.is_ok() {
        script_keys(&reversed, false);
    }
    held?;
    pause(generation, 4.0).await
}

/// Where a script's point lands: the same offset a finger gets.
fn script_point(x: u16, y: u16) -> (i16, i16) {
    guest_point(y as i16, x as i16)
}

fn script_pointer(kind: &str, at: (i16, i16)) {
    SCRIPT.with(|script| {
        let mut script = script.borrow_mut();
        match kind {
            "mouseDown" => script.pointer = Some(at),
            "mouseUp" => script.pointer = None,
            // A move matters only while the button is down.
            _ => {
                if script.pointer.is_some() {
                    script.pointer = Some(at);
                }
            }
        }
    });
    pointer(kind, at);
}

/// Wait for one of the screens: its index, or which never came.
async fn until(generation: u32, names: &[&str], timeout: u32, wanted: bool) -> Result<usize, Stop> {
    let deadline = js_sys::Date::now() + f64::from(timeout) * FRAME_MS;
    loop {
        if cancelled(generation) {
            return Err(Stop::Cancelled);
        }
        let hold = screens_hold(names).await.ok_or(Stop::NoMachine)?;
        if let Some(index) = hold.iter().position(|hold| *hold == wanted) {
            return Ok(index);
        }
        if js_sys::Date::now() >= deadline {
            return Err(Stop::Never(names.join("|")));
        }
        pause(generation, 4.0).await?;
    }
}

fn run_steps(
    steps: Vec<Step>,
    generation: u32,
    depth: u8,
) -> Pin<Box<dyn Future<Output = Result<(), Stop>>>> {
    Box::pin(async move {
        for step in steps {
            if cancelled(generation) {
                return Err(Stop::Cancelled);
            }
            match step {
                Step::Press(chord) => press(generation, &chord).await?,
                Step::Hold(chord) => script_keys(&key_names(&chord), true),
                Step::Release(chord) => script_keys(&key_names(&chord), false),
                Step::Tap([x, y]) => {
                    let at = script_point(x, y);
                    script_pointer("mouseMove", at);
                    script_pointer("mouseDown", at);
                    let held = pause(generation, 8.0).await;
                    if held.is_ok() {
                        script_pointer("mouseUp", at);
                    }
                    held?;
                    pause(generation, 4.0).await?;
                }
                Step::Drag([x1, y1, x2, y2]) => {
                    let from = script_point(x1, y1);
                    let to = script_point(x2, y2);
                    script_pointer("mouseMove", from);
                    script_pointer("mouseDown", from);
                    pause(generation, 24.0).await?;
                    for part in 1..=8i32 {
                        let at = (
                            from.0 + ((i32::from(to.0) - i32::from(from.0)) * part / 8) as i16,
                            from.1 + ((i32::from(to.1) - i32::from(from.1)) * part / 8) as i16,
                        );
                        script_pointer("mouseMove", at);
                        pause(generation, 4.0).await?;
                    }
                    pause(generation, 18.0).await?;
                    script_pointer("mouseUp", to);
                    pause(generation, 4.0).await?;
                }
                Step::Wait(frames) => pause(generation, f64::from(frames)).await?,
                Step::Until { screen, timeout } => {
                    until(generation, &[screen.as_str()], timeout, true).await?;
                }
                Step::UntilNot { screen, timeout } => {
                    until(generation, &[screen.as_str()], timeout, false).await?;
                }
                Step::UntilAny { screens, timeout } => {
                    let names: Vec<&str> = screens.iter().map(String::as_str).collect();
                    until(generation, &names, timeout, true).await?;
                }
                Step::If { screen, then } => {
                    if screen_holds(&screen).await.ok_or(Stop::NoMachine)? {
                        run_steps(then, generation, depth).await?;
                    }
                }
                Step::IfNot { screen, then } => {
                    if !screen_holds(&screen).await.ok_or(Stop::NoMachine)? {
                        run_steps(then, generation, depth).await?;
                    }
                }
                Step::Retry {
                    press: chord,
                    until: screen,
                    every,
                    tries,
                } => {
                    let mut reached = screen_holds(&screen).await.ok_or(Stop::NoMachine)?;
                    for _ in 0..tries {
                        if reached {
                            break;
                        }
                        press(generation, &chord).await?;
                        reached = until(generation, &[screen.as_str()], every, true)
                            .await
                            .is_ok();
                        if cancelled(generation) {
                            return Err(Stop::Cancelled);
                        }
                    }
                    if !reached {
                        return Err(Stop::Never(screen));
                    }
                }
                Step::Run(name) => {
                    // The data's check refuses a script that runs itself; the depth is a second fence.
                    let steps = game().scripts.get(&name).cloned().unwrap_or_default();
                    if depth < 8 {
                        // A script that finds it has nothing to do here ends
                        // itself, not the script that ran it.
                        match run_steps(steps, generation, depth + 1).await {
                            Ok(()) | Err(Stop::NotHere(_)) => {}
                            Err(stop) => return Err(stop),
                        }
                    }
                }
                Step::StopUnless(screen) => {
                    if !screen_holds(&screen).await.ok_or(Stop::NoMachine)? {
                        return Err(Stop::NotHere(screen));
                    }
                }
                Step::StopIf(screen) => {
                    if screen_holds(&screen).await.ok_or(Stop::NoMachine)? {
                        return Err(Stop::NotHere(screen));
                    }
                }
            }
        }
        Ok(())
    })
}

// ---------------------------------------------------------------------------
// A stick that steps
// ---------------------------------------------------------------------------

/// Is this game played a cell at a time?
pub fn stick_is_stepped() -> bool {
    game().stick_step.is_some()
}

/// The direction `source` (the on-screen stick, the controller) wants now.
/// Returns false for a game whose stick simply holds its keys; true when the
/// page pulses them instead: one move per push, again only after a hold.
pub fn stick_steps(source: &'static str, wanted: &[&str]) -> bool {
    let Some(step) = game().stick_step else {
        return false;
    };
    let start = STEPPER.with(|stepper| {
        let mut stepper = stepper.borrow_mut();
        let wanted: Vec<String> = wanted.iter().map(|key| (*key).to_string()).collect();
        if wanted.is_empty() {
            stepper.wanted.remove(source);
        } else {
            stepper.wanted.insert(source, wanted);
        }
        !stepper.running && !stepper.wanted.is_empty() && {
            stepper.running = true;
            true
        }
    });
    if start {
        spawn_local(async move {
            let wanted =
                || STEPPER.with(|stepper| stepper.borrow().wanted.values().next().cloned());
            let mut last: Option<Vec<String>> = None;
            while let Some(direction) = wanted() {
                if busy() {
                    break;
                }
                keys(KeyOwner::Tap, direction.clone(), true);
                wait_ms(f64::from(step.pulse_ms)).await;
                keys(KeyOwner::Tap, direction.clone(), false);
                // The first repeat waits longer than the ones after it.
                let repeat = if last.as_ref() == Some(&direction) {
                    step.repeat_ms
                } else {
                    step.delay_ms
                };
                last = Some(direction.clone());
                let until = js_sys::Date::now() + f64::from(repeat);
                while js_sys::Date::now() < until {
                    wait_ms(15.0).await;
                    if wanted().as_ref() != Some(&direction) {
                        // Let go, or pushed another way: that is a new push.
                        last = None;
                        break;
                    }
                }
            }
            STEPPER.with(|stepper| {
                let mut stepper = stepper.borrow_mut();
                stepper.running = false;
                if busy() {
                    stepper.wanted.clear();
                }
            });
        });
    }
    true
}

// ---------------------------------------------------------------------------
// What the page's script and the controller adapter send in
// ---------------------------------------------------------------------------

/// `tap`: a tap action presses or releases keys. `script`: run one. `pad`:
/// everything the controller holds now. `direction`: the direction it pushes,
/// for a game that steps. `pad-connected`: a controller came or went.
pub fn input(kind: &str, names: Vec<String>, down: bool) {
    match kind {
        "pad-connected" => {
            show("data-kiosk-pad", if down { "on" } else { "off" });
            if let Some(signals) = SIGNALS.with(|slot| slot.get()) {
                let _ = signals.pad.try_set(down);
            }
            if !down {
                keys(KeyOwner::Pad, Vec::new(), false);
                stick_steps("pad", &[]);
            }
        }
        // A release always counts: a tap action that began before a script
        // must not leave its key down after it.
        "tap" if !down => keys(KeyOwner::Tap, names, false),
        // While a script runs the child's input to the game is swallowed.
        _ if busy() => {}
        "tap" => keys(KeyOwner::Tap, names, true),
        "pad" => keys(KeyOwner::Pad, names, down),
        "direction" => {
            let names: Vec<&str> = names.iter().map(String::as_str).collect();
            stick_steps("pad", &names);
        }
        "script" => {
            // Not before the launch script has had its turn.
            if let (false, Some(name)) = (starting(), names.first()) {
                run_script(name);
            }
        }
        _ => {}
    }
}
