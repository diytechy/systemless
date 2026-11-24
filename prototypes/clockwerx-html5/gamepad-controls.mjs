const bindings = Object.freeze({
  swing: 0,
  bounce: 1,
  flip: 2,
  reverse: 3,
  pause: 5,
  restart: 7,
  levels: 9,
});

export function createGamepadControls() {
  let owner = null;
  let previous = {};
  let blocked = {};

  function reset() {
    owner = null;
    previous = {};
    blocked = {};
  }

  return {
    reset,
    disconnect(index) {
      if (owner?.index === index) reset();
    },
    poll(gamepads, focused) {
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
      for (const [action, button] of Object.entries(bindings)) {
        const down = Boolean(pad.buttons?.[button]?.pressed);
        // A button already down when joining must first be released. This also
        // applies on refocus, after a disconnect, and when changing scenes.
        blocked[action] = down && (joining || blocked[action]);
        held[action] = down && !blocked[action];
        pressed[action] = held[action] && !previous[action];
      }
      previous = { ...held };
      return { connected: true, held, pressed };
    },
  };
}
