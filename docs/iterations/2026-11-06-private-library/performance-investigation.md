# ClockWerx performance investigation

Initial attempt: 2026-11-06 evening. Completed measurements: 2026-11-07, approximately 00:03–00:13 America/Chicago (UTC timestamps are in the JSON). Updated for the next-session skill handoff.

## Result

The local web server serves static files; emulation runs in the browser. The measurements point to runtime execution/pacing pressure under load. A **test-only 6 MHz instruction budget** restored the ClockWerx guest clock to approximately 60.15 Hz in one Edge tutorial capture. This is a candidate for further testing, not a production change or proof of full gameplay speed.

The default launcher remains at 25 MHz. No original Macintosh executable or disk image was changed. Moving the same bundle to HomeHub will change where assets are downloaded from, not where the game executes.

## Measured comparison

Same release WebAssembly bundle, ClockWerx's first Movement tutorial, 640×480 canvas, worker runtime and WebGL selected. Each capture lasted approximately 20 seconds, with the tab visible/focused and no gameplay inputs during measurement. All report `reason: complete`.

| Run | Actual instruction budget | Guest ticks/sec | Guest MIPS | Mean / p95 execution ms | Runtime calls/sec | Host total CPU samples |
|---|---:|---:|---:|---:|---:|---|
| In-app Chromium | 25 | 17.87 | 7.91 | 13.11 / 13.27 | 73.45 | 87, 96, 97, 92% |
| Standalone Edge | 25 | 30.64 | 12.82 | 13.08 / 13.23 | 73.85 | 50, 66, 61, 49% |
| Standalone Edge, experiment | 6 | 60.14 | 6.53 | 2.97 / 8.48 | 162.81 | 49, 57, 52, 54% |

CPU samples are sparse host-wide readings around the captures, not integrated process utilization. Edge and in-app captures used different browser versions and different host loads. Their difference cannot be attributed solely to the browser or graphics configuration.

Mean snapshot/copy times were approximately 0.036/0.050 ms, 0.049/0.072 ms and 0.042/0.064 ms respectively. The small values do not exclude expensive emulated drawing inside `run_frame` or final WebGL presentation. Browser animation callbacks were approximately 165/sec in all runs. Visual-work calls were 256, 431 and 823; neither count nor runtime calls/sec is displayed game FPS.

The normal 25 MHz runs spent approximately 13 ms in each runtime execution call and stayed behind the target clock. At 6, mean backlog fell from roughly 3.2 ticks to 0.37. This supports testing a lower per-game instruction budget; it does not establish a universal setting.

## Evidence and provenance

The following JSON files were copied unchanged from local captures into the handoff folder:

| Run | Runtime timing | Host CPU |
|---|---|---|
| In-app 25 | [JSON](../2026-11-07-game-modernization/evidence/clockwerx-iab-25mhz.json) | [JSON](../2026-11-07-game-modernization/evidence/clockwerx-iab-cpu.json) |
| Edge 25 | [JSON](../2026-11-07-game-modernization/evidence/clockwerx-edge-25mhz.json) | [JSON](../2026-11-07-game-modernization/evidence/clockwerx-edge-cpu.json) |
| Edge 6 | [JSON](../2026-11-07-game-modernization/evidence/clockwerx-edge-6mhz.json) | [JSON](../2026-11-07-game-modernization/evidence/clockwerx-edge-6mhz-cpu.json) |

Timing sources: the session's visualization folder `clockwerx-iab.json`; `D:\SystemlessBuild\diagnostics\clockwerx-edge.json`; and `C:\Users\Peter\Downloads\clockwerx-timing (1).json`. CPU sources were the correspondingly named files under `D:\SystemlessBuild\diagnostics`. The exports contain aggregate counters, not every raw frame row.

The release build included the private-library changes later committed as `459a4c06`; its compile-time footer still showed predecessor `1e2311e6` because compilation preceded the library commit. No new Rust build was made between these captures. No bundle hash was recorded during capture, so this is recorded provenance rather than a cryptographic build attestation.

Timing export completion timestamps are 06:02:58.085Z, 06:08:46.241Z and 06:12:51.690Z. User agents identify in-app Chrome 156 and Edge/Chrome 157. CPU: Ryzen 9 5900X, 12 cores / 24 logical processors.

## Why guest time can run slowly

At this revision `RuntimePacing` defaults to 25 MHz, two catch-up ticks per paint, four ticks reset slack, and no adaptive minimum. `www/src/emulator.rs` translates the setting into an instruction budget per guest tick, caps 68K wall-time work at up to 13 ms per call, and resets the wall-clock origin when too far behind. Under sustained pressure it can discard backlog instead of making guest time catch up.

The 6 MHz parameter changes this execution policy, not physical hardware clock speed or the guest's reported processor identity. Less instruction work per guest tick can keep the clock on time while still changing busy-loop/calibration-sensitive game behavior.

`guestExecutionMs` measures the entire worker `run_frame`, including execution, drawing and audio work. `guestTicksPerSecond` measures guest-clock progress, not physical frame rate. These boundaries are essential when interpreting the apparently large improvement.

## Historical failed attempt

The first attempt found host CPU at 100%. Managed Chromium processes had `--use-angle=swiftshader`; [SwiftShader](https://github.com/google/swiftshader) implements graphics on the CPU. That can contribute contention but did not establish its share of game cost. Brief per-process samples varied and were not an FPS benchmark.

Browser binding and native helper connections failed at that stage, so no usable timing comparison was captured then. Later measurements above supersede that earlier missing-data status. The F3 worker overlay leaves several relevant counters blank and changes presentation behavior, so an opt-in diagnostic script was added instead.

## Reproduce and finish validation

Use [the skill's capture procedure](../../../.agents/skills/mac-game-modernization/references/tuning.md). `scripts/runtime-profiler.js` is included by `scripts/package_library.py` and activates only with `?profile=1`. Test overrides 6/12/25 apply to worker boot; always confirm actual `cpuMhz` and reload between settings.

Outstanding:

- Repeated baseline/candidate captures under comparable host load, and the missing in-app 6 MHz repeat. Computer Use ended the preceding session because it could not establish the current URL for policy enforcement; no workaround was attempted.
- Actual rotation/movement/timer comparisons with an original/reference run, including later/busier levels. One no-input tutorial capture does not qualify gameplay.
- Sound/music, synchronization, pause/menu behavior, saves across reload and export/import, and physical controller behavior under the candidate setting.
- Independent baselines and candidates for Koji, Delirium and every additional inventoried title.

No production pacing setting should be inferred from these incomplete checks. The next-session scope and HTML5 pilot plan are in the [handoff](../2026-11-07-game-modernization/next-session.md).
