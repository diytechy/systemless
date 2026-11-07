# Balderdoush 1.04i first pass — 2026-11-07

Native default-state gameplay smoke observed. No runtime, catalogue, pacing or browser-state change. Tool selection was supplied by coordinator; model identity was not independently verified. Used mac-game-modernization and systemless-headless skills.

## Preservation and requirements

Read-only Content/001 extraction selected the complete Balderdoush 1.04i folder: executable, readme, BDD_Game1, Boulder CWS and two raw aliases (six files). Reopened generated game.hfv and compared every selected fork/Finder field and represented folder date. Original folder Finder information is unexposed by machfs; aliases retain raw bytes but may still target the old volume. No claim of alias resolution.

Executable APPL/DASH has CODE/68K and original preferred SIZE819200, unchanged; no partition override. Readme explicitly identifies release1.04i dated26/11/94 and recommends640×480/256colors, permitting2/4/16/256colors or greys. Native probe used exploratory800×600×8 (native defaults for dimensions), not a verified browser configuration. Both BDD_Game1 and Boulder CWS are retained; log confirms BDD_Game1 opened/read. No editor executable substituted.

Mandatory narrow Boot/System Folder/Preferences title/creatorDASH metadata check found only two Navigation Services/Recent Items aliases. Both copied separately to prefs.hfv with forks/Finder fields verified. No real Balderdoush.PREF was present in that check; native PBOpenDF explicitly returns fnfErr for Balderdoush.PREF. This is a fresh/default-state check; the aliases are not settings, and their native path reachability/loading was not claimed. Actual preference creation, mapping and persistence remain unverified. No original/user preferences modified. All registration/private values remain outside Git.

Source001 before/after SHA256: 82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e. Boot before/after: 01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393. Game fixture SHA256: 6b417a8e4055b0cdd2abd7dce60be5f7b05b6fa2fd54911e0a8aeb8c6fec442f. Detailed private preservation.json, executable.json and manifest.json contain remaining hashes and private evidence paths. No source disk mounted or launched writable; no saves imported/exported/replaced.

## Reproduction and evidence

Checkout dev7b71bd9923c3ef1810e7351e88b626798098d676; supplied runtime baseline ed74c8b4. Reused D:/SystemlessBuild/target/ci-test/systemless.exe version0.110.1, SHA256 70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c. Its exact compile revision is unknown. No build performed. Native frontend ticks do not establish browser wall-time performance; no CPU/performance comparison attempted.

Private evidence root: D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/balderdoush-1-04i.

Command (PowerShell environment plus CLI):

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='Balderdoush 1.04i'
D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/balderdoush-1-04i/game.hfv --headless --prefer-classic-68k --screen-depth 8 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/balderdoush-1-04i/play.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/balderdoush-1-04i/play
```

play.json max_ticks170: run120/title; Game mouse down(v403,h283), run2/up, run6/status; Space49/ch32 down,run2/up,run10/play; right124/ch0 down,run8/up,run2/right_input. Inspected all four PNGs: title with Game/level01; status showing3men/level01/score0 and Space prompt; level playfield; subsequent scene shifted left32pixels and a dug passage beside the centered player. This is evidence of a brief horizontal input response, not collision/scoring/timing fidelity.

play/report.json passed150frontend ticks, guest_tick750, zero assertions, zero budget-exhausted frames, no error. Without assertions, success means actions completed; screenshots supply the observed behavior. No independent reference used. An earlier longer startup scenario (max400; run120/capture,run240/later) was self-aborted at its90second wall cap with only the inspected title capture; no final report/counters are available. This is an incomplete observation, not a compatibility failure or proof of a missing service. Only its exact owned PID was stopped. Subsequent play probe completed within its own90second cap; no processes remain.

## Behavior and limits

| Area | Evidence |
|---|---|
| Launch/readiness | Observed title, Game button, level01 status and playfield |
| Input/motion | Brief right-arrow response and horizontal scrolling/digging observed |
| Gameplay fidelity/timing/busy scenes | Untested; no original reference or real-time measurement |
| Menus/pause | Menu bar visible; menu interaction/pause untested |
| Sound | Untested; no audible fidelity claim |
| Saves/preferences | Missing .PREF/default state; persistence untested |
| Controller | Untested |
| Browser | No entry/route compiled; performance unmeasured |

Readme documents configurable arrow/numeric directions, Shift/pick-up combinations, pause and level/game escape. Actual pause/escape bindings remain unverified. No pacing setting recommended.

## Changes, rollback and next step

Only own docs and assigned private scratch changed. Reused extractor unchanged; no shared-helper edits or synthetic helper tests needed. Verified source/Boot hashes after testing and JSON evidence parse. Private fixtures may be removed independently; originals and runtime unchanged, so no runtime rollback required. Native/extraction workload explicitly released before documentation.

Next: coordinator review and isolated catalogue preparation with stable new save identity, explicit executable and original819200 partition. Root can then inspect documented640×480×8 in the browser, verify Keys/preferences persistence and measure an actual level baseline. No expensive release build, deployment, upload, commit or push authorized/performed here.
