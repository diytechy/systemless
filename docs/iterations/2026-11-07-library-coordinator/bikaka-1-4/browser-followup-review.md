# Bikaka release timing review

Unchanged baseline; reversible12MHz versus25MHz diagnostic justified. No accepted setting. LIGHT raw-data/source/PNG review only; no browser/emulator/build/conversion/benchmark/source edit/private mutation. Root queue/action changes preserved on dev.

All1404 raw rows scanned: timestamps and guest ticks monotonic, actual25MHz and13ms wall budget throughout; every execution exceeds13ms. Backlog1/2/3/4/5 counts122/328/336/413/205. Guest4555 to5075 over19.981295000001786s,26.024339263293673Hz.26visual-work rows are not physical animation frames. Runtime70.21566920461734calls/s; execution mean/p95/max13.819344729384104/14.065000001341105/14.95499999821186ms; round-trip14.149084757907353/14.5/18.730000000447035ms. Linear allocation164102144bytes; page memory/physical latency absent.

Inspected profiler worker-only6/12/25 override and emulator wall-time budget/backlog reset source. Saturation/backlog supports testing intermediate12, but does not isolate CPU instructions from drawing/audio. All29resource rows/process records scanned;15inside samples,14contained intervals19.314622s independently reproduce6.33695204251646% of24-core host. Host CPU33-60%, mean45.4. Six new/six exited pairs and14invalid pairs omitted. ChatGPT23.96875CPU-seconds dominates versus msedge2.9375 and chrome-headless-shell2.265625. Aggregate all-browser/Codex CPU/memory is not game CPU or unique physical RAM.

Inspected keys PNG: Mleft/Ndown; other glyphs do not establish key codes. Active still shows pink piece left, score6/level1/lines0. Temporal falling/locking and pause/resume are root observations, not established by stills. Root recorded CSS608x455.5, backing800x600, window665x672;650x657PNG is scaled. No672x1000 claim. Preserve explicit68K executable,8bit, original512000SIZE by omission, resource fork and stable saveID; no external preference found does not prove clean defaults.4bit wall-cap probe is unqualified.

Predeclare25->12,12->25,25->12 pairs, new matched baseline repetitions rather than reusing this exploratory capture. Reload each run and verify actual quota/build. FreshCommandN score0/level1/lines0, fixed short readiness interval, noinput20s, same geometry/sound/options; exclusive visible/focused capture ownership and comparable host load. Save raw reports/resources and beginning/ending board/score/level/lines/next cues. Separate postcapture M300ms press/release path. Compare paired deltas and medians/ranges. Random pieces, phase and changed guest pace change work completed within20wallseconds; CPU differences cannot establish causal efficiency or fidelity.

Stop/label invalid on focus/visibility loss, wrong quota/build/mode/geometry, unexpected menu/pause/dialog/gameover, missing readiness, concurrent load or corrupt capture. Stop candidate on implausible pace, failed movement/release or audio regression. Record invalid evidence before resolving cause and repeating a pair. No promotion without independent original pace/rules, busy scenes, line/scoring, audible effects/sync, input/focus/pause, saves/reload/export-import and physical-controller evidence. Guest60Hz is not independently established original game pace.

Exact hashes and machine-readable statistics/protocol:

```json
{
  "title": "Bikaka1.4",
  "outcome": "reversible12MHz diagnostic justified; baseline unchanged",
  "review_head": "230768b1d2abba3a67e57b93e7925a3b80b59306",
  "compiled_revision": "7170f7e7",
  "wasm_sha256": "af55e03d31219e324f8ad49e6af8877836f07591aaa8409a099967e0a9fc9a5f",
  "accepted_setting": null,
  "raw_hashes": {
    "bikaka-active.png": "21f358901895a1e0574479e5b911d4d8a1c14f603660eaf89111c5e263512c0f",
    "bikaka-keys.png": "34410e01e692baa083f77fcfb3d0392e40ddacdd0c560908b8033659567d22c1",
    "bikaka-resource-summary.json": "4a860c13cb60443b1d90f767c98b8c67a4715153715cd6920045521ff8c52546",
    "bikaka-resources.json": "7388d2d399e1a8ff7fb60c3280677c357d211328b16a90e8d23def0a442655b9",
    "bikaka-timing.json": "88680a8aa378a3a7a99c1f5f78db749a36ee26f45345f3b8c9f9854db8bce57c"
  },
  "raw_frame_review": {
    "rows": 1404,
    "time_or_tick_reversals": 0,
    "actual_mhz_all": 25,
    "cpu_budget_ms_all": 13,
    "execution_above_budget_rows": 1404,
    "ticks_behind_counts": {
      "1": 122,
      "2": 328,
      "3": 336,
      "4": 413,
      "5": 205
    },
    "visual_rows": 26,
    "sampled_seconds": 19.981295000001786,
    "guest_ticks_per_second": 26.024339263293673,
    "execution_ms": {
      "mean": 13.819344729384104,
      "p95": 14.065000001341105,
      "max": 14.95499999821186
    },
    "round_trip_ms": {
      "mean": 14.149084757907353,
      "p95": 14.5,
      "max": 18.730000000447035
    },
    "linear_memory_bytes": 164102144
  },
  "resource_review": {
    "all_samples": 29,
    "inside_samples": 15,
    "contained_intervals": 14,
    "seconds": 19.314622,
    "coverage_brackets_capture": true,
    "new_pairs_omitted": 6,
    "exited_pairs_omitted": 6,
    "invalid_pairs_omitted": 14,
    "aggregate_cpu_percent_of_host": 6.33695204251646,
    "host_cpu_mean": 45.4,
    "host_cpu_range": [
      33,
      60
    ],
    "boundary": "All browser/Codex processes; not isolated game CPU/RAM. Shared pages may be counted repeatedly. CPU omission can undercount."
  },
  "protocol": {
    "order_mhz": [
      25,
      12,
      12,
      25,
      25,
      12
    ],
    "pairs": 3,
    "seconds_each": 20,
    "preparation": "Reload each requested quota on isolated55847 route; verify actual worker cpuMhz, build/hash, 800x600/8bit, null partition; CommandN fresh score0 level1 lines0; fixed short readiness interval, no pause or gameplay input during capture. Keep same sound/options and actual CSS608x455.5, window665x672; record geometry each run.",
    "postcapture": "After timing export, separate M300ms press/release path; confirm visible lateral displacement and released input. Never include this in resource comparison.",
    "gates": "One active emulator and exclusive controlled capture ownership; visible/focused complete worker/WebGL reports; verify all rows actual quota; paired resource coverage and comparable host load; preserve isolated saves and normal8087. Record initial/ending board, next piece, score, level and lines, game-over/transition state.",
    "stop_conditions": "Abort/label invalid on hidden/focus loss, unexpected pause/menu/dialog/game over, wrong build/mode/quota/geometry, concurrent workload, capture corruption or missing readiness. Stop candidate on visibly implausible pace, failed movement/release, audio failure or regression. Do not silently replace invalid repetitions; record and repeat matched pair only after cause resolves.",
    "analysis": "Recompute raw statistics per run, compare paired deltas and per-setting median/range for guest ticks, execution, round trip, backlog, memory and host context. Random pieces and guest pace alter work within20wallseconds; do not interpret lower aggregate CPU as isolated computational efficiency or fidelity."
  },
  "qualification": "No candidate run performed. No independent original pace reference; 60Hz guest clock is not established game pace. Audio, busy scenes, rules/line scoring, saves and controller qualification remain missing.",
  "changes": [
    "browser-followup-review.md",
    "browser-followup-review.json"
  ],
  "workload_released": true
}
```

Only the two assigned review files written. No tests needed for documentary review. LIGHT review workload released; no emulator or controlled capture remains owned.
