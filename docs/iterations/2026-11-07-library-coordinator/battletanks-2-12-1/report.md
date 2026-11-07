# BattleTanks 2.12.1 first pass

Outcome: copied fixture prepared; native menus respond, representative gameplay readiness unresolved. No runtime, catalogue, controls or pacing change proposed.

The assigned filename is `BattleTanks 2.12.1`, but its `vers 1` displays `Battle Tanks` and `Battle Tanks v 2.0, by Niklas Frykholm` (numeric header 02 10 80 00). Preserve this ambiguity: the filename is not independently verified version information. Architecture is 68K CODE. Original SIZE preferred/minimum are both 307200 bytes and were retained.

Work used existing dev 70c7a51582c593d3e0a56b93e2a3f12e70ff4b0e; active-worker.json was already modified by coordinator. Assigned worker tool selection was Sol; model identity was not independently verified. Skills: mac-game-modernization/tuning and systemless-headless/play guide. No nested agents, build, browser, commit, push or deployment.

## Preservation

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/battletanks-2-12-1`. `preservation.json` records extraction, hashes, verification and source selections; `manifest.json` hashes private files/captures/scripts. The helper selected exactly the root executable from Content/001, not unrelated applications. It reopened the 8MiB `game.hfv` and compared its one file's forks/Finder fields/dates. Data fork SHA256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855; resource fork deb045396d02eeb9f0b38904677f6d715577eb138535dd61d38ad95e46426ff3. No sibling dependency was established.

001 SHA256 before/after: 82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e. Boot before/after: 01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393. `game.hfv`: 65181d06c52b9c20a2593e95d14fedf8846e55d18e0d18c3066c1f2d0e1995ef.

Mandatory Boot System Folder recursive metadata scan matched title or creator UmÅ2. Only a Launcher Items shortcut and Navigation Services Recent Items alias matched; both preserved separately in `prefs.hfv` (two files verified, SHA25690260f34cb57616044c76d6fc7996c79512c37971e118b87bbba80d5a28d867b). They are not evidence of saved title settings and were not injected into the runnable game. No actual title preference identified; state is fresh/default/embedded, not loaded existing settings. Any undiscovered differently named/different-creator preference remains a limit. File forks/Finder metadata retained; machfs does not expose original folder Finder information. Alias raw bytes retained with derived targets cleared; original-volume aliases are not promised to resolve.

## Native observations and reproduction

Diagnostic executable `D:/SystemlessBuild/target/ci-test/systemless.exe`, version0.110.1, SHA25670062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c; exact compile revision unknown. Explicit `SYSTEMLESS_LOAD_EXECUTABLE=BattleTanks 2.12.1`, `--headless --prefer-classic-68k --screen-depth 8`. Actual default framebuffer is800×600; initial worker message incorrectly planned640×480, but no resolution override was applied. This is an exploratory depth/resolution, not a verified requirement. Original partition unchanged (scenario override null).

Command template, PowerShell:

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='BattleTanks 2.12.1'
& D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/battletanks-2-12-1/game.hfv --headless --prefer-classic-68k --screen-depth 8 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/battletanks-2-12-1/two-player.json --play-output <new-empty-private-directory>
```

Five probes used startup.json/menu.json/new.json/play.json/two-player.json and outputs run1–run5. All returned0, passed action scripts, zero assertions and zero budget-exhausted frames. Longest scenario518/600 frontend ticks; no error/halt. Each completed within9 wall seconds; startup process had an explicit45s wall wait, later scripts returned promptly. No process remained at release.

Inspected startup/later images show menus, Angle/Power arrows and toolbar above a flat green field. File menu opens and File→New opens a1–10-player/name dialog. Read screenshot coordinates drove File down(10,50), move/up(27,64); dialog OK(394,404). One-player typed name setup and a second two-player/name setup dismiss the dialog. Field click at(v300,h550) and later observation through518 ticks still show no tanks/terrain. This is an exact readiness gap, not a demonstrated renderer defect or missing service. No title documentation was found with this root application; no executable bytes changed.

| Area | Evidence |
|---|---|
| Launch/menu | Observed toolbar, File menu, New player dialog and dismissal |
| Gameplay/input | Mouse menu/dialog input observed; playfield click did not establish play |
| Motion/timing/busy scene | Untested; no representative scene reached |
| Pause/menu | File/New observed; pause/resume untested |
| Sound | Untested, no audio assertion/listening |
| Saves | Save/Open menu labels only; persistence untested |
| Controller | Untested |

Native frontend ticks are not wall-time performance. No release browser entry exists, no timing baseline or candidate comparison was made, and no fidelity claim follows from these screenshots. Next: inspect original documentation/reference startup sequence (including whether terrain generation or another Tank menu action is required) with the same selected version, then produce a minimal readiness reproduction before any runtime fix. No missing-service estimate is grounded by current evidence; bound that follow-up rather than guessing an implementation.

Rollback: remove only this report directory and assigned private copies if unwanted. Original media and existing browser saves were untouched. Exclusive native/extraction workload explicitly released to coordinator before report authoring.
