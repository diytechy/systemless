# Bedlam 1.1 first pass — preparation and native readiness gap

Bedlam 1.1 launches its menu and accepts New Game in the existing native diagnostic. The finite follow-up reaches cockpit travel messages, including “Prepare for Battle!” and “Traveling To Pluto,” but does not reach an inspected alien-wave battlefield. This is useful preparation/startup evidence with an unresolved gameplay-readiness gap, not a compatibility failure or performance qualification. No pacing change is proposed.

The coordinator selected a separate gpt-6.1-sol worker; model identity was not independently verified. Work used the modernization/tuning and systemless-headless/play skills. Checkout was `dev` at `6225f407c124a900fd266099c447ceae6056f531`; the unrelated coordinator active-worker.json modification was preserved. No code, catalogue, build, browser, save state, commit or deployment changes occurred.

## Preservation and inventory

Source is read-only `D:/SheepShaver_MAC_Emulator/Content/001`, folder `Bedlam 1.1`, exact executable `Bedlam 1.1/Bedlam`, Finder APPL/Bdlm, CODE 68K, vers 1.1. Original executable data fork is empty (SHA-256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855), resource SHA-256 0bd6c764a100f8665b3ca6827df0ff4bd1bb463a8cedf5b799f96329dd69e2ad. Six title-folder files were copied, including the separate `Bedlam Sounds` resource file, readme/history, raw alias and Icon file. Sounds loading/audio behavior is unverified.

SIZE resources: ID -1 preferred/minimum 1,638,400 bytes; ID 1 and 0 preferred 2,355,200/minimum 1,638,400. No partition override was supplied. The effective loader partition was not separately instrumented; original SIZE resources remain intact.

A narrow read-only Boot System Folder/Preferences search by title and Bdlm creator found `Bedlam Preferences`; title-name matches elsewhere were Launcher Items and Navigation Services recent items, which were not copied as dependencies. One preference file was extracted separately and then included at `System Folder/Preferences/Bedlam Preferences` in the combined fixture. Runtime logs show FindFolder(pref), FSMakeFSSpec with exists=true, resource-open selector 13, and ResError=0. This establishes native virtual preference reachability and resource access, rather than a disconnected copy or missing/new default-state test. Values and registration contents were never printed into reports.

`extract_owned_game.py` reopens images and compares data/resource forks, type/creator, flags, represented dates and positions for every copied file. It verified 6 title files, 1 separate preference, and 7 combined fixture files. Source001 before/after SHA-256: 82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e. Boot before/after: 01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393. Both unchanged. Fixture SHA-256: 48508c527441056916891eb8efdbc33a9c312501e0e4a8a96bb9d00e3404603c. Folder Finder information is not exposed by machfs; represented folder dates are retained. Raw alias bytes/metadata are preserved, but alias resolution to the new volume is not promised.

## Native reproduction and inspected behavior

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/bedlam`. Its manifest.json contains fork/fixture, binary, scenario, report, log and screenshot hashes. All original content and captures remain there, outside Git.

Binary `D:/SystemlessBuild/target/ci-test/systemless.exe` reports 0.110.1, SHA-256 70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c; exact compile revision unknown. Reused without rebuilding. Commands were executed from the repository root:

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='Bedlam 1.1/Bedlam'
D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/bedlam/bedlam-with-preferences.hfv --headless --prefer-classic-68k --screen-depth 1 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/bedlam/battle.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/bedlam/battle
```

The same command used startup.json/startup and input.json/input for earlier probes. Each process was launched hidden with its own PID recorded and 60-second initial wall wait; all completed normally within that wait, so no termination was needed. Tick budgets were 400, 450 and 850, completed at 360, 422 and 782 respectively. All reports passed, no errors, zero assertions, zero budget-exhausted frames. These are action-completion results only.

Readme documents System 7+, black-and-white graphics with a fixed 512×342 playfield centered on larger displays, mouse movement/button fire defaults, and optional configured keyboard controls. It also documents holding fire to repeat and early fire to skip travel. Exploratory depth 1 follows the documented monochrome design. Actual framebuffer is 800×600 (logged bounds and inspected PNG), with centered 512×342 content. No requested 640×480 mode was assumed.

At tick 120 the menu was visually inspected. The New Game button was then clicked using mouse v=423,h=522, held two ticks. Tick 242 shows a partially cleared menu transition. Tick 362 shows cockpit; tick 422 shows “Prepare for Battle!”. Follow-up tick 662 shows cockpit with blanking message fragments; tick 722 shows “Traveling To Pluto”; tick 782 shows partially cleared travel text. These observations do not establish a renderer defect without reference evidence. Scenario names battle-before/battle-fire/battle-right identify intended checkpoints, not proof of battle.

Mouse v=440,h=300 was held for 120 ticks after new-game tick 242; mouse moved right to h=500 for 60 ticks; the follow-up waited 240 more ticks, held at h=300 for 60 and moved to h=500 for 60. Since the observed scene remained travel, these actions do not prove ship movement or firing. No guessed pixel assertions were used.

| Area | Result |
|---|---|
| Launch/menu | Observed readable title/menu and New Game transition |
| Existing preferences | Observed virtual preference lookup/resource access succeeds |
| Gameplay readiness | Unresolved after finite tick-782 travel follow-up |
| Movement/fire efficacy | Unverified; input sent during travel |
| Timing/fidelity/busy scene | Untested; frontend ticks are not browser performance |
| Pause/menu during gameplay | Untested |
| Sound/music/audible fidelity | Untested; no audio assertions or listening |
| Saves/reload/export/import | Untested; no browser save changes |
| Physical controller | Untested |

## Recommendation and rollback

Keep compatibility Unknown. No production setting, executable identity, save ID or controller mapping is proposed. Next step is a focused readiness investigation using the preserved fixture and independent original/reference behavior to determine expected travel duration and whether documented early fire is being consumed. Do not infer a missing service or estimate a runtime fix from this run. A compiled browser entry is also absent and is separate preparation work.

Rollback is deletion of this worker's new documentation and private copied artifacts if no longer needed; originals and runtime were untouched. Native/extraction workload was explicitly released to the coordinator before final lightweight documentation. JSON parsing, source rehashes, extraction comparison and visual inspection were completed; no expensive builds/tests were warranted.
