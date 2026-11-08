/** Source-style scanline collision; artwork and outline tables remain private.
 * Bounds are integer world coordinates {left, top, right, bottom}. A rows array
 * has one inclusive [left,right] span per scanline, relative to bounds.left;
 * [-1,-1] is empty. null rows means the source's rectangle-only outline.
 * Missing outline objects never collide. Callers supply original frame bounds,
 * including sprite anchors and source vertical reflection, independently of SVG.
 */
export function outlineCollision(a, b) {
  if (!a || !b) return false;
  for (const s of [a, b]) {
    if (!['left','top','right','bottom'].every(k => Number.isInteger(s[k])))
      throw new TypeError('Collision bounds must be integer source pixels');
    if (s.right < s.left || s.bottom < s.top ||
        (s.rows !== null && (!Array.isArray(s.rows) || s.rows.length !== s.bottom-s.top)))
      throw new RangeError('Invalid outline bounds or row count');
  }
  if (a.left > b.right || b.left > a.right || a.top > b.bottom || b.top > a.bottom) return false;
  if (a.rows === null && b.rows === null) return true;
  const span = (s, y) => {
    if (s.rows === null) return [s.left, s.right];
    const row = s.rows[s.flipY ? s.bottom-1-y : y-s.top];
    return row[0] === -1 ? null : [s.left+row[0], s.left+row[1]];
  };
  for (let y = Math.max(a.top,b.top); y < Math.min(a.bottom,b.bottom); y++) {
    const x = span(a,y), z = span(b,y);
    if (x && z && x[0] <= z[1] && z[0] <= x[1]) return true;
  }
  return false;
}

/** SPGetPixel's two independently indexed subcell offsets (CODE6:981c).
 * Supply the established grid-origin coordinate, not an SVG tile origin.
 */
export function spikeGridPoint(record, origin, pitch = 48) {
  const w = record.rawWords;
  const offsets = [0,6,24,42];
  if (!w || !Number.isInteger(w[2]) || !Number.isInteger(w[3]) ||
      w[2] < 0 || w[2] > 3 || w[3] < 0 || w[3] > 3)
    throw new RangeError('Unsupported spike subcell offset');
  return {x:origin.x+w[1]*pitch+offsets[w[3]], y:origin.y+w[0]*pitch+offsets[w[2]]};
}

/** Same-pivot hero/enemy collision additionally requires angular separation
 * <=4 of 64 source frames (CODE6:e64a-e67e). Different pivots use outlines alone.
 */
export function enemyFrameGate(heroPivot, enemyPivot, heroFrame, enemyFrame) {
  if (heroPivot !== enemyPivot) return true;
  const separation = Math.abs((heroFrame & 63)-(enemyFrame & 63));
  return separation <= 4 || separation >= 60;
}

/** DOCreateAll bit 0x2000 -> DOSpec+0xb -> DOInfo+0x1f.
 * This protects against ordinary enemy hands, not spikes or every enemy type.
 */
export function isProtectedDot(cell, activeMask) {
  return Boolean(cell?.present && (cell.flagsRaw & 0x2000) &&
    ((cell.activationMaskRaw ?? 15) & activeMask));
}

/** Serialized WASpec+6 is doubled before selecting one of 64 sprite frames.
 * Canonical right-facing SVG angle = result * 2*Math.PI/64 (screen Y down).
 */
export function actorInitialFrame(halfIndex) {
  if (!Number.isInteger(halfIndex)) throw new TypeError('Integer source phase required');
  return (halfIndex * 2) & 63;
}

/** TM + MT source clock chain, stepped in elapsed Macintosh guest ticks.
 * TM subtracts 16 units/tick; pauses >5000 units collapse to one base count.
 * MT advances while the accumulator is strictly greater than its divisor.
 * For SP use basePeriod=40, clientDivisor=5. Keep this clock running across
 * actor deaths; latch sprite phase references separately at reset.
 */
export function createSourceTimerChain(basePeriod, clientDivisor) {
  if (!Number.isInteger(basePeriod) || basePeriod < 1 ||
      !Number.isInteger(clientDivisor) || clientDivisor < 1)
    throw new RangeError('Positive integer source periods required');
  let remaining = basePeriod, baseCount = 0, clientRemainder = 0, clientCount = 0;
  return {
    advance(elapsedTicks) {
      if (!Number.isInteger(elapsedTicks) || elapsedTicks < 0)
        throw new RangeError('Nonnegative integer guest tick delta required');
      if (elapsedTicks > 0) {
        const elapsed = elapsedTicks * 16;
        remaining -= elapsed > 5000 ? remaining : elapsed;
        let delta = 0;
        while (remaining <= 0) { remaining += basePeriod; baseCount++; delta++; }
        clientRemainder += delta;
        while (clientRemainder > clientDivisor) {
          clientRemainder -= clientDivisor;
          clientCount++;
        }
      }
      return {baseCount, clientCount, remaining, clientRemainder};
    }
  };
}
