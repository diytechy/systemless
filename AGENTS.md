# Systemless contributor and session guide

This checkout includes the upstream Systemless emulator and an opt-in private Macintosh game library. Scope the following guidance to work on that library; ordinary upstream work should follow the relevant source and existing tests.

## Private game tuning and port exploration

Use [mac-game-modernization](.agents/skills/mac-game-modernization/SKILL.md) for extracting owned games, adding library entries, profiling or tuning individual titles, controller integration, and assessing an HTML5 rewrite. Read its linked tuning or pilot reference for the task at hand.

Start resumed work with the [next-session handoff](docs/iterations/2026-11-07-game-modernization/next-session.md). For the user's requested sequential Sol coordinator run, use the [coordinator prompt](docs/iterations/2026-11-07-game-modernization/coordinator-prompt.md) and [per-game worker brief](docs/iterations/2026-11-07-game-modernization/game-agent-brief.md); that workflow delegates one game at a time and finishes with a ClockWerx HTML5 comparison. The [performance investigation](docs/iterations/2026-11-06-private-library/performance-investigation.md) contains measured results and their limits. Session paths and measurements are evidence, not permanent defaults.

For structured native guest interaction, also use [systemless-headless](.agents/skills/systemless-headless/SKILL.md). Deterministic frontend ticks are not a real-time performance benchmark.

## Working boundaries

- Inspect the current branch and worktree before editing. The private library was developed on `dev`; do not reset or overwrite unrelated changes.
- Preserve the original SheepShaver installation and disks. Extract read-only, retain both Macintosh forks and Finder metadata, and verify source hashes. Keep extracted games, preferences, registrations, private disassembly and diagnostic scenarios out of Git.
- Keep build caches and large scratch on a volume with room; the current machine uses `D:\SystemlessBuild`.
- Preserve game IDs, save mappings, explicit executable choices and display depths unless a change includes a migration or a verified reason. Export browser saves before tests that could replace them.
- Tune per title. The ClockWerx 6 MHz experiment is not a library-wide default or completed gameplay qualification.
- Keep runtime changes and evidence distinct: launch success, guest-clock rate, gameplay fidelity, sound, saves and physical controller support each need their own evidence.
- The static bundle contains private game data. Preparation for HomeHub does not authorize deployment, public hosting or uploading those assets.
- `docs/*` is ignored upstream. Stage intended text/evidence paths explicitly with `git add -f`; do not force-add a whole private or build directory.

Use the skill's focused checks for the changed area. Do not run expensive release builds merely for documentation changes.
