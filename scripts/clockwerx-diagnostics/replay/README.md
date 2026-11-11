# Bounded literal replay

These tools try one reviewed candidate literal or replay a goal literal against a closed saved baseline.
They contain no level, route, expected score, private fixture, or asset. Keep all
real configurations, authorizations, literals, decoded data, profiles, traces,
and results outside Git. Native replay and visible gameplay acceptance are
separate from this functional comparison.

The five runtime tools are `run-replay.mjs` (preflight), `core.mjs` (comparison),
`stream.mjs` (bounded compact reader and literal validation),
`factory-source-round.mjs` (fixed engine adapter), and `supervise.py` (one owned
process). The adapter imports only the pinned source tree, constructs one fresh
round, and records the unseeded Math.random unsigned adapter. It supplies no
saved state, clock, pivot, or RNG seed. Original collision and query bodies stay
authoritative. A natural or explicit reset is stopped before its original body.

## Comparison contract

| Invocation | Required closed baseline | Required equality |
| --- | --- | --- |
| `candidate` | None | Exact-length goal without death or reset; records a search baseline for review |
| `witness` | Reviewed `search` goal | Complete per-update lineage, ordered consumed hook metadata, inventory, terminal, RNG lineage/count, and final state |
| `fresh-proof` | Separately reviewed completed `witness` | All witness comparisons plus the complete intermediate full hook-state digest |

Witness and fresh proof record full witness evidence with the sibling public observer.
Search omits intermediate hook states, so its reduced `hooks` digest cannot be
compared with a witness's full `hooks` digest. Planning-only rows do not enter
consumed engine metadata. Every initial and post-update sample is compared as
exact serialized JSON: step, literal input, complete state, dots, and physical
actors. Property order and omitted undefined values are preserved. Each consumed
hook's arguments and return/exception are compared synchronously; fresh proof's
intermediate hook-state equality is checked by digest at closure, rather than
detecting each such difference immediately.

`maxUpdates` must equal the entire literal length, between 1 and 16,000 updates.
Input runs contain positive integer `count` and `input` objects with only boolean
`swing`, `flip`, `bounce`, or `reverse` keys; explicit false releases are retained.
Every idle update remains in the literal. No prefix is added or removed. Each
invocation permits one construction, one constructor reset, zero explicit
resets, fixed `dt: 1/120`, and a 360-second external bound. Witness and fresh proof
are separate authorizations and processes. There is no automatic retry.

## Private inputs and invocation

The authorization uses schema `clockwerx-single-replay-authorization-v1`,
authority `Root`, purpose `clockwerx-generic-chosen-replay-v1`, a unique
`invocationID`, `executionApproved: true`, the mode/bounds above, and review gates
`closedGoalLiteralReviewed` and `baselineReviewed`. Fresh proof additionally
requires `completedWitnessReviewed`.
Candidate uses purpose `clockwerx-generic-candidate-replay-v1` and gate
`candidateLiteralReviewed`, with no `baseline` field required. A successful
candidate records `candidateGoal: true` and `accepted: false`; review its actual
result before using it as the witness baseline.

Supply `{path, sha256}` pins for each of the five tools in `code`, plus
`sourceFreeze`, `config`, `literal`, `observer`, and, for comparison modes,
`baseline.caseResult`.
`sourcePath` identifies the immutable source directory; the freeze contains a
nonempty `files` array of unique basename/sha256 records. The observer must have
SHA256 `595f3ac1461b0d2a048df3970366db115e394a5af2502a401941abe313c32403`.
`outputPath` must be new.

The private config pins `decoded`, `options`, each entry of `profiles`, and an
optional `bombRoutes` file. Supported profiles are `outlines`, `dotOutlines`,
`bombOutlines`, `doorOutlines`, `oilOutlines`, `elevatorOutlines`, and
`gunOutlines`. Include an
explicit `rngProvenance` string matching the baseline adapter.
Oil scenes also require an inline `oilBounds` rectangle with integer
`left`, `top`, `right`, and `bottom` edges, taken from their source profile.
The optional `bombRoutes` JSON must be the routes array itself: its parsed value
is passed directly as the constructor's `profiles.bombRoutes`, without unwrapping
an object such as `{ "routes": [...] }`.

The baseline case result requires `status: "GOAL"`, `goal: true`, `death: false`,
exact `updates`, per-case integer `RNGDraws`, `finalState`, and
`observer: {stats: {mode}, digests}`. Preserve source observations and per-case
counters when exporting this shape from a search result. Pin the closed compact
files in `baseline.streams.lineage` and `baseline.streams["hook-metadata"]`.
Required logical digests are `lineage`, `hook-metadata`, `inventory`, and
`terminal`; fresh proof also requires `hooks`. An absent `rng` digest must match
the baseline and zero draws.

From the repository root, with placeholders replaced by reviewed private paths:

```powershell
python scripts/clockwerx-diagnostics/replay/supervise.py "<private-authorization.json>" "<authorization-sha256>" "<node-executable>"
```

Use `prepare-replay.py` to generate the pins and bounds from a reviewed literal
instead of copying an earlier authorization. It writes the new authorization,
prints its SHA256 and does not run the engine. For witness and fresh proof,
also provide `--baseline <closed-run>` and `--original-review <review.json>`.
Review the current literal, source and applicable baseline before calling it.

```sh
python scripts/clockwerx-diagnostics/replay/prepare-replay.py candidate "<freeze-directory>" "<literal.json>" "<new-result-directory>" "<new-authorization.json>" --review "<completed review>"
```

After the actual candidate closes, `compile-native-rehearsal.py` maps its
checked holds to the original game's key actions and writes the input sidecar
and capture plan. Supply the number of entry actions to copy and the selected
model prefix at the end of those actions. The model uses two updates per
original frontend tick. The default 20 additional final hold ticks are
recorded separately. Use `--advance-promotion` only when a rank overlay is
expected. Check which level is visible and whether Settings actually advanced
before building the next earned fixture.

```sh
python scripts/clockwerx-diagnostics/replay/compile-native-rehearsal.py "<entry.json>" "<literal.json>" "<new-plan-directory>" --entry-actions 14 --prefix 686
```

`supervise-native.ps1` owns one original emulator process for either a cold
capture or a checked-route rehearsal. Its private authorization uses
`clockwerx-original-native-authorization-v1`, purpose
`clockwerx-bounded-original-capture-v1`, and mode `cold` or `rehearsal`.
It pins the executable, preserved image, earned fixture and fixture review,
scenario, entry source and capture plan, then verifies closure, exact capture
names, unchanged images and the frontend tick budget. Rehearsal also requires
a closed actual candidate and input sidecar. It does not view captures or
retry. `-ValidateOnly` checks the prepared pins and scenario without launching
a process. Keep the source-only original fitter frozen before pixel reads.

For focused contact evidence before a goal exists, explicit `diagnostic` mode
requires pinned `actualDiagnosticReview` and `inputSidecar` files, the
`closedActualDiagnosticReviewed` gate, and review status
`CLOSED_CONTACT_DIAGNOSTIC` with `accepted: false`. It retains the same capture,
fixture, source-fitter, ownership and timeout gates. This does not admit a
diagnostic as a completed goal or replace the rehearsal requirement.

`compare-native-actors.py` joins the independently saved original fits to a
closed candidate's source lineage at a declared fixed prefix. It retains
unclear observations and chooses the minimum mismatch among assignments within
each artwork group; it does not infer actor identity or native cadence.

```sh
python scripts/clockwerx-diagnostics/replay/compare-native-actors.py "<fits.json>" "<candidate/case>" "<new-comparison.json>" --prefix 696
```

`fit-original-actors.py` prepares the original-only actor method from the
decoded source and owned artwork bank. It derives counts, groups and possible
anchors from source actors, static dots, closed mover programs and connectors;
it imports no port or route. It writes the method and input hashes before
reading dedicated captures, retaining every score array and unclear detection.
Types0–4 are supported; other artwork mappings require separate qualification.
Use `--prior-scene-viewed` when a previous run already showed the board, and
`--prior-captures-viewed` when validating against previously viewed captures.
The Chatter equivalence check matched every saved score array, anchor group
and observation from the preceding dedicated fitter.

```sh
python scripts/clockwerx-diagnostics/replay/fit-original-actors.py "<decoded.json>" "<closed-native-directory>" "<owned-source-bank>" "<new-fit-directory>" --prior-scene-viewed
```

The supervisor pins the tools, creates the output, records its hidden owned
child, and terminates only that child on timeout. The runner validates remaining
pins before importing the engine. Baseline streams use 64 KiB reads and a 16 MiB
row bound; encoded file and logical digests are checked at EOF. Closed immutable
inputs are required. Truncation, malformed/excessive rows, leftover rows,
exceptions, reset attempts, death, or mismatch retain failure evidence.

Counters append synchronously around each update and RNG draw, with fsync at
construction, terminal, and 128-update reservations/checkpoints. On interruption,
read `closure.json` and the last complete journal row for lower bounds and the
reserved update upper bound; RNG tails can remain unqualified. This is process
crash accounting, not a power-loss guarantee. Success requires a closed accepted
case and an exit-zero, non-timeout closure; review the retained comparisons and
pins before using the evidence.

## Portable fake check

`test-fake.mjs` uses invented engine/data objects. It checks candidate goal/death, witness projection,
fresh full-hook equality, JSON undefined omission, planning-row exclusion,
first-death mismatch retention, literal guards, and journal bounds. It imports
no real engine or private fixture. Run only when this workload is authorized:

```powershell
node scripts/clockwerx-diagnostics/replay/test-fake.mjs "<new-temporary-output-directory>" scripts/clockwerx-diagnostics/observer.mjs
```

The check uses six fake constructors and eighteen fake
updates. Copying these tools into the repository does not add a new game run,
performance result, or native/visible acceptance claim.

## Retained route regression sweep

Run this after changes to shared mechanics and before installing a new pilot.
Use the current accepted local bundle as the baseline and a frozen candidate
runtime. Both runs use the same accepted scene definitions and route inputs.

```powershell
node scripts/clockwerx-diagnostics/replay/sweep-retained.mjs "<baseline-pilot>" "<candidate-runtime>" "<new-private-result.json>" "<baseline-manifest-sha256>"
```

The sweep pairs goal/death flags, event counts and draw counts at every update.
It compares complete snapshots and live dots at initialization, event updates,
every 128 updates and at the end. If a route uses randomness, both sides
consume the same draws for this regression check. A scene without a retained
route gets a construction check. Inspect the per-scene outcomes: matching an
early death or an input end is not the same as reaching the goal. This check
does not replace a new scene's full proof, original replay, or visible check.

## Stage a browser QA copy

`stage-retained-scene.py` appends one sequential scene to a new private QA
directory using the current installed pilot and a frozen runtime. Its private
JSON recipe names `baseline`, `baselineManifestSHA256`, `output`, `runtime`,
pins `freeze`, `config`, and `literal`, and supplies a `scene` with `id`,
`ordinal`, `title`, and optional `backdrop` and `playfield`. Add new
payloads with `addAssets` (each row is a pin with `name`); use
`profileNames` to map renamed profiles to bundle filenames. The helper
preserves the installed scene definitions and never replaces live assets.

Optional `vectorAssets` entries may add new artwork definitions whose `file`
names are verified `addAssets` entries. Existing artwork definitions cannot be
replaced by this append helper.

## Saved original actor comparison

`rank-native-cold-phase.py FITS_JSON ACTUAL_IDLE_DIRECTORY NEW_REPORT_JSON`
ranks one fixed idle prefix for every original capture (default frontend
origin1264, prefixes0..1600). It reads saved fits and a completed contiguous
idle lineage; it imports no engine and performs no updates. It preserves
position/pose errors explicitly. A best ranking with errors is not an exact
timing match. Use `--frontend-origin` and `--max-prefix` for other reviewed
bounds. The directory must contain `result.json` and plain `lineage.jsonl`.

Both it and `compare-native-actors.py` use `actor_assignment.py`: rectangular
integer Hungarian assignment minimizes position errors, then pose errors,
then the lexicographically first actor-index permutation. This preserves the
earlier exhaustive matcher, including ties, without factorial growth on
crowded boards. At most31 actors are admitted per artwork group. Neither
tool infers actor identity or adjusts an individual capture's clock.

Run the invented matching checks with
`python scripts/clockwerx-diagnostics/replay/test_actor_assignment.py`.


## Original rehearsal transport

`compile-native-rehearsal.py` translates an already checked literal and earned
entry script. Its default cap remains6800 frontend ticks; an explicit
`--max-ticks` may raise the bound to10000. The native supervisor requires the
same pinned cap and keeps its600-second maximum wall bound,64-capture limit,
one process owner and no automatic retry. Input preparation launches no emulator.

The compiler preserves trailing idle input through `literal.updates`. Its final
native-only margin extends the last button only when that hold ends at the
literal end; otherwise the margin is idle and the sidecar distinguishes it.
Existing terminal-held routes retain identical prepared bytes. Run the invented
transport checks with `python scripts/clockwerx-diagnostics/replay/test_native_rehearsal.py`.

Use `--advance-promotion` for an already known results overlay needing an extra
Space acknowledgement, including a stage welcome. Its additional capture is
`after-promotion`. Keep the intermediate overlay and verify the actual next
board before applying exported preferences to the next earned fixture. A round
completion screen alone does not establish that the saved next level advanced.


## Optional faster lossless encoding

Replay preparation accepts `--observer fast-delta` to choose frozen observer
3995261b; the default remains legacy595f3ac1. Only the maximal-prefix/suffix
string encoder differs. Snapshot construction, serialization, hook metadata,
RNG, journals and output/hashing contracts remain. The runner rejects other
observer hashes. Keep both recorder artifacts frozen and run their outside-
encoder identity test when maintaining them.

[Qualification](../../../docs/iterations/2026-11-08-clockwerx-levels/trace-codec-validation.md)
checks all3.74GB of five saved streams and a full actual Descent replay with
identical logical/encoded digests. The observed whole-process saving is17.73%
in one diagnostic pair. This does not broaden gameplay or native acceptance.
Run codec checks with `node --test scripts/clockwerx-diagnostics/observer*.test.mjs`.
