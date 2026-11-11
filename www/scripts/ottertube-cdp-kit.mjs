// Shared by the OtterTube add-on browser checks: the two loopback servers, a headless Chrome with a
// throwaway profile, touch input, and reading the game's picture. Probe code only; not shipped.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync, inflateSync } from "node:zlib";
import { connect } from "./runtime-cdp.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(scriptDir, "..", "..");
export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
export const sha = (text) => createHash("sha256").update(text).digest("hex").slice(0, 16);

export async function waitFor(what, probe, timeoutMs = 60_000, everyMs = 250) {
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

/** The files of a version 1 save text. */
export function decodeSaveText(text) {
  const [prefix, version, encoded] = text.split(":");
  if (prefix !== "systemless-save" || version !== "1") throw new Error("not a version 1 save text");
  const payload = JSON.parse(inflateRawSync(Buffer.from(encoded, "base64")).toString("utf8"));
  return { ...payload, files: payload.files.map((file) => ({ ...file, data: Buffer.from(file.data_fork, "base64"), resource: Buffer.from(file.resource_fork, "base64") })) };
}

/** A PNG as Chrome writes a screenshot (8-bit RGB or RGBA, not interlaced): { width, height, at(x, y) -> [r, g, b] }. */
export function decodePng(buffer) {
  let offset = 8, width = 0, height = 0, channels = 4;
  const parts = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("latin1", offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      if (body[8] !== 8 || ![2, 6].includes(body[9]) || body[12] !== 0) throw new Error("unsupported PNG");
      channels = body[9] === 6 ? 4 : 3;
    } else if (type === "IDAT") parts.push(body);
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const corner = y > 0 && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      let predicted = 0;
      if (filter === 1) predicted = left;
      else if (filter === 2) predicted = up;
      else if (filter === 3) predicted = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - corner, a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - corner);
        predicted = a <= b && a <= c ? left : b <= c ? up : corner;
      }
      pixels[y * stride + x] = (line[x] + predicted) & 255;
    }
  }
  return { width, height, at: (x, y) => { const i = y * stride + x * channels; return [pixels[i], pixels[i + 1], pixels[i + 2]]; } };
}

/** Where the pixels that pass `test` are: their count and their middle, or null when there are fewer than `least`. */
export function locate(image, test, least = 12) {
  let count = 0, sumX = 0, sumY = 0;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    if (test(...image.at(x, y))) { count += 1; sumX += x; sumY += y; }
  }
  return count < least ? null : { count, x: sumX / count, y: sumY / count };
}

/**
 * A standard game controller behind navigator.getGamepads, for a check to press: its state is read
 * from <html data-test-pad='{"b":[0,12],"a":[0,0,0,0]}'> (pressed button indexes, axes). No
 * attribute, no controller. "refused" is a frame its parent has not allowed the gamepad feature.
 */
export const PAD_STUB = `navigator.getGamepads = () => {
  const raw = document.documentElement.dataset.testPad;
  if (!raw) return [];
  let state; try { state = JSON.parse(raw); } catch { return []; }
  if (state === "refused") throw new DOMException("Access to the feature \\"gamepad\\" is disallowed by permissions policy.", "SecurityError");
  const pressed = (index) => (state.b || []).includes(index);
  return [{ id: "Test pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", timestamp: performance.now(),
    buttons: Array.from({ length: 17 }, (_, index) => ({ pressed: pressed(index), touched: pressed(index), value: pressed(index) ? 1 : 0 })),
    axes: state.a || [0, 0, 0, 0] }];
};`;

/**
 * Start the bundle server and the fake host, and return what a check needs.
 * env: OTTERTUBE_LINK_DIST, OTTERTUBE_LINK_OUT, CHROME_BIN, OTTERTUBE_LINK_GAME_PORT, OTTERTUBE_LINK_HOST_PORT, PYTHON.
 */
export async function startStage({ serverArgs = [] } = {}) {
  // A games file to use in place of the bundle's own (the page takes it on a loopback host).
  if (process.env.OTTERTUBE_LINK_DEV_GAMES) serverArgs = [...serverArgs, "--dev-games", process.env.OTTERTUBE_LINK_DEV_GAMES];
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
  const gameServer = spawn(process.env.PYTHON ?? "python",
    [join(repoRoot, "scripts", "serve_ottertube_link.py"), "--directory", dist, "--port", String(gamePort), ...serverArgs],
    { stdio: ["ignore", "ignore", "inherit"] });
  const hostPage = join(repoRoot, "www", "tests", "fixtures", "ottertube-fake-host.html");
  const hostServer = createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(readFileSync(hostPage));
  });
  await new Promise((done, fail) => hostServer.once("error", fail).listen(hostPort, "127.0.0.1", done));
  await waitFor("the bundle server", async () => (await (await fetch(`${gameOrigin}/_macgames/health`)).json()).app === "systemless-ottertube-link", 20_000);

  const checks = [];
  function check(name, pass, detail) {
    checks.push({ name, pass: !!pass, detail });
    process.stderr.write(`${pass ? "ok  " : "FAIL"} ${name}${detail === undefined ? "" : " :: " + JSON.stringify(detail)}\n`);
  }
  /** One part of the run. A part that throws fails by name and the run goes on. */
  async function part(name, body) {
    try { await body(); }
    catch (error) { check(`${name}: ran to its end`, false, String(error?.stack ?? error)); }
  }

  /** A headless Chrome with a fresh profile. `size` is the window, which the framed game fills. */
  async function openBrowser(label, size = [1920, 1080]) {
    const userDataDir = await mkdtemp(join(tmpdir(), `ottertube-link-${label}-`));
    const port = 9600 + Math.floor(Math.random() * 300);
    const chrome = spawn(chromePath, [
      "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`,
      "--autoplay-policy=no-user-gesture-required", "--no-first-run", "--no-default-browser-check",
      `--window-size=${size[0]},${size[1]}`, "about:blank",
    ], { stdio: "ignore" });
    const target = await waitFor("Chrome", async () =>
      (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((item) => item.type === "page"), 30_000);
    const page = connect(target.webSocketDebuggerUrl);
    await page.ready;
    await page.send("Page.enable");
    await page.send("Page.addScriptToEvaluateOnNewDocument", { source: PAD_STUB });
    let guest = [640, 480];

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
    // Rectangles in the window. The host is opened with fill=1, so the frame is the window.
    const rect = (selector) => game(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null;
      const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
    async function guestPoint([h, v]) {
      const box = await rect("canvas.game-canvas");
      return { x: box.x + (h + 0.5) * box.w / guest[0], y: box.y + (v + 0.5) * box.h / guest[1] };
    }
    async function middle(selector, dx = 0, dy = 0) {
      const box = await rect(selector);
      if (!box) throw new Error("nothing matches " + selector);
      return { x: box.x + box.w / 2 + dx * box.w / 2, y: box.y + box.h / 2 + dy * box.h / 2 };
    }
    // touchStart and touchMove name every finger that is down. touchEnd names the fingers that
    // lift (as Chrome takes it); with none named, every finger lifts.
    const touch = (type, points) => page.send("Input.dispatchTouchEvent",
      { type, touchPoints: points.map((point, index) => ({ x: point.x, y: point.y, id: point.id ?? index })) });
    /** One finger down and up on the picture, at a point in the game's own screen coordinates. */
    async function tap(point, holdMs = 120) {
      const at = await guestPoint(point);
      await touch("touchStart", [at]); await sleep(holdMs); await touch("touchEnd", []);
    }
    /** One finger down, moved and lifted on the picture (a Mac menu, a drag). */
    async function drag(from, to, endHoldMs = 300) {
      const a = await guestPoint(from), b = await guestPoint(to);
      await touch("touchStart", [a]); await sleep(400);
      for (let step = 1; step <= 8; step++) { await touch("touchMove", [{ x: a.x + (b.x - a.x) * step / 8, y: a.y + (b.y - a.y) * step / 8 }]); await sleep(70); }
      await sleep(endHoldMs); await touch("touchEnd", []);
    }
    /** One finger down and up on a control of the page. */
    async function press(selector, holdMs = 150) {
      const at = await middle(selector);
      await touch("touchStart", [at]); await sleep(holdMs); await touch("touchEnd", []);
    }
    /** A screenshot of the picture (or a part of it, in game coordinates), decoded. */
    async function picture(file, area) {
      const box = await rect("canvas.game-canvas");
      const scale = box.w / guest[0];
      const clip = area ? { x: box.x + area.x * scale, y: box.y + area.y * scale, width: area.w * scale, height: area.h * scale, scale: 1 }
        : { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 };
      const shot = await page.send("Page.captureScreenshot", { format: "png", clip });
      const bytes = Buffer.from(shot.data, "base64");
      if (file) writeFileSync(join(outDir, file), bytes);
      const image = decodePng(bytes);
      // Positions come back in game coordinates.
      return { ...image, hash: sha(shot.data), scale, find: (test, least) => {
        const found = locate(image, test, least);
        return found && { count: found.count, h: (area?.x ?? 0) + found.x / scale, v: (area?.y ?? 0) + found.y / scale };
      } };
    }
    async function screenshot(file) {
      const shot = await page.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(outDir, file), Buffer.from(shot.data, "base64"));
    }
    const events = () => host(`fakeHost.events.map((e) => ({ ...e, data: undefined }))`);
    const held = (subject) => host(`fakeHost.held(${JSON.stringify(subject)})`);
    const saveState = () => game(`(() => { const d = document.querySelector(".app--ottertube").dataset;
      return { counter: Number(d.saveCounter), stored: Number(d.saveStored), acknowledged: Number(d.saveAcknowledged), host: d.saveHost }; })()`);
    /** What the page says of itself: the screens it recognises, the script running, the last one's outcome, the keys held down. */
    const kiosk = () => game(`(() => { const d = document.querySelector(".app--ottertube")?.dataset ?? {};
      return { screens: (d.kioskScreen ?? "").split(" ").filter(Boolean), busy: d.kioskBusy ?? null, script: d.kioskScript ?? null, pad: d.kioskPad ?? null,
        held: document.querySelector(".mobile-controls")?.dataset.heldKeys ?? "",
        actions: [...document.querySelectorAll(".kiosk-button--action")].filter((e) => getComputedStyle(e).display !== "none").map((e) => e.textContent.trim()) }; })()`);
    /** Wait until the page recognises a screen (or, with `holds` false, no longer does). */
    const waitScreen = (name, timeoutMs = 30_000, holds = true) =>
      waitFor(`screen ${holds ? "" : "not "}${name}`, async () => (await kiosk()).screens.includes(name) === holds, timeoutMs, 100);
    /** Do something that runs a script, and wait for the script to end: its outcome, such as "done". */
    async function scriptRun(name, trigger, timeoutMs = 40_000) {
      await game(`document.querySelector(".app--ottertube").removeAttribute("data-kiosk-script")`);
      await trigger();
      const outcome = await waitFor(`script ${name}`, async () => { const k = await kiosk(); return k.busy === null && k.script && k.script.startsWith(name + ":") ? k.script : null; }, timeoutMs, 100);
      return outcome.slice(name.length + 1);
    }
    /** The controller's state: pressed button indexes and axes; null unplugs it. */
    const pad = (state) => game(state === null ? `delete document.documentElement.dataset.testPad`
      : `document.documentElement.dataset.testPad = ${JSON.stringify(JSON.stringify(state))}`);
    /** Press and let go of controller buttons. */
    async function padPress(buttons, holdMs = 200, axes) {
      await pad({ b: buttons, a: axes ?? [0, 0, 0, 0] });
      await sleep(holdMs);
      await pad({ b: [], a: [0, 0, 0, 0] });
      await sleep(120);
    }

    /** Open a game for a subject in the fake host, filling the window, and wait until it runs. */
    async function open(route, gameId, subject, { query = "", prepare, screen = [640, 480] } = {}) {
      guest = screen;
      const url = `${hostOrigin}/?fill=1&game=${encodeURIComponent(`${gameOrigin}${route}`)}&subject=${subject}${query}`;
      await page.send("Page.navigate", { url: prepare ? `${url}&autostart=0` : url });
      await waitFor("the host page", () => host(`typeof fakeHost === "object"`), 15_000);
      if (prepare) { await prepare(); await host(`fakeHost.open()`); }
      const init = await waitFor("init", async () => (await events()).find((event) => event.type === "init"), 20_000);
      await waitFor("the game to run", () => game(`document.querySelector("canvas.game-canvas")?.dataset.runtimeGameId === ${JSON.stringify(gameId)}`), 120_000);
      return init;
    }

    return {
      page, host, game, rect, middle, touch, tap, drag, press, picture, screenshot, events, held, saveState, open,
      kiosk, waitScreen, scriptRun, pad, padPress,
      /** Touch events from here on, as a touch screen sends them. */
      touchOn: () => page.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }),
      /** Back to a plain desktop with a mouse (which is what the media queries then report). */
      touchOff: () => page.send("Emulation.setTouchEmulationEnabled", { enabled: false }),
      viewport: (width, height) => width
        ? page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false })
        : page.send("Emulation.clearDeviceMetricsOverride"),
      async close() {
        try { page.close(); } catch { /* closing */ }
        chrome.kill();
        await sleep(500);
        await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
      },
    };
  }

  return {
    dist: resolve(dist), outDir, gameOrigin, hostOrigin, chromePath, checks, check, part, openBrowser,
    finish(report) {
      hostServer.close();
      gameServer.kill();
      report.checks = checks;
      report.passed = checks.filter((item) => item.pass).length;
      report.failed = checks.filter((item) => !item.pass).length;
      writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n");
      return report.failed === 0 ? 0 : 1;
    },
  };
}
