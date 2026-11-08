# Ordinary enemy program integration — source audit

This audit qualifies the ordinary WA program cursor, cardinal lookup and integer-frame scheduling contract. It does not activate More Spikes or establish native gameplay equivalence. No runtime files were changed. Actual program strings and source excerpts remain private under `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/program-integration`.

## Source PC is a Pascal byte offset

`WASpec2Info`, CODE6:dc3a–dc40, sign-extends WASpec word6 (byte offset12) into WAInfo+0x14. Word7 is the independent clock class. `WPFindPrograms:f11c–f162` resolves an in-range nonnegative program reference to the start of a **Pascal string, including its length byte**. Valid resolution preserves the saved PC unchanged. Missing/invalid reference clears the pointer and sets PC1.

`WAControlFromPC:caba–cafe` reads the byte at the current PC, increments PC, then, for this ordinary looping path, resets PC to1 if the incremented value exceeds the unsigned length byte. There is no normalization before the read. Characters s/f set grab=true; b/f set the second action flag=true; every other byte clears both. Command case is not folded. Consumption and wrap occur before checking whether a target exists, so failed actions still advance PC.

For a nonempty program of length N, PC1 selects its first character and PCN selects its last. PC0 is a distinct, defined in-buffer read of the length byte, followed by PC1. It usually acts as a no-op, but lengths98,102,115 have bytes b,f,s respectively and therefore perform those actions. Do not unconditionally treat PC0 as a no-op or normalize it to1. Negative PC or PC>N reads outside that Pascal string before the post-read wrap; a bounded generator/runtime should reject those states rather than reproduce unrelated memory reads. Empty programs should also be rejected for this bounded path.

The current `programs.mjs` models a zero-based character cursor. For source PC1..N, initialize cursor=PC−1 and map its next cursor back by+1 when serializing. For PC0, either retain a native sourcePC field and explicitly read the length byte, or use a one-shot prefix state: at the next eligible decision decode String.fromCharCode(N), advance to sourcePC1/cursor0, and perform the normal action. A plain modulo cursor cannot represent this initial prefix. A null program consumes no command.

Source checks confirm all WA records in catalog6–9 have initial PC1. More Spikes has one active ordinary program, on its blue/type3 actor, reference11. Thus cursor0 is correct **only because that actor's source PC is1**; passing raw word6 directly to the current helper skips the first character. The other ordinary enemy has no program. This audit does not assign programs by actor order.

## Exact cardinal target and action

`WAGetGrabOffset:c2a2–c2ee` begins with a zero Point and uses the current integer sprite frame masked63:

| Frame | Row offset | Column offset |
|---|---:|---:|
|0|0|+1|
|16|+1|0|
|32|0|−1|
|48|−1|0|

Other frames produce zero offset, but `WADirectEnemy:cbac–cbda` calls the program only when `(frame & 15)==0` and the actor is not sliding. The offset depends on which way the hand points, not its rotation direction. Frame0 points right;16 down;32 left;48 up.

For an ordinary, non-sliding enemy, `WAAction:c6be–c6d4` calls the dot-index overload of DOCanGrab with human=false, the current dot index and that offset. `DOCanGrab:4394–443a` obtains the current dot's actual sprite pixel anchor (DOGetCurPixel), then the point overload constructs target=currentPoint+48*offset. `DOFindGrabbable:4260–436a` scans configured present dots in source index order and selects the first positional match. Ordinary static points require exact Point equality (`CCEqualPt:8f72`); the special state/tolerance branches use ±6 inclusive and a cached secondary position fallback. These moving/special-dot branches are not licensed by a simple adjacent-cell implementation. For More Spikes' static dots, adjacent row/column lookup is equivalent if it retains source presence and nonhuman permission. Do not use visual hand-tip radius, nearest-dot heuristics or rotation direction to select the target.

The final permission byte is DOInfo+0x10 for human=false, versus+0x11 for human=true (`44a0–44d4`). Render visibility alone is not permission. The wall/edge fallback in the point overload requires the human path; ordinary enemies do not gain a wall grab by enabling that fallback.

Only a successful DOCanGrab applies actions (`c6d8–c766`). Let G mean s/f and B mean b/f. Direction reverses when G XOR B. Transfer occurs when G. Therefore n/unknown does neither; s reverses and transfers; b reverses without transfer; f transfers without reversing. A missing/unavailable target causes none of those changes, although PC was already consumed. Even a bounce requires a valid target in that facing direction.

`WAReverse:c5be` negates sprite step/direction without advancing frame or changing pivot. `WAGrabDot:c3e4–c43c` calls old-dot DOReleased, changes the dot index, adds32 to the current frame through the63-mask setter, relocates to the new dot, then calls DOGrabbed atc57a. For an ordinary static target, this clears sliding. These changes apply immediately before the next integer substep. Sliding/rail transfers have additional state and are not covered by More Spikes' static route.

## Integer frame and multi-delta order

`WAEnemyFrameProc:d9f2–da20` loops WAEnemyOneFrame exactly classTimer.delta times, not once for the entire elapsed interval. Each `WAEnemyOneFrame:d938–d98a` performs:

1. WAEnemyAnimate: for a non-sliding hand, SUAutoFrame advances by the current signed step and wraps the64-frame range.
2. WASetFrameIndex writes the integer source frame and source descriptor immediately.
3. WACollide runs the source collision/contact hooks, then WAStopSliding runs.
4. WADirectEnemy checks the resulting integer cardinal frame and current sliding state, consumes its instruction and applies its action.
5. WAStartSliding runs after the action; subsequent substeps observe all changed frame, direction, pivot, program and slide state.

This order matters even with a two-step delta. Synthetic example: frame15, direction+1, valid b target, delta2 reaches16, consumes b and reverses, then reaches15. It must not jump to17 and inspect only that final angle. A transfer at0 changes the source frame to32 immediately; an s transfer makes the following substep31, while f makes it33. Initial cardinal phase does not itself execute a command at reset: the source first advances, then checks. With a zero direction, SUAutoFrame can retain a cardinal frame and the source may consume on every eligible class step; bounded generation should require direction±1 until zero-step actors are deliberately supported.

Keep canonical integer `frame`, `direction`, `pivot`, `sourcePC` and slide state in the simulation. Advance them from the class delta loop. Smooth SVG angle can interpolate that state, but neither flooring a continuously integrated angle nor a second independent program clock may decide commands. Collision descriptors and cardinal decisions should use canonical frames. Do not consume a command for each browser render while an interpolated angle happens to floor to a cardinal frame.

## WATimer latch and cap

Six shared WATimer records begin at A5−0x43f4, stride28. Fields are count+0, this-latch delta+4, remainder+8, active divisor+12, multiplier+16, normal divisor+20 and slow divisor+24. WAInfo+0x52 points to its selected class; actors in one class share the same count/delta, not separately phased clocks. WAInit clears counts/deltas/remainders once. Actor setup binds its sprite to the class count and snapshots the current reference (`dc18–dc2a`).

`WALatchTimer:e6fa–e790` takes the difference of the shared scalable MT client count from its prior observation. It caps that difference to **3*class0.activeDivisor−1−class0.remainder**. With normal Child class0 divisor2 and remainder0/1, the cap is5/4 input counts. For each class, add cappedDelta*multiplier to remainder; while remainder>=activeDivisor, subtract divisor and increment count; save this-latch delta as newCount−oldCount. This uses **>=**, unlike the upstream MT client accumulator's strict > boundary. Finally snapshot the full current MT count, discarding any capped backlog rather than carrying it into the next latch.

The source uses a single upstream scalable client for this latch. Class timing remains the previously qualified multiplier/divisor table (More Spikes class1 normal1/2, slowdown1/4; class0 unaffected by the slowdown selector). WASetSlowdown switches classes1–5 to normal/slow divisors without clearing their remainders (`ec24–ec82`). Do not apply the cap independently after dividing each actor's clock. A mathematically similar independent timer can still diverge at phase boundaries, slowdown changes, pauses or reversal commands.

SUIsFrameTime/SUProcessSprite, CODE4:3e6c–3f5c, dispatch one sprite callback when its class count changed, but that callback explicitly consumes every **current class delta** as above. This differs from ring/death callbacks, which do not have the WA inner loop. A sprite skipped during frozen processing does not accrue a private history of all missed WA deltas. Existing freeze/reveal/reset scheduling must preserve the source observation references; this report does not establish a new wall-time clock or change the independently qualified freeze policy.

## Generation and acceptance contract

Future generation must retain program reference, byte length, explicit initial sourcePC (including0), serialized half-index, resolved frame=(halfIndex*2)&63, signed direction, clock class, initial pivot, active-mode mask and wall-check policy. Reproducible mid-round snapshots additionally need current sourcePC/frame/direction/pivot/sliding state, each class count/remainder/active divisor/multiplier, upstream MT observation/phase, and each actor's sprite reference. Record whether a generated state is a fresh level specification or a resumed simulation; PC/phase must not be silently defaulted during round trips.

Before More Spikes acceptance, coordinator integration should test rawPC1→cursor0, PC0 length-byte behavior, wrap after final command, failed-target PC advance, exact cardinal neighbors, bounce requiring a target, advance-before-command, and multi-delta reversal. Broader transfer and hidden-ring behavior remain required for Some Dots. Native comparison is still required for the route, initial phase/reference and event timing. No emulator, browser, build, benchmark, runtime edit or commit ran. Source excerpts and report files are released.
