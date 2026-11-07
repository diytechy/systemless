// Browser gamepad adapter. Feeds the same canvas key listeners as the keyboard.
export function keysForPad(pad, deadzone = 0.35) {
  const keys = new Set();
  if (!pad || pad.mapping !== 'standard') return keys;
  const down = index => Boolean(pad.buttons?.[index]?.pressed);
  const x = pad.axes?.[0] ?? 0;
  if (down(14) || x < -deadzone) keys.add('j');
  if (down(15) || x > deadzone) keys.add('l');
  if (down(0) || down(12)) keys.add('i');
  if (down(1) || down(2)) keys.add(' ');
  if (down(4)) keys.add('u');
  if (down(5)) keys.add('o');
  if (down(3)) keys.add('k');
  if (down(9)) keys.add('p');
  if (down(8)) keys.add('Escape');
  return keys;
}

export class PadKeys {
  constructor(send) { this.send = send; this.held = new Set(); }
  update(next) {
    for (const key of this.held) if (!next.has(key)) this.send('keyup', key);
    for (const key of next) if (!this.held.has(key)) this.send('keydown', key);
    this.held = new Set(next);
  }
  release() { this.update(new Set()); }
}

if (typeof document !== 'undefined') {
  let canvas = null;
  let status = null;
  const codeFor = key => key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key;
  const keys = new PadKeys((type, key) => canvas?.dispatchEvent(new KeyboardEvent(type,
    { key, code: codeFor(key), bubbles: true, cancelable: true })));
  function release() { keys.release(); }
  window.addEventListener('blur', release);
  window.addEventListener('gamepaddisconnected', release);
  document.addEventListener('visibilitychange', release);
  window.addEventListener('pagehide', release);

  function attach() {
    const next = document.querySelector('canvas.game-canvas');
    if (next === canvas) return;
    release();
    document.querySelector('.koji-toolbar')?.remove();
    canvas = next;
    if (!canvas) return;
    canvas.addEventListener('blur', release);
    const wrap = canvas.closest('.game-canvas-wrap');
    const exit = document.createElement('button');
    exit.type = 'button';
    exit.className = 'koji-exit-fullscreen';
    exit.textContent = 'Exit fullscreen';
    exit.onclick = async () => {
      try { await document.exitFullscreen(); canvas.focus(); } catch {}
    };
    wrap.append(exit);
    const bar = document.createElement('div');
    bar.className = 'koji-toolbar';
    bar.innerHTML = `<button type="button" data-focus>Focus game</button>
      <button type="button" data-fullscreen>Fullscreen</button>
      <label>Picture <select aria-label="Picture scaling"><option value="pixelated">Crisp pixels</option><option value="auto">Smooth scaling</option></select></label>
      <span role="status" aria-live="polite">Connect a controller and press a button</span>`;
    status = bar.querySelector('[role=status]');
    bar.querySelector('[data-focus]').onclick = () => canvas.focus();
    bar.querySelector('[data-fullscreen]').onclick = async () => {
      const target = canvas.closest('.game-canvas-wrap') || canvas;
      try { await target.requestFullscreen(); canvas.focus(); }
      catch { status.textContent = 'Fullscreen unavailable in this browser'; }
    };
    const select = bar.querySelector('select');
    try { select.value = localStorage.getItem('koji.picture') || 'pixelated'; } catch {}
    const apply = () => {
      canvas.style.imageRendering = select.value;
      try { localStorage.setItem('koji.picture', select.value); } catch {}
    };
    select.onchange = apply;
    apply();
    canvas.closest('.game-canvas-wrap').before(bar);
  }
  new MutationObserver(attach).observe(document.documentElement, {childList:true, subtree:true});
  attach();
  let previousStatus = '';
  function poll() {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    const pad = pads.find(p => p.mapping === 'standard');
    const label = pad ? 'Controller connected · A: jump · X/B: tongue' :
      pads.length ? 'Controller needs a standard mapping; keyboard is available' :
      'Connect a controller and press a button';
    if (status && label !== previousStatus) { status.textContent = label; previousStatus = label; }
    const focused = canvas && document.activeElement === canvas && document.hasFocus() && !document.hidden;
    keys.update(focused ? keysForPad(pad) : new Set());
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);
}
