# Expanded release: initial ClockWerx review

These are two exploratory captures, not the final paired comparison and not an accepted tuning change. The original 25 MHz budget remains unchanged.

## Provenance and conditions

Staged bundle: D:/SystemlessBuild/private-library-20261107/dist-v1. WASM SHA256 `5dbe3ffc3587bbce75a1fecda0c64593284b39aec40f98c12bd7b602d3c085a1`, compiled from4f83d947 plus individually hashed integration sources in build-inputs-v1.json. Optional worker/profiler scripts were refreshed without changing WASM or guest logic; browser-js-v2.json fingerprints them. The default capture used the initial profiler; the6 capture includes the new allocation/load diagnostics. Final repeated captures must use one stable diagnostic version.

Root used supported visible IAB, Chrome157 on Windows, WebGL presentation and runtime worker. Both captures completed with visible/focused flags true, logical/backing640×480, viewport672×1000 and CSS615×460.75. Temporary viewport override had to be reapplied for the fresh6 tab; geometry was verified before its capture. Separate localhost:55847 origin keeps normal localhost:8087 saves untouched. Synthetic player `pilot` and settings persisted across fresh tabs; initial Saved Files0 was a loading state, later2 recovered.

Scene: numbered tutorial1 Movement, keyboard, Single Player, Child, No limit, background music/effects toggled off. No input during either20-second capture. The scene includes the player and three demonstration hands, dot paths, bonus/goal and original background/text. Before the6 capture, held swing moved the player pivot roughly one grid interval right. Thus player position and animation phase are not identical between exploratory captures. No original-machine timing oracle has been obtained.

## Exploratory results

| Measure | Default25 | Experimental6 |
|---|---:|---:|
| UTC capture start |22:54:25.630|23:11:11.281|
| Guest ticks/sec |27.4277|60.1331|
| Runtime calls/sec |73.8246|148.6317|
| Guest execution mean/p95 ms |13.0890/13.2450|4.1910/12.2250|
| Worker round trip p95 ms |13.9250|12.7650|
| Ticks behind p95/max |5/5|1/2|
| Worker Wasm linear allocation bytes |not sampled|171,114,496|
| Host CPU median/range % |51/27–74|35/25–78|
| Matching browser/Codex CPU % of host |6.7198|5.7952|

CPU comes from cumulative same-PID/name deltas over wholly contained intervals; new/exited/invalid pairs are excluded and can undercount. Both sample windows bracket the captures; each has15 in-window samples. This is all matching browser/Codex processes, including unrelated tabs/app activity, not game-only CPU. Host load differs substantially. No isolated emulation-overhead or causal CPU-saving claim follows.

Aggregate process working-set medians were5,823,729,664 versus4,894,142,464 bytes; private-byte medians5,605,015,552 versus5,401,133,056. Working sets can count shared pages repeatedly; private bytes are committed allocation, not physical RAM. These aggregate snapshots are not the game's own memory footprint.

Browser application-memory API estimates were21,715,683 and17,518,767 bytes, sampled separately after captures. The6 request began23:11:56.906 and completed23:12:10.932 while the game was paused. Default was running; renderer canvas estimates also differed. They are not matched memory samples and cannot establish a reduction. API attribution is not unique physical/GPU RAM or proof of complete Wasm accounting. The new worker linear allocation is a separate allocation length, excludes main-page Wasm/renderer and must not be added to the API estimate without understanding overlap.

Runtime calls and rAF callbacks are not displayed animation FPS. Guest ticks are not HTML5 simulation/frame equivalents. Worker round trip is not physical input-to-photon latency. The6 export includes Window ResourceTiming and boot-postMessage-to-first-returned-frame272.09ms; that boundary excludes earlier loading, readiness and human delays. Default lacks equivalent startup data. Some browser ResourceTiming fields can be anomalous; retain raw records rather than deriving unsupported cache conclusions.

## Behavior and remaining checks

Toolbar Command-P visibly clears the playfield and displays Paused; resume restores it. Held Space moved the player pivot right; later heldX moved it back toward the left;Z and briefC produced visible motion changes. This establishes responsive action paths, not exact direction/transfer rules, repeat timing, completion, sound or fidelity. No physical controller was connected. Test settings/preferences recovered across tabs; no original save import/export replacement was attempted.

Pilot resource discovery has since found explicit original help mechanics: swing transfers pivot/reverses direction, flip transfers/retains direction, bounce retains pivot/reverses at a dot, reverse is immediate. These documentary rules still need original/prototype behavioral checks. Actual Movement labels name red swing, green flip and blue bounce; generic help color descriptions may differ and must not silently replace scene observations.

Root closed the game tab before assigning the pilot's exclusive asset/native discovery lease. No emulator/build/conversion overlapped either capture. The retained old bundle and original media remain unchanged; no activation, push or deployment occurred.

## Raw evidence and next work

Private evidence directory: D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/clockwerx/release-browser-v1/. Files `default25-explore-timing.json`, `default25-explore-with-memory.json`, `candidate6-explore-timing.json`, `candidate6-explore-with-memory.json`, paired `*-cpu.json`, `*-cpu-owned.json` and `*-resources.json` retain raw frames, samples and reduction boundaries. Original downloads also remain in the Windows Downloads directory.

Next: complete release-route readiness/gameplay checks where possible, obtain an original reference still/rotation observation, review the focused Sol pilot and run three matched alternating captures per default/experimental/prototype configuration. Leave unresolved titles and fidelity checks explicit; do not promote6 solely for restoring guest ticks.

## Reference-image diagnostic validation

First WebGL toBlob export was blank and is retained as invalid private reference-movement-6.png; it was excluded from scene evidence. Corrected exporter snapshots immediately after the next main WebGL draw and restores the method, with3-second timeout for no new frame. Unit checks cover restoration and paused timeout. Valid reference-movement-valid-6.png (195,978bytes) was independently viewed and passed to pilot; actual labels/layout match the visible scene. Motion UI exported32 rendered frames over23:23:25.745–23:23:30.755UTC, private reference-motion-6.json SHAaaafe63a77e1fb5bb18aeb58c8deb492e8e6ba3394e24def7b43d9396197acc3. Request/completion timestamps bound snapshot time; encoding adds work, so this is behavioral sampling, not a performance capture. Pilot fit gives approximately5.0555seconds/revolution at6. No original-machine pace qualification is implied.
