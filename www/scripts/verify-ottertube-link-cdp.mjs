#!/usr/bin/env node
// Browser check of the slim OtterTube add-on bundle, with ClockWerx: one child's progress reaches
// OtterTube as a checkpoint, comes back in a fresh browser profile, and is not seen by another child
// or by Guest. The host is www/tests/fixtures/ottertube-fake-host.html, not OtterTube itself.
//
//   OTTERTUBE_LINK_DIST   the packaged bundle (required), packaged with --ottertube-host <host origin>
//   OTTERTUBE_LINK_OUT    where screenshots and report.json go (required; they show private game screens)
//   CHROME_BIN            Chrome or Chromium (found in the usual places if unset)
//   OTTERTUBE_LINK_GAME_PORT (8097), OTTERTUBE_LINK_HOST_PORT (8098), PYTHON (python)
//
// It starts its own two loopback servers and its own headless Chrome with throwaway profiles.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { connect } from "./runtime-cdp.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..", "..");
const dist = process.env.OTTERTUBE_LINK_DIST;
const outDir = process.env.OTTERTUBE_LINK_OUT;
if (!dist || !outDir) throw new Error("Set OTTERTUBE_LINK_DIST and OTTERTUBE_LINK_OUT");
mkdirSync(outDir, { recursive: true });
const gamePort = Number(process.env.OTTERTUBE_LINK_GAME_PORT ?? 8097);
const hostPort = Number(process.env.OTTERTUBE_LINK_HOST_PORT ?? 8098);
const gameOrigin = `http://127.0.0.1:${gamePort}`;
const hostOrigin = `http://127.0.0.1:${hostPort}`;
const chromePath = process.env.CHROME_BIN ?? [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].find(existsSync);
if (!chromePath) throw new Error("Set CHROME_BIN to a Chrome/Chromium executable");
const link = JSON.parse(readFileSync(join(dist, "ottertube-link.json"), "utf8"));
if (!link.hosts.includes(hostOrigin)) {
  throw new Error(`The bundle was packaged for ${link.hosts.join(", ")}; package it with --ottertube-host ${hostOrigin}`);
}

const GAME_ID = "clockwerx-personal-10";
const SUBJECT = { a: "a".repeat(32), b: "b".repeat(32), c: "c".repeat(32), d: "d".repeat(32) };
const scopeOf = (subject) => `${GAME_ID}@${subject}`;
// ClockWerx's 640x480 screen. The New game screen follows the title once it is clicked.
const AWAY = [30, 300];
const EASY = [243, 307];
const MEDIUM = [311, 307];
const NAME_FIELD = [210, 137];
const PLAY = [318, 402];
const DIFFICULTY_ROW = { x: 144, y: 297, w: 269, h: 22 };
const NAME_BOX = { x: 150, y: 128, w: 125, h: 20 };
const EXPECTED_PATHS = [
  "ClockWerx/System Folder/Preferences/ClockWerx Scores",
  "ClockWerx/System Folder/Preferences/ClockWerx Settings",
];

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass: !!pass, detail });
  process.stderr.write(`${pass ? "ok  " : "FAIL"} ${name}${detail === undefined ? "" : " :: " + JSON.stringify(detail)}\n`);
}
const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16);

function decodeSaveText(text) {
  const [prefix, version, encoded] = text.split(":");
  if (prefix !== "systemless-save" || version !== "1") throw new Error("not a version 1 save text");
  const payload = JSON.parse(inflateRawSync(Buffer.from(encoded, "base64")).toString("utf8"));
  return {
    ...payload,
    files: payload.files.map((file) => ({ ...file, forks: sha(file.data_fork + "|" + file.resource_fork) })),
  };
}

/** A save text with the same files and another counter, as another device could have written it. */
function withCounter(text, counter) {
  const [prefix, version, encoded] = text.split(":");
  const payload = JSON.parse(inflateRawSync(Buffer.from(encoded, "base64")).toString("utf8"));
  payload.counter = counter;
  return `${prefix}:${version}:${deflateRawSync(Buffer.from(JSON.stringify(payload))).toString("base64")}`;
}

// ---- servers ----
// `localhost` is the same server under an origin the bundle does not list. The test server lets it
// frame the page (frame-ancestors would otherwise stop it) so the page's own check can be seen.
const strangerOrigin = `http://localhost:${hostPort}`;
const gameServer = spawn(process.env.PYTHON ?? "python",
  [join(repoRoot, "scripts", "serve_ottertube_link.py"), "--directory", dist, "--port", String(gamePort),
    "--also-frame-ancestor", strangerOrigin],
  { stdio: ["ignore", "ignore", "inherit"] });
const hostPage = join(repoRoot, "www", "tests", "fixtures", "ottertube-fake-host.html");
const hostServer = createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(readFileSync(hostPage));
});
await new Promise((done, fail) => hostServer.once("error", fail).listen(hostPort, "127.0.0.1", done));
// The same page for `localhost` when that name resolves to ::1 first.
const hostServer6 = createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(readFileSync(hostPage));
});
await new Promise((done) => hostServer6.once("error", done).listen(hostPort, "::1", done));

async function waitFor(what, probe, timeoutMs = 60_000, everyMs = 250) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const value = await probe();
      if (value) return value;
    } catch { /* not yet */ }
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}`);
    await sleep(everyMs);
  }
}
await waitFor("the bundle server", async () => {
  const health = await (await fetch(`${gameOrigin}/_macgames/health`)).json();
  return health.app === "systemless-ottertube-link";
}, 20_000);

// ---- one browser profile ----
async function openBrowser(label) {
  const userDataDir = await mkdtemp(join(tmpdir(), `ottertube-link-${label}-`));
  const port = 9600 + Math.floor(Math.random() * 300);
  const chrome = spawn(chromePath, [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`,
    "--autoplay-policy=no-user-gesture-required", "--no-first-run", "--no-default-browser-check",
    "--window-size=1100,1100", "about:blank",
  ], { stdio: "ignore" });
  const target = await waitFor("Chrome", async () =>
    (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((item) => item.type === "page"), 30_000);
  const page = connect(target.webSocketDebuggerUrl);
  await page.ready;
  await page.send("Page.enable");

  async function evalIn(contextId, expression) {
    const result = await page.send("Runtime.evaluate", { expression, contextId, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  }
  const host = (expression) => evalIn(undefined, expression);
  // The framed game page, through an isolated world: its DOM and its origin's storage.
  async function game(expression) {
    const tree = await page.send("Page.getFrameTree");
    const child = tree.frameTree.childFrames?.[0]?.frame;
    if (!child) throw new Error("no framed page");
    const world = await page.send("Page.createIsolatedWorld", { frameId: child.id, worldName: "verify" });
    return evalIn(world.executionContextId, expression);
  }
  // A frame on another site runs in its own process and is its own debugging target.
  async function otherSiteFrame(origin, expression) {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const target = targets.find((item) => item.type === "iframe" && item.url.startsWith(origin));
    if (!target) throw new Error("no frame on " + origin);
    const frame = connect(target.webSocketDebuggerUrl);
    await frame.ready;
    try {
      const result = await frame.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    } finally { try { frame.close(); } catch { /* closing */ } }
  }
  async function canvasBox() {
    const frame = await host(`(() => { const r = document.querySelector("iframe").getBoundingClientRect(); return { x: r.x, y: r.y }; })()`);
    const canvas = await game(`(() => { const r = document.querySelector("canvas.game-canvas").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
    return { x: frame.x + canvas.x, y: frame.y + canvas.y, w: canvas.w, h: canvas.h };
  }
  async function click([h, v]) {
    const box = await canvasBox();
    const x = box.x + (h + 0.5) * box.w / 640;
    const y = box.y + (v + 0.5) * box.h / 480;
    const event = (type, buttons) => page.send("Input.dispatchMouseEvent",
      { type, x, y, button: type === "mouseMoved" ? "none" : "left", buttons, clickCount: type === "mouseMoved" ? 0 : 1, pointerType: "mouse" });
    await event("mouseMoved", 0);
    await event("mousePressed", 1);
    await sleep(250);
    await event("mouseReleased", 0);
  }
  async function type(text) {
    for (const key of text) {
      const code = `Key${key.toUpperCase()}`;
      await page.send("Input.dispatchKeyEvent", { type: "keyDown", key, code, text: key });
      await sleep(140);
      await page.send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
      await sleep(140);
    }
  }
  // A piece of the game's screen as PNG bytes (base64). Static parts compare equal between runs.
  async function clip(rect, file) {
    const box = await canvasBox();
    const scale = box.w / 640;
    const shot = await page.send("Page.captureScreenshot", { format: "png", clip: rect
      ? { x: box.x + rect.x * scale, y: box.y + rect.y * scale, width: rect.w * scale, height: rect.h * scale, scale: 1 }
      : { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 } });
    if (file) writeFileSync(join(outDir, file), Buffer.from(shot.data, "base64"));
    return sha(shot.data);
  }
  const events = () => host(`fakeHost.events.map((e) => ({ ...e, data: undefined }))`);
  const storedKeys = () => game(`new Promise((done, fail) => {
    const open = indexedDB.open("systemless-save-files");
    open.onerror = () => fail(new Error("indexedDB"));
    open.onupgradeneeded = () => open.result.createObjectStore("files");
    open.onsuccess = () => {
      const all = open.result.transaction("files").objectStore("files").getAllKeys();
      all.onsuccess = () => { open.result.close(); done(all.result.map((key) => key.replace("\\u0000", "|"))); };
    };
  })`);
  const storedRecord = (key) => game(`new Promise((done) => {
    const open = indexedDB.open("systemless-save-files");
    open.onsuccess = () => {
      const get = open.result.transaction("files").objectStore("files").get(${JSON.stringify(key)}.replace("|", "\\u0000"));
      get.onsuccess = () => { open.result.close(); done(get.result ?? null); };
    };
  })`);
  // The counter committed with a scope's files, or null.
  const storedCounter = async (scope) => {
    const record = await storedRecord(`ottertube-counter|${scope}`);
    return record ? JSON.parse(record).ottertube_counter : null;
  };
  const saveState = () => game(`(() => { const d = document.querySelector(".app--ottertube").dataset;
    return { counter: Number(d.saveCounter), stored: Number(d.saveStored), acknowledged: Number(d.saveAcknowledged), host: d.saveHost }; })()`);
  const held = (subject) => host(`fakeHost.held(${JSON.stringify(subject)})`);

  /** Open the host page for a subject and wait until the game is on its New game screen. */
  async function play(subject, { query = "", prepare } = {}) {
    const name = subject === SUBJECT.a ? "a" : subject === SUBJECT.b ? "b" : subject;
    const url = `${hostOrigin}/?game=${encodeURIComponent(`${gameOrigin}/clockwerx/`)}&subject=${name}${query}`;
    await page.send("Page.navigate", { url: prepare ? `${url}&autostart=0` : url });
    await waitFor("the host page", () => host(`typeof fakeHost === "object"`), 15_000);
    if (prepare) { await prepare(); await host(`fakeHost.open()`); }
    const init = await waitFor("init", async () => (await events()).find((event) => event.type === "init"), 20_000);
    await waitFor("the game to run", () => game(`document.querySelector("canvas.game-canvas")?.dataset.runtimeGameId === ${JSON.stringify(GAME_ID)}`), 120_000);
    await sleep(8000); // the title sequence
    await click(AWAY); // any click leaves the title for the New game screen
    await sleep(3000);
    return init;
  }

  return {
    page, host, game, otherSiteFrame, click, type, clip, events, storedKeys, storedRecord, storedCounter, saveState, held, play,
    async close() {
      try { page.close(); } catch { /* closing */ }
      chrome.kill();
      await sleep(500);
      await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

const report = { bundle: resolve(dist), hostOrigin, gameOrigin, chrome: chromePath };
const keysOf = (subject) => [...EXPECTED_PATHS.map((path) => `${scopeOf(subject)}|${path}`), `ottertube-counter|${scopeOf(subject)}`];
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const noCheckpoint = (events) => events.every((event) => event.type !== "checkpoint");
/** One part of the run. A part that throws fails by name and the run goes on. */
async function part(name, body) {
  try { await body(); }
  catch (error) { check(`${name}: ran to its end`, false, String(error?.stack ?? error)); }
}
let first, second;
try {
  // ---------- profile 1: child A changes a setting and starts a game ----------
  first = await openBrowser("p1");
  const initA = await first.play("a");
  check("A: init carries the subject and no save", initA.subject === SUBJECT.a && initA.savedSeq === null, initA);
  const kiosk = await first.game(`({
    exit: !!document.querySelector("[data-kiosk-exit]"),
    allGames: document.querySelectorAll('a[href="/"]').length,
    anyLink: document.querySelectorAll("a[href]").length,
    fullscreen: document.querySelectorAll("[data-fullscreen], .koji-exit-fullscreen").length,
    filesDialog: document.querySelectorAll(".game-files-dialog, .game-files-tab").length,
    header: document.querySelectorAll(".site-header, .site-footer, .related-games, .back").length,
  })`);
  check("kiosk: Exit is offered; no library link, fullscreen button, Saved files tab or site chrome",
    kiosk.exit && kiosk.allGames === 0 && kiosk.anyLink === 0 && kiosk.fullscreen === 0 && kiosk.filesDialog === 0 && kiosk.header === 0, kiosk);
  const defaultRow = await first.clip(DIFFICULTY_ROW, "a-1-default-row.png");
  const defaultName = await first.clip(NAME_BOX, "a-1-default-name.png");
  await first.clip(null, "a-1-new-game-default.png");
  check("A: nothing is sent or stored before anything changes",
    (await first.events()).every((event) => event.type !== "checkpoint") && (await first.storedKeys()).length === 0);

  await first.click(EASY);
  await sleep(1200);
  await first.click(AWAY);
  await sleep(600);
  const easyRow = await first.clip(DIFFICULTY_ROW, "a-2-easy-row.png");
  check("A: choosing Easy changes the Difficulty row on screen", easyRow !== defaultRow);
  await first.click(NAME_FIELD);
  await sleep(500);
  await first.type("Pilot");
  await sleep(600);
  await first.clip(null, "a-2-new-game-changed.png");
  const beforePlay = Date.now();
  await first.click(PLAY);
  const checkpoint = await waitFor("A's checkpoint", async () => (await first.events()).find((event) => event.type === "checkpoint" && !event.reason), 40_000);
  report.checkpointAfterPlayMs = checkpoint.at - beforePlay;
  // ClockWerx writes Settings, then Scores: the first checkpoint goes at once with what is there,
  // and the second, with both files, follows when the 2-second limit allows.
  const heldA = await waitFor("the save with both files", async () => {
    const held = await first.host(`fakeHost.held(${JSON.stringify(SUBJECT.a)})`);
    return held && decodeSaveText(held.data).files.length === EXPECTED_PATHS.length ? held : null;
  }, 20_000);
  const saveA = decodeSaveText(heldA.data);
  report.saveA = { chars: heldA.data.length, counter: saveA.counter,
    files: saveA.files.map((file) => ({ path: file.path, data: Buffer.from(file.data_fork, "base64").length, resource: Buffer.from(file.resource_fork, "base64").length })) };
  check("A: the first checkpoint arrived promptly after the change", report.checkpointAfterPlayMs < 5000, { seq: checkpoint.seq, bodyBytes: checkpoint.bytes, afterPlayMs: report.checkpointAfterPlayMs });
  check("A: OtterTube's stand-in holds the newest checkpoint", heldA.seq >= checkpoint.seq, { seq: heldA.seq, chars: heldA.data.length });
  check("A: the save text names this game and has a counter", saveA.game_id === GAME_ID && saveA.counter > 0, { counter: saveA.counter });
  check("A: the save holds ClockWerx's Scores and Settings by FULL path",
    JSON.stringify(saveA.files.map((file) => file.path)) === JSON.stringify(EXPECTED_PATHS), saveA.files.map((file) => file.path));
  const keysA = await first.storedKeys();
  check("A: the local copy is stored under {game}@{subject}, with its counter beside it", same(keysA, keysOf(SUBJECT.a)), keysA);
  const counterA = await waitFor("A's committed counter", async () => (await first.storedCounter(scopeOf(SUBJECT.a))) === saveA.counter, 5000).catch(() => false);
  check("A: the counter committed with the files equals the counter in the save text", counterA, { stored: await first.storedCounter(scopeOf(SUBJECT.a)), text: saveA.counter });
  check("A: no counter is kept outside that transaction", (await first.game(`Object.keys(localStorage).filter((key) => key.includes("counter"))`)).length === 0);
  await sleep(4500);
  const allA = await first.events();
  const taken = allA.filter((event) => event.type === "checkpoint" && !event.reason);
  check("A: no checkpoint was refused, and none came sooner than 2,000 ms after another",
    allA.every((event) => !event.reason) && taken.every((event) => event.sinceLastMs === null || event.sinceLastMs >= 2000),
    taken.map((event) => ({ seq: event.seq, sinceLastMs: event.sinceLastMs })));
  report.checkpointsA = taken.length;

  // ---------- profile 1: child B, same browser ----------
  const initB = await first.play("b");
  check("B: init carries B's subject and no save", initB.subject === SUBJECT.b && initB.savedSeq === null, initB);
  const rowB = await first.clip(DIFFICULTY_ROW, "b-1-row.png");
  const nameB = await first.clip(NAME_BOX, "b-1-name.png");
  await first.clip(null, "b-1-new-game.png");
  check("B: the game shows the defaults, not A's Easy or A's name", rowB === defaultRow && nameB === defaultName, { rowB, defaultRow, easyRow, nameB, defaultName });
  const keysWithB = await first.storedKeys();
  check("B: nothing is stored for B, and A's files are untouched",
    JSON.stringify(keysWithB) === JSON.stringify(keysA), keysWithB);
  await sleep(3000);
  check("B: nothing is sent while B changes nothing, and nothing is held for B",
    (await first.events()).every((event) => event.type !== "checkpoint") && (await first.host(`fakeHost.held(${JSON.stringify(SUBJECT.b)})`)) === null);

  // ---------- profile 1: Guest changes the same things ----------
  const initGuest = await first.play("guest");
  check("Guest: init carries no subject and no save", initGuest.subject === null && initGuest.savedSeq === null, initGuest);
  const rowGuest = await first.clip(DIFFICULTY_ROW, "guest-1-row.png");
  const nameGuest = await first.clip(NAME_BOX);
  check("Guest: the game shows the defaults", rowGuest === defaultRow && nameGuest === defaultName);
  await first.click(EASY);
  await sleep(1200);
  await first.click(NAME_FIELD);
  await sleep(500);
  await first.type("Guest");
  await sleep(600);
  await first.click(PLAY);
  await sleep(9000);
  await first.clip(null, "guest-2-after-play.png");
  const guestEvents = await first.events();
  check("Guest: no checkpoint is even attempted", guestEvents.every((event) => event.type !== "checkpoint"), guestEvents.map((event) => event.type));
  const keysAfterGuest = await first.storedKeys();
  check("Guest: nothing is stored (records and counters are still only A's)", same(keysAfterGuest, keysA), { keysAfterGuest });

  // ---------- profile 1: A again, from the local copy ----------
  const initA2 = await first.play("a");
  check("A again: init hands back the save held", initA2.subject === SUBJECT.a && initA2.savedSeq === heldA.seq, initA2);
  const rowA2 = await first.clip(DIFFICULTY_ROW, "a-3-row-again.png");
  await first.clip(null, "a-3-new-game-again.png");
  check("A again: Easy is still chosen", rowA2 === easyRow, { rowA2, easyRow });
  await sleep(3000);
  check("A again: the copies are level, so nothing is sent", (await first.events()).every((event) => event.type !== "checkpoint"));

  // ---------- a refused checkpoint is sent again ----------
  await part("refused", async () => {
    await first.play(SUBJECT.b, { query: "&refuse=rate:2" });
    await first.click(EASY);
    await sleep(1000);
    await first.click(NAME_FIELD);
    await sleep(500);
    await first.type("Bee");
    await sleep(500);
    await first.click(PLAY);
    const kept = await waitFor("a checkpoint kept after the refusals", async () => (await first.events()).find((event) => event.type === "checkpoint" && !event.reason), 30_000).catch(() => null);
    const all = (await first.events()).filter((event) => event.type === "checkpoint");
    const refused = all.filter((event) => event.injected);
    report.refused = all.map((event) => ({ seq: event.seq, reason: event.reason ?? null, t: event.t }));
    check("refused: OtterTube's stand-in answered `failed: rate` twice", refused.length === 2 && refused.every((event) => event.reason === "rate"), report.refused);
    check("refused: the newest text was sent again and kept", !!kept, report.refused);
    check("refused: the resend came at least 2,000 ms after the refusal before it",
      !!kept && kept.t - refused.at(-1).t >= 2000, kept && { afterMs: kept.t - refused.at(-1).t });
    const heldB = await first.held(SUBJECT.b);
    const state = await first.saveState();
    check("refused: what is held is the newest change (its counter is the page's counter)",
      !!heldB && decodeSaveText(heldB.data).counter === state.counter && state.acknowledged === state.counter, { state, held: heldB && decodeSaveText(heldB.data).counter });
  });

  // ---------- Exit while the newest change has not been answered ----------
  await part("exit", async () => {
    await first.play(SUBJECT.c);
    await first.click(EASY);
    await sleep(1000);
    await first.click(NAME_FIELD);
    await sleep(500);
    await first.type("Bee");
    await sleep(500);
    await first.click(PLAY);
    // Settings is written, then Scores: the second text waits in the client for the 2-second limit.
    const pending = await waitFor("a change that is not acknowledged yet", async () => {
      const state = await first.saveState();
      return state.acknowledged > 0 && state.counter > state.acknowledged ? state : null;
    }, 20_000, 30);
    const clicked = Date.now();
    await first.game(`document.querySelector("[data-kiosk-exit]").click()`);
    const saving = await first.game(`document.querySelector(".ottertube-saving")?.innerText ?? null`).catch(() => null);
    const left = await waitFor("exit", async () => (await first.events()).find((event) => event.type === "exit"), 8000, 50).catch(() => null);
    const events = await first.events();
    const heldC = await first.held(SUBJECT.c);
    const heldCounter = heldC ? decodeSaveText(heldC.data).counter : null;
    report.exit = { pending, heldCounter, waitedMs: left ? left.at - clicked : null, order: events.filter((event) => ["checkpoint", "exit"].includes(event.type)).map((event) => event.type + (event.reason ? ":" + event.reason : "")) };
    check("exit: the child is told it is saving", /Saving/.test(saving ?? ""), saving);
    check("exit: the change that was pending when Exit was pressed is what OtterTube holds", heldCounter === pending.counter, report.exit);
    check("exit: `exit` was sent after that checkpoint was answered, and within about 3 s",
      !!left && report.exit.order.at(-1) === "exit" && report.exit.order.at(-2) === "checkpoint" && report.exit.waitedMs < 3600, report.exit);
  });

  // ---------- a held save this build cannot read ----------
  let mediumRow = null;
  let heldM = null;
  await part("unreadable", async () => {
    const future = "systemless-save:2:" + heldA.data.split(":")[2];
    await first.play(SUBJECT.a, { prepare: () => first.host(`fakeHost.importSave(${JSON.stringify(SUBJECT.a)}, ${JSON.stringify(future)})`) });
    check("unreadable: the game still runs, from the local copy", (await first.clip(DIFFICULTY_ROW)) === easyRow);
    check("unreadable: the page says it is not sending", (await first.saveState()).host === "off", await first.saveState());
    await first.click(MEDIUM);
    await sleep(1000);
    await first.click(AWAY);
    await sleep(600);
    mediumRow = await first.clip(DIFFICULTY_ROW, "a-4-medium-row.png");
    await first.click(PLAY);
    const stored = await waitFor("the change stored locally", async () => {
      const state = await first.saveState();
      return state.counter > saveA.counter && state.stored === state.counter ? state : null;
    }, 20_000).catch(() => null);
    await sleep(6000);
    check("unreadable: the change is kept locally", !!stored && (await first.storedCounter(scopeOf(SUBJECT.a))) > saveA.counter, stored);
    check("unreadable: no checkpoint is sent at all", noCheckpoint(await first.events()), (await first.events()).map((event) => event.type));
    check("unreadable: what OtterTube holds is untouched", (await first.held(SUBJECT.a))?.data === future);
  });

  // ---------- the local copy is newer than the held save ----------
  await part("local newer", async () => {
    const localCounter = await first.storedCounter(scopeOf(SUBJECT.a));
    const init = await first.play(SUBJECT.a, { prepare: () => first.host(`fakeHost.importSave(${JSON.stringify(SUBJECT.a)}, ${JSON.stringify(heldA.data)})`) });
    check("local newer: init hands over the older save", init.bytes === heldA.data.length && localCounter > saveA.counter, { localCounter, held: saveA.counter });
    check("local newer: the local copy wins on screen (Medium)", !!mediumRow && (await first.clip(DIFFICULTY_ROW, "a-5-local-newer-row.png")) === mediumRow);
    heldM = await waitFor("the local copy sent again", async () => {
      const held = await first.held(SUBJECT.a);
      return held && decodeSaveText(held.data).counter === localCounter ? held : null;
    }, 15_000).catch(() => null);
    check("local newer: the local copy is sent again without any change, and OtterTube then holds it", !!heldM, { localCounter });
  });

  // ---------- kiosk: Exit, and a page that is not inside OtterTube ----------
  await first.game(`document.querySelector("[data-kiosk-exit]").click()`);
  const left = await waitFor("exit", async () => (await first.events()).find((event) => event.type === "exit"), 5000).catch(() => null);
  check("kiosk: Exit sends the add-on exit, and the host takes the page away",
    !!left && (await first.host(`document.querySelector("iframe") === null`)));

  await first.page.send("Page.navigate", { url: `${hostOrigin}/?game=${encodeURIComponent(`${gameOrigin}/clockwerx/`)}&subject=a&silent=1` });
  await sleep(2500);
  const waiting = await first.game(`({ state: document.querySelector(".app--ottertube")?.dataset.ottertube, canvas: document.querySelectorAll("canvas").length })`);
  await sleep(4500);
  const silent = await first.game(`({ state: document.querySelector(".app--ottertube")?.dataset.ottertube, canvas: document.querySelectorAll("canvas").length, text: document.querySelector(".ottertube-plain")?.innerText })`);
  check("no init: the page waits, then shows a plain message and starts no game",
    waiting.state === "connecting" && waiting.canvas === 0 && silent.state === "absent" && silent.canvas === 0 && /inside OtterTube/.test(silent.text ?? ""), { waiting, silent });
  check("no init: no saved game was touched", (await first.storedKeys()).filter((key) => key.includes(SUBJECT.a)).length === keysA.length);

  // ---------- a parent on an origin the bundle does not list ----------
  await part("stranger", async () => {
    await first.page.send("Page.navigate", { url: `${strangerOrigin}/?game=${encodeURIComponent(`${gameOrigin}/clockwerx/`)}&subject=a&unsolicited=1` });
    await waitFor("the stranger's page", () => first.host(`typeof fakeHost === "object" && location.origin === ${JSON.stringify(strangerOrigin)}`), 15_000);
    await sleep(7000);
    const events = await first.events();
    const page = await first.otherSiteFrame(gameOrigin, `({ state: document.querySelector(".app--ottertube")?.dataset.ottertube, canvas: document.querySelectorAll("canvas").length })`);
    report.stranger = { sent: events.filter((event) => event.type === "unsolicited-init").length, heard: events.filter((event) => event.dir === "in ").length, page };
    check("stranger: the page loaded in its frame and was sent `init` messages", report.stranger.sent >= 5 && !!page.state, report.stranger);
    check("stranger: the page ignored them (no game started) and told the stranger nothing",
      page.state === "absent" && page.canvas === 0 && report.stranger.heard === 0, report.stranger);
  });

  await first.page.send("Page.navigate", { url: `${gameOrigin}/clockwerx/` });
  const alone = await waitFor("the page opened on its own", async () => {
    const result = await first.host(`({ state: document.querySelector(".app--ottertube")?.dataset.ottertube, canvas: document.querySelectorAll("canvas").length, links: document.querySelectorAll("a[href]").length })`);
    return result.state === "absent" ? result : null;
  }, 10_000).catch(() => null);
  check("opened outside OtterTube: a plain message, no game, no links", !!alone && alone.canvas === 0 && alone.links === 0, alone);
  await first.page.send("Page.navigate", { url: `${gameOrigin}/` });
  await sleep(2500);
  const root = await first.host(`({ state: document.querySelector(".app--ottertube")?.dataset.ottertube, cards: document.querySelectorAll(".library-card, .related-card, a[href]").length })`);
  check("the bundle's root lists no games", root.state === "absent" && root.cards === 0, root);
  await first.close();
  first = null;

  // ---------- profile 2: a fresh browser given A's save ----------
  second = await openBrowser("p2");
  const initFresh = await second.play("a", {
    prepare: () => second.host(`fakeHost.importSave(${JSON.stringify(SUBJECT.a)}, ${JSON.stringify(heldA.data)})`),
  });
  check("fresh profile: init hands A the save from elsewhere", initFresh.subject === SUBJECT.a && initFresh.savedSeq === 0 && initFresh.bytes === heldA.data.length, initFresh);
  const rowFresh = await second.clip(DIFFICULTY_ROW, "fresh-a-row.png");
  const nameFresh = await second.clip(NAME_BOX, "fresh-a-name.png");
  await second.clip(null, "fresh-a-new-game.png");
  check("fresh profile: A's Easy is restored on screen", rowFresh === easyRow, { rowFresh, easyRow, defaultRow });
  check("fresh profile: the name box is not the empty default", nameFresh !== defaultName, { nameFresh, defaultName });
  const keysFresh = await second.storedKeys();
  check("fresh profile: the restored files are stored under A's scope", same(keysFresh, keysOf(SUBJECT.a)), keysFresh);
  let sameBytes = true;
  for (const file of saveA.files) {
    const record = JSON.parse(await second.storedRecord(`${scopeOf(SUBJECT.a)}|${file.path}`));
    sameBytes &&= sha(record.data_fork_b64 + "|" + record.resource_fork_b64) === file.forks
      && record.file_type === file.file_type && record.creator === file.creator;
  }
  check("fresh profile: both forks, type and creator of each stored file equal the save's", sameBytes);
  check("fresh profile: the committed counter is the save's counter", (await second.storedCounter(scopeOf(SUBJECT.a))) === saveA.counter);
  await sleep(3000);
  check("fresh profile: nothing is sent back while nothing changes", (await second.events()).every((event) => event.type !== "checkpoint"));

  const initFreshB = await second.play("b");
  const rowFreshB = await second.clip(DIFFICULTY_ROW, "fresh-b-row.png");
  const nameFreshB = await second.clip(NAME_BOX);
  check("fresh profile: B still sees the defaults", initFreshB.savedSeq === null && rowFreshB === defaultRow && nameFreshB === defaultName, { rowFreshB, defaultRow });

  // ---------- the held save is newer than a local copy that exists ----------
  await part("held newer", async () => {
    if (!heldM) throw new Error("no newer save to give (an earlier part failed)");
    const saveM = decodeSaveText(heldM.data);
    const before = await second.storedCounter(scopeOf(SUBJECT.a));
    await second.play(SUBJECT.a, { prepare: () => second.host(`fakeHost.importSave(${JSON.stringify(SUBJECT.a)}, ${JSON.stringify(heldM.data)})`) });
    check("held newer: the profile held an older local copy", before === saveA.counter && saveM.counter > before, { before, held: saveM.counter });
    check("held newer: the held save wins on screen (Medium)", (await second.clip(DIFFICULTY_ROW, "fresh-a-held-newer-row.png")) === mediumRow);
    let sameBytes = true;
    for (const file of saveM.files) {
      const record = JSON.parse(await second.storedRecord(`${scopeOf(SUBJECT.a)}|${file.path}`));
      sameBytes &&= sha(record.data_fork_b64 + "|" + record.resource_fork_b64) === file.forks;
    }
    check("held newer: the older records were replaced by the held files, with the held counter",
      sameBytes && same(await second.storedKeys().then((keys) => keys.filter((key) => key.includes(SUBJECT.a))), keysOf(SUBJECT.a))
      && (await second.storedCounter(scopeOf(SUBJECT.a))) === saveM.counter);
    await sleep(3000);
    check("held newer: nothing is sent back", noCheckpoint(await second.events()));
  });

  // ---------- a tie: the same counter on both sides, different files ----------
  await part("tie", async () => {
    if (!heldM) throw new Error("no local copy to tie with (an earlier part failed)");
    const saveM = decodeSaveText(heldM.data);
    // The Easy files under the counter the local (Medium) copy has: a local copy whose files and
    // counter did not belong together would look like this.
    const tied = withCounter(heldA.data, saveM.counter);
    await second.play(SUBJECT.a, { prepare: () => second.host(`fakeHost.importSave(${JSON.stringify(SUBJECT.a)}, ${JSON.stringify(tied)})`) });
    const row = await second.clip(DIFFICULTY_ROW, "fresh-a-tie-row.png");
    check("tie: the held save is taken (Easy), not the local copy (Medium)", row === easyRow, { row, easyRow, mediumRow });
    await sleep(3000);
    check("tie: nothing is sent back", noCheckpoint(await second.events()));
  });
} catch (error) {
  check("the run completed", false, String(error?.stack ?? error));
} finally {
  await first?.close().catch(() => {});
  await second?.close().catch(() => {});
  hostServer.close();
  hostServer6.close();
  gameServer.kill();
}

report.checks = checks;
report.passed = checks.filter((item) => item.pass).length;
report.failed = checks.filter((item) => !item.pass).length;
writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ passed: report.passed, failed: report.failed, saveA: report.saveA, checkpointAfterPlayMs: report.checkpointAfterPlayMs,
  refused: report.refused, exit: report.exit, stranger: report.stranger, report: join(outDir, "report.json") }, null, 2));
process.exit(report.failed === 0 ? 0 : 1);
