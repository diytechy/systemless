# Slithereens 1.0.0 first pass

Outcome: copied preparation verified; native readiness unresolved. No runtime, catalogue, input mapping, pacing or browser state change is proposed. This worker was assigned as an individual Sol worker by the coordinator; model identity is not independently verified.

## Source and preservation

Selected exactly `Content/003`, `Slithereens 1.0.0 ƒ/Slithereens`, creator `SrpC`, fat CODE/PPC executable, explicitly testing its 68K slice. Executable forks match the assignment: data SHA256 `85c202abcec14d6967a13a79f6d08e94466295953fb642eb5b45eb6ddc3f52da`, resource SHA256 `92c658f358f33e0beaa3db5863c5a1efc398de96861c60092c7db88dc454063a`. Both vers resources say 1.0.0; original Notes identifies initial release December 15, 1998. Original source003 and Boot hashes were identical before/after extraction; exact hashes are in review-summary.json and private preservation.json.

Copied the complete selected folder, including Levels, Music, Sounds, Sprites and Titles, installer, registration helper, documentation, screenshots and raw aliases; these are retained preservation scope, not a claim every file is a runtime dependency. Copied three existing Boot preferences by exact path: Slithereens Prefs, Slithereens Scores and Slithereens License. The separate Navigation Services recent-item alias was inventoried but not included as a game preference. Registration/preference contents remain private.

Final 32 MiB fixture is `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/slithereens/slithereens-preserved.hfv`. All 29 files reopen-compare for both forks, Finder type/creator/flags/coordinates and represented dates. Game-tree and Boot preference ancestor folder dates are retained. HFS+ signed coordinates retain the raw 16-bit pattern. Original folder Finder information is unavailable through machfs; raw alias bytes are preserved but aliases are not proven to resolve. The prior fixture is retained; it lacked Boot ancestor folder dates and is superseded. Corrected image volume label is Untitled, not an original-volume clone.

The exact creator/name preference search found the existing state. Native log proves `FindFolder('pref')`, successful FSMakeFSSpec exists=true and FSpOpenDF/PBRead of the copied existing 660-byte Slithereens Prefs through `Untitled/System Folder/Preferences/Slithereens Prefs`. This is not a fresh/default preference test. Scores and license file loading are unverified.

## Documentation, requirements and controls

Read original Notes, License, Ambrosia FAQ and Products FAQ data forks, plus executable TEXT and readable STR#/DITL/MENU resources. TEXT resources include maps and shareware messages rather than a detailed play manual. A resource says the game runs best in 256 colors, requires Apple Events/System 7, and can report an unacceptable monitor; these are requirement strings, not evidence of those errors occurring. Exploratory 8-bit display is supported by that resource statement. The reused native default display is actually 800×600 as logged, not a verified minimum. No display size override was set.

SIZE preferred partitions are 10,240,000 / 51,200,000 / 51,200,000 bytes. No partition override was used; native initialization shows a roughly 49 MiB application zone consistent with the selected preferred partition. Preserve original SIZE. A control-dialog resource labels Pause as Caps Lock and Abort as Escape; neither was tested. Direction/action bindings are configurable but not decoded or established here. No controller mapping should be inferred.

## Native reproduction and observed boundary

Reused `D:/SystemlessBuild/target/ci-test/systemless.exe`, SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`, reports 0.110.1; exact binary compile revision is unestablished. Checkout is dev; coordinator shared changes were preserved and not rebuilt by this worker. Current source is not provenance for the reused executable.

Private runner `run.py` sets `SYSTEMLESS_LOAD_EXECUTABLE=Slithereens 1.0.0 ƒ/Slithereens` and invokes:

```text
D:/SystemlessBuild/target/ci-test/systemless.exe FIXTURE --headless --prefer-classic-68k --screen-depth 8 --play-script SCENARIO --play-output NEW_OUTPUT
```

`startup.json`/`preserved.json` use frontend_ticks, max_ticks400: run120, screenshot startup, run240, screenshot later. Each has a 90-second wall bound and durable owned-process.json. The first scenario completed360 frontend ticks, guest_tick960, zero assertions and zero budget-exhausted frames. Images at120/360 were inspected and show only uniform pale cyan. No title, prompt or gameplay was visible. The corrected fixture received the same finite reproduction; its final result is recorded in review-summary.json and raw report.

A first runner's final console log-print failed on Windows cp1252 arrow encoding after the emulator had exited0 and durable state/report were written; this was a wrapper printing error, not an emulator failure. Removed that optional print and reran guards. No original or shared file was affected.

| Area | Evidence |
|---|---|
| Existing preferences reachable | Observed successful open/read of copied Slithereens Prefs |
| Title/readiness | Not reached in finite120/360 observations |
| Movement, timing, scoring, collision | Untested |
| Busy scene | Untested |
| Pause/menu/action inputs | Untested; no visible target for meaningful interaction |
| Sound/music | Untested |
| Scores/saves/reload/export/import | Untested |
| Physical controller | Untested |
| Browser performance/fidelity | Untested; no compiled entry/route established |

Passing action execution proves only completion of scripted waits/screenshots. Uniform captures do not establish a rendering defect, a hang, a missing service, incompatibility, or original-game behavior. No timing conclusion is drawn from concurrent native diagnostics. No indefinite wait or speculative input was used to claim readiness.

## Checks, rollback and next action

Existing extractor synthetic tests passed2/2. Private runner tests reject outside-root/sibling paths and missing inputs before redirected outputs or process creation. Selected file forks/Finder fields and folder dates were reopened/compared. All fixture/scenario/output/log/ownership paths were resolved under exact assigned scratch before use; no visible browser, builds, commits or uploads occurred.

Private evidence directory holds scripts, decoded documents/resources, preservation.json, scenarios, logs, captures, raw reports, owned-process.json and SHA256 evidence-manifest.json. Only this report and non-sensitive summary belong in Git. Rollback is removal of this title's documentation and disposable D: scratch after retaining evidence; originals and shared runtime settings are unchanged.

Next smallest investigation: inspect why startup remains in the post-preference-read state using a bounded private trace or an independently aligned original/reference startup. No specific missing service is established, so a low/likely/high implementation estimate is not grounded. Obtain readiness and documented play inputs before catalogue promotion or any browser tuning.
