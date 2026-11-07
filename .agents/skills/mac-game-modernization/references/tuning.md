# Per-game inventory and tuning

## Preserve and inventory

Read the [handoff](../../../../docs/iterations/2026-11-07-game-modernization/next-session.md) and [library setup](../../../../docs/iterations/2026-11-06-private-library/README.md). The existing extractors target three specific games, not the whole SheepShaver library.

Enumerate the configured disk images and their catalogues read-only. Avoid reading a live, changing guest filesystem; close SheepShaver before consistent extraction/hash checks. Identify HFS versus an HFS+ volume inside an HFS wrapper. The current `hfsplus_read.py` supports inline extents and deliberately refuses overflow forks; use an appropriate read-only reader rather than dropping a fork.

Maintain one row per discovered title:

| Title/version | Source volume/path | 68K/PPC/fat | Executable | Depth/size | Preferences/save ID | Controls | Launch/behavior | Timing | Next action |
|---|---|---|---|---|---|---|---|---|---|

Record unsupported or uncertain entries explicitly. Do not guess architecture from the fact that SheepShaver runs it. Keep source paths locally where appropriate; do not include registration values or preference contents in documentation.

For extraction, preserve data and resource forks and Finder type/creator. Reopen generated images and compare every selected fork and metadata; check original hashes before/after. Extend the current extraction/build/packaging lists together when adding titles. A successful packager does not prove a new title is present unless its media, compiled entry and route are checked.

Retain existing game IDs and save mappings. Select the actual game executable in folders with installers/registration apps. Check memory partition and color depth per game. Use existing preferences unless a test explicitly needs a disposable copy.

## Baseline and capture

Use a release browser bundle. The native `ci-test` build with package optimization disabled is suitable for assertions, not a speed baseline. Headless frontend-tick runs likewise do not measure real-time browser speed.

Start the local static server if needed with `scripts/Start-MacGames.ps1 -NoBrowser`. Use the same origin for existing saves. Reuse the existing bundle if source has not changed. After changes only to the profiler/packager:

~~~powershell
python scripts/package_library.py www/dist
~~~

That refreshes the existing three-game bundle; it does not compile Rust or add new catalogue entries. Rust/catalogue changes require `scripts/Build-MacGames.ps1`. Use `-Extract` only when refreshing the copied media is needed.

The opt-in profiler lives in `scripts/runtime-profiler.js` and is packaged before the runtime boot. Open the game's route with `?profile=1`. For the existing ClockWerx experiment:

- Baseline: `http://localhost:8087/clockwerx/?profile=1`
- Test: `http://localhost:8087/clockwerx/?profile=1&profile_mhz=6`

The implemented overrides are 6, 12 and 25. They replace the **worker boot's** instruction-budget setting only on the test page. Reload to boot a changed setting. Confirm the report's actual `cpuMhz`; `testCpuMhz` alone is only a request. The override is not implemented for the main-thread fallback. A normal URL leaves production settings unchanged.

1. Record source revision, bundle hash/build provenance, browser/version, scene, display dimensions, output scale, renderer, worker/main-thread mode, settings and host CPU load. The current profiler does not embed all of these; add missing metadata in the result note.
2. Reach an actual level and let transitions settle. Use the same scene and input sequence for each run. ClockWerx: New game, enter a name if needed, choose numbered Movement, then Play; the TUTORIAL heading is not a level.
3. Keep the test visible and focused. Run only one active test emulator; avoid adding unrelated load or stopping unrelated user processes. Record contention instead of claiming an idle baseline.
4. Select Capture 20 seconds. For the initial ClockWerx comparison, make no gameplay inputs during the capture. A hidden tab or lost focus invalidates the capture; keep aborted evidence labeled.
5. Export JSON and name it by game, browser, scene, budget and repetition. The initial download button uses `clockwerx-timing.json` even on another title, so rename it. Pair it with timestamped host CPU samples and a short observation record.
6. Alternate baseline/candidate under comparable load and repeat enough to distinguish a consistent change from one noisy sample (start with three valid runs per setting). Compare medians and ranges. Avoid changing browser, graphics settings and instruction budget in the same comparison.
7. Confirm normal URLs and other titles still use their intended settings before promoting a per-game candidate.

F3 is unsuitable for this comparison: the worker overlay leaves several counters blank and changes the presentation path. Do not combine it with the opt-in profiler or another frame-trace capture.

## Interpret the counters

| Counter | Meaning and limit |
|---|---|
| `guestTicksPerSecond` | Guest clock against sampled wall time. Target is about 60.15 Hz for these entries; menu tracking/pause may affect it. Not animation FPS or fidelity. |
| `runtimeFramesPerSecond` | Completed runtime frame calls; includes calls with no new visual work. |
| `visualFrames` | Calls flagged as visual work; not physical display frames or unique game animation frames. |
| `animationCallbacksPerSecond` | Browser requestAnimationFrame callbacks, often the monitor rate. |
| `guestExecutionMs` | Worker `run_frame` time, including guest execution, emulated drawing and audio work; not isolated CPU-instruction cost. |
| `snapshotMs`, `jsCopyMs` | Snapshot/copy stages. Exclude guest drawing inside execution and final WebGL presentation. |
| `roundTripMs` | Worker request/response elapsed time, including scheduling. |
| `ticksBehind`, `cpuBudgetMs` | Backlog and wall-time allowance per frame. Persistent saturation suggests execution/scheduling pressure. |
| `guestMips`, `cpuMhz` | Instruction throughput and configured instruction-budget policy, not physical PC MHz. |

The profiler uses the interval from first to last sampled row for rates. The nominal 20 seconds and sampled interval differ slightly. Main-thread fallback maps `runMs` to execution and `renderMs` to snapshot, omits final paint cost, and does not provide the same breakdown; label it separately.

In the current source, `RuntimePacing` is in `www/src/catalogue.rs`; budgeting and backlog reset are in `www/src/emulator.rs`. Defaults are 25 MHz, two catch-up ticks per paint, four ticks reset slack, no adaptive minimum. The 68K wall-time allowance reaches 13 ms under backlog. Falling behind can reset the clock origin and discard backlog, so a high browser callback rate can coexist with a slow guest clock. Recheck implementation before relying on these values.

## Tune and qualify

Start with reversible per-game settings. Lowering the instruction budget can restore clock progress but change calibration, busy loops or game behavior. Compare the same scene with a trusted original/reference run: rotations, movement distance, timers, collision, scoring, transitions and difficulty must remain plausible. Record what the reference proves; SheepShaver itself is not automatically a perfect timing oracle.

Before accepting a candidate, check representative simple and busy scenes, pause/resume, menus, sound/music and synchronization, held/released input, fullscreen/focus changes, saves across reload and export/import, and actual controller hardware if available. Mark untested items rather than calling them passed. Preserve default behavior for other titles and use scoped regression tests for any shared runtime fix.

Keep input mappings game-specific. Delirium's saved directions are keypad keys, while ClockWerx actions are modifiers. Preserve shared modifier state and release controls on blur, hidden tabs and disconnect. Test browser shortcut conflicts and new-game/pause controls.

If evidence points to a missing Mac service, make the smallest runtime fix with a failing reproduction and focused tests. Do not patch original executable bytes to hide a runtime defect. If a candidate fails fidelity checks, revert that setting and investigate the execution/drawing/audio cost indicated by evidence.

A remote static host affects download/startup and headers; gameplay still runs on the client. HomeHub hosting alone is not an emulator speed fix.
