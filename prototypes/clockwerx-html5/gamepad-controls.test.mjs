import assert from 'node:assert/strict';
import test from 'node:test';
import {createGamepadControls} from './gamepad-controls.mjs';

function pad(down = [], overrides = {}) {
  return {
    index: 0, id: 'standard pad', mapping: 'standard', connected: true,
    buttons: Array.from({length: 17}, (_, i) => ({pressed: down.includes(i)})),
    ...overrides,
  };
}

const active = actions => Object.keys(actions).filter(action => actions[action]);

test('face buttons supply held actions; reverse and menu commands have one press edge', () => {
  const controller = createGamepadControls();
  controller.poll([pad()], true);
  const all = [0, 1, 2, 3, 5, 7, 9];
  const actions = ['swing', 'bounce', 'flip', 'reverse', 'pause', 'restart', 'levels'];
  let state = controller.poll([pad(all)], true);
  assert.deepEqual(active(state.held), actions);
  assert.deepEqual(active(state.pressed), actions);
  state = controller.poll([pad(all)], true);
  assert.deepEqual(active(state.held), actions);
  assert.deepEqual(active(state.pressed), []);
  assert.deepEqual(active(controller.poll([pad()], true).held), []);
  assert.deepEqual(active(controller.poll([pad([3])], true).pressed), ['reverse']);
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
  assert.equal(controller.poll([pad([0, 3])], true).held.swing, true);
  assert.deepEqual(controller.poll([pad([0, 3])], false).held, {});
  assert.deepEqual(active(controller.poll([pad([0, 3])], true).held), []);
  assert.deepEqual(active(controller.poll([pad([0, 5])], true).pressed), ['pause']);
  assert.deepEqual(active(controller.poll([pad([0, 3, 5])], true).pressed), ['reverse']);
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
