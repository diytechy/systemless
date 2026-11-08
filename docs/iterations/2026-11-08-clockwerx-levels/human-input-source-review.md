# Human input source mapping audit

Source-only audit prompted by More Doors transfer13. No runtime, bindings, preferences, native scenarios or existing recovery reports were changed. No emulator/browser/build workload ran. The coordinator identified that the failed script used key49/character32, not the intended key55/character0. This audit confirms Command55 as the source swing input; it does not attribute the original failure to Command handling.

## Ordinary held controls

WAInit, CODE6:bbc2-bdfe, constructs fixed 128-bit key maps. WAGetKeys:c822-c88e tests them using GKTest (jump2b02 resolves CODE5:26a8), an any-intersection test. For player0:

| Source map | Virtual keys | WAAction flags |
| --- | --- | --- |
| A5-0x424e | 7,47,55 | G=1, B=0: swing/transfer with reversal |
| A5-0x426e | 44,6,58 | G=0, B=1: target-dependent bounce |
| A5-0x428e | 56,59 | G=1, B=1: forward transfer without reversal |

The both-flags map has priority. Otherwise the grab and bounce maps are tested independently, so holding an input from each also yields G=1,B=1. Command virtual key55 therefore maps to swing. Control59 maps to forward transfer (called flip in the existing native scripts). Space49 is absent from all three ordinary action maps. Character bytes are not used by this GetKeys bit-map path.

WADirectHero:c8ae-ca90 gates ordinary actions on canonical frame modulo16 ==0 and the actor not already won. It reads held state with GetKeys atc8e8, then calls WAGetKeys. Thus holding an action is not a single high-level command: it can act at successive eligible cardinals. The code also supports a buffered-input record when live keys are absent; its use is controlled by player settings and, in one branch, a wrapped frame-distance window <=2 or >=62. It clears that pending record after the eligible decision. This audit does not infer the fixture's buffering preference from the static default A5 image.

The collision/sliding input flag supplied to WADirectHero can invert B in its c9be-c9de branch when an action exists. The plain mapping table assumes that flag is false; do not apply the table blindly to a source collision-response step. The direct reverse latch is processed separately after the ordinary action block.

## Target gates and repeat guards

WAAction:c6cc obtains DOCanGrab before any reversal. Failure exits atc6d8. DOCanGrab:449c-44d4 selects runtime human availability +0x11, independently of color and nonhuman availability +0x10. A collapsed ring therefore denies human bounce as well as transfer. Missing ordinary targets also deny both, subject to the separate human wall/edge fallback outside this static-dot case.

For an eligible target, WAAction:c710-c728 reverses on G XOR B; G then calls WAGrabDot. The human last-target guard atc6de-c6f4 prevents reusing the remembered destination at the same cardinal. WADirectHero clears that remembered target on noncardinal/not-eligible passes atca36-ca40. Native held-window tests must account for integer cardinal sampling, collision flags, target availability and the guard; host key-repeat events do not replace those rules.

## Direct reverse: source/default and observed fixture differ

WAInit:bcd4-bcf8 constructs a separate player0 reverse map at A5-0x42ae containing keys **49,58,55**. WAPeriodicProc:e7c6-e7fa tests it through jump2b0a. The initialized A5 jump table resolves that entry to CODE5:26fe, GKAllTest. Its26fe-274c implementation requires every bit in the first map to be present in current GetKeys; it is not the any-key GKTest function. On this static source chain, the default reverse combination is Space+Option+Command, not Space alone.

A false-to-true test transition calls WAReverseKey:c7ca-c80c. While play is enabled and the actor has not won, that function toggles a pending reverse Boolean and requests sound21. Holding the combination does not repeatedly enqueue reversals because WAPeriodicProc retains the previous Boolean. WADirectHero:ca44-ca7a consumes/clears the pending flag; when its collision/action/input-suppression guards allow, it directly calls WAReverse, including outside a cardinal. This direct reversal has no DOCanGrab target requirement.

The coordinator's recovery evidence reports that modeling the actual Space49 window as one direct reversal reproduces all20 observed native poses. That is strong fixture-specific behavioral evidence, and the wrong-key script correction to55 is independently source-consistent. **This audit has not reconciled that Space-alone result with the inspected static all-bits reverse map.** It would be inaccurate to label Space-alone as a fully source-proven default binding from these instructions. No guessed preference or emulator defect is assigned as cause.

Read-only script inspection confirms transfer13's keydown/up actions96/98 contain49/32, with only49 held according to the scripted key event sequence. The action adapter in `src/bin/desktop/play.rs` forwards raw key/ch; the headless adapter calls runner.push_key_down; the runner applies configured arrow remapping and forwards the key; dispatch sets that key's held bit and leaves it down until keyup. These reads do not establish the actual guest GetKeys bitmap at transfer13. The static initial-a5 artifact predates WAInit (all three ordinary action maps were zero there), so it is jump-resolution evidence, not a live preference/key-map capture. No guest disk or save was opened or modified.

If a later already-authorized diagnostic needs to distinguish the discrepancy, minimal read-only state is current A5 plus the16 bytes at A5-0x42ae, current GetKeys/low-memory KeyMap, previous reverse-test byte A5-0x442c and pending reverse byte A5-0x43fc for player0. Ordinary maps are listed above. This is a proposed observation contract, not a request to launch another runner. A corrected Command-only native replay can qualify the intended route without solving the separate Space binding discrepancy.

Private excerpts and the small key-event audit are retained under taskroot `more-doors/input-source-review/`. Sanitized Markdown/JSON and the source workload are released to the coordinator. No control help or mapping documentation was rewritten to assert the unresolved Space-alone interpretation.
