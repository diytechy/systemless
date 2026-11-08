# Bikaka final bounded experiment review

Decision: **do not adopt12MHz**. Retain the unchanged production25MHz setting. The six completed captures provide bounded diagnostic evidence of a higher observed guestclock at12MHz under the recorded conditions; they are not three valid matched-load/scene comparisons and establish neither original pace nor clean resource savings. No automatic retry is needed to close this bounded experiment.

Independently read all six public run records, all raw timing rows and resource sample/process records, resource summaries, experiment plan and all18 begin/end/post-M PNGs. Recomputed every timing metric mean/p95/max, tick rates, backlog distributions, same-process CPU deltas, contained intervals, host means and aggregate memory statistics; checked report/resource hashes against public records. All strict raw checks passed: complete/visible/focused, actual quota in every row, worker/WebGL,800x600/8bit, monotonic timestamps/ticks/instructions, resource coverage brackets capture. Same compiled7170f7e7 and WASM af55e03d31219e324f8ad49e6af8877836f07591aaa8409a099967e0a9fc9a5f. Geometry remains root-recorded CSS608x455.5/window665x672, backing800x600; PNG650x657 is scaled. Strict integrity is separate from matched experimental validity.

| Run | Raw rows | Guest Hz | Execution mean ms | Host CPU mean % | Aggregate all-browser/Codex CPU % of host |
|---|---:|---:|---:|---:|---:|
| bikaka-p1-25 | 1386 | 17.773621 | 13.969365 | 81.600000 | 62.326229 |
| bikaka-p1-12 | 1426 | 44.665357 | 13.563927 | 49.400000 | 26.891330 |
| bikaka-p2-12 | 1355 | 32.790234 | 14.112185 | 83.500000 | 31.985036 |
| bikaka-p2-25 | 1243 | 11.413042 | 15.070800 | 98.500000 | 45.310624 |
| bikaka-p3-25 | 1344 | 16.618867 | 14.241782 | 78.133333 | 33.220432 |
| bikaka-p3-12 | 1414 | 45.913211 | 13.685134 | 42.375000 | 17.712069 |

25MHz median16.618867Hz (range11.413042-17.773621);12MHz median44.665357Hz (32.790234-45.913211). Nominal pair differences12-minus25 are26.891735,21.377191,29.294344Hz. These are descriptive associations. The guestclock ranges do not overlap, but the same quotas also align with different piece sequences and consistently lower candidate host load, so these repetitions do not isolate quota causality or efficiency.

The missed protocol is material: every25MHz begin has pinkblue first, recorded goldnext; every12MHz begin has pink first/pinkblue next. Same score0/level1/lines0 is not a matched sequence/workload. In addition, p1-25 screenshots do not visibly show the next-piece pane visible in later runs; goldnext remains the root observation record rather than an independently readable cue in that begin PNG.25MHz hostmeans81.6/98.5/78.133333 versus12MHz49.4/83.5/42.375 defeat matched-load interpretation. Alternating order did not repair either confound. Manual readiness/start/export gaps and different progress per20wallseconds further vary phase and work. All six captures are retained, with these hazards explicit; none silently discarded or treated as clean paired evidence.

Resource samples bracket each capture, but contained CPU intervals cover17.660214-19.737827seconds rather than the complete20seconds. The aggregate includes unrelated browser/Codex processes and omits new/exited/invalid CPU pairs; PID reuse may be undetectable. Host CPU and appwide CPU are different boundaries. Aggregate working sets may double count shared pages, private bytes measure committed allocation, and worker Wasm length is allocated linear memory. No isolated game CPU/RAM, page-memory result or physical latency was measured. Full exact raw hashes/statistics, including all omissions and per-process CPU contributions, accompany this review in JSON.

PNG review supports distinct starting sequences and falling/locking progression/score changes, with all endings level1/lines0. Separate postcaptureM shows clear left displacement in p1-25,p1-12,p2-25,p3-12. p2-12 is near locking and does not isolate movement from time; p3-25 is unqualified for isolated input response per root same-visible-frame record. Timing/phase differences between end and M images prevent treating small apparent offsets alone as a successful release/response test. No gameplay input was made during20second captures per root protocol; PNGs cannot independently prove continuous absence of input. No broad controls or input-latency qualification follows.

Sound was checked in Options, music unchecked; audibility/synchronization unqualified. Independent original/reference pace, busy scenes, line completion/scoring rules, save reload/export-import and physical controllers remain untested. Guest60Hz is not independently established original game pace. Original512000SIZE by omission, explicit68K executable,8bit, fixture/resources and stable saveID retained. Root reports normal8087 untouched; evidence is isolated55847. No production/config/source change authorized by these results.

This bounded diagnostic can close. A future request for qualification would first need matched initial piece sequence/phase and comparable host conditions plus a trusted original pace comparison, then the missing fidelity/audio/save/input gates. No further automatic repetitions are recommended here.

Only final-experiment-review.md/.json written. No browser/emulator/build/conversion/benchmark/nesting/commit/shared-source edit performed. **LIGHT workload released; no controlled workload remains owned by this worker.**
