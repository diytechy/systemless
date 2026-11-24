import assert from 'node:assert/strict';
import test from 'node:test';
import {chapterOf, completionDetails, menuPadAction, moveChapter, moveInGrid, moveSlot} from './game-menu.mjs';

test('the clock face maps four compass points and shoulder steps wrap', () => {
  assert.deepEqual(['up', 'right', 'down', 'left'].map(direction => moveSlot(2, direction, true)), [1, 2, 3, 4]);
  assert.equal(moveSlot(1, 'previous', true), 4);
  assert.equal(moveSlot(4, 'next', true), 1);
  assert.equal(moveSlot(3, 'previous', true), 2);
});

test('grid navigation moves one column or row and stays within the row edges', () => {
  assert.equal(moveSlot(1, 'right', false), 2);
  assert.equal(moveSlot(2, 'right', false), 2);
  assert.equal(moveSlot(2, 'down', false), 4);
  assert.equal(moveSlot(4, 'left', false), 3);
  assert.equal(moveSlot(3, 'up', false), 1);
  assert.equal(moveInGrid(3, 'down', 5, 10), 8);
  assert.equal(moveInGrid(8, 'up', 5, 10), 3);
  assert.equal(moveInGrid(4, 'right', 5, 10), 4);
  assert.equal(moveInGrid(5, 'left', 5, 10), 5);
  assert.equal(moveInGrid(9, 'down', 5, 10), 9);
});

test('chapter jumps preserve the tile position and clamp at the ends of the campaign', () => {
  assert.equal(chapterOf(10), 0);
  assert.equal(chapterOf(11), 1);
  assert.equal(chapterOf(100), 9);
  assert.equal(moveChapter(4, 1), 14);
  assert.equal(moveChapter(14, -1), 4);
  assert.equal(moveChapter(8, -1), 8);
  assert.equal(moveChapter(90, 1), 100);
  assert.equal(moveChapter(97, 1), 97);
});

test('controller buttons resolve to the actions of their current screen', () => {
  assert.equal(menuPadAction('title', {swing: true}), 'slot-play');
  assert.equal(menuPadAction('title', {flip: true}), 'slot-levels');
  assert.equal(menuPadAction('title', {reverse: true}), 'slot-hand');
  assert.equal(menuPadAction('title', {bounce: true}), 'slot-sound');
  assert.equal(menuPadAction('title', {pause: true}), 'previous');
  assert.equal(menuPadAction('title', {restart: true}), 'next');
  assert.equal(menuPadAction('title', {levels: true}), 'slot-reset');
  assert.equal(menuPadAction('title', {levels: true}, true), 'slot-keep');
  assert.equal(menuPadAction('title', {swing: true}, true), 'activate');
  assert.equal(menuPadAction('title', {flip: true}, true), null);
  assert.equal(menuPadAction('levels', {swing: true}), 'activate');
  assert.equal(menuPadAction('levels', {flip: true}), 'previous-chapter');
  assert.equal(menuPadAction('levels', {reverse: true}), 'next-chapter');
  assert.equal(menuPadAction('levels', {bounce: true}), 'game-level-back');
  assert.equal(menuPadAction('levels', {levels: true}), 'game-level-back');
  assert.equal(menuPadAction('pause', {pause: true}), 'game-resume');
  assert.equal(menuPadAction('pause', {swing: true}), 'activate');
  assert.equal(menuPadAction('complete', {swing: true}), 'game-next');
  assert.equal(menuPadAction('complete', {restart: true}), 'game-replay');
  assert.equal(menuPadAction('complete', {levels: true}), 'game-complete-levels');
  for (const view of ['title', 'levels', 'pause', 'complete', 'play', 'loading']) {
    assert.equal(menuPadAction(view, {}), null);
  }
});

test('completion plaque reports round points separately from the campaign improvement', () => {
  assert.deepEqual(completionDetails(99, 3000, 40000, 42000, true), {
    level: 99, bonus: 3000, levelTotal: 4000, campaignTotal: 42000, delta: 2000, nextLevel: 100,
  });
  const final = completionDetails(100, 3000, 42000, 42000, true);
  assert.equal(final.delta, 0);
  assert.equal(final.nextLevel, null);
  assert.equal(completionDetails(1, 0, 0, 1000, false).nextLevel, null);
});
