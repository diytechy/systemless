# ClockWerx diagnostic observer

This optional Node observer records the existing `SourceRound` API. It does not
replace any original collision call, reset the round, change inputs or seed RNG.
Keep decoded levels, profiles, literals and resulting game traces outside Git.

```js
import {createObserver} from './observer.mjs';
const observer = createObserver({directory: newOutputDirectory, mode: 'search'});
observer.attach(game, board, {dotBodyFrame, sourceFrame});
observer.sample(null);
for (const input of legalInputs) {
  observer.journal(ledger, 'beforeUpdate');
  observer.update(1/120, input);
  observer.sample(input);
  observer.journal(ledger, 'afterUpdate');
}
observer.terminal(game.complete ? 'goal' : game.death ? 'death' : 'finite-cap');
const {stats, digests} = observer.close();
```

The caller owns fresh construction, reset guards, exact attempted/completed/RNG
counters, source/input hashes, input legality, explicit update/constructor limits
and an external process timeout. Record random draws through `observer.rng(row)`
at the original adapter. `.row(name, value)` adds planning or other evidence. The
observer never constructs an engine itself. Do not pass infinite iterables without
an independent bound.

`old` writes complete snapshots before and after each listed original callback,
plus complete per-update state. `witness` records the same serialized evidence in
lossless deltas. `search` records the complete per-update state, dot/mover/program/
mark/bonus states, player/NPC canonical frames and physical centers, and ordered
callback arguments, results and exceptions. Search omits intermediate callback
snapshots. Escalate to witness mode for a chosen route and fresh literal proof.

Compact streams store `['full', serializedRow]` checkpoints and
`['delta', prefixLength, suffixLength, replacement]` rows. Lengths count JavaScript
UTF-16 code units. `decodeDelta(previous, row)` reconstructs the exact legacy JSON
string. Each stream has a complete checkpoint every 128 rows by default; lineage
also checkpoints every 128 updates. Hashes cover the reconstructed JSONL bytes,
not compact encoded bytes. A receipt should separately hash saved files when
binding an external review. JSON-level losslessness preserves what the old
`JSON.stringify` represented; it does not recover undefined fields or functions.
The immutable initial board inventory is recorded once with a reconstructed
content digest.

Counters are an explicit format exception: ordinary JSONL in every mode. Journal
calls synchronously append exact counters. They fsync at constructor and terminal
phases and after each 128 completed updates; `terminal()` flushes and fsyncs every
stream. This retains process-crash counters without a per-update power-loss
durability claim. The caller must retain incomplete runs and use the last journal
row rather than a potentially stale summary. The observer retains the last 128
complete per-update rows on a non-goal terminal condition; all compact hook rows
remain in their stream. This window does not contain intermediate callback-state
snapshots.

Each stream buffers at most 1 MiB by default, excluding an individual oversized
row written directly. `peakBufferedBytes` is the largest single stream buffer;
`peakAggregateBufferedBytes` sums simultaneous stream buffers. The failure window,
previous serialized row per stream and transient snapshot/JSON strings require
additional memory, so these counters are not a process-memory limit. Inputs and
event inventories should be externally bounded.

Timers separately measure snapshots, serialization, delta encoding, output
(including checkpoint fsync), hashing and inclusive `game.update()` calls.
`simulationResidualMs` subtracts measured observer work inside updates from
inclusive update time. It still includes unmeasured wrapper overhead and is not
an isolated engine timing. Constructor/loading and post-run saved verification
are outside case timers unless the caller measures them separately.

Run `node --test scripts/clockwerx-diagnostics/observer.test.mjs` for codec and
filesystem regression checks. These checks use no private game fixture. The
2026-11-10 controlled private check exercised a 1,200-update prefix of an already
accepted literal on immutable source42: one transfer and nonlethal original
collision queries, no goal, death or RNG draw. It establishes equivalence only
for that exercised path, not arbitrary observer passivity, native/browser speed,
or Death58 qualification.
