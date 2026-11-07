# The Big One first pass

The original source002 executable identifies itself in About as **Demo version 1.0**, Mark Fong, copyright 1990. The native 68K first pass reaches Level 1, and an exploratory monochrome comparison renders the hero and enemies, responds to right movement, and fires visible bullets. At 8-bit the same scene has platforms and status board but absent character sprites. This is a display-dependent observation without an independent original-system reference; it does not establish a specific runtime defect or a verified required depth. No pacing change is proposed.

## Source and copied fixture

Work used existing `dev`, preserving unrelated changes. The coordinator selected this fresh Sol worker; tool selection is recorded without independently claiming model identity. Modernization/tuning and structured headless/play skills were read and applied. No builds, browser actions, shared edits, commits, uploads or original writable mounts occurred.

Private root: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/the-big-one`. `preservation.json` records source002 and Boot before/after hashes, unchanged, and the application hashes match the assignment. The corrected fixture `the-big-one-corrected.img` has SHA256 `2a2028c977aa3d4bab895544ac58a65e33bd508a6d4c5bd52f3e05d4ca187067`.

Two files were reopen-verified for both forks, type/creator, flags, dates and Finder coordinate bit patterns: the root application and a matching Navigation Services recent-item record under its original Preferences ancestry. Represented ancestor folder dates were retained. Original folder Finder information is unavailable through machfs. Raw alias bytes are preserved; resolution is not established. The recent-item record is not an actual game preference and is not evidence of preference loading. A narrow Boot name/creator scan found no actual title preference. It also found an unrelated Big Ben model and launcher alias; those are excluded from the corrected fixture. An initial broader disposable fixture remains private and was never used for a native run. No named title readme or companion folder exists beside this root executable; useful documentation is embedded in About pages.

SIZE -1 is `00000009600000096000`, preferred/minimum 614400 bytes; no partition override was used. CODE resources establish 68K. There is no vers resource; version evidence is the inspected About page.

## Reproduction and observed behavior

Cached binary `D:/SystemlessBuild/target/ci-test/systemless.exe`, version 0.110.1, SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`; exact compile revision is unknown. Native output is 800×600 with the game's approximately 513×343 canvas. Both 8-bit and 1-bit are exploratory. These deterministic frontend ticks and concurrent diagnostic wall times are not release-browser performance evidence.

Private `run.py` contains the absolute command and checks resolved ancestry for fixture, scenario, output, log and ownership paths before opening outputs or starting a child. It rejects missing inputs/out-of-scope paths. Each child has a 90-second wall bound and durable PID/start/command ownership. Final ownership is exited. Typical command:

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='The Big One'
D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/the-big-one/the-big-one-corrected.img --headless --prefer-classic-68k --screen-depth 1 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/the-big-one/mono.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/the-big-one/mono
```

Six completed scenarios (`startup`, `about`, `instructions`, `gameplay`, `ready`, `mono`) passed with no error, zero assertions and zero budget exhaustion. All relevant images were inspected. Startup title is present by tick120. About is selected at v40,h48; Next at v80,h48 exposes controls and enemies. Begin at v120,h48 starts Level1. The initial short gameplay probe reached the Level1 transition, so its keys were premature and do not qualify input. The corrected readiness sequence waits 330 ticks after Begin (tick452 total), then sends period key47/ch46 for30 ticks and S key1/ch115 for15 ticks. The 8-bit settled capture shows timer97→96 and shots30→29 but absent sprites. At 1-bit, hero moves from near x30 to near x90, enemies advance, visible bullets appear, and shots30→28. The differing ammunition counts are not a firing-rate comparison.

| Area | Evidence / limit |
|---|---|
| Launch and UI | Title, About, Next and Begin work |
| Gameplay/motion | 1-bit Level1 hero/enemies and right movement observed |
| Shooting | Visible bullets and ammunition consumption at1bit |
| Jump | Early 8-bit probe was confounded by transition; unqualified |
| Other controls | Embedded instructions inspected, untested |
| Pause/abort | Command-Q documented as abort; untested; no pause documented |
| Sound | About explicitly says author disabled sound due to a bug; playback untested |
| Saves/controller | Untested; no browser entry or mapping exists |
| Fidelity/performance | No independent reference, busy scene, release browser measurement or qualification |

Documented keys: S shoot, slash kick, comma left, period right, D duck, Space jump, F+Space jump up, D+Space jump down, Command-Q abort. Only period and S have useful settled-game response evidence. Preserve hardware/character pair distinction.

## Checks, limits and next action

Raw scenarios, reports, captures, logs and their hashes are in private `evidence-manifest.json`. Guard tests, source hash comparison, fork/metadata reopen comparison and JSON parsing passed. No assertion/oracle comparison was invented. The 1-bit comparison is a useful candidate for root release preparation, not an accepted catalogue or pacing configuration. Root should independently qualify a 1-bit release scene and remaining gameplay controls/fidelity before publishing support claims. No missing service diagnosis or implementation estimate is justified by this first pass.

Rollback is removal of this title's owned report/scratch only; originals, existing saves and runtime are untouched. Native/extraction workload was explicitly released before final documentation. No further process remains owned/running.
