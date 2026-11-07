# System's Twilight v1.0.5 first pass

Prepared a verified copied fixture and reached the save-new-game picker through a visibly ready New Game button. An initial readiness mistake was corrected:120 frontend ticks show artwork before buttons are ready;360ticks show buttons. Earlier input probes were premature, not evidence of an input defect. Gameplay remains untested. No compatibility blocker, pacing or runtime change is proposed.

## Preservation and provenance

Work used the existing `dev` checkout without changing shared files. Tool selection was the coordinator-assigned Sol worker; model identity was not independently verified. The exact MacRoman curly-apostrophe folder and ASCII-apostrophe executable are retained in `review-summary.json`. The original 68K application resource hash matches the brief. Source001 before/after SHA-256 is `82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e`; Boot before/after is `01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393`.

The existing read-only `extract_owned_game.py` copied the entire folder, verified seven files by reopening the 8MiB image, and compared both forks, type/creator, flags, coordinates and represented dates. Fixture hash: `bdc35005475a0bf04d34eed83c87afa5bfa8c38171692f41f22144866a27cdae`. Complete folder includes two original save documents, executable, raw alias, icon and both text documents. No source writable mount or original launch occurred. Folder Finder information is unavailable through machfs; represented folder dates are retained. Raw aliases remain byte-preserved but may target the old volume. The two save documents were preserved, not loaded or certified compatible.

A narrow read-only recursive Boot scan by title and actual executable creator `STwZ` found only a Launcher Items alias and Navigation Services recent-item alias. No actual preference file was identified; no fabricated preference mapping or registration state was added. Source and copied fixtures remain private.

Both named documents were inspected from their data forks and disposable UTF-8 text copies retained privately. Readme confirms 1.0.5 updates ordering information without gameplay changes, a non-fat 68K binary, graphics designed for black/white, 16 and 256 colors, New Game start, help-menu control instructions and five-minute automatic save behavior. These are documentation claims, not observed autosave/audio/gameplay evidence. Detailed in-game help was not reached.

## Reproduction and observed behavior

Existing binary `D:/SystemlessBuild/target/ci-test/systemless.exe`, version 0.110.1, exact compile revision unknown. SHA-256 and full command arrays are in private evidence. Use `D:/SystemlessBuild/uv-cache/archive-v0/YghSmGhw_A5RgPIr/Scripts/python.exe PRIVATE_ROOT/run.py startup` (or `newgame`, `return`, `menu`, `click`, `readyclick`), where PRIVATE_ROOT is the assigned scratch root below. Runner selects the exact executable with `SYSTEMLESS_LOAD_EXECUTABLE`, explicit `--prefer-classic-68k --screen-depth 8 --headless`, original SIZE without override, default 800x600 display and frontend-tick scripts. This is an exploratory display supported by readme color guidance, not a required resolution or performance configuration.

Startup capture at120 shows artwork without ready buttons; capture at360 has New Game/Open Game/Quit. Initial fresh click at120 (v216,h100, held2ticks), Return36/character13 at120, a File-menu probe at120 and an explicit move/click at120 all ended with the title dialog. These are premature input probes, not proof of ineffective controls. The apparent button-row change during the menu probe was startup progress; it must not be attributed to menu handling.

Coordinator review caught this readiness confound and authorized one corrective run. `readyclick.json` waits360ticks and captures `pre_click`, inspected with visible New Game. It moves to v216,h100, waits2ticks, holds10ticks, releases, then runs120ticks. `post_click` at492 shows the Standard File save-new-game picker with default filename Player and copied original files. The New Game button works after readiness. No Save button was pressed, and existing copied save documents were not overwritten. This is a useful initial input boundary; gameplay/help remains untested. Stop was deliberate at the authorized picker boundary.

All six scenarios completed with passed status, exit0, no assertions and zero budget-exhausted frames. They prove finite scripted action completion, not gameplay. Screenshots were inspected. No errors, guest halt or timeout appeared. Each child had durable PID/start/binary/fixture/scenario/wall-bound evidence; final process124008 exited and workload was explicitly released before report correction. No additional depth/memory/shared fix trials were run.

| Area | Result |
|---|---|
| Launch/title rendering | Observed |
| New Game / input | Corrected wait360 click opens save-new-game picker; gameplay controls untested |
| Motion, timing, busy scene, pause, gameplay bindings | Untested |
| Audio and synchronization | Untested |
| Save/load/autosave round trip | Untested; source saves retained |
| Physical controller | Untested |
| Browser pace / independent fidelity reference | Untested; absent compiled entry is preparation gap |

## Checks, limits and next action

Private root: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/system-s-twilight-v1-0-5`. `evidence-manifest.json` retains source/build hashes, full raw reports and scenario/log/capture hashes. `owned-process.json` is exited. Runner resolves and asserts ancestry for fixture/scenario/output/log/ownership before logs/process; synthetic out-of-scope and missing-input guards passed without launching. No browser state, other title, shared runtime, catalogue, build, commit or deployment changed. Native concurrent diagnostic runs are not wall-time measurements.

Next useful step is a fresh readyclick sequence followed by a unique disposable save filename, preserving the existing Player document, then inspect initial gameplay and in-game help. Readiness correction establishes no missing service; no blocker or repair estimate is warranted. Root may arrange a trusted reference or release-entry follow-up later. Rollback consists only of discarding these own reports/private scratch outputs; original disks and shared runtime are untouched.
