# More Doors: paired switches and horizontal gates

Level 8 is a bounded playable Child scene in the private SVG pilot. Its inventory is 57 present dots, 9 optional bonuses, 1 goal, 9 wall records compiled into 23 tiles, 3 long horizontal gates, 6 switches and 4 text records. Each gate has two switches of its color. Seven stored programs are unused; there are no active enemies, spikes or Oil. The alternate human slot remains hidden.

No runtime or asset changes were needed. All 18 accepted runtime files and 51 asset payloads remain byte-identical to More Spikes. Only the private scene definition and checked input route were added. This reuses the previously source-verified gate system and original collision outlines.

## Checked behavior

| Evidence | Result |
|---|---|
| Original initial scene | 1,550 frontend / 2,148 guest ticks, zero exhausted budgets. Seventeen captures fit three closed gates and six unpressed switches; gate error 0.696, switch error 0.674–0.711 |
| Original corrected goal | 5,151 frontend / 5,749 guest ticks, zero exhausted budgets. All 20 intended pivots source-sprite matched; maximum channel error 4.280 includes overlap cases. Completion visibly shows 6,000 bonus points plus 1,000 Child completion, total 7,000 |
| Gate art | Reviewed closed, intermediate and open frames from both native attempts. Valid blue phases 0/2/10, red 0/3/10 and green 0/3/7/10; invalid actor/effect/completion-panel regions excluded. Fixed caps remain when open |
| Browser | Goal at 66.783 simulation seconds, 20 transfers, 3 bonus pickups and zero resets; all three gates open, seven toggles, no switch occupants. A valid gameplay record spans 27.442–47.450 seconds; a separate export records the completed idle state |
| Model contracts | Six actual-record/original-outline tests cover long leaves, attached caps, lethal transit, paired entry vs occupancy and reset. The held route passes 266 clock-start samples; nine normalized-model native-window starts also pass |

The source awards successive bonuses in steps of 1,000 up to 5,000. The original's 6,000 points are consistent with the pilot's three pickups; they do not mean six pickups. The pilot still does not implement the full original score display/policy. Timing records here are functional evidence, not CPU, memory or physical input-latency benchmarks.

Closed type-3 leaves use the full-span primary descriptor and an empty secondary. Intermediate phases use two retracting leaves with separate diagonal lethal outlines. At the open endpoint both leaves are empty, while caps still collide. Switch contact toggles on entry; holding or releasing contact does not. A new entry at the same-color paired switch toggles again, including reversal during travel. Source collision priority remains all leaves before caps, second-leaf selection on dual overlap, and no bounce when its lethal zone is hit.

## Retained input failure

The first original run finished its script but did not reach the goal: only 12 of 20 intended pivots matched. Its only intended swing sent native key49/character32, copied from the HTML control rather than the established original-game swing mapping. Treating that window as a direct reverse reproduces all 20 observed original pivots and frames exactly. The corrected run changes only its key-down and key-up to Command55/character0; every timing and other action is identical. No physics, collision geometry or gate timing was changed. The original failed run and raw two-action diff are preserved.

Command55 and Control59 ordinary action masks are source-confirmed. The fixture's key49-only reversal signature is observed, while the static source reverse-mask path appears to require additional keys; that mismatch remains unresolved. It does not invalidate the corrected Command55 goal run or justify claiming a universal Space binding. See [input recovery](more-doors-native-input-recovery.md) and [source input audit](human-input-source-review.md).

## Generator implications and limits

A solver must retain each actor's previous switch index and switch occupancy, each door's direction/phase and persistent clock. Returning through a switch can close a gate again. The successful route uses one swing to avoid that re-entry; the all-flip attempt did not solve it. Reachability should include safe passage after opening and continued cap collision, rather than replacing a gate with a removed wall.

The bounded goal deliberately avoids lethal transit. Clean pressed-switch artwork, all six switches in native play, every gate phase, all bonus routes, exhaustive clock combinations, full sound/scoring/saves, other difficulties and hardware controls remain unqualified. The helper's lethal-outline point probes are not a native death route. Font and smooth shading differences remain. See the [visual review](more-doors-visual-review.md) for accepted and rejected fit regions and [route preparation](more-doors-route-prep.md) for model limits.

Private evidence: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/more-doors/`. Activation guard/backup: `activation.json`, `previous-live-pilot`. Eight scenes now use 18 source files and 51 payloads: 103,894 source bytes, 841,368 asset bytes and 643,922 pretty JSON bytes, total 1,589,184 uncompressed bytes. Shared index/library metadata/profiler/WASM and browser save identity are unchanged. Fixture SHA256 remains03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4. No upload, deployment or heavy build occurred. Some Dots is next; the full remaining-level request is unfinished.
