//! The OtterTube add-on page at play: it recognises the game's screens, runs
//! the scripts that drive the game's own menus and dialogs, swallows touches a
//! child should not make, steps a stick that should step, and takes a game
//! controller's input. All of it is data per game (`ottertube_data`).
//!
//! Keys go through the game screen's one count of who holds each key (the
//! stick, a held button, a tap action, a script, the controller), so nothing
//! here can lift a key another owner still holds, or leave one down.
//!
//! Once the page is leaving (`close`) nothing reaches the guest any more: no
//! script, no launch, no touch, no controller, no keyboard.
use crate::ottertube::wait_ms;
use crate::ottertube_data::{
    hash_text, is_chord_key, Block, GameData, Step, FRAME_MS, MAC_COMMAND_KEY, RUN_DEPTH,
};
use crate::ottertube_touch::{Act, Deferred, Kind, Looked};
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
/// Told `true` when the child's input is taken away (a script has the game,
/// or the page is leaving), `false` when a script gives it back.
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

/// What a touch on the picture comes to.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Touch {
    /// It goes to the game.
    Pass,
    /// It does nothing.
    Swallow,
    /// Its spot is blocked on a screen that was not showing at the last look.
    /// The look may be a fifth of a second old: `judge_held_touch` looks again.
    Hold,
}

#[derive(Default)]
struct Script {
    /// One number per script run. A script whose number is no longer this one
    /// was cancelled: it acts on nothing it learns from then on.
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

/// A blocked control stays blocked this long after its screen was last seen.
const BLOCK_GRACE_MS: f64 = 1000.0;
/// How long a touch that was held back is pressed for, once it is let through
/// after its finger has lifted.
const HELD_TAP_MS: f64 = 130.0;
/// A game made to quit before the page leaves (`quit_first`): once its script
/// has ended without the guest stopping, how long the page still waits.
const QUIT_GRACE_MS: f64 = 3000.0;

thread_local! {
    static GAME: RefCell<Rc<GameData>> = RefCell::new(Rc::new(GameData::default()));
    static READER: RefCell<Option<ScreenReader>> = const { RefCell::new(None) };
    static POINTER: RefCell<Option<GuestPointer>> = const { RefCell::new(None) };
    static KEYS: RefCell<Option<TapKeys>> = const { RefCell::new(None) };
    static TAKEOVER: RefCell<Vec<Takeover>> = const { RefCell::new(Vec::new()) };
    static SIGNALS: Cell<Option<Signals>> = const { Cell::new(None) };
    static NEXT_PROBE: Cell<u32> = const { Cell::new(1) };
    static REPLIES: RefCell<BTreeMap<u32, Vec<u64>>> = const { RefCell::new(BTreeMap::new()) };
    /// The screens that held at the last look at each, and when each last did.
    static SCREENS: RefCell<Vec<String>> = const { RefCell::new(Vec::new()) };
    static SEEN: RefCell<BTreeMap<String, f64>> = const { RefCell::new(BTreeMap::new()) };
    static SCRIPT: RefCell<Script> = RefCell::new(Script::default());
    static STARTING: Cell<bool> = const { Cell::new(false) };
    static STEPPER: RefCell<Stepper> = RefCell::new(Stepper::default());
    /// Touches held back for a fresh look at the screen.
    static DEFERRED: RefCell<Deferred> = RefCell::new(Deferred::default());
    /// How many times the game was made to quit before leaving (once at most).
    static QUIT_RUNS: Cell<u32> = const { Cell::new(0) };
    /// The page's own controls hold the guest's Command key; and what a real
    /// keyboard does when they begin to.
    static COMMAND_ON_SCREEN: Cell<bool> = const { Cell::new(false) };
    static COMMAND_DOWN: RefCell<Option<Rc<dyn Fn()>>> = const { RefCell::new(None) };
    /// The page is leaving. Set once, never cleared.
    static CLOSING: Cell<bool> = const { Cell::new(false) };
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

/// A browser check's request in the page address, honoured on a loopback host
/// only: `systemless-test-screens=slow` makes every look at the screen start
/// 600 ms late, so a check can act while one is under way and while the
/// recognised screens are out of date. Nothing in OtterTube sets it.
fn test_slow_screens() -> bool {
    thread_local! {
        static SLOW: Cell<Option<bool>> = const { Cell::new(None) };
    }
    SLOW.with(|slot| {
        if let Some(slow) = slot.get() {
            return slow;
        }
        let slow = loopback()
            && web_sys::window()
                .and_then(|window| window.location().search().ok())
                .is_some_and(|search| {
                    search
                        .trim_start_matches('?')
                        .split('&')
                        .any(|pair| pair == "systemless-test-screens=slow")
                });
        slot.set(Some(slow));
        slow
    })
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
/// on the controls, a finger on the picture, a real keyboard) ask to be told
/// when that input is taken away: they let go. A script gives it back when it
/// ends; a page that is leaving never does.
pub fn on_takeover(listener: Takeover) {
    TAKEOVER.with(|listeners| listeners.borrow_mut().push(listener));
}

fn takeover(running: bool) {
    let listeners = TAKEOVER.with(|listeners| listeners.borrow().clone());
    for listener in listeners {
        listener(running);
    }
}

/// The page is leaving (Exit, or the game quit). Latched before the running
/// script is cancelled, so that nothing can start in its place: from here to
/// teardown no script runs, the launch script does not start, and no touch,
/// controller or keyboard input reaches the guest. What the page saves is
/// then what the guest has, and stays so.
pub fn close(why: &str) {
    if CLOSING.with(|closing| closing.replace(true)) {
        return;
    }
    show("data-kiosk-closing", why);
    cancel_script(why);
    drop_deferred();
    // Whatever the child holds goes up, for good.
    takeover(true);
    keys(KeyOwner::Pad, Vec::new(), false);
    STEPPER.with(|stepper| stepper.borrow_mut().wanted.clear());
}

pub fn closing() -> bool {
    CLOSING.with(|closing| closing.get())
}

/// Nothing from the child reaches the guest now: a script has the game, or the
/// page is leaving.
pub fn guest_input_shut() -> bool {
    busy() || closing()
}

/// The game screen is gone: nothing may run on, and nothing stays held.
pub fn game_unmounted() {
    cancel_script("the game closed");
    drop_deferred();
    TAKEOVER.with(|listeners| listeners.borrow_mut().clear());
    COMMAND_DOWN.with(|slot| *slot.borrow_mut() = None);
    COMMAND_ON_SCREEN.with(|slot| slot.set(false));
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
    if test_slow_screens() {
        wait_ms(600.0).await;
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

/// Every screen the game's data names, once each.
fn screen_names(game: &GameData) -> Vec<&str> {
    let mut names: Vec<&str> = game
        .screens
        .iter()
        .map(|screen| screen.name.as_str())
        .collect();
    names.sort_unstable();
    names.dedup();
    names
}

/// Which of `names` hold now. `None`: the machine did not answer. Whoever
/// looks (the watcher, a script, a touch held back), what was seen goes into
/// the one list of recognised screens.
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
    note_screens(names, &hold);
    Some(hold)
}

/// A look found these screens holding or not: keep the recognised list and
/// when each screen was last seen, and show the list when it changes.
fn note_screens(names: &[&str], hold: &[bool]) {
    let now = js_sys::Date::now();
    SEEN.with(|seen| {
        let mut seen = seen.borrow_mut();
        for (name, _) in names.iter().zip(hold).filter(|(_, hold)| **hold) {
            seen.insert((*name).to_string(), now);
        }
    });
    let changed = SCREENS.with(|screens| {
        let mut screens = screens.borrow_mut();
        let before = screens.clone();
        for (name, hold) in names.iter().zip(hold) {
            match (hold, screens.iter().position(|shown| shown == name)) {
                (true, None) => screens.push((*name).to_string()),
                (false, Some(index)) => {
                    screens.remove(index);
                }
                _ => {}
            }
        }
        screens.sort_unstable();
        (*screens != before).then(|| screens.clone())
    });
    if let Some(list) = changed {
        show("data-kiosk-screen", &list.join(" "));
        if let Some(signals) = SIGNALS.with(|slot| slot.get()) {
            let _ = signals.screens.try_set(list);
        }
    }
}

/// While the game is mounted: keep the recognised screens current (for the
/// buttons that show by screen, the blocked controls and the controller), and
/// once the machine first answers, run the game's launch script.
async fn watch(mount: u32) {
    let mounted = || MOUNT.with(|current| current.get()) == mount;
    let game = game();
    let names = screen_names(&game);
    let mut launched = false;
    while mounted() {
        let hidden = web_sys::window()
            .and_then(|window| window.document())
            .is_some_and(|document| document.hidden());
        if !hidden && screens_hold(&names).await.is_some() {
            if !mounted() {
                break;
            }
            if !launched {
                launched = true;
                show("data-kiosk-machine", "running");
                // `run_script` refuses when the page is already leaving.
                if let Some(script) = &game.launch {
                    run_script(script);
                }
            }
            probe().await;
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

fn block_covers(block: &Block, v: i16, h: i16) -> bool {
    let [x, y, w, height] = block.at.map(i32::from);
    (x..x + w).contains(&i32::from(h)) && (y..y + height).contains(&i32::from(v))
}

/// Is the block in force? Always, when it names no screen; else while its
/// screen holds, and for a moment after it was last seen (a screen fading out,
/// or one look that missed it, does not open the control under it).
fn block_in_force(block: &Block, now: f64) -> bool {
    let Some(name) = &block.screen else {
        return true;
    };
    SCREENS.with(|screens| screens.borrow().iter().any(|shown| shown == name))
        || SEEN.with(|seen| {
            seen.borrow()
                .get(name)
                .is_some_and(|at| now - at < BLOCK_GRACE_MS)
        })
}

/// What a touch at (v, h) on the picture comes to. (v, h) is where the finger
/// is, before the game's offset. It does nothing while a script runs or the
/// page is leaving, on the Mac menu bar, and on a blocked control. A spot that
/// is blocked on some screen, when that screen was not showing at the last
/// look, is held back: the look can be a fifth of a second old, and a screen
/// that has just come up would let the touch through.
pub fn touch_verdict(v: i16, h: i16) -> Touch {
    verdict(v, h, false)
}

/// `fresh`: the screen has just been looked at, so a spot whose block is not
/// in force now is not blocked.
fn verdict(v: i16, h: i16, fresh: bool) -> Touch {
    if guest_input_shut() {
        return Touch::Swallow;
    }
    let game = game();
    if v < game.menu_bar as i16 {
        return Touch::Swallow;
    }
    let now = js_sys::Date::now();
    let mut held = false;
    for block in game.blocks.iter().filter(|block| block_covers(block, v, h)) {
        if block_in_force(block, now) {
            return Touch::Swallow;
        }
        held = true;
    }
    if held && !fresh {
        Touch::Hold
    } else {
        Touch::Pass
    }
}

/// A finger that `touch_verdict` held back. Its gesture keeps its own number
/// while the screen is looked at afresh: a finger that lifts meanwhile becomes
/// a tap, one still down becomes a press that follows it, and one cancelled
/// or slid away comes to nothing (`ottertube_touch`).
pub fn defer_touch(pointer_id: i32, v: i16, h: i16) {
    let id = DEFERRED.with(|deferred| deferred.borrow_mut().begin(pointer_id, (v, h)));
    spawn_local(async move {
        let game = game();
        let looked = screens_hold(&screen_names(&game)).await.is_some();
        let allowed = looked && verdict(v, h, true) == Touch::Pass;
        let outcome = DEFERRED.with(|deferred| deferred.borrow_mut().looked(id, allowed));
        match outcome {
            Looked::Nothing => {}
            Looked::Press(acts) => act(acts),
            Looked::Tap(acts) => {
                act(acts);
                wait_ms(HELD_TAP_MS).await;
                // Only this tap's press: a newer one may hold the button now.
                let acts = DEFERRED.with(|deferred| deferred.borrow_mut().tap_over(id));
                act(acts);
            }
        }
    });
}

/// A pointer event of a finger that was held back: `kind` is "move", "up" or
/// "cancel". False when the pointer is not one of those (the page handles the
/// event as usual).
pub fn deferred_pointer(kind: &str, pointer_id: i32, finger: Option<(i16, i16)>) -> bool {
    let kind = match kind {
        "move" => Kind::Move,
        "up" => Kind::Up,
        _ => Kind::Cancel,
    };
    let acts = DEFERRED.with(|deferred| deferred.borrow_mut().pointer(kind, pointer_id, finger));
    match acts {
        Some(acts) => {
            act(acts);
            true
        }
        None => false,
    }
}

fn drop_deferred() {
    let acts = DEFERRED.with(|deferred| deferred.borrow_mut().drop_all());
    act(acts);
}

/// Carry out a held-back touch's actions on the guest's pointer, and show
/// what holds the button (`data-kiosk-deferred`).
fn act(acts: Vec<Act>) {
    for action in acts {
        let (kind, (v, h)) = match action {
            Act::Move(at) => ("mouseMove", at),
            Act::Down(at) => ("mouseDown", at),
            Act::Up(at) => ("mouseUp", at),
        };
        pointer(kind, guest_point(v, h));
    }
    let pressed = DEFERRED.with(|deferred| deferred.borrow().pressed());
    if let Some(root) = root() {
        let _ = match pressed {
            Some(how) => root.set_attribute("data-kiosk-deferred", how),
            None => root.remove_attribute("data-kiosk-deferred"),
        };
    }
}

pub fn is_command_key(mac_key: u8) -> bool {
    mac_key == MAC_COMMAND_KEY
}

/// The page's own controls (a held button, a tap action, a script, the
/// controller) hold the guest's Command key now, or have let go of it.
pub fn command_on_screen(held: bool) {
    let was = COMMAND_ON_SCREEN.with(|slot| slot.replace(held));
    if held && !was {
        if let Some(listener) = COMMAND_DOWN.with(|slot| slot.borrow().clone()) {
            listener();
        }
    }
}

/// A real keyboard asks to be told when Command goes down on the page's own
/// controls: a letter it holds would become a chord.
pub fn on_command_down(listener: Rc<dyn Fn()>) {
    COMMAND_DOWN.with(|slot| *slot.borrow_mut() = Some(listener));
}

/// Is a key from a real keyboard dropped because it would make a Command
/// chord? Those are the menu bar's shortcuts, and the menu bar takes no touch.
/// The key is judged as the guest would get it, with Command held on that
/// keyboard or on the page's own controls; the game's data may let a letter
/// through (its own Quit, where a child has no other way to it). Plain keys
/// play the game.
pub fn drops_chord(mac_key: u8, character: u8, command_on_keyboard: bool) -> bool {
    (command_on_keyboard || COMMAND_ON_SCREEN.with(|slot| slot.get()))
        && is_chord_key(mac_key, character)
        && !game()
            .command_keys
            .iter()
            .any(|allowed| allowed.as_bytes() == [character.to_ascii_lowercase()])
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
    /// Scripts ran scripts deeper than `RUN_DEPTH` (the data's check refuses that).
    TooDeep,
}

pub fn busy() -> bool {
    SCRIPT.with(|script| script.borrow().running.is_some())
}

/// Run one of the game's scripts. One runs at a time: a second is refused,
/// and so is any once the page is leaving. While it runs the page shows that
/// it is busy and the child's input to the game is swallowed.
pub fn run_script(name: &str) -> bool {
    start_script(name, false)
}

/// `leaving`: the one script that may run once the page is leaving, the game's
/// `quit_first`; the page asks for it itself, once.
fn start_script(name: &str, leaving: bool) -> bool {
    if closing() && !leaving {
        return false;
    }
    let game = game();
    let Some(steps) = game.scripts.get(name).cloned() else {
        return false;
    };
    let generation = SCRIPT.with(|script| {
        let mut script = script.borrow_mut();
        if script.running.is_some() {
            return None;
        }
        script.generation = script.generation.wrapping_add(1);
        script.running = Some(name.to_string());
        Some(script.generation)
    });
    let Some(generation) = generation else {
        return false;
    };
    // The script has the game to itself: the keys the child holds go up and a
    // finger on the picture is let go of, for the length of the script. What
    // a stepped stick wants is kept: it steps again when the script has ended.
    drop_deferred();
    takeover(true);
    keys(KeyOwner::Pad, Vec::new(), false);
    show("data-kiosk-busy", name);
    if let Some(signals) = SIGNALS.with(|slot| slot.get()) {
        let _ = signals.busy.try_set(Some(name.to_string()));
    }
    let name = name.to_string();
    spawn_local(async move {
        let result = run_steps(steps, generation, 0).await;
        // A script that was cancelled was cleaned up by whoever cancelled it,
        // and another may be running by now: whatever this one's last step
        // came to, it ends nothing.
        if cancelled(generation) {
            return;
        }
        let outcome = match result {
            Ok(()) => "done".to_string(),
            Err(Stop::Cancelled) => return,
            Err(Stop::NotHere(screen)) => format!("skipped:{screen}"),
            Err(Stop::Never(screen)) => format!("stopped:{screen}"),
            Err(Stop::NoMachine) => "stopped:no-machine".to_string(),
            Err(Stop::TooDeep) => "stopped:too-deep".to_string(),
        };
        finish(generation, &format!("{name}:{outcome}"));
    });
    true
}

/// The script numbered `generation` is over: let go of everything it holds and
/// show that nothing runs. Nothing happens if that script is not the one
/// running now.
fn finish(generation: u32, outcome: &str) {
    let ended = SCRIPT.with(|script| {
        let mut script = script.borrow_mut();
        if script.generation != generation || script.running.is_none() {
            return None;
        }
        script.running = None;
        Some((std::mem::take(&mut script.keys), script.pointer.take()))
    });
    let Some((held, pointer_at)) = ended else {
        return;
    };
    if !held.is_empty() {
        keys(KeyOwner::Script, held, false);
    }
    if let Some(at) = pointer_at {
        pointer("mouseUp", at);
    }
    // The child's input comes back, unless the page is leaving.
    if !closing() {
        takeover(false);
    }
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
/// Its keys and its pointer are let go at once; its next step never runs, and
/// an answer it was waiting for is not acted on.
pub fn cancel_script(why: &str) {
    let running = SCRIPT.with(|script| {
        let script = script.borrow();
        script.running.clone().map(|name| (script.generation, name))
    });
    if let Some((generation, name)) = running {
        finish(generation, &format!("{name}:cancelled:{why}"));
    }
    // Whatever was running is not the current script any more.
    SCRIPT.with(|script| {
        let mut script = script.borrow_mut();
        script.generation = script.generation.wrapping_add(1);
    });
}

/// Leaving, for a game that writes what matters only when it quits by its own
/// Quit (Delirium keeps its score table in memory until then). When one of the
/// game's `quit_first.after` screens has been seen on this visit (Delirium's
/// "enter your name": a score went into the table), its `quit_first.script`
/// drives the game's own Quit, and this waits for the guest to stop, up to
/// `quit_first.timeout`. Then the page saves and leaves as it always does, and
/// the file the game wrote is in the save. `keeps`: the visit keeps saves at
/// all (not Guest, not a frozen session); `halted`: the guest has stopped.
///
/// The page is already closing: no other script, no touch, no controller and
/// no keyboard reaches the guest meanwhile. It runs once a visit: Exit pressed
/// again, or the game quitting, joins the leaving already under way.
///
/// Not covered: OtterTube's own Start and Guide buttons go Home at once, with
/// no Exit; a score entered just before that is lost, as is one whose quit
/// takes longer than the timeout.
pub async fn quit_first(keeps: bool, halted: impl Fn() -> bool) {
    let game = game();
    let Some(rule) = game.quit_first.clone() else {
        return;
    };
    let needed = SEEN.with(|seen| {
        let seen = seen.borrow();
        rule.after.iter().any(|name| seen.contains_key(name))
    });
    let skipped = if !keeps {
        Some("not-kept")
    } else if !needed {
        Some("not-needed")
    } else if halted() {
        Some("already-quit")
    } else {
        None
    };
    if let Some(why) = skipped {
        show("data-kiosk-quit", why);
        return;
    }
    let runs = QUIT_RUNS.with(|runs| {
        runs.set(runs.get() + 1);
        runs.get()
    });
    show("data-kiosk-quit-runs", &runs.to_string());
    show("data-kiosk-quit", "running");
    let started = js_sys::Date::now();
    let deadline = started + f64::from(rule.timeout) * FRAME_MS;
    let mut ended_at = (!start_script(&rule.script, true)).then_some(started);
    let outcome = loop {
        if halted() {
            break "quit";
        }
        let now = js_sys::Date::now();
        if now >= deadline {
            break "timed-out";
        }
        if !busy() && now - *ended_at.get_or_insert(now) >= QUIT_GRACE_MS {
            break "not-quit";
        }
        wait_ms(50.0).await;
    };
    if busy() {
        cancel_script(outcome);
    }
    show(
        "data-kiosk-quit",
        &format!("{outcome}:{}", (js_sys::Date::now() - started).round()),
    );
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

/// A script's look at the screen. An answer that comes after the script was
/// cancelled is not acted on: the script stops there.
async fn script_look(generation: u32, names: &[&str]) -> Result<Vec<bool>, Stop> {
    if cancelled(generation) {
        return Err(Stop::Cancelled);
    }
    let hold = screens_hold(names).await;
    if cancelled(generation) {
        return Err(Stop::Cancelled);
    }
    hold.ok_or(Stop::NoMachine)
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
        let hold = script_look(generation, names).await?;
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
                    if script_look(generation, &[screen.as_str()]).await?[0] {
                        run_steps(then, generation, depth).await?;
                    }
                }
                Step::IfNot { screen, then } => {
                    if !script_look(generation, &[screen.as_str()]).await?[0] {
                        run_steps(then, generation, depth).await?;
                    }
                }
                Step::Retry {
                    press: chord,
                    until: screen,
                    every,
                    tries,
                } => {
                    let mut reached = script_look(generation, &[screen.as_str()]).await?[0];
                    for _ in 0..tries {
                        if reached {
                            break;
                        }
                        press(generation, &chord).await?;
                        reached = match until(generation, &[screen.as_str()], every, true).await {
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
                    let steps = game().scripts.get(&name).cloned().unwrap_or_default();
                    // A script that finds it has nothing to do here ends
                    // itself, not the script that ran it.
                    match run_steps(steps, generation, depth + 1).await {
                        Ok(()) | Err(Stop::NotHere(_)) => {}
                        Err(stop) => return Err(stop),
                    }
                }
                Step::StopUnless(screen) => {
                    if !script_look(generation, &[screen.as_str()]).await?[0] {
                        return Err(Stop::NotHere(screen));
                    }
                }
                Step::StopIf(screen) => {
                    if script_look(generation, &[screen.as_str()]).await?[0] {
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
///
/// What each source wants is kept while a script runs, releases included: a
/// stick that is still pushed when the script ends steps again, as a new push,
/// and one that was let go meanwhile does not.
pub fn stick_steps(source: &'static str, wanted: &[&str]) -> bool {
    let Some(step) = game().stick_step else {
        return false;
    };
    if closing() {
        return true;
    }
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
                if closing() {
                    break;
                }
                if busy() {
                    // A script has the game: the push waits for it to end.
                    last = None;
                    wait_ms(30.0).await;
                    continue;
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
                    if guest_input_shut() || wanted().as_ref() != Some(&direction) {
                        // Let go, pushed another way, or a script: a new push.
                        last = None;
                        break;
                    }
                }
            }
            STEPPER.with(|stepper| stepper.borrow_mut().running = false);
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
        // What a stepped game's direction wants is kept through a script.
        "direction" => {
            let names: Vec<&str> = names.iter().map(String::as_str).collect();
            stick_steps("pad", &names);
        }
        // A browser check's own, on a loopback host only: stop the running
        // script without leaving, so that another can be started after it.
        "test-cancel" if loopback() => cancel_script("test"),
        // While a script runs, and once the page is leaving, the child's
        // input to the game is swallowed.
        _ if guest_input_shut() => {}
        "tap" => keys(KeyOwner::Tap, names, true),
        "pad" => keys(KeyOwner::Pad, names, down),
        "script" => {
            // Not before the launch script has had its turn.
            if let (false, Some(name)) = (starting(), names.first()) {
                run_script(name);
            }
        }
        _ => {}
    }
}
