// Compare retained browser input routes across two local pilot runtimes.
// This is a regression check, not an original-game or full-hook proof.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [baselineDir, candidateDir, output, expectedManifest] = process.argv.slice(2);
if (!baselineDir || !candidateDir || !output || !/^[a-f0-9]{64}$/.test(expectedManifest ?? '')) {
  throw Error('Usage: node sweep-retained.mjs BASELINE_PILOT CANDIDATE_RUNTIME NEW_RESULT_JSON BASELINE_MANIFEST_SHA256');
}
assert.ok(!fs.existsSync(output), 'Result path already exists');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const file = p => fs.readFileSync(p);
const read = p => JSON.parse(file(p));
const same = (a, b, label) => assert.equal(JSON.stringify(a), JSON.stringify(b), label);
const manifestBytes = file(path.join(baselineDir, 'assets', 'manifest.json'));
assert.equal(sha(manifestBytes), expectedManifest);
const manifest = JSON.parse(manifestBytes);
const marker = read(path.join(baselineDir, 'private-pilot.json'));
assert.equal(marker.assets_manifest_sha256, expectedManifest);
const freeze = dir => Object.fromEntries(fs.readdirSync(dir).filter(n => n.endsWith('.mjs') || n === 'index.html').sort().map(n => [n, sha(file(path.join(dir, n)))]));
const baselineFiles = freeze(baselineDir), candidateFiles = freeze(candidateDir);
same(Object.entries(marker.source_files).sort(), Object.entries(baselineFiles).sort(), 'Baseline runtime marker');

const inventory = new Map(manifest.files.map(r => [r.name, r.sha256]));
const assetCache = new Map();
function profile(name) {
  if (name === undefined) return undefined;
  if (!assetCache.has(name)) {
    assert.match(name, /^[A-Za-z0-9_.-]+$/);
    assert.ok(inventory.has(name), 'Profile absent from baseline inventory');
    const bytes = file(path.join(baselineDir, 'assets', name));
    assert.equal(sha(bytes), inventory.get(name), name);
    assetCache.set(name, JSON.parse(bytes));
  }
  return structuredClone(assetCache.get(name));
}

async function load(dir) {
  const imp = n => import(pathToFileURL(path.resolve(dir, n + '.mjs')).href);
  const [{buildDecodedBoard}, {SourceRound, sourceFrame}, {MovementGame}, {buildBoard}, {createDeathEffect}, {createInputReplay}] =
    await Promise.all(['level', 'round', 'engine', 'board', 'death', 'replay'].map(imp));
  // Follow each runtime's browser mapping. Fail closed if it changes shape.
  const app = file(path.join(dir, 'app.mjs')).toString('utf8');
  const expr = app.match(/buildDecodedBoard\(reference\.data,\{([^\n]+)\}\);/)?.[1];
  const prefix = 'ordinal:reference.ordinal,title:reference.title,angularSpeed:TAU*960/(76*64),';
  assert.ok(expr?.startsWith(prefix), 'Browser board mapping changed');
  const flags = expr.slice(prefix.length).split(',').map(s => {
    const m = s.match(/^(allow\w+):reference\.(\w+Qualified)===true$/);
    assert.ok(m, 'Unrecognized browser board option: ' + s);
    return m.slice(1);
  });
  return {createInputReplay, start(scene, randomUnsigned) {
    const r = structuredClone(scene.levelDefinition);
    if (!r) return new MovementGame(buildBoard(structuredClone(manifest)));
    const options = {ordinal:r.ordinal, title:r.title, angularSpeed:Math.PI*2*960/(76*64)};
    for (const [key, flag] of flags) options[key] = r[flag] === true;
    const board = buildDecodedBoard(r.data, options);
    board.player.group = 700;
    const profiles = Object.fromEntries(['outlines','doorOutlines','elevatorOutlines','oilOutlines','dotOutlines','bombOutlines','gunOutlines'].map(k => [k, profile(r[k+'File'])]));
    return new SourceRound(board, {...profiles, bombRoutes:r.bombRoutes, oilBounds:r.oilBounds,
      deathFactory:(pivot, hand, clock) => createDeathEffect({pivot, frame:hand.canonicalFrame ? hand.frame : sourceFrame(hand.angle), randomUnsigned, clock, advanceClock:false})});
  }};
}

const result = {manifestSHA256:expectedManifest, baselineFiles, candidateFiles,
  scope:'Gold-hand retained input routes. Compare initial, every 128 updates, event updates, and terminal state. Movement has no retained route.',
  maxUpdatesPerScene:32000, maxPairedUpdates:1200000, maxWallMilliseconds:240000, rows:[], pairedUpdates:0};
const start = performance.now();
const [base, next] = await Promise.all([load(baselineDir), load(candidateDir)]);
try {
  for (const scene of manifest.scenes) {
    assert.ok(result.rows.length < 100, 'Scene bound exceeded');
    const row = {id:scene.id, ordinal:scene.ordinal, updates:0, checkpoints:0, sharedRandomDraws:0};
    result.rows.push(row);
    const tape = [];
    let used = 0;
    const a = base.start(scene, () => { const value = Math.floor(Math.random()*65536); tape.push(value); return value; });
    const b = next.start(scene, () => { assert.ok(used < tape.length, 'Extra candidate random draw'); return tape[used++]; });
    const sample = () => {
      same(a.snapshot(), b.snapshot(), 'Round snapshot');
      same(a.board.dots, b.board.dots, 'Live dots');
      row.checkpoints++;
    };
    const finishDraws = () => {
      assert.equal(used, tape.length, 'Missing candidate random draw');
      row.sharedRandomDraws += used;
      tape.length = used = 0;
    };
    finishDraws();
    sample();
    if (!scene.checkedRoute) { row.status = 'CONSTRUCTION_ONLY'; continue; }
    const ar = base.createInputReplay(scene.checkedRoute), br = next.createInputReplay(scene.checkedRoute);
    let seq;
    while (!ar.done && !a.complete && !a.death) {
      assert.ok(row.updates < result.maxUpdatesPerScene && result.pairedUpdates < result.maxPairedUpdates, 'Update bound exceeded');
      assert.ok(performance.now()-start < result.maxWallMilliseconds, 'Sweep exceeded four minutes');
      const ai = ar.next(), bi = br.next();
      same(ai, bi, 'Input');
      seq = a.eventSequence;
      a.update(1/120, ai); b.update(1/120, bi);
      row.updates++; result.pairedUpdates++;
      finishDraws();
      assert.equal(a.eventSequence, b.eventSequence, 'Event count');
      assert.equal(Boolean(a.complete), Boolean(b.complete), 'Goal state');
      assert.equal(Boolean(a.death), Boolean(b.death), 'Death state');
      if (row.updates % 128 === 0 || seq !== a.eventSequence || a.complete || a.death || ar.done) sample();
    }
    row.status = a.complete ? 'MATCHED_GOAL' : a.death ? 'MATCHED_DEATH' : 'MATCHED_INPUT_END';
  }
  result.status = 'CLOSED_MATCH';
} catch (error) {
  result.status = 'CLOSED_FAILURE';
  result.error = error.message;
  process.exitCode = 1;
} finally {
  result.elapsedSeconds = (performance.now() - start) / 1000;
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', {flag:'wx'});
  console.log(JSON.stringify({status:result.status, routes:result.rows.length, pairedUpdates:result.pairedUpdates, elapsedSeconds:result.elapsedSeconds, error:result.error?.slice(0,500)}));
}
