import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readProgress, recordCompletion, readSlotStore, migrateLegacyProgress, recordSlotLevelCompletion,
  resetSlot, isLevelUnlocked, slotSummary, updateSlot,
} from './progress.mjs';

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

test('new stores have four independent Roman slots and sound and music default on', () => {
  const store = readSlotStore(null);
  assert.equal(store.activeSlotId, 1);
  assert.deepEqual(store.slots.map(slot => slotSummary(slot).label), ['I', 'II', 'III', 'IV']);
  for (const slot of store.slots) {
    assert.deepEqual(slot, {
      id: slot.id, started: false, currentLevel: 1, completedLevels: [], bestLevelScores: {},
      campaignScore: 0, black: false, sound: true, music: true, freePlay: false, updatedUtc: null,
    });
  }
  assert.notEqual(store.slots[0].bestLevelScores, store.slots[1].bestLevelScores);
});

test('legacy migration preserves the selected level, hand and known clears in Slot I', () => {
  const legacy = readProgress('{"black":true,"completed":4,"completedLevels":[9,3,3],"lastLevel":6}');
  const store = migrateLegacyProgress(legacy);
  assert.deepEqual(store.slots[0], {
    id: 1, started: true, currentLevel: 6, completedLevels: [3, 9], bestLevelScores: {},
    campaignScore: 0, black: true, sound: true, music: true, freePlay: false, updatedUtc: null,
  });
  assert.deepEqual(store.slots.slice(1), readSlotStore().slots.slice(1));
  assert.equal(migrateLegacyProgress(readProgress('{"completedLevels":[2]}')).slots[0].currentLevel, 3);
  assert.equal(migrateLegacyProgress(readProgress('{"completedLevels":[100]}')).slots[0].currentLevel, 100);
  assert.equal(migrateLegacyProgress(readProgress('{"completed":5}')).slots[0].started, true);
  assert.equal(migrateLegacyProgress(readProgress('{"black":true}')).slots[0].started, false);
});

test('clear scores accrue once per level plus improvements, only in the selected slot', () => {
  const empty = readSlotStore();
  const timestamp = '2026-11-24T16:00:00.000Z';
  const clear = (store, level, score) => recordSlotLevelCompletion(store, 2, level, score, 100, timestamp);
  const first = clear(empty, 3, 6000);
  const another = clear(first, 1, 3000);
  const equal = clear(another, 3, 6000);
  const lower = clear(equal, 3, 1000);
  const better = clear(lower, 3, 9000);
  assert.equal(empty.slots[1].campaignScore, 0);
  assert.equal(first.slots[1].campaignScore, 6000);
  assert.deepEqual(lower, another);
  assert.deepEqual(equal, another);
  assert.deepEqual(better.slots[1], {
    id: 2, started: true, currentLevel: 4, completedLevels: [1, 3], bestLevelScores: {1: 3000, 3: 9000},
    campaignScore: 12000, black: false, sound: true, music: true, freePlay: false, updatedUtc: timestamp,
  });
  assert.equal(better.slots[1].campaignScore - lower.slots[1].campaignScore, 3000);
  for (const index of [0, 2, 3]) assert.equal(better.slots[index], empty.slots[index]);
  assert.equal(recordSlotLevelCompletion(better, 2, 100, 1000, 100).slots[1].currentLevel, 100);
  assert.equal(recordSlotLevelCompletion(better, 2, 8, 1000, 8).slots[1].currentLevel, 8);
});

test('malformed saves cannot inject totals, uncleared scores or out-of-range slot data', () => {
  assert.deepEqual(readSlotStore('{'), readSlotStore());
  const store = readSlotStore(JSON.stringify({
    activeSlotId: 5, slots: [null, {
      id: 3, currentLevel: 103, completedLevels: [10, 10, 7, 2, '1', 101],
      campaignScore: 9999, bestLevelScores: {1: 900, 2: 1200, 7: -1, 10: '3000'},
      black: true, sound: false, music: false, freePlay: true, updatedUtc: 'bad time',
    }],
  }));
  assert.equal(store.activeSlotId, 1);
  const slot = store.slots[2];
  assert.deepEqual(slot.completedLevels, [2, 7, 10]);
  assert.deepEqual(slot.bestLevelScores, {2: 1200});
  assert.equal(slot.campaignScore, 1200);
  assert.equal(slot.currentLevel, 1);
  assert.equal(slot.updatedUtc, null);
  assert.equal(slot.started, true);
  assert.equal(slot.black, true);
  assert.equal(slot.sound, false);
  assert.equal(slot.music, false);
  assert.equal(slot.freePlay, true);
  assert.deepEqual(readSlotStore(JSON.stringify(store)), store);
  for (const args of [[0, 1, 0], [5, 1, 0], [3, 0, 5], [3, 101, 5], [3, 7, -1], [3, 7, NaN],
    [3, 7, 1.5], [3, 7, Number.MAX_SAFE_INTEGER], [3, 7, 500, 6]]) {
    assert.equal(recordSlotLevelCompletion(store, ...args), store);
  }
});

test('sequential and Free Play unlocks respect the campaign boundaries', () => {
  let store = readSlotStore();
  assert.equal(isLevelUnlocked(store.slots[0], 1), true);
  assert.equal(isLevelUnlocked(store.slots[0], 2), false);
  store = recordSlotLevelCompletion(store, 1, 8, 2000);
  for (const level of [1, 7, 8, 9]) assert.equal(isLevelUnlocked(store.slots[0], level), true);
  assert.equal(isLevelUnlocked(store.slots[0], 10), false);
  store = updateSlot(store, 1, slot => ({...slot, freePlay: true}));
  assert.equal(isLevelUnlocked(store.slots[0], 100), true);
  for (const level of [0, 101, '1', 1.5]) assert.equal(isLevelUnlocked(store.slots[0], level), false);
});

test('reset restores defaults for one slot and leaves its neighbours and active identity alone', () => {
  let store = {...readSlotStore(), activeSlotId: 4};
  store = recordSlotLevelCompletion(store, 2, 1, 4000);
  store = recordSlotLevelCompletion(store, 4, 20, 3000, 100, '2026-11-24T16:00:00.000Z');
  store = updateSlot(store, 4, slot => ({...slot, black: true, sound: false, freePlay: true}));
  assert.deepEqual(slotSummary(store.slots[3]), {
    label: 'IV', started: true, currentLevel: 21, cleared: 1, totalLevels: 100, campaignScore: 3000,
    hand: 'Black', updatedUtc: '2026-11-24T16:00:00.000Z',
  });
  assert.deepEqual(readSlotStore(JSON.stringify(store)), store);
  const reset = resetSlot(store, 4);
  assert.equal(reset.activeSlotId, 4);
  assert.equal(reset.slots[1], store.slots[1]);
  assert.deepEqual(reset.slots[3], readSlotStore().slots[3]);
  assert.equal(resetSlot(reset, 9), reset);
});
