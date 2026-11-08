# Combo bounded acceptance

Catalog6/resource225 is validated and locally activated. The six-scene pilot uses the same16source files and51asset payloads as accepted Oil; Combo adds private source map/text and checked input routes. All payload hashes match Oil. This qualifies bounded Child/single-player/No-limit gameplay, with the existing timing, audio, scoring, save, font and controller limits. No push, public hosting or upload ran.

Source inventory:53present dots,5bonuses,1goal,4spikes,14wall specs merged into75tiles, one kind0 puddle,6unused programs, hero/hidden second human and one ordinary red enemy. The blue actor is excluded by mask14. The red enemy has no program and ignores walls. Source dot color attributes remain separate from presence; a higher-difficulty blue attribute is neutral at Child. Original shape/flags and generic generation requirements are in the [follow-on source audit](follow-on-6-8-review.md).

## Reviewed checks

| Evidence | Result |
|---|---|
| Original initial/idle |1310frontend/1908guest ticks, zero exhausted budgets. Source inventory, silver wall layout, kind0 puddle and masked-out blue actor reviewed |
| Original goal |3682frontend/4280guest ticks, zero exhausted budgets.13/13intended mixed swing/flip pivots independently source-sprite matched; maximum channel error8.89. Completion shows0bonus+1,000Child=1,000 |
| Original kind0 wake |2504frontend/3102guest ticks, zero exhausted budgets;3/3approach pivots matched. Clean wake phases fit at0.407–0.428error; approach10/13 at0.462/0.430. Partial later phase and occupied-pivot DP are less certain because the human overlaps. Death is visible by2862 and full reset by3012 |
| Browser goal |13transfers,0bonuses,36.275simulation seconds,0resets. All six actual-map model routes still pass; the Combo goal replay passes166clock-onset samples with wider input holds |
| Browser kind0 wake/reset |Actual20second gameplay record starts at0.15seconds and ends after reason10 death/full reset: spawn restored, PU dormant, DP allocations0, reset count1. The corresponding widened wait trace passes166/166clock-onset cases |
| Visual review |[Astra audit](combo-visual-review.md) requests no material correction. Kind0 warm-body bounds match268,123–283,139. Native/browser meanRGB131.76/77.58/0 versus133.51/80.21/4.01. Wall joins/orientations and active inventory agree; smooth texture/font differences remain |

Kind0 Oil differs from level5's kind1 in initial frame, wake range, approach range and target/rider offsets. In the wait check it acquires the occupied human pivot, so synchronous DP creation causes death rather than requiring a chase. Source callback reason10 is established by source/model/browser state; the numeric reason is not readable from the original pixels. DP pursuit still ignores walls. Full source definitions and original collider data stay private.

## Solution search and generator implications

A static endpoint-clear BFS found a route that failed against the rotating red hand. A lower all-flip route also failed, as did one local action change. A bounded search over swing/flip choices found a successful13transfer route after64candidates. Six middle transfers use swing; that direction history avoids the enemy. The goal route leaves all five optional bonuses available. This is a modeled solution followed by an independently checked original run, not proof that a static dot graph is sufficient.

The first browser wait script used one120Hz-step input pulses. Restart preserved the shared clocks; a wall bounce shifted from2.408to2.433seconds, so later pulses missed and the player remained on the second dot. The valid timing record did **not** qualify the intended behavior. It is retained as `browser-wake-narrow-state.json`. Widening each input by±0.25seconds then passed166model onsets and the actual browser reset check. No physics setting was adjusted to make that test pass. A generator should certify action windows across clock phases and replay legal inputs, including intervening wall bounces and enemy movement.

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/combo/`. It retains successful/failed traces, action-search cases, native reports/screens/fits, browser goal/reset exports and the saved-image audit. The goal export records an already-completed idle scene; the reset export covers gameplay. Neither is a matched CPU/memory benchmark. Original references are the owned game in native Systemless, not an independent hardware oracle. The native fixture hash remains `03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4` and original/browser identities are preserved.

Activation/retained prior route: `combo/activation.json` and `combo/previous-live-pilot`. Shared library index/metadata/profiler/WASM hashes remain unchanged. Total uncompressed size is1,459,297bytes: source94,454, assets841,368, pretty manifest/map metadata523,475. No new runtime build was required. Exhaustive bonus collection, all clock-state combinations, original full audio/scoring/campaign saves, hardware input and other difficulties remain unqualified. More Spikes7 is next; its programmed blue enemy remains gated until integration.
