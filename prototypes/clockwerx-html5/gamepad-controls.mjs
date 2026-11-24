import bindings from './gamepad-bindings.json' with {type: 'json'};

const reserved = new Set([4, 6, 8, 16]);
const directions = [['up', 12], ['down', 13], ['left', 14], ['right', 15]];

export function readMenuDirection(pad, deadzone = 0.55) {
  const dpad = directions.find(([, button]) => pad.buttons?.[button]?.pressed);
  if (dpad) return dpad[0];
  const [x = 0, y = 0] = pad.axes ?? [];
  if (Math.max(Math.abs(x), Math.abs(y)) < deadzone) return null;
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'up' : 'down';
}

export function createGamepadControls() {
  let owner = null;
  let previous = {};
  let blocked = {};
  let previousDirection = null;
  let directionBlocked = false;
  let nextDirectionAt = 0;

  function reset() {
    owner = null;
    previous = {};
    blocked = {};
    previousDirection = null;
    directionBlocked = false;
    nextDirectionAt = 0;
  }

  return {
    reset,
    disconnect(index) {
      if (owner?.index === index) reset();
    },
    poll(gamepads, focused, menuTime) {
      const standard = Array.from(gamepads).filter(pad =>
        pad && pad.connected !== false && pad.mapping === 'standard');
      const samePad = pad => pad.index === owner?.index && pad.id === owner?.id;
      const pad = standard.find(samePad) ?? standard[0];
      if (!focused || !pad) {
        reset();
        return { connected: false, held: {}, pressed: {} };
      }

      const joining = !owner || !samePad(pad);
      owner = { index: pad.index, id: pad.id };
      const held = {};
      const pressed = {};
      for (const [action, {button}] of Object.entries(bindings)) {
        if (reserved.has(button)) continue;
        const down = Boolean(pad.buttons?.[button]?.pressed);
        // A button already down when joining must first be released. This also
        // applies on refocus, after a disconnect, and when changing scenes.
        blocked[action] = down && (joining || blocked[action]);
        held[action] = down && !blocked[action];
        pressed[action] = held[action] && !previous[action];
      }
      previous = { ...held };
      const state = {connected: true, held, pressed};
      if (menuTime !== undefined) {
        const direction = readMenuDirection(pad);
        directionBlocked = Boolean(direction && (joining || directionBlocked));
        if (direction && !directionBlocked && (direction !== previousDirection || menuTime >= nextDirectionAt)) {
          state.direction = direction;
          nextDirectionAt = menuTime + (direction === previousDirection ? 110 : 330);
        }
        previousDirection = direction;
      }
      return state;
    },
  };
}
