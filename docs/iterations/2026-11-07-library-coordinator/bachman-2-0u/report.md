# Bachman 2.0u first-pass result

Bachman reaches its title and a representative Level 1 maze in the existing native diagnostic. A held literal Right input was followed by the character appearing farther right, enemies becoming visible, and a score of 1 by the final capture. This is bounded scene/input evidence, not independent movement, collision, scoring, timing, or full compatibility qualification. No runtime, catalogue, pacing, saves, or original media changed.

Work used the assigned sole-worker tool execution; model identity was supplied by the coordinator rather than independently verified. Checkout was clean `dev`, revision `4b6300cc9c4d70cb49eb687f51ef6511030cbf3e`. Workload ownership was explicitly released before writing these reports. No browser, build, nested agent, commit, or deployment was used.

## Preservation and preparation

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/bachman-2-0u`. `inventory.json`, `executable.json`, and `evidence-hashes.json` record full source/fixture and capture hashes. Source 001 SHA256 before and after: `82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e`. Boot before and after: `01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393`.

Read-only extraction used the existing `scripts/extract_owned_game.py` API, selecting only `Bachman 2.0u Folder` into `bachman.dsk` (8 MiB). Its three files were reopened and compared: exact game APPL, sibling raw Bachman alias, and documentation. Image SHA256 `023fb815af2f380b37b4ae2a30f234203f2dc44d349870e6d58a8963b749a8d3`. Executable resource SHA256 matches assignment `b845982a32c9ea8a1157b48b8395217b83795579aa17aa72f5d236ea9c53fb7e`; data fork is empty. Resources establish CODE/68K and version string Bachman 2.0u. Both SIZE preferred fields remain 2,048,000; no partition override was used.

The required narrow Boot System Folder scan matched names containing Bach and exact executable Finder creator `Bac’`. Matches were Favorites and Launcher Items aliases plus `System Folder/Preferences/Navigation Services/Recent Items/Bachman 2.0u`. The latter is an alias/history record, not settings; it was separately copied to `prefs.dsk` and its file forks/Finder fields reopened and verified. No Bachman Prefs settings file matched anywhere in the System Folder scan. Runtime requests the virtual preferences folder (dirID 17), then logs `OpenRFPerm: "Bachman Prefs" not found in vfs_rsrc`. These tests therefore use fresh/default settings; no existing game preference was found or claimed loaded. The history alias fixture was not mounted in the native test and its virtual path reachability remains untested. This is retained as a preparation limitation, not silently treated as preserved game settings.

Both forks, Finder type/creator/flags/positions/dates and represented folder dates were verified by the existing helper. Original folder Finder information is not exposed by machfs. Raw alias bytes are retained without automatic regeneration; links may still point to the old volume and resolution is unproven. No unrelated apps were copied.

## Native reproduction and observation

Binary: `D:/SystemlessBuild/target/ci-test/systemless.exe`, version 0.110.1, SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`; exact compile revision unknown. Explicit 68K, executable `Bachman 2.0u`, 8-bit. Observed framebuffer is 800×600. Documentation recommends b/w, 16, or 256 colors and fast graphics; 8-bit is an exploratory supported-documentation choice, not a measured optimum. Default menu already shows Fast animation checked. Documentation says arrows/keypad/custom keyboard controls, optional mouse, and preference-based settings/scores. No external built-in-level dependency was required for the scene.

Commands from repository root, with `$env:SYSTEMLESS_LOAD_EXECUTABLE='Bachman 2.0u'`:

```powershell
D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/bachman-2-0u/bachman.dsk --headless --prefer-classic-68k --screen-depth 8 --literal-arrows --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/bachman-2-0u/play.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/bachman-2-0u/play
```

`startup.json` captured at frontend tick 120. `menu.json` separately exposed Game menu: Begin, Try level, Sound, background tasks, Fast animation; Pause disabled before a game. Main `play.json`: title at 120; mouse down h128/v10, hold 2 ticks, mouse up h135/v27 selects observed Begin; run 60 and capture Level 1; literal Right key124/ch29 held 30 ticks; capture; another menu attempt and 2 ticks. All images were inspected. Final attempted menu capture shows playfield rather than dropdown, so it supplies no pause/menu-after-start evidence. Startup cursor/character presentation progresses between snapshots; precise rendering/physics fidelity has no independent reference.

Main result: passed, 214 frontend ticks, 0 assertions, 0 budget exhausted frames, no error. Startup/menu also passed. Startup and main processes were started with a 60-second wall cap and only that exact own process would be stopped; neither reached the cap. Main run completed in roughly 13 seconds of tool wall time. The small menu probe completed in about 3 seconds; it used direct invocation and no watchdog, a procedural limit. No process remains active from this work. Native frontend/guest counters are not release performance or speed measurements.

| Area | Result |
|---|---|
| Title, menu, initial level | Observed |
| Held Right | Accepted script; changed character position and later score observed; causal/fidelity limits above |
| Busy scene, collision/score correctness | Untested |
| Pause/resume | Untested |
| Sound/music | Untested, no audible fidelity claim |
| Save/reload, browser storage | Untested; no browser state touched |
| Physical controller | Untested |
| Browser performance/pacing | Unmeasured; no tuning recommendation |

## Checks, rollback, next action

Existing synthetic extractor tests passed (2 tests), covering forks/metadata/aliases and path guards; reopened fixture verifies all selected files. Source hashes unchanged around extraction; exact executable metadata and SIZE rechecked on generated fixture. No expensive build was run. Only own report files are in Git-visible scope; private assets/scenarios/images remain on D:.

Rollback is removal of only this worker's copied D: fixtures and own report directory if unwanted; originals, earlier diagnostics, browser saves, and shared code are unchanged. Next action is coordinated release entry preparation with exact executable and original SIZE, then a visible browser baseline plus pause/input/audio/save checks. Resolve any actual future settings file through the virtual preference path before recommending saved per-title settings. No pacing candidate is justified by this native smoke.
