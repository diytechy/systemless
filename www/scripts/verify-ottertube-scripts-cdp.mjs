#!/usr/bin/env node
// Browser check of the add-on's script runner being stopped, and of the blocked controls a child
// cannot reach in the bundle as shipped. The bundle's own games file is used with a few additions,
// served to the page as /ottertube-games.dev.json (which the page reads on a loopback host only):
//
//   ClockWerx   a script that holds a key for six seconds and then holds another ("Hold test"),
//               and one that holds a key for a second and a half ("Short test")
//   Delirium    a script that holds a key and then makes the game quit ("Quit test"); the
//               Preferences button is left open, so the controls blocked inside Preferences
//               (Deregister, Clear Highscores, Default Keys, Set Keys) can be touched; and the
//               lowest score in the game's own table is seeded to nothing for a child with no
//               save, so that any score makes the table and the game asks for a name
//
//   ClockWerx   also: a script whose only step is one look at the screen ("late-test"), and the
//               Keyboard or Mouse switch left open, to show that its block is what stops it and
//               that a save left in Mouse control comes back in Keyboard control
//
// Two switches in the page address, which the page honours on a loopback host only, are used:
// systemless-test-screens=slow (every look at the screen starts 600 ms late) and
// systemless-test-scan=paused-slow (the last save scan answers 1.2 s late). One hook of the page's
// own is called, `test-cancel` (stop the running script without leaving), also loopback only.
//
// Also checked: once Exit is pressed nothing starts and nothing reaches the game, during its wait
// and after; Exit before the game is up means its launch script never runs; a cancelled script's
// late look at the screen does not end the script that followed; a control blocked on a screen
// takes no touch from the moment the screen comes up.
//
// What is checked: Exit, and the game quitting, stop a running script at once, let go of what it
// holds, and its later steps never run; while a script runs the child's input goes nowhere, a key
// the child holds is up and comes back afterwards, and a tap action caught half way leaves no key
// down; the
// four controls inside Delirium's Preferences take no touch, and Start is one press from there;
// Start, and a controller's A, get past Delirium's "enter your name" screen, as PLAYER when no
// letter was tapped and with the child's own letters when some were.
//
// Delirium keeps its score table in memory until it quits by its own Quit. After a score went into
// the table on a visit, Exit makes the game quit first (`quit_first`): checked from the menu and
// from a game in play, with the table in the saved text and back on the next visit, Exit pressed
// twice, nothing else let through meanwhile, and no time added when there was no new score or the
// visit is Guest. A game given too long to quit is left as it is, after the timeout. For that one
// part the games file is rewritten for a moment (the bundle server reads it on every request).
//
// Touches held back for a fresh look at the screen: one cancelled, or slid away, while the look is
// under way comes to nothing; a tap is made. The guest's one button has one owner, a held-back
// touch or an ordinary press: a held-back touch whose look answers while another holds it is
// dropped, whether that other is an ordinary press or another held-back tap, and nobody moves or
// lets go of a press that is not their own.
//
// Environment as verify-ottertube-link-cdp.mjs. The fake host is opened with keep=1, so the page
// can still be read after it has asked to leave.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodeSaveText, repoRoot, sleep, startStage, waitFor } from "./ottertube-cdp-kit.mjs";

const outDir = process.env.OTTERTUBE_LINK_OUT;
if (!outDir) throw new Error("Set OTTERTUBE_LINK_DIST and OTTERTUBE_LINK_OUT");
mkdirSync(outDir, { recursive: true });
const CLOCKWERX = "clockwerx-personal-10", DELIRIUM = "delirium-personal-11", BLOBBO = "blobbo-full-personal-101";
const games = JSON.parse(readFileSync(join(repoRoot, "www", "src", "ottertube-games.json"), "utf8"));
const HOLD_FRAMES = 360, AFTER_FRAMES = 180;
games[CLOCKWERX].scripts["hold-test"] = [{ hold: "Meta" }, { wait: HOLD_FRAMES }, { hold: "Alt" }, { wait: AFTER_FRAMES }, { release: "Alt" }, { release: "Meta" }];
games[CLOCKWERX].actions.push({ label: "Hold test", script: "hold-test" });
games[CLOCKWERX].scripts["short-test"] = [{ hold: "Meta" }, { wait: 90 }, { release: "Meta" }];
games[CLOCKWERX].actions.push({ label: "Short test", script: "short-test" });
games[CLOCKWERX].scripts["late-test"] = [{ hold: "Alt" }, { stop_unless: "title" }];
const mouseSwitch = games[CLOCKWERX].blocks.filter((block) => /Keyboard or Mouse/.test(block.what));
if (mouseSwitch.length !== 1) throw new Error("ClockWerx's Keyboard or Mouse block was not found");
games[CLOCKWERX].blocks = games[CLOCKWERX].blocks.filter((block) => block !== mouseSwitch[0]);
// Blobbo: a Save in which a stray letter lands in the dialog's name before the script confirms it.
games[BLOBBO].scripts["spoiled-save"] = [{ stop_unless: "board" }, { press: "Meta+s" }, { until: { screen: "save-dialog", timeout: 300 } }, { wait: 30 },
  { press: "s" }, { wait: 20 }, { run: "save-confirm" }, { until: { screen: "board", timeout: 600 } }];
games[DELIRIUM].scripts["quit-test"] = [{ hold: "Shift" }, { tap: [72, 414] }, { wait: 600 }];
games[DELIRIUM].actions.push({ label: "Quit test", script: "quit-test", when: ["menu"] });
const openPreferences = games[DELIRIUM].blocks.filter((block) => block.screen);
if (openPreferences.length !== games[DELIRIUM].blocks.length - 1) throw new Error("Delirium's blocks are not the Preferences button and what is inside it");
const insidePreferences = openPreferences.map((block) => ({ what: block.what, at: [block.at[0] + block.at[2] / 2, block.at[1] + block.at[3] / 2] }));
games[DELIRIUM].blocks = openPreferences;
// The score table is nine rows of a ten-letter name (kept in small letters, shown in capitals), a
// four-byte score and two more bytes, from byte 2.
const PREFERENCES = "Delirium/System Folder/Preferences/Delirium 1.1 Preferences";
const LAST_ROW = 2 + 8 * 16;
games[DELIRIUM].seed = [{ path: PREFERENCES, offset: LAST_ROW + 10, bytes: [0, 0, 0, 0] }];
const gamesFile = join(outDir, "games-with-test-scripts.json");
const writeGames = (data) => writeFileSync(gamesFile, JSON.stringify(data, null, 1) + "\n");
writeGames(games);
// For one part only: Blobbo given a quit_first whose script never makes it quit.
const neverQuits = JSON.parse(JSON.stringify(games));
neverQuits[BLOBBO].scripts["never-quits"] = [{ wait: 600 }];
neverQuits[BLOBBO].quit_first = { after: ["board"], script: "never-quits", timeout: 180, what: "a check's own: a game that does not quit" };

const stage = await startStage({ serverArgs: ["--dev-games", gamesFile] });
const { check, part } = stage;
const report = { bundle: stage.dist, games: gamesFile };
const subject = (digit) => String(digit).repeat(32);
const scriptButton = (name) => `[data-kiosk-script="${name}"]`;
const heldButton = (label) => `.mobile-button[aria-label="${label}"]`;
const exited = (browser, timeoutMs = 8000) => waitFor("exit", async () => (await browser.events()).find((event) => event.type === "exit"), timeoutMs, 50).catch(() => null);
/** Wait until a part of the picture has stopped changing (a game fades its screens in). */
async function still(target, area) {
  let last = null, same = 0;
  return waitFor("the picture to settle", async () => {
    const now = (await target.picture(null, area)).hash;
    same = now === last ? same + 1 : 0;
    last = now;
    return same >= 2 ? now : null;
  }, 20_000, 350);
}
/** Open a game with the page kept after it leaves, and wait for its launch script to end on `screen`. */
async function launch(browser, route, id, who, screen) {
  await browser.open(route, id, who, { query: "&keep=1" });
  await browser.waitScreen(screen, 60_000);
  await waitFor("the launch script to end", async () => (await browser.kiosk()).busy === null, 30_000, 100);
}

/** Do what runs a script, and wait for it to end: how it ended, and the screens the page recognised meanwhile. */
async function scriptSeen(browser, name, trigger) {
  await browser.game(`document.querySelector(".app--ottertube").removeAttribute("data-kiosk-script")`);
  await trigger();
  const seen = new Set();
  const script = await waitFor(`script ${name}`, async () => {
    const k = await browser.kiosk();
    k.screens.forEach((screen) => seen.add(screen));
    return k.busy === null && k.script ? k.script : null;
  }, 60_000, 60);
  return { outcome: script, seen: [...seen] };
}
/** Play Delirium until some points are scored, then end the game: the game-over screen. */
async function scoreAndStop(browser, bomb) {
  await sleep(2500);
  for (let used = 0; used < 2; used++) { await bomb(); await sleep(2500); }
  await browser.press(`[data-kiosk-keys="Escape"]`);
  await browser.waitScreen("game-over", 20_000);
  await sleep(1500);
}
/** Leave by the game's own Quit (which is when it writes its file) and read the last row of the score table. */
async function lastRow(browser, who) {
  await browser.press(`[data-kiosk-keys="Escape"]`);
  await browser.waitScreen("game-over", 20_000);
  await sleep(1500);
  await browser.tap([320, 250]);
  await browser.waitScreen("menu", 15_000);
  await sleep(600);
  await browser.tap([72, 414]);
  await exited(browser, 15_000);
  const held = await browser.held(who);
  const file = held && decodeSaveText(held.data).files.find((entry) => entry.path === PREFERENCES);
  // (The name in the row is one this check gave: its bytes may be shown.)
  return file ? { name: file.data.subarray(LAST_ROW, LAST_ROW + 10).toString("latin1"), score: file.data.readUInt32BE(LAST_ROW + 10),
    bytes: file.data.subarray(LAST_ROW, LAST_ROW + 16).toString("hex") } : null;
}

/** The last row of Delirium's score table in what OtterTube's stand-in holds for `who`. */
async function heldRow(browser, who) {
  const held = await browser.held(who);
  const file = held && decodeSaveText(held.data).files.find((entry) => entry.path === PREFERENCES);
  return file ? { name: file.data.subarray(LAST_ROW, LAST_ROW + 10).toString("latin1"), score: file.data.readUInt32BE(LAST_ROW + 10) } : null;
}
/** From Delirium's menu, its own Quit button; the page saves and leaves. The row it then holds. */
async function quitFromMenu(browser, who) {
  await browser.waitScreen("menu", 15_000);
  await sleep(600);
  await browser.tap([72, 414]);
  await exited(browser, 15_000);
  return heldRow(browser, who);
}
/** Delirium from its title to a game that ends with a score, and on to the screen that asks for a name. */
async function toNameEntry(browser) {
  await scriptSeen(browser, "start", () => browser.press(scriptButton("start")));
  await scoreAndStop(browser, () => browser.press(heldButton("Bomb"), 300));
  await browser.tap([320, 250]);
  await browser.waitScreen("name-entry", 20_000);
  await sleep(800);
}
/** Press Exit (twice when asked, at once) and wait for the page to leave: how long that took, and what the page said meanwhile. */
async function exitAndTime(browser, { twice = false, meanwhile } = {}) {
  const pressed = Date.now();
  await browser.game(`(() => { const exit = document.querySelector("[data-kiosk-exit]"); exit.click(); ${twice ? "exit.click();" : ""} })()`);
  const shown = [];
  const watching = (async () => {
    for (;;) {
      const now = await browser.game(`({ saving: !!document.querySelector(".ottertube-saving"), busyNotice: !!document.querySelector(".kiosk-busy"),
        busy: document.querySelector(".app--ottertube").dataset.kioskBusy ?? null, script: document.querySelector(".app--ottertube").dataset.kioskScript ?? null })`).catch(() => null);
      if (now) shown.push(now);
      if ((await browser.events()).some((event) => event.type === "exit")) return;
      await sleep(150);
    }
  })();
  if (meanwhile) await meanwhile();
  const left = await exited(browser, 20_000);
  await watching;
  const page = await browser.game(`(() => { const d = document.querySelector(".app--ottertube").dataset;
    return { quit: d.kioskQuit ?? null, runs: d.kioskQuitRuns ?? null, script: d.kioskScript ?? null }; })()`);
  return { ms: left ? left.at - pressed : null, ...page,
    savingAll: shown.length > 0 && shown.every((now) => now.saving), busyNoticeShown: shown.some((now) => now.busyNotice),
    scripts: [...new Set(shown.map((now) => now.busy ?? now.script).filter(Boolean))] };
}
/** A point on the picture, in game coordinates, as the window sees it. */
async function onPicture(browser, [h, v]) {
  const box = await browser.rect("canvas.game-canvas");
  return { x: box.x + (h + 0.5) * box.w / 640, y: box.y + (v + 0.5) * box.h / 480 };
}
/** Who holds the guest's mouse button: "held" or "tap" (a held-back touch), "ordinary", or null. */
const buttonOwner = (browser) => browser.game(`document.querySelector(".app--ottertube").dataset.kioskButton ?? null`);

/** Where Blobbo is on his board. */
const blobboYellow = (r, g, b) => r > 245 && g >= 205 && g <= 230 && b < 20;
async function whereBlobbo(browser) {
  const found = (await browser.picture(null)).find(blobboYellow);
  return found && { h: Math.round(found.h), v: Math.round(found.v) };
}
/** Run one of the page's scripts, or its check-only hook, from the page's own world. */
const pageInput = (browser, kind, names = []) => browser.gameOwn(`window.systemlessOtterTube.input(${JSON.stringify(kind)}, ${JSON.stringify(names)}, true)`);
// Where Delirium's "Please hit a key" box comes up over its Preferences when Set Keys is pressed.
const KEY_PROMPT = { x: 230, y: 215, w: 180, h: 50 };
let preferencesAsOpened = null;

let browser;
try {
  browser = await stage.openBrowser("scripts");
  await browser.touchOn();

  await part("exit", async () => {
    const LEVELS = { x: 416, y: 136, w: 150, h: 230 };
    await launch(browser, "/clockwerx/", CLOCKWERX, subject(1), "options");
    check("the page took the games file of this check (its Hold test button is there)", (await browser.kiosk()).actions.includes("Hold test"), (await browser.kiosk()).actions);
    // One finger holds Bounce while a second starts a script: for the length of the script only
    // the script's key is down, and the child's key is back when it ends.
    const clear = () => browser.game(`document.querySelector(".app--ottertube").removeAttribute("data-kiosk-script")`);
    const shortEnded = () => waitFor("the short script to end", async () => { const k = await browser.kiosk(); return k.busy === null && k.script === "short-test:done"; }, 10_000, 50).catch(() => false);
    const bounce = await browser.middle(heldButton("Bounce"));
    const short = await browser.middle(scriptButton("short-test"));
    await browser.touch("touchStart", [{ ...bounce, id: 1 }]);
    await sleep(250);
    const childOnly = (await browser.kiosk()).held;
    await clear();
    await browser.touch("touchStart", [{ ...bounce, id: 1 }, { ...short, id: 2 }]);
    const scriptOnly = await waitFor("the short script", async () => { const k = await browser.kiosk(); return k.busy === "short-test" ? k.held : null; }, 3000, 30).catch(() => null);
    await browser.touch("touchEnd", [{ ...short, id: 2 }]);
    const ended = await shortEnded();
    await sleep(150);
    const childAgain = (await browser.kiosk()).held;
    await browser.touch("touchEnd", []);
    await sleep(250);
    const lifted = (await browser.kiosk()).held;
    check("a key the child holds is up for the length of a script, and back when the script ends",
      childOnly === "Alt" && scriptOnly === "Meta" && ended && childAgain === "Alt" && lifted === "", { childOnly, scriptOnly, ended, childAgain, lifted });
    // A tap action is still pressing its key (it holds it for 180 ms) when a script starts.
    const nextLevel = await browser.middle(`[data-kiosk-keys="ArrowDown"]`);
    await clear();
    const tapped = Date.now();
    await browser.touch("touchStart", [{ ...nextLevel, id: 1 }]);
    await browser.touch("touchStart", [{ ...nextLevel, id: 1 }, { ...short, id: 2 }]);
    const gapMs = Date.now() - tapped;
    await browser.touch("touchEnd", []);
    const endedAgain = await shortEnded();
    await sleep(400);
    const leftDown = (await browser.kiosk()).held;
    check("a tap action caught half way by a script leaves no key down afterwards", gapMs < 150 && endedAgain && leftDown === "", { gapMs, endedAgain, leftDown });

    const levels = await still(browser, LEVELS);
    const began = Date.now();
    await browser.press(scriptButton("hold-test"));
    const running = await waitFor("the script to hold its key", async () => { const k = await browser.kiosk(); return k.busy === "hold-test" && k.held === "Meta" ? k : null; }, 3000, 50).catch(() => null);
    check("a script's held key is down, and the page says it is busy", !!running, running ?? await browser.kiosk());
    const notice = await browser.game(`document.querySelector(".kiosk-busy")?.innerText ?? null`);
    // The child's input goes nowhere meanwhile: a key button, another script, a row of the level list.
    await browser.press(`[data-kiosk-keys="ArrowDown"]`);
    await browser.press(scriptButton("play"));
    await browser.tap([490, 215]);
    await sleep(600);
    const during = await browser.kiosk();
    const levelsDuring = (await browser.picture("exit-1-busy.png", LEVELS)).hash;
    check("while a script runs the child is told, and a key button, another script and a touch on the picture do nothing",
      /moment/i.test(notice ?? "") && during.busy === "hold-test" && during.held === "Meta" && during.screens.includes("options") && levelsDuring === levels,
      { notice, during, same: levelsDuring === levels });

    await browser.press("[data-kiosk-exit]");
    const atOnce = await browser.kiosk();
    const left = await exited(browser);
    report.exit = { pressedAfterMs: Date.now() - began, atOnce };
    check("Exit stops the script at once: the page is not busy, and the key the script held is let go",
      atOnce.busy === null && atOnce.held === "" && atOnce.script === "hold-test:cancelled:leaving", atOnce);
    check("Exit still leaves", !!left);
    // Had it gone on, the script would by now have held a second key, and then ended as done.
    const seen = new Set();
    while (Date.now() < began + (HOLD_FRAMES + AFTER_FRAMES) * 1000 / 60 + 2000) {
      const k = await browser.kiosk();
      if (k.held) seen.add("held " + k.held);
      if (k.busy) seen.add("busy " + k.busy);
      await sleep(150);
    }
    const later = await browser.kiosk();
    check("the stopped script's later steps never run", seen.size === 0 && later.script === "hold-test:cancelled:leaving", { seen: [...seen], later });
  });

  await part("exit during launch", async () => {
    await browser.open("/clockwerx/", CLOCKWERX, subject(2), { query: "&keep=1" });
    const busy = await waitFor("the launch script to start", async () => (await browser.kiosk()).busy === "launch", 60_000, 50).catch(() => null);
    await browser.press("[data-kiosk-exit]");
    const atOnce = await browser.kiosk();
    const left = await exited(browser);
    // Left alone, the script would press Command-N when the title comes, and the level list would show.
    await sleep(12_000);
    const later = await browser.kiosk();
    check("Exit while the game is still being started stops the launch script, and the page leaves",
      !!busy && !!left && atOnce.busy === null && later.script === "launch:cancelled:leaving" && !later.screens.includes("options"), { atOnce, later });
  });

  await part("game quits", async () => {
    await launch(browser, "/delirium/", DELIRIUM, subject(3), "title");
    await browser.tap([320, 250]);
    await browser.waitScreen("menu", 15_000);
    await sleep(600);
    await browser.press(scriptButton("quit-test"));
    const left = await exited(browser, 20_000);
    const after = await browser.kiosk();
    check("a game that quits while a script runs: the script is stopped, its key let go, and the page leaves",
      !!left && after.busy === null && after.held === "" && /^quit-test:cancelled/.test(after.script ?? ""), after);
  });

  await part("inside preferences", async () => {
    await launch(browser, "/delirium/", DELIRIUM, subject(4), "title");
    await browser.tap([320, 250]);
    await browser.waitScreen("menu", 15_000);
    await sleep(600);
    await browser.tap([237, 414]);
    const opened = await browser.waitScreen("prefs", 15_000).then(() => true, () => false);
    check("with its block taken away for this check, Preferences opens (so the next line tests something)", opened, (await browser.kiosk()).screens);
    // The blocked buttons, two on the left and two on the right. (Not the middle of the dialog:
    // the system's own arrow sits there, 56 lines above the game's pointer, and comes and goes.)
    const left = { x: 34, y: 312, w: 156, h: 66 }, right = { x: 369, y: 312, w: 156, h: 66 };
    const look = async () => (await browser.picture(null, left)).hash + (await browser.picture(null, right)).hash;
    await still(browser, left);
    const before = await look();
    await browser.picture("preferences-1-open.png");
    preferencesAsOpened = (await browser.picture(null, KEY_PROMPT)).hash;
    const results = [];
    for (const { what, at } of insidePreferences) {
      await browser.tap(at);
      await sleep(1200);
      results.push({ what, same: (await look()) === before, prefs: (await browser.kiosk()).screens.includes("prefs") });
    }
    await browser.picture("preferences-2-after-taps.png");
    check("inside Preferences, Deregister, Clear Highscores, Default Keys and Set Keys take no touch",
      results.length === 4 && results.every((result) => result.same && result.prefs), results);
    // Start is still one press: the script closes Preferences first.
    await browser.game(`document.querySelector(".app--ottertube").removeAttribute("data-kiosk-script")`);
    await browser.press(scriptButton("start"));
    const outcome = await waitFor("the start script", async () => { const k = await browser.kiosk(); return k.busy === null && k.script ? k.script : null; }, 40_000, 100).catch(() => null);
    const playing = await browser.waitScreen("playing", 5000).then(() => true, () => false);
    check("Start is one press from inside Preferences too", outcome === "start:done" && playing, { outcome, screens: (await browser.kiosk()).screens });
  });

  await part("name by touch", async () => {
    const who = subject(5);
    await launch(browser, "/delirium/", DELIRIUM, who, "title");
    await scriptSeen(browser, "start", () => browser.press(scriptButton("start")));
    await scoreAndStop(browser, () => browser.press(heldButton("Bomb"), 300));
    // The game is over with a score that makes the table. Start is still one press: the script
    // goes through the screen that asks for a name, and gives PLAYER.
    const again = await scriptSeen(browser, "start", () => browser.press(scriptButton("start")));
    const playing = await browser.waitScreen("playing", 5000).then(() => true, () => false);
    check("after a game that makes the score table, Start is one press past the screen that asks for a name",
      again.outcome === "start:done" && again.seen.includes("name-entry") && playing, again);
    const row = await lastRow(browser, who);
    check("the score went into the table as PLAYER (nobody tapped a letter)", !!row && row.name === "player    " && row.score > 0, row && { player: row.name === "player    ", score: row.score, bytes: row.bytes });
  });

  await part("name by controller", async () => {
    const who = subject(6);
    await launch(browser, "/delirium/", DELIRIUM, who, "title");
    await browser.pad({ b: [] });
    await waitFor("the controller to be seen", async () => (await browser.kiosk()).pad === "on", 5000, 100);
    await scriptSeen(browser, "start", () => browser.padPress([0]));
    await scoreAndStop(browser, () => browser.padPress([1], 300));
    // A touch takes the game on to the screen that asks for a name, and taps one letter there.
    await browser.tap([320, 250]);
    const asked = await browser.waitScreen("name-entry", 15_000).then(() => true, () => false);
    await sleep(500);
    // (The letter C lies where Deregister is blocked while Preferences shows: on this screen a
    // touch there is held for a fresh look at the screen, and then made.)
    await browser.tap([123, 333]);
    await sleep(900);
    await browser.picture("name-1-one-letter.png");
    // A controller has no pointer for the letter keys: A gets past the screen, keeping the letter.
    const past = await scriptSeen(browser, "start", () => browser.padPress([0]));
    const playing = await browser.waitScreen("playing", 5000).then(() => true, () => false);
    check("on the screen that asks for a name, the controller's A goes on into a new game", asked && past.outcome === "start:done" && playing, { asked, ...past });
    await browser.pad(null);
    const row = await lastRow(browser, who);
    check("the letter the child tapped is the name in the table (the script did not write over it)", !!row && row.name === "c         " && row.score > 0, row && { kept: row.name === "c         ", score: row.score, bytes: row.bytes });
  });

  await part("after Exit", async () => {
    const who = subject(7);
    await launch(browser, "/blobbo/?systemless-test-scan=paused-slow", BLOBBO, who, "board");
    await browser.pad({ b: [] });
    await waitFor("the controller to be seen", async () => (await browser.kiosk()).pad === "on", 5000, 100);
    const at0 = await whereBlobbo(browser);
    const before = await browser.kiosk();
    await browser.press("[data-kiosk-exit]");
    // The page now waits for its last scan (which answers 1.2 s late in this check). Meanwhile
    // the controller's left shoulder button, which is Save: a script that would change the disk.
    await browser.padPress([4], 150);
    const during = await browser.kiosk();
    const waiting = !(await browser.events()).some((event) => event.type === "exit");
    // And the rest of what a child could still do: a direction, a tap on the board, the Save
    // button, a key of a real keyboard.
    await browser.pad({ b: [13] });
    await sleep(250);
    await browser.pad({ b: [] });
    await browser.tap([at0.h, at0.v + 40]);
    await browser.press(scriptButton("save"));
    await browser.keyboard([["2", "Numpad2"]]);
    const left = await exited(browser);
    await sleep(1500);
    const after = await browser.kiosk();
    // (The page's "Saving" notice lies over the picture from Exit on: take it away to look under it.)
    await browser.game(`document.querySelectorAll(".ottertube-saving, .kiosk-busy").forEach((notice) => { notice.style.display = "none"; })`);
    await sleep(200);
    const at1 = await whereBlobbo(browser);
    const closing = await browser.game(`document.querySelector(".app--ottertube").dataset.kioskClosing ?? null`);
    check("once Exit is pressed no script starts, during its wait or after: not from the controller, not from a button",
      waiting && during.busy === null && during.script === before.script && after.busy === null && after.script === before.script && !!left && closing === "leaving",
      { waiting, during, after, closing });
    check("and nothing reaches the game: Blobbo has not moved, and no key is down", !!at0 && !!at1 && at1.h === at0.h && at1.v === at0.v && during.held === "" && after.held === "", { at0, at1 });
  });

  await part("a letter in the name", async () => {
    // The letter S is Blobbo's Drop key. Let go of at the moment Save is pressed, it has been seen
    // to land in the Save dialog's name, and the game was then saved where Load does not look.
    const who = "b".repeat(32);
    await launch(browser, "/blobbo/", BLOBBO, who, "board");
    const spoiled = await scriptSeen(browser, "spoiled-save", () => pageInput(browser, "script", ["spoiled-save"]));
    const held = await waitFor("the saved game", () => browser.held(who), 20_000).catch(() => null);
    const names = held ? decodeSaveText(held.data).files.map((file) => file.path.split("/").pop()) : [];
    check("Blobbo's Save, finding a letter typed over the name it is about to save under, starts the dialog again and saves under the name Load looks for",
      spoiled.outcome === "spoiled-save:done" && names.length === 1 && names[0] === "Untitled", { outcome: spoiled.outcome, names });
  });

  await part("exit before the game is up", async () => {
    const url = `${stage.hostOrigin}/?fill=1&keep=1&game=${encodeURIComponent(`${stage.gameOrigin}/clockwerx/`)}&subject=${"a".repeat(32)}`;
    await browser.page.send("Page.navigate", { url });
    const pressed = await waitFor("the Exit button", () => browser.game(`(() => {
      const exit = document.querySelector("[data-kiosk-exit]");
      if (!exit) return null;
      const up = document.querySelector(".app--ottertube").dataset.kioskMachine === "running";
      exit.click();
      return { up };
    })()`), 20_000, 15);
    const left = await exited(browser);
    // Long enough for the game to come up and show its title, where the launch script would act.
    await sleep(14_000);
    const later = await browser.kiosk();
    const machine = await browser.game(`document.querySelector(".app--ottertube").dataset.kioskMachine ?? null`);
    check("Exit pressed before the game is up: the game comes up, and its launch script never starts",
      pressed.up === false && !!left && machine === "running" && later.script === null && later.busy === null && !later.screens.includes("options"), { pressed, machine, later });
  });

  await part("late answer", async () => {
    await launch(browser, "/clockwerx/?systemless-test-screens=slow", CLOCKWERX, subject(0), "options");
    await browser.game(`document.querySelector(".app--ottertube").removeAttribute("data-kiosk-script")`);
    // A script that holds a key and then looks at the screen: the look takes 600 ms here.
    await pageInput(browser, "script", ["late-test"]);
    const first = await waitFor("the first script", async () => { const k = await browser.kiosk(); return k.busy === "late-test" && k.held === "Alt" ? k : null; }, 3000, 30).catch(() => null);
    // It is cancelled while the look is under way, and another script is started.
    await pageInput(browser, "test-cancel");
    const cancelled = await browser.kiosk();
    await pageInput(browser, "script", ["short-test"]);
    await sleep(1000);
    // The first script's look has been answered by now (the screen is not the one it asked for).
    const during = await browser.kiosk();
    const ended = await waitFor("the second script to end", async () => { const k = await browser.kiosk(); return k.busy === null && k.script === "short-test:done"; }, 10_000, 50).catch(() => false);
    check("a script cancelled while it waited for a look at the screen does not end the script started after it",
      !!first && cancelled.script === "late-test:cancelled:test" && cancelled.held === "" && during.busy === "short-test" && during.held === "Meta" && ended,
      { first: !!first, cancelled: cancelled.script, during: { busy: during.busy, held: during.held, script: during.script }, ended });
  });

  await part("mouse control", async () => {
    const who = subject(8);
    // The word Keyboard, which is lit while Keyboard is the control (the arrow that a touch moves stays off it).
    const KEYBOARD = { x: 284, y: 127, w: 54, h: 21 };
    const control = async () => {
      const held = await browser.held(who);
      const file = held && decodeSaveText(held.data).files.find((entry) => entry.path.endsWith("ClockWerx Settings"));
      return file ? { value: file.data[608] } : null;
    };
    await launch(browser, "/clockwerx/", CLOCKWERX, who, "options");
    const keyboardLit = await still(browser, KEYBOARD);
    await browser.tap([380, 137]);
    await sleep(1200);
    const afterTouch = (await browser.picture("mouse-1-chosen.png", KEYBOARD)).hash;
    check("with its block taken away for this check, ClockWerx's Keyboard or Mouse switch reacts to a touch (the block is what stops it)",
      afterTouch !== keyboardLit, { keyboardLit, afterTouch });
    await scriptSeen(browser, "play", () => browser.press(scriptButton("play")));
    const saved = await waitFor("the settings in the save", control, 30_000).catch(() => null);
    check("and Mouse control is then what the child's save holds", saved?.value === 0, saved);
    // The next visit: Keyboard is written over the saved settings before the game starts.
    await launch(browser, "/clockwerx/", CLOCKWERX, who, "options");
    const again = await still(browser, KEYBOARD);
    // The save itself keeps what the game last wrote until the game writes its settings again
    // with something changed: choose Easy, so that it does.
    await browser.tap([243, 307]);
    await sleep(1200);
    await scriptSeen(browser, "play", () => browser.press(scriptButton("play")));
    const back = await waitFor("Keyboard in the save", async () => (await control())?.value === 1, 30_000).then(() => true, () => false);
    check("a save left in Mouse control comes back in Keyboard control on the next visit, and is saved so when the game next writes its settings",
      again === keyboardLit && back, { litAgain: again === keyboardLit, back });
  });

  await part("a screen that has just come up", async () => {
    if (!preferencesAsOpened) throw new Error("no picture of Preferences to compare with (the earlier part failed)");
    await launch(browser, "/delirium/?systemless-test-screens=slow", DELIRIUM, subject(9), "title");
    await browser.tap([320, 250]);
    await browser.waitScreen("menu", 20_000);
    await sleep(1500);
    // Preferences (its own block is taken away in this check), and at once Set Keys under it,
    // over and over, for longer than the page takes here to recognise the new screen.
    await browser.tap([237, 414], 60);
    const until = Date.now() + 4000;
    let taps = 0;
    while (Date.now() < until) { await browser.tap([447, 364], 40); taps += 1; await sleep(30); }
    const opened = await browser.waitScreen("prefs", 10_000).then(() => true, () => false);
    await sleep(1500);
    const after = (await browser.picture("fresh-1-after-taps.png", KEY_PROMPT)).hash;
    await browser.picture("fresh-2-whole.png");
    check("a control that is blocked on a screen takes no touch from the moment the screen comes up, before the page has recognised it",
      opened && after === preferencesAsOpened, { opened, taps, same: after === preferencesAsOpened });
  });

  // ----------------------------------------------------------------------------------------------
  // Delirium: Exit after a score went into the table makes the game quit first
  // ----------------------------------------------------------------------------------------------
  let rowQ1 = null;
  const whoQ1 = "c".repeat(32);
  await part("quit first, from the menu", async () => {
    await launch(browser, "/delirium/", DELIRIUM, whoQ1, "title");
    await toNameEntry(browser);
    await browser.tap([222, 333]);
    await sleep(500);
    await browser.tap([589, 397]);
    await browser.waitScreen("menu", 15_000);
    await sleep(1000);
    check("before Exit, nothing of the table has reached the save (Delirium has not written it)", (await heldRow(browser, whoQ1)) === null);
    // Exit, pressed twice at once; then the controller's A (Start) and a touch on the picture, while the game is made to quit.
    const exit = await exitAndTime(browser, { twice: true, meanwhile: async () => {
      await sleep(300);
      await browser.pad({ b: [] });
      await browser.padPress([0], 150);
      await browser.tap([320, 250]);
    } });
    rowQ1 = await heldRow(browser, whoQ1);
    report.quitFromMenu = { ...exit, row: rowQ1 && { e: rowQ1.name === "e         ", score: rowQ1.score } };
    check("Exit after a score went in: the game quits by its own Quit first, once, and the page then leaves",
      /^quit:\d+$/.test(exit.quit ?? "") && exit.runs === "1" && exit.ms !== null, report.quitFromMenu);
    check("the score table, with the child's name, is in the saved text OtterTube holds", !!rowQ1 && rowQ1.name === "e         " && rowQ1.score > 0, report.quitFromMenu.row);
    check("meanwhile the page says it is saving (not \"One moment\"), and nothing the child pressed started anything",
      exit.savingAll && !exit.busyNoticeShown && exit.scripts.every((name) => /^quit/.test(name)), { savingAll: exit.savingAll, busyNoticeShown: exit.busyNoticeShown, scripts: exit.scripts });
    await browser.pad(null);
  });

  await part("the next visit has the score", async () => {
    if (!rowQ1) throw new Error("no score was saved (the earlier part failed)");
    const init = await browser.open("/delirium/", DELIRIUM, whoQ1, { query: "&keep=1" });
    await browser.waitScreen("title", 60_000);
    await waitFor("the launch script to end", async () => (await browser.kiosk()).busy === null, 30_000, 100);
    await browser.tap([320, 250]);
    // The game's own Quit writes the table it has in memory: the one it loaded from the save.
    const row = await quitFromMenu(browser, whoQ1);
    const quit = await browser.game(`document.querySelector(".app--ottertube").dataset.kioskQuit ?? null`);
    check("on the next visit the game started with that table: its own Quit writes the same row back",
      init.savedSeq !== null && !!row && row.name === rowQ1.name && row.score === rowQ1.score && quit === "not-needed", { savedSeq: init.savedSeq, same: !!row && row.name === rowQ1.name && row.score === rowQ1.score, quit });
  });

  await part("quit first, from a game in play", async () => {
    const who = "d".repeat(32);
    await launch(browser, "/delirium/", DELIRIUM, who, "title");
    await scriptSeen(browser, "start", () => browser.press(scriptButton("start")));
    await scoreAndStop(browser, () => browser.press(heldButton("Bomb"), 300));
    // Start: the name is given as PLAYER on the way, and a new game begins.
    const started = await scriptSeen(browser, "start", () => browser.press(scriptButton("start")));
    await browser.waitScreen("playing", 10_000);
    await sleep(1500);
    const exit = await exitAndTime(browser);
    const row = await heldRow(browser, who);
    report.quitFromPlay = { ...exit, sawName: started.seen.includes("name-entry"), row: row && { player: row.name === "player    ", score: row.score } };
    check("Exit in the middle of a later game: the game is stopped, quits, and the score from before is saved, inside the time allowed",
      started.seen.includes("name-entry") && /^quit:\d+$/.test(exit.quit ?? "") && !!row && row.name === "player    " && row.score > 0, report.quitFromPlay);
  });

  await part("no new score", async () => {
    const who = "e".repeat(32);
    await launch(browser, "/delirium/", DELIRIUM, who, "title");
    await browser.tap([320, 250]);
    await browser.waitScreen("menu", 15_000);
    await sleep(1000);
    const exit = await exitAndTime(browser);
    report.noNewScore = exit;
    check("Exit with no new score: the game is not made to quit, and the page leaves at once (well under the 3 s it may wait)",
      exit.quit === "not-needed" && exit.runs === null && exit.ms !== null && exit.ms < 1500, exit);
  });

  await part("guest", async () => {
    await launch(browser, "/delirium/", DELIRIUM, "guest", "title");
    await toNameEntry(browser);
    await browser.tap([589, 397]);
    await browser.waitScreen("menu", 15_000);
    await sleep(1000);
    const exit = await exitAndTime(browser);
    report.guest = exit;
    check("Guest, after a score: nothing is kept, so the game is not made to quit, and the page leaves at once",
      exit.quit === "not-kept" && exit.runs === null && exit.ms !== null && exit.ms < 1500, exit);
  });

  await part("a game that does not quit in time", async () => {
    writeGames(neverQuits);
    try {
      await launch(browser, "/blobbo/", BLOBBO, "ab".repeat(16), "board");
    } finally {
      writeGames(games);
    }
    await sleep(800);
    const exit = await exitAndTime(browser);
    report.quitTimesOut = exit;
    check("a game that has not quit by its timeout (3 s here) is left as it is: the page saves and leaves all the same, saying it is saving throughout",
      /^timed-out:\d+$/.test(exit.quit ?? "") && exit.ms >= 3000 && exit.ms < 3000 + 3600 && exit.savingAll, exit);
  });

  // ----------------------------------------------------------------------------------------------
  // Touches held back for a fresh look at the screen (each look 600 ms late here)
  // ----------------------------------------------------------------------------------------------
  await part("held-back touches", async () => {
    const who = "f".repeat(32);
    await launch(browser, "/delirium/?systemless-test-screens=slow", DELIRIUM, who, "title");
    await toNameEntry(browser);
    await browser.waitScreen("name-empty", 10_000);
    // The letters C and D lie where Deregister is blocked while Preferences shows: here each
    // touch on them waits for a fresh look at the screen.
    const c = await onPicture(browser, [123, 333]), d = await onPicture(browser, [172, 333]);
    await browser.touch("touchStart", [{ ...c, id: 1 }]);
    await sleep(200);
    await browser.touch("touchCancel", []);
    await sleep(1800);
    const afterCancel = await browser.waitScreen("name-empty", 4000).then(() => true, () => false);
    check("a touch cancelled while its look is under way comes to nothing", afterCancel && (await buttonOwner(browser)) === null, { stillEmpty: afterCancel });
    await browser.touch("touchStart", [{ ...c, id: 2 }]);
    await sleep(100);
    await browser.touch("touchMove", [{ x: c.x + 40, y: c.y - 150, id: 2 }]);
    await sleep(100);
    await browser.touch("touchEnd", []);
    await sleep(1800);
    const afterSlide = await browser.waitScreen("name-empty", 4000).then(() => true, () => false);
    check("a finger slid away while its look is under way comes to nothing", afterSlide && (await buttonOwner(browser)) === null, { stillEmpty: afterSlide });
    // A quick tap on C (held back), and at once a finger on A, which is not under any block and
    // goes straight to the game. C's look answers while A holds the button: C is dropped, and A's
    // press is neither moved nor let go of by it.
    const a = await onPicture(browser, [25, 333]);
    await browser.touch("touchStart", [{ ...c, id: 3 }]);
    await sleep(30);
    await browser.touch("touchEnd", [{ ...c, id: 3 }]);
    await browser.touch("touchStart", [{ ...a, id: 4 }]);
    await sleep(1000);
    const whileA = await buttonOwner(browser);
    await browser.touch("touchEnd", []);
    await sleep(600);
    const afterA = await buttonOwner(browser);
    const typedA = await browser.waitScreen("name-empty", 4000, false).then(() => true, () => false);
    check("a held-back tap whose look answers while an ordinary press holds the button is dropped; the press is the button's one owner until it lifts",
      whileA === "ordinary" && afterA === null && typedA, { whileA, afterA, typedA });
    await browser.picture("held-back-1-a.png");
    // A quick tap on C, and at once a finger on D that stays (both held back): C's look answers
    // first and taps. D's answers a moment later: while C's tap still holds the button it is
    // dropped; had C's tap already let go, D presses until its finger lifts. Never both.
    await browser.touch("touchStart", [{ ...c, id: 5 }]);
    await sleep(30);
    await browser.touch("touchEnd", [{ ...c, id: 5 }]);
    await browser.touch("touchStart", [{ ...d, id: 6 }]);
    await sleep(1400);
    const whileD = await buttonOwner(browser);
    await browser.touch("touchEnd", []);
    await sleep(400);
    const afterD = await buttonOwner(browser);
    await browser.picture("held-back-2-c-d.png");
    await browser.tap([589, 397]);
    const row = await quitFromMenu(browser, who);
    const name = row ? row.name.trim() : null;
    report.heldBack = { name, whileA, whileD };
    // Long presses may repeat a letter on Delirium's keyboard; C once and A at least once.
    const dDropped = whileD === null && /^a+c$/.test(name ?? "");
    const dPressed = whileD === "held" && /^a+cd+$/.test(name ?? "");
    check("letters as the one-owner rule says: A from the ordinary press, not the C held back under it; C from the next tap; D only if it pressed after C let go",
      afterD === null && (dDropped || dPressed), { ...report.heldBack, afterD });
  });
} catch (error) {
  check("the run completed", false, String(error?.stack ?? error));
} finally {
  await browser?.close().catch(() => {});
}
const code = stage.finish(report);
console.log(JSON.stringify({ passed: report.passed, failed: report.failed, quitFromMenu: report.quitFromMenu, quitFromPlay: report.quitFromPlay, noNewScore: report.noNewScore,
  guest: report.guest, quitTimesOut: report.quitTimesOut, heldBack: report.heldBack, report: join(stage.outDir, "report.json") }, null, 2));
process.exit(code);
