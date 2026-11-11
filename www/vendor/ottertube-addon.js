/*
 * ottertube-addon.js: OtterTube's add-on client, protocol version 1 (docs/USERS_AND_STAGES_PLAN_2026-11-03.md R3.6).
 *
 * An add-on page loads this one file and talks to OtterTube through it, in a browser's frame or the desktop's site view alike:
 *
 *   const ot = OtterTubeAddon.connect({ hosts: ['https://<domain>'] });   // the app's origins, as in your frame-ancestors
 *   const { subject, mode, saved } = await ot.ready;    // saved: { seq, data } or null; subject: an opaque id, or null for Guest
 *   const answer = await ot.checkpoint(text);           // { saved: true, seq } or { saved: false, reason }
 *   ot.exit();                                          // asks OtterTube to leave
 *
 * - **`data` is text,** at most 256 KiB once written as `{"data":…}` in UTF-8. Keep your own state in it (JSON is fine).
 * - **A checkpoint is the acknowledgement:** `saved: true` means it is stored on this device. It syncs later, at exit.
 * - **At most one checkpoint every 2 seconds** reaches OtterTube. Call `checkpoint` as often as you like: calls made while one is on
 *   its way are folded into the next, which carries the newest text, and every caller gets that one's answer.
 * - **Leaving never waits.** When a child leaves, the last acknowledged checkpoint is the save; one not yet answered may be lost. The
 *   next `ready` says what is held. An app that cannot accept that keeps its own data (`mode: 'self'`).
 * - Only `mode: 'host'` saves with OtterTube. Under `self` the app keeps its own data under `subject`; under `none` it keeps nothing.
 *
 * `connect` makes one connection per window: called again, it returns that one, whatever it is given.
 *
 * Transports: the desktop's preload exposes `window.otterTubeAddon` with `post(message)` and `listen(callback)`, and this file uses it
 * when it is there. Otherwise it is a frame, and it posts to `window.parent` for each of `hosts` (only the one the parent really is
 * receives it), and listens only to `window.parent` on one of `hosts`; after the first `init`, only to the origin that sent it. Each
 * host is an origin written in full, `https://host[:port]`, or `http://host[:port]` for an app served locally (a test, or a LAN
 * build); never a wildcard, a path or a trailing slash.
 */
(function (root) {
  'use strict';

  var KEY = 'otAddon';
  var VERSION = 1;
  /** OtterTube's interval, plus room for a message that was slow to arrive. */
  var INTERVAL_MS = 2000 + 250;
  var GENERATION_RE = /^[0-9a-f]{32}$/;
  var SUBJECT_RE = /^[0-9a-f]{32}$/;
  /** https, or http for a local app (see the header): the scheme and authority, nothing after. */
  var ORIGIN_RE = /^https?:\/\/[^/?#\s*]+$/;
  var REASONS = ['rate', 'size', 'invalid', 'seq', 'mode', 'no-user', 'full', 'storage'];

  function isPlain(v) { return typeof v === 'object' && v !== null && !Array.isArray(v); }
  function isSeq(v) { return typeof v === 'number' && Math.floor(v) === v && v >= 0 && v <= Number.MAX_SAFE_INTEGER; }
  function keysAre(o, keys) {
    var own = Object.keys(o);
    if (own.length !== keys.length + 2) return false;
    for (var i = 0; i < own.length; i++) if (own[i] !== KEY && own[i] !== 'type' && keys.indexOf(own[i]) < 0) return false;
    return true;
  }

  /** A host message, or null: exactly its fields, each of the right type. */
  function readHost(m) {
    if (!isPlain(m) || m[KEY] !== VERSION || typeof m.generation !== 'string' || !GENERATION_RE.test(m.generation)) return null;
    if (m.type === 'init') {
      if (!keysAre(m, ['generation', 'subject', 'mode', 'saved'])) return null;
      if (m.subject !== null && !(typeof m.subject === 'string' && SUBJECT_RE.test(m.subject))) return null;
      if (m.mode !== 'host' && m.mode !== 'self' && m.mode !== 'none') return null;
      if (m.saved !== null && !(isPlain(m.saved) && Object.keys(m.saved).length === 2 && isSeq(m.saved.seq) && typeof m.saved.data === 'string')) return null;
      return m;
    }
    if (m.type === 'saved') return keysAre(m, ['generation', 'seq']) && isSeq(m.seq) ? m : null;
    if (m.type === 'failed') return keysAre(m, ['generation', 'seq', 'reason']) && isSeq(m.seq) && REASONS.indexOf(m.reason) >= 0 ? m : null;
    return null;
  }

  function frameTransport(hosts) {
    var parent = root.parent;
    if (!parent || parent === root) throw new Error('OtterTubeAddon: not in a frame, and no desktop bridge');
    var pinned = null;
    return {
      post: function (msg) {
        var targets = pinned ? [pinned] : hosts;
        for (var i = 0; i < targets.length; i++) parent.postMessage(msg, targets[i]);
      },
      listen: function (cb) {
        root.addEventListener('message', function (event) {
          if (event.source !== parent) return;
          if (pinned ? event.origin !== pinned : hosts.indexOf(event.origin) < 0) return;
          if (cb(event.data) === 'init' && !pinned) pinned = event.origin;
        });
      },
    };
  }

  var connection = null;

  function connect(options) {
    if (connection) return connection;
    var bridge = root.otterTubeAddon;
    var transport;
    if (bridge && typeof bridge.post === 'function' && typeof bridge.listen === 'function') {
      transport = { post: function (m) { bridge.post(m); }, listen: function (cb) { bridge.listen(cb); } };
    } else {
      var hosts = options && Array.isArray(options.hosts) ? options.hosts : [];
      if (hosts.length === 0 || !hosts.every(function (h) { return typeof h === 'string' && ORIGIN_RE.test(h); })) {
        throw new Error('OtterTubeAddon: name the app\'s origins in `hosts`, as https://host[:port] (or http:// for a local app)');
      }
      transport = frameTransport(hosts.slice());
    }

    var now = (options && options.now) || (root.performance && typeof root.performance.now === 'function'
      ? function () { return root.performance.now(); } : function () { return Date.now(); });
    var generation = null;
    var seq = 0;
    var lastSent = -Infinity;
    var timer = null;
    /** The text to send next, and who is waiting on it. */
    var pending = null;
    /** The checkpoint on its way: its seq and its waiters. */
    var inFlight = null;
    var resolveReady;
    var ready = new Promise(function (resolve) { resolveReady = resolve; });

    function send(type, fields) {
      var msg = { otAddon: VERSION, type: type };
      for (var k in fields) msg[k] = fields[k];
      transport.post(msg);
    }

    function pump() {
      timer = null;
      if (generation === null || inFlight !== null || pending === null) return;
      var wait = lastSent + INTERVAL_MS - now();
      if (wait > 0) { timer = setTimeout(pump, wait); return; }
      seq += 1;
      inFlight = { seq: seq, waiters: pending.waiters };
      var data = pending.data;
      pending = null;
      lastSent = now();
      send('checkpoint', { generation: generation, seq: seq, data: data });
    }

    transport.listen(function (raw) {
      var m = readHost(raw);
      if (m === null) return null;
      if (m.type === 'init') {
        if (generation !== null) return null; // one document, one init
        generation = m.generation;
        resolveReady({ subject: m.subject, mode: m.mode, saved: m.saved === null ? null : { seq: m.saved.seq, data: m.saved.data } });
        pump();
        return 'init';
      }
      if (m.generation !== generation || inFlight === null || m.seq !== inFlight.seq) return null;
      var answer = m.type === 'saved' ? { saved: true, seq: m.seq } : { saved: false, reason: m.reason };
      var waiters = inFlight.waiters;
      inFlight = null;
      for (var i = 0; i < waiters.length; i++) waiters[i](answer);
      if (timer === null) pump();
      return m.type;
    });

    send('ready', {});

    connection = {
      ready: ready,
      checkpoint: function (data) {
        if (typeof data !== 'string') return Promise.reject(new TypeError('OtterTubeAddon: a checkpoint is text'));
        return new Promise(function (resolve) {
          if (pending === null) pending = { data: data, waiters: [resolve] };
          else { pending.data = data; pending.waiters.push(resolve); }
          if (timer === null) pump();
        });
      },
      exit: function () { send('exit', {}); },
    };
    return connection;
  }

  var api = { connect: connect, version: VERSION };
  root.OtterTubeAddon = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
