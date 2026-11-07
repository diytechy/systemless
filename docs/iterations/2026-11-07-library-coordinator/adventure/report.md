# Adventure 1.1 first pass — 2026-11-07

Outcome: copied fixture qualified within the metadata limits below; native readiness unresolved because text and menus did not become visible. No runtime, catalogue, settings, or controls changes proposed for acceptance. Workload released to coordinator after both native processes exited.

## Source and preparation

Checkout dev at ef02d2e726aac238a60746f612974a8ca8c764b6, initially clean. Worker tool selection follows coordinator assignment; model identity was not independently verified. Applied mac-game-modernization/tuning and systemless-headless/play-guide workflows.

Content/004 is HFS+ inside an HFS wrapper. Read only with checked inline-extents HfsPlusReader; no original mount or application launch. Selected exactly the four files beneath Adventure: executable, raw alias, Adventure README, NOTICE. Source SHA-256 before/after: a7493fc55952a462a655158c8abe4e4c063daf45bf5dd2c24f0fbc876bd70985. Copied fixture: D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/adventure/adventure.hfv; SHA-256 544284c2cd6d23ee3065901a6d802f49173e3588cc875e9bcfe4ba7819341867 (8 MiB).

Reused copy_selected/verify from scripts/extract_owned_game.py after its two synthetic preservation/path-guard tests passed. Private extract.py adapts the existing HFS+ reader into that checked copy path, retaining exposed folder dates. Every selected file's data/resource fork, type, creator, flags, dates and location fields compared after image serialization/reopen: four files verified. Original folder Finder information is not exposed. Derived alias-target reference cleared on copies only; raw alias bytes retained but alias resolution on the copied volume is unverified. Inline overflow extents refuse extraction; none encountered. No unrelated applications or Boot preferences copied.

Executable Adventure/Adventure is 68K CODE, vers strings 1.1 twice, preferred SIZE partition 174080 bytes. Executable data SHA-256 26845430434361658db355b0aca142bff734c98323d1bfff0d4b6bfb1cee9ed3; resource SHA-256 5d1aca7bc85faddfee56aca987b4cdf99595bd44af03449ff942f8ab9b08a849. README heading says 1.0, but version notes explicitly describe 1.1 working on all Macs with System 7 balloon help. This is the 550-point Colossal Cave text adventure; README requires System 4.1 or newer and documents no separate data dependency. Executable data fork is opened/read successfully during startup. No preference or browser save identity established.

## Native reproduction and evidence

Binary D:/SystemlessBuild/target/ci-test/systemless.exe reports 0.110.1; SHA-256 70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c. Exact compile revision unknown, so current checkout revision is not claimed as binary provenance. Renderer requested Auto, selected platform; headless native, explicit 68K, default 800×600. Exploratory depths 1 and 8; no display requirement inferred. No partition override: existing SIZE selection applies, with runtime zone allocation visible in private stderr; no claim that actual allocated memory equals requested preference.

Set SYSTEMLESS_LOAD_EXECUTABLE=Adventure/Adventure, then execute:

```powershell
& D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/adventure/adventure.hfv --headless --prefer-classic-68k --screen-depth 1 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/adventure/startup.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/adventure/startup
```

Second run substitutes depth 8, probe.json and probe output folder. Existing nonempty outputs cannot be reused; choose a fresh output directory. Exact private commands/scenarios and extraction script retained on D:.

1-bit startup ran 120 frontend ticks: script passed, zero assertions, zero budget-exhausted frames, guest tick 720. Inspected startup.png: empty titled Adventure window, blank menubar, no prompt.

8-bit probe ran 60 ticks and captured before, held Return (key36/ch13) two ticks/released, ran30 and captured after-return, clicked upper bar at v10/h50 for2 ticks and captured file-menu. Total94 frontend ticks, guest tick694, script passed, zero assertions or budget exhaustion. All three inspected captures show the same empty Adventure window/blank menubar; no visible response/menu. The label file-menu names the attempted action and does not mean a menu opened. No halt or explicit unimplemented-service error in captured stderr. PBRead startup logs end after loading pieces of the executable data fork. Observed evidence does not identify a specific missing service; initialization/library I/O or text/console setup is a hypothesis only.

## Behavior and limits

| Area | Result |
|---|---|
| Fixture loading/window creation | Observed at both depths |
| Readiness/text/menu | Blocked: no prompt/text/menu visible within bounded probes |
| Return/menu attempt | Inputs delivered by runner; no visible response |
| Gameplay commands/movement | Untested; no play scene reached |
| Timing/busy scene/fidelity | Untested; native frontend ticks are not wall-time performance |
| Audio | Untested |
| Saves/restore/preferences | Untested; no browser state touched |
| Physical controller | Untested |

README controls: typed commands; Command menu equivalents; Movement menu supports Command plus numeric keypad; space/Return/Enter advances [more]. File offers Save/Restore and printer scripting. These are documented, not behavior-qualified. No gamepad mapping created.

## Checks, rollback and next step

Extraction preservation/path-guard tests:2 passed. Source hashes unchanged, four selected files reopened and compared, executable metadata rechecked from fixture. Reports/scenarios parse as JSON; all four screenshots visually inspected. Private evidence-manifest.json lists scenario/capture/log hashes; preservation.json and executable-metadata.json record full preparation evidence. Only this report and review-summary.json added in the assigned documentation directory; no builds, shared code edits, browser access, imports, saves, deployments or commits.

Rollback: delete disposable D: fixture/scenarios/captures and this report directory if undesired; originals and runtime need no restoration. Next useful step is a focused startup trace around THINK C text/console initialization and executable data-fork reads, with known-good original reference screenshot if available. Determine the stalled/hidden initialization path before proposing any runtime fix or release entry. No grounded duration estimate until a failing service is localized. Lack of a compiled browser entry is preparation work and separate from this observed native startup blocker.



## Coordinator-requested final startup extension

A final startup-only8-bit scenario requested captures at ticks120 and480 (max500), same executable, no input, unchanged SIZE/no partition override. The tick120 capture was inspected and remains an empty Adventure window/blank menubar. No further meaningful log output appeared during the remaining360-tick run. Per coordinator wall-time bound, only owned process185628 was stopped after more than90seconds (recorded CPU119.42seconds); shell returned exit1. The tick480 capture and final report were not produced. This aborted extension is invalid as a completed480-tick observation; exact final guest/frontend tick and budget exhaustion are unavailable. Last logged PBRead is pos57134, but no evidence establishes a repeated I/O loop or identifies a missing service. This is unresolved readiness after a wall-bounded probe, not broad game incompatibility. Private extended.json, extended.stderr.txt and extended/before.png preserve the attempt. Workload explicitly released again after termination; no emulator remains owned by this worker.
