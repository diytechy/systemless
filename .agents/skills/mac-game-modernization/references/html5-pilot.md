# A bounded HTML5 pilot

The purpose is to measure the effort and outcome of one genuine browser reimplementation. Systemless/WASM keeps original game logic; a port needs rules, state transitions, input, rendering, audio and save behavior reconstructed or obtained from available source. There is no established automatic conversion pipeline for these games.

## Select and bound the slice

Use the inventory and observed behavior to compare candidate games. Koji is a natural first candidate because it was the initial target, not because its effort has been established. Record resource accessibility, available source/documentation, amount of hidden logic, representative mechanics, animation/audio complexity and the user's desired enhancement.

Inspect assets and behavior before choosing a framework. Keep extracted sprites, maps, sounds and private reverse-engineering scratch outside Git. Retain original dimensions, palette/transparent masks, animation order, sprite anchors, timing and asset IDs. Do not assume an image export reveals collision or level rules.

Set a finite discovery/prototype budget with the task's scope. If none is supplied, propose a small explicit slice and record it before implementation; do not silently turn feasibility work into a full game rewrite. A suitable Koji slice could be one small scene with movement, jump, tongue interaction, one obstacle/enemy, collision, restart and one sound. Verify which mechanics actually occur in the chosen reference scene.

Write acceptance checks from observed original behavior, labeling approximations. Identify what the slice excludes: full campaign, all enemies, menus, save compatibility, music and other unsupported mechanics. Keep a list of unknowns that could dominate full-port effort.

## Build for comparison

Use the smallest renderer that fits the evidence: Canvas 2D may be enough for a small sprite scene; choose a larger engine or WebGL when the slice needs it. Check current primary documentation when selecting dependencies. Keep game simulation independent of display refresh with a fixed simulation step and separate rendering/input adapters.

Use a separate prototype directory/route and keep the original playable baseline. Preserve aspect ratio and logical coordinates. Provide keyboard and controller input, restart and pause. Define browser storage deliberately; do not assume compatibility with original Mac preference files.

Start with original-resolution assets and an explicit logical collision model. Then, if enhancement is part of the pilot, compare an optional enhanced rendering pass at the same scale and rules. Higher-resolution or AI-redrawn sprites can change outlines, anchors, animation continuity and readability; do not accidentally derive different collision from the enhanced artwork. Use the appropriate image tool/skill when actual raster generation is requested.

## Measure outcome and effort

Compare the same machine/browser, scene, window size and workload. Report both the tuned Systemless baseline and the pilot's actual scope. A simplified scene can be faster because it omits work; it does not prove the complete port will have the same gain.

| Dimension | Evidence to collect |
|---|---|
| Startup and portability | Asset/bundle size, cold/warm load, local/static-host behavior, tested browsers; offline support only if tested. |
| Responsiveness | Frame-time distribution, missed frames, input-to-visible-response method and limitations; no invented latency number. |
| Fidelity | Movement/jump/rotation timing, interactions, collision, scoring, level progression, side-by-side observed discrepancies. |
| Presentation | Original versus enhanced art, sprite alignment, crisp/smooth scaling, audio timing and synchronization. |
| Usability/state | Keyboard/controller, focus loss, pause, restart, persistence and recovery. |
| Cost | Human/agent active work time, elapsed tool/build time, asset extraction, behavior research, coding, validation and remaining unknowns. |
| Maintenance | Dependency/build burden, asset pipeline, additional content/mechanics, save format and browser coverage. |

Keep a work log per activity and retain failed hypotheses briefly when they affect the estimate. Derive a low/likely/high estimate for the rest from completed work, remaining distinct mechanics and content volume. Separate reusable engine effort from per-level/per-enemy effort and validation. Do not extrapolate one easy level linearly or present the estimate as a commitment.

End with a working, inspectable slice or a concrete blocker, an acceptance-results table, measured tradeoffs, the effort log, and a recommendation: continue the port, tune the original runner, or retain both. Preparation for static HomeHub hosting remains separate from deployment or publishing owned assets.
