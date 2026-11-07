# Coordinator prompt: per-game tuning, then ClockWerx HTML5 comparison

Paste the prompt below into a new local Sol session attached to `C:\Projects\systemless`. It delegates future work; saving this file does not start agents or benchmarks.

---

Work in `C:\Projects\systemless` as the coordinator for my private Macintosh game library. I explicitly want delegation: start a separate **GPT-6.1 Sol subagent (`gpt-6.1-sol`) for each individual game**, process the games sequentially, and review each result before proceeding. After the library tuning pass, evaluate a small **ClockWerx HTML5 reimplementation** against both default and tuned Systemless to understand overhead, fidelity and implementation effort.

Read these first:

- `AGENTS.md`
- `.agents/skills/mac-game-modernization/SKILL.md` and its tuning reference
- `docs/iterations/2026-11-07-game-modernization/next-session.md`
- `docs/iterations/2026-11-06-private-library/performance-investigation.md`

Use `systemless-headless` when deterministic native behavioral checks help, but do not treat its simulated ticks as real-time performance.

## Your role and delegation

Own the inventory, game queue, common measurement procedure, integration and final comparison. Give each game a fresh, focused subagent using the explicit model above. Follow the currently available spawn-tool schema; if selecting a model requires a fresh context, use that mode and supply a complete brief instead of relying on inherited chat history. Do not silently substitute another model or claim a model selection you could not verify. If that model or delegation is unavailable, explain the concrete limitation and complete independent inventory/preparation work.

Use one active game worker at a time. Never overlap performance captures with another test emulator, release build, asset conversion or heavy diagnostic run. The coordinator may review documents while the worker runs, but should not compete for browser control or modify the same files. No nested delegation is needed.

Before each spawn, fill out the accompanying `game-agent-brief.md` with actual paths, version, baseline revision/settings, writable file scope, output directory, known issues and acceptance checks. All agents share the checkout unless the tools say otherwise; separate contexts do not imply isolated files. Coordinate any required shared-runtime change explicitly and recheck affected games.

The worker reports evidence and leaves a reviewable diff; you review and commit accepted changes on the existing `dev` branch. Preserve unrelated changes, do not push or deploy. Reuse this checkout unless isolation becomes necessary. Do not create separate user-owned chats for the game workers.

## Inventory and queue

Inspect Git status and current tooling, then enumerate the games in the configured disks under `D:\SheepShaver_MAC_Emulator` read-only. Existing extractors cover only Koji, ClockWerx and Delirium; the rest of the library is not inventoried. Identify title/version, source volume/path, executable, 68K/PPC/fat architecture, required resources, display depth, preferences, save identity and controls.

Save a persistent inventory and queue under a new dated `docs/iterations/` folder. Start with ClockWerx, Koji and Delirium, then process the remaining discovered games in a practical order. Give every title a result: validated candidate, unchanged baseline, compatibility blocker, unsupported requirement, or not yet measured with a precise reason. Do not silently omit difficult titles.

For an unprepared title, the worker may add the minimum extraction/catalogue/packaging/control support needed for a baseline. For a substantial compatibility obstacle, document the smallest reproduction, estimated next step and why tuning cannot yet be measured, then let the queue proceed. Preserve a resume checkpoint after each game so a session limit does not lose progress.

## Per-game experiment

Require the worker to:

1. Verify media and runtime configuration; preserve source disks, both forks, Finder metadata, existing save IDs and preferences.
2. Establish a release-browser baseline in a defined gameplay scene. Record build revision/hash, browser/version, renderer, worker mode, canvas/output size, host load and actual pacing settings.
3. Test one defensible per-game change at a time. Begin ClockWerx with the existing 25-versus-6 budget experiment; do not assume 6 is correct for other titles or even fully validated for ClockWerx.
4. Alternate baseline and candidate captures under comparable conditions, starting with three valid runs each. Use the same scene and input sequence, invalidate blur/hidden captures, and save timing JSON plus timestamped CPU samples.
5. Separate guest clock, runtime calls, visual updates and actual gameplay timing. Check representative light/busy scenes, motion/timers, input, pause/menus, sound, and saved state. Mark physical controller and other unavailable tests untested.
6. Recommend a per-game setting only when repeated evidence supports an improvement without an observed behavior regression. Keep unresolved candidates experimental. Do not lower a global default merely to make one game's counters look better.
7. Return the required report, raw evidence, diff, checks, remaining limits and rollback instructions.

Use the owned original/reference behavior for fidelity where available; SheepShaver timing is not automatically a perfect oracle. A full guest tick rate or a screenshot is insufficient evidence of correct game speed.

## Final phase: ClockWerx HTML5 pilot

After every inventoried game has a first-pass result, delegate a separate focused `gpt-6.1-sol` pilot task. ClockWerx is the selected title; this supersedes the earlier tentative Koji suggestion. Read the skill's HTML5 pilot reference.

Build a small playable browser reimplementation, not another emulator wrapper or just a static mockup. First inspect ClockWerx's assets and observe its rules. Define one representative tutorial board with rotating hand, dot/pivot transfers, the original actions relevant to that board, collision/failure or completion, pause and restart. Include representative sound where it can be reproduced and clearly list omitted features. Verify the chosen mechanics against the original instead of inventing them.

Keep the prototype on a separate local route with original-resolution presentation first. Hold enhanced artwork for an optional separate comparison so it does not confound the overhead measurement. Record a bounded scope and actual work log before expanding beyond the first board; a full-game rewrite is outside this pilot.

Compare three implementations: default Systemless, the best fidelity-checked per-game Systemless candidate (or clearly labeled experimental candidate if none qualifies), and the HTML5 slice. Use the same machine/browser, logical scene, visual scale, input workload, sound state and real-world gameplay pace. Do not run them concurrently. Match scene content as closely as possible and list simplifications.

Measure repeated frame/work timings, game-time progression, browser CPU, memory, startup/load and bundle size where tooling permits. Use explicit measurement definitions: host CPU alone is not game CPU, requestAnimationFrame callbacks are not displayed animation FPS, and Systemless guest ticks/MIPS are not HTML5 equivalents. Report missing measurements honestly. Quantify end-to-end resource differences and fidelity gaps; do not label a difference as pure emulation overhead unless it has actually been isolated.

Deliver the runnable slice or a concrete feasibility blocker, original-versus-port behavior checks, measured comparisons, time spent by activity, remaining mechanics/content and a low/likely/high full-port effort estimate grounded in the slice. Conclude whether further tuning, a fuller ClockWerx port, or keeping both best serves the observed outcome.

## Persistence and completion

Keep build/cache/scratch under `D:\SystemlessBuild`. Keep original games, extracted assets, preferences, registrations and private disassembly out of Git. Save reports, non-sensitive timing evidence and source changes explicitly; docs are ignored upstream and need targeted `git add -f`. Existing private images and the static bundle stay private.

Continue through the queue without asking me to approve routine reversible steps already covered here. Honor actual tool permission requirements and request missing information only when it blocks the affected work. Do not bypass browser policy blocks or stop unrelated user processes to improve a benchmark.

At completion, provide a per-game before/after table with the strength of evidence, accepted settings/commits, unresolved issues, and the ClockWerx comparison with implementation effort. At an unavoidable interruption, save completed/pending items and the exact next action. Keep normal game entry points usable throughout.

---

Delegation/model syntax should be checked against the next session's tools. Current official guidance permits explicit per-agent model selection and explains inherited settings: [OpenAI Docs — Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents). No global Codex configuration change is required by this prompt.
