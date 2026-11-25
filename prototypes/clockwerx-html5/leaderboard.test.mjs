import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_LEADERBOARD_ENTRIES,
  SKILL_RATINGS,
  RATING_THRESHOLDS,
  ratingForScore,
  promotedRating,
  sanitizeInitials,
  stepInitialChar,
  readLeaderboard,
  qualifiesForLeaderboard,
  recordLeaderboardScore,
} from './leaderboard.mjs';

test('skill ratings follow original 11-tier ClockWerx STR# 140 thresholds', () => {
  assert.equal(SKILL_RATINGS.length, 11);
  assert.equal(RATING_THRESHOLDS.length, 11);
  assert.equal(ratingForScore(0).title, 'Beginner');
  assert.equal(ratingForScore(199999).title, 'Beginner');
  assert.equal(ratingForScore(200000).title, 'Tyro');
  assert.equal(ratingForScore(1000000).title, 'Ace');
  assert.equal(ratingForScore(2000000).title, 'Master');
  assert.equal(ratingForScore(5000000).title, 'GrandMaster');
  assert.equal(ratingForScore(5000000).nextThreshold, null);

  assert.equal(promotedRating(100000, 199000), null);
  assert.equal(promotedRating(199000, 200000).title, 'Tyro');
  assert.equal(promotedRating(1500000, 2100000).title, 'Master');
});

test('initials sanitization and character stepping handle edge inputs safely', () => {
  assert.equal(sanitizeInitials('ab!9z'), 'AB9');
  assert.equal(sanitizeInitials('   ', 'II'), 'II');
  assert.equal(sanitizeInitials(null), 'CWX');
  assert.equal(stepInitialChar('A', 1), 'B');
  assert.equal(stepInitialChar('A', -1), '9');
  assert.equal(stepInitialChar('9', 1), 'A');
});

test('leaderboard sorts, tie-breaks, caps at 10 per difficulty, and survives malformed JSON', () => {
  const empty = readLeaderboard('{not valid json');
  assert.deepEqual(empty.tables.Child, []);
  assert.equal(qualifiesForLeaderboard(empty, 'Child', 0), false);
  assert.equal(qualifiesForLeaderboard(empty, 'Child', 1000), true);

  let board = empty;
  for (let i = 1; i <= 12; i++) {
    const res = recordLeaderboardScore(board, {
      difficulty: 'Easy',
      initials: `P${i}`,
      slotLabel: 'I',
      score: i * 10000,
      highestLevel: i,
      updatedUtc: `2026-11-24T12:${String(i).padStart(2, '0')}:00.000Z`,
    });
    board = res.board;
    assert.equal(res.qualified, true);
  }
  assert.equal(board.tables.Easy.length, MAX_LEADERBOARD_ENTRIES);
  assert.equal(board.tables.Easy[0].score, 120000);
  assert.equal(board.tables.Easy[9].score, 30000);
  assert.equal(qualifiesForLeaderboard(board, 'Easy', 25000), false);
  assert.equal(qualifiesForLeaderboard(board, 'Easy', 35000), true);

  // Tie-break on highestLevel descending, then earlier updatedUtc.
  let tied = recordLeaderboardScore(empty, {
    difficulty: 'Hard', initials: 'LOW', score: 250000, highestLevel: 5, updatedUtc: '2026-11-24T10:00:00.000Z',
  }).board;
  tied = recordLeaderboardScore(tied, {
    difficulty: 'Hard', initials: 'HI1', score: 250000, highestLevel: 10, updatedUtc: '2026-11-24T11:00:00.000Z',
  }).board;
  tied = recordLeaderboardScore(tied, {
    difficulty: 'Hard', initials: 'HI0', score: 250000, highestLevel: 10, updatedUtc: '2026-11-24T09:00:00.000Z',
  }).board;
  assert.deepEqual(tied.tables.Hard.map(e => e.initials), ['HI0', 'HI1', 'LOW']);
  assert.equal(tied.tables.Hard[0].rating, 'Tyro');

  // Round-trip serialization preserves clean sorted entries.
  const reloaded = readLeaderboard(JSON.stringify(tied));
  assert.deepEqual(reloaded.tables.Hard, tied.tables.Hard);
});
