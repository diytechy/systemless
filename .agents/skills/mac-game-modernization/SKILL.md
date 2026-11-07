---
name: mac-game-modernization
description: Prepare and tune privately owned classic Macintosh games in the Systemless browser runner, preserving SheepShaver media and saves. Use for per-game extraction, library entries, real-time profiling, pacing or controller fixes, and evaluating a bounded HTML5 rewrite with fidelity and effort comparisons. Not a claim of automatic binary-to-HTML5 conversion.
---

# Macintosh game modernization

Work from the Systemless repository root. Read [the current handoff](../../../docs/iterations/2026-11-07-game-modernization/next-session.md) to recover this checkout's paths, game states and pending experiments. Confirm paths, branch and available tooling instead of assuming session state persists.

## Route the work

- For library inventory, extraction, compatibility, controls or performance, read [tuning](references/tuning.md).
- For an HTML5 feasibility study or prototype, read [HTML5 pilot](references/html5-pilot.md).
- For deterministic native interaction, use [systemless-headless](../systemless-headless/SKILL.md) and its play guide. It supplies behavioral evidence, not browser wall-time performance.

Systemless runs original Macintosh logic through WebAssembly and implemented Mac services. A true HTML5 port reimplements game rules and presentation in a browser engine. Enhanced canvas scaling alone is not a port or replacement artwork.

## Workflow

1. Recover the current evidence and task scope. Separate established behavior from hypotheses and untested areas.
2. Inventory the owned source and select one title/scene. Record version, architecture, executable, forks, preferences, display depth, save ID and input requirements. Do not assume every game in SheepShaver has a supported 68K executable.
3. Establish a reproducible baseline before changing behavior. Use an unchanged release browser build for performance and record host load, browser, scene and active runtime settings.
4. Make one bounded change: a per-title setting, a demonstrated compatibility fix, an input mapping, or a small port slice. Preserve the source media and a path back to the baseline.
5. Validate the behavior affected by that change. A full guest-clock rate does not prove correct animation, physics, sound or input timing.
6. Save results under a dated `docs/iterations/` folder. Link the inputs/settings, raw timing evidence, observed outcome, limits and next experiment. Update the per-game status rather than implying library-wide compatibility.

## Boundaries and completion

Keep source disks read-only and use copied private fixtures. Never commit game binaries, preference contents, registration data or private disassembly. Retain both forks and Finder metadata on extraction; verify source hashes and extracted contents.

Do not change global pacing based on one game. Preserve stable save IDs and export saves before destructive state tests. Keep private media within the user's existing access boundary; deployment is separate work.

Use available browser/app tooling according to its instructions. If a connection or policy block prevents a measurement, record the missing evidence; do not bypass the block or substitute guessed timings.

Deliver the smallest reviewable change with its checks, a per-game result, remaining uncertainty and the next useful experiment. For an HTML5 pilot, also deliver an actual work log, observed tradeoffs and a range estimate grounded in the completed slice. Do not promise automatic conversion or full-game parity.
