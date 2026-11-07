# Pac the Man 4.5.1 first pass

Prepared private media and observed title, File menu, New Game, level1 maze and animated player/ghosts. Compatibility remains incomplete: a fresh readiness follow-up stopped at the75-second owned-process cap while advancing a held Right action after active play appeared. No final report was produced for that run. No specific missing service is established.

## Preservation and requirements

Source006 HFS+ configured PactheMan4.5.1/Pac the Man is fat CODE/PPC. Initial test explicitly selected68K. Version4.5.1 is confirmed by visible title and resource ParamText. Original SIZE2252800 was retained with no override. All11 files in the title folder were copied, including Data, both level files, Songs1-4, ReadMe.html, FAQ.html and gifs/back.gif. Both named HTML documents were read. ReadMe specifies68020, System7,2MB RAM and QuickTime2 Musical Instruments for music. Display requirements were not stated;640x480x8 is exploratory, not a verified minimum.

The original-only fixture pac-original.hfv preserves11 files. Runnable pac-with-preferences.hfv preserves those11 plus exactly System Folder/Preferences/Pac the Man Preferences (prf2/Sebi). Broad Boot name/creator metadata hits were inventoried privately but were not seeded. Startup log lines14-20 show FindFolder pref, FSMakeFSSpec exists=true, HighLevelFSDispatch selector13, ResError0, CountResources(prf4)=1 and ResError0. This supports reachable/opened preference resources; individual values consumed were not traced. No fresh-default preference was created in observed logs.

Every selected file's forks, type, creator, flags, dates and coordinates were reopened and compared. HFS+ signed Finder coordinate representations were normalized modulo65536 in copied Python objects; raw16 patterns were retained. Selected folder dates from offsets12/16/28 and Boot ancestor folder dates were preserved and compared. Original folder Finder information remains unavailable through machfs. Alias derived targets were cleared while retaining raw forks; no alias resolution claim. Inline extents reader refuses overflow. Executable forks match supplied hashes. Source006 and Boot hashes were checked before/after extraction and again after diagnostics. Full values, file counts, fixture hashes and raw artifact hashes are in the private preservation manifest; source hashes are repeated in review-summary.json. Original001/002 were not opened or changed.

## Reproduction and observations

Existing D:/SystemlessBuild/target/ci-test/systemless.exe reports0.110.1; SHA25670062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c. Exact compile revision unknown. Checkout branch dev; preexisting modified coordination JSON files were preserved. No build. Native diagnostic frontend ticks are not real-time performance measurements; another authorized diagnostic worker could overlap.

Private absolute-path runner command (PowerShell):

```powershell
& D:/SystemlessBuild/uv-cache/archive-v0/YghSmGhw_A5RgPIr/Scripts/python.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/pac-the-man/run.py startup
```

Repeat with menu, play or play-ready only in new output paths (existing outputs are refused). Runner sets SYSTEMLESS_LOAD_EXECUTABLE=PactheMan4.5.1/Pac the Man, SYSTEMLESS_SCREEN_WIDTH=640, SYSTEMLESS_SCREEN_HEIGHT=480. CLI: binary fixture --headless --prefer-classic-68k --literal-arrows --screen-depth8 --play-script absolute.json --play-output new-directory. No application_partition_size override. Exact argument arrays are durable in owned-process.json and scenarios.

Startup120/360 screenshots show title. File menu was inspected before selecting New Game at(v26,h79). Completed play run captures GET READY at frontend184, right probe at229, active scene at274, then PAUSE at306 and still PAUSE after second Space at338. Directions: Right virtual124/character29 and Up126/character30; Space49/32. Script passed with0 assertions and0 exhausted frames. GET READY confounds the initial Right probe; active later screenshot shows leftward player travel, not established directional correctness. Player and ghost positions/animation changed. Space caused a visible PAUSE overlay on the title background; a second Space did not restore gameplay. File menu contains Resume game; this was not successfully exercised.

A finite corrected play-ready run waited160 after New Game, captured active play at frontend284, then stalled within subsequent Right124/ch29 Run45. Only new-game.png exists. Runner killed only its directly owned PID84944 at75seconds, waited for exit and wrote stopped state. No final counters/assertion result are available; this is an aborted probe, not a passed scenario or proof of an input-service defect. No further retries.

## Behavior and limits

| Area | Evidence |
|---|---|
| Launch/menu | Observed title/version and File menu |
| Initial play | Maze, player/ghost motion observed |
| Directions | Sent correct raw arrows; response unqualified due readiness and later stall |
| Pause/resume | Space PAUSE observed; second Space remained paused; menu resume untested |
| Timing/fidelity | No independent reference or wall-time measurement |
| Busy scene/full game | Untested |
| Sound/music | Untested; MIDI dependency documented |
| Saves/reload/controller | Untested; no browser state accessed |

## Changes, checks and next action

Only assigned private scratch and this report/summary changed. No shared helper/runtime/catalogue/packaging/pacing edits, commits, browser actions, deployment or uploads. New runner guards resolve every scenario/fixture/output/log/ownership path under exact scratch root, require existing inputs before redirected logs/child launch, reject nonempty outputs, and passed missing-input/out-of-scope synthetic checks without launching. Ownership was persisted with PID/UTC/binary/fixture/scenario/cap and finalized stopped. Workload is released; report writing is lightweight.

Rollback is removal/archival of these newly created private copies and own report files; originals and existing fixtures remain intact. Next useful work is a focused bounded trace of the active-play Right stall, keeping original SIZE and current exploratory depth. Release integration remains deferred to coordinator; no title-specific pacing recommendation is supported.

Private evidence: D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/pac-the-man/preservation.json, prepare.py, preferences.py, run.py, refine.py, finalize.py, scenarios/logs and *-output PNG/report files. Tool selection used modernization and systemless-headless skills, PowerShell/Python read-only extraction and existing native binary; worker model identity was coordinator-selected, not independently verified.
