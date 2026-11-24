export const progressKey = 'systemless.clockwerx-html5.pilot.v1';

function isLevel(value) {
  return Number.isInteger(value) && value >= 1 && value <= 100;
}

export function readProgress(json) {
  let value;
  try { value = JSON.parse(json); } catch { /* Start with empty progress. */ }
  return {
    schema: 'clockwerx-html5-progress/1',
    black: value?.black === true,
    completed: Number.isSafeInteger(value?.completed) && value.completed >= 0 ? value.completed : 0,
    completedLevels: Array.isArray(value?.completedLevels)
      ? [...new Set(value.completedLevels.filter(isLevel))].sort((a, b) => a - b)
      : [],
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
