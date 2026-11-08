# Combo saved-scene visual audit

No material correction is requested. The saved browser scene retains the accepted clean silver walls and amber oil treatment with the correct large-board origin(74,72). The new kind0 pool matches the native placement and color. This review is separate from the coordinator's native goal-route acceptance.

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/combo/`. Compared `browser-idle.png` with `native-play-01/initial-after-reveal.png`, using native game rectangle(80,60)–(720,540). Also inspected the existing `native-wake-01` sequence and fitted original Oil sprites. No browser, emulator, rendering, build or benchmark ran.

## Static appearance and inventory

- **Kind0 puddle:** native and browser warm-body bounds are both(268,123)–(283,139). Mean threshold-selected body RGB is native131.76/77.58/0 versus browser133.51/80.21/4.01. The smooth browser fill covers193 qualifying pixels versus native167; that retained rounded-outline enhancement is expected. The dark amber color and small highlight are consistent with the accepted Oil revision. Raw kind0 base(241,105) plus dormant frame4 descriptor is confirmed by the original-pixel fit; do not apply kind1 offsets or move the artwork to its future target dot.
- **Walls:** the75 coordinator-reported tiles retain silver top/left highlights and down-right dark sides. The outer enclosure, right recess, middle T-junction and lower-left branches meet in the same places as native. No material break, wrong-facing bevel or displaced segment is visible. Small smooth cap/seam and shadow differences remain those already documented for Walls.
- **Child inventory:** source records give53 present dots,5 bonus flags,1 goal,4 spikes and1 kind0 puddle. Visible hands are the human and one red enemy. The blue type3 actor has mask14 and is excluded at Child activeMask1; the second human is separately hidden. All four spike masks and the puddle mask are15. The screenshots agree with that visible inventory. Counts are source-derived, not an automated count of partly occluded screen objects.
- **Dot colors:** Child selects color-mode bit0. The red bonus pivot at row5,column8 is red in both scenes; the red hand overlaps it, so its complete bonus-ring appearance is partly obscured. The dot at row6,column5 carries the higher-difficulty blue nibble0xe000, whose Child bit is absent, and correctly appears neutral here. That color selection is separate from actor activation. Other visible dots retain the accepted smooth metal/shadow treatment.
- **Text and phases:** the two instructions appear in the expected regions. Native Geneva versus browser font weight/width remains a shared limitation. Hand angles, spike phase and attention sparkles differ between capture times and were not judged as synchronization errors.

Read-only hashes confirm all51 Combo QA payloads exactly match the accepted Oil QA payloads. The scene manifest is intentionally separate and was not edited in this audit.

## Kind0 wake/approach evidence

The private `visual-review/native-frame-fits.json` records the initial capture plus24 existing wake samples. Fits use original gamma0.7 colored pixels at the source bases, excluding gray shadows. The rotating yellow human overlaps the pool in several samples; large errors in those samples are not treated as phase proof.

Initial and wake-idle01 match dormant frame4 at error0.407. Clean waking observations are idle05/frame7 at tick2532 (0.422), idle06/frame6 at2562 (0.426), idle10/frame5 at2682 (0.428) and idle11/frame4 at2712 (0.407). Repeated frame4 cannot establish the exact trigger tick. Approach is clearly visible at idle12/frame10, tick2742 (0.462), and idle13/frame13, tick2772 (0.430). Idle14 best matches frame16 at2802 with error1.451 and partial overlap.

Idle15 at2832 visibly has a droplet on the parked human's pivot; original DP frame0 at raw base(250,105) fits with error2.256 under the hand overlap. Idle16 visibly shows the death explosion. By idle21, tick3012, the human has reset and the dormant pool again matches frame4 at0.407, continuing through idle24. This supports kind0 waking, approach, occupied-dot spawn and reset. Reason10 follows the source occupied-dot rule and the coordinator's behavioral interpretation; no numeric death reason can be read from these pixels. Exact trigger/spawn/death ticks, hidden sprite traversal and full pursuit are not established by30-tick sampling.

## Release

Only this sanitized report/JSON and private `combo/visual-review/fit-existing.py` plus `native-frame-fits.json` were written. Runtime code, assets and manifests were untouched. No additional workload remains; files and workload are released.
