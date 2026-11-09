# Next session: Macintosh library tuning and one HTML5 pilot

**Current follow-up, 2026-11-08:** work is on the user-created `SVG-Port` branch. The library-wide first pass and original bounded pilot are complete; do not restart that queue. The active request is the remaining ClockWerx levels, SVG discrepancies, behavior/inventory documentation and generation requirements. Resume from the [current action](../2026-11-08-clockwerx-levels/current-action.md), [checkpoint](../2026-11-08-clockwerx-levels/checkpoint.md) and [level queue](../2026-11-08-clockwerx-levels/queue.json). Forty-seven bounded scenes are validated and locally activated; Thriller is next. Motion has a retained browser scheduling limitation; native and functional goal evidence remain separate. The historical setup below is context, not the latest runtime state. Preserve media/saves, inspect branch/workloads, keep heavy work sequential, commit locally and do not push/deploy.

Updated 2026-11-07 for the user's chosen workflow: a Sol coordinator, a separate GPT-6.1 Sol subagent per game, sequential tuning/evaluation, then a ClockWerx HTML5 pilot. Use the [complete coordinator prompt](coordinator-prompt.md) and [per-game worker brief](game-agent-brief.md). No tuning agents or port implementation have been started by preparing this handoff; HomeHub deployment remains separate.

Start at [AGENTS.md](../../../AGENTS.md) and [mac-game-modernization](../../../.agents/skills/mac-game-modernization/SKILL.md). For detailed setup and previous checks, read the [three-game library](../2026-11-06-private-library/README.md), [verification](../2026-11-06-private-library/verification.md), [performance investigation](../2026-11-06-private-library/performance-investigation.md), and [original Koji research](../2026-11-06-koji-browser/findings.md).

## Local state to rediscover

| Item | Recorded location/state |
|---|---|
| Repository | `C:\Projects\systemless`, branch `dev`; inspect status before changes |
| Original installation | `D:\SheepShaver_MAC_Emulator`, media under `Content` |
| Working/private images | Ignored `www/private`; compiled static output `www/dist` |
| Build/scratch | `D:\SystemlessBuild`; Rust target and uv cache live here |
| Pinned Trunk | `D:\SystemlessBuild\tools\trunk-0.21.14\trunk.exe` |
| Build | `scripts/Build-MacGames.ps1`; optional `-Extract` refreshes copied images |
| Launcher | `Play-MacGames.cmd` / `Stop-MacGames.cmd`; `scripts/Start-MacGames.ps1 -NoBrowser` |
| Browser origin | `http://localhost:8087/`; routes `/koji-the-frog/`, `/clockwerx/`, `/delirium/` |
| Prior commits | `1e2311e6` Koji; `459a4c06` three-game library; `dd3c2eb0` skill, handoff and opt-in profiling; inspect current HEAD for later documentation updates |
| Deployment | Local only; HomeHub is a future static host, not the game execution machine |

The build script uses release Trunk, locked dependencies and public URL `/`, selecting the private catalogue via environment variables. Python 3.8 serves/packages; extraction uses uv Python 3.12 and machfs 1.3. Check prerequisites rather than reinstalling blindly. Repackaging JS/HTML does not require the expensive Rust release build.

Do not infer that a server/browser from the previous session is still alive. Browser-control failures interrupted some earlier work. Later native Edge measurements succeeded, but the in-app 6 MHz repeat was not performed because Computer Use could not establish the current URL for its policy check. Record that as missing evidence; do not bypass such checks.

## Current game status

All three have browser gameplay smoke evidence. None has a full playthrough, comprehensive audio check, save export/import round trip or physical controller qualification. Catalogue compatibility remains Unknown.

| Game | Preserved runtime configuration | Observed result / next step |
|---|---|---|
| Koji the Frog 2.0.4 | 68K, 640×480, 8-bit; ID `koji-personal-204` | Title/level/movement/pause checked. No wall-time baseline captured. Queue for independent per-game tuning. |
| ClockWerx 1.0 | 68K, 640×480, 8-bit; 4,096,000-byte partition; ID `clockwerx-personal-10` | Level labels and tutorial/actions work. Default guest clock was slow; experimental 6 MHz reached 60.14 guest ticks/sec in Edge. Repeat and check gameplay fidelity before adoption. Selected title for the final HTML5 comparison. |
| Delirium 1.1 | 68K, 640×480, 4-bit; 2,048,000-byte partition; ID `delirium-personal-11` | Title/playfield, directional movement, fire and pause checked. Saved directions are keypad keys. No wall-time baseline captured. |
| Other SheepShaver titles | Not yet inventoried | Discover titles, versions, architecture, source paths, resource requirements and controls before estimating support. |

Source volume 001 is HFS; 002 is HFS+ inside an HFS wrapper, not a split archive. Boot supplies copied preferences/scores. Original disks were unchanged after extraction. Explicit executable paths avoid registration apps; both forks and Finder metadata were preserved. Existing extractors package only the three known games.

Runtime fixes already committed: ClockWerx List Manager `LAddColumn` insertion/cell/selection handling; Delirium's missing Roman `itlb 0` resource fallback referencing existing `KCHR 0`. They address demonstrated missing services, not speed tuning. Relevant regression tests and their limitations are in the verification record.

Controls are centralized in `scripts/game-controls.mjs`. ClockWerx uses modifier actions with shared modifier-state handling; Delirium uses the saved keypad directions. Keep game IDs and save paths stable. Export Saved files before changing origin/browser or performing state replacement tests.

## What the measurements establish

The [raw evidence](evidence/clockwerx-edge-6mhz.json) and [comparison report](../2026-11-06-private-library/performance-investigation.md) support a candidate pacing change for ClockWerx. In 20-second Movement captures, guest ticks/sec were 17.87 (in-app, default 25), 30.64 (Edge, default 25), and 60.14 (Edge, test 6). Host CPU load differed: these are not an isolated browser ranking.

Normal launcher settings remain 25. No production tuning was applied. The instruction-budget override is opt-in, worker-only and available as `?profile=1&profile_mhz=6`. It does not change the physical PC processor speed. A correct guest clock does not prove correct game speed, sound, collision or controls.

## Recommended sequence

The coordinator owns the queue, common measurement procedure, diff review and commits. Start a fresh `gpt-6.1-sol` worker for each game with a complete brief; model-selection/fork details must follow the next session's actual tool schema. One worker and one benchmark workload at a time prevents conflicting edits, browser control and CPU contention. Record an unresolved game's blocker and continue the first pass, keeping a durable resume checkpoint.

1. Inventory the full SheepShaver collection read-only and save a per-title matrix using the skill template. Preserve unknown/unsupported states.
2. Reproduce ClockWerx baseline and test budget in the same standalone browser with comparable host load, alternating repeated captures. Then attempt the missing in-app comparison if tools permit.
3. Compare candidate gameplay timing with the original/reference, including busy levels, menus, input, sound and saved state. Adopt only an evidenced per-game configuration; leave global defaults alone.
4. Capture Koji and Delirium baselines and tune independently. Extend extraction/catalogue/packaging/controls for additional games in small batches, verifying each title's actual requirements.
5. After the inventory has a first-pass result for every title, assign a separate focused Sol 6.1 worker to a ClockWerx HTML5 pilot. Use the [pilot reference](../../../.agents/skills/mac-game-modernization/references/html5-pilot.md) to define one representative playable board, acceptance checks and a work log. ClockWerx supersedes the earlier tentative Koji suggestion.
6. Compare default Systemless, tuned Systemless and the ClockWerx HTML5 slice under comparable workload and gameplay pace. Report CPU/memory, frame/work timing, startup/size, fidelity gaps and actual effort. Establish original-resolution behavior first; keep enhanced artwork a separate optional test. Do not call a simplified prototype's speed difference pure emulation overhead.

For deployment later, serve the static bundle on a dedicated private HTTPS origin with SPA route fallback, WASM MIME type, COOP `same-origin` and COEP `credentialless`; see the existing [Caddy example](../2026-11-06-koji-browser/Caddyfile.example). Moving origins requires deliberate save export/import. Offline behavior and HomeHub integration remain untested.

## Suggested next-session prompt

> Work in C:\Projects\systemless as my Sol coordinator. Read AGENTS.md and docs/iterations/2026-11-07-game-modernization/coordinator-prompt.md, and execute that workflow. I explicitly authorize a separate gpt-6.1-sol subagent for each game, one at a time, followed by a focused ClockWerx HTML5 pilot. Use the linked skill, handoff and worker brief; review evidence before accepting per-game changes, preserve originals/saves, and compare default Systemless, tuned Systemless and the playable HTML5 slice. Continue through the inventory with checkpoints; do not push or deploy.

## Handoff validation

The repository skill passed the skill-creator validator. Local Markdown links and placeholder checks passed; all six evidence JSON files parsed and their copies matched source hashes. The profiler passed Node syntax and rate/percentile/clock-reset arithmetic checks; the packager passed Python syntax checks. Packaging the existing release bundle twice produced identical index HTML, exactly one profiler script tag, and a script copy matching source. No Rust/runtime configuration changed, so no new release compile or gameplay qualification was performed for this documentation handoff.
