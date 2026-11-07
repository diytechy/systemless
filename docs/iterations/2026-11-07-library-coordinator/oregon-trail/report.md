# Oregon Trail 1.1 first pass

Outcome: a preserved fixture reaches the illustrated title, welcome, player/party setup and an actual occupation decision. Mouse selection changes Banker to Farmer. This is setup/input evidence, not gameplay compatibility or timing qualification. No runtime, release catalogue, pacing, browser state or shared helper changed. Tool selection follows the coordinator assignment; model identity was not independently verified.

## Source and preservation

Source Content/003, Oregon Trail/Oregon Trail: 68K CODE, vers1.1, original SIZE1,024,000 bytes. Resource SHA2567781c8cea88a8e900f740bbf6facc7c5f37b6e6335a317bb29085e0cfcc3749e; data fork empty. All five sibling files retained: executable, Oregon Color, Oregon Config, icon and alias. No named external Read Me/help/manual was present, irrespective of Finder type. The program's welcome describes registering party/name/occupation and buying supplies; keyboard/gameplay controls remain unknown.

Read-only Boot System Folder/Preferences title/name and ORGN creator traversal found only System Folder/Launcher Items/Mouse Required/Oregon Trail alias. This is a launcher reference, not a preference. No matching Boot preference was found. Native logs confirm actual opening of Oregon Color and in-folder Oregon Config, so this is the preserved supplied configuration rather than a claimed fresh/default preference state. Private configuration/registration values are not reproduced here.

Both forks and file type/creator/flags/dates/x/y were reopened and compared for5 files. Signed HFS+ coordinates were normalized modulo65536 on disposable Python copies to retain raw words. Folder dates at offsets12/16/28 were retained for the selected folder and volume root. Original fixture remains intact; corrected fixture additionally preserves root dates and was rerun. Folder Finder information is not exposed by machfs; raw alias bytes are retained but resolution is not claimed. HFS+ reader refuses overflow extents. Source003 and Boot before/after/final SHA256s match; see JSON for exact values.

## Native reproduction

Private root: D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/oregon-trail. Final fixture oregon-trail-v2.hfv SHA256a111ef2828319cc92a31d215534335ffce22204db39560ae78930e54eb0d50b8. preservation-v2.json contains exact fork and metadata verification. evidence-manifest.json hashes scenarios, captures, logs and helpers.

Binary D:/SystemlessBuild/target/ci-test/systemless.exe reports0.110.1, SHA25670062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c. Compile revision unknown. Worktree dev; unrelated coordinator bookkeeping preserved. Source runtime baseline ed74c8b4 is not an assertion of binary provenance.

Exact execution uses SYSTEMLESS_LOAD_EXECUTABLE=Oregon Trail/Oregon Trail and:

```text
D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/oregon-trail/oregon-trail-v2.hfv --headless --prefer-classic-68k --screen-depth 8 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/oregon-trail/corrected-decision.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/oregon-trail/corrected-decision
```

Runner: cached Python executes run_owned.py corrected-decision. This new absolute-path runner guards fixture/scenario/output/log/ownership paths against the exact assigned root before redirected output/process creation; existing inputs checked first. Out-of-scope guard rejects; missing-guard scenario invocation rejects before launch/log creation. Ownership records PID/start/inputs/bound and final exited state. No other title's runner was copied or text-substituted.

Exploratory8-bit; observed capture800x600, no verified display requirement. SIZE unchanged (scenario partition override null). At tick120 the startup/version splash is visible; by600 the title appears. Travel click v448/h572 (down2ticks/up, wait30) opens welcome. Continue v443/h400 opens setup. Farmer v388/h207 selects the radio button. Final corrected run passed681frontend ticks with0assertions,0budget-exhausted frames and no error. Images were inspected. Four processes each had75s wall bounds and exited normally; all workload released before report writing. Concurrent diagnostic load was permitted and is not a speed measurement.

## Evidence limits and next action

Title/readiness and these three mouse actions observed. Actual journey/hunting, motion/timing, busy scenes, pause/menu tracking, audible sound, save round trip, keyboard behavior, physical controller and independent fidelity comparison remain untested. No release entry/browser capture exists; this is preparation work, not a missing compatibility result. No pacing recommendation follows from frontend ticks or diagnostic wall time.

Next: coordinator may integrate corrected fixture with explicit executable, preserved in-folder config and original SIZE, then verify name entry, journey start, pause/menu, audio and saves in a release browser. Keep8-bit exploratory until display requirements or reference support it. Rollback is removing this title's report and private copied artifacts; source media and shared state are unchanged. No builds, commits, uploads or deployment performed.
