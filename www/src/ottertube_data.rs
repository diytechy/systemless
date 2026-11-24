//! What the OtterTube add-on page knows about each game, as data
//! (`ottertube-games.json`, compiled in): its tap actions and help, the seed
//! for a new player, the screens it can recognise, the scripts that drive the
//! game's own menus and dialogs so a child never has to, the controls a child
//! must not reach, and the game controller's buttons.
//!
//! A screen is recognised by a hash of a small region of the guest's own
//! screen (`Machine::region_hashes`): the emulator draws the same pixels for
//! the same state, so a title, a dialog or a board in play each have regions
//! that never differ. Several entries may share a name; the screen holds when
//! any of them matches (a game that draws its own pointer can cover one).
//!
//! Nothing here touches the browser. The runner is in `ottertube_play`.
#![cfg_attr(not(feature = "ottertube"), allow(dead_code))]
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// Every game in the add-on build shows a 640 by 480 screen.
pub const GUEST_SCREEN: [u16; 2] = [640, 480];
/// One sixtieth of a second: the unit of every wait and timeout in a script.
pub const FRAME_MS: f64 = 1000.0 / 60.0;
/// How deep scripts may run scripts: the script a button starts, and this many
/// below it. The check refuses data that goes deeper; the runner stops there.
pub const RUN_DEPTH: u8 = 8;
/// The longest a script may wait for a screen, in frames (a minute).
const LONGEST_WAIT: u32 = 3600;

#[derive(Clone, Debug, Default, Deserialize, PartialEq)]
#[serde(default, deny_unknown_fields)]
pub struct GameData {
    /// Big tap buttons beside the picture.
    pub actions: Vec<Action>,
    /// How to play, a few plain lines; and the same for a game controller.
    pub help: Vec<String>,
    pub pad_help: Vec<String>,
    /// Bytes written into the game's own files on every boot: under the save,
    /// or over it when `enforce` is set.
    pub seed: Vec<Seed>,
    /// Added to where a finger (or a script's tap) is, `[right, down]`, for a
    /// game that draws its own pointer away from the system's.
    pub pointer_offset: [i16; 2],
    /// The top lines of the screen that take no touch: the Mac menu bar.
    pub menu_bar: u16,
    /// The letters a real keyboard may still press with Command. Every other
    /// Command chord is dropped: they are the menu bar's shortcuts. A game
    /// whose Quit a child cannot reach any other way keeps `q`.
    pub command_keys: Vec<String>,
    /// Set for a game played a cell at a time: one move per push of the stick
    /// or the controller's direction, repeated only while it is held.
    pub stick_step: Option<StickStep>,
    pub screens: Vec<Screen>,
    /// Rectangles that take no touch: controls a child should not reach.
    pub blocks: Vec<Block>,
    pub scripts: BTreeMap<String, Vec<Step>>,
    /// The script run once the game is up, to bring it to where play starts.
    pub launch: Option<String>,
    /// For a game that writes what matters only when it quits by its own Quit:
    /// made to quit before the page leaves, when there is something to write.
    pub quit_first: Option<QuitFirst>,
    pub pad: Pad,
}

/// When Exit is pressed and one of the `after` screens has been seen on this
/// visit, `script` drives the game's own Quit, and the page waits up to
/// `timeout` frames (ten seconds at most) for the guest to stop before it
/// saves and leaves. The script runs while the page is already closing, so
/// nothing else reaches the guest meanwhile. Not for Guest, nor a session that
/// keeps nothing. It does not cover OtterTube's own Start and Guide buttons,
/// which go Home at once with no Exit.
#[derive(Clone, Debug, Default, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct QuitFirst {
    pub after: Vec<String>,
    pub script: String,
    pub timeout: u32,
    /// Why, for whoever reads the data.
    pub what: String,
}

/// The longest a game may be given to quit before the page leaves: ten seconds.
pub const LONGEST_QUIT: u32 = 600;

/// A tap button: it presses keys once, or runs a script. `when` and `unless`
/// name screens: the button shows only on (or except on) those.
#[derive(Clone, Debug, Default, Deserialize, PartialEq)]
#[serde(default, deny_unknown_fields)]
pub struct Action {
    pub label: String,
    pub keys: Option<String>,
    pub script: Option<String>,
    pub when: Vec<String>,
    pub unless: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Seed {
    pub path: String,
    pub offset: usize,
    pub bytes: Vec<u8>,
    /// Written after the saved files are in place too, on every boot: for a
    /// setting the page does not let a player change back (a control the page
    /// blocks). Without it a save's own bytes win.
    #[serde(default)]
    pub enforce: bool,
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct StickStep {
    /// How long the key is down for one move.
    pub pulse_ms: u32,
    /// Held this long before it repeats, then every `repeat_ms`.
    pub delay_ms: u32,
    pub repeat_ms: u32,
}

#[derive(Clone, Debug, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Screen {
    pub name: String,
    /// `[x, y, width, height]` in guest pixels.
    pub at: [u16; 4],
    /// The region's hash, 16 hex digits.
    pub hash: String,
}

#[derive(Clone, Debug, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Block {
    pub at: [u16; 4],
    /// Blocked only while this screen holds (and a moment after); always when
    /// absent. Name a screen only where the same spot is touched in play on
    /// another screen: a screen is not recognised while it fades in, and a
    /// touch on such a spot waits for a fresh look at the screen.
    #[serde(default)]
    pub screen: Option<String>,
    /// What is under it, for whoever reads the data.
    pub what: String,
}

/// One step of a script. Waits and timeouts are in frames (sixtieths of a second).
#[derive(Clone, Debug, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case", deny_unknown_fields)]
pub enum Step {
    /// Press and release keys: `Meta+n` is Command-N.
    Press(String),
    /// Press keys and keep them down, until `release` or the script's end.
    Hold(String),
    Release(String),
    /// A click at `[x, y]` on the guest's screen, where a finger would touch.
    Tap([u16; 2]),
    /// Press at `[x1, y1]`, move to `[x2, y2]`, let go: a Mac menu.
    Drag([u16; 4]),
    Wait(u32),
    /// Wait until the screen holds. The script stops if it never does.
    Until {
        screen: String,
        timeout: u32,
    },
    UntilAny {
        screens: Vec<String>,
        timeout: u32,
    },
    /// Wait until the screen no longer holds.
    UntilNot {
        screen: String,
        timeout: u32,
    },
    If {
        screen: String,
        then: Vec<Step>,
    },
    IfNot {
        screen: String,
        then: Vec<Step>,
    },
    /// Press keys, then wait `every` frames for the screen; again up to `tries` times.
    Retry {
        press: String,
        until: String,
        every: u32,
        tries: u32,
    },
    Run(String),
    /// Stop here, quietly, unless the screen holds.
    StopUnless(String),
    /// Stop here, quietly, if the screen holds.
    StopIf(String),
}

/// A standard-mapping game controller. `buttons` is keyed by button index.
#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq)]
#[serde(default, deny_unknown_fields)]
pub struct Pad {
    pub buttons: BTreeMap<String, PadButton>,
    /// Keys for up, down, left, right: the d-pad and the left stick.
    pub directions: Option<[String; 4]>,
    /// One move per push (the game's `stick_step`), not a held key.
    pub step: bool,
}

/// What one button does. `script` runs on the press (on the `script_when`
/// screens only, when any are named; elsewhere the button is its `key`).
/// `exit` leaves when the button has been held for a second.
#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq)]
#[serde(default, deny_unknown_fields)]
pub struct PadButton {
    pub key: Option<String>,
    pub script: Option<String>,
    pub script_when: Vec<String>,
    pub exit: bool,
}

/// Is `name` a key the page can press? The names the held-button layer knows.
pub fn is_key_name(name: &str) -> bool {
    matches!(
        name,
        "Meta"
            | "Shift"
            | "Alt"
            | "Control"
            | "Escape"
            | "Enter"
            | "Space"
            | "Tab"
            | "Numpad2"
            | "Numpad4"
            | "Numpad6"
            | "Numpad8"
            | "ArrowUp"
            | "ArrowDown"
            | "ArrowLeft"
            | "ArrowRight"
    ) || (name.len() == 1
        && name
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit()))
}

/// The Mac's Command key, as the guest gets it.
pub const MAC_COMMAND_KEY: u8 = 0x37;

/// Is this key, as the guest gets it (its Mac key code and its character), one
/// that makes a Command chord: a letter, a digit or a punctuation mark? Not
/// Space, Return, Escape, the arrows or another modifier, and not the keypad:
/// games hold those together with Command as plain keys.
pub fn is_chord_key(mac_key: u8, character: u8) -> bool {
    character > b' ' && character < 0x7f && !(0x41..=0x5c).contains(&mac_key)
}

/// Keys joined by `+` (together) and `,` (one press after another).
fn keys_ok(keys: &str) -> bool {
    !keys.is_empty() && keys.split([',', '+']).all(is_key_name)
}

fn in_screen(at: [u16; 4]) -> bool {
    at[2] > 0
        && at[3] > 0
        && u32::from(at[0]) + u32::from(at[2]) <= u32::from(GUEST_SCREEN[0])
        && u32::from(at[1]) + u32::from(at[3]) <= u32::from(GUEST_SCREEN[1])
}

impl GameData {
    pub fn has_screen(&self, name: &str) -> bool {
        self.screens.iter().any(|screen| screen.name == name)
    }

    /// The regions and hashes that each mean `name`.
    pub fn screen_entries(&self, name: &str) -> Vec<&Screen> {
        self.screens
            .iter()
            .filter(|screen| screen.name == name)
            .collect()
    }

    /// Every name is known, every key can be pressed, every point is on the
    /// screen, and no script can run for ever by calling itself.
    pub fn check(&self) -> Result<(), String> {
        let screen = |name: &str| {
            if self.has_screen(name) {
                Ok(())
            } else {
                Err(format!("no screen named {name:?}"))
            }
        };
        let script = |name: &str| {
            if self.scripts.contains_key(name) {
                Ok(())
            } else {
                Err(format!("no script named {name:?}"))
            }
        };
        for entry in &self.screens {
            if !in_screen(entry.at) {
                return Err(format!("screen {:?} is off the screen", entry.name));
            }
            if entry.hash.len() != 16 || !entry.hash.bytes().all(|b| b.is_ascii_hexdigit()) {
                return Err(format!("screen {:?} has a bad hash", entry.name));
            }
        }
        for block in &self.blocks {
            if !in_screen(block.at) || block.what.is_empty() {
                return Err(format!(
                    "block {:?} is off the screen or unnamed",
                    block.what
                ));
            }
            if let Some(name) = &block.screen {
                screen(name)?;
            }
        }
        for action in &self.actions {
            if action.label.is_empty() || action.label.len() > 14 {
                return Err(format!("action label {:?}", action.label));
            }
            match (&action.keys, &action.script) {
                (Some(keys), None) if keys_ok(keys) => {}
                (None, Some(name)) => script(name)?,
                _ => return Err(format!("action {:?} needs keys or a script", action.label)),
            }
            for name in action.when.iter().chain(&action.unless) {
                screen(name)?;
            }
        }
        if let Some(name) = &self.launch {
            script(name)?;
        }
        if let Some(rule) = &self.quit_first {
            if rule.after.is_empty() || rule.what.is_empty() {
                return Err("quit_first needs the screens it follows, and why".into());
            }
            for name in &rule.after {
                screen(name)?;
            }
            script(&rule.script)?;
            if rule.timeout == 0 || rule.timeout > LONGEST_QUIT {
                return Err(format!(
                    "quit_first waits {} frames; up to {LONGEST_QUIT}",
                    rule.timeout
                ));
            }
            if self.launch.as_deref() == Some(rule.script.as_str()) {
                return Err("quit_first cannot be the launch script".into());
            }
        }
        for key in &self.command_keys {
            let mut letters = key.chars();
            let one = matches!((letters.next(), letters.next()), (Some(letter), None)
                if letter.is_ascii_lowercase() || letter.is_ascii_digit());
            if !one {
                return Err(format!("command key {key:?}"));
            }
        }
        for (name, steps) in &self.scripts {
            // The page shows how a script ended as "name:outcome".
            if name.is_empty()
                || !name
                    .bytes()
                    .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
            {
                return Err(format!("script name {name:?}"));
            }
            self.check_steps(steps, &mut vec![name.as_str()])
                .map_err(|error| format!("script {name:?}: {error}"))?;
        }
        for (index, button) in &self.pad.buttons {
            if index.parse::<u8>().map_or(true, |index| index > 16) {
                return Err(format!("pad button {index:?}"));
            }
            if let Some(key) = &button.key {
                if !is_key_name(key) {
                    return Err(format!("pad button {index} presses {key:?}"));
                }
            }
            if let Some(name) = &button.script {
                script(name)?;
            }
            for name in &button.script_when {
                screen(name)?;
            }
        }
        if let Some(directions) = &self.pad.directions {
            if !directions.iter().all(|key| is_key_name(key)) {
                return Err("pad directions press unknown keys".into());
            }
        }
        if self.pad.step && self.stick_step.is_none() {
            return Err("the pad steps but the game has no stick_step".into());
        }
        for seed in &self.seed {
            if seed.path.is_empty() || seed.bytes.is_empty() {
                return Err("an empty seed".into());
            }
        }
        for line in self.help.iter().chain(&self.pad_help) {
            if line.len() > 96 || line.contains("http") || line.contains('<') {
                return Err(format!("help line {line:?}"));
            }
        }
        Ok(())
    }

    fn check_steps<'a>(&'a self, steps: &'a [Step], path: &mut Vec<&'a str>) -> Result<(), String> {
        let screen = |name: &str| {
            if self.has_screen(name) {
                Ok(())
            } else {
                Err(format!("no screen named {name:?}"))
            }
        };
        let point = |x: u16, y: u16| {
            if x < GUEST_SCREEN[0] && y < GUEST_SCREEN[1] {
                Ok(())
            } else {
                Err(format!("[{x}, {y}] is off the screen"))
            }
        };
        for step in steps {
            match step {
                Step::Press(keys) | Step::Hold(keys) | Step::Release(keys) => {
                    if !keys_ok(keys) || keys.contains(',') {
                        return Err(format!("keys {keys:?}"));
                    }
                }
                Step::Tap([x, y]) => point(*x, *y)?,
                Step::Drag([x1, y1, x2, y2]) => {
                    point(*x1, *y1)?;
                    point(*x2, *y2)?;
                }
                Step::Wait(frames) => {
                    if *frames == 0 || *frames > 600 {
                        return Err(format!("a wait of {frames} frames"));
                    }
                }
                Step::Until {
                    screen: name,
                    timeout,
                }
                | Step::UntilNot {
                    screen: name,
                    timeout,
                } => {
                    screen(name)?;
                    if *timeout == 0 || *timeout > LONGEST_WAIT {
                        return Err(format!("a timeout of {timeout} frames"));
                    }
                }
                Step::UntilAny { screens, timeout } => {
                    if screens.is_empty() || *timeout == 0 || *timeout > LONGEST_WAIT {
                        return Err("until_any needs screens and a timeout".into());
                    }
                    for name in screens {
                        screen(name)?;
                    }
                }
                Step::If { screen: name, then } | Step::IfNot { screen: name, then } => {
                    screen(name)?;
                    self.check_steps(then, path)?;
                }
                Step::Retry {
                    press,
                    until,
                    every,
                    tries,
                } => {
                    screen(until)?;
                    if !keys_ok(press)
                        || press.contains(',')
                        || *every == 0
                        || *every > LONGEST_WAIT
                        || *tries == 0
                        || *tries > 10
                    {
                        return Err(
                            "a retry needs keys, a wait of up to a minute and up to 10 tries"
                                .into(),
                        );
                    }
                }
                Step::Run(name) => {
                    let Some(steps) = self.scripts.get(name) else {
                        return Err(format!("no script named {name:?}"));
                    };
                    if path.contains(&name.as_str()) {
                        return Err(format!("{name:?} runs itself"));
                    }
                    // `path` holds the script a button starts and each one run below it.
                    if path.len() > usize::from(RUN_DEPTH) {
                        return Err(format!(
                            "{name:?} is run more than {RUN_DEPTH} scripts deep"
                        ));
                    }
                    path.push(name);
                    self.check_steps(steps, path)?;
                    path.pop();
                }
                Step::StopUnless(name) | Step::StopIf(name) => screen(name)?,
            }
        }
        Ok(())
    }
}

/// The games as compiled in, by game id.
pub fn embedded() -> BTreeMap<String, GameData> {
    parse(include_str!("ottertube-games.json"))
        .expect("ottertube-games.json is checked by a unit test")
}

/// Parse and check a games file.
pub fn parse(json: &str) -> Result<BTreeMap<String, GameData>, String> {
    let games: BTreeMap<String, GameData> =
        serde_json::from_str(json).map_err(|error| error.to_string())?;
    for (id, game) in &games {
        game.check().map_err(|error| format!("{id}: {error}"))?;
    }
    Ok(games)
}

/// A screen hash as the data writes it.
pub fn hash_text(hash: u64) -> String {
    format!("{hash:016x}")
}

#[cfg(test)]
mod tests {
    use super::*;

    const GAMES: [&str; 3] = [
        "clockwerx-personal-10",
        "delirium-personal-11",
        "blobbo-full-personal-101",
    ];

    #[test]
    fn the_compiled_in_games_parse_and_pass_their_checks() {
        let games = parse(include_str!("ottertube-games.json")).unwrap();
        assert_eq!(
            games.keys().map(String::as_str).collect::<Vec<_>>().len(),
            3
        );
        for id in GAMES {
            let game = &games[id];
            assert!(
                !game.help.is_empty() && game.help.len() <= 6,
                "{id}: a few lines of help"
            );
            assert!(
                !game.pad_help.is_empty() && game.pad_help.len() <= 6,
                "{id}: help for a controller"
            );
            for line in game.help.iter().chain(&game.pad_help) {
                for key_name in ["Command", "Option", "Control", "Cmd", "\u{2318}"] {
                    assert!(!line.contains(key_name), "{id}: no Mac key names: {line}");
                }
            }
            assert!(game.menu_bar > 0, "{id}: the menu bar takes no touch");
            let launch = game
                .launch
                .as_ref()
                .unwrap_or_else(|| panic!("{id} has no launch script"));
            assert!(game.scripts.contains_key(launch));
            // A controller can leave, and can start the game without Start (OtterTube keeps Start).
            assert!(
                game.pad.buttons.values().any(|button| button.exit),
                "{id}: a button leaves"
            );
            assert!(
                game.pad
                    .buttons
                    .iter()
                    .any(|(index, button)| index != "9" && button.script.is_some()),
                "{id}: a script on a button other than Start"
            );
        }
    }

    #[test]
    fn the_clockwerx_seed_is_a_neutral_name_as_a_pascal_string() {
        let games = embedded();
        let seed = &games["clockwerx-personal-10"].seed;
        assert_eq!(seed[0].offset, 532);
        assert!(!seed[0].enforce, "a save's own name wins");
        let length = usize::from(seed[0].bytes[0]);
        assert_eq!(&seed[0].bytes[1..=length], b"Player");
    }

    #[test]
    fn clockwerx_cannot_be_left_in_mouse_control() {
        // Mouse control stops the buttons working. Its switch is blocked on
        // every screen (the list of levels fades in, and is not recognised
        // until the fade has ended), and Keyboard is written over the saved
        // settings on every boot, so a save that has Mouse comes back.
        let games = embedded();
        let game = &games["clockwerx-personal-10"];
        assert!(!game.blocks.is_empty());
        assert!(
            game.blocks.iter().all(|block| block.screen.is_none()),
            "ClockWerx is never played by touch on the picture: its blocks hold on every screen"
        );
        let keyboard: Vec<&Seed> = game.seed.iter().filter(|seed| seed.enforce).collect();
        assert_eq!(keyboard.len(), 1);
        assert_eq!(
            (keyboard[0].offset, keyboard[0].bytes.as_slice()),
            (608, &[1u8][..])
        );
        assert_eq!(keyboard[0].path, game.seed[0].path);
    }

    #[test]
    fn command_chords_are_letters_digits_and_marks_only() {
        // (Mac key code, character) as the page's key table gives them.
        for (name, key) in [
            ("p", (0x23, b'p')),
            ("Q", (0x0c, b'Q')),
            ("1", (0x12, b'1')),
            (".", (0x2f, b'.')),
        ] {
            assert!(is_chord_key(key.0, key.1), "{name}");
        }
        // Held together with Command as plain game keys.
        for (name, key) in [
            ("Space", (0x31, b' ')),
            ("Command", (MAC_COMMAND_KEY, 0)),
            ("Shift", (0x38, 0)),
            ("Return", (0x24, 0x0d)),
            ("Escape", (0x35, 0x1b)),
            ("an arrow", (0x7e, 0x1e)),
            ("keypad 8", (0x5b, b'8')),
        ] {
            assert!(!is_chord_key(key.0, key.1), "{name}");
        }
        let games = embedded();
        // Quit is in the menu bar only, which takes no touch: the chord stays.
        assert_eq!(games["clockwerx-personal-10"].command_keys, ["q"]);
        assert_eq!(games["blobbo-full-personal-101"].command_keys, ["q"]);
        // Delirium has a Quit button of its own.
        assert!(games["delirium-personal-11"].command_keys.is_empty());
    }

    #[test]
    fn blobbo_save_checks_the_name_before_it_confirms() {
        // A stray letter (Drop is the S key) has been seen to land in the Save
        // dialog's name; the game was then saved where Load does not look.
        let games = embedded();
        let game = &games["blobbo-full-personal-101"];
        assert!(game.has_screen("save-name"));
        assert!(game.scripts["save"].contains(&Step::Run("save-confirm".into())));
        let confirm = &game.scripts["save-confirm"];
        assert!(matches!(&confirm[1], Step::IfNot { screen, .. } if screen == "save-name"));
        assert_eq!(confirm.last(), Some(&Step::Press("Enter".into())));
    }

    #[test]
    fn delirium_quits_by_its_own_quit_before_leaving_after_a_score_went_in() {
        let games = embedded();
        let delirium = &games["delirium-personal-11"];
        let rule = delirium
            .quit_first
            .as_ref()
            .expect("Delirium has quit_first");
        assert_eq!(rule.after, ["name-entry"]);
        assert!(rule.timeout > 0 && rule.timeout <= LONGEST_QUIT);
        let quit = &delirium.scripts[&rule.script];
        // The name screen is finished first (its score goes into the table),
        // and the last thing is the game's own QUIT button, on the menu.
        assert!(quit.contains(&Step::Run("name".into())));
        assert_eq!(quit.last(), Some(&Step::Tap([72, 414])));
        // The other two write their files as they go.
        assert!(games["clockwerx-personal-10"].quit_first.is_none());
        assert!(games["blobbo-full-personal-101"].quit_first.is_none());
    }

    #[test]
    fn a_chain_of_scripts_deeper_than_the_runner_goes_is_refused() {
        let chain = |length: usize| {
            let scripts: Vec<String> = (0..length)
                .map(|index| {
                    if index + 1 < length {
                        format!(r#""s{index}": [{{"run": "s{}"}}]"#, index + 1)
                    } else {
                        format!(r#""s{index}": [{{"wait": 1}}]"#)
                    }
                })
                .collect();
            game(&format!(r#"{{"scripts": {{{}}}}}"#, scripts.join(", ")))
        };
        // The script a button starts, and RUN_DEPTH below it.
        assert!(chain(usize::from(RUN_DEPTH) + 1).is_ok());
        let error = chain(usize::from(RUN_DEPTH) + 2).expect_err("too deep");
        assert!(error.contains("scripts deep"), "{error}");
    }

    #[test]
    fn delirium_start_gets_past_the_screen_that_asks_for_a_name() {
        // After a game that makes the score table Delirium asks for a name, on
        // a screen of its own with letter keys. A controller has no pointer for
        // those, so Start (and the controller's A) must get past it.
        let games = embedded();
        let game = &games["delirium-personal-11"];
        assert!(game.has_screen("name-entry") && game.has_screen("name-empty"));
        assert!(game.scripts["start"].contains(&Step::Run("name".into())));
        assert!(game.pad.buttons["0"]
            .script_when
            .iter()
            .any(|screen| screen == "name-entry"));
    }

    fn game(json: &str) -> Result<BTreeMap<String, GameData>, String> {
        parse(&format!("{{\"g\": {json}}}"))
    }

    #[test]
    fn steps_parse_from_their_plain_spelling() {
        let games = game(
            r#"{
              "screens": [{"name": "title", "at": [0, 0, 8, 8], "hash": "0123456789abcdef"}],
              "scripts": {"go": [
                {"press": "Meta+n"}, {"tap": [10, 20]}, {"drag": [1, 2, 3, 4]}, {"wait": 30},
                {"until": {"screen": "title", "timeout": 300}},
                {"if": {"screen": "title", "then": [{"hold": "Space"}, {"release": "Space"}]}},
                {"retry": {"press": "Space", "until": "title", "every": 60, "tries": 3}},
                {"stop_unless": "title"}
              ]}
            }"#,
        )
        .unwrap();
        let steps = &games["g"].scripts["go"];
        assert_eq!(steps[0], Step::Press("Meta+n".into()));
        assert_eq!(steps[1], Step::Tap([10, 20]));
        assert_eq!(steps[3], Step::Wait(30));
        assert_eq!(
            steps[4],
            Step::Until {
                screen: "title".into(),
                timeout: 300
            }
        );
        assert_eq!(steps.len(), 8);
    }

    #[test]
    fn data_that_cannot_work_is_refused() {
        for (bad, why) in [
            (
                r#"{"scripts": {"a": [{"until": {"screen": "nowhere", "timeout": 60}}]}}"#,
                "no screen",
            ),
            (r#"{"scripts": {"a": [{"run": "a"}]}}"#, "runs itself"),
            (
                r#"{"scripts": {"a": [{"run": "b"}], "b": [{"run": "a"}]}}"#,
                "runs itself",
            ),
            (r#"{"scripts": {"a": [{"run": "missing"}]}}"#, "no script"),
            (r#"{"scripts": {"a": [{"press": "Command+n"}]}}"#, "keys"),
            (
                r#"{"scripts": {"a": [{"tap": [640, 10]}]}}"#,
                "off the screen",
            ),
            (r#"{"scripts": {"a": [{"wait": 0}]}}"#, "wait"),
            (r#"{"scripts": {"a:b": [{"wait": 1}]}}"#, "script name"),
            (
                r#"{"screens": [{"name": "s", "at": [0, 0, 8, 8], "hash": "0123456789abcdef"}],
                    "scripts": {"a": [{"retry": {"press": "Space", "until": "s", "every": 3601, "tries": 2}}]}}"#,
                "a retry needs",
            ),
            (r#"{"command_keys": ["Q"]}"#, "command key"),
            (
                r#"{"screens": [{"name": "s", "at": [0, 0, 8, 8], "hash": "0123456789abcdef"}],
                    "scripts": {"q": [{"wait": 1}]},
                    "quit_first": {"after": ["s"], "script": "q", "timeout": 601, "what": "w"}}"#,
                "up to 600",
            ),
            (
                r#"{"scripts": {"q": [{"wait": 1}]},
                    "quit_first": {"after": ["nowhere"], "script": "q", "timeout": 60, "what": "w"}}"#,
                "no screen",
            ),
            (
                r#"{"screens": [{"name": "s", "at": [0, 0, 8, 8], "hash": "0123456789abcdef"}],
                    "quit_first": {"after": ["s"], "script": "missing", "timeout": 60, "what": "w"}}"#,
                "no script",
            ),
            (
                r#"{"screens": [{"name": "s", "at": [0, 0, 8, 8], "hash": "0123456789abcdef"}],
                    "scripts": {"q": [{"wait": 1}]},
                    "quit_first": {"after": [], "script": "q", "timeout": 60, "what": "w"}}"#,
                "screens it follows",
            ),
            (r#"{"command_keys": ["qq"]}"#, "command key"),
            (
                r#"{"screens": [{"name": "s", "at": [600, 0, 80, 8], "hash": "0123456789abcdef"}]}"#,
                "off the screen",
            ),
            (
                r#"{"screens": [{"name": "s", "at": [0, 0, 8, 8], "hash": "xyz"}]}"#,
                "bad hash",
            ),
            (
                r#"{"actions": [{"label": "Go"}]}"#,
                "needs keys or a script",
            ),
            (
                r#"{"actions": [{"label": "Go", "script": "missing"}]}"#,
                "no script",
            ),
            (r#"{"launch": "missing"}"#, "no script"),
            (
                r#"{"blocks": [{"at": [0, 0, 8, 8], "screen": "nowhere", "what": "x"}]}"#,
                "no screen",
            ),
            (
                r#"{"pad": {"buttons": {"0": {"key": "Command"}}}}"#,
                "presses",
            ),
            (
                r#"{"pad": {"buttons": {"17": {"key": "a"}}}}"#,
                "pad button",
            ),
            (r#"{"pad": {"step": true}}"#, "stick_step"),
            (r#"{"surprise": 1}"#, "unknown field"),
        ] {
            let error = game(bad).expect_err(bad);
            assert!(error.contains(why), "{bad}: {error}");
        }
    }

    #[test]
    fn key_names_are_the_ones_the_page_can_press() {
        for name in ["Meta", "Space", "Enter", "Escape", "Numpad8", "a", "z", "7"] {
            assert!(is_key_name(name), "{name}");
        }
        for name in ["", "Command", "A", "F1", "ab", "Numpad5", " "] {
            assert!(!is_key_name(name), "{name:?}");
        }
        assert!(keys_ok("Meta+n") && keys_ok("Space,Space") && !keys_ok("Meta+") && !keys_ok(""));
    }
}
