import {DIFFICULTIES} from './actor-clocks.mjs';

export const leaderboardKey = 'systemless.clockwerx-html5.scores.v1';
const schema = 'clockwerx-html5-scores/1';
export const MAX_LEADERBOARD_ENTRIES = 10;

// Original 1995 Mac ClockWerx STR# 140 ratings & DATA 0 (-842(A5)) score thresholds.
export const SKILL_RATINGS = Object.freeze([
  'Beginner', 'Tyro', 'Novice', 'Whiz', 'Star', 'Ace',
  'Expert', 'Virtuoso', 'Connoisseur', 'Master', 'GrandMaster',
]);
export const RATING_THRESHOLDS = Object.freeze([
  0, 200000, 400000, 600000, 800000, 1000000,
  1200000, 1400000, 1600000, 2000000, 5000000,
]);

export const INITIAL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function ratingForScore(score) {
  const value = Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
  let index = 0;
  for (let i = 1; i < RATING_THRESHOLDS.length; i++) {
    if (value >= RATING_THRESHOLDS[i]) index = i;
    else break;
  }
  return {
    index,
    title: SKILL_RATINGS[index],
    threshold: RATING_THRESHOLDS[index],
    nextThreshold: RATING_THRESHOLDS[index + 1] ?? null,
    nextTitle: SKILL_RATINGS[index + 1] ?? null,
  };
}

export function promotedRating(oldScore, newScore) {
  const before = ratingForScore(oldScore);
  const after = ratingForScore(newScore);
  return after.index > before.index ? after : null;
}

export function sanitizeInitials(value, fallback = 'CWX') {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  return cleaned.length ? cleaned : fallback;
}

export function stepInitialChar(ch, delta) {
  const idx = INITIAL_ALPHABET.indexOf(String(ch || 'A').toUpperCase());
  const base = idx >= 0 ? idx : 0;
  const next = ((base + delta) % INITIAL_ALPHABET.length + INITIAL_ALPHABET.length) % INITIAL_ALPHABET.length;
  return INITIAL_ALPHABET[next];
}

function emptyTables() {
  return Object.fromEntries(DIFFICULTIES.map(d => [d, []]));
}

function compareEntries(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.highestLevel !== a.highestLevel) return b.highestLevel - a.highestLevel;
  const ta = a.updatedUtc ?? '';
  const tb = b.updatedUtc ?? '';
  if (ta !== tb) return ta.localeCompare(tb);
  return a.initials.localeCompare(b.initials);
}

function normalizeEntry(entry, difficulty) {
  if (!entry || typeof entry !== 'object') return null;
  const score = Number.isSafeInteger(entry.score) && entry.score > 0 && entry.score <= Number.MAX_SAFE_INTEGER
    ? entry.score : null;
  if (score === null) return null;
  const highestLevel = Number.isInteger(entry.highestLevel) && entry.highestLevel >= 1 && entry.highestLevel <= 100
    ? entry.highestLevel : 1;
  const slotLabel = ['I', 'II', 'III', 'IV'].includes(entry.slotLabel) ? entry.slotLabel : 'I';
  const updatedUtc = typeof entry.updatedUtc === 'string' && Number.isFinite(Date.parse(entry.updatedUtc))
    ? new Date(entry.updatedUtc).toISOString() : null;
  return {
    initials: sanitizeInitials(entry.initials, 'CWX'),
    slotLabel,
    score,
    highestLevel,
    rating: ratingForScore(score).title,
    difficulty,
    updatedUtc,
  };
}

export function readLeaderboard(json) {
  let value;
  try { value = JSON.parse(json); } catch { /* Start with empty leaderboard. */ }
  const tables = emptyTables();
  for (const difficulty of DIFFICULTIES) {
    const raw = Array.isArray(value?.tables?.[difficulty]) ? value.tables[difficulty] : [];
    tables[difficulty] = raw
      .map(row => normalizeEntry(row, difficulty))
      .filter(Boolean)
      .sort(compareEntries)
      .slice(0, MAX_LEADERBOARD_ENTRIES);
  }
  const lastInitials = sanitizeInitials(value?.lastInitials, 'AAA');
  return { schema, lastInitials, tables };
}

export function qualifiesForLeaderboard(board, difficulty, score) {
  if (!DIFFICULTIES.includes(difficulty) || !Number.isSafeInteger(score) || score <= 0) return false;
  const list = board?.tables?.[difficulty] ?? [];
  if (list.length < MAX_LEADERBOARD_ENTRIES) return true;
  return score > list[list.length - 1].score;
}

export function recordLeaderboardScore(board, {
  difficulty = 'Child',
  initials = 'AAA',
  slotLabel = 'I',
  score = 0,
  highestLevel = 1,
  updatedUtc = new Date().toISOString(),
} = {}) {
  const base = board?.tables ? board : readLeaderboard(null);
  if (!DIFFICULTIES.includes(difficulty)) return { board: base, qualified: false, rank: null };
  const entry = normalizeEntry({ initials, slotLabel, score, highestLevel, updatedUtc }, difficulty);
  if (!entry) return { board: base, qualified: false, rank: null };
  const current = base.tables[difficulty] ?? [];
  const merged = [...current, entry].sort(compareEntries).slice(0, MAX_LEADERBOARD_ENTRIES);
  const rankIdx = merged.indexOf(entry);
  if (rankIdx === -1) return { board: base, qualified: false, rank: null };
  const nextBoard = {
    schema,
    lastInitials: entry.initials,
    tables: { ...base.tables, [difficulty]: merged },
  };
  return { board: nextBoard, qualified: true, rank: rankIdx + 1, entry };
}
