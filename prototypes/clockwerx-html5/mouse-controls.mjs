/**
 * Desktop mouse chord/release recognizer for ClockWerx gameplay on `#game`.
 * - Left held alone => swing
 * - Left + Right held together => flip (and not plain swing)
 * - Right released without Left having been pressed during that Right hold => reverse
 */
export function createMouseControls() {
  let leftDown = false;
  let rightDown = false;
  let rightSawLeft = false;
  let reverses = 0;

  function sync(buttons = 0) {
    const nextLeft = Boolean(buttons & 1);
    const nextRight = Boolean(buttons & 2);
    if (!rightDown && nextRight) {
      rightSawLeft = leftDown || nextLeft;
    } else if (rightDown && nextRight && nextLeft) {
      rightSawLeft = true;
    } else if (rightDown && !nextRight) {
      if (!rightSawLeft) reverses++;
      rightSawLeft = false;
    }
    leftDown = nextLeft;
    rightDown = nextRight;
  }

  function reset() {
    leftDown = false;
    rightDown = false;
    rightSawLeft = false;
    reverses = 0;
  }

  function poll() {
    const held = {
      swing: leftDown && !rightDown,
      flip: leftDown && rightDown,
    };
    const out = { held, reverses };
    reverses = 0;
    return out;
  }

  return {
    sync,
    reset,
    poll,
    get active() { return leftDown || rightDown; },
  };
}
