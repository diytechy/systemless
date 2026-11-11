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
// What is checked: Exit, and the game quitting, stop a running script at once, let go of what it
// holds, and its later steps never run; while a script runs the child's input goes nowhere, a key
// the child holds is up and comes back afterwards, and a tap action caught half way leaves no key
// down; the
// four controls inside Delirium's Preferences take no touch, and Start is one press from there;
// Start, and a controller's A, get past Delirium's "enter your name" screen, as PLAYER when no
// letter was tapped and with the child's own letters when some were.
//
// Environment as verify-ottertube-link-cdp.mjs. The fake host is opened with keep=1, so the page
// can still be read after it has asked to leave.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodeSaveText, repoRoot, sleep, startStage, waitFor } from "./ottertube-cdp-kit.mjs";

const outDir = process.env.OTTERTUBE_LINK_OUT;
if (!outDir) throw new Error("Set OTTERTUBE_LINK_DIST and OTTERTUBE_LINK_OUT");
mkdirSync(outDir, { recursive: true });
const CLOCKWERX = "clockwerx-personal-10", DELIRIUM = "delirium-personal-11";
const games = JSON.parse(readFileSync(join(repoRoot, "www", "src", "ottertube-games.json"), "utf8"));
const HOLD_FRAMES = 360, AFTER_FRAMES = 180;
games[CLOCKWERX].scripts["hold-test"] = [{ hold: "Meta" }, { wait: HOLD_FRAMES }, { hold: "Alt" }, { wait: AFTER_FRAMES }, { release: "Alt" }, { release: "Meta" }];
games[CLOCKWERX].actions.push({ label: "Hold test", script: "hold-test" });
games[CLOCKWERX].scripts["short-test"] = [{ hold: "Meta" }, { wait: 90 }, { release: "Meta" }];
games[CLOCKWERX].actions.push({ label: "Short test", script: "short-test" });
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
writeFileSync(gamesFile, JSON.stringify(games, null, 1) + "\n");

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
    await browser.tap([25, 333]);
    await sleep(600);
    await browser.picture("name-1-one-letter.png");
    // A controller has no pointer for the letter keys: A gets past the screen, keeping the letter.
    const past = await scriptSeen(browser, "start", () => browser.padPress([0]));
    const playing = await browser.waitScreen("playing", 5000).then(() => true, () => false);
    check("on the screen that asks for a name, the controller's A goes on into a new game", asked && past.outcome === "start:done" && playing, { asked, ...past });
    await browser.pad(null);
    const row = await lastRow(browser, who);
    check("the letter the child tapped is the name in the table (the script did not write over it)", !!row && row.name === "a         " && row.score > 0, row && { kept: row.name === "a         ", score: row.score, bytes: row.bytes });
  });
} catch (error) {
  check("the run completed", false, String(error?.stack ?? error));
} finally {
  await browser?.close().catch(() => {});
}
const code = stage.finish(report);
console.log(JSON.stringify({ passed: report.passed, failed: report.failed, exit: report.exit, report: join(stage.outDir, "report.json") }, null, 2));
process.exit(code);
