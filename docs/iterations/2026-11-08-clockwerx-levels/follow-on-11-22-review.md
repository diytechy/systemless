# Catalog11–22 source requirements

This is source inventory and implementation guidance, not acceptance or activation. Every record is structurally decoded version12; there are no legacy-version cases in this batch. No new object-block name appears beyond prepared mechanics1–10, but reused blocks introduce meaningful variants. Some Dots/Bombs helpers were preparation when this survey was written; consult the per-level acceptance reports for current runtime status. Exact maps, text/program bytes and geometry stay under `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/follow-on-11-22`.

Child means active mask1 and single-player. Present-dot counts below retain pivots even when their property mask misses Child. Each level has one raw and Child-active goal, two human specifications (type0 plus the normally hidden/stopped type6 slot), and no inline dot programs or TX records. Program counts count active enemy references, not unused stored strings. All initial PCs are1. Ordinary enemy types1/2/3 mean red/green/blue; type4 is a distinct rotating spike.

## Per-level Child inventory

Object counts are SP / WL records / DR / DS / GO / WY, after difficulty filtering where the source has a mask. WL/DR/DS do not have difficulty masks.

|Catalog/resource/title|Dots / bonuses|Child object counts|Child enemies / programmed|Child classes; opcodes|Required variants and gates|
|---|---:|---|---:|---|---|
|11 /154 /Curves|42 /7|0 /0 /0 /0 /0 /2|3 /0|1; none|Two active checkpoints, masks3/7. All three active enemies are unprogrammed red. Both stored programs belong to inactive enemies. Conditional colors and masks remain per-mode data.|
|12 /210 /Homer|25 /5|0 /0 /0 /0 /0 /0|2 /0|3; none|Small10×7 layout; two slow red hands. Two present plain dots have mask12 and must remain pivots in Child. All three stored programs are unused by Child.|
|13 /1000 /Touchdown|28 /6|0 /6 /2 /2 /0 /0|2 /2|1; n/s|Both serialized spikes are inactive(mask14). Red programmed transfers, two closed long vertical red/green doors and matching switches. Higher-mode green hands/colors are inactive in Child.|
|14 /1001 /Tenacity|88 /15|0 /9 /3 /4 /3 /1|2 /0|1; none|First Child ordinary enemies with wall checks enabled; green and blue. One combined protected checkpoint. Three short vertical doors, three goodies, repeated red-switch color. All five spikes and all four stored programs are inactive in Child.|
|15 /179 /Ramble|54 /19|0 /13 /0 /0 /0 /0|2 /2|1; b/f/n/s|Blue and counter-rotating red programmed hands. Red-blue composite dots(color index5) require their actual look, not a single-color fallback. Both signs of initial direction and f transfers matter.|
|16 /171 /Sparse|29 /8|0 /1 /0 /0 /0 /0|4 /3|1; b/f/n/s|Small10×7 layout, three programmed ordinary hands plus an unprogrammed green; one program uses only f. Single wall record still compiles through the source tile union.|
|17 /1003 /Pipeline|73 /15|0 /0 /0 /0 /0 /1|8 /4|1/3; b/n|Protected checkpoint; mixed class1/class3 clocks and four bounce programs. Preserve serialized actor order after filtering. Second-human half-index56 is valid and wraps through the64-frame rule.|
|18 /217 /Offshoots|65 /13|0 /0 /0 /0 /4 /2|8 /7|1; n/s|Two protected checkpoints, four goodies, seven active transfer programs; unprogrammed green begins at non-cardinal frame56(half28). Red-green and red-blue composite colors. Class2 exists only on an inactive actor here.|
|19 /193 /Link|76 /12|0 /12 /6 /4 /5 /1|5 /4|1/2/3/5; b/f/n/s|First Child class2(mult3/div8) and class5(1/div1). One programmed red checks walls. Two red doors start open; four green doors closed. One checkpoint, five goodies. Preserve odd program length27 and exact PC wrap.|
|20 /209 /Balance|59 /16|6 /3 /4 /1 /0 /1|3 /3|1; b/f/n/s|Six active spikes; four red doors (long vertical/horizontal) fan out from one switch. Checkpoint; counter-rotating green transfer program. Three distinct ordinary enemy colors.|
|21 /144 /Doubleback|69 /4|0 /0 /0 /0 /0 /0|2 /2|1; n/s|Four white disappearing rings plus two red transfer programs. Ring permissions/orphaning and reset require Some Dots integration, not merely ring artwork.|
|22 /5009 /Motion|87 /7|0 /8 /0 /0 /0 /0|6 /3|1; n/s|Two active WA type4 rotating spikes require new group3500 art/outlines and type-specific contact policy. One has an n-only program, the other no program; one starts at non-cardinal frame8. An ordinary green hand checks walls. No moving-dot flags occur despite the title.|

Stored versus Child-created actor counts are8/5,8/4,6/4,8/4,7/4,9/6,19/10,18/10,11/7,10/5,7/4,12/8 respectively in catalog order. Created counts include the two human slots. Companion JSON contains each active and inactive actor's type, class, PC, half-index, direction, opcode set, program length, wall byte and mode mask, without grid positions or program strings.

## Dot masks, colors and combinations

No new individual raw flag bit appears beyond the prepared ring0x8, waypoint marker0x10 and protection0x40. Raw0x4051 combines presence, initial-state0x4000, waypoint marker and protection. This combination occurs at14,17,18 and must not be rejected as an unknown isolated bit while silently assuming its behavior is already integrated. No raw0x20 slowdown,0x80 inline moving program,0x300 up/down or0x2000 appears. Initial0x4000 alone remains source state, not an extra gameplay subsystem.

`DOCreateAll`, CODE6:3984–3998, sets DOSpec presence+4 directly from rawbit0. On a low-nibble mode-mask miss,3ae2–3b06 clears protection, the separate0x2000 property, slowdown, ring, goal, bonus and up/down selector. **It does not clear presence.** `DOSpec2Info:349a–34a0` copies that presence into both human/nonhuman initial availability. In Homer the two Child-mask-missing records are plain dots, so they remain ordinary pivots. Do not filter dots using the actor-creation rule. Raw0x10 still does not create a waypoint: active WYCreate does so separately. A checkpoint whose WY mask misses a mode must lose checkpoint behavior while retaining its configured pivot.

Color nibbles are independently mode-selected by DOCreate before DOSpec2Info. Child red/green/blue presence comes from secondary bits0x10/0x100/0x1000; combine these into source color index0..7. Conditional higher-mode color bits do not make a Child dot colored. Raw attribute words must not be interpreted as one fixed RGB color across difficulties. Ramble introduces Child red-blue index5 beyond prepared1–10; Offshoots also needs index3 and5. Source dot looks are group300 base ranges plus color index, with separate shadow descriptors. Require the corresponding source-informed appearance rather than collapsing index5 into red or blue. Actual per-level color counts are in JSON.

For combined protected checkpoints, source behavior composes: WYCreate sets look0x100; DOGetLook gives checkpoint frames79–89 priority; DOSpec protection separately creates miscellaneous type2 overlay117–124. The checkpoint animation uses unscaled80; protection overlay ping-pongs on unscaled50. WAWaystation saved spawn/time behavior and ordinary-enemy protection both remain active. This is the first new combination requiring an integration test, even though both components were prepared at9. Preserve reset ordering and dual clocks; do not replace the checkpoint graphic with an ordinary protected dot.

## First new Child actor interaction: wall-reacting enemies

Tenacity has two ordinary Child enemies with saved version12 wall byte=true. The initial ten levels' Child ordinary enemies used false. `WACheckWalls`, CODE6:d00e–d054, reads WAInfo+0x6a (saved WASpec byte20), calls `WLCheckCollisions:ba82–bac4`, and on the first active wall sprite whose original outline overlaps calls WABounce. This is not a color, program or clock-class permission. WABounce atcf50 negates direction/sliding direction through WAReverse and requests nonhuman sound30 in single-player.

For enemies this happens inside WAEnemyOneFrame **after integer frame animation and before cardinal program execution**. A wall reversal therefore affects any same-substep program and the next substep. Do not apply the human fourth-consecutive-wall/door-contact death guard to an enemy. Do not substitute nearest-wall distance or rendered-SVG overlap for the original outline.

The nonhuman branch of WACollide (`d0ee–d122`) calls wall checking but skips WACheckDoors; the door call is in the human branch atd0dc–d0e8. Thus wall-reacting enemies must not automatically become door-reacting enemies. Link and Motion reuse this wall-enabled ordinary-hand variant. Static topology, exact wall masks and program/collision ordering need a native scenario before accepting each level.

## Clock and program variants

Classes2 and5 enter Child at Link. Their source multiplier/normal/slow triples are(3,8,16) and(1,1,2). They share the single upstream WA scalable clock, with class-specific count/remainder and per-latch delta. Preserve WALatchTimer's shared input cap and each integer inner step; independently integrating a continuous angle can skip cardinal commands. Class3 in Homer/Pipeline/Link was prepared at Bombs, but its presence still requires runtime support and level-specific timing evidence. Class2 in Offshoots is inactive in Child and must not be created there.

All initial source PCs in11–22 are1. All stored opcode sets are subsets of n/s/b/f; no new opcode is introduced. Nevertheless active f appears repeatedly, mixed instruction streams reach length46, Link has an odd length27, and some stored programs are wholly unused in Child. Resolve signed program references only after retaining source association; never assign unused strings by list position. Preserve PC1→character cursor0, target-conditioned bounce/transfer, XOR reversal, advance-before-command and source direction sign. See `program-integration-source.md` for PC0 and multi-delta details; future generation must retain those states even though this batch starts at1.

## Doors and goodies reused with new values

Tenacity requires **short vertical/type0** leaves, caps and lethal outlines, a geometry type absent from prior actual level records even though the generic helper has a synthetic test. Link includes initially open long horizontal and vertical doors; initialize logical phase10 and direction0, rather than animating from closed. Four green doors can respond to the green switches while initially open red doors have their own switches. Balance has four same-color doors behind a single switch. Keep per-door source order, source cap-wall masks and the shared color activation rule; object class reuse does not qualify these layouts or phase defaults.

Tenacity and Offshoots request goodie initial frame169, outside group1900's17 descriptors. The source SUSetFrameIndex bounds check ignores this request, retaining the clone's existing frame; it must not become modulo16, a new goodie kind or a hard decoder failure. This is the same out-of-range-request behavior prepared for Bombs' value59. Link requests valid frame0. GO masks3/7/15 all include Child here. Goodie score/time effects, collected latch, deferred hide and reset behavior still require Bombs integration, even when no BO records exist in these levels.

## Motion's new WA type4

`WASpec2Info:daa4–dade` sets type4 flag+0x29 and clears ordinary-hand flag+0x28; this is not an ordinary colored enemy. `WAFetchRotSpike:bb7a–bbaa` loads group3500. The group has64 frame descriptors (55 source images); it follows the WA class clock and64-frame phase setter, not SP's four-phase unscaled timer. Both actual type4 actors are class1 and have wall checks disabled. One has a no-action-only program and the other no program. Their initial frames differ, including frame8.

Hero contact still uses original outline overlap and the same-pivot angular separation gate in WACheckCollisions. WAHitEnemy sees ordinary flag=false and calls RODied(reason0) without consulting invulnerable-dot protection. Do not use the stationary-SP death reason8 or grant ordinary protected-dot immunity. WACollide's ordinary-flag gates suppress nonhuman match ignition and switch/elevator/trigger hooks for type4. It retains the general integer WA animation machinery; its raw version12 wall byte is still a separate permission. Type5's special buster branch is absent and remains unsupported.

Minimum preparation for Motion: explicit type4 decoding/dispatch, original group3500 collision descriptors and per-frame anchors, source-informed smooth rotating-spike artwork, class-clock/phase handling, ordinary-hook suppression and protection-bypass contact. This report does not supply new assets or qualify its visual collision shape. Existing hand SVGs must not be stretched or recolored as a substitute for the new hazard.

## Generator and acceptance gates

- Generate the serialized8×11 lattice independently of small10×7 display origins. Homer and Sparse use the small layout; retain source index stride11. Keep display bounds, existing/absent pivot state and property masks distinct.
- Filter WA/SP/WY/GO by their actual masks before allocation/phase indexing; retain both human specifications and source actor ordering. Do not filter WL/DR/DS as though they have masks. Child Touchdown/Tenacity must contain zero spikes despite nonempty SP blocks.
- Preserve source actor type, raw PC, half-index (including56), signed direction, class, program reference and wall-check byte. Non-cardinal reset phases must survive round trips. Mid-round snapshots need the fuller frame/PC/class-clock state described in the program audit.
- Validate actual referenced programs and target-conditioned routes, checkpoint spawn/time safety, combined overlay state, special-dot availability, original wall/door collision tables and all same-color switch fanout. Existing helper tests do not prove goal reachability or safe spawn.
- Keep Child-only results separate from inactive higher-mode programs, class2, negative directions, additional enemies, colors and spikes. All original data remains intact; filtering is a runtime choice, not deletion from the source record.
- Gate new art/outline variants (type0 doors, composite dots, group3500), initially open doors, class2/5, wall-reacting ordinary hands, combined checkpoints and type4 independently. Do not waive preparation or native/visual checks because an object block name is familiar.

No runtime, manifest or asset edits, conversion, native/emulator/browser/render/build/benchmark, media/save mutation or commit occurred. Validation consisted of structural inventory, mask/field comparisons and focused private source tracing. All12 records remain unaccepted in this report; the coordinator owns sequential native/browser acceptance. Report files and private source workload are released.
