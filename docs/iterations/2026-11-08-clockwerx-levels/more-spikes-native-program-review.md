# More Spikes native program observation

Read-only fitting of the existing native run strongly supports the source-derived blue enemy bounce behavior. All33 blue captures agree exactly with a simulation driven by the independently fitted green enemy's shared class1 frame advances. This is evidence for this fixed-pivot route and timing, not acceptance of the whole level or every program command.

The supplied native run finished with status passed,2030 frontend ticks,2628 guest ticks, zero budget-exhausted frames and zero scripted assertions. The analyzed interval is `initial-after-reveal` plus `idle-01` through `idle-32`, guest ticks1668–2628, with30 guest ticks between samples. No new native/emulator/browser workload ran.

## Matching method and confidence

For each capture, crop the existing800×600 native screenshot to its640×480 game frame. Use the decoded fixed actor pivot and previously qualified per-frame hand anchor/reflection. Compare all64 original source descriptors against visible source pixels after gamma0.7 palette conversion. This is source-sprite fitting, not SVG comparison. Group4500 is blue; group4400 is the green control. Exact coordinates, candidate errors and scripts remain private in `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/more-spikes/program-review`.

Blue best-fit mean absolute RGB-channel error is0.176–0.289 on a0–255 scale; the smallest gap to the runner-up is51.241. Green error is0.265–0.369, with a minimum runner-up gap64.687. All33 choices for each actor are consequently well separated. No fitted translation or pivot change was needed. The source-mask scoring excludes transparent background; it does not independently qualify background/shadow reconstruction or arbitrary overlap cases.

The fitted blue source-frame sequence is:

`53,49,55,61,60,54,48,55,61,61,54,48,54,61,61,55,48,54,60,61,55,49,53,60,62,56,49,53,59,62,56,50,53`.

The green control advances monotonically modulo64, by202 frames over960 guest ticks: **12.625 source frames/sec when normalized to60 guest ticks/sec**. This agrees with the Child class1 source rate960/(38*2)=12.6316 within sampling quantization. It is not a host-speed measurement.

## Conditional bounce agreement

The source gives both actors class1, initial frame48 (serialized half-index24), direction+1. The blue actor's referenced ordinary program and initial PC1 were verified in the decoded record. Its active commands request bounce. The fixed pivot's up/right neighbor targets are present; down/left are absent. These are static, nonhuman-available dots. A valid facing target is required before reversing, as established by the source audit.

Unwrapping the green frames gives the exact class advances between captures under the bounded assumption of fewer than64 steps per30-guest-tick interval. The measured/source rate is about6.3 steps per interval, far from that ambiguity. Simulating blue integer advance-before-command behavior with those advances predicts **33 of33 observed blue frames exactly**, with no per-sample timing fit. At frame0/right it reverses toward frame48/up; at48 it reverses toward0. It therefore stays in the upper-right arc. The first observed frame53 is already on a descending leg; do not use this screenshot as an initial phase reset.

There are13 inferred turnarounds in the analyzed interval, alternating48/0 and ending at48. Frame48 itself appears in several captures. Frame0 and many other reversal instants lie between the30-tick samples: their exact boundary times are inferred from the qualified integer source model plus the control, not directly observed screenshots. Absolute full turns before the first capture are not determined, though they do not alter this repeated bounce trajectory.

A comparison starting at sourcePC0, which first consumes the Pascal length byte, matches only1 of33 blue captures under the same source initial phase/direction and shared-class assumptions. Thus the native run supports using the decoded PC1→zero-based cursor0 mapping and rejects silently substituting PC0 behavior here. Because the active instructions request the same action, these images cannot distinguish every internal valid PC value or directly prove PC wrap; those remain source-derived facts. The conditional lookup rule is also established by source, while the native trajectory supports its consequence on this pivot. This observation is not a failed-target experiment at every absent neighbor.

## Scope and release

The evidence supports the fixed blue pivot, canonical source frame progression, class1 rate, bounce endpoints and immediate direction changes for this route. It does not establish the full goal path, player controls, sound, transfer/f commands, arbitrary initialPC0 programs, moving-dot targets, slowdown transitions, collision/death/reset fidelity or visual quality of new SVGs. The source model and fitted images must not be promoted into those broader claims.

Raw fits are in `native-fits.json`; source-model comparisons, event steps and decoded neighbor permissions are in `program-comparison.json`; the reproducible fitting script is `fit-native.py`, all private. The public companion JSON retains sanitized frame/timing evidence without maps or program strings. No runtime/helper files were changed, and no new emulator, browser, rendering, build or benchmark workload ran. Files and workload are released to the coordinator.
