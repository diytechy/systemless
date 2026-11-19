//! The guest's one mouse button on the OtterTube add-on page, and the touches
//! the page holds back for a fresh look at the screen: a finger that lands on
//! a spot blocked on some other screen than the one last seen
//! (`ottertube_play::touch_verdict`). While the look is under way the finger
//! can lift, slide off or be cancelled, and another finger can land; this is
//! what each of those comes to. No browser here: the page feeds in pointer
//! events and the look's answer, and carries out the guest pointer actions
//! that come back.
//!
//! The button has one owner at a time: an ordinary press (a finger the page
//! passed straight to the game) or a held-back touch. Whoever comes while it
//! is owned gets nothing: a held-back touch whose look answers then is
//! dropped, and an ordinary press is ignored until the owner lets go. A lost
//! tap is better than a press moved or let go of by someone else. Only the
//! owner moves the pointer while the button is down, and only the owner lets
//! go of it, a tap's timer included. (A script takes the game over: the page
//! drops every held-back touch and lets go of an ordinary press first.)
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
    /// Dropped: blocked after all, lifted far away, cancelled, no look, or the
    /// button is someone else's.
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

/// Who holds the guest's button.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Owner {
    /// A held-back touch, by its number: `at` is where it lets go.
    Held { gesture: u32, at: Point, tap: bool },
    /// An ordinary press, by its pointer: the page lets go of it itself.
    Ordinary { pointer: i32 },
}

#[derive(Debug, Default)]
pub struct Deferred {
    gestures: Vec<Gesture>,
    next: u32,
    owner: Option<Owner>,
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

    fn holds(&self, id: u32) -> bool {
        matches!(self.owner, Some(Owner::Held { gesture, .. }) if gesture == id)
    }

    /// A pointer event. `None` when it is not a held-back finger's: the page
    /// handles it as usual. Otherwise the guest pointer actions it comes to.
    pub fn pointer(&mut self, kind: Kind, pointer: i32, at: Option<Point>) -> Option<Vec<Act>> {
        let index = self
            .gestures
            .iter()
            .position(|gesture| gesture.takes(pointer))?;
        let id = self.gestures[index].id;
        let owns = self.holds(id);
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
                    if owns {
                        acts.push(Act::Move(at));
                        self.owner = Some(Owner::Held {
                            gesture: id,
                            at,
                            tap: false,
                        });
                    }
                }
            }
            (State::Pressing, Kind::Up | Kind::Cancel) => {
                let at = if kind == Kind::Up {
                    at.unwrap_or(gesture.last)
                } else {
                    gesture.last
                };
                if owns {
                    acts.push(Act::Up(at));
                    self.owner = None;
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
        // Blocked after all, given up, or the button is someone else's now.
        if !allowed || !matches!(state, State::Waiting { .. }) || self.owner.is_some() {
            self.gestures.remove(index);
            return Looked::Nothing;
        }
        let mut acts = vec![Act::Move(down), Act::Down(down)];
        if state == (State::Waiting { lifted: true }) {
            self.owner = Some(Owner::Held {
                gesture: id,
                at: last,
                tap: true,
            });
            self.gestures.remove(index);
            Looked::Tap(acts)
        } else {
            if last != down {
                acts.push(Act::Move(last));
            }
            self.owner = Some(Owner::Held {
                gesture: id,
                at: last,
                tap: false,
            });
            self.gestures[index].state = State::Pressing;
            Looked::Press(acts)
        }
    }

    /// A tap's time is up: it lets go, if it still holds the button.
    pub fn tap_over(&mut self, id: u32) -> Vec<Act> {
        match self.owner {
            Some(Owner::Held { gesture, at, .. }) if gesture == id => {
                self.owner = None;
                vec![Act::Up(at)]
            }
            _ => Vec::new(),
        }
    }

    /// An ordinary press wants the button. True when it may have it (it is
    /// free); false when another touch holds it, and the press is ignored.
    pub fn ordinary_down(&mut self, pointer: i32) -> bool {
        if self.owner.is_some() {
            return false;
        }
        self.owner = Some(Owner::Ordinary { pointer });
        true
    }

    /// An ordinary press let go: the button is free, if it was that press's.
    pub fn ordinary_up(&mut self, pointer: i32) {
        if self.owner == Some(Owner::Ordinary { pointer }) {
            self.owner = None;
        }
    }

    /// May an ordinary pointer move the guest's pointer? When the button is
    /// free (a mouse moving over the picture), or that pointer holds it.
    pub fn may_move(&self, pointer: i32) -> bool {
        match self.owner {
            None => true,
            Some(Owner::Ordinary { pointer: owner }) => owner == pointer,
            Some(Owner::Held { .. }) => false,
        }
    }

    /// A script takes the game, or the page goes: every held-back touch is
    /// dropped and a button one holds is let go. (An ordinary press is let go
    /// of by the page, which then calls `ordinary_up`.)
    pub fn drop_all(&mut self) -> Vec<Act> {
        self.gestures.clear();
        match self.owner {
            Some(Owner::Held { at, .. }) => {
                self.owner = None;
                vec![Act::Up(at)]
            }
            _ => Vec::new(),
        }
    }

    /// Who holds the guest's button: a held-back touch that follows its
    /// finger ("held"), one that is a tap ("tap"), an ordinary press
    /// ("ordinary"), or nobody.
    pub fn owner(&self) -> Option<&'static str> {
        self.owner.map(|owner| match owner {
            Owner::Held { tap: true, .. } => "tap",
            Owner::Held { tap: false, .. } => "held",
            Owner::Ordinary { .. } => "ordinary",
        })
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
        assert_eq!(touches.owner(), Some("tap"));
        assert_eq!(touches.tap_over(id), vec![Act::Up(C)]);
        assert_eq!(touches.owner(), None);
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
        assert_eq!(touches.owner(), None);
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
        assert_eq!(touches.owner(), Some("held"));
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
        assert_eq!(touches.owner(), None);
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
        assert_eq!(touches.owner(), None);
    }

    #[test]
    fn a_held_back_touch_whose_look_answers_while_another_holds_the_button_is_dropped() {
        // Two quick taps: the first look answers and taps; the second answers
        // while that tap still holds the button, and is dropped. The first
        // tap's timer then lets go of its own press, and only that.
        let mut touches = Deferred::default();
        let first = touches.begin(7, C);
        touches.pointer(Kind::Up, 7, Some(C));
        let second = touches.begin(8, D);
        touches.pointer(Kind::Up, 8, Some(D));
        assert_eq!(
            touches.looked(first, true),
            Looked::Tap(vec![Act::Move(C), Act::Down(C)])
        );
        assert_eq!(touches.looked(second, true), Looked::Nothing);
        assert_eq!(
            touches.tap_over(second),
            vec![],
            "the dropped tap holds nothing"
        );
        assert_eq!(touches.tap_over(first), vec![Act::Up(C)]);
        // A tap's timer never lets go of a press that is not its own.
        let held = touches.begin(9, D);
        assert!(matches!(touches.looked(held, true), Looked::Press(_)));
        assert_eq!(touches.tap_over(first), vec![]);
        assert_eq!(touches.owner(), Some("held"));
        assert_eq!(
            touches.pointer(Kind::Up, 9, Some(D)),
            Some(vec![Act::Up(D)])
        );
    }

    #[test]
    fn a_held_back_touch_and_an_ordinary_press_never_share_the_button() {
        // C is held back; while its look is under way, a finger on A (not
        // held back) presses. C's look answers while A holds the button: C is
        // dropped, and nothing moves or lets go of A's press.
        let mut touches = Deferred::default();
        let c = touches.begin(1, C);
        touches.pointer(Kind::Up, 1, Some(C));
        assert!(touches.ordinary_down(2), "the button was free");
        assert_eq!(touches.owner(), Some("ordinary"));
        assert_eq!(touches.looked(c, true), Looked::Nothing);
        assert_eq!(touches.tap_over(c), vec![]);
        assert!(touches.may_move(2), "A's own press follows A");
        assert_eq!(touches.drop_all(), vec![], "the page lets go of A itself");
        touches.ordinary_up(2);
        assert_eq!(touches.owner(), None);

        // The other way round: C's tap holds the button, and a finger on A
        // lands meanwhile. A is ignored, and moves nothing, until C lets go.
        let c = touches.begin(3, C);
        touches.pointer(Kind::Up, 3, Some(C));
        assert!(matches!(touches.looked(c, true), Looked::Tap(_)));
        assert!(!touches.ordinary_down(4));
        assert!(!touches.may_move(4));
        assert!(
            !touches.may_move(1),
            "nor does a mouse moving over the picture"
        );
        touches.ordinary_up(4);
        assert_eq!(
            touches.owner(),
            Some("tap"),
            "an ignored press lets go of nothing"
        );
        assert_eq!(touches.tap_over(c), vec![Act::Up(C)]);
        assert!(touches.ordinary_down(4), "free again");

        // A held-back press that follows its finger: an ordinary press is
        // ignored too.
        touches.ordinary_up(4);
        let held = touches.begin(5, D);
        assert!(matches!(touches.looked(held, true), Looked::Press(_)));
        assert!(!touches.ordinary_down(6));
        assert_eq!(
            touches.pointer(Kind::Up, 5, Some(D)),
            Some(vec![Act::Up(D)])
        );
        assert!(touches.ordinary_down(6));
        assert!(touches.may_move(6) && !touches.may_move(7));
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
