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
