# ClockWerx behavior and generation requirements

## Connector reverse boundary under investigation

Exile source review found a possible interior connector entry followed by Reverse that reaches an absent logical destination. Its original current-point storage is not proven initialized from the round data. No native route from level start has demonstrated this continuation. The reviewed pilot source now has a narrow recovery guard before reading that unknown position: retain the diagnostic facts, unwind the current update and restart safely while preserving earned score and save identity. This is an intentional approximation. It does not qualify the original continuation or justify inventing coordinates, death effects or timing. Defined present-target behavior and earlier scenes remain unchanged; a valid source-compatible solution must use no recovery events.

## Moving dots with elevators

Exile combines ordinary moving bonus dots with a separate elevator family. Ordinary movers keep the source query's current and intermediate positions; elevator TYPE2 dots use only the actual current position, including updates with two movement callbacks. Their main and shadow coordinates follow different offsets while the two decoration sprites retain fixed parent coordinates and independent clock behavior. Bonus collection clears its collectible property while retaining the foreground identity. Keep map identity, current position, collision query and drawn art separate.

The original and SVG Exile witnesses both complete for 7,000 points. All 190 tested model age/reset cases complete using the same action-target path, with distinct physical and phase histories retained. The shared elevator prefix was checked from those saved cases instead of replayed separately. Human contact and release are covered; an actor riding during an elevator's movement and the canonical reset path are not native witnesses. Source object banks and one-frame animation residuals remain separate fidelity questions. This evidence bounds tested behavior; it does not prove every input or a general finite domain for the connector's unresolved destination.

## Moving goals and marked transfers

Spires52 source review adds a distinct real-grab rule: transferring directly between two marked dots is fatal for the human. A single marked endpoint, NPC travel, Bounce and connector specifications are excluded. The original begins death at the old physical pose before release, then continues the transfer and grab callback with scoring suppressed. Keep that ordering and the terminal zero direction through the dying continuation. The separate original/SVG completion and marked-death recovery witnesses are recorded under Spires; bounded acceptance passed with explicit post-death timing limits; see [review](spires-review.md).

The goal remains a serialized dot identity while its carrier moves. Its six-frame decoration has an independent existing clock and follows the current parent's raw position in source dispatch order. Reset preserves the decoration frame/reference while restoring the carrier's program and position. Artwork supplies no collision geometry. The clean marked sockets and goal SVGs are presentation enhancements; their outlines do not replace original masks.

The [catalog inventory](catalog-inventory.md) covers all100listed levels in order. Another20unlisted RND2resources are decoded as well. Decoding a map does not establish playability or visual fidelity. Fifty-three bounded Child scenes through Exile are locally active, with original/SVG completion and recovery witnesses and explicit fidelity limits. These share one engine and level data, with broader mechanics and campaign behavior still gated. The map, artwork, original text and source analysis remain private. The [generation method](generation-method.md) describes a proposed generator and its validation requirements.

Stutter demonstrates why source queries and original replay are separate requirements. Static/up/down transfers require exact current pixels; ordinary moving runtime type1 has different slack/cache semantics and remains a later capability. Oil acquisition uses a separate rectangle. A pilot route that passed190 onsets and visibly won still failed in the original under the old incorrect query. The corrected route passes the same finite review and the actual original goal. Generators must validate on the original or label the output as a pilot-only board. A static graph is insufficient when the goal requires match ignition, a full fuse wait, destruction and timed crossings of raised dots. See [Stutter review](stutter-review.md).

## How a level is stored

ClockWerx Levels is a Macintosh resource file. Its RNDm catalog gives play order and names; each RND2 resource contains a complete round definition. It is more than a list of map tiles:

1. A signature, format version, raw round timer and display-size selector.
2. Eight serialized rows of eleven dot cells, including absent cells. The first word holds independent flags; newer versions add an activation/color word. Some present cells carry inline programs.
3. Sixteen counted sections for object classes, actor programs, actor starting states and positioned text. Programs use variable-length Pascal strings, so a fixed byte stride cannot locate all sections.
4. Per-actor starting dot, type, initial phase, signed direction, speed class, program reference and activation state. A negative program reference means no program, even when unused programs are present elsewhere in the resource.
5. TX records with font, size/style, coordinates, text and conditional prefixes. The tutorial text is rendered independently over the background; it is not baked into the bitmap collage.

Observed versions are 5, 6, 11 and 12. Older layouts lack fields introduced later; they must not receive silently guessed defaults. Display size can be 11 by 8 or 10 by 7, while serialized dot stride remains eleven. Source and size evidence is in the [decoder review](decoder-astra-review.md).

## Requirements established so far

| Area | Source/native behavior | Port boundary |
|---|---|---|
| Dot flags | Presence, bonus and goal are independent. Initial-state bit 0x4000 is separate. Difficulty-selected colors are independent of occupancy. | Movement bonus forms accepted; other special bits need qualification. |
| Bonus | Initial attachment, bounce and tutorial demonstrations preserve it. A human grab consumes it once; same-color ring becomes a sphere. | Original pickup observed; actual-map deterministic test passes; browser pickup attempt rejected due to throttling. |
| Bonus score | First award 1,000; source increments by 1,000 up to 5,000. | Scoring/reset/multiplayer system is not yet ported. |
| Movement | Swing transfers and reverses direction; flip transfers and retains direction; bounce reflects without grabbing; reverse changes direction at the same pivot. | Bounded Movement engine; logical 48-pixel reach and 120 Hz simulation. |
| Actor phase | Source half-index is doubled, then masked to 64 frames. Frame 0 points right, 16 down, 32 left, 48 up. | New decoded adapter uses this; older Movement starts at a capture-relative phase. |
| Attention flourishes | Player/goal particles appear initially, stop spawning after an accepted action, and existing particles finish. Normal single-player death eventually invokes round reset and creates both chains again. | SVG lifecycle and completed-death reset hook implemented; full reveal timing remains different. |
| Goal markers | Four triangles use a six-state size/color shimmer independent of the dot and attention particles. | Source-grounded SVG atlas; exact original hardware cadence remains uncertain. |
| Spikes | Eleven SP records in level 2, including independent subcell offsets selected from 0, 6, 24 and 42 pixels. Visible spikes always collide with the human; enemies are immune. | Four SVG phases and original collision outline profile prepared. Native all-phase anchor matching done; playable integration in progress. |
| Collision | Original bounds and one inclusive horizontal span per scanline, including vertical reflection; separate from display transparency or SVG silhouette. | Generic helper tested. Preserve source collision frames when smoothing art. |
| Enemy contact | Different pivots use outlines. Same-pivot contact additionally needs phase separation at most 4 of 64 frames. Ordinary enemy hands respect protected-dot flag 0x40 (corrected during Some Dots source audit; 0x2000 is a separate field). | Spikes has ordinary green/blue enemies and no protected dots. Other enemy types remain unqualified. |
| Spikes enemies | Both program references are negative, so these hands rotate at fixed pivots. The second human slot is hidden in single-player. | Decoded adapter checks slots, types and references. |
| Normal death | Fifteen staggered explosion particles; single-player freezes actors, waits for the effect, then resets actors/bonuses and attention chains. Underlying unscaled clocks persist. | Corrected source branch independently reviewed; original explosion/reset observed; prototype integration and state replay pass. Total-score policy and reveal pacing remain unqualified. No invented lives counter. |
| Explicit restart | Restores round-start actors, bonuses and round bookkeeping. | Separate from human respawn; full score preservation still needs review. |

The source/native alignment for the large board has logical grid origin (74,72), pitch 48. Raw source descriptor offsets are x minus 44 / y minus 43 for hands, x minus 8 / y minus 7 for spikes plus subcell offsets, and (-5,-4) for the dot tiles. The one-pixel asymmetry follows the original frame/grid algebra. Three hundred nineteen native spike crops cover all four source phases; unoccluded source pixels typically match to mean channel error about 0.43 after the evidenced display-gamma transform. This is placement evidence, not SVG pixel identity.

Spikes animation uses an unscaled source clock; at a normalized 60 Macintosh guest ticks per second its sustained average is 1.2 frames per second. Sprite processing advances once when the clock changes, rather than catching up arbitrary skipped changes. Hand clocks have difficulty and secondary rate scaling. Host render FPS, guest ticks, simulation steps and original hardware speed must remain distinct.

## Inventory milestones

These are first appearances of source classes in catalog order, not proof that a mechanic is fully understood:

| First level | Newly encountered source classes |
|---|---|
| 1 Movement | WP programs, WA actors, TX text |
| 2 Spikes | SP |
| 3 Walls | WL |
| 4 Doors | DR, DS |
| 5 Oil | PU |
| 9 Some Dots | WY |
| 10 Bombs | BO, GO |
| 23 Candycane | EL |
| 41 Squiggle | HY |
| 42 Berserkeley | EX |
| 61 Diagonals | GN, TR |

Catalog actors use raw types 0 through 6; only the human and ordinary colored-hand mappings have been reviewed here. Present-dot flags collectively include 0x63ff. Every newly used flag, actor type, class, program opcode, timer and activation condition remains an explicit requirement. Reusing an already seen class does not prove a later combination safe or implemented.

## A method for generating new levels

A useful generator should create both a level and a reproducible solution trace. Start with a constrained mechanic subset rather than arbitrary random placement:

1. Choose a seed, difficulty band, supported mechanic set and independent generated-level ID. Keep original campaign resources and save identities untouched.
2. Construct a route of legal pivot transfers from a safe spawn to the goal, recording swing/flip/bounce/reverse actions, direction and allowed encounter windows. Add optional reachable bonuses and alternative routes.
3. Place dots with valid permissions and object references. Add walls, hazards and other mechanics only after their state transitions are implemented. Preserve subcell coordinates and distinct objects sharing a grid cell.
4. Simulate the candidate with the same rule engine used for play. The state includes pivot, source phase, direction, shared clocks, enemy phases, collected bonuses, switches/doors and other persistent mechanic state. A graph of neighboring dots alone is insufficient.
5. Search for a solution and reject deadlocks, unsafe spawns, unavoidable deaths, missing references and goals reachable only through unsupported behavior. Check the full hazard cycle and original scanline collision geometry rather than SVG outlines or a static hand segment.
6. Replay the solution without solver privileges, retain the seed and action trace, and rate difficulty from timing windows, required decisions, waits, optional collection and mechanic combinations. Validate generated examples with native behavior where relevant.

Initially, a Movement-only generator could provide meaningful guarantees within the bounded Movement model. Adding Spikes requires phase-aware collision and death/respawn semantics; adding programmable enemies requires the original instruction timing. A solver proves only the modeled rules, so claims of original-game solvability must wait for independent behavior qualification. No full-game generator or solvability guarantee is implemented yet.

## Walls findings

Twelve WL specs become51merged source tiles; frame masks, tiny joints and the inclusive third-cell intervals matter. Child activeMask1 excludes right-stack actors before instantiation; lower green remains active and has wall permission. Source wall contact reverses, with a fourth-consecutive human contact guard evaluated on source substeps. A wall bounce preserves attention flourishes and suppresses queued reverse; an accepted input/action disables them. Human hazard/wall checks precede animation; enemy wall checks follow animation; human-enemy overlap is a separate periodic check. Static SVG walls cache at backing resolution. Future shattering must invalidate that cache. Native placement and the legal fourteen-transfer goal route are independently checked. The widened route passes38shared-clock phases in the bounded model; this does not constitute a general solver or original timing proof. See walls-review.md and source supplements.

## Doors findings under integration

Switches toggle every matching-color door when an actor enters; holding or leaving does not toggle it. Occupancy counts only control pressed artwork. Enemies can press switches and ordinary green enemies ignore door collision. Multiple entrants and same-color switch transfers can each toggle again; a generator must model per-actor previous contacts, not a single switch boolean. Doors have11 source phases, two leaves and separate invisible lethal outlines. Human wall response precedes door tests; leaf order and the shared fourth-contact guard matter. Normal death freezes visible door animation then resets doors, occupancy and actor contacts while underlying clocks continue.

The small grid is centered24pixels right/down relative to the large grid; serialized stride stays11 and text stays at its fixed frame origin. Each actor selects its own clock from WASpec word7. Doors green selects class4(divisor8), while Spikes/Walls ordinary enemies select class1(divisor2). Live native memory and frame matching confirm the Doors quarter-hero rate. A generator must preserve those independent actor rates, initial phases, wall permissions and shared clock state. It must also check arrival windows through opening/closing gates, including lethal zones; testing only fully open/closed geometry is insufficient. The accepted bounded route has17transfers and six bonuses; native/browser goal checks pass. Forced native crushing/trapping/reset and exhaustive action timing remain unqualified.

## Oil findings and generation state

Waking Oil does not immediately kill the human. It adds wake/acquisition/approach states, source main-dot lookup, delayed DP pursuit and alternate-axis clones. Acquisition uses raw positions and separate permissions; travel can cross gaps through original animation and outline tests. DP ignores walls. The solver must include current/previous dot, travel/extension frame, axis preference, cached human pivot,250/1166guest-tick deadlines, sprite-client references, clone order and the32-allocation lifetime budget. A graph edge alone cannot certify a chase or escape. A fatal human grab suppresses bonus and goal effects before completion.

The current Oil solution has13transfers,2bonuses and passes166clock-onset samples plus original/browser goal checks. A second original path confirms cloned droplets diverge along both axes; a separate original/browser wait case confirms pursuit/death/full reset. This provides reusable modeled behavior, not an exhaustive Oil solver. The full generator still requires independent IDs, seed/trace retention, legal input replay and unsupported-mechanic rejection. Combo adds kind0 Oil, walls and a red enemy; More Spikes adds an active conditional enemy program; More Doors adds long-horizontal doors and paired switches. See [follow-on requirements](follow-on-6-8-review.md).

Protection correction scope: accepted catalog1–5 contain neither raw0x40 nor raw0x2000; their runtime gate still rejects both. The helper correction is source preparation, not acceptance of special-dot levels.

## Combo and robust action windows

The accepted mixed-action route uses13transfers and leaves optional bonuses available. A static endpoint-clear route failed against the red hand; a bounded search found a legal swing/flip sequence, then native/browser goal checks passed. Geometry plus dot adjacency does not encode direction history or enemy phase. A one-step input trace also failed after a restart preserved a different clock phase. Widened holds pass166onset samples plus browser replay. Generated-level proofs should include usable input windows and retained failure traces. Kind0 Oil wake/acquisition/occupied-pivot death/reset is separately checked; pursuit ignores walls. See [Combo evidence](combo-review.md).

## More Spikes and canonical programs

Level 7 introduces an active bounce program rather than another free rotator. The source clock advances integer frames before cardinal commands; Pascal PC1 begins at the first byte, while PC0 is the length byte. Commands advance even if the facing nonhuman dot is unavailable. The shared capped actor latch, per-class remainders and canonical PC/frame drive rules; continuous SVG presentation does not. The accepted route needs four swing direction changes and survives 166 clock-onset tests. Generator state must carry these clocks, PC and direction, and certify playable input windows. All-flip geometry solutions can fail at spikes or rotating enemies. Transfers/sliding and programmed wall response remain gated. See [More Spikes evidence](more-spikes-review.md).

## Activation, color and runtime permission are different

Further source review retracts the early assumption that the secondary word's low nibble is a human grab mask. It is a difficulty activation mask. A mask miss clears selected optional properties while preserving a present pivot. Higher nibbles select appearance colors by difficulty. Actual human and nonhuman grab permissions are separate runtime bytes; a collapsed ring can deny humans while remaining a target for enemies. Even human bounce requires a permitted target. The accepted source scenes so far use low nibble15, making the old human mask test inert; future conditional-dot support must replace that assumption. The original Movement demonstration inference remains a bounded legacy path, not a general source rule.

Child has no active round countdown, despite retaining current and saved integer time. Checkpoints update the saved spawn and time only when the saved position changes; initial occupancy runs arrival hooks with bonus collection temporarily suppressed. These are source findings for the next increment, not acceptance of rings/checkpoints. See [Child and checkpoint contract](child-checkpoint-timer-review.md).

## More Doors and input translation

Three long horizontal gates share six paired switches. One swing in the goal route avoids a repeat switch entry that would close a gate. The input certificate must preserve switch-entry history, door phases and cap outlines. A semantic route alone does not validate its translation to original-game keys: the first native attempt sent the wrong key, reproduced a reverse, and failed after12matched transfers. Changing exactly two key events then gave20/20original pivot matches and completion. Keep failed experiments and distinguish script completion from reaching the goal. See [More Doors evidence](more-doors-review.md).

## Some Dots: state beyond the map

Disappearing rings retain enemy lookup while denying human actions, including bounce. Orphaned enemies continue their programs while flickering/hiding. Waypoints save a return specification and integer time, not board state; normal death and explicit restart have different animation/spawn effects. Protection is ordinary-enemy immunity, with spike death still possible. The two input certificates cover goal and checkpoint return over266clock samples each; native contact is independently confirmed in16overlap captures. Legal off-cardinal reverse belongs in the solver state. See [Some Dots evidence](some-dots-review.md).

## Bombs: serialized paths and callback-local damage

BO flags are a high byte plus ignored padding, not a difficulty mask. Matches ignite a source-ordered fuse list rather than adding a carried item. A generator must retain each entry/exit token, transformed original path, serialized successor and terminal2x2neighborhood. It must budget17sparks,6explosions,5matches and15goodies, and keep callback-local insertions/count references. Travelling sparks and the old explosion descriptor require their own original-outline checks; nearby graph pivots alone do not certify safety. Blasts change wall/spike topology and dot appearance without deleting pivots or grab permissions.

GO awards1,000points and+10live time, leaves saved reset time untouched, and hides at a deferred flash callback. Its score effect moves right and cycles four digit colors. Child completion adds1,000without a time bonus. Normal death restores transient objects and retains earned score; an explicit fresh pilot play clears score. The accepted18transfer route passes16sampled onset cases, plus native/browser goal and separate spark-reset checks. Exact observation phase remains uncertain by roughly one guest tick. See [Bombs evidence](bombs-review.md); this does not enable future GO/dynamic/protected/checkpoint combinations automatically.

## Curves: masks, score state and presentation

Matching Child property masks3/7create the two waypoints without changing pivot presence; mask misses remain gated until independently qualified. Both original checkpoint look changes and the second saved return are observed. Backgrounds are separate per-scene original bitmaps, not part of the map/SVG topology. Intro text remains a TX overlay; Curves has no TX records.

Child bonus-dot awards rise1,000at a time to5,000; normal traversals preserve this progression. Four pickups therefore yield10,000, not4,000. Normal round start commits roundBonus into the total, clears the round counter and resets the next award to1,000. The solver/generator must carry all three fields independently of saved checkpoint time and elapsed time. A Child goal adds1,000without a time bonus. The new per-scene tracker is first enabled on Curves; full campaign/high-score persistence and pickup effects are separate. See [Curves](curves-review.md) and [score contract](child-score-source-review.md).

## Homer: plain mask misses and slow clocks

A mask miss can retain a present pivot. Homer's two plain mask12 dots remain usable and Childcolor0; raw flag activation is not actor instantiation or grab permission. Keep the small display origin separate from serialized stride11. Native normal progression also exposes carried clock parity: class3 has divisor4 versus hero divisor2, so a64hero-frame alias can change an enemy's half-turn. Both mask-missing pivots, a one-bonus goal and a two-bonus contact/return are now checked against original gameplay. See [Homer evidence](homer-review.md).

## Touchdown: physical switch contact and programmed gates

The two mask14spikes are inactive in Child and consume no allocated phase or pool slot. Switch entry means overlap of the rotating original hand/button outlines, not merely arrival at a nearby pivot. The human controls green while programmed red hands independently operate red. Carry angle, direction, program PC and contact history; these two trajectories have a320frame joint period. The accepted23transfer witness collects six bonuses, with native/browser21,000points and direct fifth/sixth5,000awards. See [Touchdown](touchdown-review.md).

## Tenacity through Pipeline: composition and evidence

Tenacity composes three hourglasses, a protected checkpoint and short gates with ordinary wall-reacting NPCs. Each hourglass adds 1000 points and ten live seconds; a later checkpoint stores that time independently. The accepted native route earns 5000 points. A separate failed route directly observes checkpoint return and rearmed hourglasses; it must not supply the completion fixture. Full-leaf gate images resolve a phase ambiguity that a narrow crop did not. Native reverse uses Space alone in the tested fixture; the saved binding/source discrepancy remains open. See [Tenacity](tenacity-review.md).

Ramble adds counter-rotating programmed hands and mixed red/blue dots. Preserve source direction, Pascal program PC and dot permission separately from displayed color. Its two clean composite SVG dot forms use existing geometry, without copying bitmap aliasing into new detail. Native/SVG five-bonus completion earns 16000 points. See [Ramble](ramble-review.md).

Sparse uses a small display origin while retaining serialized stride11. Its four enemy clocks include a pure-forward program, two different conditional programs and a free green hand. Full state, including program PC, repeats after 384 hero frames. A warmup proposal that dies remains a counterexample; the accepted native route uses a separately verified phase alignment and earns 11000 points. Its forced wall-contact response is not independently qualified by that route. See [Sparse](sparse-review.md).

Pipeline starts the hero at frame16 and mixes normal class1 with slower class3 hands. Their shared remainder/parity affects trajectories; treating every actor as normal speed fails the native observations. Three clean original captures show actual ordinary green-hand outline intersection at a protected checkpoint, continued survival and later goal completion. Safe waiting alone would not establish that behavior. The 2000-point witness qualifies one bonus and a checkpoint wait, not every bonus or a forced checkpoint return. See [Pipeline](pipeline-review.md).

Offshoots composes seven n/s transfer programs, a free green hand starting at frame56, four hourglasses and two protected checkpoints. All four hourglass placements have original-image evidence; the accepted native/browser route collects two and visits one checkpoint for3000 points. Current time140 and saved return time130 remain separate source/browser values, hidden in the native Child HUD. Direct and both-checkpoint proposals fail despite graph connectivity; protected waiting plus action/direction choices yields a190-onset witness. The second checkpoint, two other GO and every bonus path remain unqualified by that route. See [Offshoots](offshoots-review.md).

Link requires class2floor(3U/8) and class5U from the common upstream count, rather than rounded derivatives of the hero's count. Original poses distinguish those phases. A programmed red hand contacts a wall at frame22 and reverses before continuing its program. Two red doors start open in the specification, but switch actions during the reveal change both color groups before the first gameplay capture. Door caps remain obstacles when leaves open; adjacency plus walls alone yields impossible edges. The accepted14-transfer/one-hourglass native/browser route earns2000points through two timed green gates; remaining pickups and checkpoint return stay unqualified. See [Link](link-review.md).

Balance demonstrates a stricter cap constraint: two individually safe edge angles can belong to different connected rotation sectors at the same pivot. Opening leaves leaves those fixed caps in place. A private read-only planner carries incoming angle and static safe-angle component; timed input replay still decides survival. Its accepted right-side10-transfer/one-bonus route earns2000points in original/SVG. Six SP placements show all four original frames, with195usable poses supporting a shared source clock and fixture-specific birth reference. The NPC/hero1280-frame period excludes SP/gate clocks. See [Balance](balance-review.md).


Doubleback crosses four disappearing rings in a fixed order. Original pixels show collapse, full disappearance and restoration at each ring; the browser separately confirms hidden rings deny humans and later regain availability. A recently released pivot can remain present and nonhuman-available while a human cannot grab it. Source-backed lunar PICT403 is separate from map topology. The 22-transfer/two-bonus native/SVG witness earns 4000 points and passes 190 finite onsets. See [Doubleback](doubleback-review.md).


Motion introduces type4 spiked orbs orbiting pivots. They share integer WA clocks but suppress ordinary match/switch effects and bypass ordinary protected-dot immunity. The source original64-pose collider stays independent from smooth orbital SVG art. The accepted native/SVG nine-transfer/two-bonus goal earns4000; a separate original seven-transfer contact route intersects the orb, explodes and returns. Later browser cadence captures are invalidated by scheduling gaps and supply no smoothness qualification. See [Motion](motion-review.md).


Candycane adds fast class5 orbital transfers and inactive elevator/up/down properties. Mask misses preserve ordinary usable pivots. Native33clean orb poses show11sampled pivot changes; class5 must consume upstreamU rather than2*rounded human frames. The20-transfer/two-bonus goal visits both masked pivots and earns4000 in original/SVG. Immediate-backtracking input holds conflict in a rejected proposal; a detour gives190finite onset passes. See [Candycane](candycane-review.md).

Forced Entry combines a goal and bonus on one pivot. Source completion precedes the same-grab bonus and retains its final score. Both native and SVG earn21000 through26transfers/sixbonuses and two fuse-created wall passages. A safe wait of three human turns changes NPC phase; it is not a full-scene-period shortcut. Native29spark poses and both blast/cleanup sequences are reviewed. See [Forced Entry](forced-entry-review.md).

Tricolor preserves six inactive ring properties as ordinary pivots, with all198 native dot-core observations preferring plain art. Its fifteen red/green/blue hands share class1 clocks and f/n/s programs.231 composite-color cores independently fit original descriptors; four clean private SVG forms preserve distinct color sectors. The accepted9-transfer/two-bonus original/SVG goal earns4000 and visits one disabled ring. See [Tricolor](tricolor-review.md).

Cyclone composes class1/2/3 free hands with two fuse chains. Its selected20-transfer/one-bonus native/SVG goal earns2000 after the barrel blast. Four original dot cores change to burnt92/96, three bonuses clear without removing pivots, and one blue hand remains absent in late native captures. No runtime or payload changes are needed. See [Cyclone](cyclone-review.md).


## Prosperity: held input, clocks and blast rewards

A held Bounce can repeatedly reverse at neighboring facing dots while preserving the current pivot. Prosperity uses this to confine rotation to the lower half-turn during a travelling spark; simply waiting at the same safe-looking pivot fails. Space49 Reverse is separately verified alone and alongside heldCommand in the copied original settings. Preserve edge-triggered Reverse and continuous transfer/Bounce inputs independently.

The31-transfer original/SVG goal earns14000 through three GO pickups, four increasing bonus awards and the Child goal. Four fuses ignite, three blasts complete, twelve dot cores become burnt and two original green hands disappear. Model removal of a third hand varies by tested onset. The pure64-frame hero/NPC period excludes GO/LI birth clocks, fuses and explosions; independently fitted GO animation rate does not establish the same absolute first frame. See [Prosperity](prosperity-review.md).


## Enclosure timing preparation — acceptance pending

Original player motion is callback-stepped. On each class0 callback, collision and consecutive-wall contact checks precede direction input; direction requests query the current cardinal source frame. Noncardinal callbacks clear the repeated-target guard. A successful action or collision consumes a queued Reverse request without a second reversal. A goal stops the source step before subsequent animation. Smooth SVG drawing must interpolate independently of those logical frames and collision outlines.

This is prepared behind an explicit static Child scene flag; earlier accepted scenes retain their existing timing. The independent original schedule and81-image wall probe exposed the mismatch after18 transfers, although the old continuous model could report a complete route. Public callback code now reproduces105 retained schedule samples, with67 clean wall-pose fits and14 raw overdraw errors retained. Full Enclosure original/browser goals and expanded input checks remain pending; this preparation is not a scene acceptance.


Enclosure is now accepted with original/SVG46,000goals and570finite input cases. Its final input schedule matches all53original hand positions and source frames, independently of vector presentation. One checkpoint Reverse and three cardinal Bounces avoid the fragile taps in rejected witnesses. Preserve source wall-contact guards, current-cardinal target queries, switch occupancy, fuse state and goal-before-animation order. Earlier scenes retain legacy timing until separately migrated. Original blast evidence shows four burnt bonus cores and persistent orbital removal; direct switch/checkpoint blast hits remain unexercised. See [Enclosure](enclosure-review.md).


## Crossing preparation: shared references and confined waits

The original's shared hand clocks can outlive a round reset. A legal sequence of idle updates and a normal reset reproduces all 231 cold hand poses without assigning clocks or actor state. Keep the initialization history with each witness. This does not align every independent animation clock: Crossing still has small absolute spark/blast phase differences, retained in its preparation report.

A safe pivot does not imply a safe full rotation while a fuse travels. Crossing's input witness uses one sustained Bounce interval to confine the hand to a quarter-turn during the fourth blast. Start and release within the sector: cardinal-boundary edges can select the opposite sector at a neighboring clock onset. All 190 finite onsets pass for the chosen policy, followed by the original 7,000-point goal. Root SVG completion remains pending at this preparation checkpoint.

Terminal BO kinds change artwork and fuse routing; explosion damage uses the stored terminal row and column. Five completed blasts remove nine stationary spikes while preserving the central one and all affected pivots. Twelve dot cores become burnt. Preserve this dynamic state when solving the rest of the board.

Crossing is now accepted: original/SVG 7,000-point goals, all 190 finite onsets and 69 original physical-schedule hand poses pass. The five-blast topology and effect-phase limits above remain explicit. No source or payload changes were needed. See [Crossing](crossing-review.md).


## Labyrinth: orbital capabilities and control occupancy

A free class4 orbital uses divisor8/multiplier1; a separate class1 orbital executes n/b controls. Eligibility is explicit and independent. Slow programmed orbitals and unqualified orbital flip commands remain rejected. Independent cold and original physical-schedule poses qualify these two cases without changing shared timer constants.

A control can remain occupied across a pivot transfer. The selected blue-gate Reverse must occur before that occupancy releases; a later reversal re-enters the control and toggles both blue gates again. Key release is part of the input policy: carrying Flip past Reverse can regrab the previous pivot. All 190 canonical and 190 early-tap cases pass, while late +4-tick onset12 fails and remains recorded. Source Stage 3 progression is represented by the HTML completion overlay. See [Labyrinth](labyrinth-review.md).


## Hallway preparation: canonical Oil and checkpoint reset

A narrowly gated static Child composition combines original-callback human/NPC movement with Oil. Oil creates pursuing/cloning droplets and keeps its own PU/DP clocks. It is distinct from EX sliding. Restore the saved WY before resetting Oil's hero target, and discard old droplets before processing arrival effects; otherwise a reset can target the original spawn or immediately kill the new life. Hallway's11uncolored WY collision frames equal ordinary white dot9; colored/protected/moving variants remain unqualified.222runtime tests and29prior-route regressions pass; original/SVG scene acceptance remains pending.


Hallway31 is now accepted with matching original/SVG1,000goals and190finite onsets.21transferhero poses exact;fouroneframe differences remain in wider cold/gameplay captures.21PUposes/12standingDPsets match; separate original/modelOil death andWYrespawn pass. MovingDPintermediates/cloning/all12bonus pickups remainunvisited. See[review](hallway-review.md).


## Sentry preparation: slow red hands with Oil

Canonical Oil and explicit static wall qualification jointly permit free class4 red hands, including wall-checking hands. Programmed slow hands, other slow colors and wall-reacting classes1/3 remain gated. All99cold red poses match existing callback clocks and wall reflection. The16,000candidate avoids Oil; separate activation/failure/reset and original/SVG goals remain pending.


Sentry32 is accepted with original/SVG16,000points and190finite onsets; all23transfer hero poses match. Retain two cold/one physical human-frame differences and four PU callback differences. Separate original Oil death/reset and22approach poses pass; Tyro rank interstitial is omitted inHTML. See [review](sentry-review.md).


## Sinkers preparation: shared up/down groups

EL subcell and group are independent. Every entry toggles matching dots before old-control release; occupancy changes only the control artwork. Raised phase12 becomes unavailable to humans at the first lowering callback; phase0 kills/orphans attached occupants. Nonhuman presence permission remains. In-flight reversal and endpoint cancellation require distinct state. Native discovery confirms left/down core movement. Seven unlinked tests cover the primitives; no scene is enabled.


Sinkers guarded integration uses the unmodified resource and source +/-6 current-pixel queries.242control states and188clear160/1 surface frames match. The original1,000goal and190finite onsets pass. Eight cold/gameplay frame differences, four core callback differences and a post-death restart-phase difference remain explicit. Root visible SVG goal is pending; no scene acceptance yet.


Sinkers33 is now accepted with original/SVG1000goals,12transferposes and190finite onsets. Controls242/surfaces188 match; fourcorecallback differences and all41postresetframe differences remain. Exact death/restart timing is unqualified. All165bonus cores match, pickups unvisited. See [review](sinkers-review.md).


Pigeonholes34 preparation adds an explicit large/kind2Oil/static-spike/class1 composition gate;238runtime/15packaging checks and32prior-route regressions pass. Original7000/15transfers andall210positions match;21cold/sevengameplay oneframe differences remain. SevenSPIplacements match224clearfits, but only26phasesmatch: frequent spike-phase discrepancy remains unqualified. Correctedblue/greenbonusSVGfills final ordinarydotvariant. Visiblegoal/activation pending.


Pigeonholes34 is accepted with matching original/SVG7000goals/15transferhero poses and190onsets. FrequentSPIphase disparity(26of224clear exact) stays explicit; allplacements/handpositions match. The final blue/greenbonus6 SVG completes16ordinaryvariants. See[review](pigeonholes-review.md).


Hiccup35 preparation separates group0/left-half controls with kind3Oil/staticSP from the earlier group1/no-hazard gate. Moving dot position/availability feeds Oil acquisition; no collider is inferred from SVG. Source/nativecold matches231handposes,33controlstates,32clearcorepositions and100clearsurfaceframes. Main timed14transfer candidate uses twobounces/fiveReverse and passes190onsets; original/SVGgoals and kind3Oil diagnostic pending.


Hiccup35 is accepted: original/SVG1000,14transfers/twobounces/fiveReverse and190onsets pass; all308physical poses match. Exact staticSPphase,28surfaceglints and postdeath/reset phase remain unqualified. Separatekind3Oilbirth/death/reset original/model witness passes with stated callback limits. See[review](hiccup-review.md).


Stutter36sourcepreparation separates moving/stationary DOTblast dispatch, DPvisibility/clockdetach withoutslot reclamation, andELglyph hiding/burntbackground withoutcontact reset. Type4mustsuppressallordinarycontrolhooks. Mixedscene/class2orbital remainsgated; helpersareunlinked,243runtimechecks/34priorregressions295736updates pass. See[preparation](stutter-preparation.md).


Stutter36unlinkedpreparation now includes a separate freeclass2orbital capability(divisor8/multiplier3), per-multiplied-frame callbacks, movingDOoutline/visibility thenhumanavailability, and burnt main-body Oilcollision. Mixedscope remainsrejected; no nativeclass2qualification/liveopt-in.247runtime/15packaging/34priorregressions295736updates pass.


Stutter36 guarded mixedscope now dispatches movingDOT/DP/EL blasts and preserves backgroundpaint order; no live36opt-in. Inactivegroup2ordinarycores66/66, earlyclass2sixposes and35/38carriedposes match. Shared callback/blink edges and66group0surfacephase observations remain unqualified. Source/unit destruction contracts do not establish visited original gameplay behavior. See[preparation](stutter-preparation.md).


Sourcequerycorrection: up/down motion is distinct fromordinarymovingType1. Admittedhuman/NPCstatic-updownqueries useexactcurrentpixels; six-pixel slack andcachedmidpoint belong to the otherfamily. A sinkingrider maymiss a staticneighbor even whilevisible. Correctednativefirst5poses match; oldStutterpermissive190modelwins werenot originalgoal evidence. See[queryreview](transfer-query-review.md).


Dodger39 validates a mixed-height elevator channel with GO/staticSP, including an empty channel control and inactive-property ordinary pivots. Model/native/SVG witness13transfers/all3GO/twoordinarybonuses/7000; exact SP/GO/surface phase and one042callback/core boundary remain limited. All actors start static; initial moving riders need separate qualification. See[dodger review](dodger-review.md).


Hollow40 qualifies the guarded colored three-channel elevator/GO/SP/programmed-actor composition. Original/SVG8000and25transferheroes match with190onsets; independentcold700idle replaces inherited706comparison assumption. Red-channel human riders, humancontrolentry and exactsurface/GO/SPIphases remain limited. Seesaw62source review finds absentPU/DPupdownrider/lowerendpoint hooks; Fracas94needs null-import semantics and blue-ring51..58atlases. See[hollow review](hollow-review.md),[Seesaw prep](seesaw-preparation.md),[Fracas prep](fracas-preparation.md).


Squiggle41 qualifies the bounded paired-HY static Child family, strict pairs, ordinary non-HY/non-goal human starts, source arrival ordering and entry-pose fader clocks. Original/SVG1000/18transfers/6HY/all190onsets; six one-frame pose differences and one fader callback boundary remain. Preserve free ref−1 NPC initial occupancy without synthetic teleport; optional bonuses, reset, black/NPC faders, audio and mixed families need separate evidence.


EX42 now qualifies the first static connector/updown/WL/WY/freeactor Child composition. Source physical slide anchors, callback order, no-halfturn endpoint arrival, collision compensation, ID cache and recursive bonus component consumption are shared rules. Native/SVG36000 and all190onsets pass; focused callback-step, surfacephase, unvisited checkpoint/death/reset/audio limits remain explicit. Static/programmed/SP43 and later Oil/BO/GO/HY joins need separate serial qualification.


Betwixt43 qualifies static EX/SP with ordinary free/fn programs on clockclasses1/2/3. NPC programs skip while sliding/noncardinal; stop precedes PC and every exit reaches start-slide. Both bonuscomponents consumed for one initiating escalating award each. Available endpoint permissions are explicit invariant; unavailable/burning/ring/otherfamily and b/sprogram joins remain serial work. Native/SVG7000/all190onsets/13hero poses pass, ten one-frame gameplay differences retained.


Weave44 qualifies GO+staticEX/SP/optionalWL with freeordinaryclass1 actors. Physical canonical collider precedes slide-stop/input; emptyLI/SR stages accept onlythisvalidatedscope. FlatGOawards/+10time/deferredhide remainseparatefromDOTcomponent bonuses. Actualnative/SVGall5GO/6000goal and190onsets pass. ExactSPI/GOstartup/sprite/flourishphases unqualified; twoNPCsamplesone3pxstepoff andsixposesoneframe remain. Distinct40/div5GOclient is sourcegraph, notprovenphasecorrection. Subordinateb/n/s45,Oil/HY/BO/moving joins remainserial.


Slide45qualifies separate default-off GO+EXb/n/sordinaryclass1programs with helper-level static boundaries. Native/SVG2000, all190EXACT116holdonsets,359clearactorposes/positions/all12heroes/1603EXframesmatch. NPCstop/program/start/targetpermission-before-XOR/PCsuspension retained; no humancollisioncompensation. ExactSPI/GOphases, bonuscomponentpickup anddeath-reset remainlimited.


PropWash46qualifies separate default-off staticOil+EX core plusGO/white-blue-ring composition. Actual sliding is sampled atDPcreation/arrival; realgrab remains lethal. Currentmainring outline/visibility, cachedlogicaltarget/physicalPUwake, lateSPafterOil and dispatchedSP→GO/PU continuation retain sourceorder/lifetime/reset. Native/SVG11000/190onsets/Oilarrivaldeathreset pass; detailedphase/overdraw/unvisitedbranch limits inreview. Existing45profiles identical across392624updates.


Square Dance54 composes ordinary moving bonus dots, static white goal, rings, protected waypoint and callback clocks under explicit default-off capabilities. Preserve source initial bonus, sprite/background identity and consumed foreground lifetime; moving carrier identity/current coordinates, same-update grab/query order and ring release/regrowth remain separate. Original/SVG4000 and eight model cases establish one bounded playable route, with51 timed capture residuals retained. Do not extrapolate unvisited optional interactions, decorative phase, native reset or arbitrary route parity. See[square-dance-review](square-dance-review.md).
