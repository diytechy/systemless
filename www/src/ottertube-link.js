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
    exit: function () { if (connection) connection.exit(); },
  };
})(window);
