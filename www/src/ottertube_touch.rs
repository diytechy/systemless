//! Touches the OtterTube add-on page holds back for a fresh look at the
//! screen: a finger that lands on a spot blocked on some other screen than the
//! one last seen (`ottertube_play::touch_verdict`). While the look is under way
//! the finger can lift, slide off or be cancelled, and another finger can
//! land; this is what each of those comes to. No browser here: the page feeds
//! in pointer events and the look's answer, and carries out the guest pointer
//! actions that come back.
//!
//! Each held-back touch is a gesture with its own number. The guest has one
//! mouse button; the gesture that holds it now is recorded, and only that
//! gesture can let it go, so the timer of an older tap never lifts a newer
//! press.
#![cfg_attr(not(feature = "ottertube"), allow(dead_code))]

/// Where a finger is on the guest's screen, `(v, h)`, before the game's offset.
pub type Point = (i16, i16);

/// A finger that moves further than this from where it landed, while the look
/// is under way, was not a tap: it is dropped.
pub const SLOP: i16 = 6;

/// What the guest's pointer is to do, at a finger's point.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Act {
    Move(Point),
    Down(Point),
    Up(Point),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Kind {
    Move,
    Up,
    Cancel,
}

/// What the look's answer comes to.
#[derive(Debug, PartialEq, Eq)]
pub enum Looked {
    /// Dropped: blocked after all, lifted far away, cancelled, or no look.
    Nothing,
    /// The finger is still down: the press starts now and follows the finger.
    Press(Vec<Act>),
    /// The finger has lifted: a tap. The caller waits, then calls `tap_over`.
    Tap(Vec<Act>),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum State {
    Waiting { lifted: bool },
    Dropped,
    Pressing,
}

#[derive(Debug)]
struct Gesture {
    id: u32,
    pointer: i32,
    down: Point,
    last: Point,
    state: State,
}

impl Gesture {
    /// Does a pointer event for `pointer` belong to this gesture? Only while
    /// its finger is down: once lifted, the same pointer number is someone
    /// else's (a mouse always has the same one).
    fn takes(&self, pointer: i32) -> bool {
        self.pointer == pointer
            && matches!(
                self.state,
                State::Waiting { lifted: false } | State::Pressing
            )
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct Press {
    gesture: u32,
    at: Point,
    synthetic: bool,
}

#[derive(Debug, Default)]
pub struct Deferred {
    gestures: Vec<Gesture>,
    next: u32,
    press: Option<Press>,
}

fn far(a: Point, b: Point) -> bool {
    (i32::from(a.0) - i32::from(b.0)).abs() > i32::from(SLOP)
        || (i32::from(a.1) - i32::from(b.1)).abs() > i32::from(SLOP)
}

impl Deferred {
    /// A finger landed and was held back. Its gesture number, for the look.
    pub fn begin(&mut self, pointer: i32, at: Point) -> u32 {
        // The same pointer cannot be down twice: an earlier gesture of it that
        // never saw its finger lift is over.
        for gesture in self
            .gestures
            .iter_mut()
            .filter(|gesture| gesture.takes(pointer))
        {
            gesture.state = State::Dropped;
        }
        self.next = self.next.wrapping_add(1);
        self.gestures.push(Gesture {
            id: self.next,
            pointer,
            down: at,
            last: at,
            state: State::Waiting { lifted: false },
        });
        self.next
    }

    /// A pointer event. `None` when it is not a held-back finger's: the page
    /// handles it as usual. Otherwise the guest pointer actions it comes to.
    pub fn pointer(&mut self, kind: Kind, pointer: i32, at: Option<Point>) -> Option<Vec<Act>> {
        let index = self
            .gestures
            .iter()
            .position(|gesture| gesture.takes(pointer))?;
        let owner = self.press.map(|press| press.gesture);
        let gesture = &mut self.gestures[index];
        let mut acts = Vec::new();
        match (gesture.state, kind) {
            (State::Waiting { .. }, Kind::Cancel) => gesture.state = State::Dropped,
            (State::Waiting { .. }, Kind::Move | Kind::Up) => {
                let at = at.unwrap_or(gesture.last);
                if far(gesture.down, at) {
                    gesture.state = State::Dropped;
                } else {
                    gesture.last = at;
                    if kind == Kind::Up {
                        gesture.state = State::Waiting { lifted: true };
                    }
                }
            }
            (State::Pressing, Kind::Move) => {
                if let Some(at) = at {
                    gesture.last = at;
                    if owner == Some(gesture.id) {
                        acts.push(Act::Move(at));
                    }
                }
            }
            (State::Pressing, Kind::Up | Kind::Cancel) => {
                let at = if kind == Kind::Up {
                    at.unwrap_or(gesture.last)
                } else {
                    gesture.last
                };
                if owner == Some(gesture.id) {
                    acts.push(Act::Up(at));
                    self.press = None;
                }
                self.gestures.remove(index);
            }
            (State::Dropped, _) => {}
        }
        Some(acts)
    }

    /// The look for gesture `id` has answered: `allowed` when the spot is not
    /// blocked on the screen it found (and the page takes input).
    pub fn looked(&mut self, id: u32, allowed: bool) -> Looked {
        let Some(index) = self.gestures.iter().position(|gesture| gesture.id == id) else {
            return Looked::Nothing;
        };
        let state = self.gestures[index].state;
        let (down, last) = (self.gestures[index].down, self.gestures[index].last);
        if !allowed || !matches!(state, State::Waiting { .. }) {
            self.gestures.remove(index);
            return Looked::Nothing;
        }
        // The guest's one button: whatever holds it lets go first.
        let mut acts = self.release();
        acts.push(Act::Move(down));
        acts.push(Act::Down(down));
        let index = self
            .gestures
            .iter()
            .position(|gesture| gesture.id == id)
            .expect("release keeps other gestures");
        if state == (State::Waiting { lifted: true }) {
            self.press = Some(Press {
                gesture: id,
                at: last,
                synthetic: true,
            });
            self.gestures.remove(index);
            Looked::Tap(acts)
        } else {
            if last != down {
                acts.push(Act::Move(last));
            }
            self.press = Some(Press {
                gesture: id,
                at: last,
                synthetic: false,
            });
            self.gestures[index].state = State::Pressing;
            Looked::Press(acts)
        }
    }

    /// A tap's time is up: it lets go, if it still holds the button.
    pub fn tap_over(&mut self, id: u32) -> Vec<Act> {
        match self.press {
            Some(press) if press.gesture == id => {
                self.press = None;
                vec![Act::Up(press.at)]
            }
            _ => Vec::new(),
        }
    }

    /// A script takes the game, or the page goes: every held-back touch is
    /// dropped and the button is let go.
    pub fn drop_all(&mut self) -> Vec<Act> {
        let acts = self.release();
        self.gestures.clear();
        acts
    }

    /// What holds the guest's button now: a press that follows a finger
    /// ("held"), a tap ("tap"), or nothing.
    pub fn pressed(&self) -> Option<&'static str> {
        self.press
            .map(|press| if press.synthetic { "tap" } else { "held" })
    }

    fn release(&mut self) -> Vec<Act> {
        let Some(press) = self.press.take() else {
            return Vec::new();
        };
        // A press that followed a finger is over: that finger's later events
        // are nobody's.
        if !press.synthetic {
            self.gestures.retain(|gesture| gesture.id != press.gesture);
        }
        vec![Act::Up(press.at)]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const C: Point = (333, 123);
    const D: Point = (333, 172);

    #[test]
    fn a_tap_lifted_before_the_look_is_made_once_the_look_allows_it() {
        let mut touches = Deferred::default();
        let id = touches.begin(7, C);
        assert_eq!(touches.pointer(Kind::Up, 7, Some(C)), Some(vec![]));
        assert_eq!(
            touches.looked(id, true),
            Looked::Tap(vec![Act::Move(C), Act::Down(C)])
        );
        assert_eq!(touches.pressed(), Some("tap"));
        assert_eq!(touches.tap_over(id), vec![Act::Up(C)]);
        assert_eq!(touches.pressed(), None);
        assert_eq!(touches.tap_over(id), vec![], "let go once");
    }

    #[test]
    fn a_blocked_spot_or_a_missing_look_makes_nothing() {
        let mut touches = Deferred::default();
        let id = touches.begin(7, C);
        touches.pointer(Kind::Up, 7, Some(C));
        assert_eq!(touches.looked(id, false), Looked::Nothing);
        assert_eq!(
            touches.looked(id, true),
            Looked::Nothing,
            "the gesture is gone"
        );
    }

    #[test]
    fn a_touch_cancelled_while_the_look_is_under_way_makes_nothing() {
        let mut touches = Deferred::default();
        let id = touches.begin(7, C);
        assert_eq!(touches.pointer(Kind::Cancel, 7, None), Some(vec![]));
        assert_eq!(touches.looked(id, true), Looked::Nothing);
        assert_eq!(touches.pressed(), None);
    }

    #[test]
    fn a_finger_that_slides_away_while_the_look_is_under_way_makes_nothing() {
        let mut touches = Deferred::default();
        let id = touches.begin(7, C);
        touches.pointer(Kind::Move, 7, Some((C.0 - 40, C.1 + 60)));
        assert_eq!(
            touches.pointer(Kind::Up, 7, Some((C.0 - 40, C.1 + 60))),
            None,
            "dropped: its later events are not held back"
        );
        assert_eq!(touches.looked(id, true), Looked::Nothing);
        // A finger that lifts far away, without a move first, is dropped too.
        let id = touches.begin(8, C);
        touches.pointer(Kind::Up, 8, Some((C.0, C.1 + 20)));
        assert_eq!(touches.looked(id, true), Looked::Nothing);
        // A finger that only wobbles is still a tap.
        let id = touches.begin(9, C);
        touches.pointer(Kind::Move, 9, Some((C.0 + 2, C.1 - 3)));
        touches.pointer(Kind::Up, 9, Some((C.0 + 2, C.1 - 3)));
        assert!(matches!(touches.looked(id, true), Looked::Tap(_)));
    }

    #[test]
    fn a_finger_still_down_when_the_look_answers_presses_until_it_lifts() {
        let mut touches = Deferred::default();
        let id = touches.begin(7, C);
        touches.pointer(Kind::Move, 7, Some((C.0 + 1, C.1)));
        assert_eq!(
            touches.looked(id, true),
            Looked::Press(vec![Act::Move(C), Act::Down(C), Act::Move((C.0 + 1, C.1))])
        );
        assert_eq!(touches.pressed(), Some("held"));
        // Now it follows the finger, however far.
        let away = (C.0 + 50, C.1 + 50);
        assert_eq!(
            touches.pointer(Kind::Move, 7, Some(away)),
            Some(vec![Act::Move(away)])
        );
        assert_eq!(
            touches.pointer(Kind::Up, 7, Some(away)),
            Some(vec![Act::Up(away)])
        );
        assert_eq!(touches.pressed(), None);
        assert_eq!(touches.pointer(Kind::Move, 7, Some(away)), None);
    }

    #[test]
    fn a_press_cancelled_after_the_look_lets_go_where_the_finger_was() {
        let mut touches = Deferred::default();
        let id = touches.begin(7, C);
        touches.looked(id, true);
        assert_eq!(
            touches.pointer(Kind::Cancel, 7, None),
            Some(vec![Act::Up(C)])
        );
        assert_eq!(touches.pressed(), None);
    }

    #[test]
    fn an_older_taps_timer_never_lets_go_of_a_newer_press() {
        // Two quick taps: each look answers, each takes the button in turn.
        let mut touches = Deferred::default();
        let first = touches.begin(7, C);
        touches.pointer(Kind::Up, 7, Some(C));
        let second = touches.begin(8, D);
        touches.pointer(Kind::Up, 8, Some(D));
        assert_eq!(
            touches.looked(first, true),
            Looked::Tap(vec![Act::Move(C), Act::Down(C)])
        );
        assert_eq!(
            touches.looked(second, true),
            Looked::Tap(vec![Act::Up(C), Act::Move(D), Act::Down(D)]),
            "the first tap lets go before the second presses"
        );
        assert_eq!(touches.tap_over(first), vec![], "the first tap's timer");
        assert_eq!(touches.pressed(), Some("tap"));
        assert_eq!(touches.tap_over(second), vec![Act::Up(D)]);
        // A tap, then a finger held: the tap's timer leaves the held press alone.
        let tap = touches.begin(9, C);
        touches.pointer(Kind::Up, 9, Some(C));
        let held = touches.begin(10, D);
        assert!(matches!(touches.looked(tap, true), Looked::Tap(_)));
        assert!(matches!(touches.looked(held, true), Looked::Press(_)));
        assert_eq!(touches.tap_over(tap), vec![]);
        assert_eq!(touches.pressed(), Some("held"));
        assert_eq!(
            touches.pointer(Kind::Up, 10, Some(D)),
            Some(vec![Act::Up(D)])
        );
    }

    #[test]
    fn a_pointer_that_lands_again_ends_its_earlier_gesture() {
        let mut touches = Deferred::default();
        let first = touches.begin(1, C);
        let second = touches.begin(1, D);
        assert_eq!(touches.looked(first, true), Looked::Nothing);
        assert!(matches!(touches.looked(second, true), Looked::Press(_)));
    }

    #[test]
    fn a_script_or_leaving_drops_everything_and_lets_go() {
        let mut touches = Deferred::default();
        let held = touches.begin(7, C);
        touches.looked(held, true);
        let waiting = touches.begin(8, D);
        assert_eq!(touches.drop_all(), vec![Act::Up(C)]);
        assert_eq!(touches.looked(waiting, true), Looked::Nothing);
        assert_eq!(touches.pointer(Kind::Up, 7, Some(C)), None);
        assert_eq!(touches.drop_all(), vec![]);
    }
}
