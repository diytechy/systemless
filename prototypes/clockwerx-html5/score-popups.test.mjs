import assert from 'node:assert/strict';
import test from 'node:test';
import {createScorePopups} from './score-popups.mjs';

test('score popups spawn, drift upward, fade near expiry, and expire cleanly', () => {
  const popups = createScorePopups();
  assert.deepEqual(popups.snapshot(), []);
  assert.equal(popups.spawn({x: NaN, y: 100, text: '+1,000'}), null);
  assert.equal(popups.spawn({x: 100, y: 100, text: '   '}), null);

  const spawned = popups.spawn({x: 200, y: 180, text: '+1,000', subtext: '+10s', duration: 1.0});
  assert.equal(spawned.text, '+1,000');
  assert.equal(spawned.subtext, '+10s');
  assert.equal(spawned.alpha, 1);

  popups.update(0.5);
  let [live] = popups.snapshot();
  assert.ok(live.y < 180);
  assert.equal(live.alpha, 1);

  popups.update(0.35);
  [live] = popups.snapshot();
  assert.ok(live.alpha > 0 && live.alpha < 1);

  popups.update(0.2);
  assert.deepEqual(popups.snapshot(), []);
});

test('score popups reset and cap active count', () => {
  const popups = createScorePopups();
  for (let i = 0; i < 30; i++) popups.spawn({x: 10 + i, y: 100, text: `+${i + 1}`});
  assert.equal(popups.snapshot().length, 24);
  assert.equal(popups.snapshot()[0].text, '+7');
  popups.reset();
  assert.deepEqual(popups.snapshot(), []);
});
