# Koji the Frog 2.0.4 — worker evidence, 2026-11-07

Outcome after coordinator follow-up: retain the unchanged25 MHz baseline. Three complete visible/focused release-browser captures now establish near60 guest ticks/sec in initial Level1. Native evidence and the original subagent browser limitation are retained below as historical worker evidence; no tuning candidate is accepted.

## Reviewed coordinator browser outcome

Reviewed [coordinator-browser.md](coordinator-browser.md), the three raw capture JSON files, summary reducer and resource provenance. Independently recomputed `(lastGuestTick-firstGuestTick)/sampledSeconds`:59.958624545,60.127884306,59.902575811; median59.958624545, range59.902575811–60.127884306. All report complete, visible/focused, WebGL and actual25 MHz. Sampled rate intervals are19.980445,19.990725,19.999140 seconds; resource pairing uses the slightly longer full capture wall interval. All three resource-file hashes match the saved summary. CPU coverage is partial for run1 and full-span for2/3; aggregate browser/Codex CPU and memory include unrelated tabs/chats and cannot be attributed to Koji. Polling intervals at capture edges may straddle a boundary; this is context rather than isolated game profiling. Initial bonus varies, so repetitions are comparable first-level workloads rather than deterministic identical states. Excluded uncontrolled run0 remains excluded.

Coordinator-observed browser insects/bonus progression after resume, right movement and visible jump address the native sequence's inconclusive resume/jump observations without altering those native results. This review checks the recorded evidence and claims; it does not claim an independent second visual observation. Water, original-reference pace, audio fidelity, demanding scenes, saves and hardware controller remain unqualified. There is no demonstrated initial-level guest-clock deficit supporting a lower instruction budget. Browser timing is no longer globally blocked; only this worker's attempted IAB visibility was blocked. Further work should prioritize qualification or a repeatable demanding scene, not repeat the now-completed initial browser baseline.

## Provenance and preservation

Started on `dev`, HEAD `c6e0660fd82119c8b94294236a62d0fc30f7ac7d`, clean status. Runtime baseline supplied by coordinator: `ed74c8b4`; intervening commits are inventory/report work. During the run the coordinator modified its inventory classifier and queue; those files were not edited here. No build, commit, push, deploy, source-media launch, executable patch, preference reset or browser-save mutation occurred. Scratch fixture is a byte copy of ignored `www/private/koji.img`; original SheepShaver images were not opened by this worker. Prior extractor preservation evidence remains in the linked verification record; this worker rechecked the copied executable forks, not all original media.

- Image: 8 MiB, SHA256 `41134e4b3fa4fe6dfc38d03d4abcde84dd6997f8a339d4d51a8c014270a6a092`.
- Executable data fork: `96350718f393f9743594058d5dc54029ed08d548c42260b4d280967f1b9c1746`.
- Resource fork: `8ce7bcd91501814979c67663b073d3cde6bdd17656b2498ac96c10588fed18d6`.
- Finder type/creator: APPL / Koji; CODE and cfrg resources present. Deliberate 68K choice retained for this fat application.
- Existing release WASM SHA256: `aa25ac7a47cbd323ce6b4909892db2158f3d4e7d03d8346575949e5e5840674c`; no rebuild.
- Native executable reused: `D:\SystemlessBuild\target\ci-test\systemless.exe`, 53,767,168 bytes, last write 2026-11-06 20:06:24 local. Reports identify Systemless 0.110.1; exact embedded source revision not established. Native results therefore do not certify current release browser behavior.

`www/private_koji.rs` keeps executable `Koji/Koji the Frog/Koji the Frog 2.0.4`, display 640x480 / 8-bit, ID `koji-personal-204`, both registration-file mappings, and no partition override. Its base catalogue selects 68K. Copy resource inspection found SIZE -1 flags22720, preferred/minimum 2,560,000, no SIZE0. Runner source chooses explicit override or valid preferred SIZE, subtracting 8192 stack margin and applying safe-limit clamping (`runner/mod.rs` around4310). Thus source configuration requests 2,560,000; the actual live heap limits were not instrumented. `report.application_partition_size:null` means no explicit override, not an unlimited partition. Default browser pacing remains25 MHz /2 catchup /4 reset slack /no adaptive minimum. Native runner does not reproduce that browser scheduling policy.

## Browser attempt and next capture

Only attempt, exact supported tool call:

```javascript
let tab = await cua.createBrowserTab("iab", "http://localhost:8087/koji-the-frog/?profile=1", { visible: true });
```

Exact result: **IAB visibility is not supported in a subagent thread**. No follow-up UI input, no retry, no Windows Computer Use, no alternative browser automation. Browser version, renderer, actual worker mode/cpuMhz, wall-time sample interval, host CPU samples, output scale and timing measurements are unavailable here. Valid baseline/candidate captures:0/0; median/range: not available. Do not substitute native elapsed time or frontend ticks. Coordinator later reported supported IAB access from root context and owns that follow-up separately.

Root capture procedure: use unchanged release URL above, verify profiler actual worker/renderer/cpuMhz25 and browser/output dimensions. Click/focus game; P starts from title. Readiness is HUD Level1, Score0, Bonus near1950, Drops1, Lives4 over cyan water with a full lily-pad grid, flying insects and Koji at bottom center. Wait through transition; native readiness was after title180, P held2, then120 frontend ticks, which is a structural guide and NOT a browser wait duration. First collect20s visible/focused idle capture with paired timestamped host CPU samples. Record actual settled HUD/scene. Separately check bounded L/J movement, Space tongue, P pause and secondP **actual animation resume**. No lower-MHz candidate is justified before a baseline and original/reference fidelity check. If considering one, use three valid alternating captures per setting under comparable load.

## Native reproduction and observations

Private scratch: `D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\koji`. Scenarios, original PNGs, console logs and raw reports remain there; screenshots are private and title image includes registration text, so none are copied into reviewable documentation. All described screenshots were visually inspected. Native framebuffer is800x600, 8-bit; Koji centers its640x480 area. This differs from the browser framebuffer and is not a pixel-identical browser reference.

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='Koji/Koji the Frog/Koji the Frog 2.0.4'
& D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/koji/koji.img --headless --prefer-classic-68k --screen-depth 8 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/koji/behavior.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/koji/behavior-new
```

Output must be a new empty directory. The saved `make_scenario.py` regenerates the exact structured actions. `probe.json` title/start run passed302 frontend ticks, no assertions, zero budget-exhausted frames. `behavior.json` passed489 frontend ticks, guest_tick1089, two assertions, zero exhausted frames. These counters are simulated clocks, not rates. Actions: title180; P(35,112)2; settle120; cyan pixel assertion at90,110 RGB0,179,255; keypad6(88,54)12; keypad4(86,52)12; Command(55,0)3; run4; P2; run60; P2; run12; Space(49,32)12; Control(59,0)2; run6; audio assertion60 ticks, min_non_silent1. Every held key has an up event. Full sequence and PNG checkpoint clocks are in private scenario/report.

| Area | Result and boundary |
|---|---|
| Launch/title/level | Observed title and Level1; no guest halt. Cyan readiness pixel passed. Not a full playthrough. |
| Movement | Keypad6 moved bottom-center Koji approx x400 to424; keypad4 returned near400 after12 ticks each. No original timing comparison. |
| Tongue | Command produced visibly extended red tongue. Catch/scoring not established. |
| Pause | Red GAME PAUSED appears; playfield crop x80..720,y75..540 identical over60 further ticks (0 changed pixels). Native menu bar appears while waiting; excluded from crop. |
| Resume | SecondP removed text (258 changed pixels) but following12-tick jump and8-tick water sequence each had0 field pixel changes. Actual animation resume not established; investigate input sequencing in browser before claiming defect or pass. |
| Jump/water | Inputs delivered after pause attempt; no visible change. Inconclusive, not qualified. |
| Busy scene | Initial Level1 insects observed only. Later/busier levels untested. |
| Menus/focus/fullscreen | Native title start only; browser transitions/focus/fullscreen untested here. |
| Audio | At least one non-silent sample detected over60 simulated ticks; no listening/music/synchronization/fidelity claim. |
| Saves | Original packaged preferences retained, browser origin/save ID unchanged; export/import/reload persistence untested. |
| Controller | Source mapping inspected; no physical hardware test. Existing adapter test evidence is historical, not rerun here. |

Pause pixel counts are from `compare.py`, using Pillow image differences over the stated playfield crop. Screenshot repeatability is not independent oracle evidence. The absent jump/drop changes may be a native event/modifier sequencing issue; no runtime defect or fix is inferred from this single sequence.

## Changes, checks and recommendation

Only this report and non-sensitive `attempt-timing.json`/`native-report.json` are new reviewable files. No runtime/global/game setting changed. JSON parses; `git diff --check` completed. No expensive build or redundant runtime tests for documentation. Rollback: remove these worker documents; private scratch can be retained for follow-up. No game/runtime rollback needed.

Retain25 MHz. Next useful action is coordinator-owned root IAB unchanged-release baseline, including actual resume validation; then decide whether a measured bottleneck warrants any one per-title experiment. Audio fidelity, original reference pace, busy levels, saves and physical controller remain explicit qualification gaps. The older Koji1.0.2 inventory entry remains supplementary and was not substituted or launched.

Prior evidence: [verification](../../2026-11-06-private-library/verification.md), [owned-copy findings](../../2026-11-06-koji-browser/findings.md), [worker assignment](../koji-brief.md).
