# Some Dots native program review

Both ordinary enemies match all 33 native captures in position and source frame: **red 33/33, green 33/33, zero failed primary comparisons**. The independent fixed-start hero also matches 33/33 frames under one shared clock phase. This supports the source static enemy callback kernel for this idle scene; it is not acceptance of Some Dots, its browser implementation or absolute startup timing.

The existing native run closed with 2,030 frontend ticks, 2,628 guest ticks, zero budget-exhausted frames and zero scripted assertions. This analysis used initial-after-reveal plus idle-01 through idle-32, separated by 30 guest ticks, spanning 960 guest ticks. The decoded source hash matches queue resource 11330. No new native/emulator/browser/build/conversion workload was launched.

## Independent sprite fits

Each original descriptor pose was loaded from private source RGBA art, reflected when specified, transformed with gamma 0.7 and placed using the qualified per-axis descriptor anchors. The native board crop uses the established origin, with no translation search or new art fit. Hero group 700 was searched at its fixed source start across all 64 poses. Red group 500 and green group 4400 were each searched across every present decoded pivot and all 64 poses. Model state and timing did not restrict this search.

| Actor | Captures | RGB channel MAE | Minimum next-candidate gap | Ambiguity |
|---|---:|---:|---:|---|
| Hero 700 | 33 | 0.219–0.287 on 27 unobscured captures; 10.87–23.36 on six occluded captures | 37.82 | Unique tested pose |
| Red 500 | 33 | 0.566–0.638 | 33.05 | Unique tested position and pose |
| Green 4400 | 33 | 0.265–0.369 | 64.81 | Unique tested position and pose |

Hero idle-04, 09, 14, 19, 24 and 29 have higher errors because attention starbursts overlap the hand. Initial and idle-29 images were visually reviewed; idle-29 clearly shows this overlap. The fitting still strongly separates the selected pose from alternatives. Full raw rankings, positions and frames remain private. Low enemy errors establish visible source-shaped actors at the sampled times; hidden-state candidates were not included, so this is not continuous visibility proof.

## One hero-derived clock, source initial state

The source hero starts at frame 48. Its first observed pose is compatible with a minimum 26 class advances; it advances another 202 frames over the 960-guest-tick capture span. The known Child rate, 4/19 source frames per guest tick (normal classes 0 and 1 both divisor 2), fits all 33 hero observations with a **single** phase interval:

`26.5263157895 <= first-capture clock phase < 26.5789473684`

The midpoint was selected once, using only the hero. No per-sample time adjustment, enemy phase adjustment, state teleport or direction substitution was made. The line then supplies the integer shared class-1 advance counts for both enemies.

The pure comparison reads each actor's decoded pivot, initial half-index doubled/masked to 64 frames, direction, program and PC 1. It invokes the existing advanceStaticEnemyCallback in source inner-step order over the actual present static dots. The idle fixture performs no human transfers or ring releases, so the retained present dots remain available to both actor classes. There are no wall-checking enemies here. Source collision/grab hooks are no-ops for this bounded comparison; no orphan or hidden state occurs. SourceRound was not run, and the fitted reveal offset does not establish its startup contract.

The red trace includes five successful source transfers. The green trace includes four transfers, one permitted bounce, one failed bounce and one failed grab. The sampled trajectory matches support these intervening source decisions; exact decision ticks between captures were not observed. Program counters and directions at snapshots are model inferences, not directly visible native fields.

## Controls and failed comparisons

The primary PC-1 comparisons have no failures. Starting both source programs at PC 0 instead gives red **7/33** and green **4/33** matches. The companion JSON lists every failed checkpoint for these negative controls, and the private comparison stores every observed/predicted state.

Because a rotating hero alone cannot distinguish whole turns before the first capture, offsets of an additional 0 through 6 full hero turns were also tested. Red match counts were 33, 0, 0, 33, 0, 0, 33; green counts were 33, 3, 3, 1, 11, 1, 1. Only the minimum offset matches both actors across all captures. This is bounded phase-alias checking, not proof of global uniqueness or exact scene-start time.

The test conditions the existing kernel on independent native clock evidence; it does not qualify multi-delta outer callbacks, human ring interactions, checkpoint/death/restart, protection collisions, goal completion, input windows, sound or browser visual fidelity. The native run itself had no assertions; these post-run image/kernel comparisons are separate evidence.

## Evidence and release

Private some-dots/program-review contains fit-native.py, native-fits.json, compare-programs.mjs, program-comparison.json and provenance.json. It retains exact positions, source programs by reference, all failed controls and artifact hashes. Public reports contain no maps, full programs, disassembly or art. Only the new reports and private analysis files were written; no runtime/helper/assets/queue files were edited. UTF-8/LF reports and source-hash/inventory assertions were checked. Files and the read-only workload are released.
