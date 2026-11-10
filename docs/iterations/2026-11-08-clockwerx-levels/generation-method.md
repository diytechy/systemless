# A practical level-generation method

## Direction state and undefined destinations

A connector solver must track its fixed entry direction separately from its current travel vector and progress. The original Reverse operation changes travel without necessarily changing the stored direction later used to choose a logical destination. Exile source analysis found a possible absent destination whose current point depends on memory outside the round resource. A graph of rail coordinates alone misses this boundary. An original-compatible generator must exclude or resolve such continuations across its claimed input policy. The pilot's reviewed safe-restart guard is an explicit approximation and supplies no evidence of original solvability. The source-defined finite subset and the unresolved branch must remain separate in fitting and certificates.

## Reuse mechanics, validate compositions

A new level should be data for one shared engine. Admit a combination only after checking its typed objects, mode masks, actor programs, color permissions and relevant helper assumptions. Reuse established mechanic proofs and test the new interactions; a new map does not automatically require repeating every engine experiment. Still retain a legal input witness and an original-game comparison for each accepted original-compatible map. A decoded or admitted map alone is not a solvability certificate.

For moving-dot and elevator combinations, solver state needs stable dot identities, actual current positions, the permitted query cache, motion program counters, control occupancy and persistent clock state. Exile's 190 successful model timing cases share an action-target path but vary in exact poses and elevator phase. Preserve those variants rather than using a successful score as evidence of identical timing. Shared input prefixes can reuse saved evidence when identity and coverage are checked; whole-route hashes must not be relabeled as prefix hashes. Its native and SVG goal witnesses support the tested route, while unvisited rider/reset branches and the unresolved connector destination remain outside the claim. No automatic generator is implemented.

## Marked edges and moving goals

For marked dots, a generator must model actions on edges as well as properties on vertices. Entering one marked pivot can be safe; a real human grab from one marked pivot to another is fatal. Preserve the source continuation after death and exclude terminal dying state from solver expansion. Do not apply the predicate to NPCs, Bounce or connectors. A graph that treats every marked vertex as lethal would reject valid routes.

For moving goals, solve for the goal's stable identity and actual current pixels, including the source query tolerance and cached-position ordering. A query point may differ slightly from the carrier's actual center; retain both in evidence instead of rounding them into agreement. Test legal input windows and safe waiting while the carrier approaches. Keep independent goal decoration clocks out of collision and reachability state. Resetting a carrier and retaining its decoration clock are separate requirements; original post-death timing still needs its own witness. No generator is implemented.

The useful starting point is a small generator for the mechanics already validated in the pilot. A full original-game generator needs the remaining mechanic checks first. Inventorying all100catalog levels does not establish that their rules are implemented. The [queue](queue.json) records that distinction; [requirements](requirements.md) accumulates observed behavior.

The36-scene review adds a concrete validation warning: Stutter's old model produced a winning route at190 initial onsets but the original missed a transfer from a sinking dot. Correct source query semantics were necessary before the finite check meant anything. Keep independent original-game replay as a release gate for original-compatible generated maps. In timed compositions, model fuse progress, destroyed geometry, up/down phase, actor visibility and legal held-input windows. Preserve failed candidates as counterexamples; do not move actors or alter clocks to make them solve. The currently accepted Stutter route survives190 tested onsets, which does not prove safety for all possible player timing. Unvisited mixed blast interactions remain outside a generator's validated mechanic set.

Quincunx adds outline-specific enemy hiding after a blast. A generator cannot remove all actors near a cell merely because an explosion occurs there. The hit actor stays hidden until round reset; its stored WABombed deadline is not a respawn timer, and hidden frame callbacks may continue. The earlier temporary-hide/phase/reappearance description was incorrect. Model the travelling spark as a hazard too: a geometrically reasonable waiting pivot failed because the rotating hand met that spark. Keep clock classes distinct, permit multiple hands on one pivot, and verify the complete input trace after the fuse and actual visibility changes. The accepted route passes 190 finite onsets and the original goal, while a burned-background appearance still differs; visual artifacts remain separate from logical destruction and solvability.

Tempest confirms that bonus collection and protection are independent state. A protected bonus can be collected while the pivot retains its shield behavior. Mode masks likewise remove an inactive checkpoint's optional properties while preserving its ordinary pivot and color permissions. Represent these as separate fields and operations. Preserve noncardinal actor starts and the exact active program reference. A protected-dot solver must distinguish ordinary enemies from rotating spikes; ordinary protection does not imply universal hazard immunity. Rendering-overlay phase remains an explicit fidelity gap even when the main dot bodies and gameplay route match.

## Separate a board from its art

The original RND2 resources serialize a header, fixed dot-grid attributes and typed object blocks. Dot fields encode presence, colors, bonuses, goal and other properties; separate records describe actor starts, programs, walls, switches, doors, hazards, tutorial text and later mechanics. A stored actor or program may be unused in Child mode. In particular, a dot-property mask miss can remove an optional feature without removing the pivot itself. The private decoder retains raw values alongside interpreted fields so this can be checked.

Generate an independent, typed board description rather than an image. Reference the existing private sprite/background catalog; do not reproduce a bitmap background or original map inside generator code. A new board can select a visual theme independently of its rule graph. SVG rotation improves presentation, while original outline descriptors continue to decide collisions in the current pilot.

## Generate candidates, then solve them

1. Select a supported mechanic set and difficulty. Reject unknown actor classes, dot flags or commands before creating a playable board.
2. Place a start, goal and connected dot graph. Add walls and hazards using the source grid/subcell geometry. Basic reachability eliminates disconnected candidates, but does not prove survival.
3. Build a route from legal swing/flip/bounce actions. These actions have different effects on direction; a route is more than a list of neighboring pivots. Keep optional bonus routes separate from the basic goal proof.
4. Add a small number of mechanic motifs, such as a switch opening a gate, a programmed hand guarding a crossing or a delayed Oil threat. Preserve the solver's route as constraints while changing the board.
5. Replay inputs through the same rule engine used by the game. Search timing and action choices; never move actors directly to certify a solution. Reject death, unintended resets, unavailable targets and impossible input windows.
6. Test multiple initial clock phases and small early/late input variations. Retain the seed, board hash, exact rules version, successful trace and failed counterexamples. Score difficulty only after those checks.
7. Check the rendered board for readable hazards, visible bonus/goal distinctions and unambiguous switch colors. For newly ported mechanics, compare against the original before relying on the solver.

For the first implementation, a constrained route builder plus bounded search is more manageable than unrestricted random placement. The accepted Combo and More Spikes routes show why: a static dot path can fail because a swing changes later direction, a moving hand occupies the crossing, or a narrow input pulse misses after a retained clock phase. Wider held inputs succeeded without changing the physics.

## State the solver must preserve

| Mechanic | State beyond dot adjacency |
|---|---|
| Human motion | Pivot, logical source frame(or explicitly qualified legacy angle), direction, held action, queued Reverse and wall-contact count |
| Ordinary enemies | Pivot, canonical frame, direction, program PC, class count/remainder and wall permission |
| Programs | Pascal PC semantics, cardinal callback order, successful and denied target queries; later transfer/orphan behavior requires separate qualification |
| Spikes | Exact source outline phase and unscaled clock |
| Doors | Each leaf phase/direction, switch entry history/occupancy, color links, caps and wall attachments; lethal zones differ from bounce zones |
| Oil | Wake/acquisition deadlines, target/rider state, axis preference, clone order, allocation capacity and cached dot availability |
| Death/reset | Frozen actors, continuing shared clocks and the state restored at round start; a reset does not imply all clock remainders become zero |
| Bonuses/goal | Independent collected state and permission; a goal route need not collect every optional bonus |

Qualified static rings, checkpoints/protection, bombs/goodies and orbital enemies already add state in the bounded scenes. Moving dots, teleports/sliding and weapons remain gated; a source report alone does not enable a new combination. Checkpoint time restoration and disappearing-ring availability are especially relevant: the same geometric board can have different future routes after a visit. The source's capacities and callback ordering also constrain generated candidates.

Source review confirms that Child disables the round countdown. Its initialized, current and saved integer time remain separate fields; simulation elapsed time must not become an invented deadline. Difficulty modes that enable the countdown require their own timing qualification. Guest-tick deadlines for Oil and disappearing rings remain active and are a different mechanism.

## What a certificate would mean

A useful generated-level certificate would contain the board seed/hash, permitted mechanics, difficulty, engine version, an input-only solution, tested clock onsets, timing margins and any required randomness assumptions. It would support a bounded claim such as “reaches the goal for these starting phases and input windows.” It would not prove every route safe, every bonus collectible or complete original-game equivalence.

A reasonable progression is static dots and bonuses first, then walls/spikes, then switches/doors, followed by qualified programmed hands and Oil. Keep later mechanics disabled until their independent source/native/browser checks pass. A difficulty score can then consider required action changes, minimum safe input window, crossing wait time, detour cost for bonuses and recovery opportunities. Those are proposed generator features; no automatic generator has been implemented yet.

## Source requirements across the full catalog

The source surveys now cover all100listed levels. This establishes requirements, not playable support for the later mechanics. The accepted scene queue remains separate.

| Later family | Additional generator state or constraint |
|---|---|
| Bombs and goodies | Fuse routes, shared effect capacities, ordered blast passes, burnt appearance without deleting pivots, score/live-time and match ignition |
| Up/down dots | Shared channels, entry history, intermediate phase, independent permissions, rider motion and endpoint orphan/death handling |
| Teleports | Paired endpoints, supported nonrecursive arrival/release hooks and actor eligibility |
| Sliding connectors | Explicit EX route masks, fixed three-pixel steps and16-step completion, angle retention and reversal; ordinary pivot transfer is a different action |
| Moving dots | Inline byte programs, position/direction/progress, bounded missed-callback behavior and saved intermediate positions. Movement can survive an optional-property mask miss |
| Transfer-death dots | Human grab is lethal only when both old and destination dots carry the relevant property; bounce and ordinary enemies differ |
| Guns, triggers and busters | Color matching, trigger occupancy, shared projectile pool, insertion/destruction order, movement/rounding and RNG assumptions |
| Slowdown | Human arrival selects a global enemy-class divisor table. Preserve counts/remainders; human class0 is unchanged. Release alone does not undo it |

Some original records deliberately or accidentally exceed a program array or refer to an invalid goodie frame. The original can disable those objects/programs; generated levels should reject dangling references instead of relying on that fallback. A color-mismatched trigger still changes its own occupancy even when it fires no gun. Capacities and no-op instruction bytes belong in validation, rather than being inferred from a convenient word such as “left.”

Detailed source surveys: [11–22](follow-on-11-22-review.md), [23–40](follow-on-23-40-review.md), [41–60](follow-on-41-60-review.md), [61–80](follow-on-61-80-review.md), [81–100](follow-on-81-100-review.md). Their remaining native, timing, RNG and numerical uncertainties remain gates. Some Dots also demonstrates why an invulnerability test should force actual overlap: safe waiting alone did not exercise it, whereas a legal off-cardinal reverse did.

Bombs adds a serialization constraint to the proposed generator: connected-looking rope geometry is insufficient. Successor order, route entry/exit tokens and transform flags must produce a terminating chain within pool limits. Preserve source callback clocks and test the actual human hand outline against travelling sparks and old blast descriptors. A witness can deliberately ignite, retreat, wait for a wall gap, collect a GO and finish, as the accepted18transfer certificate demonstrates. Store rejected routes and clock-phase tolerances with the seed. No new-level generator has been implemented.

Reward estimates must use the Child score state, not a fixed value per bonus. Within a round the first five dot pickups award1,000/2,000/3,000/4,000/5,000, then5,000each; ordinary traversals do not reset the sequence. Normal death commits earned round points to the total and restarts the sequence. Keep score state separate from checkpoint spawn/time and restored collectible state. The Curves certificate observes four pickups plus goal for11,000and a separate waypoint return committing1,000. Its two190onset checks remain finite validation, not an exhaustive generator proof.

Homer adds an explicit normalization requirement: preserve present plain pivots when optional-property masks miss the chosen difficulty. Do not reuse the WA actor-filter rule for dots. Display dimensions and serialization stride are separate. A witness that contains class3 hands must preserve shared clock counts/remainders and reference parity; use128hero-frame phase aliases when comparing to a native trace. The accepted goal and return certificates each pass190finite onset cases, with independent native/browser outcomes. Setup campaign points must not be counted as the generated scene's reward. No automatic generator has been implemented.

Touchdown demonstrates that a node-only switch solver is insufficient: arriving at the switch pivot and immediately departing can leave the gate closed. Validate original outline entry while rotating, per-actor contact history, independent NPC gate actions and actual leaf phases. Apply spike capacity/phase allocation after difficulty filtering. NPC program state resolves timing aliases that the hero alone cannot; retain the full state period in the witness. Six pickups directly confirm the5,000cap in the original. The23transfer certificate passes190finite onsets; a general generator remains unimplemented.

Tenacity through Pipeline add composition constraints. Keep current time, saved checkpoint time, retained score and restored pickup state separate. Preserve small-board display origins independently of serialized grid stride, and carry each actor's initial pose, direction, class count/remainder and Pascal program PC. Determine the full joint state period rather than using a visually repeating hand alone. A protected checkpoint can offer a safe waiting position against ordinary hands, but departure still needs legal action, direction and collision checks. Native survival during independently observed outline contact supplies stronger evidence than waiting without contact. The separate [Tenacity](tenacity-review.md), [Ramble](ramble-review.md), [Sparse](sparse-review.md) and [Pipeline](pipeline-review.md) certificates retain failed routes and their bounded coverage; none proves arbitrary generated boards safe.

Offshoots supplies a concrete search counterexample: direct and both-checkpoint shortest paths fail against moving hands. A bounded deterministic action/timing search finds a legal goal route, then an explicit pickup requirement finds a stronger two-hourglass witness. Preserve the tested objective with its certificate; “goal reached” does not imply all objects visited. Its full1920-frame enemy/program/hero period and noncardinal green start also show why one hand revolution is an inadequate scene clock. All190 tested starting offsets pass, followed by independent native/browser outcomes; no generic generator is implemented.

Link extends graph construction to permanent door caps as well as walls. Test original hand outlines against fixed obstacles before proposing an edge; dynamic leaf openings still require simulation. This eliminates routes offered by both adjacency-only and wall-only planning. Preserve odd upstream phases for class2/5 and apply NPC switch contacts during the reveal before judging the initial play state. Its cap-aware14-transfer certificate passes190finite onsets, followed by original/SVG goals. The class clocks, programmed wall reversal and coupled door phases have separate original-image checks. Do not infer optional inventory coverage from that certificate.

Balance requires a state graph of pivot plus incoming hand angle. At each pivot, connect neighboring original64-angle poses only while static wall/cap outlines permit rotation. An exit direction must lie in the incoming pose's connected component; checking the two edge endpoints alone admits an angular trap. This read-only proposal graph finds a detour that the real rules then validate against moving NPCs, spike phases and gate leaves. Its10-transfer certificate passes190sampled onsets and original/SVG goals. Keep independently clocked hazards outside an NPC-only period claim, and retain birth references and failed proposals with the certificate. This is a solver component for existing maps, not an implemented new-level generator.


Doubleback makes availability a timed part of search state. Its first proposal revisited a collapsed ring and failed despite positional connectivity. The accepted four-ring ordering avoids that reuse; a later browser capture directly observes one hidden, human-unavailable ring and eventual restoration of all four. Carry release deadlines and separate human/nonhuman permissions, or prove the witness never needs a collapsed pivot. NPC/hero periodicity alone does not cover ring animation and restoration clocks. The finite 190-onset certificate and original goal are evidence for this existing board; no new-level generator has been implemented.


Motion requires explicit actor-type capabilities alongside class-clock state. A type4 orbital spike retains canonical WA animation without ordinary protection or match/switch hooks. Its n-only PC advances at cardinal poses; a length-byte PC could introduce an unintended command and is rejected in this bounded adapter. The native contact witness checks actual outline intersection, death and return independently of the goal witness. FullNPC/hero period12992 and190 onset samples are finite existing-map evidence. Browser scheduling invalidation must remain separate from functional proof; no general new-level generator has been implemented.


Candycane separates optional-property activation from pivot presence. Its inactive up/down dots remain static vertices and its inactive EL control allocates nothing. Carry class5 upstream phase and transfer PC, and preserve orbital position continuity through the pivot shift/half-turn. A positional route with immediate regrabbing may require conflicting human holds; a small detour can make it robust. Removing one full leading wait is justified only after verifying the full NPC/class-remainder/hero period and replaying all finite input cases. This is existing-map solving and documentation; no new-level generator is implemented.

Forced Entry requires dynamic topology and compound properties. A generator must preserve ordered fuse paths and terminal damage, find legal retreat/wait states, then recompute passage proposals from actual blast effects. Goal and bonus flags can coexist; retain source callback order and capped score progression. Occupied pivots require angle/direction-aware input, and a full human turn can change a programmed NPC phase. Reject a raw goal witness that fails onset margins: candidate05 passes181/190, while the selected legal longer wait passes190/190 followed by native/SVG21000 goals. This remains existing-map solving; no new-level generator is implemented.

Tricolor separates property masks, pivot presence and composite permission colors. Do not delete mask-missing rings or infer permissions from the enhanced SVG sectors. Preserve each same-pivot colored actor and its program phase, rather than collapsing coincident positions.600 center/composite proposals fail before an alternate left approach yields a9-transfer/two-bonus witness with190 finite onset passes and native/SVG4000 goals. The certificate covers one disabled pivot, not every pickup or traversal; retain those coverage limits with a generated seed. No new-level generator is implemented.

Cyclone adds reward and actor topology to blast planning. A legal ignition/retreat/wait can burn three bonuses and remove a nearby hand while retaining every affected pivot and permission. Preserve that tradeoff in the objective and witness rather than maximizing a static count of bonus flags. The earlier pure class1/2/3 clock period excludes post-blast hidden state. Its20-transfer/one-bonus2000-point witness passes190 finite onsets followed by original/SVG goals; the first fuse chain and five surviving bonuses remain unvisited. No new-level generator is implemented.


Prosperity requires a waiting-state policy, not just a safe vertex. Its fourth travelling spark hits a stationary full-turn wait at9,7; a real heldBounce confines the hand to its safe lower half-turn without taking the neighboring goal. Carry active holds, Reverse edges, facing direction and spark phase in the witness. Three required GO pickups and three completed blasts must be tested explicitly; four ignitions do not imply four craters at completion. All570 finite onset/tap-shift cases preserve the14000-point objective, while hidden NPC count varies. Retain that distinction and the unresolved absolute GO birth reference. This is an input-only solver for an existing board; no new-level generator is implemented.


Enclosure preparation exposes a limit of certifying against an approximate player model. The old continuous model could solve the board, yet the original diverged at transfer19. Its replacement separates the integer logical source frame from smooth SVG presentation and tests grabs only at the current cardinal callback. Preserve that rule version and opt-in flags in every generated-board certificate. The first18 original transfer poses and81 wall-probe frames independently check the replacement; a solver witness still needs an actual original/browser goal before treating a newly ported combination as qualified.

A candidate waiting policy must also include switch-entry history. An early or late Reverse can release and re-enter the same button, closing a gate even though the hand remains on the same pivot. A source Bounce at a neighboring dot supplies a different legal turnaround; initial Enclosure boundary probes improve with that input change. This is input search, not a change to collision or gate rules. Retain the failed witnesses and tested timing margins rather than presenting the geometric route alone as a solution. Full Enclosure qualification is still pending.


Enclosure qualification demonstrates why the solver must pin its rule version and retain counterexamples. Its continuous model could solve the map while the original failed at transfer19. Callback-stepped physics matches53original final-route poses exactly; the accepted49-transfer witness uses one Reverse/three Bounces and passes570finite cases before native/SVG46,000goals. Geometric reachability, a raw goal or initial boundary probes alone were insufficient. Gate occupancy and initial ignition can diverge after a small tap shift. This validates an existing-map witness under stated bounds; it does not implement a new-level generator or prove all inputs safe.


Crossing preparation extends the witness state with legal clock-reference history and confined waiting arcs. A read-only forecast can use a 48-quarter-turn NPC cycle after every fuse is finished and all transient effects have expired. That local static-tail cycle excludes earlier travelling sparks, blast clocks, checkpoint acquisition and score objectives; it cannot justify deleting waits from the whole route. Every proposed macro is replayed as real fixed-update input before the original game is tested. The selected 56-transfer witness collects all three bonuses, visits the checkpoint and earns 7,000 points after all five blasts. Its 190 finite onsets pass, with the root SVG goal still pending at preparation time.

For generated content, require a safe waiting policy as well as a reachable pivot. Preserve input hold edges, rotation sector, actor program phase and transient hazards in the certificate. Crossing's failed full-turn wait and cardinal-boundary Bounce edges are retained counterexamples. Its hand-frame agreement does not establish exact absolute SR/BO animation phase. These are requirements and an existing-map solver; no new-level generator is implemented.

Crossing qualification is complete for the selected Child route: both original and visible SVG earn 7,000, all 190 finite onsets pass and all 69 original hand poses match. Retain the effect-phase/cadence limits with the witness; acceptance does not erase those differences or implement new-level generation.


Labyrinth requires a control-contact state machine across pivot transfers, including key-up times. Two controls of one color affect every gate of that color, with initially open gates moving oppositely to closed ones. A successful geometric path can still fail after an extra control entry. The selected23-transfer4,000-point original/SVG witness passes190canonical and190earlyReverse onsets; late+4ticks fails at onset12. Retain this asymmetric timing boundary rather than reporting a570-case certificate. The unused seven bonuses, four controls and unfinished terminal blast remain separate coverage requirements. This is an existing-map solver, not new-level generation.


Hallway preparation adds a dynamic pursuit constraint: geometric reachability and a checkpoint are insufficient when Oil can reach a waiting pivot. One proposed bottom-row detour dies at5,7; the retained21transfer candidate leaves the hazard, selects WY3,7 and reaches the goal across190finite onsets. Native/visible acceptance is pending. A generator must model PU activation, DP arrival/wait/pursuit/cloning deadlines, current hero target and checkpoint restart state; it must keep EX sliding distinct and preserve source dot-permission/collision ordering.


Hallway31 qualification confirms the dynamic pursuit constraint: original/SVG1,000goals and190onsets pass;the rejected detour dies and restoresWY in both original/model. Carry precise reset targeting and clear oldDroplets beforearrival. New-levelgeneration remainsunimplemented.


Sentry proposals expose timed occupancy: the shortest geometric path through a slow red pivot dies. The retained candidate detours around the central hand through the lower room. It passes190finite onsets for16,000modelpoints; original/SVG confirmation and separate Oil qualification are pending. Keep enemy clock phase and wall-reflection direction in the solver state.


Sentry32 now has original/SVG16,000goals and190finite onsets. The lower-room detour avoids the central slow hand; source wall reflection and clock phase are required state. A separate original Oil diagnostic confirms activation/death/reset but keeps four callback-frame discrepancies explicit. New-level generation remains unimplemented.


Sinkers discovery adds shared-group control transitions,12-step availability/position state and attached-occupant loss. Geometric reachability must use source current-pixel +/-6 queries and actor-specific availability. A simplified initial-topology proxy can propose diagnostic inputs but must never certify a real map. The actual up/down simulation, witness and new-level generator remain pending.


The unmodified Sinkers candidate crosses both active up/down pivots and enters two controls;190finite onsets and the original1,000goal pass. One unsuccessful raw Flip request is omitted and the held-input policy independently replayed. Carried positions and occupant death are modeled; exact post-death timing is still unqualified. This actual-map witness supersedes the simplified diagnostic proxy for planning evidence; new-level generation remains unimplemented.


Sinkers33 acceptance supports timed group1 reachability with controls and carried pivots. Track current positions, direction, phase, occupants, actor-specific grab eligibility and the separate surface clock. The no-death witness cannot certify death/restart timing;41postresetframe differences remain. Allfivebonus pickups and attached NPC lowering loss need further original witnesses. See [review](sinkers-review.md).


Pigeonholes34 shows geometric proposals must use the union of allfour originalstaticspikecolliders when exact flicker phase is unqualified. Existing-map15transfer/threebonus/Oilbirth goal is witnessed natively; it does not certify allhazardtiming. Preserve color permissions separately from human availability, staticSPfromrotatingWA, and kind2PUtarget offsets from visualbases. A complete normal/bonus eight-color artwork inventory is needed before claiming rendered-map coverage.


Pigeonholes34 bounded witness is now accepted/active; retain the union of allfourSPIcolliders because frequent phase mismatch remains. Existing-map route success is not new-level generation or exact hazardtiming qualification. See[review](pigeonholes-review.md).


Hiccup35 exposes a temporal reachability requirement: a static proposal can disappear before arrival as grouped dots sink, or route through an adjacent rotating enemy. Read-only static paths are proposals only. A bounded candidate search reconstructs branches from fresh unmodified-map legal inputs and tests actual collisions, waiting, bounce and Reverse; its14transfer witness passes190onsets, but still needs original/SVGgoals. Do not certify a generated board from topological connectivity alone.


Hiccup35 now has original/SVG goal and190onset witnesses for timed group crossings. Its bounded branch search used legal updates from fresh maps, not state injection. Keep surface/staticSP/death-reset uncertainty explicit and separate Oil birth/death evidence from unvisited movingDP/updown interaction. See[review](hiccup-review.md).


Stutter36 adds destructible-control liveness, burnt appearance, allocated-but-hidden droplets, and independent moving-DOTblast overlap to the pending generationstate. Inactivegroup2properties retainordinary pivots. A type4occupant mustnotpresscontrols; class2clockqualification is separate fromnormal/sloworbitals. Theseare source-derived requirements, not a qualifiedmap or new generator.


Stutter36requires distinguishing currentlyallocated droplet slots from visible sprites, movingmain-body outline from static grid membership, and class2multiplied callbacks from presentation smoothing. Independentnativefits are saved but not yet coupled-runtime witnesses. ELburnt-background/crater order andclass2orphan timing remain pending.


Stutter36 sourcewall outline graph disconnects spawn from goal before destruction. A distance heuristic must account for destructible barriers and intermediate match activation; Manhattan distance repeatedly favored dead ends. This is planning evidence only. Every candidate branch must reconstruct fresh unmodified-map legal input and then pass native/visible goal checks. Blink/callback/surface-phase uncertainty remains explicit; no new-level generator is implemented.


Stutter36 original human ignition/retreat/fuse/blast diagnostic now witnesses two removed barriersections andfour burntcornerdots. It earns no forwardprogress and has no fullgoal. A phase0 route can fail at another legal initialclock onset; fixed waits and topological detours alone do not certify safe traversal. Prefixsearch13 checks physically held inputs at two onsets before a complete finite-onset review. No state/clock injection or new generator.


Stutter36 demonstrates modelrisk:190successful onsets andavisibleSVGgoal stillfailedinoriginal becauseup/downqueryslack waswrong. Generationneedsverifiedtypedmovementcontracts andindependentoriginal replay. Forhuman routes requirealignedavailabletargets and enoughfullyraisedtime todepart; visibilityuntilphase0isnotasafeescape window. OrdinarymovingType1slack/cache is a separateunimplementedfamily. Existing35winningroutes areidentical aftertheexactqueryfix.


Dodger39 requires per-dot initial height even within one channel, optional-property mask clearing without removing pivots, and delayed GO award/hide before counting collection complete. Temporal search must use exact current positions and control contact; static connectivity is insufficient. Preserve phase uncertainty for allfourSPI and allsixGO outline variants rather than deriving collisions from SVG. Original/SVG7000route/190onsets is one existing-map witness, not a generated-level proof. See[review](dodger-review.md) and[parallel workflow](parallel-workflow.md).


Hollow40 demonstrates reusable content validation against a frozen sharedengine; it does not create another executable or prove generated levels. Initialclock calibration belongs to independently observed source initialization, not an inherited per-level constant or assigned clock state. Native/SVGgoal and all25transferheroes qualify one existing-map route; phase/unused-route limits remain. Seesaw62 requires source-ordered PU/DP riders on moving anchors and lower-endpoint detach, even with inactive guns/triggers. Imported invalid programrefs may need originalnullfallback, while generated definitions should remain strict. See[parallel workflow](parallel-workflow.md) and[review](hollow-review.md).


HY generation now requires exactly two present endpoints per admitted channel after activation masks, supported capacity, ordinary safe human starts, no recursive destination rewards, and a timed legal route through the source actor/callback model. Squiggle41 passes190held-input onsets and original/SVG goal review, but this is one qualified static Child composition. Do not infer feasibility from graph reachability alone or broaden to EX/moving/projectile combinations without serial qualification.


EX graph generation must preserve unmasked61capacity, source record order, two static adjacent endpoints and orientation0/1/byte2zero. Compute initial bonus closure across connected links; one initiating pickup clears that component and earns once. Keep logical pivot identity separate from the physical three-pixel slide anchor; include direction-dependent auto-slide, Reverse/backout and source callback ordering in timed search. EX42 is one qualified composition, not proof of mixed-family generated boards.


Static EX/program generation must model NPC stop/program/start order, PC suspension during sliding, sourceclass clocks and exactphysical queries. A program can execute immediately after arrival/backout; do not advance PC during the slide. Betwixt43uses decoder-built available endpoints; generated normalized/helper inputs with unavailable endpoints now failclosed. Test component pickup scoring and every supported hold onset, then independent original/SVG playability; a structural map or model-only winner remains insufficient.


GO+EX generation must check the physical sliding hand outline before stop/input and keep goodie flat awards distinctfromrecursiveDOT/EXbonus state. Preserve first-visible/collected blocking, deferredflourish hide andresetgeneration; useindependentclientbirth/references, never force sprite phases tofitcaptures. Weave44all5pickup/6000goal isboundedfunctional evidence withphase/callbacklimits, notexactfullgameparity. Oil+EX sourceplan addsdisplay7origin/all88slots, logicaltarget/physicalPUcontact andlayer11death/lateSPIordering constraints before46/50admission.

Slide45 preparation adds a search requirement: include hand orientation, direction and EX arrival/backout state in control reachability. A pivot adjacent to the goal can repeatedly lead to an unsafe or unusable approach. Use a discrete orientation/connector graph only to rank full legal-input simulations; retain multiple timing histories because a repeated player pose can have a different NPC window. Its source-reviewed b/n/s composition and exact cold actor fits do not yet supply a completed route or original/SVG goal. See [Slide preparation](slide-preparation.md).


Slide45isnow accepted: goalapproach frombelow, oneGO/2000, exact116hold guest endpoints and190finiteonsets passoriginal/SVGchecks. All359clearactors/all12heroes/1603EXframesmatch. The61hold failure atonset12 remains a timingcounterexample; widen/tune legalinputpolicy withoutchangingrules orclockstate. DOT/EXbonus route andbroaderfamilies remainunqualified; no generatorimplemented.


PropWash46requires timed pursuit over logical versus physical EXstate, ring eligibility/current original outline,32lifetime clones and resetbarriers. The actualmap11000goal/190finiteonsets and originalOilarrivaldeathreset are boundedwitnesses. Neither safe samepivotslidingarrival nor restingDPrealgrab nor outline-sensitive ringcrossing was visited; unitfixtures do notclose those nativegaps. Preserve spriteoverdraw/callback/RNG/resetuncertainty and strictmode/display/source-slot gates when generating maps. ParallelFunhouse50uses frozenqualifiedcore, while newBO+EX47 remainsserial. No generatorimplemented.

Bomb/EX generation additionally preserves ordered component propagation without deleting links, one initiating bonus award, and source foreground/background identity. The same geometry can require different persistent paint after spark travel or a crater. Focus47 original route earned4,000points and reached48; its renderer also reaches theSVGgoal and has separate post-blast review, with phase/pixel/texture limits retained. Thriller48requires erased-wall callback paints; its actual terminals cannot witness burning WY/EX. See[bomb/sliding integration](bomb-sliding-integration.md). These finite existing-map witnesses do not establish arbitrary generated-level solvability.


## Thriller48 wall/checkpoint requirement

The accepted48composition adds source eraser frames2/3/4 and ordered persistent wall paint. Collision removal alone leaves old pixels: paint source masks synchronously before DO callbacks, retain immutable wall presence for repeat blasts, and reset both wall state and journal. Actual48uses two horizontal and two vertical openings; cross4/burned WY/EX remain synthetic contracts. Native359fixed crater-free pixels support erasure only, not wholejournal equivalence. A generated level still needs timed legal transfers, safe routes after mutable geometry, protected-checkpoint death/reset validation, and goal completion; coarse connectivity is insufficient. Two48bonuses remain optional/unvisited. See[review](thriller-review.md).


EX appearance must keep normalized DO colors distinct from runtime EX flag bits. The first endpoint's normalized1/2/4 bits become EX4/2/1 before the original lookup; preserve ordinary/bonus/burnt bank and orientation independently. A narrow anticipated-frame matcher can exclude wrong colors as high-error observations; scan the complete source descriptor inventory before declaring visual coverage. The[global color review](ex-color-review.md) corrects44–48without changing their legal gameplay traces.


## Playground49 composed HY/EX requirement

A generated board using static EX links and ordinary programmed hands may reuse the accepted49scope only when HY, EX endpoints, rings and goal are disjoint and every raw program/actor identity validates. Preserve normal-grab frame changes and EX canonical arrival before teleport, capture diagnostic targets before movement, apply release/arrival/program hooks once, and keep fader birth clocks independent. Validate a timed input witness through every intended HY channel, EX arrival/backout, ring release/restoration and enemy death/reset; graph connectivity alone is insufficient. Source timer registration phase, ring callback boundaries and death/RNG/fade remain explicit fidelity limits. No state assignment/phase correction may silently turn them into evidence. This board has no bonuses. See[review](playground-review.md).


## Funhouse50 known-composition validation

A new map can reuse an unchanged qualified engine, but it still needs independent source inventory and a timed playability witness. Funhouse combines staticEX, ordinary programmed hands and Oil without new rules. Its33bonusvertices form components; five awards clear15vertices and the reachable goal, while18optional vertices remain unvisited. Preserve cached logical Oil targeting versus physical sliding-hand contact, callback order and earned points across attempts. Coarse connectivity does not prove all-bonus safety or clone/resting-DP/sliding-onlywake cases. Source-blind capture checks retain one-callback and death/reset presentation differences rather than modifying states to match. Existing source checks/finite route cases can be reused when source/data identities prove applicability; remeasure each map's native cold baseline. See[review](funhouse-review.md).

## Moving-carrier requirements

Moving dots keep their serialized identity while their current and cached physical positions change. A generator must preserve closed bounded programs, three-pixel inner translations, sixteen-callback instructions, wait instructions, persistent clock references, current-before-cached query order and source-slot precedence before permission checks. Riders follow the carrier in source callback order; fixed bomb geometry does not automatically become a rider. Current artwork and collision outlines remain distinct from grid coordinates.

A valid graph route is insufficient: require a timed legal-input witness that boards and leaves the carrier safely and acquires the intended goal identity. Record sensitivity to legal input onset and intervening ordinary resets. Bourbon's original completion and separate spark-death recovery are bounded witnesses; restored carrier positions differ from the fixed model timing, so a generator must not claim original-equivalent post-death schedules from that model alone. Actual typed rail entry, moving-dot blast damage and unvisited joins need separate evidence. Later moving goals, marked dots, up/down motion and other object families require their own serial qualification. See [Bourbon review](bourbon-review.md). No generator is implemented.
