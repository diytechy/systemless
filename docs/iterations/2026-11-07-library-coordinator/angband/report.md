# Angband Macintosh 2.0.2 first pass — 2026-11-07

Outcome: qualified copied fixture and native initial town/input smoke. No runtime, partition, catalogue, pacing or browser-save changes. A browser release entry remains preparation work. Native clocks are not performance measurements.

Work used modernization/tuning and headless/play skills. Coordinator selected the worker tool/model; model identity was not independently verified. Checkout was clean `dev`, starting `ea908566b6c6157fc3aaafd9b6f40d9daa6ebd46`. Native diagnostic binary reports 0.110.1, SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`; exact compile revision is unknown.

## Preservation and requirements

Original read-only source: `D:/SheepShaver_MAC_Emulator/Content/004`, HFS+ in HFS wrapper. Before/after SHA256 `a7493fc55952a462a655158c8abe4e4c063daf45bf5dd2c24f0fbc876bd70985`. Checked `HfsPlusReader` refuses overflow forks; no such exception occurred. Only `Angband` folder selected. Four files: executable, raw alias, Word5 manual, Read Me. No unrelated root applications copied.

Fixture `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/angband/angband.hfv`, SHA256 `ae3e9760fc43471833660db8235d644f85011168c7f205015dd14f2927fc2ead`. Every selected data/resource fork, type, creator, flags, file dates/location and represented folder dates were compared after reopening. Original folder Finder info is not exposed. Raw alias bytes were retained by clearing only machfs's derived alias target; resolution is unverified. Existing extractor synthetic nested-fork/Finder metadata and invalid-path/source-directory guard checks passed before use.

Executable `Angband/Angband`: CODE present, cfrg absent, version resource 2.0.2, creator AngB, APPL; original SIZE preferred and minimum 972800 bytes. No override. Read Me confirms Macintosh port2.0.2, approximately PC1.3.1 game code, System6.0.4+, all Macs except128/512/XL;512E needs at least1MB. No display depth requirement documented there. Manual is Word5 and names Times/Helvetica/Courier for printing. External gameplay dependency not documented. Log shows missing Angband Preferences then creation in disposable guest; no Boot preference import or persistence claim.

## Native reproduction and observations

All private scripts, images, logs and reports are beneath the fixture directory above. No original was mounted writable. Each scenario starts fresh. Default800x600 and Auto/platform theme were exploratory. Initial1-bit probe reaches desktop/menu at120; File menu screenshot shows New/Open/Preferences. Selecting inspected File>New reaches character choices.

The same character sequence was repeated at1-bit and8-bit: run120; File menu down(10,52), run2, move(27,65), run2, up, run120; a Human; m Male; a Warrior. Keys use short down/run2/up and finite later runs. In the initial fresh/default-preference fixture, at1-bit some prompts/values are invisible against white; at8-bit corresponding checkpoints show Human/Male/Warrior and the automatic rolling prompt. This is an observed depth/contrast difference, not a proven renderer defect or reference fidelity judgment.1-bit's later tick790 capture did complete; it was not a stalled guest call.

At8-bit: y exposes minimum-attribute autoroll prompts. Bounded manual branch n instead generates stats; Escape accepts; typing t and Return reaches town map. Keypad6 (key88,ch54) followed by30 ticks changes the scene; i (key34,ch105) followed by30 ticks opens a readable carried-item inventory list. No collision/distance or turn-accuracy assertion was made. Initial town and small input response are observed, not full compatibility.

Exact final launch (PowerShell, environment set in same process):

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='Angband/Angband'
& D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/angband/angband.hfv --headless --prefer-classic-68k --screen-depth 8 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/angband/play.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/angband/play
```

Final report: passed,1102 frontend ticks,1680 guest tick,0 assertions,0 budget-exhausted frames. All prior probes completed too. Launches were polled with20-second WaitForExit; pending processes completed on follow-up well below90-second wall limit. No process termination was required. Native/extraction workload explicitly released before writing this report.

## Behavior and next step

Observed: File menu/New, race/sex/class selection, manual stat roll/accept, naming, town map, keypad6 scene change, inventory display. Untested: busy combat, pace/fidelity, pause/resume, audible sound/music, save/load and browser export/import, physical controller, release browser. No independent original reference. A nonempty map or successful scenario is not a compatibility certificate.

Prepare a deliberate68K8-bit release entry with original972800 partition, then verify browser movement/menu and saves before performance capture.8-bit is supported by this readiness observation, not a claimed original requirement. Do not adopt any pacing change from these native runs. Rollback consists only of removing assigned report files and disposable private fixture; no shared runtime/settings were edited.

Private evidence manifest (all scenario/capture/log/report hashes): `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/angband/evidence-manifest.json`. Preservation and metadata details are in `preservation.json` and `metadata.json` there. Concise machine-readable review is adjacent `review-summary.json`.


## Evidence-driven preference correction

Coordinator found an existing Boot preference after first-pass completion. The old four-file fixture and all its results remain retained as fresh/default-preference evidence. In particular, its1-bit contrast observation does not qualify original-preference rendering.

New fixture `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/angband/angband-preserved-pref.hfv`, SHA256 `b51a5f4bf83cb713a8a00a54e7480032c68e227b13629c52f611bbae3c312b56`, contains the same four game files plus exact `System Folder/Preferences/Angband Preferences` from Boot (pref/AngB, data0,resource662). All five files' forks and exposed Finder fields, represented ancestor dates were compared after serialization and disk reopening; no values are published. Boot before/after SHA256 `01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393`. Existing metadata limits remain.

Systemless source `process_context.rs` fixes System Folder/Preferences at dir17; launch seeds packaged VFS resources. Correctly placing the copied file at that exact virtual path gives startup FindFolder(pref) immediately followed by ResError0, replacing the old -43/missing-PBGetFInfo/create sequence. This supports successful discovery; individual private preference effects were not decoded or separately asserted. No loader/runtime change was needed.

Retest changed only archive positional argument to the new fixture and output to `.../angband/preserved-pref`; same8-bit `play.json`,68K, original972800 partition. Completed normally within initial20-second wait/poll, passed1102 frontend ticks/1680 guest tick,0 assertions and0 budget exhaustions. Inspected new-game and inventory captures confirm readable character setup and town/inventory; no preference-state blocker. Workload released again before this amendment. No further1-bit tests performed. Use the new fixture for future browser preparation; rollback retains both fixture generations and requires no shared-code revert. Private preservation record: `preserved-pref-preservation.json`; retest report/logs/captures in `preserved-pref/`.
