import bindings from './gamepad-bindings.json' with {type: 'json'};

const reserved = new Set([4, 6, 8, 16]);
const directions = [['up', 12], ['down', 13], ['left', 14], ['right', 15]];

export function detectPadFamily(id = '') {
  if (typeof id !== 'string' || !id) return null;
  if (/dualshock|dualsense|playstation|054c/i.test(id)) return 'playstation';
  if (/xbox|xinput|045e/i.test(id)) return 'xbox';
  if (/wireless controller/i.test(id)) return 'playstation';
  return null;
}

export function readMenuDirection(pad, deadzone = 0.55) {
  const dpad = directions.find(([, button]) => pad.buttons?.[button]?.pressed);
  if (dpad) return dpad[0];
  const [x = 0, y = 0] = pad.axes ?? [];
  if (Math.max(Math.abs(x), Math.abs(y)) < deadzone) return null;
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'up' : 'down';
}

function createPadSlot() {
  return {
    owner: null,
    previous: {},
    blocked: {},
    previousDirection: null,
    directionBlocked: false,
    nextDirectionAt: 0,
  };
}

function resetSlotState(slot) {
  slot.owner = null;
  slot.previous = {};
  slot.blocked = {};
  slot.previousDirection = null;
  slot.directionBlocked = false;
  slot.nextDirectionAt = 0;
}

const sameOwner = (owner, pad) => Boolean(owner && pad && pad.index === owner.index && pad.id === owner.id);

function readSlot(slot, pad, menuTime) {
  if (!pad) {
    resetSlotState(slot);
    return { connected: false, padFamily: null, held: {}, pressed: {} };
  }
  const joining = !sameOwner(slot.owner, pad);
  slot.owner = { index: pad.index, id: pad.id };
  const held = {};
  const pressed = {};
  for (const [action, {button}] of Object.entries(bindings)) {
    if (reserved.has(button)) continue;
    const down = Boolean(pad.buttons?.[button]?.pressed);
    // A button already down when joining must first be released. This also
    // applies on refocus, after a disconnect, and when changing scenes.
    slot.blocked[action] = down && (joining || slot.blocked[action]);
    held[action] = down && !slot.blocked[action];
    pressed[action] = held[action] && !slot.previous[action];
  }
  slot.previous = { ...held };
  const state = { connected: true, padFamily: detectPadFamily(pad.id), held, pressed };
  if (menuTime !== undefined) {
    const direction = readMenuDirection(pad);
    slot.directionBlocked = Boolean(direction && (joining || slot.directionBlocked));
    if (direction && !slot.directionBlocked && (direction !== slot.previousDirection || menuTime >= slot.nextDirectionAt)) {
      state.direction = direction;
      slot.nextDirectionAt = menuTime + (direction === slot.previousDirection ? 110 : 330);
    }
    slot.previousDirection = direction;
  }
  return state;
}

export function createGamepadControls() {
  const slot1 = createPadSlot();
  const slot2 = createPadSlot();

  function reset() {
    resetSlotState(slot1);
    resetSlotState(slot2);
  }

  return {
    reset,
    disconnect(index) {
      if (slot1.owner?.index === index) resetSlotState(slot1);
      if (slot2.owner?.index === index) resetSlotState(slot2);
    },
    poll(gamepads, focused, menuTime) {
      const standard = Array.from(gamepads).filter(pad =>
        pad && pad.connected !== false && pad.mapping === 'standard');
      if (!focused || !standard.length) {
        reset();
        return {
          connected: false,
          padFamily: null,
          held: {},
          pressed: {},
          connectedCount: 0,
          player2: { connected: false, padFamily: null, held: {}, pressed: {} },
        };
      }

      const pad1 = standard.find(pad => sameOwner(slot1.owner, pad))
        ?? standard.find(pad => !sameOwner(slot2.owner, pad))
        ?? standard[0];
      const remaining = standard.filter(pad => pad !== pad1);
      const pad2 = remaining.find(pad => sameOwner(slot2.owner, pad)) ?? remaining[0] ?? null;

      const state1 = readSlot(slot1, pad1, menuTime);
      const state2 = readSlot(slot2, pad2, undefined);
      return {
        ...state1,
        connectedCount: (state1.connected ? 1 : 0) + (state2.connected ? 1 : 0),
        player2: state2,
      };
    },
  };
}
