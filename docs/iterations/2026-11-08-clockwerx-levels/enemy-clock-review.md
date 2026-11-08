# Enemy clock audit: Doors class4 resolves the rate

The Doors green hand uses **rawWords[7]=4**, selecting source multiplier1/divisor8. Its observed quarter-hero speed is therefore consistent with the source. The earlier assumption that Doors selected class1 was wrong: rawWords[6]=1 was confused with rawWords[7]. No hidden difficulty multiplier is needed. Root's nine sprite-matched samples show frames 6, 7, 9, 11, 12, 14, 15, 17, 19 over 240 guest ticks. Root subsequently confirmed the actual green-actor clock pointer, saved class4 and current divisor8 in live native memory; all six read-only assertions passed at guest tick1668 with zero exhausted budgets.

This was a read-only source audit on `SVG-Port`, using the mac-game-modernization skill. No runtime code, native run, browser, emulator, build, benchmark, media, save, asset, or commit was changed. The report is sanitized; binary code and disassembly remain private.

## Verified source chain

- `PAInit`, CODE7:3710–3738, sets the base parameter to 47 and the related parameter to integer 47*4/3 = 62. No later direct writes to the 47 parameter were located.
- `GPInit`, CODE1:56e4 onward, initializes master-rate choices to 60, 75, 100, 150. `GPNewGame` at 5a2e passes its difficulty field to `GPSetMasterRate` (585a–5876); the same field is copied to the active difficulty at 5a42 and passed to round preparation at 6a1c. Thus Child index 0 selects master 60. This chain does not apply a distinct enemy multiplier.
- The initial DATA image has master and secondary scaling values 100, 100. `MTAdjustPeriod`, CODE7:3656 onward, applies nested integer period*100/master and then *100/secondary. Only the master setter was found in the inspected source; no direct secondary-value overwrite was found. This is a static-source finding, not a native RAM observation.
- `WAInit`, CODE6:bff6–c072, requests scalable period floor(47/2)=23. The registered scalable 23-unit base gives client divisor 1. At Child 60 and secondary 100, the adjusted base period is 38 units. The established guest timer uses 16 units per guest tick, yielding 960/38 common counts per normalized 60-tick second. `MTLatch` uses strict remainder>divisor; this affects boundary phase, not a sustained factor of four.
- `WAInit` copies six constant multiplier/normal/slow arrays into 28-byte records. The decoded initial arrays are respectively `[1,1,3,1,1,1]`, `[2,2,8,4,8,1]`, and `[2,4,16,8,16,2]`. These are initialization values, not verified live values.
- `WAStart` (c18e–c19c) forces a transition through `WASetSlowdown(false)`. `WASetSlowdown` (ec24 onward) copies normal or slow divisors for classes 1–5; it leaves hero class 0 untouched. Class1 has normal2/slow4; Doors class4 has normal8/slow16.
- `WASpec2Info`, dc08–dc2a, indexes the clock array directly by signed word at spec+14, stride28. `WAStream2Spec` reads that word without a remap. `WA_Create` copies the spec and passes it to this routine. No difficulty-dependent class remapping was found.
- `WALatchTimer`, e6fa–e790, obtains one common delta, clamps it against the hero accumulator, then adds delta*multiplier to each class accumulator and repeatedly subtracts its current divisor. Hero and enemy frame callbacks each loop their corresponding class's resulting delta. `SUAutoFrame`, CODE4:3de2–3e4a, advances by the signed sprite step; no extra enemy quarter-step was found.
- Inspected `WAGetTimerPtr(1)` callers attach clock pointers to dot sprites through `DOUseTimer`; those paths do not overwrite the WATimer multiplier/divisor fields. No extra overwrite is required to explain Doors.

## Child-active actor classes

This inventory applies activationMask&1 and retains the serialized type6 second-human record, although it is hidden in single-player. Positions and complete map records are omitted. Values were read directly from the coordinator-reviewed RND2 files, not inferred from color.

| Round | Child-active actor types, in source order | Corresponding rawWords[7] classes | Nonhuman normal rate relative to hero |
|---|---|---|---|
| Movement151 | 0,6,1,2,3 | 0,0,1,1,1 | 1 for each class1 demo actor |
| Spikes221 | 0,6,2,3 | 0,0,1,1 | 1 for both class1 enemies |
| Walls222 | 0,6,2 | 0,0,1 | 1 for the Child-active class1 green enemy |
| Doors223 | 0,6,2 | 0,0,4 | 1/4 for the class4 green enemy |

Walls also contains three Child-inactive enemy records (masks14,12,8); each selects class1. Do not activate them for Child. For classes0/1/4 respectively, normal multiplier/divisor ratios are 1/2,1/2,1/8 common counts; slow ratios are 1/2,1/4,1/16. Thus normal Child source rates are 12.6315789,12.6315789,3.1578947 source frames per normalized second. Class1's source-derived equal rate remains valid for the corresponding records; this Doors experiment does not independently measure those other scenes. Frozen Movement timing/phase is a separate integration boundary.

## Identity and native evidence

The read-only archive used by the native Doors run hashes to `03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4`. Its ClockWerx resource fork is byte-identical to the private source fork, SHA256 `522b65b20f89eca12139d6d488c9636ce3138099379ef8b7a59734f563a828b3`. All extracted CODE and DATA resources were separately compared with that fork and match. A different application release is therefore excluded for this evidence.

Root's native matching uses the independently qualified small-board anchor and group4400 source art. All nine best fits have mean absolute channel error 0.265–0.331. The measured 13/240*60 = 3.25 frames per normalized second is consistent with class4's 960/(38*8) = 3.1578947, allowing endpoint quantization, and inconsistent with 960/(38*2) = 12.6315789. The experiment establishes native angular progression in this scene; it does not measure host performance.

Private evidence: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/doors/native-enemy-clock-review.json` and `doors/native-play-01/`; disassembly and reconstructed initialization image are under `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-starbursts/`.

## Integration boundary and pending pointer confirmation

Use each actor's rawWords[7] clock class. Doors class4 multiplier1/normal divisor8 is source-derived and consistent with native measurement. Do not globally slow class1 to match Doors. Root owns runtime changes; this audit makes none. Other difficulties and slowdown transitions have source semantics but are not native-qualified here.

Root's initial native probe confirmed CurrentA5=0x5e6000 and class1 current divisor2; this is correct and does not inspect Doors' selected class. The minimal pending actor probe is: WAInfo base=A5−0x4218, stride108, green slot2 at0x5e1ec0; its clock pointer at+0x52=0x5e1f12 should contain0x005e1c7c (class4). Word probes: 0x5e1f12=0x005e, 0x5e1f14=0x1c7c; stored spec class word at0x5e1f24=4; class4 divisor low word at0x5e1c8a=8. These expected values are source predictions pending root's native probe. No additional native workload was launched by this worker.

Source audit and report writing are released. No active workload or file ownership remains.

Root confirmation: `doors/timer-probe-02/report.json` passed all6assertions, including the pointer, stored class and current divisor. The predictions in the source-worker handoff above are now independently observed. `doors/native-hero-clock-review.json` additionally fits nine hero frames (9through60 over240ticks), consistent with class0 and a four-times-faster hero. These are guest-clock behavior checks, not resource benchmarks.
