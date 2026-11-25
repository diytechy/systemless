// Lightweight floating on-board score popups for bonus dots, hourglasses, and goal clears.
const DEFAULT_DURATION = 1.1;
const DRIFT_PIXELS_PER_SECOND = 28;
const MAX_POPUPS = 24;

export function createScorePopups() {
  let popups = [];
  let nextId = 1;

  return {
    spawn({x, y, text, color = '#ffe66b', subtext = '', duration = DEFAULT_DURATION} = {}) {
      if (!Number.isFinite(x) || !Number.isFinite(y) || typeof text !== 'string' || !text.trim()) return null;
      const life = Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_DURATION;
      const item = {
        id: nextId++,
        x,
        y,
        startY: y,
        text: text.trim(),
        subtext: typeof subtext === 'string' ? subtext.trim() : '',
        color,
        age: 0,
        duration: life,
        alpha: 1,
      };
      popups.push(item);
      if (popups.length > MAX_POPUPS) popups.shift();
      return {...item};
    },
    update(dt) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      const next = [];
      for (const p of popups) {
        p.age += dt;
        if (p.age >= p.duration) continue;
        p.y = p.startY - p.age * DRIFT_PIXELS_PER_SECOND;
        const progress = p.age / p.duration;
        p.alpha = progress > 0.65 ? Math.max(0, 1 - (progress - 0.65) / 0.35) : 1;
        next.push(p);
      }
      popups = next;
    },
    reset() {
      popups = [];
    },
    snapshot() {
      return popups.map(p => ({...p}));
    },
  };
}
