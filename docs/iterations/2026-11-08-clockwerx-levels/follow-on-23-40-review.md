# Catalog 23–40: source inventory and integration gates

This is a Child single-player source survey, not runtime acceptance. All 18 queue resources are structurally complete version 12 records, with source hashes matching the queue. Exact maps, coordinates, program strings, descriptor data and disassembly stay private. No emulator, browser, build, conversion, activation, runtime edit or asset edit ran. The current generation-method document remains a proposal; this pass implements no generator or solver.

The new block family is EL. Candycane contains one EL control and two up/down dots, but all three properties are disabled by Child masks. Sinkers is the first active case, at ordinal 33. Active clock class 4 first appears at ordinal 28 within this batch. Doors (ordinal 4) already qualified a green class 4 hand; this is not a library-first occurrence. All active enemies are types 1–4; type 5 remains absent. All active program counters start at 1, and the opcode alphabet remains b/f/n/s. There are no inline dot programs, hyper records, EX, GN or TR records.

The table counts present dots / Child bonus flags / Child goal flags. Enemy counts exclude both serialized human slots. Object counts are Child-filtered where the record has a mask; WL, DR, DS and BO have no difficulty mask. Program columns are opcode sets, never full strings.

| Ordinal | Catalog title (resource) | Dots / bonus / goal | Enemies | Clock classes | Opcodes | Active objects |
|---|---|---:|---:|---|---|---|
| 23 | Candycane (148) | 79 / 7 / 1 | 13 | 1, 5 | bns | none |
| 24 | Forced Entry (165) | 54 / 14 / 1 | 3 | 1 | ns | WL 9, BO 17 |
| 25 | Tricolor (199) | 56 / 11 / 1 | 15 | 1 | fns | none |
| 26 | Cyclone (159) | 38 / 9 / 1 | 6 | 1, 2, 3 | none | BO 21 |
| 27 | Prosperity (196) | 59 / 30 / 1 | 6 | 1 | none | BO 56, GO 4 |
| 28 | Enclosure (203) | 88 / 30 / 1 | 5 | 1, 4 | bns | WL 9, DR 3, DS 3, BO 18, SP 1, WY 1 |
| 29 | Crossing (5002) | 62 / 3 / 1 | 6 | 1 | ns | BO 39, SP 10, WY 1 |
| 30 | Labyrinth (5001) | 88 / 9 / 1 | 8 | 1, 4 | bfns | WL 12, DR 8, DS 8, BO 9, SP 2, WY 2 |
| 31 | Hallway (169) | 69 / 12 / 1 | 2 | 1, 3 | bfn | WL 5, PU 1, WY 1 |
| 32 | Sentry (202) | 56 / 16 / 1 | 3 | 4 | none | WL 6, PU 1 |
| 33 | Sinkers (5008) | 63 / 5 / 1 | 3 | 1 | ns | EL 2 |
| 34 | Pigeonholes (188) | 55 / 14 / 1 | 6 | 1 | fn | SP 7, PU 1 |
| 35 | Hiccup (228) | 56 / 13 / 1 | 6 | 1 | bns | SP 2, PU 1, EL 1 |
| 36 | Stutter (142) | 81 / 10 / 1 | 7 | 1, 2, 3, 4 | ns | WL 15, BO 18, PU 2, GO 3, WY 1, EL 2 |
| 37 | Quincunx (135) | 63 / 6 / 1 | 15 | 1, 2, 3 | none | BO 28 |
| 38 | Tempest (220) | 48 / 12 / 1 | 13 | 1 | ns | WY 1 |
| 39 | Dodger (181) | 60 / 12 / 1 | 9 | 1, 3, 4 | n | SP 6, GO 3, EL 10 |
| 40 | Hollow (213) | 78 / 12 / 1 | 4 | 1 | fns | SP 32, GO 4, EL 12 |

All boards use an 11 by 8 display except Quincunx, which uses 10 by 7 with serialized stride 11. It needs the previously verified small-board origin, independent of the text/playfield origin. The accompanying JSON retains actor order, class, starting frame, direction, wall-check flag, program reference/length/opcode set and inactive actor summaries, without pivot coordinates or program strings.

## Inventory consequences

Property-mask misses preserve present ordinary pivots and their color. They do not remove board vertices. This matters in Candycane, Tricolor, Crossing, Sinkers, Stutter, Tempest, Dodger and Hollow. All raw ring dots in this batch miss the Child property mask, so there are zero active Child rings. Tricolor still has 56 present pivots and 15 ordinary enemies; its six disabled rings must not become holes. Composite green-blue and white colors occur in Tricolor, Pigeonholes and Hollow.

Forced Entry has one raw 0x0007 dot: present, bonus and goal together. DOGrabbed (CODE6:471e–47bc) gates effects on RODidDie, then calls ROWon for the goal before performing bonus handling. ROWon is CODE7:5116. Do not model the flags as mutually exclusive kinds or return from the callback as soon as goal completion is latched. The exact score-finalization result still needs native observation; the source ordering is the established requirement.

Prosperity has 56 BO records against the source capacity of 60; it and Crossing each use all five starter slots. All starters in this batch have activation flag byte zero, so ordinary enemies must not arm them. Nonzero bytes 64 and 185 appear on other BO kinds; these are not difficulty masks or new starter colors. The existing serialized-chain, pool, explosion callback and destruction requirements apply. Goodie initial frame requests 169 and 54 exceed the 17-frame group and must be ignored by the source setter, not reduced modulo 17.

Enclosure and Labyrinth combine rotating spikes, doors, bombs and checkpoints. Labyrinth has eight doors: four long vertical, three long horizontal and one short vertical; two ordinary red enemies check walls. Sentry has three class 4 enemies, one wall-checking. Class 4 uses multiplier 1 / normal divisor 8, versus class 2 multiplier 3 / divisor 8; sharing a divisor does not imply equal motion. Slow divisors double the normal divisor. No source class should be silently replaced with class 1.

Quincunx has 15 active enemies, including seven rotating spikes across classes 1–3, on the small board. Tempest has seven protected dots, including one active checkpoint, but its four rotating spikes retain the nonordinary protection-bypass behavior. Starting phases include noncardinal frames in Tricolor, Cyclone, Tempest and Dodger. Preserve them in collision and route tests.

Hallway and Hiccup use kind 3 oil, Pigeonholes uses kind 2, and Stutter uses kinds 0 and 2. These are directional PU variants covered by the source helper's four-kind contract, not new block families. Actual appearances, wake approaches, rider motion and full-level interactions are unqualified. Oil in Sinkers, Quincunx and Dodger is entirely inactive in Child mode.

## EL controls and linked dot state

ELStream2Spec (CODE6:508e–5114) reads a grid position, placement word, channel word and, for versions greater than 6, a 32-bit mask; older versions default to mask 15. ELCreate (5182–522c) filters before consuming its 12-record capacity and inserts the sprite at layer 16. Hollow uses all 12 slots. The batch uses placement values 1–3 and channels 0–2. Placement calculations add 24 times the quotient/remainder of placement divided by 2 to the two Point words after ROGetPixel; the final axis/anchor transform needs a native check before adoption.

WACheckElevators (cc76–cccc) takes the first visible original-outline hit from ELCheckCollisions (557e–55c2), compares it with the actor's saved control index, and activates the new index before releasing the old. WACollide (d124–d13a) invokes the elevator hook with switches/triggers for eligible ordinary actors. Type 4 rotating spikes suppress that ordinary hook. Staying on a control does not toggle repeatedly; entering a different control does, even if it has the same channel.

ELActivate (5250–5300) calls DOActivateUpDown on every eligible new entry, including entry while another actor occupies that control. The occupancy counter selects pressed/unpressed art; it does not decide whether the channel toggles. Release decrements occupancy and restores idle art only when the count reaches zero. Hidden/destroyed controls do not activate on entry. Per-actor contact indices, source traversal order, multiple occupancy and new-before-old transitions must be retained.

The raw dot selector ((flags & 0x0300) >> 8) - 1 becomes channel -1 (none) or 0–2. DOCreateAll (3ad0–3b06) clears this selector when the property mask misses, while preserving presence. DOActivateUpDown (4d80–4df8) scans all 88 dot slots and toggles every matching saved channel. A stationary raised dot starts lowering; a stationary lowered dot starts rising. A moving dot reverses, with endpoint clamping. This is not a global channel boolean: differently initialized dots can move in opposite directions after the same control entry.

Sinkers activates two channel 1 dots and two controls. Hiccup activates four channel 0 dots. Stutter activates 13 dots across two channels. Dodger activates 14 dots, including six initially lowered dots; its active channel 0 control has no Child-active channel 0 dot. Hollow activates 12 dots across three channels. Such a control may legally have no effect after filtering; do not invent a target or delete it.

## Dot motion, permission, riders and reset

DOInitUpDownInfo (332e–3464) interprets the saved raw 0x4000 state bit when an up/down channel exists. Raised state has phase 12, normal positions, visible main/shadow and human availability. Lowered initialization has phase 0, displaced/hidden main and shadow, a parked channel decoration and auxiliary frame 158. That branch does not explicitly clear the human permission byte inherited from the saved presence state. Preserve the source position and lookup gates; do not derive all grab permission from visibility or assume initial and dynamically lowered states are identical.

During motion, DOOneFrameProc (2886–29de) advances one phase per invocation. Raising moves the main sprite by Point (1,-1) and shadow by (2,0); lowering uses the inverse. It updates attached riders after each displacement. At the first lowering step from phase 12, human permission byte +0x11 clears. At the raised endpoint it becomes true again. Nonhuman permission byte +0x10 is separate; nonhuman grabs of a human-unavailable dot invoke WAOrphan. Main and shadow are visible at phase 2 or greater during motion. The auxiliary sprite is visible below phase 6 with frame 158 minus phase. The channel decoration freezes below phase 12 and resumes at the raised endpoint.

The position callback uses the WA class 1 timer through DOSpec2Info (35a6) and WAGetTimerPtr (ef94). The separate channel decoration uses unscaled 160 via DOInit (20f6–2102) and the misc-type table. Preserve both clocks and their current-count snapshots. Twelve phase steps describe a full transition, not a measured native wall-clock duration. Sprite callbacks observe source timer changes without a general elapsed-count catch-up rule.

At phase 0, the callback invokes WAOrphanOccupants(dot,-1), then DPOrphanOccupants(dot). A human attached to that dot receives RODied reason 38 (WAOrphanOccupants eb90–ec08). Visible nonhuman occupants enter the orphan state: deadline is latchedTick plus MTAdjustPeriod(15), visibility toggles on callbacks until the strict deadline test passes, then the sprite hides and its resurrection deadline is cleared (WAOrphan eb46–eb7e; WAEnemyFrame da22–da5e). DPOrphanOccupants (CODE7:0708–074c) hides and detaches all droplets on the affected dot. Static-dot Oil adapters cannot stand in for this behavior; PU and DP rider positions must follow current dot positions.

ELReset (4fae–4ff8) restores controls and zeroes occupancy. DOReset (2220–230c) restores up/down state through the saved specification; shared source clocks persist. Round death still follows the established freeze/effect/reset pipeline. ELBombed (5314–5492) checks its placement-dependent grid footprint, hides affected controls and paints destroyed frame 9 into the background; it does not toggle their channels. The bomb callback ordering remains SP, DS, EL, GN, TR, WL, then stationary DO, followed by moving targets. Explosions, multiple contacts, orphan state and reset need combined tests before enabling these levels.

## Visual inventory and generation gates

Metadata-only extraction is private in new-visual-inventory-private.json. Group 3400 has ten descriptors: channel backgrounds 0–2, idle/occupied indicators 3–8 and destroyed background 9. Only the six small indicators have outlines. The main and shadow dot groups 300 and 4100 each retain the conservative descriptor envelope 125–158; none of these auxiliary descriptors has a collider. Channel animation ranges are 127–134, 136–143 and 145–152, parked one frame before each range when lowered. Auxiliary lowering frames are 153–158. The ordinary main dot's source collider and displaced position remain separate from this decoration. Group 3500 has 64 collidable rotating-spike descriptors, reused with the varied WA clocks. Existing source images were inspected without conversion; no new vector art was produced and all baseline assets remain untouched.

A future generator must retain independent presence, property masks, colors, bonus/goal flags, initial up/down state, channel, original slot order, both permissions, current/previous positions, rider state, phase/direction, timer references, actor contacts and occupancy. Validate source capacities before proposing a board: EL 12, misc dots 43, BO 60, LI 5, sparks 17, explosions 6 and DP lifetime allocations 32. Two misc slots are needed per up/down dot in addition to goal/protection decorations. Retain the existing type-5-only autoresurrection correction: assigning a hidden deadline after a bomb does not make ordinary types 1–4 automatically respawn.

Route proof must replay legal held inputs across relevant clock phases and changing pivot availability, not just traverse a static adjacency graph. Verify ascent/descent reversal, initial lowered state, repeated same-channel entry, simultaneous actors, human death at the lower endpoint, nonhuman orphan timing, moving oil riders, bombed controls, independent bonus/goal effects and reset restoration. Preserve failed routes and exact key binding provenance. Reject unsupported mechanics rather than using visual approximations as proof of solvability.

Validation here consists of 18 resource/hash/header checks, Child-mask and program-reference inventory assertions, bounded disassembly reads, descriptor/outline metadata checks and sanitized report review. No synthetic runtime tests or native acceptance are claimed. Exact transforms, lower-state lookup edge cases, cross-layer callback timing, original scoring results and cross-mechanic behavior remain integration gates. Files and source-only workload are released to the coordinator.
