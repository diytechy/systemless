#!/usr/bin/env node
// Browser check of the slim OtterTube add-on bundle played by touch alone: for ClockWerx, Delirium
// and Blobbo, reach play, move, act, start again and leave, with no keyboard and no mouse; and for
// Delirium and Blobbo, a save that comes back in a fresh browser profile.
//
// Input is Input.dispatchTouchEvent only (one finger, or two for the stick and a button together).
// The host is www/tests/fixtures/ottertube-fake-host.html filling a 1920x1080 window, not OtterTube.
// Environment as verify-ottertube-link-cdp.mjs (OTTERTUBE_LINK_DIST, OTTERTUBE_LINK_OUT, ...).

import { join } from "node:path";
import { decodeSaveText, sleep, startStage, waitFor } from "./ottertube-cdp-kit.mjs";

const stage = await startStage();
const { check, part } = stage;
const report = { bundle: stage.dist, window: [1920, 1080] };
const subject = (digit) => String(digit).repeat(32);

const GAMES = {
  clockwerx: { route: "/clockwerx/", id: "clockwerx-personal-10", stick: false, held: ["Swing", "Bounce", "Flip", "Reverse"], actions: ["New game", "Try again", "Pause", "Stop"] },
  delirium: { route: "/delirium/", id: "delirium-personal-11", stick: true, held: ["Fire", "Bomb", "Thrust", "Turn"], actions: ["Start", "Stop"] },
  // Start is Space twice: after a finished game the first press only clears the scores.
  blobbo: { route: "/blobbo/", id: "blobbo-full-personal-101", stick: true, held: ["Wait", "Drop"], actions: ["Start again", "Save", "Load"] },
};
const action = (keys) => `[data-kiosk-keys="${keys}"]`;
const heldButton = (label) => `.mobile-button[aria-label="${label}"]`;

/** Every touch target of the page, with its rectangle, and the picture's. */
const layoutProbe = `(() => {
  const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const shown = (e) => { const s = getComputedStyle(e); return s.display !== "none" && s.visibility !== "hidden" && e.getBoundingClientRect().width > 0; };
  const targets = [...document.querySelectorAll(".kiosk-button, .mobile-button, .mobile-joystick")].filter(shown)
    .map((e) => ({ label: e.classList.contains("mobile-joystick") ? "(stick)" : e.textContent.trim(), ...box(e) }));
  return {
    targets,
    picture: box(document.querySelector("canvas.game-canvas")),
    window: { w: innerWidth, h: innerHeight },
    coarse: matchMedia("(hover: none) and (pointer: coarse)").matches,
    links: document.querySelectorAll("a[href]").length,
    toolbar: [...document.querySelectorAll(".koji-toolbar")].filter(shown).length,
  };
})()`;
function layoutFaults(layout, { clearOfPicture }) {
  const faults = [];
  const apart = (a, b) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
  for (const target of layout.targets) {
    if (target.w < 96 || target.h < 96) faults.push(`${target.label} is ${Math.round(target.w)}x${Math.round(target.h)}`);
    if (target.x < 0 || target.y < 0 || target.x + target.w > layout.window.w + 0.5 || target.y + target.h > layout.window.h + 0.5) faults.push(`${target.label} is off the window`);
    if (clearOfPicture && apart(target, layout.picture) < 0) faults.push(`${target.label} is over the picture`);
    if (/Command|Option|Control|Cmd|⌘|Meta|Alt|Numpad/.test(target.label)) faults.push(`${target.label} names a key`);
  }
  layout.targets.forEach((a, i) => layout.targets.slice(i + 1).forEach((b) => {
    if (apart(a, b) < 12) faults.push(`${a.label} and ${b.label} are ${Math.round(apart(a, b))} px apart`);
  }));
  return faults;
}

/** What is common to the three: the layer is on without a touch device, child sized, with help and no links. */
async function commonChecks(browser, name, game) {
  await browser.touchOff();
  await sleep(300);
  const layout = await browser.game(layoutProbe);
  const labels = layout.targets.map((target) => target.label);
  report[name] = { landscape: { picture: layout.picture, smallest: Math.min(...layout.targets.map((target) => Math.min(target.w, target.h))) } };
  check(`${name}: the controls are shown although the browser reports a mouse, not a touch screen`,
    layout.coarse === false && [...game.held, ...game.actions, "Exit", "How to play"].every((label) => labels.includes(label))
    && labels.includes("(stick)") === game.stick, { coarse: layout.coarse, labels });
  const faults = layoutFaults(layout, { clearOfPicture: true });
  check(`${name}: every target is at least 96 px, 12 px from the next, on the window and clear of the picture (landscape)`, faults.length === 0,
    faults.length ? faults : report[name].landscape);
  check(`${name}: no link and no desktop toolbar on the page`, layout.links === 0 && layout.toolbar === 0, { links: layout.links, toolbar: layout.toolbar });
  await browser.screenshot(`${name}-1-landscape.png`);

  // A tablet held upright.
  await browser.viewport(768, 1024);
  await sleep(700);
  const portrait = await browser.game(layoutProbe);
  const portraitFaults = layoutFaults(portrait, { clearOfPicture: true });
  report[name].portrait = { picture: portrait.picture, smallest: Math.min(...portrait.targets.map((target) => Math.min(target.w, target.h))) };
  check(`${name}: portrait (768x1024) keeps every target 96 px, apart, on the window and off the picture`, portraitFaults.length === 0,
    portraitFaults.length ? portraitFaults : report[name].portrait);
  await browser.screenshot(`${name}-2-portrait.png`);
  await browser.viewport(0, 0);
  await sleep(700);

  await browser.touchOn();
  await browser.press("[data-kiosk-help]");
  await sleep(400);
  const help = await browser.game(`(() => { const card = document.querySelector(".kiosk-help"); return card && { lines: [...card.querySelectorAll("li")].map((li) => li.textContent), links: card.querySelectorAll("a").length }; })()`);
  await browser.screenshot(`${name}-3-help.png`);
  check(`${name}: How to play shows a few plain lines and no link`,
    !!help && help.lines.length >= 3 && help.lines.length <= 6 && help.links === 0 && help.lines.every((line) => !/Command|Option|Control|⌘/.test(line)), help);
  await browser.press("[data-kiosk-help-close]");
  await sleep(400);
  check(`${name}: OK closes it`, (await browser.game(`document.querySelector(".kiosk-help") === null`)) === true);
}

const orange = (r, g, b) => r > 200 && g > 90 && g < 215 && b < 80;
let browser;
try {
  // =====================================================================================
  // ClockWerx
  // =====================================================================================
  browser = await stage.openBrowser("controls");
  await part("clockwerx", async () => {
    const game = GAMES.clockwerx;
    const who = subject(1);
    await browser.open(game.route, game.id, who);
    await sleep(6000);
    await commonChecks(browser, "clockwerx", game);

    // Launch to play: New game, then the game's own Play button. Nobody types a name.
    await browser.press(action("Meta+n"));
    await sleep(3000);
    await browser.picture("clockwerx-4-options.png");
    await browser.tap([318, 402]);
    const first = await waitFor("a checkpoint after Play", async () => (await browser.events()).find((event) => event.type === "checkpoint" && !event.reason), 30_000);
    const settings = decodeSaveText((await browser.held(who)).data).files.find((file) => file.path.endsWith("ClockWerx Settings"));
    const name = settings ? settings.data.subarray(532, 539).toString("latin1") : null;
    check("clockwerx: a new player starts as Player without typing (the seed)", name === "\u0006Player", { name: name && name.slice(1), seq: first.seq });

    // In play: the gold hand spins round the first dot of the top row until Swing is held.
    const hand = (r, g, b) => r > 215 && g > 195 && b < 90;
    const band = { x: 55, y: 96, w: 420, h: 50 };
    await sleep(9000);
    const before = [];
    for (let sample = 0; sample < 5; sample++) { before.push((await browser.picture(null, band)).find(hand)?.h ?? null); await sleep(350); }
    await browser.picture("clockwerx-5-play.png");
    const swing = await browser.middle(heldButton("Swing"));
    await browser.touch("touchStart", [swing]);
    const during = [];
    for (let sample = 0; sample < 16; sample++) { await sleep(450); during.push((await browser.picture(null, band)).find(hand)?.h ?? null); }
    const pressed = await browser.game(`document.querySelector(${JSON.stringify(heldButton("Swing"))}).classList.contains("is-active")`);
    await browser.picture("clockwerx-6-swing-held.png");
    await browser.touch("touchEnd", []);
    // One finger holds Swing (Command); a second taps Try again (Command-R). The tap letting go
    // must not lift Command under the first finger.
    const heldKeys = () => browser.game(`document.querySelector(".mobile-controls").dataset.heldKeys ?? ""`);
    const tryAgain = await browser.middle(action("Meta+r"));
    await sleep(400);
    await browser.touch("touchStart", [{ ...swing, id: 1 }]);
    await sleep(300);
    const swingOnly = await heldKeys();
    await browser.touch("touchStart", [{ ...swing, id: 1 }, { ...tryAgain, id: 2 }]);
    await sleep(90);
    const withTap = await heldKeys();
    await browser.touch("touchEnd", [{ ...tryAgain, id: 2 }]);
    await sleep(700);
    const afterTap = await heldKeys();
    const stillPressed = await browser.game(`document.querySelector(${JSON.stringify(heldButton("Swing"))}).classList.contains("is-active")`);
    await browser.touch("touchEnd", []);
    await sleep(300);
    const released = await heldKeys();
    report.clockwerx.sharedKey = { swingOnly, withTap, afterTap, released };
    check("clockwerx: a tap action that shares a key with a held button does not release it under the finger",
      swingOnly === "Meta" && withTap.split(" ").includes("Meta") && withTap.split(" ").includes("r") && afterTap === "Meta" && stillPressed && released === "",
      report.clockwerx.sharedKey);
    // The system takes the finger away (a gesture, a window change): the key goes up.
    await browser.touch("touchStart", [swing]);
    await sleep(300);
    const beforeCancel = await heldKeys();
    await browser.touch("touchCancel", []);
    await sleep(300);
    const afterCancel = { keys: await heldKeys(), active: await browser.game(`document.querySelector(${JSON.stringify(heldButton("Swing"))}).classList.contains("is-active")`) };
    check("clockwerx: touchCancel on a held button releases its key", beforeCancel === "Meta" && afterCancel.keys === "" && afterCancel.active === false, { beforeCancel, afterCancel });
    await sleep(9000); // Try again restarted the level
    report.clockwerx.hand = { before: before.map(Math.round), during: during.map(Math.round) };
    // The hand turns slowly about its dot, so its middle stays within a hand's length; the dots
    // are 48 apart, so a middle that has moved more than 35 is a hand on another dot.
    const home = before.reduce((sum, h) => sum + h, 0) / before.length;
    check("clockwerx: the hand stays on its dot while nothing is held", before.every((h) => h !== null && Math.abs(h - home) < 20), report.clockwerx.hand);
    check("clockwerx: holding Swing moves the hand to another dot", pressed && during.some((h) => h !== null && Math.abs(h - home) > 35), report.clockwerx.hand);

    // Start again without a menu: Stop shows the scores, OK returns to the level list, Play starts.
    await browser.press(action("Meta+e"));
    await sleep(3000);
    const scores = await browser.picture("clockwerx-7-stop-scores.png");
    await browser.tap([144, 370]);
    await sleep(2500);
    const options = await browser.picture("clockwerx-8-options-again.png");
    await browser.tap([318, 402]);
    await sleep(9000);
    const again = [];
    for (let sample = 0; sample < 3; sample++) { again.push((await browser.picture(null, band)).find(hand)?.h ?? null); await sleep(350); }
    await browser.picture("clockwerx-9-play-again.png");
    check("clockwerx: Stop, OK and Play start the level again (the hand is back on its first dot)",
      scores.hash !== options.hash && again.every((h) => h !== null && Math.abs(h - home) < 25), { home: Math.round(home), again: again.map(Math.round) });

    // Exit saves, then leaves.
    await browser.press("[data-kiosk-exit]");
    const saving = await browser.game(`document.querySelector(".ottertube-saving")?.textContent ?? null`).catch(() => null);
    const left = await waitFor("exit", async () => (await browser.events()).find((event) => event.type === "exit"), 6000, 50).catch(() => null);
    const state = decodeSaveText((await browser.held(who)).data);
    check("clockwerx: Exit asks OtterTube to leave, with the scores held",
      !!left && state.files.some((file) => file.path.endsWith("ClockWerx Scores")), { saving, files: state.files.map((file) => file.path) });
  });

  // =====================================================================================
  // Delirium
  // =====================================================================================
  let deliriumHeld = null, beatOff = null, beatOn = null;
  const whoD = subject(2);
  // The preferences dialog, by touch: tap past the title, tap Preferences, park the game's pointer.
  // Delirium draws its own pointer 56 lines below the finger, so a tap aims that much higher.
  const AIM = 56;
  const BEAT_LABEL = { x: 204, y: 277, w: 153, h: 21 };
  async function deliriumPreferences(target) {
    await target.tap([320, 200]);
    await sleep(3000);
    await target.tap([237, 414]);
    await sleep(2500);
  }
  const park = async (target) => { await target.tap([150, 190 - AIM]); await sleep(800); };
  await part("delirium", async () => {
    const game = GAMES.delirium;
    await browser.open(game.route, game.id, whoD);
    await sleep(6000);
    await commonChecks(browser, "delirium", game);

    // The smart bombs left, as the row of small icons at the bottom left (five to start with).
    const bombs = async () => (await browser.picture(null, { x: 0, y: 405, w: 110, h: 30 })).find(orange, 1)?.count ?? 0;
    const ship = async () => (await browser.picture(null, { x: 0, y: 110, w: 640, h: 300 })).find(orange);
    const titleBombs = await bombs();
    await browser.press(action("Space,Space"));
    await sleep(6000);
    const fullBombs = await bombs();
    await browser.picture("delirium-4-play.png");
    check("delirium: Start begins a game (the bomb counter appears)", titleBombs === 0 && fullBombs > 60, { titleBombs, fullBombs });

    // The stick flies the ship: up to the top of the sky, then down.
    const stickUp = await browser.middle(".mobile-joystick", 0, -0.8);
    const stickMid = await browser.middle(".mobile-joystick");
    const stickDown = await browser.middle(".mobile-joystick", 0, 0.8);
    await browser.touch("touchStart", [{ ...stickMid, id: 1 }]);
    await browser.touch("touchMove", [{ ...stickUp, id: 1 }]);
    await sleep(2200);
    const up = await ship();
    // A second finger, with the first still on the stick.
    const fire = await browser.middle(heldButton("Fire"));
    await browser.touch("touchStart", [{ ...stickUp, id: 1 }, { ...fire, id: 2 }]);
    await sleep(500);
    const both = await browser.game(`({ stick: document.querySelector(".mobile-joystick").classList.contains("is-active"),
      y: Number(document.querySelector(".mobile-joystick").style.getPropertyValue("--stick-y")),
      fire: document.querySelector(${JSON.stringify(heldButton("Fire"))}).classList.contains("is-active") })`);
    await browser.picture("delirium-5-stick-and-fire.png");
    await browser.touch("touchEnd", [{ ...fire, id: 2 }]);
    await sleep(250);
    const afterFire = await browser.game(`({ stick: document.querySelector(".mobile-joystick").classList.contains("is-active"),
      fire: document.querySelector(${JSON.stringify(heldButton("Fire"))}).classList.contains("is-active") })`);
    // Bomb while the stick is still held: the game sees a button and a direction together.
    const bomb = await browser.middle(heldButton("Bomb"));
    await browser.touch("touchStart", [{ ...stickUp, id: 1 }, { ...bomb, id: 2 }]);
    await sleep(400);
    await browser.touch("touchEnd", [{ ...bomb, id: 2 }]);
    await sleep(1200);
    const afterBomb = await bombs();
    const stillUp = await ship();
    await browser.touch("touchMove", [{ ...stickDown, id: 1 }]);
    await sleep(2200);
    const down = await ship();
    await browser.touch("touchEnd", []);
    await browser.picture("delirium-6-after-down.png");
    report.delirium.play = { up, down, stillUp, both, afterFire, fullBombs, afterBomb };
    check("delirium: the stick flies the ship up, then down", !!up && !!down && up.v < 200 && down.v > up.v + 60, { up, down });
    check("delirium: two fingers at once: the stick stays held while Fire is pressed and released",
      both.stick && both.fire && both.y < -0.5 && afterFire.stick && !afterFire.fire, { both, afterFire });
    check("delirium: Bomb pressed while the stick is held uses a bomb, and the ship is still at the top",
      afterBomb < fullBombs * 0.8 && afterBomb > 0 && !!stillUp && stillUp.v < 200, { fullBombs, afterBomb, stillUp });

    // Start again after a game ends: Stop ends it, Start begins another.
    await browser.press(action("Escape"));
    await sleep(6000);
    const stopped = await bombs();
    await browser.press(action("Space,Space"));
    await sleep(6000);
    const restarted = await bombs();
    check("delirium: Stop ends the game and Start begins a new one with all its bombs", stopped === 0 && restarted === fullBombs, { stopped, restarted, fullBombs });
    await browser.press(action("Escape"));
    await sleep(6000);

    // Change a preference, then use the game's own Quit: the page saves and leaves.
    await deliriumPreferences(browser);
    await park(browser);
    beatOn = (await browser.picture("delirium-7-preferences.png", BEAT_LABEL)).hash;
    await browser.tap([279, 287 - AIM]);
    await sleep(1200);
    await park(browser);
    beatOff = (await browser.picture(null, BEAT_LABEL)).hash;
    await browser.picture("delirium-8-beat-off.png");
    check("delirium: a preference is changed by touch (Background Beat)", beatOn !== beatOff);
    await browser.tap([572, 364 - AIM]);
    await sleep(2500);
    await browser.picture("delirium-9-after-ok.png");
    await browser.tap([72, 414]);
    const left = await waitFor("exit after Quit", async () => (await browser.events()).find((event) => event.type === "exit"), 15_000, 100).catch(() => null);
    const order = (await browser.events()).filter((event) => ["checkpoint", "exit"].includes(event.type)).map((event) => event.type);
    deliriumHeld = await browser.held(whoD);
    const files = deliriumHeld ? decodeSaveText(deliriumHeld.data).files.map((file) => file.path) : [];
    report.delirium.quit = { order, files };
    check("delirium: the game's Quit saves its preferences and asks OtterTube to leave (no dead screen)",
      !!left && order.at(-1) === "exit" && order.includes("checkpoint") && files.some((path) => path.endsWith("Delirium 1.1 Preferences")), report.delirium.quit);
  });

  // =====================================================================================
  // Blobbo
  // =====================================================================================
  let blobboHeld = null, savedAt = null, startAt = null;
  const whoB = subject(3);
  const blobbo = (r, g, b) => r > 245 && g >= 205 && g <= 230 && b < 20;
  const where = async (target, file) => { const found = (await target.picture(file)).find(blobbo); return found && { h: Math.round(found.h), v: Math.round(found.v) }; };
  const stickPush = async (target, dx, dy, ms = 350) => {
    const mid = await target.middle(".mobile-joystick"), to = await target.middle(".mobile-joystick", dx * 0.8, dy * 0.8);
    await target.touch("touchStart", [mid]); await target.touch("touchMove", [to]); await sleep(ms); await target.touch("touchEnd", []);
    await sleep(900);
  };
  async function blobboLoad(target) {
    await target.press(action("Meta+r"));
    await sleep(2500);
    await target.picture("blobbo-load-dialog.png");
    await target.tap([108, 134]); // the saved game in the list
    await sleep(800);
    await target.tap([347, 197]); // Open
    await sleep(3000);
  }
  await part("blobbo", async () => {
    const game = GAMES.blobbo;
    await browser.open(game.route, game.id, whoB);
    await sleep(6000);
    await commonChecks(browser, "blobbo", game);

    await browser.tap([316, 204]); // the Blobbo button of the opening card
    await sleep(3000);
    startAt = await where(browser, "blobbo-4-board.png");
    check("blobbo: a tap on the opening card starts the board", !!startAt, startAt);
    // Tap = move the pointer there and click: Blobbo steps toward a tap beside him.
    await browser.tap([startAt.h, startAt.v + 40]);
    await sleep(1200);
    const afterTap = await where(browser, "blobbo-5-after-tap-below.png");
    check("blobbo: a tap below Blobbo moves him down", !!afterTap && afterTap.v > startAt.v + 8 && Math.abs(afterTap.h - startAt.h) < 6, { startAt, afterTap });
    await stickPush(browser, 0, 1);
    const afterStick = await where(browser, "blobbo-6-after-stick-down.png");
    check("blobbo: the stick moves him too", !!afterStick && afterStick.v > afterTap.v + 8, { afterTap, afterStick });

    // Save by touch: the Save button, then the game's own Save in its dialog.
    await browser.press(action("Meta+s"));
    await sleep(2500);
    await browser.picture("blobbo-7-save-dialog.png");
    await browser.tap([348, 281]);
    const saved = await waitFor("the saved game", async () => {
      const held = await browser.held(whoB);
      return held && decodeSaveText(held.data).files.some((file) => file.file_type === 0x426c626f) ? held : null;
    }, 20_000).catch(() => null);
    savedAt = afterStick;
    check("blobbo: Save puts a saved game in the child's save", !!saved, saved && decodeSaveText(saved.data).files.map((file) => [file.path, file.data.length]));

    // Move on, then Load: the board returns to where it was saved.
    await stickPush(browser, 0, -1);
    await stickPush(browser, 0, -1);
    const moved = await where(browser, "blobbo-8-moved-on.png");
    await blobboLoad(browser);
    const loaded = await where(browser, "blobbo-9-loaded.png");
    check("blobbo: Load brings Blobbo back to where he was saved", !!moved && !!loaded && moved.v < savedAt.v - 8 && Math.abs(loaded.v - savedAt.v) < 4 && Math.abs(loaded.h - savedAt.h) < 4, { savedAt, moved, loaded });

    // The game's own Quit, from its File menu, by a finger drag.
    await browser.drag([51, 10], [60, 227]);
    const left = await waitFor("exit after Quit", async () => (await browser.events()).find((event) => event.type === "exit"), 12_000, 100).catch(() => null);
    if (!left) await browser.picture("blobbo-10-after-quit.png");
    blobboHeld = await browser.held(whoB);
    check("blobbo: File, Quit by a finger drag ends the game and the page leaves", !!left, (await browser.events()).map((event) => event.type));
  });
  await browser.close();
  browser = null;

  // =====================================================================================
  // A fresh browser profile given the saves
  // =====================================================================================
  browser = await stage.openBrowser("controls-fresh");
  await browser.touchOn();
  await part("delirium restore", async () => {
    if (!deliriumHeld) throw new Error("no Delirium save to restore (the earlier part failed)");
    const game = GAMES.delirium;
    const init = await browser.open(game.route, game.id, whoD, { prepare: () => browser.host(`fakeHost.importSave(${JSON.stringify(whoD)}, ${JSON.stringify(deliriumHeld.data)})`) });
    await sleep(6000);
    await deliriumPreferences(browser);
    await park(browser);
    const label = (await browser.picture("delirium-fresh-preferences.png", BEAT_LABEL)).hash;
    check("delirium: a fresh profile given the save shows the changed preference", init.bytes === deliriumHeld.data.length && label === beatOff && label !== beatOn, { label, beatOff, beatOn });
    await sleep(2500);
    check("delirium: nothing is sent back while nothing changes", (await browser.events()).every((event) => event.type !== "checkpoint"));
  });
  await part("blobbo restore", async () => {
    if (!blobboHeld || !savedAt) throw new Error("no Blobbo save to restore (the earlier part failed)");
    const game = GAMES.blobbo;
    await browser.open(game.route, game.id, whoB, { prepare: () => browser.host(`fakeHost.importSave(${JSON.stringify(whoB)}, ${JSON.stringify(blobboHeld.data)})`) });
    await sleep(6000);
    await browser.tap([316, 204]);
    await sleep(3000);
    const fresh = await where(browser, "blobbo-fresh-board.png");
    await blobboLoad(browser);
    const loaded = await where(browser, "blobbo-fresh-loaded.png");
    check("blobbo: a fresh profile given the save can Load the saved game",
      !!fresh && !!loaded && Math.abs(fresh.v - startAt.v) < 4 && Math.abs(loaded.v - savedAt.v) < 4 && Math.abs(loaded.h - savedAt.h) < 4, { startAt, savedAt, fresh, loaded });
  });
} catch (error) {
  check("the run completed", false, String(error?.stack ?? error));
} finally {
  await browser?.close().catch(() => {});
}
const code = stage.finish(report);
console.log(JSON.stringify({ passed: report.passed, failed: report.failed, clockwerx: report.clockwerx, delirium: report.delirium, blobbo: report.blobbo, report: join(stage.outDir, "report.json") }, null, 2));
process.exit(code);
