# DreamLight Verttice 3.0 — first-pass preparation

Outcome: compatibility blocker in the existing diagnostic PPC binary. No runtime or pacing change is recommended. Selected tool/model was supplied by the coordinator as fresh Sol; model identity was not independently verified.

## Preservation and identity

Selected Content/002, exact executable `DreamLight® Verttice™ 3.0 ƒ/DreamLight® Verttice™ 3.0`. Data fork SHA256 `5d81aa1749de43c93384dae945f78e18800fb3c6ec5fa55285cde80ae1e10847`; resource fork `03e9d8a460a5990cc8a1d9221067de64735ce3116a34f2d0afb5a2d921442633`. Content/006 is the documented matching duplicate, not substituted or rewritten. Help/index.htm identifies Version3.0 and explicitly says it was updated in Director7.0.2 on8/21/00, resolving the executable vers7.0.2 ambiguity. Resource inspection confirms PPC fragment and original SIZE6291456bytes.

Whole title folder retained, including Help assets, raw alias and application resource siblings. A narrow read-only Boot Preferences scan by title and creator DLVT found one existing preference; both forks and represented metadata copied into System Folder/Preferences. Its actual guest loading/reachability remains unverified because startup halts first. No preference values are exposed here. No browser save identity/route exists and none was invented or replaced.

Source002 before/after `8119cbbb69d4a0d5ea4d2cbc2011467fbe396846c79ea0341919a399951ba946`. Boot before/after `01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393`. Fixture `D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\verttice\verttice.img`, SHA256 `433b42519cacbf80e0e553bd2e62a79bdfd1afbd003c634a91a1b14a49d7bd50`. Reopened verified69files; separately compared dates for6 selected/ancestor folders. File forks, Finder type/creator/flags/location and dates retained. HFS+ signed coordinates retained as raw16bit words. Folder Finder information is unavailable through machfs; raw aliases may still refer to the original volume and are not qualified to resolve. Source media never mounted/written. Preservation details and private hashes: `D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\verttice\preservation.json` and `D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\verttice\evidence-manifest.json`.

## Reproduction and observed result

Checkout dev3953bedbf2c5e4d019cbf79b450ee9d29199ed6c; unrelated coordinator edits preserved. Existing native binary `D:\SystemlessBuild\target\ci-test\systemless.exe`, SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`, reports0.110.1; exact compile revision unknown. No build run. Explicit PPC selection and exact SYSTEMLESS_LOAD_EXECUTABLE above. Explicit8bit with default800x600 capture; exploratory dimensions exceed documented minimum512x384x256colors. Help requires PowerMac/System8+,10MB freeRAM,6MB free disk. Original SIZE retained without override.

Exact reproduction command and environment are in `D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\verttice\owned-process.json`; invocation uses fixture positional argument, --headless --prefer-powerpc --screen-depth8 --play-script startup.json --play-output startup. The scenario requests120frontend ticks then ready screenshot, max150; wall bound90seconds. Process PID89264 exited1 naturally. Unsupported import InterfaceLib:PBMakeFSSpecSync at PC$01F006F4 SP$07F6F4F0 LR$03053FB8 halts action0. Final report: frontend_ticks1, guest_tick0, budget_exhausted_frames0, assertions0, checkpoints[]. failure.png was inspected: blank cyan desktop and top white strip, no game title/readiness. Requested ready screenshot was never reached. This is an import compatibility blocker, not a timeout, rendering diagnosis, performance result or successful launch. The native workload is released.

## Behavior and controls

Documentation says enter player name then Return, press Play/Return/Enter, click Vert Nodes or use keypad positions, Space/5 for next node, P/* pause/resume, Delete abort. None was exercised after the halt. Readiness, motion/timing, busy scenes, controls/menu/pause, audible sound fidelity, saves, physical controller and collision/scoring fidelity are all untested. Native frontend counters cannot establish browser pacing; no benchmark or reference comparison occurred.

## Checks, limits and next action

Read skill/tuning/headless/play/common instructions. Existing helper verification passed on copied fixture and focused synthetic nested fork/Finder/date/raw-coordinate fixture. Own absolute-path runner rejects out-of-root paths, requires existing fixture/scenario before redirected logs, bounds wall time and persists ownership state. Source002 and Boot hashes remained unchanged. Reports written UTF-8 and summary JSON parsed. Private logs/scenarios/captures remain solely in assigned D: scratch. No shared helpers, runtime, catalogue, packaging, browser state, commits, uploads or deployment changed.

Smallest next step: separately authorize and implement/test the missing PPC InterfaceLib PBMakeFSSpecSync dispatch, then repeat this exact fixture and verify virtual preference reachability. Later Director imports may reveal further blockers, so a grounded completion estimate is unavailable. No pacing setting is justified. Rollback consists only of retaining/removing this own copied fixture and reports; originals require no restoration.


Coordinator post-review metadata audit: source ancestor dates were missing in 2 copied folders. A separate corrected copy is D:\SystemlessBuild\private-library-20261107\media-corrected-v1\verttice.img (SHA256 848dbe338a718e90edbbc6920ac57de3ad7367307ab7ded22fe97b3c5cb72c95). All 69 files retain identical forks/Finder fields/dates/coordinates; original copied volume label is verified directly from the HFS MDB and retained. Prior fixture/native reports remain intact. Corrected copy has not been replayed yet; no new gameplay or compatibility result is claimed. See ../metadata-audit.md.
