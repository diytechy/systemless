import assert from 'node:assert/strict';
import test from 'node:test';
import {createGamepadControls, detectPadFamily, readMenuDirection} from './gamepad-controls.mjs';
import {createMouseControls} from './mouse-controls.mjs';

function pad(down = [], overrides = {}) {
  return {
    index: 0, id: 'standard pad', mapping: 'standard', connected: true,
    buttons: Array.from({length: 17}, (_, i) => ({pressed: down.includes(i)})),
    ...overrides,
  };
}

const active = actions => Object.keys(actions).filter(action => actions[action]);

test('face buttons supply held actions with Circle/B reverse and Triangle/Y bounce', () => {
  const controller = createGamepadControls();
  controller.poll([pad()], true);
  const all = [0, 1, 2, 3, 5, 7, 9];
  const actions = ['swing', 'reverse', 'flip', 'bounce', 'pause', 'restart', 'levels'];
  let state = controller.poll([pad(all)], true);
  assert.deepEqual(active(state.held), actions);
  assert.deepEqual(active(state.pressed), actions);
  state = controller.poll([pad(all)], true);
  assert.deepEqual(active(state.held), actions);
  assert.deepEqual(active(state.pressed), []);
  assert.deepEqual(active(controller.poll([pad()], true).held), []);
  assert.deepEqual(active(controller.poll([pad([1])], true).pressed), ['reverse']);
  assert.deepEqual(active(controller.poll([pad([3])], true).pressed), ['bounce']);
});

test('reserved buttons, other buttons and axes supply no game input', () => {
  const controller = createGamepadControls();
  controller.poll([pad()], true);
  const state = controller.poll([pad([4, 6, 8, 10, 11, 12, 13, 14, 15, 16], {axes: [1, -1]})], true);
  assert.deepEqual(active(state.held), []);
  assert.deepEqual(active(state.pressed), []);
});

test('refocus and reset require a fresh press for each button that was down', () => {
  const controller = createGamepadControls();
  controller.poll([pad()], true);
  assert.equal(controller.poll([pad([0, 1])], true).held.swing, true);
  assert.deepEqual(controller.poll([pad([0, 1])], false).held, {});
  assert.deepEqual(active(controller.poll([pad([0, 1])], true).held), []);
  assert.deepEqual(active(controller.poll([pad([0, 5])], true).pressed), ['pause']);
  assert.deepEqual(active(controller.poll([pad([0, 1, 5])], true).pressed), ['reverse']);
  controller.reset();
  assert.deepEqual(active(controller.poll([pad([9])], true).pressed), []);
});

test('a single connected standard controller owns input through list reordering and disconnect', () => {
  const controller = createGamepadControls();
  const second = buttons => pad(buttons, {index: 1, id: 'second'});
  assert.equal(controller.poll([null, pad([], {mapping: ''})], true).connected, false);
  controller.poll([second([]), pad()], true);
  assert.deepEqual(active(controller.poll([pad([0]), second([2])], true).held), ['flip']);
  controller.disconnect(0);
  assert.deepEqual(active(controller.poll([second([2])], true).held), ['flip']);
  assert.deepEqual(active(controller.poll([pad([0]), {...second([2]), connected: false}], true).held), []);
  controller.poll([pad()], true);
  assert.equal(controller.poll([pad([0])], true).held.swing, true);
  controller.disconnect(0);
  assert.deepEqual(active(controller.poll([pad([0])], true).held), []);
  assert.deepEqual(controller.poll([], true).held, {});
});

test('detects PlayStation vs Xbox pad families without misclassifying Xbox Wireless Controller', () => {
  assert.equal(detectPadFamily('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)'), 'playstation');
  assert.equal(detectPadFamily('Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)'), 'playstation');
  assert.equal(detectPadFamily('DualShock 4'), 'playstation');
  assert.equal(detectPadFamily('PLAYSTATION(R)3 Controller'), 'playstation');
  assert.equal(detectPadFamily('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)'), 'xbox');
  assert.equal(detectPadFamily('Xbox 360 Controller (XInput STANDARD GAMEPAD)'), 'xbox');
  assert.equal(detectPadFamily('standard pad'), null);
  assert.equal(detectPadFamily(''), null);

  const controller = createGamepadControls();
  assert.equal(controller.poll([], true).padFamily, null);
  assert.equal(controller.poll([pad([], {id: 'DualSense Wireless Controller'})], true).padFamily, 'playstation');
  controller.disconnect(0);
  assert.equal(controller.poll([pad([], {id: 'Xbox Wireless Controller (045e)'})], true).padFamily, 'xbox');
});

test('menus read the dominant left stick axis and prioritize the standard D-pad', () => {
  assert.equal(readMenuDirection(pad([], {axes: [.54, -.2, 1, 1]})), null);
  assert.equal(readMenuDirection(pad([], {axes: [.6, -.8]})), 'up');
  assert.equal(readMenuDirection(pad([], {axes: [-.9, .6]})), 'left');
  assert.equal(readMenuDirection(pad([], {axes: [.55, 0]})), 'right');
  assert.equal(readMenuDirection(pad([], {axes: [0, .9]})), 'down');
  for (const [button, direction] of [[12, 'up'], [13, 'down'], [14, 'left'], [15, 'right']]) {
    assert.equal(readMenuDirection(pad([button], {axes: [1, 1]})), direction);
  }
});

test('menu directional input repeats, while menu face and shoulder buttons remain press-edge actions', () => {
  const controller = createGamepadControls();
  const right = pad([0, 15]);
  assert.equal(controller.poll([pad()], true, 0).direction, undefined);
  assert.equal(controller.poll([right], true, 10).direction, 'right');
  assert.equal(controller.poll([right], true, 339).direction, undefined);
  const repeated = controller.poll([right], true, 340);
  assert.equal(repeated.direction, 'right');
  assert.deepEqual(active(repeated.pressed), []);
  assert.equal(controller.poll([right], true, 449).direction, undefined);
  assert.equal(controller.poll([right], true, 450).direction, 'right');
  assert.equal(controller.poll([pad([12])], true, 460).direction, 'up');
  assert.equal(controller.poll([pad([12])], true).direction, undefined);
});

test('menu input requires focus and a neutral stick or D-pad after reconnect or reset', () => {
  const controller = createGamepadControls();
  const heldUp = pad([9], {axes: [0, -1]});
  assert.equal(controller.poll([heldUp], false, 0).connected, false);
  assert.equal(controller.poll([heldUp], true, 1).direction, undefined);
  assert.equal(controller.poll([pad([13])], true, 100).direction, undefined);
  controller.poll([pad()], true, 200);
  assert.equal(controller.poll([heldUp], true, 201).direction, 'up');
  controller.disconnect(0);
  assert.equal(controller.poll([heldUp], true, 202).direction, undefined);
  controller.poll([], true, 203);
  assert.equal(controller.poll([heldUp], true, 204).direction, undefined);
  controller.reset();
  assert.deepEqual(active(controller.poll([heldUp], true, 205).pressed), []);
});

test('reserved buttons are never read in gameplay or menus', () => {
  const reserved = new Set([4, 6, 8, 16]);
  const pressed = pad([...reserved]);
  pressed.buttons = new Proxy(pressed.buttons, {
    get(target, key) {
      assert.ok(!reserved.has(Number(key)), 'reserved button read');
      return Reflect.get(target, key);
    },
  });
  const controller = createGamepadControls();
  controller.poll([pad()], true);
  const gameplay = controller.poll([pressed], true);
  const menu = controller.poll([pressed], true, 100);
  assert.deepEqual(active(gameplay.held), []);
  assert.deepEqual(active(menu.held), []);
  assert.deepEqual(active(menu.pressed), []);
  assert.equal(menu.direction, undefined);
});

test('desktop mouse controls handle swing, chord flip, and solo right-click reverse', () => {
  const mouse = createMouseControls();

  // Left hold => swing; release => nothing.
  mouse.sync(1);
  assert.deepEqual(mouse.poll(), {held: {swing: true, flip: false}, reverses: 0});
  mouse.sync(0);
  assert.deepEqual(mouse.poll(), {held: {swing: false, flip: false}, reverses: 0});

  // Right hold alone => nothing while held, 1 reverse on release.
  mouse.sync(2);
  assert.deepEqual(mouse.poll(), {held: {swing: false, flip: false}, reverses: 0});
  mouse.sync(0);
  assert.deepEqual(mouse.poll(), {held: {swing: false, flip: false}, reverses: 1});
  assert.equal(mouse.poll().reverses, 0);

  // Left held, then Right pressed => flip (not swing); releasing Right returns to swing with no reverse.
  mouse.sync(1);
  assert.deepEqual(mouse.poll().held, {swing: true, flip: false});
  mouse.sync(3);
  assert.deepEqual(mouse.poll(), {held: {swing: false, flip: true}, reverses: 0});
  mouse.sync(1);
  assert.deepEqual(mouse.poll(), {held: {swing: true, flip: false}, reverses: 0});
  mouse.sync(0);
  assert.deepEqual(mouse.poll(), {held: {swing: false, flip: false}, reverses: 0});

  // Right pressed first, then Left pressed => flip; releasing Left then Right emits NO reverse.
  mouse.sync(2);
  assert.deepEqual(mouse.poll().held, {swing: false, flip: false});
  mouse.sync(3);
  assert.deepEqual(mouse.poll().held, {swing: false, flip: true});
  mouse.sync(2);
  assert.deepEqual(mouse.poll(), {held: {swing: false, flip: false}, reverses: 0});
  mouse.sync(0);
  assert.deepEqual(mouse.poll(), {held: {swing: false, flip: false}, reverses: 0});

  // Reset clears active buttons without emitting a reverse.
  mouse.sync(2);
  assert.equal(mouse.active, true);
  mouse.reset();
  assert.equal(mouse.active, false);
  assert.deepEqual(mouse.poll(), {held: {swing: false, flip: false}, reverses: 0});
});
