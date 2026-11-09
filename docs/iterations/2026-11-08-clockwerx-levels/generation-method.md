# A practical level-generation method

The useful starting point is a small generator for the mechanics already validated in the pilot. A full original-game generator needs the remaining mechanic checks first. Inventorying all100catalog levels does not establish that their rules are implemented. The [queue](queue.json) records that distinction; [requirements](requirements.md) accumulates observed behavior.

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
| Human motion | Pivot, angle/direction, held action, queued reverse and source wall-contact count |
| Ordinary enemies | Pivot, canonical frame, direction, program PC, class count/remainder and wall permission |
| Programs | Pascal PC semantics, cardinal callback order, successful and denied target queries; later transfer/orphan behavior requires separate qualification |
| Spikes | Exact source outline phase and unscaled clock |
| Doors | Each leaf phase/direction, switch entry history/occupancy, color links, caps and wall attachments; lethal zones differ from bounce zones |
| Oil | Wake/acquisition deadlines, target/rider state, axis preference, clone order, allocation capacity and cached dot availability |
| Death/reset | Frozen actors, continuing shared clocks and the state restored at round start; a reset does not imply all clock remainders become zero |
| Bonuses/goal | Independent collected state and permission; a goal route need not collect every optional bonus |

The later ring, checkpoint, shield, bomb, moving-dot and weapon systems add state. Their source reports are preparation, not current solver capability. Checkpoint time restoration and disappearing-ring availability are especially relevant: the same geometric board can have different future routes after a visit. The source's capacities and callback ordering also constrain generated candidates.

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
