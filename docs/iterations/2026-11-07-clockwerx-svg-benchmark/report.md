# ClockWerx bitmap / SVG / Astra comparison

Completed on SVG-Port, base5c124025. User requested a matched benchmark and explicitly asked Astra to reinterpret the original bitmap hands as clean symmetric vectors. The [predeclared protocol](protocol.md) and [Astra report](astra-review.md) preserve scope and method. Normal local pilot receives the accepted Astra hands plus the separately identified goal correction. No push/upload/public deployment or emulator build.

All nine20second captures passed:29,651 raw rAF rows,274 OS resource samples, identical complete initial snapshots,2,400 active120Hz simulation steps each, no catch-up loss, no input, visible/focused throughout. All nine post-capture page-memory calls completed; raw and memory-enriched frame records match exactly. No invalid attempt or replacement was discarded. Source was byte-identical across the three frozen routes; only their assets/manifest/presentation branch differ. Movement contains player plus three moving demonstration hands. Browser Chrome157 IAB,900x1100 viewport, CSS615x461.25, backing640x480,DPR1, silent/gold. Asset decode precedes each capture.

| Median of three runs | Bitmap | Literal SVG | Astra SVG |
|---|---:|---:|---:|
| Main-thread work / callback (ms) | 0.429 | 0.746 | 0.756 |
| Per-run p95 work (ms) | 0.660 | 1.010 | 1.200 |
| Main-thread work occupancy (%) | 7.08 | 12.30 | 12.48 |
| Broad browser/Codex CPU (% of24thread host) | 4.81 | 5.80 | 5.63 |
| Page-associated memory (decimal MB) | 4.127 | 4.116 | 4.040 |
| Orientation updates / sec | 12.65 | 164.95 | 164.95 |
| Positive angular step (degrees) | 5.625 | 0.432 | 0.432 |
| Repeated software pose (%) | 92.33 | 0.00 | 0.03 |

SVG has visibly finer submitted orientation: approximately0.432degree steps at165callbacks/sec versus5.625degree bitmap bins at12.65changes/sec. The bitmap repeats about92.3%of poses. This supports reduced angular stepping, not physically displayed FPS, input latency, compositor/GPU quality or freedom from scheduling gaps. Per-run rAF p95 gaps were6.130–6.280ms. Maximum gaps: bitmap6.46–24.05ms; literalSVG6.53–11.965ms; Astra6.545–18.23ms. Retain those outliers. Interpolation still has up to one8.33ms fixed-step presentation offset.

Measured main-thread callback work was about1.74x(literal) /1.76x(Astra) bitmap at the median; mean ranges bitmap0.376–0.506ms, literal0.633–0.871ms, Astra0.744–0.983ms. These are elapsed synchronous update/Canvas-submission wall times, excluding pose-log append, compositor/GPU and most diagnostic serialization; they are not OS CPU allocation. No repeatable Astra-versus-literal cost gain is established. All variants kept up with simulation.

OS CPU is the timestamped aggregate of matching chrome/msedge/Codex/ChatGPT-family processes, including other activity. Logical24processor normalization; only samePID/name deltas inside capture count. It is not isolated game CPU. Range bitmap4.26–5.18%, literal4.20–5.85%, Astra4.24–7.71%; host mean load across runs45.4–97.2%. The host mismatch and overlapping ranges prevent a causal game-CPU ranking. Exact process-name totals, omissions, working sets/private commit and coverage are in evidence.json; shared working sets may double-count pages, private commit is not physical RAM. Every sampler brackets its capture; all nine were exclusive.

Page API memory ranged4.126–4.178MB bitmap,4.062–4.234MB literal and4.034–4.219MB Astra. These overlap: no meaningful RAM saving is established. The API reports page-associated allocations after capture, including retained diagnostic rows and a1,228,800byte Canvas surface in every run; it does not certify all decoded image/GPU/cache/process memory. Final marker overlay is additional unmeasured work/assets.

| Run | Mean / p95 work ms | Broad CPU % | Host CPU % | Page bytes | rAF rows |
|---|---:|---:|---:|---:|---:|
| r1-bitmap | 0.376 / 0.530 | 4.26 | 54.4 | 4178204 | 3301 |
| r1-current | 0.871 / 1.225 | 5.85 | 60.5 | 4233701 | 3301 |
| r1-astra | 0.756 / 1.055 | 4.24 | 45.4 | 4218938 | 3301 |
| r2-current | 0.746 / 1.010 | 4.20 | 49.6 | 4116065 | 3301 |
| r2-astra | 0.744 / 1.200 | 5.63 | 55.6 | 4033807 | 3272 |
| r2-bitmap | 0.506 / 0.750 | 5.18 | 97.2 | 4125510 | 3274 |
| r3-astra | 0.983 / 1.470 | 7.71 | 72.9 | 4039535 | 3301 |
| r3-bitmap | 0.429 / 0.660 | 4.81 | 69.3 | 4126840 | 3300 |
| r3-current | 0.633 / 0.940 | 5.80 | 52.9 | 4061603 | 3300 |

Astra inspected25original orientation references. Exact reflected Bezier boundaries/cutouts, shared gold/black geometry, unchanged descriptors/reach, board and10copied assets passed hash/geometry review. Coordinator reviewed8x original/revised/rotated contact sheet and native-size game: smooth identity-preserving shapes, legible black/gold, correct pivot. HeldX9seconds transferred player right; heldSpace30+30seconds with an intervening tool gap reached the goal. These checks establish playability, not exact original action/goal timing. Pause/restart and PNG export checked separately. Engine/board hashes are unchanged. Audio and physical controllers remain unqualified.

The user correctly identified missing goal triangles and motion. Original still and32saved original6MHz PNG frames confirm four pale-blue markers moving around the sphere. Both earlier bitmap and SVG pilots omitted them, so the matched nine-run comparison remains fair but incomplete in presentation. After captures, added a separate private SVG overlay around the stationary ordinary dot, rotating from simulation time with a1.25second full-turn approximation. Exact original cadence/direction/phase and shimmer amplitude are not independently qualified; the sparse encoded sequence is an appearance reference, not an original-hardware timing oracle. No gameplay/collision changes. The final route differs from the measured Astra route in this disclosed correction and its loader/draw support.

Frozen common-code packages: bitmap410,678B, literal93,776B, Astra95,045B(source25,033B in each). Astra hands total3,501B versus literal2,232B: cleaner geometry costs1,269B more, not less. Most bundle savings come from removing prerotated sprites, unused packaged media and verbose metadata. Sizes are uncompressed local files, not tunnel transfer. The final goal overlay/source changes have separate activation sizes.

Effort: Astra estimates12active minutes across reading25views, reconstruction/generator, rendering/checks and report. Coordinator effort includes common instrumentation, controlled180seconds gameplay sampling, nine40second resource windows, post-capture memory requests, visual/play review, goal investigation/fix, documentation and integration; approximately30–45active minutes, not a stopwatch/productivity estimate. Full-port scope/effort remains unchanged: one Movement board only, no campaign/scoring/original-save compatibility. Original media, forks, Finder metadata, runtime preferences and save identities were not modified.

Raw JSONs, freezes, contact sheets, per-run ownership, source hashes and final activation audit remain in D:/SystemlessBuild/diagnostics/2026-11-07-svg-benchmark. Regenerate reductions with `python scripts/analyze_clockwerx_foreground.py <private-root> --output <new-summary.json>`. Generic code/tests and numeric/text evidence only are committed. Art/design profiles stay private.

Final activation:96,426bytes(source25,490; assets67,296; manifest3,640),16content assets; goal marker599bytes. The previous literalSVG live route is retained intact at `live-literal-svg-reference`. Protected library index/metadata/WASM hashes remained identical. Final local8087 route visibly ready and exported a valid640x480 Canvas PNG. Separate page/canvas, black-hand, transfer, goal-completion and moving-marker evidence recorded. Viewport override reset. Focused engine/rendering checks,7vector/generator tests,6packaging tests, JS syntax, Python compile and Git whitespace passed.
