use crate::controller_data::{GameData, KeyOwner, StickStep, Tuning, RESERVED_BUTTONS};
use std::collections::BTreeMap;

/// Counts each owner's holds and emits only guest-visible transitions.
pub struct KeyOwners<K> {
    held: BTreeMap<KeyOwner, Vec<K>>,
    sent: Vec<K>,
}

impl<K> Default for KeyOwners<K> {
    fn default() -> Self {
        Self {
            held: BTreeMap::new(),
            sent: Vec::new(),
        }
    }
}

impl<K: Copy + Eq> KeyOwners<K> {
    pub fn set(&mut self, owner: KeyOwner, keys: Vec<K>) {
        self.held.insert(owner, keys);
    }

    pub fn change(&mut self, owner: KeyOwner, key: K, down: bool) {
        let keys = self.held.entry(owner).or_default();
        if down {
            keys.push(key);
        } else if let Some(index) = keys.iter().position(|held| *held == key) {
            keys.remove(index);
        }
    }

    pub fn transitions(&mut self, script_exclusive: bool) -> Vec<(K, bool)> {
        let mut next = Vec::new();
        for (&owner, keys) in &self.held {
            if script_exclusive && owner != KeyOwner::Script {
                continue;
            }
            for &key in keys {
                if !next.contains(&key) {
                    next.push(key);
                }
            }
        }
        let mut changes = Vec::new();
        for &key in self.sent.iter().rev().filter(|key| !next.contains(key)) {
            changes.push((key, false));
        }
        for &key in next.iter().filter(|key| !self.sent.contains(key)) {
            changes.push((key, true));
        }
        self.sent = next;
        changes
    }

    pub fn sent(&self) -> &[K] {
        &self.sent
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct PadState {
    pub buttons: [bool; 17],
    pub left: [f32; 2],
    pub right: [f32; 2],
}

#[derive(Default)]
pub struct PadOutput<'a> {
    pub keys: Vec<&'a str>,
    pub script: Option<&'a str>,
    pub exit: bool,
    pub cursor_delta: [f32; 2],
    pub mouse_down: bool,
}

#[derive(Default)]
pub struct GridStepper<T> {
    direction: Option<T>,
    pulse_until: f64,
    next_pulse: f64,
}

impl<T: Copy + Eq> GridStepper<T> {
    pub fn pulse(&mut self, direction: Option<T>, timing: StickStep, now: f64) -> Option<T> {
        let changed = self.direction != direction;
        self.direction = direction;
        let direction = direction?;
        if changed || now >= self.next_pulse {
            self.pulse_until = now + f64::from(timing.pulse_ms);
            self.next_pulse = self.pulse_until
                + f64::from(if changed {
                    timing.delay_ms
                } else {
                    timing.repeat_ms
                });
        }
        (now < self.pulse_until).then_some(direction)
    }
}

/// Maps standard gamepad state to guest actions. Callers pass no state on
/// blur/disconnect; a new connection must release controls held on arrival.
#[derive(Default)]
pub struct PadRouter {
    previous: [bool; 17],
    blocked: [bool; 17],
    script_consumed: [bool; 17],
    held_since: [f64; 17],
    exit_sent: bool,
    connected: bool,
    direction_blocked: bool,
    cursor_blocked: bool,
    stepper: GridStepper<[bool; 4]>,
    last_ms: Option<f64>,
}

impl PadRouter {
    pub fn poll<'a>(
        &mut self,
        data: &'a GameData,
        tuning: Tuning,
        sample: Option<PadState>,
        now_ms: f64,
        screen_matches: impl Fn(&str) -> bool,
    ) -> PadOutput<'a> {
        let Some(mut sample) = sample else {
            *self = Self::default();
            return PadOutput::default();
        };
        let joining = !self.connected;
        self.connected = true;
        for (number, pressed) in sample.buttons.iter_mut().enumerate() {
            self.blocked[number] = *pressed && (joining || self.blocked[number]);
            *pressed &= !self.blocked[number] && !RESERVED_BUTTONS.contains(&(number as u8));
            self.script_consumed[number] &= *pressed;
        }
        let mut output = PadOutput::default();
        for (number, binding) in &data.pad.buttons {
            let Ok(number) = number.parse::<usize>() else {
                continue;
            };
            if !sample.buttons.get(number).copied().unwrap_or(false) {
                continue;
            }
            if !self.previous[number] {
                self.held_since[number] = now_ms;
                if let Some(script) = binding.script_for(&screen_matches) {
                    output.script.get_or_insert(script);
                    self.script_consumed[number] = true;
                }
            }
            if binding.exit && !self.exit_sent && now_ms - self.held_since[number] >= 1000.0 {
                output.exit = true;
                self.exit_sent = true;
            }
            if !self.script_consumed[number] {
                if let Some(key) = binding.key.as_deref() {
                    output.keys.push(key);
                }
            }
        }
        self.previous = sample.buttons;

        if let Some(directions) = &data.pad.directions {
            let [x, y] = sample.left;
            let zone = tuning.stick_deadzone;
            let analog = [y < -zone, y > zone, x < -zone, x > zone];
            let has_analog = analog.iter().any(|&down| down);
            self.direction_blocked = has_analog && (joining || self.direction_blocked);
            let mut wanted: [bool; 4] = std::array::from_fn(|i| {
                sample.buttons[12 + i] || (!self.direction_blocked && analog[i])
            });
            let wanted = if let Some(step) = data.stick_step.filter(|_| data.pad.step) {
                // A grid move has one axis. D-pad vertical takes priority,
                // otherwise the larger analog component chooses the axis.
                if wanted[..2].iter().any(|&down| down) && wanted[2..].iter().any(|&down| down) {
                    let vertical = sample.buttons[12] || sample.buttons[13] || y.abs() >= x.abs();
                    if vertical {
                        wanted[2..].fill(false);
                    } else {
                        wanted[..2].fill(false);
                    }
                }
                self.stepper
                    .pulse(
                        wanted.iter().any(|&down| down).then_some(wanted),
                        tuning.step(step),
                        now_ms,
                    )
                    .unwrap_or_default()
            } else {
                wanted
            };
            for (key, down) in directions.iter().zip(wanted) {
                if down && key != "None" {
                    output.keys.push(key);
                }
            }
        }

        let previous = self.last_ms.replace(now_ms);
        if let Some(mouse) = &data.mouse {
            let [x, y] = match mouse.stick {
                crate::controller_data::Stick::Left => sample.left,
                crate::controller_data::Stick::Right => sample.right,
            };
            let magnitude = x.hypot(y);
            let active = magnitude > tuning.stick_deadzone;
            self.cursor_blocked = active && (joining || self.cursor_blocked);
            if active && !self.cursor_blocked {
                let precision = mouse
                    .precision_button
                    .and_then(|i| sample.buttons.get(usize::from(i)))
                    .copied()
                    .unwrap_or(false);
                let speed = if precision {
                    tuning
                        .precision_cursor_speed
                        .unwrap_or(mouse.precision_cursor_speed)
                } else {
                    tuning.cursor_speed.unwrap_or(mouse.cursor_speed)
                };
                let seconds =
                    ((now_ms - previous.unwrap_or(now_ms)).clamp(0.0, 50.0) / 1000.0) as f32;
                let scaled = (magnitude.min(1.0) - tuning.stick_deadzone)
                    / (1.0 - tuning.stick_deadzone)
                    / magnitude;
                output.cursor_delta = [x * scaled * speed * seconds, y * scaled * speed * seconds];
            }
            output.mouse_down = mouse
                .click_button
                .and_then(|i| sample.buttons.get(usize::from(i)))
                .copied()
                .unwrap_or(false);
        }
        output
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn key_stays_down_until_its_last_owner_releases_it() {
        let mut keys = KeyOwners::default();
        keys.change(KeyOwner::Tap, "Meta", true);
        keys.change(KeyOwner::Tap, "Meta", true);
        assert_eq!(keys.transitions(false), [("Meta", true)]);
        keys.set(KeyOwner::Pad, vec!["Meta"]);
        keys.change(KeyOwner::Tap, "Meta", false);
        keys.set(KeyOwner::Pad, vec![]);
        assert!(keys.transitions(false).is_empty());
        keys.change(KeyOwner::Tap, "Meta", false);
        assert_eq!(keys.transitions(false), [("Meta", false)]);
    }

    #[test]
    fn pad_rearms_and_filters_reserved_buttons_and_context_macros() {
        let game: GameData = serde_json::from_value(serde_json::json!({
            "pad": {"buttons": {
                "0": {"key":"Meta", "script":"start", "script_when":["title"]},
                "4": {"key":"Shift"}, "6": {"key":"Alt"},
                "8": {"key":"Control"}, "16": {"key":"Space"}
            }}
        }))
        .unwrap();
        let mut router = PadRouter::default();
        let mut pad = PadState::default();
        router.poll(&game, Tuning::default(), Some(pad), 0.0, |_| true);
        for index in [0, 4, 6, 8, 16] {
            pad.buttons[index] = true;
        }
        let press = router.poll(&game, Tuning::default(), Some(pad), 16.0, |_| true);
        assert_eq!(press.script, Some("start"));
        assert!(press.keys.is_empty());
        assert!(router
            .poll(&game, Tuning::default(), Some(pad), 32.0, |_| false)
            .keys
            .is_empty());
        assert!(router
            .poll(&game, Tuning::default(), None, 48.0, |_| false)
            .keys
            .is_empty());
        assert!(router
            .poll(&game, Tuning::default(), Some(pad), 64.0, |_| false)
            .keys
            .is_empty());
        pad.buttons[0] = false;
        router.poll(&game, Tuning::default(), Some(pad), 80.0, |_| false);
        pad.buttons[0] = true;
        assert_eq!(
            router
                .poll(&game, Tuning::default(), Some(pad), 96.0, |_| false)
                .keys,
            ["Meta"]
        );
    }

    #[test]
    fn grid_repeat_obeys_pulse_delay_and_direction_changes() {
        let mut stepper = GridStepper::default();
        let step = StickStep {
            pulse_ms: 30,
            delay_ms: 100,
            repeat_ms: 50,
        };
        for (now, direction, expected) in [
            (0.0, Some(1), Some(1)),
            (30.0, Some(1), None),
            (129.0, Some(1), None),
            (130.0, Some(1), Some(1)),
            (160.0, Some(1), None),
            (210.0, Some(1), Some(1)),
            (215.0, Some(2), Some(2)),
            (220.0, None, None),
        ] {
            assert_eq!(stepper.pulse(direction, step, now), expected);
        }
    }

    #[test]
    fn hybrid_keeps_movement_while_precision_cursor_and_drag_are_active() {
        let game: GameData = serde_json::from_value(serde_json::json!({
            "pad": {"directions": ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]},
            "mouse": {"stick": "right", "click_button": 0, "precision_button": 7}
        }))
        .unwrap();
        game.check().unwrap();
        let tuning = Tuning {
            cursor_speed: Some(600.0),
            precision_cursor_speed: Some(100.0),
            ..Tuning::default()
        };
        let mut router = PadRouter::default();
        let mut pad = PadState::default();
        router.poll(&game, tuning, Some(pad), 0.0, |_| false);
        pad.right = [1.0, 0.0];
        pad.left = [-1.0, 0.0];
        pad.buttons[0] = true;
        let drag = router.poll(&game, tuning, Some(pad), 20.0, |_| false);
        assert_eq!(drag.keys, ["ArrowLeft"]);
        assert!(drag.mouse_down);
        assert_eq!(drag.cursor_delta, [12.0, 0.0]);
        pad.buttons[7] = true;
        let precision = router.poll(&game, tuning, Some(pad), 40.0, |_| false);
        assert_eq!(precision.cursor_delta, [2.0, 0.0]);
        assert!(precision.mouse_down);
        let released = router.poll(&game, tuning, None, 60.0, |_| false);
        assert!(!released.mouse_down);
        assert!(released.keys.is_empty());
    }
}
