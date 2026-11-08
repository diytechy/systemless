# Catalog 61–80 source requirements review

All twenty raw resources match their queue SHA256 and decoded source hash. Every record is complete version 12, with an 11×8 display and 8×11 serialized indexing. This is source preparation only: no level acceptance, activation, runtime change, asset conversion or generated board is supplied. Maps, full programs, original outlines and source excerpts remain in the private evidence directory.

First-occurrence statements below mean **within catalog 61–80**, not library firsts. Active guns/triggers occur at 61; type-5 busters occur at 71. Clock class 4 already appeared in accepted Doors 4. This batch has active enemy classes 1, 2, 3 and 5, all initial Pascal PCs 1, and the existing b/f/n/s actor alphabet. Release has two ordinary wall-checking enemies; Transport has one. Other active enemies have wall checking disabled. No active slowdown or raw 0x2000 transfer-death dots occur.

## Inventory

Dots are present / Child bonus flags / Child goal flags. Enemies exclude human types 0 and 6. SP, PU, GO, WY, EL, HY, GN and TR are Child-mask filtered; BO, EX, WL, DR and DS have no equivalent difficulty mask. Zero active sections remain visible in JSON. Moving programs survive a dot-property mask miss. Every level has one Child goal.

| Ordinal | Menu title (resource) | Dots / bonus / goal | Enemies | Classes; opcodes | Objects | Special dots |
|---|---|---:|---:|---|---|---|
| 61 | Diagonals (153) | 50 / 12 / 1 | 3 | 1; bs | WY 1, EL 4, GN 1, TR 1 | none |
| 62 | Seesaw (141) | 58 / 3 / 1 | 5 | 1, 3; bfns | WL 3, SP 3, PU 2, EL 2 | none |
| 63 | Treachery (191) | 69 / 16 / 1 | 4 | 1; fns | EX 1, SP 5, EL 5, GN 1, TR 1 | none |
| 64 | Tubes (207) | 38 / 12 / 1 | 5 | 1, 2, 3; none | EX 15 | movingProgram 19 |
| 65 | Slipstream (134) | 62 / 12 / 1 | 2 | 1; none | WL 5, DR 2, DS 1, WY 1 | movingProgram 5 |
| 66 | Gunrunner (29042) | 81 / 9 / 1 | 5 | 1, 3; fns | WL 6, SP 2, GN 3, TR 1 | none |
| 67 | Chatter (140) | 53 / 8 / 1 | 5 | 1, 2; bfns | SP 2, HY 22, GN 3, TR 2 | none |
| 68 | Jumble (198) | 67 / 25 / 1 | 2 | 1; ns | EX 5, WL 9, DR 4, DS 6, SP 14, PU 1, WY 1, GN 1, TR 1 | movingProgram 6 |
| 69 | Mishmash (150) | 61 / 0 / 1 | 5 | 1; none | BO 28, EX 16, SP 1, WY 1 | protected 1 |
| 70 | Descent (136) | 46 / 10 / 1 | 3 | 3; fn | EX 2, WL 9, DR 1, DS 1, SP 4, GO 8, WY 1, GN 1, TR 1 | protected 1, movingProgram 7 |
| 71 | Saga (184) | 69 / 9 / 1 | 17 | 1; fn | BO 28, WL 9, DR 2, DS 1, SP 3, GO 5 | ring 1 |
| 72 | Firing Line (185) | 75 / 7 / 1 | 14 | 1, 5; fns | BO 13, WL 5, GO 4, WY 2, GN 6, TR 4 | none |
| 73 | Quest (208) | 44 / 13 / 1 | 13 | 1, 3; none | BO 4, EX 5, WL 2, SP 3 | ring 6, movingProgram 2 |
| 74 | Release (195) | 30 / 11 / 1 | 16 | 1; ns | WL 4, SP 2, PU 1 | none |
| 75 | Wavicle (204) | 57 / 11 / 1 | 5 | 1; bns | EX 16, SP 2, WY 1 | movingProgram 22 |
| 76 | Transport (177) | 70 / 12 / 1 | 8 | 1; ns | WL 4, WY 2, EL 1 | movingProgram 3 |
| 77 | Contraction (162) | 48 / 9 / 1 | 17 | 1; ns | BO 13, EX 1, WL 2, SP 3, EL 1 | movingProgram 14 |
| 78 | Frustration (172) | 81 / 24 / 1 | 15 | 1, 3; bfn | EX 4, WL 10, SP 1, GN 2, TR 2 | ring 1 |
| 79 | Hypertension (155) | 42 / 9 / 1 | 13 | 1; bfns | BO 2, WL 17, WY 1, HY 6 | none |
| 80 | Flywheels (178) | 37 / 8 / 1 | 1 | 1; fn | EX 7, GO 8 | movingProgram 9 |

## Level-specific gates

- **61 Diagonals:** First active GN/TR within this batch: one color-1 gun/trigger pair, four elevator controls and two initially lowered up/down dots.
- **62 Seesaw:** Eleven raised up/down dots in two channels, two controls, two puddles and mixed class-1/class-3 ordinary enemies.
- **63 Treachery:** One color-1 gun with direction mask 5, one trigger, six raised up/down dots, five controls and one connector.
- **64 Tubes:** Nineteen moving dots and fifteen connectors; enemies use classes 1, 2 and 3 without programs; gun/trigger records inactive.
- **65 Slipstream:** Five moving dots include literal l/r bytes, which are stationary instructions; two doors, one switch, one checkpoint and a rotating spike.
- **66 Gunrunner:** Three color-0 guns share one trigger; six walls, two spikes and class-1/class-3 ordinary enemies.
- **67 Chatter:** Twenty-two HY endpoints reach capacity in eleven valid pairs; three guns in two colors and two triggers; source teleport phases extend to channel 23.
- **68 Jumble:** Four doors and six switches combine with one gun/trigger pair, fourteen spikes, nine walls, one puddle, five connectors and six moving dots.
- **69 Mishmash:** Twenty-eight bomb records, sixteen connectors, one protected checkpoint and a rotating spike; no Child bonus dots. Four active actors have out-of-range program references; source rebinding clears those program pointers.
- **70 Descent:** One color-2 gun/trigger pair, seven moving dots, one door/switch pair, eight goodies, nine walls and a protected checkpoint; all enemies class 3.
- **71 Saga:** First type-5 busters within this batch: thirteen unprogrammed busters among seventeen enemies; 28 bombs, five invalid goodie-frame requests 169, two doors and one switch.
- **72 Firing Line:** Twelve busters, six guns, four triggers, thirteen bombs, two checkpoints and four invalid goodie-frame requests 169; class 5 also occurs on an ordinary actor.
- **73 Quest:** Eight busters, six rings, two moving dots, five connectors, four bombs and ordinary enemies in classes 1 and 3.
- **74 Release:** Twelve busters, one puddle and four walls; the type-1 and type-2 ordinary enemies both check walls.
- **75 Wavicle:** Twenty-two moving dots, sixteen connectors and one checkpoint; b/n/s ordinary programs.
- **76 Transport:** Three moving dots, two checkpoints, one active initially lowered up/down dot and one elevator control; one type-2 enemy checks walls.
- **77 Contraction:** Fourteen busters, seven programmed, plus fourteen moving dots including two property-mask misses; thirteen bombs, one connector, three raised up/down dots and one elevator control.
- **78 Frustration:** Fourteen busters include four class-3 and ten class-1 actors; two color-0 guns and two triggers, ten walls and one ring.
- **79 Hypertension:** Eleven busters include four programmed actors; three HY pairs, seventeen walls, two bombs and one checkpoint.
- **80 Flywheels:** Nine moving dots, seven connectors, eight goodies and one programmed ordinary enemy; spike record inactive.

Classes 1, 2, 3 and 5 use source multiplier/divisor 1/2, 3/8, 1/4 and 1/1 respectively. Slowdown doubles the divisor. Gun bullets use class 0, normally 1/2; thrown busters inherit their original sprite's class. These are source clock contracts, not measured wall-clock rates. Type and clock class are independent.

Mishmash has only one stored WP record but four active references 5, 6, 7 and 11. Source rebinding (CODE6:f11c–f162) checks signed negative and index >= loaded count, clears the program pointer and resets PC to 1. Its active resolved opcode set is empty. This is an explicit source fallback, not evidence that the references were valid or permission to modulo-wrap them. New generated boards should reject such references.

## Guns and pressure triggers

GNStream2Spec (CODE6:6804–68a0) reads position, placement, color, direction mask and a 32-bit mode mask for version >7. GNCreate (690e–697e) filters before its 18-record limit. GN uses group 3200: three color bases, four directional barrel frames and destroyed frame 7, eight descriptors/images total. The source places a shared background template using a (-22,-23) Point offset plus 24 times the placement quotient/remainder by two. Exact screen anchors remain unqualified here.

GNActivate (69a2–6a98) checks enabled state, visits direction bits 1, 2, 4 and 8 in source table order, launches each selected PR type-0 projectile, then requests sound 35. GNActivateByColor visits allocated guns in order. Each bullet moves three source pixels per callback in its cardinal direction. A full projectile pool drops allocation without preventing the sound. GNBombed (6af8–6c68) tests a placement-dependent one/two-cell footprint, disables matching guns and paints destroyed art. It does not remove already flying projectiles.

TRStream2Spec (a53c–a5c2) reads position, placement, color and the mask for version >10. TRCreate filters before capacity 18 and creates a logical layer-9 sprite from group 3300. Its six frames are idle/pressed pairs, 2*color and 2*color+1, with animation step zero. TRSpec2Info restores visibility, placement, idle frame and occupancy zero.

TRActivate (a6fe–a7aa) immediately fires guns of the new trigger's color before increasing occupancy. Every new entrant fires, including a second actor entering an already occupied switch. Occupancy 0→1 changes the art; departures decrement it and zero returns idle art. Occupying a trigger does not cause periodic autofire. WACheckTriggers (ccf4–cd70) uses the first visible original-outline collision and cached trigger identity, activating the new trigger before releasing the old. WACollide's ordinary-actor gate excludes rotating spikes and busters. TRBombed (a7be–a88e) hides footprint-matched sprites; active projectile reset is a separate operation.

## Shared projectile subsystem

PRInit/PRActivate/PRFrame/PRCheckCollisions (CODE6:86f0–8c64) provide a shared pool of **32 reusable slots**. Guns create type 0; buster contact creates type 1. The first null slot receives a cloned sprite and callback on logical layer 9. A full pool returns without queuing. Caller sound, hide and deadline side effects still happen, so treating exhaustion as a wholly failed action changes behavior.

Gun bullets use the three color frames of group 4200, class-0 clock and zero angular step. A projectile callback advances source sprite animation, translates by velocity once, checks its raw base against inclusive universe bounds, then checks walls, then doors. A point equal to a bound remains in range. PRSetUnivBounds stores caller-provided bounds; only demo mode expands them by 50. Bounds must come from source universe setup, not a visual sprite bounding box.

A wall hit disposes either projectile type. Type 0 requests sound 31; type 1 requests sound 33 and shatters the wall. A door hit disposes type 0 with sound 32. Type 1 requests sound 34, negates the velocity component selected by source door orientation and remains alive; this callback has no penetration rollback. Disposal sets the sprite's deferred-delete byte and clears the pool slot immediately. PRReset removes/frees all active slots and retains the shared template.

PRCheckCollisions scans slots in order, ignores null, invisible and type-1 projectiles, and uses original outlines. WACheckBullets calls human death reason 16 before human wall/door checks, without consulting dot protection or consuming the bullet. Ordinary enemy processing does not perform that bullet check. Dynamic allocation and deferred deletion must retain the SU insertion/cached-next traversal contract; a bulk end-of-frame projectile pass is insufficient. Exact same-sweep insertion and simultaneous trigger/projectile/human cases remain integration gates.

## Buster actors and resurrection

WAFetchBuster (bb34–bb64) uses group 3900: 64 angular descriptors referencing 41 images. WASpec2Info gives type 5 a distinct flag, clears ordinary status and uses the nonhuman layer. Its serialized clock and program remain meaningful. Contraction has seven programmed busters, Hypertension four; Frustration has four class-3 busters and ten class-1 busters. Do not replace these actors with fixed pickups.

WAHitEnemy (e376–e5d8) takes its type-5 branch before ordinary protection handling. It derives a launch vector from the human's canonical angle and angular sign with source SANE trigonometry and integer rounding, requests sound 41, temporarily sets the buster sprite's angular step to zero, and clones it through PRActivate type 1. It then restores the original step, hides the original actor and stores a resurrection deadline. The launch magnitude before rounding is six pixels; exact bit-for-bit SANE rounding and all-angle vectors are still integration gates. No new shoot key is established by this path.

The clone retains current angular art, zero angular step and the original buster clock. It is independently scheduled, shatters walls, reflects from doors and is skipped by the human bullet collision query. The original actor remains in WA state, hidden. Even a full PR pool still causes the original to hide and receive its deadline.

The deadline adds 300/600/900/1200 latched guest ticks by difficulty. WAEnemyOneFrame (d938 onward) auto-resurrects only saved specification type 5 when invisible, deadline nonzero and the current tick is **strictly greater** than the deadline. WAResurrect (d906) simply makes it visible; it does not reconstruct its specification. Bomb-hidden ordinary types 1–4 do not acquire this behavior. Orphan expiry hides and clears the deadline, preventing this return. Reset must restore actor state and remove independent PR clones. These are guest-tick values, not a new real-time speed claim.

## Moving programs, teleports and existing mechanics

Slipstream contains literal l and r inline instructions. DOPlanMove (2460–24f0) recognizes only e/n/s/w as motion. p and all other bytes, including l/r, clear movement and leave velocity zero. The PC still advances/wraps and the instruction lasts sixteen callbacks. Translating l/r into left/right would change this resource. A new generator should emit explicit p for waits while imported source programs retain literal semantics.

Inline program lengths in this batch are 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28. Contraction's fourteen moving dots include two whose other properties are mask-disabled. Preserve the moving-dot two-callback maximum delta wrapper, intermediate-position grab lookup, stable identity, source scan order and WA/HY/DO/DP/LI/BO rider updates from the 41–60 contract.

Chatter reaches the 22 HY endpoint capacity, with eleven complete Child pairs; its highest channel is 23. Hypertension has three complete pairs. High channel numbers are frame selectors, not endpoint counts: retain 2*p+1 through 2*p+2 and original descriptors. Sliding connectors, rings, protection, checkpoints, up/down dots, oil, bomb chains and doors still require their established state/reset and interaction contracts. Existing support for an earlier isolated mechanic does not accept these combinations.

Saga and Firing Line request goodie frame 169. Preserve the source setter's out-of-range behavior; modulo reduction is incorrect. The companion JSON retains active/inactive actor masks, classes, PCs, program lengths/opcode sets, wall policy, dot masks/colors and object variants without complete programs or coordinates.

## Generation, capacity and RNG requirements

- Preserve serialized 8x11 indexing, separate display dimensions, source record order, actor identity, present pivots, mode masks and color bits. All twenty displays here are 11x8.
- Filter WA/SP/PU/GO/WY/EL/HY/GN/TR by actual mask before allocation. BO/EX/WL/DR/DS are not filtered this way. Preserve inline movement on dot-property mask misses.
- Keep actor class, angle, direction, Pascal PC and referenced program independently of type. Respect ordinary-only hooks; programmed and class-3 busters are present.
- Validate GN color 0..2, placement variants and legal direction mask; match triggers by color and preserve first-overlap/entry/occupancy order. Do not introduce hold-to-autofire.
- Preserve PR first-free allocation, capacity 32 shared by bullets and busters, immediate slot clear plus deferred sprite deletion, source list insertion and cached-next traversal. Pool exhaustion must still allow caller side effects.
- Use original outline/anchor data and inclusive universe bounds; qualify wall shatter, door reflection and projectile/human collision order without visual-silhouette collision substitution.
- Validate 18 guns, 18 triggers, 22 HY endpoints, 61 EX, 12 EL, 43 misc, 60 BO, 15 GO, 5 LI starters, 17 sparks, 6 explosions and 32 DP lifetime allocations against their distinct source allocation rules. Validate dynamic pool demand separately from static counts.
- Require exactly two active HY endpoints per generated channel, valid high-channel frames and bounded nonempty inline Pascal programs. Chatter reaches HY22 and uses channel 23. Existing templates containing l/r must preserve stationary semantics; new generated programs should use explicit p.
- Keep buster contact ordering, deterministic source-rounded velocity, clone clock and strict resurrection deadline; prevent ordinary enemies from acquiring buster resurrection behavior.
- Preserve source RNG consumption in existing bombs, oil, goodies and death effects. No new RNG call was found in the traced GN/TR/PR/basic buster-launch paths, but this is not an exhaustive whole-round RNG proof.
- Out-of-range goodie request 169 in Saga and Firing Line follows the source setter behavior; never reduce it modulo frame count.
- Reject out-of-range program references in new generated boards. Imported Mishmash must reproduce source program rebinding: four references beyond its sole stored WP record become null program pointers with PC 1.
- Generated boards require semantic and asset validation, solvability evidence and sequential native/runtime acceptance. This survey supplies requirements, not a generator or accepted board.

## Visual inventory and validation limits

Private descriptor/outline inventory contains groups 3200 (8 descriptors / 8 images), 3300 (6 / 6), 3900 (64 / 41) and 4200 (3 / 3). All 81 descriptors preserve RAW anchors, signed outline indices, frame/image mapping, flip flags and source hashes. Scanline row counts and inclusive spans were checked against dimensions; rectangle and absent outlines remain distinct. No enhanced art, collider replacement, conversion or asset candidate was produced. Native anchor, high-channel HY appearance and cross-mechanic visual comparisons are still required.

Validation comprised twenty actual-binary/queue/decoded SHA256 matches, complete version/header checks, initial PCs and referenced-program bounds (including Mishmash's four source-disabled references), Child mask inventories, HY pair counts, bounded static capacities, original outline validation and focused private source traces. Static counts cannot prove dynamic pool sufficiency or malformed-input safety. Existing gameplay helpers were neither extended nor represented as supporting these mechanisms.

No emulator, browser, build, benchmark, conversion, runtime/asset/queue edit, save/media change or commit was performed for this survey. No catalog 61–80 level is accepted. Public reports and private evidence are released; no runner or conversion workload remains active.
