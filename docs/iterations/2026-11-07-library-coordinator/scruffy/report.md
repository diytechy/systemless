# Scruffy first pass — 2026-11-07

Outcome: preserved copied fixture, clean monochrome title and a representative Level 1 scene observed in native diagnostics. Gameplay controls and fidelity remain unqualified. No runtime, catalogue, packaging, display default or pacing change is proposed for acceptance.

The coordinator selected this fresh worker for the per-game Sol assignment; tool/model selection is reported from the assignment, not independently verified. Work used mac-game-modernization/tuning and systemless-headless/play guidance. Branch dev was clean at first inspection. The assignment recorded revision beb705fcc9facdf8d274d5fef9ffbccba7860b61 and runtime baseline ed74c8b4; a later read of HEAD was 46de0c845bb28ceec09c3a608c27b55d3a1de0e6 while the coordinator continued other reviews. No worker commits or shared edits.

## Preservation and inventory

Original `D:/SheepShaver_MAC_Emulator/Content/001` was read only. Exact selected folder `Scruffy`, including all seven descendants, was copied with the existing `scripts/extract_owned_game.py` through cached machfs Python into `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/scruffy/scruffy.hfv` (8 MiB). Both forks, file type/creator, flags, dates and coordinates and represented ancestor/selected folder dates were reopened and compared. Folder Finder information is unavailable through machfs. Raw alias forks/fields were retained by the helper; the alias may point to the old volume and was not used or qualified.

Source SHA256 before/after: `82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e`.

Boot SHA256 before/after: `01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393`.

Fixture SHA256: `64e55ca01f875fda451f29f488748efbef39a9366bdbe1c9c29ad72f580eca49`.

Executable `Scruffy/Scruffy` is APPL/SCRF, empty data fork SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, resource fork SHA256 `87471dc52dad1d3fc47ed5975fcdb85ae4102bff72c6f372a8157436d4af02f1`, CODE resources, no vers resource. SIZE 0 and -1 both specify preferred/minimum 819200 bytes; unchanged, no partition override. Clean title identifies “Scruffy Versus The Invaders From Mars”, ©1991 Brian Barnes; exact version unresolved.

Seven preserved files: game, ReadMe!, Scruffy alias, Icon (CR name suffix), Scruffy Mazes, Scruffy Sounds, Scruffy Title. The three data companions were reached by native PBOpen/PBRead. Sounds request exceeds its file length and returns eofErr after reading the available 219314 bytes; no audible-fidelity conclusion follows. Scruffy Scores is absent in selected folder; native PBOpen fails and a following PBRead on refnum 0 returns rfNumErr. Startup continues. A narrow read-only Boot root/System Folder/Preferences scan by title and SCRF creator found no matching preference. This is the selected source/default score state, not preserved score or save compatibility.

ReadMe! was decoded from its data fork in private scratch. It explicitly says requirements were not specified and reports System 7 compatibility. Controls: A left, D right, Space jump, Q bombs, Tab pause, fixed bindings. Goal is to collect bones, use trampolines, then clouds and robot sections; no later level was tested. No blanket depth requirement is established by the ReadMe. The 21888-byte raw title is exactly 512×342/8 bytes and the game window is 512×342; this concrete monochrome-layout clue plus malformed 8-bit imagery justified one finite 1-bit comparison.

## Reproduction and inspected results

Binary `D:/SystemlessBuild/target/ci-test/systemless.exe`, version 0.110.1, SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`; compile revision unknown. No builds. Explicit 68K selection; runtime default 800×600 host framebuffer and classic System 7 theme; exploratory 8-bit and 1-bit guest depth. Private fixture isolated from original media and browser saves. No browser/release entry exists for this title; no browser, conversion, performance or audio capture was attempted. Diagnostic overlap was allowed with another runner and wall times are not comparative performance data.

The guarded private runner uses exact executable selection and this command shape:

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='Scruffy/Scruffy'
D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/scruffy/scruffy.hfv --headless --prefer-classic-68k --screen-depth 1 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/scruffy/controls1.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/scruffy/controls1
```

For other runs replace scenario/output basename with startup, dismiss, play8 or play1; depth is 8 for the first three, 1 for play1/controls1. Outputs are already populated and must not be reused. Canonical commands and all raw capture/scenario/log hashes are in private evidence-manifest.json; runner.py records the exact latest command in owned-process.json. Every input/output/log/ownership path is resolved under this assignment root before redirects or process creation, with fixture/scenario existence checked first. Out-of-scope and missing-input guard probes reject before launch. The runner enforces a 90-second wall bound and persists PID/start/binary/fixture/scenario; every run exited normally. Last process PID112172 exited at 21:39:48 UTC; no owned process remains.

| Scenario | Depth | Frontend ticks | Inspected result |
|---|---:|---:|---|
| startup | 8 | 360 | Frank Software splash; clipped/offset picture |
| dismiss | 8 | 242 | Inspected Rats! click (v293,h462) dismisses splash; title bitmap compressed at left; companions open |
| play8 | 8 | 366 | Play click (v326,h270) reaches Welcome to Level 1; imagery malformed; D/Tab probes inconclusive |
| play1 | 1 | 444 | Clean splash, clean title and Welcome to Level 1 with recognizable monster images |
| controls1 | 1 | 175 | Shorter readiness sequence reaches visible puppy/platforms/bones/cloud initial scene at final two captures |

All five reports say passed, error null, zero budget-exhausted frames and zero assertions. Passed here means scripted actions completed. All image findings are from viewed PNGs, not expected-pixel guesses. No independent reference oracle exists.

The controls1 sequence starts with run20, splash click, run30, Play click, run30, welcome click (v260,h260), run30, held D key2/ch100 for20 ticks, Space key49/ch32 for15, then two Tab key48/ch9 presses with2-tick holds and10-tick observations. Its ready/right/jump screenshots still show Welcome to Level 1. Only captures named pause/resume show the actual first scene. Those names are action labels, not evidence of pausing. Cloud image position differs between those final captures; the puppy remains at the upper-left ledge. Neither documented direction nor jump/pause response was isolated after gameplay readiness. No extra retries were made after obtaining useful bounded first-pass evidence.

## Behavior, limits and next step

| Area | Status |
|---|---|
| Launch/dependencies | Observed splash/title/Level 1 transition; three companion paths resolve |
| Display | Clean 1-bit title/initial scene; 8-bit malformed. No independent renderer attribution or production setting accepted |
| Movement/jump/bombs | Documented; movement/jump probes confounded by welcome transition; bombs untested |
| Pause/menu | Splash/Play mouse actions observed; Tab pause/resume unqualified |
| Motion/timing/fidelity | One cloud difference observed; gameplay pace, collision, scoring and busy scene untested |
| Sound | Data companion read; audible output/fidelity untested |
| Scores/saves | Missing source score file observed; creation and persistence untested |
| Controller/browser | Untested; no release route or benchmark |

Next useful experiment: fresh copied-fixture 1-bit scenario synchronized to the inspected actual Level 1 scene, then separate A/D held/released movement, Space, Q and Tab pause checks. Keep original SIZE. Inspect score-file creation/mapping independently. A release entry needs deliberate coordinator preparation and review; absent entry is preparation work, not compatibility failure. There is no substantial demonstrated missing-service blocker or grounded runtime-fix effort estimate yet.

Evidence root: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/scruffy/`. `inventory.json`, `resources.json`, private ReadMe text, evidence-manifest.json, runner/scenarios, reports and PNGs are durable. Review summary is beside this report. An early read-only inventory print accidentally attempted to decode binary data and hit console encoding failure; it did not write source or fixtures and was replaced by the explicit text-only private export.

Workload released to coordinator after final process exit and screenshot inspection. Changes are only this report/summary and private preparation/evidence. Rollback is to ignore/remove these own files through coordinator review; originals, runtime, catalogue and browser state remain untouched. No push, upload, deployment, shared-helper edit or nested delegation.
