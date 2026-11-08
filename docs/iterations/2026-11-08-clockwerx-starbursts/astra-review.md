# Original ClockWerx starbursts: Astra review

The white/light-blue stars are initial attention marquees around the player pivot and goal. They do not follow the pointer and are not random gameplay decorations. The candidate now reproduces their source-derived frame sequence, overlapping orbit, and stop-after-action lifecycle.

## Proven source behavior

Private graphics group2400 supplies11frames (IDs2400–2410). `FLActivate` selects frames0 through10, sets one-shot playback, and uses timerparameter40. `FLFrameProc` starts the next star on frame5 while the previous star continues until the frame10 endpoint expires. `FLActivateMarquee` starts immediately at offsetindex0; `FLMarqueeProc` walks eight decoded offsets clockwise for the goal and opposite the initial player hand direction. It resolves the target anchor again only at each birth. Older stars remain at their birth positions.

The exact x,y ring is `(0,-24),(17,-17),(24,0),(17,17),(0,24),(-17,17),(-24,0),(-17,-17)`. It is private manifest configuration; generic lifecycle source contains no artwork or resource tables. The initial player direction remains in callback state. More importantly, `FLDisableMarquees` stops both chains on the first accepted player action. `WAAction` reaches disable only after `DOCanGrab` returns true and a human actionflag is set; mere held modifiers before a valid encounter do not suffice. `WADirectHero` disables on an accepted instant reverse. Existing stars finish naturally. Source locations are recorded in the private disassembly: CODE6 initializers3eb8/e30a, callback6262, activation62cc, marquee6404/64d8, disable658e, action c70a/reverse ca62. Layer14 is used for flourish sprites.

`TMInstallTimer`/`TMLatch` and `MTAddClient` show40 timerunits and16 units per guesttick. Default master rates are100/100 in decodedDATA. At60guestticks/second this is1/24second perframe,5/24second between births,11/24second perparticle, and40/24second perring. The code permits timer-rate adjustments; measurements below verify the current scene's setting. Do not copy the earlier goal marker's1.25/24second estimate into stars.

## Original observations

Root captured three full-board traces (454total samples). Stationary pointer was outside the canvas; a second trace relocated it across empty background while Keyboardmode was active. Source-shape matching at playerpivot(122,120) andgoal(554,312) yields128 and121matched samples respectively. Both targets show the same animation clock. Linear fits give2.49860 and2.49056guestticks/frame, corroborating2.5. Wall-time frame fits54.49ms and57.31ms are slowed by capture; they are not the correct60Hztargetcadence or a performance benchmark. Residuals0.314/0.343frames reflect quantization and metadata lag.

The third trace's KeyC event at149080.95ms is followed by the last matched star at149491.57ms (~0.411s later); the final board still has the same playerpivot and no stars. This corroborates the source disable-and-drain behavior, rather than persistent reverse-direction behavior. Private matches, sampletimings, rawPNGs, and scripts remain under the private diagnostic folder.

## Candidate and integration

Private candidate: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-starbursts/candidate/assets`. All16 prior payloadfiles are byte-identical. Only a new11,170-byte `starbursts.svg` and manifestentry were added. Atlas198×18;11cells18×18; rendered x=-9,y=-8 relative to the spawnpoint. The one-pixel xanchor correction is supported by exact original-frame matching. Source masks are binary0/255, not alpha-faded. Palette gamma exponent0.7 reproduces captured colors with typically~0.25mean absolutechannelerror. SVG uses layered, simplified opaque sourcecolor polygons, preserving frame-specific asymmetric rays; the source has hard masks, so no screenshot antialiasing was used as geometry. Root must still judge the browser-rendered vector interpretation.

`createSparkles({offsets,frameCount,frameSeconds,spawnFrame,direction})` exports `reset(anchor)`, `update(dt,anchor)`, `stopSpawning()`, and `snapshot()` returning `{id,x,y,frame}` particles. Create one player instance and onepergoal. Reset starts frame0 at offset0. Advance with active simulationtime; skip advancement while paused/completed. Stop spawning on first actual player reverse/swing/flip/bounceevent, allowing particles to drain. Restart resets both chains. The source code is deterministic; no PRNG is needed because Movement's spawnpath is not random. Separate `SCRandomFlourish` is used elsewhere (award-screen decoration) and is outside this slice.

Five focused Node tests pass: overlapping births/fixed birthanchors, directionwrap, stop/drain/reset, timepartition/pause/reset/largejump, and input/copy isolation. No browser use, benchmarks, builds, commits, uploads, source-media mutation, or savechanges by this worker.

## Limits and release

Original frame advancement is quantized to guestticks and can skip visualupdates underload; the pilot's uniform1/24second timeline is the explicit60Hz normalization. It is not a cycle-exact emulator. Fullcampaign flourish sites, physicalcontrollers, other displaydepths, audio and saves were not qualified. Root owns integration, visualacceptance, packaging and activation.

Approximately12active minutes covered source discovery, captureanalysis, atlasconstruction, lifecycle implementation and focusedtests; no persistent worker processes remain. Remaining integration/visualsmoke is estimated0.5–2hours (likely1hour), not a commitment. Workload is released. Exact source/evidence hashes, measurements and private regeneration paths are in `astra-review.json`. Private profiles/disassembly/art remain onD.
