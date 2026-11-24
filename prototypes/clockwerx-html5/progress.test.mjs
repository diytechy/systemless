import assert from 'node:assert/strict';
import test from 'node:test';
import {readProgress,recordCompletion} from './progress.mjs';

test('migrates legacy preferences and completion counts within the same storage key', () => {
  assert.deepEqual(readProgress('{"black":true,"completed":6,"sound":true}'), {
    schema: 'clockwerx-html5-progress/1', black: true, completed: 6,
    completedLevels: [], lastLevel: null,
  });
});

test('exports and reloads unique cleared levels, last selection and total runs', () => {
  const progress = readProgress(null);
  progress.lastLevel = 100;
  recordCompletion(progress, 100);
  recordCompletion(progress, 1);
  recordCompletion(progress, 100);
  recordCompletion(progress);
  assert.equal(progress.completed, 4);
  assert.deepEqual(progress.completedLevels, [1, 100]);
  assert.deepEqual(readProgress(JSON.stringify(progress)), progress);
});

test('malformed progress defaults safely and out-of-range solo levels are ignored', () => {
  const defaults = readProgress();
  assert.deepEqual(readProgress('{'), defaults);
  assert.deepEqual(readProgress('{"completed":-1,"lastLevel":101,"black":"yes","completedLevels":[1,0,"7",1]}'),
    {...defaults, completedLevels: [1]});
});
