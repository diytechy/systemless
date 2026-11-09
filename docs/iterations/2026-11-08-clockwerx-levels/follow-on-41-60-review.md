# Catalog 41–60 source requirements review

All twenty source resources match their queue SHA256 and their decoded source hash. Every record is complete version 12. This is source preparation only: no level acceptance, activation, runtime change, asset conversion or generated board is supplied. Private copied records, maps, programs, source excerpts and hash provenance remain under the private follow-on-41-60 evidence directory.

The new requirements are HY paired teleports at 41, EX sliding connectors at 42, inline moving-dot programs at 51, and the raw 0x2000 transfer-death property at 52. Existing class names do not imply runtime support for these variants. No GN, TR or door records occur in this batch. All Child enemies are types 1–4; type 5 is absent. Every active enemy starts at Pascal PC 1, uses clock class 1, 2 or 3, and has wall checking disabled. The actor opcode alphabet remains b/f/n/s. Companion JSON includes each active/inactive actor's class, PC, frame, direction, mask, program length and opcode set without full programs or positions.

## Inventory

Dots are present / Child bonus flags / Child goal flags. Enemy counts exclude the two human specifications. SP, PU, GO, WY, EL and HY counts are mask-filtered; BO, EX and WL are unfiltered because those records have no difficulty mask. Zero active sections are omitted here but retained in JSON. `movingProgram` survives a dot-property mask miss; `raw0x2000` does not. Every level has one Child goal.

| Ordinal | Menu title (resource) | Dots / bonus / goal | Enemies | Classes; opcodes | Objects | Special dots |
|---|---|---:|---:|---|---|---|
| 41 | Squiggle (131) | 50 / 5 / 1 | 5 | 1; n | SP 3, HY 12 | ring 1 |
| 42 | Berserkeley (170) | 71 / 39 / 1 | 6 | 1,2; none | EX 5, WL 2, WY 2, EL 2 | protected 2 |
| 43 | Betwixt (215) | 55 / 13 / 1 | 10 | 1,2,3; fn | EX 2, SP 2 | none |
| 44 | Weave (189) | 58 / 10 / 1 | 7 | 1; none | EX 18, WL 1, SP 6, GO 5 | none |
| 45 | Slide (176) | 87 / 6 / 1 | 8 | 1; bns | EX 61, SP 2, GO 1 | none |
| 46 | Prop Wash (219) | 70 / 8 / 1 | 7 | 1; fns | EX 8, SP 7, PU 1, GO 8 | ring 3 |
| 47 | Focus (156) | 76 / 35 / 1 | 5 | 1; bfns | BO 8, EX 22, SP 4 | ring 1 |
| 48 | Thriller (133) | 70 / 2 / 1 | 4 | 1; bfns | BO 30, EX 8, WL 6, WY 1 | protected 1 |
| 49 | Playground (5003) | 54 / 0 / 1 | 7 | 1; bfns | EX 6, HY 8 | ring 2 |
| 50 | Funhouse (5010) | 63 / 33 / 1 | 7 | 1; ns | EX 20, SP 1, PU 2 | none |
| 51 | Bourbon (168) | 47 / 29 / 1 | 5 | 1; bfn | BO 34, EX 4, SP 1, GO 5 | protected 1, movingProgram 4 |
| 52 | Spires (186) | 54 / 9 / 1 | 9 | 1; fns | none | movingProgram 3, raw0x2000 8 |
| 53 | Exile (157) | 64 / 26 / 1 | 4 | 1; fns | EX 2, WL 1, EL 1 | movingProgram 5 |
| 54 | Square Dance (173) | 49 / 12 / 1 | 5 | 1,2; ns | WY 1 | ring 2, protected 1, movingProgram 16 |
| 55 | Hokey Pokey (163) | 45 / 12 / 1 | 5 | 1; none | none | movingProgram 12, raw0x2000 9 |
| 56 | Headache (214) | 45 / 11 / 1 | 5 | 1,3; bfns | SP 2 | movingProgram 3 |
| 57 | Mortality (212) | 64 / 10 / 1 | 12 | 1; ns | none | raw0x2000 26 |
| 58 | Death (175) | 65 / 8 / 1 | 8 | 1; fns | none | movingProgram 36, raw0x2000 12 |
| 59 | Nasty (496) | 69 / 24 / 1 | 7 | 1,2,3; bfns | BO 20, EX 17, WL 2, GO 4, WY 1 | protected 1 |
| 60 | Hitchhiker (145) | 58 / 10 / 1 | 5 | 1,3; fns | BO 31, WL 1, SP 7, GO 4, WY 1 | movingProgram 1 |

## Level-specific gates

- **41 Squiggle:** First active HY: six pairs, one ring, four n-only programmed rotating spikes and one free ordinary red hand. The ordinary hand's negative program reference must not be rebound to an unused stored program.
- **42 Berserkeley:** First EX: five connectors, two protected checkpoints, two linked raised dots and two EL controls; both SP records inactive.
- **43 Betwixt:** Two horizontal connectors with ten ordinary enemies across three clocks; n/f programs.
- **44 Weave:** Eighteen connectors, one wall, six spikes and five goodies; enemies have no programs.
- **45 Slide:** Sixty-one horizontal connectors reach the EX capacity; 87 present pivots and one goodie.
- **46 Prop Wash:** Eight connectors and goodies, seven spikes, one active kind 1 puddle, three active rings; sixteen dot property-mask misses preserve pivots.
- **47 Focus:** Twenty-two connectors and eight bomb records combine with four active spikes and one ring.
- **48 Thriller:** Thirty bomb records, eight connectors, six walls and a protected checkpoint.
- **49 Playground:** Four HY pairs plus six horizontal connectors and two rings; no Child bonus dots.
- **50 Funhouse:** Twenty connectors, one spike and two active kind 0 puddles; n/s programs.
- **51 Bourbon:** First moving dots: four length-30 programs, including one protected moving dot; 34 bombs, four connectors and five invalid goodie frame requests 169.
- **52 Spires:** Three moving dots and first raw 0x2000 transfer-death property: eight active marked dots.
- **53 Exile:** Five moving dots, six raised channel-0 dots, one EL control, two connectors and one wall; spike inactive.
- **54 Square Dance:** Sixteen moving dots, two rings and a protected checkpoint; active classes 1 and 2.
- **55 Hokey Pokey:** Twelve moving dots, nine marked transfer-death dots; every spike/puddle is inactive and enemies have no programs.
- **56 Headache:** Three moving dots include two length-60 programs; two active spikes, active classes 1 and 3.
- **57 Mortality:** Twenty-six marked transfer-death dots, twelve enemies including a rotating spike; puddles inactive.
- **58 Death:** Thirty-six moving dots, including sixteen with mask-disabled other properties; twelve active transfer-death dots; all spikes inactive.
- **59 Nasty:** Seventeen connectors, twenty bombs, two walls and a protected checkpoint; four invalid goodie frame requests 169; spikes inactive.
- **60 Hitchhiker:** One moving dot, seven active spikes, 31 bombs, one wall and a checkpoint; one rotating spike; four invalid goodie frame requests 169; puddles inactive.

Classes 1, 2 and 3 use multiplier/divisor 1/2, 3/8 and 1/4 respectively. Slowdown doubles each divisor. These are source class contracts, not newly measured wall-clock rates. The class-1 timer also drives moving dots; do not infer an enemy's class from its actor type.

## Paired teleport dots

HYStream2Spec (CODE6:7508–7586) reads position, pair/channel and the version-dependent mask. HYCreate (75f0–77be) filters before allocation, has capacity 22 and first deduplicates by dot. It finds another record with the same pair/channel excluding itself, records both partners and chooses complementary animation phases. Unmatched HYGetPartner (7856–7898) returns its own dot; a missing record returns -1. This batch has exactly two active endpoints per channel. More than two or duplicate endpoints are order-dependent and remain outside the proposed generator contract.

HY uses source group 2000 and logical layer 7 (physical 4). Channel p bounds are frames 2*p+1 through 2*p+2. HYInit requests a shared timer with source period 500; this report does not call that 500 milliseconds or convert it into guessed seconds. HYReset (73ea–7452) repositions sprites without explicitly resetting their frame or clock. Moving-dot rider updates also reposition attached HY sprites.

DOGrabbed (47c0–47ea) performs the teleport after earlier dot hooks, then invokes the DP destination hook. WATeleport (ee52–eec2) requires the ordinary actor flag, starts a fader, updates pivot and sprite position, and retains angular phase/direction. It checks a wall collision at the retained frame and can invoke death reason 36. It does not recursively call destination DOGrabbed or test destination DOCanGrab in this path. Thus destination bonus/checkpoint hooks must not be invented by recursively treating teleport as an ordinary grab. Rotating spikes are excluded by the ordinary flag. Fader lifetime, destination collisions and native anchors still require qualification.

## Sliding connectors and existing controls

EXStream2Spec (5a2e–5a88) reads a grid position and two bytes, with no activation mask. Orientation byte 1 connects one row down; the other orientation connects one column right. All surveyed records use orientation 0 or 1 and second byte 0. Nonzero second-byte behavior is unqualified. EX allocation (5b08–5b26) permits 61 records; Slide uses all 61. Group 3100 supplies connector appearance. EXSpec2Info (5920 onward) inherits first-endpoint look/color and recomputes connector bonus status from either endpoint. It is not merely a decorative line.

EXGetDirs (5d8e–5dfe) builds right/down/left/up bits 1/2/4/8. At an unsliding cardinal, DOWillSlide (4c48–4cf2) tests bits 2/4/8/1 for positive rotation, 8/1/2/4 for negative. WAStartSliding (d37a–d40e) starts progress 0. Each class inner step advances three source pixels; angle stays fixed. At progress 16, WAStopSliding (d200–d2fa) releases the old dot, directly assigns the adjacent endpoint, calls DOGrabbed and snaps. Unlike a regular transfer, this completion does not add 32 frames. Reversing changes angular direction, progress direction and velocity; backing up to progress <=0 clears sliding.

DOCanGrab (44d6–44f8) can fall back to a connector only if no dot was found, the caller is human, and the moving-origin argument is true. EXFindGrabbable (5fea–60a2) checks the first connector rectangle intersecting the target's +/-3 pixel box. Its grab specification marks a connector rather than a real dot. WAGrab then computes along-connector progress from coordinate difference divided by 3. An actor already sliding passes moving-origin false, disabling this fallback. Consequently fixed adjacent-dot lookup alone cannot implement moving-dot-to-connector transfers.

No new physical key binding was found: existing G/B/reverse actions operate in a new sliding context. Human one-frame order (d498–d54e) is collision, stop-slide, input, start-slide, death/win freeze, then animation. Enemy order is animation, collision, stop-slide, program, start-slide. Keep class inner steps and canonical frames; do not substitute a jump render or easing curve. Midpoint input windows, connector bonus changes, dynamic endpoints, original outlines and wall consequences require focused native evidence. The unlinked static enemy-transfer helper deliberately rejects EX.

## Moving-dot programs and mask exception

Raw 0x80 creates a separate inline Pascal program. DOPlanMove (2460–24ee) fetches at PC 1, advances and wraps to 1. Instructions n/s/w/e set a Point velocity of three pixels up/down/left/right; p and unknown bytes select a stationary instruction. DOInitMoveInfo (32aa–3310) initializes progress 0 and duration 16, plans the first instruction, snapshots the current timer, restores initial positions and repositions riders. Each DOOneFrameProc (282c–2884) increments progress, translates main/shadow sprites if moving, updates riders, then plans the next instruction at progress 16. A p instruction therefore waits sixteen callbacks. This batch's program lengths are 4, 6, 8, 20, 24, 30 and 60.

The critical mask distinction is explicit in DOCreateAll (3aee–3b06): a property-mask miss clears protection, 0x2000, slowdown, ring, goal, bonus and up/down selector, but does not clear moving-program state. The inline program is read at 3b0c regardless. Death (58) has **36 moving dots in Child**, including sixteen whose other properties are disabled. The naive mask-filtered count 20 is incorrect. Presence and color likewise remain independent from this property filter.

Moving dots use WA class 1 via DOSpec2Info (35a6–35b6). DOFrameProc (262e–26ac) performs one inner callback and exactly one more if shared timer delta >1. It is not the actor's unrestricted delta loop. Before that second callback, moving dots save an intermediate position; DOCanGrab (4394–443a) retries that saved position after current-position lookup fails. DOPositionAllRiders (23ea–243a) updates WA, HY, DO, DP, LI and BO attachments. Retain stable source dot identity, source lookup order and physical callback order as anchors move. A static grid update after all actors have advanced loses these pickup and rider semantics.

The observed maximum program length is 60. The source uses a 128-byte Pascal storage area; a conservative future generator gate of nonempty legal programs of at most 127 bytes, with bounded trajectories, is appropriate. This is not a claim that malformed input is safely rejected by the original. Native timing, overlaps, double-delta pickup windows and combinations with up/down, rings, checkpoints, oil or explosions remain unqualified.

## Raw 0x2000: transfer between two marked dots

DOCreateAll (3a8a–3a96) and DOSpec2Info (3508–3510) map raw 0x2000 to runtime look bit 8. DOGetLook (2cec–2cfc) selects frame 108 plus color offset when no higher-priority look applies. This is separate from raw 0x40 protection.

DODeathBecomesMe (407a–40e2) returns true only when the grab specification denotes a real dot and **both the old dot and target dot have runtime bit 8**. WAGrab (c3bc–c3e2) checks it only for humans, clears angular step and calls RODied with reason 37. WAGrab then continues old-dot release, target assignment, angle+32 and subsequent grab handling; do not early-return before those mutations. Bounce alone does not call WAGrab. A single marked endpoint, ordinary enemy transfer, or simply occupying the dot does not trigger this predicate. Traced slide-completion and HY teleport paths do not call WAGrab either. Tests and native evidence must distinguish these cases before integration.

## Generation, capacity and RNG requirements

- Preserve 8x11 serialized indexing separately from display dimensions; mode masks, presence, colors and every independent property must retain source order.
- Filter WA/SP/PU/GO/WY/EL/HY by actual record mask before allocation. BO/EX/WL/DR/DS have no equivalent mask. Moving dot programs survive dot-property mask misses.
- Keep canonical angle, direction, initial Pascal PC, clock multiplier/divisor/slowdown, program references, human action flags, slide progress/vector, dynamic anchor and previous-position state. Continuous SVG interpolation must not drive game decisions.
- Preserve source physical callback order, especially moving dots before ordinary enemies/human; source multi-delta behavior differs between dots and actors.
- Validate paired HY endpoints after mode filtering, using exactly two endpoints per generated channel and valid source frame ranges; qualify duplicate/unmatched cases separately.
- Validate EX capacities, endpoint orientation, source lookup order and connector collision/pickup geometry; ordinary static transfer support is insufficient.
- Validate moving programs as nonempty Pascal strings, known opcodes and bounded trajectories; retain global identity as dots move and permit source overlaps only after lookup-order tests.
- Validate HY22, EX61, EL12, misc43, BO60, LI starter5, spark17, explosion6 and DP lifetime-allocation32 source limits; level45 already reaches EX61.
- Keep raw0x2000 separate from protection and ordinary hazard collisions; test the old-and-new endpoint predicate and mutation order on death.
- No new RNG call was found in traced HY/EX/moving-dot/transfer-death paths. Existing death, goodies, oil/pursuit and bomb effects still require their own source RNG consumption order and replay seed; this survey is not an exhaustive RNG audit.
- Generated levels need semantic validation, inventory/asset checks, solvability and sequential native/runtime acceptance; no generation or acceptance is supplied here.

Bourbon, Nasty and Hitchhiker request goodie frame 169. Existing source setter behavior ignores an out-of-range request; modulo reduction would alter the source. Existing bomb chain order, pool exhaustion, ordinary actor hide versus type-5 resurrection, protection exceptions and oil lifetime allocations remain applicable.

The existing private source image directory contains 51 group-2000 and 50 group-3100 PNG files; these counts are not descriptor counts or proof of valid source outlines. No new enhanced art, collider, asset candidate or conversion was produced. The fixed 8x11 serialized grid includes both large and small display layouts; display size must not alter source indexing.

## Validation and limits

Validation comprised twenty source-binary/queue/decoded-hash matches, complete-version/header checks, mask inventories, program references and focused disassembly traces. Every active PC is 1, every active wall-check byte is false and every active HY channel has two records. The companion JSON contains per-level source requirements, counts, masks, flags, classes and variants. Private evidence includes copied decoded records, source excerpts and provenance.

No emulator, browser, render, build, benchmark, conversion, runtime/asset/queue edit, save/media change or commit was performed. New controls, visual placement, cross-mechanic timing and actual routes remain unaccepted. All report and private evidence files are released; the source-only workload is complete.
