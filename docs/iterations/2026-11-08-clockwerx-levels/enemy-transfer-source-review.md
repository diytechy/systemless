# Ordinary enemy transfer source preparation

Status: future, unlinked and unaccepted. This increment prepares Some Dots (catalog 9, RND2 11330) and Bombs (catalog 10, RND2 10963). It changes no linked runtime, assets, saves or level acceptance. The new static kernel has 10 passing focused tests; no native, browser, build or conversion workload was run. Source offsets below refer to CODE 6 unless stated otherwise. Original maps, programs and disassembly remain private.

## Transfer contract

`WAEnemyOneFrame:d938-d98a` performs angular animation, canonical frame assignment, collision, stop-slide, direct-program and start-slide in that order. `WAEnemyFrameProc:d9f2-da20` repeats this entire sequence for the shared class delta. Reverse or transfer effects from one inner step apply to the next inner step immediately. Do not consume instructions on interpolated render angles or advance all frames before interpreting commands.

`WAControlFromPC:caba-cb48` supplies grab for `s/f`, and the second action bit for `b/f`. Source PC is the byte offset into a Pascal string: 1 selects its first character; 0 reads the length byte once. Increment then wrap to 1 only when PC exceeds length. The length byte can itself decode to a command. Preserve the existing `stepSourceProgram` contract and source PC in generator output, save/reset specifications and tests.

`WAAction:c6d8-c766` first obtains an eligible target, including for bounce. For static dots, canonical frames 0/16/32/48 seek right/down/left/up, one 48-pixel grid step from the current dot. Lookup chooses the first present positional match; its nonhuman permission decides whether the action succeeds. Visual visibility, bonus, color and human availability are not lookup filters. `DOCanGrab:4494-44d4` uses DOInfo+0x10 for nonhumans and +0x11 for humans. A hidden collapsed ring can remain a valid nonhuman target.

| Command | Eligible target action | Angular direction | Pivot/frame |
| --- | --- | --- | --- |
| n or unrecognized byte | No action | Unchanged | Unchanged |
| s | Grab | Reverse | New pivot, frame +32 modulo 64 |
| b | Bounce | Reverse | Unchanged |
| f | Grab | Unchanged | New pivot, frame +32 modulo 64 |

A missing or forbidden target still consumes PC; it prevents both reversal and grab. The reversal condition is grab XOR second action bit. `WAGrabDot:c3a2-c592` calls old-dot release after this reversal, changes pivot, adds 32 to the canonical frame, snaps the sprite to the new pivot's source anchor, then calls new-dot grabbed. This is an immediate geometric transfer; the source does not ease the hand between ordinary static pivots.

## Dot hooks and orphaning

`DOReleased:4818-48fa` gates ring collapse and slowdown handling on a human release. An ordinary enemy leaving a ring must not collapse it. `DOGrabbed:45fa-47ee` invokes its DP hook first (`4612-461a`), before availability handling. The nonhuman branch (`475c-476a`) calls WAOrphan if the new dot's human availability is false. Child single-player nonhumans do not collect bonuses or activate human WY/checkpoint, goal or arrival-protection-sound hooks. Keep those permissions separate from target lookup. The final DOInfo+0x1e branch is teleport, not program assignment; that path is excluded here.

`WAOrphan:eb46-eb7e` acts only when the actor is currently visible and not already orphaned. It sets the orphan flag and a deadline of latched guest tick plus MTAdjustPeriod(15). It changes neither direction, pivot, frame, PC nor class clock. Repeated requests do not refresh the deadline. Child's qualified master 60 / secondary 100 policy makes this delay 25 guest ticks; the kernel requires a supplied source period-adjustment function instead of a seconds constant. The MT routine is CODE 7:3656, reached through jump 2342.

Human ring release calls `WAOrphanOccupants:eb90-ec06`: enemy occupants of the old pivot receive WAOrphan, with visibility and one-shot checks inside that function. This is an external multi-actor hook. Its other-human death branch and multiplayer behavior are outside this Child ordinary-enemy kernel.

After all class-delta inner steps, `WAEnemyFrameProc:da22-da60` handles orphan state once per dispatched sprite callback. While latched tick is less than or equal to the deadline, it toggles visibility once. At strictly greater tick, it hides the sprite, clears the orphan flag, and clears hiddenUntil. Movement and programs continue during flicker and after hiding; the clock is not detached. Reaching a good pivot does not cure orphaning, and ring regrowth does not resurrect the actor. Collision and switch occupancy must independently respect current visibility. A source callback dispatched with delta 0 still runs this outer phase; a render update without source callback dispatch must not run it.

Scoped correction to earlier Bombs prose: the hiddenUntil timed-return check at `WAEnemyOneFrame:d98e-d9b4` is guarded by saved actor type ==5. A WABombed timestamp by itself does not establish timed return for ordinary types 1-3. Do not add automatic ordinary-enemy respawn from the earlier broad statement. Ordinary orphan expiry explicitly clears that timestamp. Full reset/recreation is separate. Ordinary burnt-dot appearance also does not by itself clear grab permissions or orphan its occupants.

## True sliding is a separate, gated mechanic

`DOSpec2Info:3532-354a` calls `EXGetDirs:5d8e-5dfe` to populate DOInfo+0xae. This is an EX-derived route mask, not ordinary wall topology. Both authored levels under review have no EX records, no moving/up/down dots and no teleport records; their static ordinary transfers do not require true sliding. This does not qualify generated variants that introduce those records or flags.

`WAStartSliding:d37a-d40e` considers an unsliding actor at a cardinal frame and calls `DOWillSlide:4c48-4cf2`. For positive angular direction, quarters 0/1/2/3 test bits 2/4/8/1; for negative direction they test 8/1/2/4. Selected bit 1/2/4/8 maps to route right/down/left/up. It initializes progress 0, progress step +1 and the current source pixel origin. `WAGetSlideOffset:d318-d35a` supplies exactly (3,0), (0,3), (-3,0) or (0,-3) pixels per class inner step.

`WAEnemyAnimate:d898-d8e6` advances sliding position/progress while retaining angular frame. `WAStopSliding:d200-d2fa` at progress >=16 releases the old dot, assigns the adjacent route endpoint directly, calls DOGrabbed, snaps to its anchor and clears sliding. Completion does not add 32 to the angle. A reverse (`WAReverse:c5be`) negates angular direction, slide progress step and pixel velocity. Returning to progress <=0 while backing up clears sliding. Since stop-slide precedes direct-program, completion can execute a command at the retained cardinal in that same inner step, then start another slide.

The new helper rejects sliding state and any nonzero route mask. EX endpoint validity, dynamic dot positions, teleport ordering, slide collision consequences and render anchors still require a dedicated adapter and qualification. A generic easing curve is not a substitute for this fixed-step source path.

## Unlinked kernel and required adapter

`enemy-transfer.mjs` exports `advanceStaticEnemyCallback(state, classDelta, options)` and `markEnemyOrphaned(actor, {guestTick, adjustPeriod})`. It imports the existing Pascal-PC helper and supports only ordinary source actor types 1-3 with explicit static dots. It returns a new actor state plus diagnostic events. Synchronous hooks mutate the working actor or external dot/actor state in source order; returned diagnostics must not be dispatched again.

State requires pivot, canonical frame 0-63, direction +/-1, sourceActorType, visible and orphaned. Programs additionally require sourcePC. unwrappedFrame defaults to frame but, when supplied, must agree modulo 64. Orphaned actors require their deadline. The adapter must initialize/reset visibility, orphan flag, deadline/hiddenUntil and PC from the source lifecycle rather than inherit a previous death. Dot records require id, integer x/y, present, humanCanGrab, nonhumanCanGrab, motion='static', slideMask=0 and teleport=false. The dot array must preserve source lookup order.

Options require program (Pascal byte string or null), dots, latched guestTick, integer MTAdjustPeriod adapter and four synchronous hooks:

1. `afterAnimate(actor, context)`: source collision stage before program; context supplies human=false, inner step and latched tick. Apply relevant wall reversals here, with canonical/unwrapped state kept consistent. Preserve source visibility and protection rules in collision adapters.
2. `onDotRelease(actor, oldDot, context)`: sees the old pivot and frame, after any command reversal. Ordinary enemy release has no human ring-collapse side effect.
3. `onDotGrabFirst(actor, newDot, context)`: the DP hook stage, after pivot/frame reassignment and before the helper checks human availability for orphaning.
4. `afterDotGrab(actor, newDot, context)`: the remaining qualified nonhuman hook stage. Do not route it through human bonuses/WY/goal logic.

The caller dispatches once per source sprite callback using that actor's shared class delta, not once per display frame. Retain canonical collision geometry and immediate target pivot changes; presentation interpolation is separate and must not change grab/collision outcomes. The caller must update visible switch occupancy after the outer orphan phase as well as preserve source actor iteration order. Existing root `round.mjs` is bounce-only and has not been modified: it needs explicit callback-dispatch, visibility/collision, ring-occupant and reset adapters before linking this helper. Frozen-round and death-effect policies remain root-owned.

Generator requirements include actor type, initial half-index/canonical phase, signed direction, clock class, source PC, program reference/byte program, checksWalls policy, ordered dot identity/position/presence, separate human/nonhuman permissions, ring lifecycle and active special-dot records. Reject EX sliding, moving/up/down dots, teleports and types 4/5 at this kernel's boundary. Do not silently promote class-name reuse to acceptance.

## Evidence and limits

Ten unit tests cover the action truth table, invalid targets consuming PC, first-match permission, hidden-target eligibility, per-inner-step reversal, collision-before-program, PC0 length-byte action, ordered ring-arrival orphaning, one-shot strict deadlines, continuing movement, one flicker per callback, zero-delta dispatch and unsupported routes. These are source-contract tests, not native equivalence or visual acceptance. Source excerpts are private under the taskroot Some Dots enemy-transfer evidence directory. Root retains all runtime, native, asset and acceptance ownership. All new files and this source workload are released after this report.
