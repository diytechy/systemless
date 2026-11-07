# Scruffy II first pass — 2026-11-07

Outcome: preserved preparation and inspected Scruffy II v1.0 title readiness; gameplay remains untested. No gameplay or performance qualification; no pacing candidate or shared changes.

Assignment requested a fresh Sol worker; this worker used the supplied tools and cannot independently attest its model identity. Followed AGENTS, modernization/tuning, headless/play guide, common worker and concurrency policy. Checkout `dev`, HEAD `46de0c845bb28ceec09c3a608c27b55d3a1de0e6`; pre-existing coordinator queue/runner edits preserved. Diagnostic binary exact build revision is unknown; runtime baseline remains ed74c8b4.

## Preservation and source

Private root: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/scruffy-ii`. `preservation.json` records hashes and resource inventory; `evidence-manifest.json` records private file hashes. Original Content/001 SHA256 before/after: `82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e`. Boot before/after: `01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393`.

Selected the entire `More ScruffyStuff` folder: game, alias, WDBN instructions, Data 1, Mazes, Music, Scores, Sounds. Existing read-only extractor produced `scruffy-ii.hfv` SHA256 `538495d7e95317fc356eb25b556cb9695b3523bdb456838ce68226956a5ec867`. Reopened and compared all eight files' data/resource forks, type/creator, flags, dates and coordinates using the helper's verify. Represented folder dates retained; original folder Finder information is unavailable in machfs. Raw alias bytes retained by clearing only derived alias target references; copied aliases are not guaranteed to resolve.

Exact executable `More ScruffyStuff/Scruffy II`, creator ScRF, 68K CODE, empty data fork, resource SHA256 `790eb11b4e6a3391c598c51dc16609f5432252ee7db4be5c0eeff17f1e6f98a4`. No vers resource/version string; documentation calls it Scruffy II/][. Final title screenshot explicitly displays v1.0. Original SIZE preferred partition 2621440 bytes, unchanged. Resource alert independently says at least 2.5 Meg. No save ID assigned.

Narrow read-only Boot scan used title name and executable creator. Only Launcher Items and Navigation Services Recent Items aliases matched; no title preference file identified. None copied or claimed loaded. Scores already present in the selected folder are copied and opened by the native test. No browser state touched.

## Documentation, dependencies and controls

Inspected original `Scruffy docs` despite Finder WDBN/MSWD type. Extracted readable MacRoman spans into a disposable UTF-8 text copy; Word formatting and embedded key diagram remain unparsed. Text documents Change Keys, one-press default (4 continues running until 5 stops), optional press-and-hold; 7 bomb, 9 bark while running, 4/6 bonus movement and 8/2 bonus speed. Physical key versus keypad distinction is not established; no raw key probe performed. Game menu provides New Game and Password (Command-P); Sound/Music and skill options documented. None behavior-qualified.

Native opens Mazes, Data 1, Sounds and Scores successfully. It attempts missing Data 2 then continues; necessity of Data 2 is unresolved, not established as the stall cause. Music is preserved but playback untested. No unrelated root apps copied.

## Native reproduction and observed evidence

Binary `D:/SystemlessBuild/target/ci-test/systemless.exe`, version 0.110.1, SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`; exact compile revision unknown. `run.py` contains exact command and environment. Set `SYSTEMLESS_LOAD_EXECUTABLE=More ScruffyStuff/Scruffy II`; flags `--headless --prefer-classic-68k --screen-depth DEPTH --play-script ROOT/NAME.json --play-output ROOT/NAME`. Platform renderer, native default 800x600, no partition override. Resolution exploratory; 4-bit depth explicitly required by game alert, not a generalized default. Concurrent diagnostic policy means wall times are not performance data.

`startup` at exploratory8-bit: script completed360 frontend ticks, guest tick960, assertions0, exhausted frames0. Inspected screenshot shows explicit 16-color/4-bit requirement alert. `fourbit`: script completed360 frontend ticks, guest tick960, assertions0, exhaustion0. Inspected tick120 image black; tick360 shows Frank Software splash with Squeek button. These passes prove only completed actions and startup presentation.

`dismissed`: run120, mouse down(v430,h580), run2, up, run120; terminated at its own90-second wall bound. Last log after new invisible512x342 window and `PBRead` Data1 count87552. No final report/counters/capture; initial input timing was confounded by black tick120 capture.

One corrective `ready-dismissed` probe waits360, captures before, clicks the same observed button, captures released, runs30. The pre-click screenshot was still black (capture/presentation readiness varies); released screenshot visibly shows the splash button depressed. Final raw result completed normally: status passed,392 frontend ticks, guest tick992, zero assertions/exhausted frames. Inspected `after.png` displays Scruffy II v1.0 title art. Thus the earlier wall-bound abort is an incomplete longer probe, not proof of startup incompatibility. No missing service identified. No stable pixel readiness oracle established.
## Behavior and next action

Observed: depth warning, 4-bit splash, copied content/scores opens, button interaction reaches the v1.0 title. Untested: actual level, movement, collisions/scoring/pace, busy scene, menu/pause, sound fidelity/synchronization, save round trip, physical controller and release-browser performance. No independent reference or fidelity certificate. Completed scenarios have no assertions; stopped runs have unavailable final counters, not zero counters.

Next smallest step: use the preserved fixture and successful short startup sequence to dismiss the title into menus, inspect New Game and reach an initial level with documented controls. Keep wall bounds: a longer earlier run was incomplete. No compatibility blocker or engineering estimate is established. Release-browser entry remains unprepared.

Only own reports and private scratch added. No runtime/catalogue/settings/helper changes, commits, uploads or deployment. Rollback is removal of these additive report/private files after retaining desired evidence; originals and existing browser save identities unchanged. Runner uses resolved Path.parents ancestry guards, rejects sibling-prefix paths, checks fixture/scenario before redirected logs/child launch, and writes PID/start/binary/fixture/scenario/wall bound/state ownership. Private runner log printing initially hit Windows console encoding; UTF-8 console setting corrected it without rerunning completed native checks. All raw logs remained intact.

Workload released: final owned-process.json records ready-dismissed exited0; no owned emulator remains. Only lightweight evidence/report writes followed release.
