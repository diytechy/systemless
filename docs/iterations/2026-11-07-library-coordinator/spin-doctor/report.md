# Spin Doctor first-pass preparation

Outcome: preserved copied fixture and useful initial 68K gameplay/pause evidence; no pacing or compatibility qualification. Worker assigned as a fresh Sol worker by the coordinator; tool configuration is not independent model-identity evidence. Used mac-game-modernization and systemless-headless skills. No build, browser, conversion, runtime/catalogue/helper edit, commit, upload or deployment.

## Source and preservation

Selected `Content/002`, `Spin Doctor/Spin Doctor`, creator `SpDr`, fat CODE plus PPC fragment, explicitly run as 68K. Executable vers resources say `1.2 © 1993-5 Callisto Corp.` twice; original SIZE preferred partition is 2,560,000 bytes. The bundled `Spin Doctor Read Me` is type ttro, readable from its data fork, and identifies itself as 1.0. This documentation label does not replace executable version evidence. Its corrections direct users to in-app help and say the clock starts after changing wand rotation.

Copied all five files of the title folder, including graphics, raw alias, Read Me and incidental .DS_Store, plus actual `Spin Doctor Scores` and `Spin Doctor Settings` from Boot Preferences. Narrow Boot/System Folder name and creator inventory also found an unrelated help-image name match, launcher alias and Navigation Services recent-item record; these are not dependencies. An initial private v1 fixture included these extra matches; it is retained for provenance and was never run. Corrected v2 excludes them. Both forks, file type/creator/flags/raw16 Finder coordinates, file dates and represented folder dates were reopened and compared for all seven selected files. Original folder Finder information is unavailable through machfs. Raw aliases retain their source bytes and may reference the original volume; resolution is unqualified. No original disk was mounted or run writable.

Authoritative private fixture: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/spin-doctor/spin-doctor-v2.img`, SHA256 `260bd77b51e30f2047c2714d763a1632aa6f7b0be550a3e726272dc9279845ab`.

Original hashes before extraction, after extraction and after native runs matched:

| Source | SHA256 |
| --- | --- |
| 002 | `8119cbbb69d4a0d5ea4d2cbc2011467fbe396846c79ea0341919a399951ba946` |
| Boot | `01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393` |

The executable data/resource hashes match the assignment. Full per-file hashes, extraction verification, private decoded Read Me/resource help text, scenarios/logs/captures and commands are in that scratch directory. `extraction-v2.json` and `evidence-manifest.json` contain the durable verification. Decoded document-1 is an empty alias and document-2 is graphics binary; neither is treated as prose. document-3 is the actual Read Me. Registration/preference values and existing player names are kept out of this report.

## Native reproduction

Reused `D:/SystemlessBuild/target/ci-test/systemless.exe`, SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`, reports 0.110.1. Exact compile revision is unknown; supplied runtime baseline ed74c8b4 is not a verified binary provenance claim. Existing dev checkout has concurrent coordinator edits; HEAD observed at report time was d87ccb0d97f38f7c64b444836710646c1bdfa3ad.

Each process had a 90-second wall bound and durable PID/start/command/fixture/scenario ownership. All paths were resolved and required to descend from this exact scratch root before scenario/log/output/process operations; fixture and scenario existence checked before redirected logs. The private runner's out-of-scope and missing-input guard probes passed without launching a child. No original or shared outputs were overwritten.

Exact command shape (absolute private paths in recorded command arrays):

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='Spin Doctor/Spin Doctor'
& D:/SystemlessBuild/target/ci-test/systemless.exe <scratch>/spin-doctor-v2.img --headless --prefer-classic-68k --screen-depth 8 --play-script <scratch>/startup.json --play-output <scratch>/startup
# Same flags with gameplay.json and a fresh gameplay output directory.
```

Screen was the diagnostic build's observed 800×600 default, exploratory rather than a verified minimum. Depth 8 follows executable help recommending 256 colors; this is not an 8-bit library-wide default. No application_partition_size override: original SIZE retained. The title and playfield appeared gray-toned with preserved settings; no independent reference establishes a rendering mismatch. Renderer log requested Auto, selected platform; this is headless evidence, not a browser/WebGL capture. No real-time measurement or host-idleness claim.

`startup.json`: run 120 frontend ticks, capture title. Report passed, 120 frontend ticks, guest tick720, zero assertions, zero budget-exhausted frames. Logs explicitly opened both Settings and Scores through `Spin Doctor Copy/System Folder/Preferences/...`, establishing the copied native path was reached rather than newly created defaults.

`gameplay.json`: start fresh, run120; click first level at v226,h537 (down,run2,up); click Play at v468,h532 (down,run2,up); run45; capture `play`; hold Command key55,ch0 for30 ticks, release, run10; capture `command`; P key35,ch112 down,run2,up,run10; capture `pause`. Report passed at221 frontend ticks, guest tick821, zero assertions, zero budget-exhausted frames, no error. Actual screenshots were inspected before interpreting them. Scenario success alone is not qualification.

## Observed behavior and limits

| Area | Evidence |
| --- | --- |
| Launch/preferences | Title appeared; actual copied Settings and Scores opened at expected virtual path. |
| Initial gameplay | First level “1: Grid”, lives4 and score0 visible; white wand and goal/dot field rendered. Wand orientation differs between play and command captures. |
| Input | Mouse level/Play selection reached gameplay. P produced visible “Paused.” Command hold was delivered, but its effect was not isolated from automatic rotation. |
| Documentation controls | Command swing; Option bounce; Command+Option flip; Space instant reverse. In-game P pause, R restart, M mute, +/- volume, S save, Q end are listed. Only P was behaviorally checked. |
| Motion/timing fidelity | Motion observed; no reference timing, collision/scoring fidelity, goal completion or busy-level evidence. |
| Pause/resume/menu | Pause observed; resume and gameplay menu not tested. |
| Audio | Sound resources present; audibility/fidelity/synchronization not tested. |
| Saves | Existing preferences loaded; saving/reload/export/import untested. Browser saves untouched. |
| Controller | Physical device and browser mapping untested. |

## Changes, rollback and next action

Only this report/summary and private assigned scratch were created. Existing runtime settings, catalogue IDs, save mappings, executable choices and depths remain unchanged. Lightweight documents need no release build. Workload released after both child processes exited normally; final owned-process.json is durable with state exited. Remove only these assigned artifacts to roll back, preserving originals and shared work.

Next: coordinator may prepare a scoped release entry using the exact 1.2 executable/full folder/two actual preferences, original SIZE and documented color probe, then establish browser gameplay and held/released modifier effects, resume, representative busy scene, sound and save checks. Native tick results cannot justify a timing budget. No candidate settings are proposed.
