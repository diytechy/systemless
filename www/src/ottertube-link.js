// The slim OtterTube add-on build only (Cargo feature `ottertube`): the page's side of the handshake.
// Loaded as a classic script after the vendored /ottertube-addon.js and before the WebAssembly module,
// so `ready` is on its way to OtterTube while the runtime is still loading.
//
// The game does not start until `start` resolves. No `init` within HANDSHAKE_MS means the page was not
// opened by OtterTube: `start` resolves with { ok: false } and the page shows a plain message instead.
(function (root) {
  'use strict';

  var HANDSHAKE_MS = 5000;
  var meta = root.document.querySelector('meta[name="systemless-ottertube-hosts"]');
  var hosts = meta ? String(meta.content || '').split(/\s+/).filter(Boolean) : [];
  var connection = null;
  var pageHide = null;
  var leave = null;
  var inputSink = null;
  var padMap = null;
  var settled = false;
  /** Checkpoint answers, newest last, for tests and for a parent-side page later. */
  var log = [];

  var start = new Promise(function (resolve) {
    function finish(value) {
      if (settled) return;
      settled = true;
      resolve(value);
    }
    var ot;
    try {
      if (!root.OtterTubeAddon) throw new Error('the OtterTube add-on client did not load');
      ot = root.OtterTubeAddon.connect({ hosts: hosts });
    } catch (error) {
      finish({ ok: false, reason: String((error && error.message) || error) });
      return;
    }
    var timer = root.setTimeout(function () {
      finish({ ok: false, reason: 'OtterTube did not answer within ' + HANDSHAKE_MS + ' ms' });
    }, HANDSHAKE_MS);
    ot.ready.then(function (init) {
      root.clearTimeout(timer);
      // An answer after the deadline is too late: the plain message is already shown.
      if (settled) return;
      connection = ot;
      finish({
        ok: true,
        subject: init.subject,
        mode: init.mode,
        saved: init.saved ? init.saved.data : null,
      });
    });
  });

  // A tap button that presses keys once: data-kiosk-keys="Meta+n" is Command-N. The keys go to the
  // game's canvas as keyboard events, the same way the gamepad adapter sends them, held long
  // enough for the game to see them and released in reverse order. A comma separates presses
  // made one after another: "Space,Space" is Space, a pause, Space again.
  var KEY_HOLD_MS = 180;
  var KEY_STEP_MS = 1200;
  function keyEvent(type, name) {
    var key = name === 'Space' ? ' ' : name;
    var code = name === 'Space' ? 'Space' : name.length === 1 ? (/[0-9]/.test(name) ? 'Digit' + name : 'Key' + name.toUpperCase()) : name;
    return new KeyboardEvent(type, { key: key, code: code, bubbles: true, cancelable: true });
  }
  // What the page (and the controller adapter) hand to the game: `tap` keys pressed or released,
  // a `script` to run, the `pad`'s held keys, the `direction` it pushes, `pad-connected`.
  function input(kind, names, down) {
    if (typeof inputSink !== 'function') return false;
    inputSink(kind, names || [], Boolean(down));
    return true;
  }
  // A tap button that runs one of the game's scripts: data-kiosk-script="new-game".
  root.document.addEventListener('pointerdown', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('[data-kiosk-script]') : null;
    if (!button) return;
    event.preventDefault();
    input('script', [String(button.dataset.kioskScript)], true);
  });
  root.document.addEventListener('pointerdown', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('[data-kiosk-keys]') : null;
    if (!button || button.dataset.kioskBusy === 'true') return;
    var canvas = root.document.querySelector('canvas.game-canvas');
    if (!canvas) return;
    event.preventDefault();
    var steps = String(button.dataset.kioskKeys).split(',').filter(Boolean);
    button.dataset.kioskBusy = 'true';
    button.classList.add('is-active');
    try { canvas.focus({ preventScroll: true }); } catch (_) { /* focus is a nicety */ }
    // The page counts who holds each key (the stick, a held button, a tap action), so the release
    // here cannot lift a key a finger is still holding. Without that count (the game has no held
    // controls) the keys go to the canvas as keyboard events.
    function send(names, down) {
      if (!input('tap', names, down)) names.forEach(function (name) { canvas.dispatchEvent(keyEvent(down ? 'keydown' : 'keyup', name)); });
    }
    (function press(index) {
      var names = steps[index].split('+').filter(Boolean);
      send(names, true);
      root.setTimeout(function () {
        send(names.slice().reverse(), false);
        if (index + 1 < steps.length) { root.setTimeout(function () { press(index + 1); }, KEY_STEP_MS); return; }
        button.classList.remove('is-active');
        delete button.dataset.kioskBusy;
      }, KEY_HOLD_MS);
    })(0);
  });

  root.addEventListener('pagehide', function () {
    if (typeof pageHide === 'function') {
      try { pageHide(); } catch (_) { /* leaving must not throw */ }
    }
  });

  root.systemlessOtterTube = {
    handshakeMs: HANDSHAKE_MS,
    hosts: hosts.slice(),
    log: log,
    /** Resolves once: { ok: true, subject, mode, saved } or { ok: false, reason }. */
    start: function () { return start; },
    connected: function () { return connection !== null; },
    /**
     * Hands a save text to OtterTube. The client sends at most one every 2.25 s and folds calls made
     * meanwhile into the next, which carries the newest text. Resolves with OtterTube's answer.
     */
    checkpoint: function (counter, text) {
      if (!connection) return Promise.resolve({ saved: false, reason: 'not-connected' });
      return connection.checkpoint(text).then(function (answer) {
        log.push({ counter: counter, bytes: text.length, at: Date.now(), answer: answer });
        if (log.length > 50) log.shift();
        return answer;
      });
    },
    /** One function, called when the page is hidden for good (a child leaving, a user switch). */
    onPageHide: function (callback) { pageHide = callback; },
    /** One function (kind, names, down) that takes what `input` is given. */
    onInput: function (callback) { inputSink = callback; },
    input: input,
    /** The game's controller mapping, as JSON; the adapter in game-controls.mjs reads `pad`. */
    setPad: function (json) { try { padMap = JSON.parse(json); } catch (_) { padMap = null; } },
    get pad() { return padMap; },
    /** One function that leaves properly: it saves what is pending, then calls `exit`. */
    onLeave: function (callback) { leave = callback; },
    /**
     * What an Exit button calls. The newest change is stored and answered first (the page shows
     * "Saving..." for at most about three seconds), then OtterTube is asked to leave.
     */
    requestExit: function () {
      if (typeof leave === 'function') leave();
      else if (connection) connection.exit();
    },
    /** Asks OtterTube to leave, now. Whatever is not acknowledged yet may be lost. */
    exit: function () { if (connection) connection.exit(); },
    wait: function (ms) { return new Promise(function (resolve) { root.setTimeout(resolve, ms); }); },
  };
})(window);
