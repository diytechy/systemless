# Catalog 81–100 source requirements review

All twenty raw resources match their queue SHA256 and decoded source hash. Every record is complete version 12, with an 11x8 display and 8x11 serialized indexing. This is source preparation only: no level acceptance, activation, runtime change, asset conversion or generated board is supplied. Maps, complete programs and disassembly remain private.

The new property is raw 0x20 slowdown. Scanning all 100 catalog entries confirms that Flail (81) is its first raw and Child-active occurrence in the whole queue. Other first-occurrence statements here are **within 81–100**: busters at 88 and active guns/triggers at 96 are already covered by the [61–80 source review](follow-on-61-80-review.md). No new serialized block family, actor type or actor opcode occurs. Active clock classes span 1–5; all active enemy PCs start at 1. Three ordinary enemies check walls, one each in Surrounded, Blowout and March. Raw 0x2000 transfer-death dots are absent.

## Inventory

Dots are present / Child bonus flags / Child goal flags. Enemy counts exclude human types 0 and 6. SP, PU, GO, WY, EL, HY, GN and TR counts are Child-mask filtered; BO, EX, WL, DR and DS have no equivalent mask. Zero active sections remain in JSON. Moving programs survive a dot-property mask miss. Each level has one Child goal.

| Ordinal | Menu title (resource) | Dots / bonus / goal | Enemies | Classes; opcodes | Objects | Special dots |
|---|---|---:|---:|---|---|---|
| 81 | Flail (192) | 78 / 16 / 1 | 5 | 1,5; bfns | SP 5 | slowdown 6 |
| 82 | Clutch (129) | 79 / 9 / 1 | 8 | 1; fns | WL 2, SP 7 | slowdown 39 |
| 83 | Swing Out (166) | 43 / 11 / 1 | 3 | 1,3; none | WY 1 | movingProgram 18 |
| 84 | Slow Motion (201) | 72 / 15 / 1 | 6 | 4; none | WL 6, SP 7 | slowdown 20 |
| 85 | Orbit (218) | 53 / 5 / 1 | 11 | 1,3; fns | SP 2 | movingProgram 6 |
| 86 | Passage (200) | 60 / 23 / 1 | 6 | 1,4; none | EX 4, WL 4, DR 2, DS 2, SP 4 | ring 1, protected 1, movingProgram 6 |
| 87 | Gearshift (6551) | 67 / 7 / 1 | 5 | 1,2,5; bns | WL 1, WY 1 | slowdown 16 |
| 88 | Surrounded (206) | 70 / 13 / 1 | 19 | 1,3; bfns | BO 11, EX 8, WL 14, SP 3, GO 9 | ring 7, slowdown 4 |
| 89 | Blowout (182) | 60 / 10 / 1 | 15 | 1,2; ns | BO 28, EX 8, WL 11, SP 2 | slowdown 2, movingProgram 2 |
| 90 | Fade-out (197) | 56 / 14 / 1 | 8 | 1; none | EX 12, SP 8 | ring 16 |
| 91 | Immunity (158) | 51 / 8 / 1 | 15 | 1; fns | BO 9, WL 3 | protected 4, movingProgram 4 |
| 92 | Dizziness (216) | 75 / 15 / 1 | 5 | 1; bfns | EX 7, WL 4, DR 1, DS 1, SP 2, HY 4 | ring 2, movingProgram 8 |
| 93 | Twin Peaks (187) | 54 / 15 / 1 | 11 | 1; ns | EX 26, SP 2 | movingProgram 1 |
| 94 | Fracas (130) | 71 / 3 / 1 | 8 | 1; n | DR 1, DS 1, SP 10, WY 1 | ring 10, protected 1 |
| 95 | Fallback (161) | 45 / 9 / 1 | 4 | 1,2; fns | WL 3, SP 4, WY 2, HY 4 | movingProgram 19 |
| 96 | Box (128) | 68 / 11 / 1 | 4 | 1; bfns | EX 12, GN 2, TR 2 | none |
| 97 | March (1004) | 86 / 17 / 1 | 8 | 1,3; bfns | BO 20, WL 6, SP 2, WY 1 | movingProgram 4 |
| 98 | Slaughter (5004) | 86 / 6 / 1 | 1 | 1; none | EX 32, WL 1, SP 10, GN 6, TR 5 | none |
| 99 | Crossfire (8890) | 65 / 0 / 1 | 8 | 1,3,4; bfns | WL 5, SP 2, PU 2, GN 1, TR 1 | ring 2 |
| 100 | Break In (194) | 52 / 13 / 1 | 3 | 1,3; none | BO 60, EX 1, WL 6, SP 8, GO 4, EL 1 | none |

## Level-specific requirements

- **81 Flail:** First raw and Child-active slowdown dots in the entire 100-level queue: six, plus five SP hazards and one class-5 rotating spike.
- **82 Clutch:** Thirty-nine slowdown dots, two walls, seven SP hazards and eight ordinary enemies.
- **83 Swing Out:** Eighteen moving dots and a checkpoint; three unprogrammed red hands in classes 1 and 3.
- **84 Slow Motion:** Twenty slowdown dots and six class-4 ordinary enemies; six walls, seven SP hazards; puddles inactive.
- **85 Orbit:** Six length-40 moving programs include a moving goal; eleven ordinary enemies and two SP hazards.
- **86 Passage:** All six moving dots have property-mask misses: movement survives while their slowdown property is disabled. Two initially open long blue horizontal doors, two switches, a ring, protection and four connectors.
- **87 Gearshift:** Sixteen slowdown dots, a checkpoint and classes 1, 2 and 5; five ordinary programmed enemies.
- **88 Surrounded:** Nineteen enemies include eight programmed busters and five programmed rotating spikes; one red ordinary actor checks walls. Four slowdown dots, seven rings, eleven bombs, eight connectors, fourteen walls and nine goodies.
- **89 Blowout:** Ten unprogrammed busters; one green ordinary actor checks walls. Two moving dots include one slowdown dot; two slowdown dots total, 28 bombs, eight connectors and eleven walls.
- **90 Fade-out:** Sixteen active rings, twelve connectors, eight ordinary enemies and eight SP hazards; puddles inactive.
- **91 Immunity:** Eight unprogrammed busters, four moving dots including one protected moving dot and a moving goal; four protected dots total, nine bombs and three walls.
- **92 Dizziness:** Eight moving dots include four length-4 programs without waits; two HY pairs, one closed long green vertical door/switch, seven connectors and two rings.
- **93 Twin Peaks:** Twenty-six horizontal connectors and one moving goal, eleven ordinary enemies and two SP hazards.
- **94 Fracas:** Five active references exceed the four stored programs and bind to null; valid resolved alphabet is n only. Ten rings, a protected checkpoint, one closed long red horizontal door/switch and ten SP hazards. Twenty-seven dot property-mask misses preserve pivots.
- **95 Fallback:** Nineteen moving dots, HY channels 20 and 21 paired, two checkpoints, four SP hazards and three walls; puddles inactive.
- **96 Box:** Two active color-2 guns and two color-2 triggers; twelve connectors and four programmed ordinary enemies.
- **97 March:** Four moving dots, twenty bombs, six walls, a checkpoint and two SP hazards; one red ordinary enemy checks walls.
- **98 Slaughter:** Six guns in three colors, five triggers, 32 connectors, ten SP hazards, one wall and one unprogrammed red enemy.
- **99 Crossfire:** The sole Child gun is color 1 but the sole Child trigger is color 0: preserve the no-matching-gun activation path. Two rings, oil kinds 0 and 2, five walls, two SP hazards and classes 1, 3 and 4; no bonus dots.
- **100 Break In:** Sixty bomb records and five LI starters reach their source capacities. Two initially lowered channel-0 dots and one EL control, eight SP hazards, six walls, one connector and four invalid goodie frame requests 188; puddles inactive.

The companion JSON retains all active/inactive actor masks, types, classes, PCs, initial frames, directions, program lengths/opcode sets, wall policy, dot masks/colors and object variants without map coordinates or full programs. Program references resolve before computing the active opcode set. A null program and a valid n-only program are different states.

## Slowdown is a human-arrival clock change

DOCreateAll (CODE6:3a7a–3a84) maps raw 0x20 to the slowdown property; DOSpec2Info (34fa–3506) maps it to runtime look bit 0x80. This must not be confused with raw 0x80, which means an inline moving-dot program. A property-mask miss clears slowdown while retaining movement. Passage (86) demonstrates this with all six moving dots; none is an active slowdown dot in Child.

DOGrabbed's human branch (4640–4684) sets slowdown occupied art to frame 198 plus source color offset, then always calls WASetSlowdown with the destination's slowdown bit. A successful arrival at an ordinary dot passes zero and restores normal mode. The nonhuman branch does not call this setter. This is a global arrival-selected state, not a per-enemy modifier, toggle, overlap detector or occupancy reference count. Failed grabs and bounce without transfer do not change it.

DOReleased (48b8–48f2) restores slowdown idle art to frame 189 plus color offset; it does **not** change the global clock state. The later destination arrival does that. EX connector entry and HY teleport must follow their existing hook paths: do not invent a per-frame destination occupancy update. In particular, HY does not recursively DOGrabbed at its destination.

WASetSlowdown (ec24–ec88) compares the requested state against its saved global state. If different, it requests sound 24 for entering slowdown or 25 for leaving, then writes each class 1–5 current divisor from the saved slow or normal table. It leaves class 0 untouched. It does not reset count, remainder, multiplier or already-latched delta.

| Class | Multiplier | Normal divisor | Slowdown divisor |
|---|---:|---:|---:|
| 0 | 1 | 2 | 2 (unchanged) |
| 1 | 1 | 2 | 4 |
| 2 | 3 | 8 | 16 |
| 3 | 1 | 4 | 8 |
| 4 | 1 | 8 | 16 |
| 5 | 1 | 1 | 2 |

WALatchTimer (e6fa–e790) subsequently adds common delta times each class multiplier to the retained remainder, subtracting the current divisor while possible. Restoring a smaller divisor can consume accumulated remainder sooner. Rephasing or zeroing clocks at the transition would change behavior. Changing a divisor does not recalculate a delta already latched for the current callbacks.

Every consumer of classes 1–5 follows these shared clocks. This includes moving dots on class 1 and thrown buster clones with inherited class. Class-0 hero and gun-bullet clocks remain unchanged; independent SP, static ring and misc clocks must not be slowed with a blanket simulation scale. These consumer effects follow the source pointer contracts; they are not newly measured native behavior. Blowout (89) has one moving slowdown dot, so a human arrival affects that dot's own later movement callbacks as well as enemies.

WAStart (c18e–c19c) forces normal mode for a new level. WAReset (dd46–ddb0) reinitializes actors, then calls DOInitialGrabbed for human slots in source order. That arrival path reapplies the spawn dot's state without rebuilding shared clocks. Both serialized human starts are non-slowdown in every level here. Checkpoint respawn versus explicit restart must retain the established saved-spec/initial-grab ordering; no new unconditional timer reset is authorized.

The visual requirement is group 300 and shadow 4100 frames 189–197 idle and 198–206 occupied, indexed by source color offset. No new art, outline extraction, anchor comparison or conversion was performed. Native transition timing, retained-remainder boundaries, sounds and reset behavior remain qualification gates.

## Program, actor and conditional variants

Fracas (94) stores four WP programs, while five active actors reference indices 7, 10, 12, 14 and 15. The source rebinding fallback (f11c–f162) clears the program pointer and sets PC 1 for a negative or out-of-range reference. The remaining valid active program alphabet is n only. This repeats the previously traced Mishmash fallback; it is not a new language feature. Preserve imported behavior, but reject invalid references in generated boards.

Surrounded contains nineteen enemies: eight programmed busters, five programmed rotating spikes and six ordinary hands. One rotating spike uses class 3. Blowout and Immunity contain ten and eight unprogrammed busters respectively. Keep actor type, clock class, program, direction and ordinary-only hooks independent. Ordinary wall-checking actors occur only at 88 (red), 89 (green) and 97 (red), all class 1; the nonhuman wall branch does not grant them human door checks.

Moving goals occur in Orbit, Immunity and Twin Peaks; Immunity also has a protected moving dot. Dizziness has four length-4 movement programs without p waits. Fallback uses nineteen moving dots plus paired HY channels 20 and 21. These are variants of earlier mechanics requiring their dynamic anchors, riders, original outlines and callback ordering; they cannot be accepted by static class-name reuse. All inline instructions here are from e/n/p/s/w; no new l/r fallback bytes occur in this batch.

Fracas has twenty-seven dot property-mask misses. These retain present pivots and colors; ten rings remain active in Child. Passage's six mask-missing moving dots must still move. The raw marker, mask and independently created WY checkpoint record must remain distinct.

## Gun/trigger color mismatch and retained projectile gates

Crossfire (99) has one Child-active color-1 gun and one Child-active color-0 trigger. Its other guns and triggers are mask-disabled. GNActivateByColor (6aac–6ade) compares the exact stored gun color, and TRActivate (a6fe–a7aa) invokes it before updating occupancy. A color-0 trigger arrival therefore activates no gun in this Child inventory, while trigger occupancy and pressed art still update. Preserve this source condition; do not recolor the trigger or enable a masked gun. New generated boards should validate intended color reachability explicitly.

Box has two matching color-2 gun/trigger pairs. Slaughter has six guns in three colors and five triggers; a direction mask 5 launches two directions in source bit order. The earlier GN18/TR18 and shared PR32 pool contracts remain required. Re-entering a trigger fires on each entrant even when already occupied; there is no hold-to-autofire behavior. Type-0 gun bullets remain on class 0. Type-1 thrown busters inherit their actor class and can therefore be slowed.

The [61–80 review](follow-on-61-80-review.md) remains authoritative for source-rounded buster launch vectors, projectile outlines and inclusive bounds, wall shattering versus door reflection, human bullet collision order, first-free slot allocation, immediate slot clear with deferred sprite deletion, and pool-exhaustion caller side effects. Original busters hide and return only after their strict type-5 resurrection deadline; ordinary actors do not acquire that behavior. All-angle SANE rounding, insertion order and simultaneous pool/collision cases remain unqualified. There is no new shoot key or other control binding in this batch.

## Capacity, RNG and generation gates

WACreate (e0ea–e12e) filters by mode before checking its **31 allocated actor record** limit, including humans. It can insert the second human specification when needed, so generated actor budgets must account for that slot. Surrounded creates 21 records including its two humans, below that limit.

Break In uses all **60 BO records** and all **five LI starter slots**. Static counts fitting the arrays do not prove dynamic spark/explosion/projectile demand is safe. Preserve source serialized fuse-chain order, allocation/drop behavior and distinct reusable versus lifetime capacities. The existing limits are EX61, HY22, EL12, GN18, TR18, GO15, misc43, PR32 reusable, sparks17, explosions6 and DP32 lifetime allocations. Child HY channels in this batch have exactly two endpoints each.

Surrounded requests three invalid goodie frames 169 alongside six valid frame-0 requests. Break In requests frame 188 for four goodies. The source setter ignores an out-of-range initial frame request; modulo reduction would alter behavior. These are imported source fallbacks, not valid new generator inputs.

No RNG call was found in the newly traced slowdown transition, color-match or program-fallback paths. Existing death, oil, goodies and bomb effects still need source RNG consumption order and replay state. This is not an exhaustive round-wide RNG proof. Crossfire's active oil kinds 0 and 2 retain their original behavior and allocation requirements.

A future generator must preserve mode filtering, dot-property independence, source identity/order, Pascal PC, per-class clocks and remainders, ordinary-only hooks, true sliding, moving-dot intermediate-position pickup, high-channel teleport phases, reset history, original collision outlines and dynamic pool ordering. It must check capacities, valid references/art selections, intended trigger colors, moving trajectories and solvability. No generator, generated map or route certificate is supplied here.

## Validation and release

Validation comprised twenty actual-binary/queue/decoded SHA256 matches, complete version/header checks, PC and reference inventory, Child filtering, HY pair counts, WA/BO/LI capacity assertions and focused private source traces. The whole 100-level queue was scanned to establish the slowdown first occurrence. No runtime tests were needed because no runtime code was changed.

Private follow-on-81-100 contains copied decoded records, survey/finalize scripts, source excerpts and provenance. Reports are UTF-8 with LF and no trailing whitespace. No emulator, browser, build, benchmark, conversion, runtime/asset/queue edit, original-media/save change or commit was performed. No level 81–100 is accepted by this survey. All files and the source-only workload are released.
