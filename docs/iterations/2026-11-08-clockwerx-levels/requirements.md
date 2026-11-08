# ClockWerx behavior and generation requirements

The [catalog inventory](catalog-inventory.md) covers all 100 listed levels in order. There are another 20 unlisted RND2 resources. The full stream decoder reads all 120 to EOF, but playable implementation and native visual review are separate gates. Movement through Curves have eleven bounded playable increments with native/browser checks. Homer (ordinal12) is current; the complete catalog inventory is not a full runtime port. The map, artwork, original text and source analysis remain private. The [generation method](generation-method.md) describes a proposed generator and its validation requirements.

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
