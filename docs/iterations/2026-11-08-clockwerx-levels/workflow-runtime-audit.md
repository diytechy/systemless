# Workflow runtime audit — 2026-11-10

The current process spends substantial effort collecting and reviewing evidence. There is a concrete avoidable cost in repeated full-state tracing. The available records do not divide total session wall time into model thinking, tool latency, source research, UI waiting and execution, so this is a bounded audit, not a complete accounting of every hour.

No new game, benchmark, native run or fitter ran for this audit. Root reviewed existing receipts/source and an independent Sol audit. Private detailed audit: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/workflow-runtime-audit-2026-11-10/peer/report.md`, SHA `f1a9a8912eb6c33bbcd99b41cc8ed9a694bdc5315a5589e65b503b6e4c9e77b8`.

## Measured costs

| Work | Recorded wall time | What it establishes |
|---|---:|---|
|402 public runtime tests|0.759s|Focused ordinary tests are inexpensive.|
|58 original cold guest run|51.859s|35 captures plus boot/options/gameplay; behavior capture, not a performance benchmark.|
|58 original-only fitter|180.062s, timeout|All six score archives survived; final report did not finish.|
|Saved-only report recovery|10.797s|Recovered the saved results without rescoring pixels.|
|Independent saved-output audit|71.078s|Checked all315 selections,34,125 DO rows and15 mask pairs.|
|58 cold model recording|5.163s|5648 updates, one constructor, light per-update recording.|
|58 four-policy discovery|174.342s|10140 updates/four constructors; all four failed against NPCs. Includes recording and runner hashing.|
|Discovery saved verifier|12.103s|Rehashed and checked saved traces, with no simulation.|

The discovery trace contains16,214,590,902 raw bytes. Hooks account for15,402,467,581 bytes, **95.0%**. There are394,344 hook rows plus10,144 per-update lineage rows:404,488 whole snapshots, approximately39.9 per update. The recorder takes snapshots before and after many callbacks, including each NPC callback and collider, serializes them to JSON and writes each synchronously. Per-update state, dot bodies and misc states are recorded again.

This is strong evidence that recording volume is a useful optimization target. Separate snapshot, serialization, I/O and hashing timings were not recorded, so neither an exact CPU share nor an achievable speedup is known. The cold/discovery elapsed-per-update ratio is18.8, but their workloads/logging differ; it is **not** a controlled engine comparison or promised speedup.

The fitter's last progress checkpoint was32/35 images at47.031s; all35 slices of all six score archives were subsequently found intact. Source inspection identified expensive postprocessing that sorted a complete array and materialized every finite index merely to retain the first five. Saved-only recovery used an equivalent early-stop enumeration. Scoring and formatting need separate durable completion states so another report timeout does not look like lost simulation work.

## Broader workflow costs

Source reconstruction, novel mechanic joins and actual route failures are legitimate work. Current58's four deaths are not a slow browser replay: the four policies did not plan around future NPC contact. A time-aware route method needs improvement alongside the observer.

Coordinator overhead also grew: many small prepare/review/authorize/execute/audit handoffs, bespoke per-level scripts, repeated artifact inventories and long historical checkpoints. This is visible in the work structure but is not timed separately. More parallel runners alone will not remove these costs and can increase review/context load. Shared compact tooling and coarser bounded work packages should reduce repeated setup.

Some earlier visible SVG checks were delayed by browser scheduling while a preview was hidden. The current source explicitly skips simulation when `document.hidden`; selected tab139 is now visible. This limitation is separate from headless functional execution and the recording costs above. No current browser CPU, memory or frame-time benchmark was taken.

## Concrete changes for continuation

1. Use compact search evidence: legal input runs, source/profile hashes, counters, per-update canonical/physical state, semantic events and terminal failure snapshot. Preserve every failed trial. Keep a bounded detailed window around failures; reserve expensive full callback-state traces for a selected witness and its fresh literal replay.
2. Introduce lossless state references/deltas and bounded batched writes where detailed traces are needed. Verify reconstruction/equivalence before adopting them. Stream hashes while writing; retain a crash journal and flush on failure/closure.
3. Time stages explicitly: engine updates, observer construction, serialization/output, hashing, scoring, ranking and report generation. Report active tool/process time separately from end-to-end session time and browser-visible waits.
4. Make reusable calibration/search/verification/delivery entry points; pass level data and capability recipes as inputs. Avoid hand-authoring the same harness per level. Preserve the independent original-data fitting boundary where it prevents tuning a comparison to the port.
5. Run focused shared-engine tests/regressions when shared code changes. For data-only levels on the same frozen engine, reuse that engine qualification and run per-level data/playability/native/render checks. Escalate full exhaustive diagnostics for a new mechanic or actual discrepancy.
6. Keep two useful lanes: serial novel-mechanic integration and independent known-mechanic data/functional preparation. Batch Root review at meaningful results instead of stopping between tiny reversible preparation steps. Continue native/heavy performance work sequentially.

These are workflow changes to implement and measure next. They do not retroactively qualify58, discard failed evidence, relax source preservation or assert full-game fidelity. See [faster validation](faster-validation-workflow.md) for acceptance boundaries and [handoff](session-handoff-2026-11-10.md) for the exact saved state.
