export const progressKey = 'systemless.clockwerx-html5.pilot.v1';

function isLevel(value) {
  return Number.isInteger(value) && value >= 1 && value <= 100;
}

const sortedLevels = levels => Array.isArray(levels)
  ? [...new Set(levels.filter(isLevel))].sort((a, b) => a - b) : [];

export function readProgress(json) {
  let value;
  try { value = JSON.parse(json); } catch { /* Start with empty progress. */ }
  return {
    schema: 'clockwerx-html5-progress/1',
    black: value?.black === true,
    completed: Number.isSafeInteger(value?.completed) && value.completed >= 0 ? value.completed : 0,
    completedLevels: sortedLevels(value?.completedLevels),
    lastLevel: isLevel(value?.lastLevel) ? value.lastLevel : null,
  };
}

export function recordCompletion(progress, level) {
  progress.completed = Math.min(progress.completed + 1, Number.MAX_SAFE_INTEGER);
  if (isLevel(level) && !progress.completedLevels.includes(level)) {
    progress.completedLevels.push(level);
    progress.completedLevels.sort((a, b) => a - b);
  }
}

export const slotStoreKey = 'systemless.clockwerx-html5.slots.v1';
export const slotLabels = Object.freeze(['I', 'II', 'III', 'IV']);
const schema = 'clockwerx-html5-slots/1';
const isSlotId = id => Number.isInteger(id) && id >= 1 && id <= slotLabels.length;
// Keep the sum exact even if the stored JSON was edited or corrupted.
const maxLevelScore = Math.floor(Number.MAX_SAFE_INTEGER / 100);
const isScore = value => Number.isSafeInteger(value) && value >= 0 && value <= maxLevelScore;
const campaignTotal = scores => Object.values(scores).reduce((sum, value) => sum + value, 0);

function normalizeSlot(id, value) {
  const completedLevels = sortedLevels(value?.completedLevels);
  const bestLevelScores = Object.fromEntries(completedLevels.flatMap(level => {
    const score = value?.bestLevelScores?.[level];
    return isScore(score) ? [[level, score]] : [];
  }));
  return {
    id, started: value?.started === true || completedLevels.length > 0,
    currentLevel: isLevel(value?.currentLevel) ? value.currentLevel : 1,
    completedLevels, bestLevelScores, campaignScore: campaignTotal(bestLevelScores),
    black: value?.black === true, sound: value?.sound !== false, music: value?.music !== false, freePlay: value?.freePlay === true,
    updatedUtc: typeof value?.updatedUtc === 'string' && Number.isFinite(Date.parse(value.updatedUtc))
      ? new Date(value.updatedUtc).toISOString() : null,
  };
}

export function migrateLegacyProgress(legacy) {
  const {black, completed, completedLevels, lastLevel} = legacy;
  const first = {
    started: Boolean(lastLevel || completed || completedLevels.length),
    currentLevel: lastLevel ?? Math.min(100, (completedLevels.at(-1) ?? 0) + 1),
    completedLevels, black,
  };
  // Legacy saves recorded clears without points or a last-played timestamp.
  return {schema, activeSlotId: 1, slots: slotLabels.map((_, i) => normalizeSlot(i + 1, i === 0 ? first : null))};
}

export function readSlotStore(json) {
  let value;
  try { value = JSON.parse(json); } catch { /* Start with empty slots. */ }
  return {
    schema, activeSlotId: isSlotId(value?.activeSlotId) ? value.activeSlotId : 1,
    slots: slotLabels.map((_, i) => normalizeSlot(i + 1, Array.isArray(value?.slots)
      ? value.slots.find(slot => slot?.id === i + 1) : null)),
  };
}

export function updateSlot(store, slotId, change) {
  if (!isSlotId(slotId)) return store;
  return {...store, slots: store.slots.map(slot => slot.id === slotId ? change(slot) : slot)};
}

export function recordSlotLevelCompletion(store, slotId, level, levelScore, totalLevels = 100, updatedUtc) {
  if (!isLevel(level) || !isLevel(totalLevels) || level > totalLevels || !isScore(levelScore)) return store;
  return updateSlot(store, slotId, slot => {
    const bestLevelScores = {...slot.bestLevelScores, [level]: Math.max(slot.bestLevelScores[level] ?? 0, levelScore)};
    const completedLevels = sortedLevels([...slot.completedLevels, level]);
    return {...slot, started: true, completedLevels, bestLevelScores,
      currentLevel: Math.min(totalLevels, Math.max(slot.currentLevel, level + 1)),
      campaignScore: campaignTotal(bestLevelScores), updatedUtc: updatedUtc ?? slot.updatedUtc};
  });
}

export function resetSlot(store, slotId) {
  return updateSlot(store, slotId, () => normalizeSlot(slotId));
}

export function isLevelUnlocked(slot, level) {
  return isLevel(level) && (slot.freePlay || level <= (slot.completedLevels.at(-1) ?? 0) + 1);
}

export function slotSummary(slot, totalLevels = 100) {
  return {
    label: slotLabels[slot.id - 1], started: slot.started, currentLevel: slot.currentLevel,
    cleared: slot.completedLevels.filter(level => level <= totalLevels).length, totalLevels,
    campaignScore: slot.campaignScore, hand: slot.black ? 'Black' : 'Gold', updatedUtc: slot.updatedUtc,
  };
}
