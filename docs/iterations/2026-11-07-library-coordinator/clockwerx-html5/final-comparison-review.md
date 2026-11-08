# Final ClockWerx comparison review

Accepted outcome: a bounded, playable HTML5 Movement slice with original private artwork/map/effects and independently observed goal/input/pause/restart behavior. This is not full fidelity, a full-game replacement, a production6MHz recommendation or an isolated emulation-overhead measurement. Source stayed frozen during the final comparison.

## Artifacts and checks

Final app SHA256 `1e04a0e7bc3a86ccc96cb6cc97ed9c39d8e85667c9239e176c7f239848511758`; release WASM `af55e03d31219e324f8ad49e6af8877836f07591aaa8409a099967e0a9fc9a5f`; private asset-manifest `307bdb47b12fd6874358e8f0434d1b3d7fdd258999afa5a8c9968549631d8463`. Actor clipping is absent in every final prototype run. The small yellow pause text remains. The original sometimes extends actors into the collage; the short earlier32frame sample did not establish a global clip.

Raw folder: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/clockwerx/final-comparison-v2/`. Reviewed session.json and every primary timing/resources/resource-summary:25-a-r1,25-b,25-c;6-a-r1,6-b,6-c;html5-a,b,c. Every raw timing frame and resource sample was parsed for conditions/statistics. File hashes, per-run statistics, CPU reconstruction and motion-fit details are in final-comparison-review.json. All9 resource windows bracket captures;14–15 samples lie within each20second window. All original captures finish visible/focused. All prototype frames are visible/focused, active/unpaused, with no held/recorded inputs and no dropped catch-up seconds. Sound is off; backing640x480, CSS615x460.75, viewport672x1000 on root's same Chrome157/Windows IAB.

The3 *-c-with-memory files differ from their timing originals ONLY at pageMemory: raw frames and every other condition remain identical. All3 memory queries start after their timing captures. Raw/excluded files remain retained: initial25-a (superseded by25-a-r1), and6-a-timing-unpaired (resource sampler expired before capture). Neither enters the primary comparisons below. PrimaryA timing remains valid but its sharply different ambient load makes it unsuitable for a clean pooled CPU inference.

## Gameplay pace and work

| Primary run | Guest ticks/s | Worker runtime calls/s | Worker guest work mean / p95 ms per call | Host CPU mean % | All browser/Codex CPU % of host |
|---|---:|---:|---:|---:|---:|
|25-a-r1|18.1241|73.30|13.111 /13.285|91.36|8.846|
|6-a-r1|60.1531|156.29|3.051 /9.845|26.27|4.546|
|25-b|26.6396|74.06|13.086 /13.235|32.40|5.815|
|6-b|59.7911|148.20|4.192 /11.914|38.27|4.844|
|25-c|25.2264|73.88|13.097 /13.245|37.00|5.980|
|6-c|60.1586|148.52|4.244 /11.803|36.60|5.344|

| Prototype run | Active120Hz steps /20sec | rAF and render calls/s | Main update+Canvas draw mean /p95 ms per callback | Host CPU mean % | All browser/Codex CPU % of host |
|---|---:|---:|---:|---:|---:|
|html5-a|2401|165.022|0.341 /0.430|87.60|5.300|
|html5-b|2400|165.011|0.239 /0.310|30.73|3.269|
|html5-c|2401|165.018|0.244 /0.315|34.40|3.202|

These work boundaries differ: native guest execution excludes portions of main-page/renderer work, whereas prototype callback work includes input, simulation and Canvas submission. Neither measures physical presentation or input-to-visible latency. Runtime calls are not guest ticks; visual-work flags are not display FPS. Original visual-work counts correspond to12.85–18.90/s at25 and40.79–41.24/s at6; prototype rAF/render calls are~165/s while simulation advances~120steps/s, often redrawing unchanged discrete sprite poses. No165FPS gameplay claim follows.

Median guest rate is25.2264/s (range18.1241–26.6396) at25 and60.1531/s (59.7911–60.1586) at6. This supports a ClockWerx-specific experimental pacing candidate, without independently qualifying full-game timing/sound/collision or promoting a setting.

### Actual angular pace

PIL analysis used gold pixels outside9px around fixed pivot122,120, unwrapped centroid angle and OLS against the midpoint of each ordinary PNG request/completion timestamp. Exact private per-frame fits:25-c-motion-worker-angle-fit.json and6-c-motion-worker-angle-fit.json beside raw inputs. PNG sampling/encoding adds work; no SheepShaver/physical-original oracle is available.

| Evidence | Samples/span | Estimated seconds/revolution | Meaning |
|---|---|---:|---|
|25-c rendered PNG sequence|26frames /4.904s|13.0893|Only2.276rad (~0.36turn) observed; period is a partial-turn extrapolation; R²0.99393 |
|6-c rendered PNG sequence|33frames /4.991s|5.0002|About6.181rad observed; R²0.99947 |
|PrototypeA exported angle delta /capture walltime|20.00337s|5.0542|Pivot/direction unchanged; simulation-state angular progression, not displayed-frame measurement |
|PrototypeB same method|20.00470s|5.0567|Same boundary |
|PrototypeC same method|20.00390s|5.0543|Same boundary |

Default25 has a plainly slower real-world gameplay pace; it cannot supply a pace-matched causal resource comparison. The prototype follows its earlier5.0555s sampled6reference and is about1.1% slower than the newer6-c fit. Sampling overhead, centroid quantization and changed host conditions prevent treating this small gap as an independently calibrated fidelity error. Default PNG request/completion intervals average66.8ms versus26.7ms at6, another reason not to equate these samples with uninstrumented gameplay timing. Do not substitute guest ticks, fixed steps or rAF for the measured angular evidence.

## CPU and memory boundaries

The sampler sums ALL matching browser/Codex processes, including unrelated tabs/app services/agents; it cannot isolate game CPU. Ambient load differs sharply: A25~91%, Aprototype~88%, A6~26%. B/C are more comparable at~31–38% mean host load but remain uncontrolled. B/C show lower broad aggregate CPU for the pilot (3.20–3.27%) than6 (4.84–5.34%) and25 (5.81–5.98%); these are observed app-wide associations, not isolated game savings or pure emulation overhead. Scene/rules/audio/menu/save omissions and pace differences also contribute.

Independent recomputation from cumulative per-PID CPU seconds over wholly-contained intervals agrees with all9 resource summaries within0.00000007percentage points (date precision difference). The constant omitted CPU pair is PID20352, raw name `codex-windows-sandbox-service`, with `cpuSeconds:null` at both ends:13intervals in25-a-r1 and14 in each other run. There are no decreasing-CPU pairs behind this flag. Raw samples lack command lines/service ownership or game-renderer association, so the name is reported without guessing protection reason or game association. New/exited/invalid pairs can undercount; PID reuse remains a methodological limit. See cpu-invalid-pair-review.json.

| Separate postcapture browser memory API estimate | Bytes | MiB |
|---|---:|---:|
|25-c|20,873,732|19.91|
|6-c|21,101,318|20.12|
|html5-c|5,373,824|5.12|

This experimental API estimate is not process RSS, total/unique physical RAM or GPU memory. In the6-versus-pilot estimate,13,516,800bytes of the15,727,494byte difference (~86%) is the reported Canvas category (original14,745,600bytes; pilot1,228,800bytes). It cannot all be assigned to CPU emulation or original game logic. Worker WebAssembly linear allocation is separately170,524,672bytes for B/C, with A25=170,786,816 and A6=170,917,888. It is allocated address-space length, not resident memory; main-page Wasm is unmeasured. Do not add API estimate and Wasm allocation into a supposed RAM total because accounting/overlap is not established.

App-wide summed working sets vary~4,825–6,341MiB across runs; private committed bytes~4,742–5,866MiB. These are dominated by the broad process set and may double-count shared pages. They do not establish game-specific memory or unique physical RAM savings.

## Startup, payload and portability

Original worker-boot-message→first-returned-frame:25=587.7/266.5/308.3ms;6=344.1/303.1/315.9ms. Prototype module-evaluation→required local image decode/manifest parse:691.9/499.2/450.9ms. These boundaries differ and exclude different navigation/download/readiness work. There is no defensible cold-start speed ranking from them.

Warmed main-window ResourceTiming reports15original resource entries with23,203,741encoded body bytes and4,500transfer bytes; it excludes dedicated-worker fetches and is not complete bundle/network accounting. Prototype startup reports176entries,310,618encoded body bytes; transfer bytes66,687onA and52,800onB/C. More small revalidated requests can transfer more header bytes despite smaller encoded contents. Cache state cannot be inferred from transferSize alone. Required runtime images are172PNGs plus manifest and3modules in that startup sample; effects are off and audio is a separate preload boundary.

The private pilot package contains364asset files totaling220,030bytes, plus165,615byte manifest and21,533bytes in the4runnable source files:407,178bytes before HTTP/container overhead. It contains one board; the original fixture contains the application/campaign/music/etc. This is a bounded-slice payload observation, not a forecast of complete-port size. Tested on one local warmed browser/origin only; offline support, other browsers, cold-cache startup and HomeHub remain untested. No upload/deployment occurred.

## Behavior, effort and recommendation

Root's coordinator-review independently observed prototype keyboard Space goal completion, restart, toolbar/keyboard pause/resume, six-second bounce with pivot retained, six-second flip moving two grid intervals, reverse path exercised, valid PNG and exact canvas geometry. Original6 advanced to Spikes after the same held-swing segments; tool gaps/phase preclude a precise completion-time comparison. Original scoring/campaign progression differ intentionally; prototype stops at its completion overlay. Original resources/help support the4action semantics and combined swing+bounce flip. Collision windows/actor masks, demonstration choreography, fonts/shadows and goal presentation remain reconstructed; sound audibility/synchronization and physical controller remain unqualified. No full fidelity acceptance follows.

Measured timestamps: start23:14:05UTC, first source freeze23:37:55 (~23m50s), final presentation-only clip removal00:12:19, primary raw review resumed00:55:28. Root GUI/capture phase spans~77minutes elapsed from first freeze; it includes coordination/idle/tool and memory/export retries and exceeds the nominal45minute validation elapsed target. Worker was explicitly idle during most of that phase. Activity estimates, not stopwatch measurements:~24minutes initial discovery/implementation/reporting,~2minutes coordinated presentation fixes,~8–12minutes final evidence review/reporting. Final effort and elapsed end are in worklog/review-summary; these agent minutes are separate from subjective developer-hour planning ranges.

Continue retaining both original runner and bounded pilot. The pilot demonstrates feasibility and lower local work/API estimates for one simplified scene; it does not justify replacing the game or accepting global pacing. A full port remains a separate decision:120RND2resources,38spritegroups and at least9 unimplemented mechanic families motivate a subjective low/likely/high planning range280/800/2020developer-hours (engine40/100/220, mechanics100/280/700, content40/120/300, validation100/300/800). Counts are accessible resources, not qualified levels/rules. This is not measured extrapolation from agent speed; hidden interactions, content variants, exact timing/audio and full playthrough/controller/browser qualification dominate. Re-estimate after several mechanically distinct complex boards.
