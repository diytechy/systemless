# Delirium 1.1 bounded native evaluation — 2026-11-07

Outcome: unchanged baseline, useful behavior evidence; browser performance belongs to coordinator's subsequent serial capture. No runtime, catalogue, preference, input or pacing changes. Default 25 MHz remains. No candidate justified by native evidence.

## Provenance and preservation

Checkout dev, HEAD 555d3365; clean status at worker start. Runtime source baseline ed74c8b4. Reused D:\SystemlessBuild\target\ci-test\systemless.exe (reports Systemless 0.110.1), no rebuild. Existing diagnostic executable is not a release-browser performance baseline and its precise compile revision was not independently reconstructed. Copied www/private/delirium.img to disposable fixture under D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\delirium. Image SHA256 61a613f62995f9494a7ea0947de0fccce0a6e390c0d2339f66f64d489e015bf5 matches extraction manifest. Original 001 SHA256 82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e matches manifest. Reopened source001, Boot and copied image read-only: four files match data fork, resource fork, Finder type and creator (fork-verification.json). No original media write or browser save operation. Native runner does not persist adjacent saves. Save identity remains delirium-personal-11.

## Exact reproduction and readiness

Private scenario and all eight inspected PNGs: D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\delirium\behavior.json and behavior-run. Log: behavior.log. Set SYSTEMLESS_LOAD_EXECUTABLE=Delirium/Delirium 1.1 Folder/Delirium 1.1. Run systemless.exe fixture.img --headless --prefer-classic-68k --screen-depth 4 --play-script behavior.json --play-output behavior-run. Scenario partition2048000; frontend_ticks clock; max1800; completed840. CLI inherited800x600, unlike catalogue640x480; game content is fixed640 pixels wide, centered, with native bounds x80..720,y107..493. This is an explicit geometry limitation, not a browser configuration change.

Readiness sequence: run240 frontend ticks; click native center(320,240) with3 held ticks; wait120 -> HALL OF FAME with bottom Play button. Click native(560,414) with3 held ticks; wait90 -> playfield with PREPARE TO MEET THY DOOM; wait180 -> settled active field and ship about(211,319). This click succeeded despite button snapshot coordinates being lower; browser should target the actual visible Play button. In640x480 expected content offset changes by(-80,-60), so native visible Play center(647,474) translates to guest(567,414). Confirm screenshot before clicking. Do not translate frontend ticks to required wall-time waits.

At active field, hold Mac key55/ch0 (Command) plus key91/ch56 (keypad8)40ticks, release both. Wait20, hold key84/ch50 (keypad2)40ticks, release. P=key35/ch112 held2ticks, release, wait10. Wait60 paused. Space=key49/ch32 held2ticks, release, wait30. Browser controls: Up/Down mapped to saved keypad directions, Z fire, P pause, Space resume. Use short visible holds and observe the field before profiling.

## Observations and limits

| Area | Result |
|---|---|
| Launch/menu | Hall of Fame then active playfield observed; no former Module failed5 |
| Movement/input | Ship moves upward about82pixels after keypad8; keypad2 returns close to initial height. Combined Command produces horizontal projectile. Held key releases issued. Exact independent control/physics calibration untested |
| Pause/resume | Native message GAME PAUSED - PRESS ANY KEY TO RESUME. paused and pause-later PNG SHA256 identical after60ticks; Space removes message and enemy changes position |
| Busy scene/timers/scoring | Early enemy observed; representative late/busy scene, timer accuracy, collision and scoring unqualified |
| Audio/music | Not asserted or listened to; untested |
| Saves | Mapping/source preserved; browser export/import/reload roundtrip untested |
| Controller/focus/fullscreen | No physical hardware or browser transition check in worker |
| Reference | No original/reference emulator run; no independent fidelity oracle |

native-report.json: status passed, zero budget-exhausted frames, eight checkpoints, zero assertions. Passing means actions completed. Claims above come from inspected screenshots; pause equality additionally checked by SHA256. Native guest/front-end clocks do not measure wall-time performance. No timing repetitions, median, range or candidate comparison from this worker. No invalid timing capture; no browser attempted per coordinator's supported-surface ownership rule.

## Attempts, changes and next step

Only docs/report JSON written in authorized report folder; scratch outside repository. First offline uv command used default cache and failed resolving machfs; corrected UV_CACHE_DIR=D:\SystemlessBuild\uv-cache and pinned machfs1.3, read-only validation succeeded. No build/test suite needed for documentation. Native workload released to coordinator immediately on completion; no additional emulator/build started. Rollback is removal of this report folder; private fixture may be retained for reproduction.

Coordinator next: visible release IAB /delirium/?profile=1, unchanged25, confirm worker/cpuMhz and actual640x480, settle active field, capture three comparable visible20second idle samples with CPU metadata. Supplement short Up/Down/Z and pause/resume checks separately; do not let native run concurrently. Candidate only after measured bottleneck and fidelity rationale. Keep configuration unchanged without repeated performance and reference evidence.

## Coordinator browser experiment early-stop review

Subsequent coordinator evidence is reviewed in candidate-review.md. Default25 had three complete/focused captures at58.0102001/56.4616985/55.7971765 guestHz. Exploratory12r1 was complete/focused, actual12,60.1486918 guestHz and4.712685ms mean execution. However, candidate entry had score100 and no visible ship while default entry had score0 and a centered ship. Uncontrolled action-to-capture delays prevent distinguishing unequal scene readiness from gameplay pace divergence. Candidate browser-test12-r1-unmatched.json must remain labeled unmatched: neither a controlled performance win nor a demonstrated regression. Coordinator stopped planned alternating pairs; review endorses this early stop. No candidate promoted and default25 unchanged. Timing-controlled startup checkpoints and independent pace/audio/save/busy-scene evidence are required before renewed comparison or adoption. Root owns raw browser evidence and final browser summary.
