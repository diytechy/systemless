# Follow-on source review: catalog levels 6–8

Combo (225), More Spikes (226), and More Doors (227) all decode completely, but they are not interchangeable with earlier accepted scenes. More Spikes introduces an active enemy program. Combo combines Oil with walls and uses another puddle kind. More Doors requires the long-horizontal door variant and paired switches. This pass prepares requirements only; none of these scenes is gameplay- or visually accepted.

The queue supplied the ordinal/title/resource mapping. Coordinator-reviewed version12 resources were inspected directly. All three use the large display, 90 raw round-time units, ordinary/bonus/goal/initial-lowered first-word flags only, low-nibble dot activation mask15 everywhere, and no inline dot programs. No HY, BO, GO, WY, EX, EL, GN, or TR records occur. Source maps, positions, text, program strings, raw records and derived geometry are retained only under `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/follow-on-6-8/`.

| Scene | Present dots / bonuses / goals | Nonempty source sections | Child actor classes, source order |
|---|---|---|---|
| Combo, ordinal6/resource225 | 53 / 5 / 1 | SP4, WL14, PU1, WP6, WA4, TX2 | 0,0,1; one other WA excluded |
| More Spikes, ordinal7/resource226 | 62 / 11 / 1 | SP6, WP12, WA4, TX7 | 0,0,1,1 |
| More Doors, ordinal8/resource227 | 57 / 9 / 1 | WL9, DR3, DS6, WP7, WA2, TX4 | 0,0 |

Class0 is the human timer; the second serialized human remains hidden in single-player. Class1 uses multiplier1/normal divisor2, equal to class0 under the established Child clock; its slowdown divisor is4. Do not apply Doors223's class4 quarter-speed adjustment to these class1 enemies.

## Combo

Child creates one ordinary red/type1 enemy. It has no program and disables its version12 wall-check byte. The blue/type3 record is excluded by mask14; it must be filtered before instance creation. All four spikes and the one puddle are active. All six stored WP strings are unused. The red hand's group500 art and source collision profile already exist in the Oil candidate baseline, but Movement's demonstration alone does not qualify this hostile red-hand/hero interaction.

The puddle is kind0; Oil224's Child-active puddle is kind1. The Oil helper explicitly models this distinction: kind0 starts on frame4, wakes through range4–7, then uses the kind0 approach range and target/rider offsets. Its private atlas already includes the required descriptors. Do not replace it with the kind1 shape or target position. Kind0 wake/acquisition/approach and DP creation still need an original comparison.

Fourteen WL specs produce75 merged tiles through the existing source wall compiler. All required tile frames are present in the baseline, and14 is below the source18-spec limit. A combined scene is nevertheless new: human checks run spikes before puddles before walls; dormant oil contact triggers waking, not immediate death. Ordinary enemies do not wake puddles outside the source demo branch (`WACollide`, CODE6:d0ee–d102). The DP path follows dot outlines and pixels and does not consult walls. Oil pursuit must not be rewritten as wall-blocked graph adjacency simply because this level contains WL records.

There is one red color attribute and one difficulty-dependent blue attribute. The latter is white at Child colorMode0 and blue in the other three modes. All dot activation masks remain15: this is color selection, not conditional presence. Existing source color-nibble decoding handles it, provided the adapter passes the selected mode and preserves both words. No new mixed-color atlas entry is needed at Child. Keep the Oil traversal/dot-collision/death-reset/native-clock/native-visual gates; this source audit does not waive them.

## More Spikes: active program is a new implementation gate

Both ordinary enemies are active, one green and one blue, both class1 and both with wall checks disabled. Green has no program. Blue resolves a stored program and must not remain an unrestricted fixed-pivot rotator. Eleven other WP strings are unused. Its active instruction repertoire is bounce-only; exact reference, string and starting state stay in the private inventory.

The relevant source contract is bounded and implementable without a general language interpreter:

1. `WPFindPrograms` (CODE6:f10c–f178) resolves nonnegative references into the concatenated Pascal-string pool. Reject missing/out-of-range references instead of attaching programs by actor order. `WASpec2Info` (dc3a–dc40) initializes the program counter from spec word6, independently of word7's clock class; reset reapplies that saved counter.
2. `WAEnemyOneFrame` (d938–d98a) animates first, performs its collision stage, finishes any sliding transition, then calls `WADirectEnemy`. `WADirectEnemy` (cbac–cbd8) consumes a command only when the current source frame is cardinal (`frame&15` equals0) and the actor is not sliding. Run this on source actor steps, not on every interpolated render update.
3. `WAControlFromPC` (caba–cb80) reads the current Pascal-string byte, increments the counter, then wraps to byte1 after the length. Ordinary enemy processing passes false for the no-wrap flag. Counter advancement occurs even if the subsequent action cannot find an eligible dot.
4. The generic opcode mapping is: `n` requests neither action flag; `s` requests transfer only; `b` requests bounce only; `f` requests both. `WAAction` (c65e–c79c) queries `DOCanGrab` before acting. Only a successful query with exactly one action flag reverses direction; the transfer flag additionally invokes `WAGrabDot`. Therefore a bounce instruction **conditionally reverses at the current pivot** when the nonhuman grab query succeeds. It does not transfer, reverse unconditionally each quarter-turn, or wait indefinitely for success.
5. Preserve `WAReverse` state effects and reset the program counter on round reset. For this resource's bounce-only program, no program-driven transfer or slide is needed, but the exact target-query semantics remain essential: use the source cardinal offset and `DOCanGrab(false,...)`, including its first-match/nonhuman-availability behavior. Do not substitute the hero's color grab mask or a general hand collision test.

The existing level adapter rejects nonnegative actor program references, and the current round has no program counter/action stage. Retain that rejection until the bounded program path is implemented and checked. The minimal tests should distinguish successful/failed target queries, PC advance and wrap on both outcomes, no transfer for bounce, no command off cardinal frames or while sliding, and post-animation versus pre-animation timing. Native evidence must then establish the blue enemy's actual reversal sequence and reset phase. No program helper or root runtime file was edited in this pass.

All six spikes are active, including source subcell selectors that differ from the first Spikes scene; the existing offset lattice covers them, but clearance and rendered placements need scene-specific inspection. The two colored dots use ordinary green/blue attributes already present in Movement. No protected, moving, hyper or programmed dot is introduced.

## More Doors

This scene has no ordinary enemies, spikes or puddles. All seven WP strings are unused. Nine WL specs compile to23 tiles. The three doors are initially closed long horizontal/type3, one of each color, and all six switches use the already supported subcell variant. Each color has two switches. DR and DS do not have activation masks.

The source-derived door helper covers type3 and the baseline contains its88-frame leaf atlas, matching lethal outlines, and cap/switch art. The earlier Doors223 native evidence covered long vertical and short horizontal doors, so it does not qualify long-horizontal placement or lethal gaps. Type3's range is33–43 for the first leaf and77–87 for the second. The derived geometry uses the attached second-cap variants for all three doors; exact attachment positions remain private. Native/visual acceptance must check both caps, the two leaf pairs, invisible lethal group3800, and wall joins across open/closed/transit phases.

Two switches of the same color are independent contacts controlling the same door. Preserve per-actor switch-index entry edges: direct movement from one same-color switch to the other toggles again; staying on one does not; releasing only changes pressed art. Source `DSActivate` activates the new color before releasing old occupancy. Repeated same-color entries can reverse an in-flight door, so a solution trace must include phase/direction rather than a single open boolean. The current helper encodes this, but this resource's paired-switch interaction and long-horizontal traversal need qualification.

## Asset coverage, generation and limits

Read-only inspection of the prepared Oil manifest found all required hand groups, wall frames, ordinary/bonus color variants, four spike phases, all52 PU descriptors, all107 DP descriptors,88 door-leaf descriptors,12 caps and6 switches. This is inventory coverage, not native visual acceptance or verification of every atlas frame. No new art was generated and no baseline byte was changed. TX uses existing Geneva9/12 styles; exact text/placements remain private and require rendered comparison.

Generation requirements are level-specific: Combo needs phase-aware spike/wall safety plus delayed oil acquisition, sparse-dot pursuit, cloning and a red enemy; More Spikes needs the enemy PC, cardinal conditional bounce and source ordering in its solver state; More Doors needs paired-switch contact history, live door direction/phase, cap attachment and lethal leaf outlines. Existing source capacities, activation filters, score/bonus restoration, death/reset barriers and clock continuity remain mandatory. An input-only solution and native/browser comparisons are still required for each scene; no solution or solvability claim is made here.

Small correction to the released Oil narrative: its two human actor types are0 and6, not both6. This audit leaves the released Oil files unchanged.

Checks performed: direct queue-to-resource mapping, complete decoded inventories, activation/program-reference audit, source routine tracing, read-only helper geometry calculation, and baseline descriptor/frame coverage inspection. No native/emulator/browser/build/benchmark, media/save change, runtime edit, activation or commit ran. Private input copies, derived geometry and focused source excerpts accompany this report. All report/private-file ownership and workloads are released to root.
