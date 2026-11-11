#!/usr/bin/env node
// Browser check of the slim OtterTube add-on bundle played with no keyboard and no mouse: by touch
// alone, and by a game controller alone. For ClockWerx, Delirium and Blobbo: the game reaches where
// play starts by itself (or with one press), the Mac menu bar and the blocked controls take no
// touch, each script ends on the screen it is for, every on-screen control has an effect, and the
// page leaves with the save held.
//
// Touch is Input.dispatchTouchEvent (one finger, or two for the stick and a button together). The
// controller is a standard pad behind navigator.getGamepads, injected before the page loads; no
// real device is involved. The host is www/tests/fixtures/ottertube-fake-host.html filling a
// 1920x1080 window, not OtterTube. End states are waited for as screen conditions (the page's own,
// which are hashes of regions of the game's screen), not as elapsed time.
//
// Environment as verify-ottertube-link-cdp.mjs. OTTERTUBE_LINK_DEV_GAMES names a games file to use
// in place of the bundle's (for a mutation run). OTTERTUBE_LINK_ONLY=clockwerx,blobbo runs a part.

import { join } from "node:path";
import { decodeSaveText, sleep, startStage, waitFor } from "./ottertube-cdp-kit.mjs";

const stage = await startStage();
const { check, part } = stage;
const report = { bundle: stage.dist, window: [1920, 1080], devGames: process.env.OTTERTUBE_LINK_DEV_GAMES ?? null };
const subject = (digit) => String(digit).repeat(32);
const only = (process.env.OTTERTUBE_LINK_ONLY ?? "clockwerx,delirium,blobbo").split(",");

// What a child sees where each game's launch leaves it.
const GAMES = {
  clockwerx: { route: "/clockwerx/", id: "clockwerx-personal-10", stick: false, launch: "options",
    held: ["Swing", "Bounce", "Flip", "Reverse"], actions: ["Play", "Next level", "Level before"] },
  delirium: { route: "/delirium/", id: "delirium-personal-11", stick: true, launch: "title",
    held: ["Fire", "Bomb", "Thrust", "Turn"], actions: ["Start"] },
  blobbo: { route: "/blobbo/", id: "blobbo-full-personal-101", stick: true, launch: "board",
    held: ["Wait", "Drop"], actions: ["Start again", "Save", "Load"] },
};
const keysButton = (keys) => `[data-kiosk-keys="${keys}"]`;
const scriptButton = (name) => `[data-kiosk-script="${name}"]`;
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
function layoutFaults(layout) {
  const faults = [];
  const apart = (a, b) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
  for (const target of layout.targets) {
    if (target.w < 96 || target.h < 96) faults.push(`${target.label} is ${Math.round(target.w)}x${Math.round(target.h)}`);
    if (target.x < 0 || target.y < 0 || target.x + target.w > layout.window.w + 0.5 || target.y + target.h > layout.window.h + 0.5) faults.push(`${target.label} is off the window`);
    if (apart(target, layout.picture) < 0) faults.push(`${target.label} is over the picture`);
    if (/Command|Option|Control|Cmd|⌘|Meta|Alt|Numpad/.test(target.label)) faults.push(`${target.label} names a key`);
  }
  layout.targets.forEach((a, i) => layout.targets.slice(i + 1).forEach((b) => {
    if (apart(a, b) < 12) faults.push(`${a.label} and ${b.label} are ${Math.round(apart(a, b))} px apart`);
  }));
  return faults;
}

/** Open a game and wait for its launch script to end on the screen it is for. */
async function launch(browser, name, who, options) {
  const game = GAMES[name];
  const opened = Date.now();
  const init = await browser.open(game.route, game.id, who, options);
  // What the child sees while the game is being started (when this is read before the launch script has ended).
  const starting = await browser.game(`({ ended: document.querySelector(".app--ottertube").dataset.kioskScript ?? null,
    buttons: [...document.querySelectorAll(".kiosk-button--action")].filter((e) => getComputedStyle(e).display !== "none").length,
    notice: document.querySelector(".kiosk-busy")?.innerText ?? null })`);
  await browser.waitScreen(game.launch, 60_000);
  const outcome = await waitFor("the launch script to end", async () => { const k = await browser.kiosk(); return k.busy === null && k.script ? k.script : null; }, 30_000, 100);
  return { init, outcome, ms: Date.now() - opened, starting };
}

/** What is common to the three, where the launch leaves the game: shown without a touch device, child sized, help, no links. */
async function commonChecks(browser, name) {
  const game = GAMES[name];
  await browser.touchOff();
  await sleep(300);
  const layout = await browser.game(layoutProbe);
  const labels = layout.targets.map((target) => target.label);
  report[name].landscape = { picture: layout.picture, smallest: Math.min(...layout.targets.map((target) => Math.min(target.w, target.h))) };
  check(`${name}: the controls are shown although the browser reports a mouse, not a touch screen`,
    layout.coarse === false && [...game.held, ...game.actions, "Exit", "How to play"].every((label) => labels.includes(label))
    && labels.includes("(stick)") === game.stick, { coarse: layout.coarse, labels });
  const faults = layoutFaults(layout);
  check(`${name}: every target is at least 96 px, 12 px from the next, on the window and clear of the picture (landscape)`, faults.length === 0,
    faults.length ? faults : report[name].landscape);
  check(`${name}: no link and no desktop toolbar on the page`, layout.links === 0 && layout.toolbar === 0, { links: layout.links, toolbar: layout.toolbar });
  await browser.screenshot(`${name}-1-landscape.png`);
  await browser.viewport(768, 1024);
  await sleep(700);
  const portrait = await browser.game(layoutProbe);
  const portraitFaults = layoutFaults(portrait);
  report[name].portrait = { picture: portrait.picture, smallest: Math.min(...portrait.targets.map((target) => Math.min(target.w, target.h))) };
  check(`${name}: portrait (768x1024) keeps every target 96 px, apart, on the window and off the picture`, portraitFaults.length === 0,
    portraitFaults.length ? portraitFaults : report[name].portrait);
  await browser.screenshot(`${name}-2-portrait.png`);
  await browser.viewport(0, 0);
  await sleep(700);
  await browser.touchOn();
  const help = await readHelp(browser);
  check(`${name}: How to play shows a few plain lines and no link`,
    !!help && help.lines.length >= 3 && help.lines.length <= 6 && help.links === 0 && help.lines.every((line) => !/Command|Option|Control|⌘|controller|button/i.test(line)), help);
}
async function readHelp(browser) {
  await browser.press("[data-kiosk-help]");
  await sleep(400);
  const help = await browser.game(`(() => { const card = document.querySelector(".kiosk-help"); return card && { lines: [...card.querySelectorAll("li")].map((li) => li.textContent), links: card.querySelectorAll("a").length }; })()`);
  await browser.press("[data-kiosk-help-close]");
  await sleep(400);
  return help;
}

/** Wait until a part of the picture has stopped changing (a game fades its screens in). */
async function still(target, area, samples = 3, everyMs = 350) {
  let last = null, same = 0;
  return waitFor("the picture to settle", async () => {
    const now = (await target.picture(null, area)).hash;
    same = now === last ? same + 1 : 0;
    last = now;
    return same >= samples - 1 ? now : null;
  }, 20_000, everyMs);
}

/** Leave with Exit (a touch) or the controller's Back held, and say what OtterTube's stand-in then holds. */
async function leave(browser, who, how) {
  await how();
  const left = await waitFor("exit", async () => (await browser.events()).find((event) => event.type === "exit"), 8000, 50).catch(() => null);
  const held = await browser.held(who);
  return { left: !!left, files: held ? decodeSaveText(held.data).files.map((file) => file.path) : [] };
}
const holdBack = (browser) => async () => { await browser.pad({ b: [8] }); await sleep(1500); };
/** Does the page come to recognise this screen? (It looks five times a second, so not at once.) */
const shows = (target, name, timeoutMs = 5000) => target.waitScreen(name, timeoutMs).then(() => true, () => false);

const orange = (r, g, b) => r > 200 && g > 90 && g < 215 && b < 80;
let browser;
try {
  browser = await stage.openBrowser("controls");

  // =====================================================================================
  // ClockWerx
  // =====================================================================================
  // The gold hand: its middle, and its angle about the dot it starts on (the second of the top row).
  const HOME = [122, 121];
  const goldHand = (r, g, b) => r > 215 && g > 195 && b < 90;
  const hand = async (target) => {
    const found = (await target.picture(null, { x: 30, y: 72, w: 200, h: 98 })).find(goldHand);
    return found && { h: found.h, v: found.v, angle: Math.atan2(found.v - HOME[1], found.h - HOME[0]) };
  };
  const onHome = (at) => !!at && Math.hypot(at.h - HOME[0], at.v - HOME[1]) < 24;
  /** Which way the hand turns: +1 or -1 over a second and a half, 0 when it does not turn. */
  async function turning(target) {
    const angles = [];
    for (let sample = 0; sample < 4; sample++) { angles.push((await hand(target))?.angle ?? null); await sleep(450); }
    if (angles.includes(null)) return null;
    let total = 0;
    for (let i = 1; i < angles.length; i++) { let d = angles[i] - angles[i - 1]; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; total += d; }
    return Math.abs(total) < 0.06 ? 0 : Math.sign(total);
  }
  /** Hold a control until the hand is on another dot, or for `ms` at most. */
  async function holdUntilMoved(target, down, up, ms) {
    await down();
    const until = Date.now() + ms;
    let moved = null;
    while (Date.now() < until && !moved) { await sleep(350); const at = await hand(target); if (at && !onHome(at)) moved = at; }
    await up();
    return moved;
  }
  const LEVELS = { x: 416, y: 136, w: 150, h: 230 };
  if (only.includes("clockwerx")) await part("clockwerx", async () => {
    report.clockwerx = {};
    const who = subject(1);
    report.clockwerx.launch = await launch(browser, "clockwerx", who);
    check("clockwerx: with no input the game goes past its title to the level list", report.clockwerx.launch.outcome === "launch:done", report.clockwerx.launch);
    const { starting } = report.clockwerx.launch;
    check("clockwerx: while the game is being started the child is told to wait, and none of the game's buttons is offered",
      starting.ended === null && starting.buttons === 0 && /moment/i.test(starting.notice ?? ""), starting);
    await commonChecks(browser, "clockwerx");

    // The Mac menu bar takes no touch: a finger held on File opens nothing.
    const menuArea = { x: 20, y: 20, w: 170, h: 180 };
    const beforeMenu = (await browser.picture(null, menuArea)).hash;
    const file = await browser.middle("canvas.game-canvas", -1 + 2 * 51.5 / 640, -1 + 2 * 10.5 / 480);
    await browser.touch("touchStart", [file]);
    await sleep(700);
    const duringMenu = (await browser.picture("clockwerx-3-menu-bar-held.png", menuArea)).hash;
    await browser.touch("touchEnd", []);
    await sleep(400);
    check("clockwerx: a finger held on the menu bar opens no menu", beforeMenu === duringMenu, { beforeMenu, duringMenu });

    // Controls a child should not reach on the level list: each takes no touch.
    const blocked = [
      ["Keyboard or Mouse", [380, 137], { x: 282, y: 125, w: 122, h: 25 }],
      ["Two Player", [350, 209], { x: 143, y: 197, w: 267, h: 25 }],
      ["Skip Level", [490, 381], { x: 150, y: 45, w: 60, h: 40 }],
    ];
    const unchanged = [];
    for (const [what, at, area] of blocked) {
      const before = (await browser.picture(null, area)).hash;
      await browser.tap(at);
      await sleep(900);
      unchanged.push([what, before === (await browser.picture(null, area)).hash]);
    }
    await browser.tap([210, 138]); // the name field: its effect would be a typed name, checked below
    check("clockwerx: Keyboard or Mouse, Two Player and Skip Level take no touch", unchanged.every(([, same]) => same), unchanged);

    // Pick a level with the big buttons, not the 12-pixel rows.
    const level1 = await still(browser, LEVELS);
    await browser.press(keysButton("ArrowDown"));
    await sleep(700);
    const level2 = (await browser.picture("clockwerx-4-next-level.png", LEVELS)).hash;
    await browser.press(keysButton("ArrowUp"));
    await sleep(700);
    const back = (await browser.picture(null, LEVELS)).hash;
    check("clockwerx: Next level and Level before move the choice in the level list", level2 !== level1 && back === level1, { level1, level2, back });

    // One press from the level list into play.
    const played = await browser.scriptRun("play", () => browser.press(scriptButton("play")));
    await browser.waitScreen("playing", 20_000);
    check("clockwerx: Play is one press, and ends in the game", played === "done", { played, screens: (await browser.kiosk()).screens });
    await waitFor("a checkpoint after Play", async () => (await browser.events()).find((event) => event.type === "checkpoint" && !event.reason), 30_000);
    const settings = decodeSaveText((await browser.held(who)).data).files.find((file) => file.path.endsWith("ClockWerx Settings"));
    const name = settings ? settings.data.subarray(532, 539).toString("latin1") : null;
    check("clockwerx: the player is Player: nobody typed, and the name field took no touch", name === "\u0006Player", { name: name && name.slice(1) });

    // In play. The hand turns about its dot until a control moves it.
    await waitFor("the hand", async () => onHome(await hand(browser)), 20_000, 300);
    await sleep(1000);
    const idle = await turning(browser);
    const swing = await browser.middle(heldButton("Swing"));
    const swung = await holdUntilMoved(browser, () => browser.touch("touchStart", [swing]), () => browser.touch("touchEnd", []), 14_000);
    await browser.picture("clockwerx-5-after-swing.png");
    check("clockwerx: the hand turns about its dot, and holding Swing moves it to another dot", idle !== 0 && idle !== null && !!swung, { idle, swung });

    // Try again puts the level back.
    await browser.press(keysButton("Meta+r"));
    const again = await waitFor("the level to start again", async () => onHome(await hand(browser)), 20_000, 300).catch(() => false);
    check("clockwerx: Try again starts the level again (the hand is back on its dot)", again === true);
    await sleep(1200);

    const flip = await browser.middle(heldButton("Flip"));
    const flipped = await holdUntilMoved(browser, () => browser.touch("touchStart", [flip]), () => browser.touch("touchEnd", []), 16_000);
    check("clockwerx: holding Flip moves the hand to another dot", !!flipped, flipped);
    await browser.press(keysButton("Meta+r"));
    await waitFor("the level to start again", async () => onHome(await hand(browser)), 20_000, 300);
    await sleep(1200);

    // Reverse turns the hand the other way at once; Bounce does when the hand meets the next dot.
    const way = await turning(browser);
    await browser.press(heldButton("Reverse"), 250);
    await sleep(300);
    const reversed = await turning(browser);
    check("clockwerx: Reverse turns the hand the other way", way !== 0 && reversed === -way, { way, reversed });
    const bounce = await browser.middle(heldButton("Bounce"));
    await browser.touch("touchStart", [bounce]);
    let bounced = null;
    for (let tries = 0; tries < 14 && bounced === null; tries++) { const now = await turning(browser); if (now === -reversed) bounced = now; }
    const bounceKey = (await browser.kiosk()).held;
    await browser.touch("touchEnd", []);
    check("clockwerx: holding Bounce turns the hand back when it meets a dot", bounced !== null && bounceKey === "Alt" && onHome(await hand(browser)), { reversed, bounced, bounceKey });

    // Pause hides the board until it is pressed again.
    await browser.press(keysButton("Meta+p"));
    await sleep(1500);
    const paused = await hand(browser);
    await browser.picture("clockwerx-6-paused.png");
    await browser.press(keysButton("Meta+p"));
    const resumed = await waitFor("the board back", async () => !!(await hand(browser)), 8000, 300).catch(() => false);
    check("clockwerx: Pause hides the board, and pressing it again brings it back", paused === null && resumed === true, { paused });

    // One finger holds Swing (Command); a second taps Try again (Command-R).
    const tryAgain = await browser.middle(keysButton("Meta+r"));
    await browser.touch("touchStart", [{ ...swing, id: 1 }]);
    await sleep(300);
    const swingOnly = (await browser.kiosk()).held;
    await browser.touch("touchStart", [{ ...swing, id: 1 }, { ...tryAgain, id: 2 }]);
    await sleep(90);
    const withTap = (await browser.kiosk()).held;
    await browser.touch("touchEnd", [{ ...tryAgain, id: 2 }]);
    await sleep(700);
    const afterTap = (await browser.kiosk()).held;
    await browser.touch("touchEnd", []);
    await sleep(300);
    const released = (await browser.kiosk()).held;
    check("clockwerx: a tap action that shares a key with a held button does not release it under the finger",
      swingOnly === "Meta" && withTap.split(" ").includes("Meta") && withTap.split(" ").includes("r") && afterTap === "Meta" && released === "",
      { swingOnly, withTap, afterTap, released });
    await browser.touch("touchStart", [swing]);
    await sleep(300);
    const beforeCancel = (await browser.kiosk()).held;
    await browser.touch("touchCancel", []);
    await sleep(300);
    check("clockwerx: touchCancel on a held button releases its key", beforeCancel === "Meta" && (await browser.kiosk()).held === "", { beforeCancel });

    // New game from the middle of a game: the script ends the game, clears the scores, shows the level list.
    const newGame = await browser.scriptRun("new-game", () => browser.press(scriptButton("new-game")));
    check("clockwerx: New game is one press from inside a game, and ends on the level list",
      newGame === "done" && (await shows(browser, "options")), { newGame, screens: (await browser.kiosk()).screens });
    await browser.picture("clockwerx-7-level-list-again.png");
    // And from a game that is paused.
    await browser.scriptRun("play", () => browser.press(scriptButton("play")));
    await waitFor("the hand", async () => onHome(await hand(browser)), 20_000, 300);
    await browser.press(keysButton("Meta+p"));
    await sleep(1500);
    const pausedFirst = (await hand(browser)) === null;
    const fromPause = await browser.scriptRun("new-game", () => browser.press(scriptButton("new-game")));
    check("clockwerx: New game is one press from a paused game too",
      pausedFirst && fromPause === "done" && (await shows(browser, "options")), { pausedFirst, fromPause, screens: (await browser.kiosk()).screens });

    const gone = await leave(browser, who, () => browser.press("[data-kiosk-exit]"));
    check("clockwerx: Exit asks OtterTube to leave, with the settings and the scores held",
      gone.left && gone.files.some((path) => path.endsWith("ClockWerx Scores")) && gone.files.some((path) => path.endsWith("ClockWerx Settings")), gone);
  });

  if (only.includes("clockwerx")) await part("clockwerx by controller", async () => {
    const who = subject(4);
    await launch(browser, "clockwerx", who);
    await browser.touchOff();
    // A frame that has not been allowed the gamepad feature is refused the controllers.
    await browser.pad("refused");
    await sleep(500);
    const refused = (await browser.kiosk()).pad;
    await browser.pad({ b: [] });
    await waitFor("the controller to be seen", async () => (await browser.kiosk()).pad === "on", 5000, 100);
    check("clockwerx: a page the browser refuses the controllers carries on without one, and takes one when it may", refused !== "on", { refused });
    await browser.touchOn();
    const help = await readHelp(browser);
    await browser.touchOff();
    check("clockwerx: with a controller connected, How to play names its buttons", !!help && help.lines.some((line) => /^A /.test(line)) && help.lines.some((line) => /Back button/.test(line)), help);
    const level1 = await still(browser, LEVELS);
    await browser.padPress([13]);
    await sleep(700);
    const level2 = (await browser.picture(null, LEVELS)).hash;
    await browser.padPress([12]);
    await sleep(700);
    const back = (await browser.picture(null, LEVELS)).hash;
    check("clockwerx: the d-pad picks the level", level2 !== level1 && back === level1, { level1, level2, back });
    const played = await browser.scriptRun("play", () => browser.padPress([0]));
    await browser.waitScreen("playing", 20_000);
    check("clockwerx: A starts the game from the level list (OtterTube keeps Start for itself)", played === "done");
    await waitFor("the hand", async () => onHome(await hand(browser)), 20_000, 300);
    await sleep(1000);
    const swung = await holdUntilMoved(browser, () => browser.pad({ b: [0] }), () => browser.pad({ b: [] }), 14_000);
    check("clockwerx: in the game A is Swing: the hand moves to another dot", !!swung, swung);
    const keys = {};
    for (const [label, buttons] of [["A", [0]], ["B", [1]], ["X", [2]], ["Y", [3]], ["A+B", [0, 1]]]) {
      await browser.pad({ b: buttons });
      await sleep(250);
      keys[label] = (await browser.kiosk()).held;
    }
    await browser.pad({ b: [] });
    await sleep(250);
    keys.none = (await browser.kiosk()).held;
    check("clockwerx: A, B, X, Y hold Swing, Bounce, Flip, Reverse; two together hold both; letting go lets go",
      keys.A === "Meta" && keys.B === "Alt" && keys.X === "Control" && keys.Y === "Space" && keys["A+B"] === "Meta Alt" && keys.none === "", keys);
    const again = await browser.scriptRun("try-again", () => browser.padPress([4]));
    const home = await waitFor("the level to start again", async () => onHome(await hand(browser)), 20_000, 300).catch(() => false);
    check("clockwerx: the left shoulder button tries the level again", again === "done" && home === true, { again });
    await sleep(800);
    await browser.scriptRun("pause", () => browser.padPress([5]));
    await sleep(1200);
    const paused = await hand(browser);
    await browser.scriptRun("pause", () => browser.padPress([5]));
    const resumed = await waitFor("the board back", async () => !!(await hand(browser)), 8000, 300).catch(() => false);
    check("clockwerx: the right shoulder button pauses and resumes", paused === null && resumed === true);
    const gone = await leave(browser, who, holdBack(browser));
    check("clockwerx: holding Back leaves, with the save held", gone.left && gone.files.some((path) => path.endsWith("ClockWerx Settings")), gone);
  });

  // =====================================================================================
  // Delirium
  // =====================================================================================
  // The smart bombs left, as the row of small icons at the bottom left (five to start with).
  const bombs = async (target) => (await target.picture(null, { x: 0, y: 405, w: 110, h: 30 })).find(orange, 1)?.count ?? 0;
  const ship = async (target) => (await target.picture(null, { x: 0, y: 110, w: 640, h: 290 })).find(orange);
  // The land's skyline: for columns across the screen, how far down its top edge is.
  const land = (r, g, b) => r > 100 && r < 175 && g < 45 && b > 50 && b < 125;
  const skyline = async (target) => {
    const image = await target.picture(null, { x: 0, y: 300, w: 640, h: 104 });
    const tops = [];
    for (let x = 0; x < image.width; x += 8) { let y = 0; while (y < image.height && !land(...image.at(x, y))) y += 1; tops.push(y); }
    return tops;
  };
  /** The share of the skyline that is somewhere else in `b` than in `a`. */
  const shifted = (a, b) => a.filter((top, index) => Math.abs(top - b[index]) > 3).length / a.length;
  if (only.includes("delirium")) await part("delirium", async () => {
    report.delirium = {};
    const who = subject(2);
    report.delirium.launch = await launch(browser, "delirium", who);
    check("delirium: with no input the game waits on its title", report.delirium.launch.outcome === "launch:done", report.delirium.launch);
    await commonChecks(browser, "delirium");

    // The game's own pointer is under the finger now, and Preferences takes no touch.
    await browser.tap([320, 250]);
    await browser.waitScreen("menu", 15_000);
    await browser.tap([237, 414]);
    await sleep(2500);
    const afterPreferences = (await browser.kiosk()).screens;
    await browser.picture("delirium-3-preferences-tapped.png");
    check("delirium: a tap on Preferences opens nothing (Deregister, Clear Highscores and Set Keys are behind it)",
      afterPreferences.includes("menu") && !afterPreferences.includes("prefs"), afterPreferences);

    const started = await browser.scriptRun("start", () => browser.press(scriptButton("start")));
    check("delirium: Start is one press, and ends in the game", started === "done" && (await shows(browser, "playing")), { started });
    await sleep(1500);
    const fullBombs = await bombs(browser);

    // The stick flies the ship: up to the top of the sky, then down.
    const stickUp = await browser.middle(".mobile-joystick", 0, -0.8);
    const stickMid = await browser.middle(".mobile-joystick");
    const stickDown = await browser.middle(".mobile-joystick", 0, 0.8);
    await browser.touch("touchStart", [{ ...stickMid, id: 1 }]);
    await browser.touch("touchMove", [{ ...stickUp, id: 1 }]);
    await sleep(2400);
    const up = await ship(browser);
    const fire = await browser.middle(heldButton("Fire"));
    await browser.touch("touchStart", [{ ...stickUp, id: 1 }, { ...fire, id: 2 }]);
    await sleep(500);
    const both = await browser.kiosk();
    await browser.touch("touchEnd", [{ ...fire, id: 2 }]);
    await sleep(250);
    const afterFire = await browser.kiosk();
    const bomb = await browser.middle(heldButton("Bomb"));
    await browser.touch("touchStart", [{ ...stickUp, id: 1 }, { ...bomb, id: 2 }]);
    await sleep(400);
    await browser.touch("touchEnd", [{ ...bomb, id: 2 }]);
    await sleep(1200);
    const afterBomb = await bombs(browser);
    await browser.touch("touchMove", [{ ...stickDown, id: 1 }]);
    await sleep(2400);
    const down = await ship(browser);
    await browser.touch("touchEnd", []);
    await browser.picture("delirium-4-play.png");
    report.delirium.play = { up, down, fullBombs, afterBomb, both: both.held, afterFire: afterFire.held };
    check("delirium: the stick flies the ship up, then down", !!up && !!down && up.v < 200 && down.v > up.v + 60, { up, down });
    check("delirium: two fingers at once: the stick stays held while Fire is pressed and released",
      both.held.split(" ").includes("Numpad8") && both.held.split(" ").includes("Meta") && afterFire.held === "Numpad8", report.delirium.play);
    check("delirium: Bomb pressed while the stick is held uses a bomb", fullBombs > 60 && afterBomb < fullBombs * 0.9 && afterBomb > 0, { fullBombs, afterBomb });

    // Turn makes the ship face the other way: it crosses to the other side of the screen.
    await sleep(600);
    const facing = await ship(browser);
    await browser.press(heldButton("Turn"), 250);
    await sleep(1500);
    const turned = await ship(browser);
    check("delirium: Turn sends the ship to face the other way", !!facing && !!turned && Math.abs(turned.h - facing.h) > 100, { facing, turned });
    // Thrust moves the ship over the land: the ground scrolls while it is held.
    // (The turn pans the view: wait for the land to stand still first.)
    let rest0 = await skyline(browser), rest1 = null;
    for (let tries = 0; tries < 20; tries++) {
      await sleep(700);
      rest1 = await skyline(browser);
      if (shifted(rest0, rest1) < 0.1) break;
      rest0 = rest1;
    }
    const thrust = await browser.middle(heldButton("Thrust"));
    await browser.touch("touchStart", [thrust]);
    await sleep(900);
    const thrustKey = (await browser.kiosk()).held;
    const flown = await skyline(browser);
    await browser.touch("touchEnd", []);
    await browser.picture("delirium-4b-after-thrust.png");
    report.delirium.thrust = { atRest: shifted(rest0, rest1), thrusting: shifted(rest1, flown), thrustKey };
    check("delirium: Thrust flies the ship over the land (the land stands still, then slides by while it is held)",
      report.delirium.thrust.atRest < 0.1 && report.delirium.thrust.thrusting > 0.3, report.delirium.thrust);

    // Stop ends the game; Start is one press again from the game-over screen.
    await browser.press(keysButton("Escape"));
    await browser.waitScreen("game-over", 20_000);
    await browser.picture("delirium-5-game-over.png");
    // Reported, not required: whether the game has written its file by the time a game is over.
    await sleep(3500);
    report.delirium.savedAtGameOver = (await browser.held(who)) !== null;
    const restarted = await browser.scriptRun("start", () => browser.press(scriptButton("start")));
    await sleep(1200);
    check("delirium: after Stop the game is over, and Start is one press into a new game with all its bombs",
      restarted === "done" && (await shows(browser, "playing")) && (await bombs(browser)) === fullBombs, { restarted, bombs: await bombs(browser), fullBombs });

    // The game's own Quit still leaves properly.
    await browser.press(keysButton("Escape"));
    await browser.waitScreen("game-over", 20_000);
    await browser.tap([320, 250]);
    await browser.waitScreen("menu", 15_000);
    await sleep(600);
    const gone = await leave(browser, who, () => browser.tap([72, 414], 250));
    check("delirium: the game's own Quit asks OtterTube to leave (no dead screen)", gone.left, gone);
  });

  if (only.includes("delirium")) await part("delirium by controller", async () => {
    // The same child as above. Delirium writes its file when it quits (not when a game ends), and
    // a controller never asks it to quit, so the save this part can show held at the end is the one
    // that child already has.
    const who = subject(2);
    await launch(browser, "delirium", who);
    await browser.touchOff();
    await browser.pad({ b: [] });
    await waitFor("the controller to be seen", async () => (await browser.kiosk()).pad === "on", 5000, 100);
    // The stick is already pushed when A starts the game: the push is still there when the script ends.
    await browser.pad({ b: [], a: [0, -0.9, 0, 0] });
    await sleep(250);
    const started = await browser.scriptRun("start", () => browser.pad({ b: [0], a: [0, -0.9, 0, 0] }));
    await sleep(300);
    const afterScript = (await browser.kiosk()).held;
    check("delirium: A starts the game from the title", started === "done" && (await shows(browser, "playing")), { started });
    check("delirium: a direction held while the script ran is held when it ends, and the press that ran it is not a shot", afterScript === "Numpad8", { afterScript });
    await browser.pad({ b: [], a: [0, -0.9, 0, 0] });
    await sleep(1500);
    const fullBombs = await bombs(browser);
    await sleep(900);
    const up = await ship(browser);
    await browser.pad({ b: [0], a: [0, -0.9, 0, 0] });
    await sleep(300);
    const stickAndA = (await browser.kiosk()).held;
    await browser.pad({ b: [1], a: [0, -0.9, 0, 0] });
    await sleep(400);
    await browser.pad({ b: [13] });
    await sleep(2400);
    const down = await ship(browser);
    const afterBomb = await bombs(browser);
    const keys = {};
    for (const [label, buttons] of [["X", [2]], ["Y", [3]], ["left", [14]], ["right", [15]]]) {
      await browser.pad({ b: buttons });
      await sleep(250);
      keys[label] = (await browser.kiosk()).held;
    }
    await browser.pad({ b: [] });
    report.delirium.pad = { up, down, stickAndA, fullBombs, afterBomb, keys };
    check("delirium: the stick flies the ship up and the d-pad flies it down", !!up && !!down && up.v < 200 && down.v > up.v + 60, { up, down });
    check("delirium: a direction and A together are both held", stickAndA.split(" ").includes("Numpad8") && stickAndA.split(" ").includes("Meta"), { stickAndA });
    check("delirium: B uses a bomb while the stick is held", fullBombs > 60 && afterBomb < fullBombs * 0.9 && afterBomb > 0, { fullBombs, afterBomb });
    check("delirium: X is Turn, Y is Thrust, the d-pad is left and right",
      keys.X === "Control" && keys.Y === "Space" && keys.left === "Numpad4" && keys.right === "Numpad6", keys);
    const gone = await leave(browser, who, holdBack(browser));
    check("delirium: holding Back leaves, and the child's save is still held", gone.left && gone.files.some((path) => path.endsWith("Preferences")), gone);
  });

  // =====================================================================================
  // Blobbo
  // =====================================================================================
  let blobboHeld = null, savedAt = null, startAt = null;
  const whoB = subject(3);
  const blobbo = (r, g, b) => r > 245 && g >= 205 && g <= 230 && b < 20;
  const where = async (target, file) => { const found = (await target.picture(file)).find(blobbo); return found && { h: Math.round(found.h), v: Math.round(found.v) }; };
  const CELL = 16;
  const stickPush = async (target, dx, dy, ms) => {
    const mid = await target.middle(".mobile-joystick"), to = await target.middle(".mobile-joystick", dx * 0.8, dy * 0.8);
    await target.touch("touchStart", [mid]); await target.touch("touchMove", [to]); await sleep(ms); await target.touch("touchEnd", []);
    await sleep(900);
  };
  const savedGame = async (target, who) => {
    const held = await target.held(who);
    const file = held && decodeSaveText(held.data).files.find((entry) => entry.file_type === 0x426c626f);
    return file ? { path: file.path, bytes: file.data.toString("hex") } : null;
  };
  if (only.includes("blobbo")) await part("blobbo", async () => {
    report.blobbo = {};
    report.blobbo.launch = await launch(browser, "blobbo", whoB);
    startAt = await where(browser, "blobbo-3-board.png");
    check("blobbo: with no input the game goes past its opening card to the board", report.blobbo.launch.outcome === "launch:done" && !!startAt, { ...report.blobbo.launch, startAt });
    await commonChecks(browser, "blobbo");

    // The Mac menu bar takes no touch: the drag that used to choose File, Quit does nothing now.
    // (The File title and the plain ground under it, where the menu would drop; the board has a fire that flickers.)
    const menuArea = { x: 30, y: 0, w: 32, h: 70 };
    const beforeMenu = (await browser.picture(null, menuArea)).hash;
    const file = await browser.middle("canvas.game-canvas", -1 + 2 * 51.5 / 640, -1 + 2 * 10.5 / 480);
    await browser.touch("touchStart", [file]);
    await sleep(700);
    const duringMenu = (await browser.picture("blobbo-4-menu-bar-held.png", menuArea)).hash;
    await browser.touch("touchEnd", []);
    await browser.drag([51, 10], [60, 227]);
    await sleep(2500);
    const afterDrag = await browser.kiosk();
    check("blobbo: a finger on the menu bar opens no menu, and the File, Quit drag does nothing",
      beforeMenu === duringMenu && afterDrag.screens.includes("board") && (await browser.events()).every((event) => event.type !== "exit"), { beforeMenu, duringMenu, screens: afterDrag.screens });

    // Tap = move the pointer there and click: Blobbo steps toward a tap beside him.
    await browser.tap([startAt.h, startAt.v + 40]);
    await sleep(1200);
    const afterTap = await where(browser, "blobbo-5-after-tap-below.png");
    check("blobbo: a tap below Blobbo moves him down", !!afterTap && afterTap.v > startAt.v + 8 && Math.abs(afterTap.h - startAt.h) < 6, { startAt, afterTap });
    // The stick: one push is one step; held, it repeats.
    await stickPush(browser, 0, 1, 250);
    const afterPush = await where(browser);
    await stickPush(browser, 0, 1, 1300);
    const afterHold = await where(browser, "blobbo-6-after-stick.png");
    check("blobbo: one push of the stick is one step; holding it repeats",
      !!afterPush && Math.abs(afterPush.v - afterTap.v - CELL) <= 2 && afterHold.v - afterPush.v >= 2 * CELL - 2, { afterTap, afterPush, afterHold });

    // Save is one press: the script finishes the game's dialog.
    const saved = await browser.scriptRun("save", () => browser.press(scriptButton("save")));
    const firstSave = await waitFor("the saved game", () => savedGame(browser, whoB), 20_000).catch(() => null);
    savedAt = afterHold;
    check("blobbo: Save is one press, ends on the board, and the saved game is in the child's save",
      saved === "done" && !!firstSave && (await shows(browser, "board")), { saved, path: firstSave?.path });

    // Wait a turn: Blobbo stays where he is and the game's move count goes on (seen in the next save).
    for (let turn = 0; turn < 3; turn++) { await browser.press(heldButton("Wait"), 200); await sleep(500); }
    const waitKey = await (async () => { const at = await browser.middle(heldButton("Wait")); await browser.touch("touchStart", [at]); await sleep(200); const k = (await browser.kiosk()).held; await browser.touch("touchEnd", []); return k; })();
    const dropKey = await (async () => { const at = await browser.middle(heldButton("Drop")); await browser.touch("touchStart", [at]); await sleep(200); const k = (await browser.kiosk()).held; await browser.touch("touchEnd", []); return k; })();
    await sleep(600);
    const afterWait = await where(browser);
    // Save again: one press, no dialog this time, and what is held is the new state.
    const savedAgain = await browser.scriptRun("save", () => browser.press(scriptButton("save")));
    const secondSave = await waitFor("the second save", async () => { const now = await savedGame(browser, whoB); return now && now.bytes !== firstSave.bytes ? now : null; }, 15_000).catch(() => null);
    report.blobbo.keys = { waitKey, dropKey, saveChangedByWaiting: !!secondSave };
    check("blobbo: Wait and Drop press their keys, and Blobbo stays put", waitKey === "Space" && dropKey === "s" && afterWait.v === afterHold.v && afterWait.h === afterHold.h, report.blobbo.keys);
    check("blobbo: Save again is one press, and the saved game changes (the turns waited are in it)", savedAgain === "done" && !!secondSave, { savedAgain });

    // Move on, then Load: one press back to where he was saved.
    await stickPush(browser, 0, -1, 250);
    await stickPush(browser, 0, -1, 250);
    const moved = await where(browser, "blobbo-7-moved-on.png");
    const loaded = await browser.scriptRun("load", () => browser.press(scriptButton("load")));
    const afterLoad = await where(browser, "blobbo-8-loaded.png");
    check("blobbo: Load is one press and brings Blobbo back to where he was saved",
      loaded === "done" && !!moved && moved.v < savedAt.v - 8 && !!afterLoad && Math.abs(afterLoad.v - savedAt.v) < 4 && Math.abs(afterLoad.h - savedAt.h) < 4, { loaded, savedAt, moved, afterLoad });

    // Start again puts the level back.
    await browser.press(keysButton("Meta+a"));
    await sleep(2500);
    const restarted = await where(browser, "blobbo-9-start-again.png");
    check("blobbo: Start again puts Blobbo back at the start of the level", !!restarted && Math.abs(restarted.v - startAt.v) < 4 && Math.abs(restarted.h - startAt.h) < 4, { startAt, restarted });

    const gone = await leave(browser, whoB, () => browser.press("[data-kiosk-exit]"));
    blobboHeld = await browser.held(whoB);
    check("blobbo: Exit asks OtterTube to leave, with the saved game held", gone.left && gone.files.some((path) => path.endsWith("/Untitled")), gone);
  });

  if (only.includes("blobbo")) await part("blobbo by controller", async () => {
    const who = subject(6);
    await launch(browser, "blobbo", who);
    await browser.touchOff();
    await browser.pad({ b: [] });
    await waitFor("the controller to be seen", async () => (await browser.kiosk()).pad === "on", 5000, 100);
    const at0 = await where(browser);
    await browser.padPress([13], 200);
    await sleep(900);
    const at1 = await where(browser);
    await browser.pad({ b: [], a: [0, 0.9, 0, 0] });
    await sleep(1300);
    await browser.pad({ b: [] });
    await sleep(900);
    const at2 = await where(browser);
    check("blobbo: one press of the d-pad is one step; the stick held repeats",
      !!at0 && !!at1 && Math.abs(at1.v - at0.v - CELL) <= 2 && at2.v - at1.v >= 2 * CELL - 2, { at0, at1, at2 });
    const keys = {};
    for (const [label, buttons] of [["A", [0]], ["B", [1]]]) { await browser.pad({ b: buttons }); await sleep(250); keys[label] = (await browser.kiosk()).held; }
    await browser.pad({ b: [] });
    check("blobbo: A is Wait and B is Drop", keys.A === "Space" && keys.B === "s", keys);
    const saved = await browser.scriptRun("save", () => browser.padPress([4]));
    const file = await waitFor("the saved game", () => savedGame(browser, who), 20_000).catch(() => null);
    await browser.padPress([12], 200);
    await sleep(900);
    await browser.padPress([12], 200);
    await sleep(900);
    const moved = await where(browser);
    const loaded = await browser.scriptRun("load", () => browser.padPress([5]));
    const back = await where(browser);
    check("blobbo: the left shoulder button saves and the right one loads", saved === "done" && !!file && loaded === "done" && moved.v < at2.v - 8 && Math.abs(back.v - at2.v) < 4, { saved, loaded, at2, moved, back });
    const again = await browser.scriptRun("restart", () => browser.padPress([3]));
    await sleep(2500);
    const start = await where(browser);
    check("blobbo: Y begins the level again", again === "done" && Math.abs(start.v - at0.v) < 4 && Math.abs(start.h - at0.h) < 4, { again, at0, start });
    const gone = await leave(browser, who, holdBack(browser));
    check("blobbo: holding Back leaves, with the saved game held", gone.left && gone.files.some((path) => path.endsWith("/Untitled")), gone);
  });
  await browser.close();
  browser = null;

  // =====================================================================================
  // A fresh browser profile given Blobbo's save: Load is one press there too
  // =====================================================================================
  if (only.includes("blobbo")) {
    browser = await stage.openBrowser("controls-fresh");
    await browser.touchOn();
    await part("blobbo restore", async () => {
      if (!blobboHeld || !savedAt) throw new Error("no Blobbo save to restore (the earlier part failed)");
      await launch(browser, "blobbo", whoB, { prepare: () => browser.host(`fakeHost.importSave(${JSON.stringify(whoB)}, ${JSON.stringify(blobboHeld.data)})`) });
      const fresh = await where(browser, "blobbo-fresh-board.png");
      const loaded = await browser.scriptRun("load", () => browser.press(scriptButton("load")));
      const afterLoad = await where(browser, "blobbo-fresh-loaded.png");
      check("blobbo: a fresh profile given the save loads the saved game with one press",
        loaded === "done" && !!fresh && Math.abs(fresh.v - startAt.v) < 4 && !!afterLoad && Math.abs(afterLoad.v - savedAt.v) < 4 && Math.abs(afterLoad.h - savedAt.h) < 4, { loaded, startAt, savedAt, fresh, afterLoad });
      // Another visit, the saved game already on the disk and nothing loaded: the game asks for
      // the name again, and Save is still one press.
      await launch(browser, "blobbo", whoB);
      const heldBefore = (await browser.held(whoB)).data;
      await stickPush(browser, 0, 1, 250);
      const savedLater = await browser.scriptRun("save", () => browser.press(scriptButton("save")));
      const rewritten = await waitFor("the saved game written again", async () => (await browser.held(whoB)).data !== heldBefore, 15_000).then(() => true, () => false);
      check("blobbo: on a later visit Save is still one press, and writes over the saved game", savedLater === "done" && rewritten && (await shows(browser, "board")), { savedLater, rewritten });
    });
  }
} catch (error) {
  check("the run completed", false, String(error?.stack ?? error));
} finally {
  await browser?.close().catch(() => {});
}
const code = stage.finish(report);
console.log(JSON.stringify({ passed: report.passed, failed: report.failed, clockwerx: report.clockwerx, delirium: report.delirium, blobbo: report.blobbo, report: join(stage.outDir, "report.json") }, null, 2));
process.exit(code);
