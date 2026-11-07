# Polybrid 1.0 first pass

Prepared and verified the original title folder. Native 68K diagnostics show title, OK dismissal into an initial populated falling-block scene, a descending piece and the Polybrid menu. No substantial compatibility blocker was established. Directional mapping and pause/resume remain unconfirmed; there is no browser entry or performance result.

## Preservation and requirements

Source001 contains `Polybrid Folder/Polybrid 1.0`, APPL/PlbD, CODE resources with no PPC cfrg. Version resource and original Read me independently identify1.0. Both SIZE resources specify preferred/minimum1024000 bytes; no override was used. The executable has63210 data bytes and309290 resource bytes; both forks match the assigned SHA256 values. All3 files were copied: executable, Polybrid Read me and the folder Icon carriage-return file. Original readme was decoded from a disposable copy and read. It describes falling blocks of1-4 squares, matching3+ colors/patterns horizontally/vertically/diagonally, bombs/weights/radiation, color and B&W Macintosh, System6/7, MacPlus through PowerPC, with possible INIT/cdev conflicts. No external helper requirement is stated.640x480x8 is an exploratory supported-color probe, not a verified minimum.

A narrow read-only Boot/System Folder/Preferences scan matched title name or executable creator PlbD and found no file. No Boot content was copied. The executable itself contains PREF resources0-4 and PlbD0; their original bytes are preserved. Actual preference values and which resources are consumed were not decoded/traced. Thus this is original embedded-state testing, not proof of fresh factory defaults or persistence. No missing-preference creation was observed in the diagnostic log. No separate preference mapping gap is established; persistence remains untested.

The existing extract_owned_game.py copied only the title folder to `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/polybrid-1-0/polybrid-original.hfv`. Reopening compared all selected data/resource forks, type, creator, flags, file dates/coordinates and represented folder dates;3 files verified. The helper clears derived Python alias targets while preserving raw forks; no alias-resolution guarantee. Original folder Finder information is not exposed by machfs. This is a selected fixture, not a complete original-volume clone. Original source001 and Boot SHA256 remained identical before extraction and after all diagnostics. Full hashes and metadata are in the private manifests and review summary. Original002 was not opened or changed.

## Reproduction and observed behavior

Checkout dev at53dc82412017b70f884a29f225c3916be5e18092; preexisting modified coordination files preserved. Selected tool per coordinator: gpt-6.1-sol; no independent identity claim. Used modernization/headless skills, cached machfs Python and existing native binary; no install/build. Binary0.110.1 SHA25670062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c; exact compile revision unknown. Runtime baseline supplied ased74c8b4, not verified build provenance. Concurrent authorized diagnostics may overlap; elapsed time is not pacing evidence.

Exact runner command (PowerShell), replacing startup with play or controls for other scenarios:

```powershell
& D:/SystemlessBuild/uv-cache/archive-v0/YghSmGhw_A5RgPIr/Scripts/python.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/polybrid-1-0/run.py startup
```

Runner sets SYSTEMLESS_LOAD_EXECUTABLE=`Polybrid Folder/Polybrid 1.0`, SYSTEMLESS_SCREEN_WIDTH=640, SYSTEMLESS_SCREEN_HEIGHT=480. CLI arguments: fixture --headless --prefer-classic-68k --literal-arrows --screen-depth8 --play-script absolute-scenario --play-output new-absolute-directory. Full argument array is in owned-process.json. Runner verifies absolute scope and existing fixture/scenario before opening redirected logs; out-of-scope and missing-input guard self-checks passed without emulator launch. Every run owns a direct child PID, records start/binary/paths and a75-second wall cap, waits for exit and marks final state. All3 runs exited0 within the cap; no stopped or orphan process. Final durable owner PID86008 is exited.

- startup:120 then240 more frontend ticks. Both inspected captures show colored title and OK dialog. Passed at360ticks,0 assertions,0 exhausted frames. Waiting dialog was normal readiness, not failure.
- play: after120ticks, click OK at(v345,h477), run6. after-ok at127 shows a populated well, falling piece, next-piece preview and score0. Click Polybrid menu(v10,h66); visible menu contains Abort, Pause, Help and Quit. Probe released at(v31,h73), an assumed New position, but menu stayed open. The name new-game.png is a scenario label, not evidence of New Game. Script passed at140ticks,0 assertions/exhaustions; no new game established by this menu action. The OK action already entered play.
- controls: fresh start and OK. Capture at127, hold literal Right key124/ch29 for12ticks, release and capture139: images identical, so directional response was not established. Another30ticks reaches169; inspected later.png shows the current four-square piece lower in the well. This is visual motion, not timing/collision fidelity. Open Polybrid menu, move to Pause(v48,h65) and release; final screenshot173 still shows highlighted Pause and retained menu. No pause/resume transition established. Script passed with0 assertions/exhaustions. Input script completion is not proof menu selection was processed.

Resource help was inspected on disposable copies. Configure Key describes Left/Right, Zoom Left/Right, Down/Drop, Rotate CCW/CW and horizontal/vertical Flip, but actual key assignments remain unknown. Menu resource shortcuts include command-N/New, command-P/Pause, command-?/Help, command-Q/Quit and command-S/Sound; these shortcuts were not exercised. Help says selecting Pause again resumes. Embedded help and configurable mappings make a guessed arrow response inconclusive. No runtime input defect is proven.

## Qualification and next action

| Area | Result |
|---|---|
| Launch/readiness | Observed title and successful OK dismissal into play |
| Initial scene/motion | Observed populated well, preview, score and piece descent |
| Directional/held input | Right124/ch29 probe unchanged; mapping and control response unconfirmed |
| Menu/pause | Menu opened; Pause highlighted; selection/resume unconfirmed |
| Busy scenes, matching, collision, score changes | Untested |
| Gameplay pace/reference fidelity | Untested; no independent reference |
| Audio/music/synchronization | Untested; no audio assertion/listening |
| Save/reload/export/import | Untested; originals and browser saves untouched |
| Physical controller/fullscreen/focus | Untested |
| Release browser/performance | Unprepared entry; no benchmark or pacing recommendation |

No source/runtime/catalogue/settings/build/browser changes or commits. Added only this report/review summary and private scratch. Rollback is removal of own report/scratch if desired; original media and existing private fixtures remain intact. Workload explicitly released before documentation.

Next authorized integration phase: preserve this exact executable/partition and embedded resources; add a scoped entry only after coordinator review. First bounded behavior follow-up should inspect Configure Key and a proper menu/shortcut transition, then demonstrate held/released control and pause/resume. Keep8-bit exploratory until verified; color/B&W support permits1-bit only if relevant. Measure release-browser pacing only after entry preparation and comparable captures; these concurrent native ticks justify no tuning.

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/polybrid-1-0`. `inventory.json`, `resource-metadata.json`, `resources.json`, `dialog-text.json`, scenarios, run.py, three output folders/report.json, stdout/stderr, owned-process.json and evidence-manifest.json retain raw details and SHA256 lists. Private resource/document values remain outside Git. Final preservation recheck and manifest generation use finalize.py; report/summary JSON are UTF-8.
