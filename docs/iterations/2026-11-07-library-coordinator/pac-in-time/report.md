# PAC IN TIME 1.0 first pass

Prepared a private copied fixture and reached the animated introduction and title. Initial gameplay readiness is unresolved; no missing runtime service or compatibility failure was established. No pacing change is proposed.

## Preservation and dependencies

Source002 root `PAC IN TIME` is a68K CODE application, creatorFURY, version1.0. Its2,993,125-byte data fork and212,144-byte resource fork match the assignment hashes. SIZE preferred partition remains3,072,000bytes without override. Root siblings are unrelated applications/Desktop support files; none copied. No named title documentation sibling was found. Original MENU/DITL resources were inspected: display options16/256colors,320x200/640x400game window, with a requirement message at least640x480screen. Keyboard dialog exposes configurable Left/Right/Up/Down/Fire/Power controls; exact saved bindings remain unverified.

Boot scan by title/name and creator found actual `System Folder/Preferences/PAC-IN-TIME Prefs` (FURy/FURY), plus launcher/recent-item references. Other name substring matches are unrelated. Both forks/Finder fields of this preference were copied separately and into the test fixture. Native stderr confirms PBOpenRF found its2638-byte resource fork at `Owned PAC/System Folder/Preferences/PAC-IN-TIME Prefs`; this is original-preference state, not a fresh default test.

Two files were reopened and compared, including raw16-bit coordinate patterns, type/creator/flags/dates. Volume root and represented System Folder/Preferences ancestor dates were compared. Folder Finder information is unavailable through machfs. No aliases selected. Source002 and Boot before/after hashes are identical; full hashes and selected fork hashes are in private evidence manifest.

## Reproduction and observed behavior

Reused `D:/SystemlessBuild/target/ci-test/systemless.exe`0.110.1; exact compile revision unknown. Explicit executable `SYSTEMLESS_LOAD_EXECUTABLE=PAC IN TIME`, `--headless --prefer-classic-68k --screen-depth8`, default800x600screen, original SIZE. All five scenarios completed with no errors, assertions or budget exhaustion; each child had a75second wall cap and durable PID/start/path ownership record. Final process exited0.

Exact commands are stored in owned-process.json and scenarios under the private root. Invocation is cached Python `run_owned.py NAME`, which runs the binary with fixture `pac-with-prefs.hfv`, `--play-script NAME.json --play-output NAME`. Absolute fixture/scenario/output/log/ownership guards run before redirected files/child; out-of-scope and missing-input rejection checked without launching an emulator. UTF-8 used explicitly.

| Probe | Observed result |
|---|---|
| startup120/340ticks | Kalisto splash; no halt |
| mouse at340, menu probe | Splash fade progresses; menu action not established |
| later1294ticks plus Return36/13 | Illustrated intro; not gameplay |
| readiness2004ticks, Escape53/27 at1400 | PAC-IN-TIME title visible at1702; subsequent mouse probe returns to splash, so named new_game capture is not gameplay |
| fresh title plus Command55/0 and N45/110 | Title and menu bar visible; new-game dialog not established |

All selected screenshots were inspected. Color transitions/artifact-like fade frames are observations, not a proven renderer defect without reference. Menu resource documents New Game commandN, Resume commandP; actual start handling still needs an isolated fresh-title menu action. No gameplay displacement, collision, scoring, busy scene, pause/resume, audible audio fidelity, save roundtrip or physical controller qualification. No independent reference or release browser timing. Concurrent Oregon Trail diagnostics make these behavior probes only.

## Changes, limits and next step

Only this report/status and private scratch were written. No catalogue/runtime/helper/build/browser/save changes, commits or uploads. Tool selection followed coordinator fresh-worker assignment; model identity not independently verified. First-pass stopping point is unresolved readiness, not an unsupported requirement. Next use a fresh inspected title and isolate Game menu/New Game selection, then inspect Keyboard settings before claiming directional controls. No service estimate is justified until a concrete blocker exists.

Rollback: remove only this title's private copied scratch/report if desired; originals are unchanged. Private manifest `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/pac-in-time/evidence-manifest.json` contains source/fixture/build/scenario/capture/log hashes and reports. Workload released; durable owned-process.json is exited.


## Coordinator-requested menu correction

One additional invocation isolated the actual Game header: fresh1400frontend ticks, Escape hardware53/character27 down/up for2ticks,300ticks, mouse-down at h60,v10,3ticks, `game_menu` screenshot. It completed1705ticks with no error/assertions/budget exhaustion. The inspected image shows Kalisto splash/fade and menu bar, without an open dropdown or New Game row. This is neither a new-game dialog nor gameplay. No second selection invocation was performed because no row was exposed to inspect. The apparent title/menu readiness remains unresolved; no missing service is established. This branch is closed under the coordinator's maximum-two-invocation instruction.

Final owned process PID76908 exited0 under75second cap; workload released. Source002/Boot hashes rechecked unchanged. Raw scenario/report/log/image hashes are appended to the private manifest. Six scenarios total passed; previous five-scenario statements describe the initial pass. Next obtain independent evidence of the original title/menu interaction before authorizing further readiness branches; no settings change recommended.
