// Browser gamepad adapter. Feeds the same canvas key listeners as the keyboard.
export const hasControllerProfile = game => ['koji-personal-204','clockwerx-personal-10','delirium-personal-11'].includes(game);
export function keysForPad(pad, deadzone = 0.35, game = 'koji-personal-204') {
  const keys = new Set();
  if (!pad || pad.mapping !== 'standard') return keys;
  const down = index => Boolean(pad.buttons?.[index]?.pressed);
  const x = pad.axes?.[0] ?? 0;
  const y = pad.axes?.[1] ?? 0;
  if (game === 'clockwerx-personal-10') {
    if (down(0) || down(12)) keys.add('Meta');
    if (down(1) || down(13)) keys.add('Alt');
    if (down(2) || down(14)) keys.add('Control');
    if (down(3) || down(15)) keys.add('c');
    if (down(9)) { keys.add('Meta'); keys.add('p'); }
    return keys;
  }
  if (game === 'delirium-personal-11') {
    if (down(14) || x < -deadzone) keys.add('ArrowLeft');
    if (down(15) || x > deadzone) keys.add('ArrowRight');
    if (down(12) || y < -deadzone) keys.add('ArrowUp');
    if (down(13) || y > deadzone) keys.add('ArrowDown');
    if (down(0)) keys.add('Meta');
    if (down(1)) keys.add('Shift');
    if (down(2)) keys.add('Control');
    if (down(3)) keys.add(' ');
    if (down(9)) keys.add('p');
    if (down(8)) keys.add('Escape');
    return keys;
  }
  if (game !== 'koji-personal-204') return keys;
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

// The OtterTube add-on page: one game, its controller mapping as data (the page's `pad`).
// `buttons` is keyed by standard-mapping index: { key } is held while the button is, { script }
// runs on the press (on the `script_when` screens only when any are named; elsewhere the button is
// its key), { exit } leaves once the button has been held for EXIT_HOLD_MS. `directions` are the
// keys for up, down, left, right, from the d-pad and the left stick; with `step` only one at a time.
export const EXIT_HOLD_MS = 1000;
export class KioskPad {
  constructor(map) { this.map = map || {}; this.was = new Set(); this.scripted = new Set(); this.heldSince = new Map(); this.left = false; }
  // What the pad means now: keys to hold, the direction keys, scripts to run, and whether to leave.
  update(pad, now, screens = [], deadzone = 0.5) {
    const out = { keys: [], directions: [], scripts: [], exit: false };
    const usable = pad && pad.mapping === 'standard';
    const down = index => Boolean(usable && pad.buttons?.[index]?.pressed);
    if (usable && this.map.directions) {
      const [up, dn, left, right] = this.map.directions;
      const x = pad.axes?.[0] ?? 0, y = pad.axes?.[1] ?? 0;
      const vertical = down(12) || y < -deadzone ? up : down(13) || y > deadzone ? dn : null;
      const horizontal = down(14) || x < -deadzone ? left : down(15) || x > deadzone ? right : null;
      if (this.map.step && vertical && horizontal) {
        // A game played a cell at a time: the d-pad's up or down first, else the stronger push.
        out.directions.push(down(12) || down(13) || Math.abs(y) >= Math.abs(x) ? vertical : horizontal);
      } else {
        if (vertical) out.directions.push(vertical);
        if (horizontal) out.directions.push(horizontal);
      }
    }
    const pressed = new Set();
    for (const [index, button] of Object.entries(this.map.buttons || {})) {
      if (!down(Number(index))) { this.scripted.delete(index); this.heldSince.delete(index); continue; }
      pressed.add(index);
      if (!this.was.has(index)) {
        this.heldSince.set(index, now);
        const here = !button.script_when?.length || button.script_when.some(name => screens.includes(name));
        if (button.script && here) { out.scripts.push(button.script); this.scripted.add(index); }
      }
      if (button.exit && !this.left && now - this.heldSince.get(index) >= EXIT_HOLD_MS) { this.left = true; out.exit = true; }
      if (button.key && !this.scripted.has(index) && !out.keys.includes(button.key)) out.keys.push(button.key);
    }
    this.was = pressed;
    return out;
  }
}

export class PadKeys {
  constructor(send) { this.send = send; this.held = new Set(); }
  update(next) {
    // Release chord keys before their modifiers; shared actions retain a modifier.
    const modifier = key => ['Meta','Alt','Control','Shift'].includes(key);
    const released = [...this.held].filter(key => !next.has(key));
    released.sort((a,b) => Number(modifier(a))-Number(modifier(b)));
    for (const key of released) this.send('keyup', key);
    for (const key of next) if (!this.held.has(key)) this.send('keydown', key);
    this.held = new Set(next);
  }
  release() { this.update(new Set()); }
}

if (typeof document !== 'undefined') {
  let canvas = null;
  let status = null;
  let transient = new Set();
  let chordTimer = null;
  const codeFor = key => key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key;
  const keys = new PadKeys((type, key) => canvas?.dispatchEvent(new KeyboardEvent(type,
    { key, code: codeFor(key), bubbles: true, cancelable: true })));
  function release() {
    clearTimeout(chordTimer);
    transient.clear();
    keys.release();
  }
  function chord(values) {
    release();
    canvas?.focus({preventScroll:true});
    transient = new Set(values);
    chordTimer = setTimeout(() => transient.clear(), 150);
  }
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
    // The OtterTube add-on bundle is one game in OtterTube's own window: no way to the other
    // games, no fullscreen (OtterTube owns the window), and Exit asks OtterTube to leave.
    const kiosk = Boolean(document.querySelector('meta[name="systemless-ottertube-hosts"]'));
    const wrap = canvas.closest('.game-canvas-wrap');
    if (!kiosk) {
      const exit = document.createElement('button');
      exit.type = 'button';
      exit.className = 'koji-exit-fullscreen';
      exit.textContent = 'Exit fullscreen';
      exit.onclick = async () => {
        try { await document.exitFullscreen(); canvas.focus({preventScroll:true}); } catch {}
      };
      wrap.append(exit);
    }
    const bar = document.createElement('div');
    bar.className = 'koji-toolbar';
    bar.innerHTML = `${kiosk ? '<button type="button" data-exit>Exit</button>' : '<a href="/">All games</a>'}<button type="button" data-focus>Focus game</button>
      <button type="button" data-new-game hidden>New game</button>
      <button type="button" data-pause>Pause / resume</button>
      ${kiosk ? '' : '<button type="button" data-fullscreen>Fullscreen</button>'}
      <label>Picture <select aria-label="Picture scaling"><option value="pixelated">Crisp pixels</option><option value="auto">Smooth scaling</option></select></label>
      <span role="status" aria-live="polite">Connect a controller and press a button</span>`;
    status = bar.querySelector('[role=status]');
    bar.querySelector('[data-focus]').onclick = () => canvas.focus({preventScroll:true});
    const newGame = bar.querySelector('[data-new-game]');
    newGame.hidden = canvas.dataset.gameId !== 'clockwerx-personal-10';
    newGame.onclick = () => chord(['Meta', 'n']);
    bar.querySelector('[data-pause]').hidden = !hasControllerProfile(canvas.dataset.gameId);
    bar.querySelector('[data-pause]').onclick = () => chord(
      canvas.dataset.gameId === 'clockwerx-personal-10' ? ['Meta', 'p'] : ['p']);
    if (kiosk) bar.querySelector('[data-exit]').onclick = () => window.systemlessOtterTube?.requestExit();
    else bar.querySelector('[data-fullscreen]').onclick = async () => {
      const target = canvas.closest('.game-canvas-wrap') || canvas;
      try { await target.requestFullscreen(); canvas.focus({preventScroll:true}); }
      catch { status.textContent = 'Fullscreen unavailable in this browser'; }
    };
    const select = bar.querySelector('select');
    try { select.value = localStorage.getItem('macgames.picture') || localStorage.getItem('koji.picture') || 'pixelated'; } catch {}
    const apply = () => {
      canvas.style.imageRendering = select.value;
      try { localStorage.setItem('macgames.picture', select.value); } catch {}
    };
    select.onchange = apply;
    apply();
    canvas.closest('.game-canvas-wrap').before(bar);
  }
  new MutationObserver(attach).observe(document.documentElement, {childList:true, subtree:true});
  attach();
  let previousStatus = '';
  let activeGame = '';
  // The OtterTube add-on page: the pad goes to the page's own key count and scripts, whether or
  // not the picture has the keyboard focus (nobody has a mouse to give it).
  let kioskPad = null, kioskHeld = '', kioskDirection = '', kioskConnected = false;
  function pollKiosk(link, pad) {
    if (!kioskPad || kioskPad.map !== link.pad) kioskPad = new KioskPad(link.pad);
    const connected = Boolean(pad);
    if (connected !== kioskConnected) { kioskConnected = connected; link.input('pad-connected', [], connected); }
    const root = document.querySelector('.app--ottertube');
    const screens = (root?.dataset.kioskScreen ?? '').split(' ').filter(Boolean);
    const out = kioskPad.update(document.hidden ? null : pad, performance.now(), screens);
    const held = link.pad.step ? out.keys : [...out.keys, ...out.directions];
    if (root?.dataset.kioskBusy !== undefined) {
      // A script is driving the game: the page takes no keys from the pad and has let go of the
      // ones it held. Say what is held again when the script ends.
      kioskHeld = kioskDirection = null;
    } else {
      if (held.join(' ') !== kioskHeld) { kioskHeld = held.join(' '); link.input('pad', held, true); }
      if (link.pad.step && out.directions.join(' ') !== kioskDirection) { kioskDirection = out.directions.join(' '); link.input('direction', out.directions, true); }
    }
    for (const script of out.scripts) link.input('script', [script], true);
    if (out.exit) link.requestExit();
  }
  let padsRefused = false;
  function poll() {
    const link = window.systemlessOtterTube;
    const kiosk = Boolean(link?.pad && typeof link.input === 'function');
    let pads;
    try { pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; }
    catch (error) {
      // A frame its parent has not allowed the gamepad feature (allow="gamepad") is refused here.
      // Inside OtterTube that means no controller, and touch goes on working.
      if (!link) throw error;
      if (!padsRefused) { padsRefused = true; console.warn('[ottertube] no game controller: this frame is not allowed the gamepad feature', error); }
      pads = [];
    }
    const pad = pads.find(p => p.mapping === 'standard');
    if (kiosk) { pollKiosk(link, pad); requestAnimationFrame(poll); return; }
    const game = canvas?.dataset.gameId || '';
    if (game !== activeGame) { release(); activeGame = game; previousStatus = ''; }
    const help = game === 'clockwerx-personal-10' ? 'A: swing · B: bounce · X: flip · Y: reverse' : game === 'delirium-personal-11' ? 'Controller connected · see game controls below' : 'A: jump · X/B: tongue';
    const label = !hasControllerProfile(game) ? 'Use this game’s documented keyboard and mouse controls' : pad ? `Controller connected · ${help}` :
      pads.length ? 'Controller needs a standard mapping; keyboard is available' :
      'Connect a controller and press a button';
    if (status && label !== previousStatus) { status.textContent = label; previousStatus = label; }
    const focused = canvas && document.activeElement === canvas && document.hasFocus() && !document.hidden;
    const nextKeys = focused ? keysForPad(pad, 0.35, game) : new Set();
    if (focused) for (const key of transient) nextKeys.add(key);
    keys.update(nextKeys);
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);
}
