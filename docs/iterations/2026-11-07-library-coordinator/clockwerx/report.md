# ClockWerx 1.0 — measurement blocked

Recorded 2026-11-07 06:46 UTC. The browser timing experiment could not start because Windows Computer Use stopped on its URL policy check. No new performance or gameplay results were obtained. Keep the normal 25 MHz setting and leave the opt-in 6 MHz candidate experimental.

## Reproduction and provenance

- Checkout: `C:\Projects\systemless`, `dev`, `ed74c8b4913f61578b1b02e3d198eae71548fb42`. Initial unrelated change was untracked `scripts/inventory_mac_library.py`; preserved.
- Copied fixture: `www/private/clockwerx.img`, SHA256 `95cba96b6620b72e083b363680b30c2fc6856b82d1ea52c582a01ef0b45057fb`, reverified this attempt. Original `D:\SheepShaver_MAC_Emulator\Content\002` was not opened or modified by this worker.
- Existing release WASM: SHA256 `aa25ac7a47cbd323ce6b4909892db2158f3d4e7d03d8346575949e5e5840674c`, reverified. Brief attributes build to library changes committed as `459a4c06`, with older compile footer. No new build.
- Preserved configuration from brief: exact executable `ClockWerx/ClockWerx Folder/ClockWerx`, 640×480, 8-bit, partition 4,096,000; normal pacing 25 MHz, 2 catch-up ticks/paint, 4 reset slack. Save ID `clockwerx-personal-10`, mapped Scores and Settings under System Folder/Preferences.
- Edge executable ProductVersion/FileVersion: `157.0.4341.42`, read from the installed executable. No current page user agent, renderer, worker status, output size or actual `cpuMhz` was captured. These must be observed anew; configured values are not a capture result.
- Model selection: worker assignment explicitly selected `gpt-6.1-sol`; no independent runtime model identity was exposed for verification.

## Attempt and concrete blocker

Read AGENTS.md, modernization skill, tuning reference, next-session handoff, per-game brief, performance investigation, and the complete Computer Use skill/guidance/API/confirmations before app automation.

Browser inventory exposed in-app browser with no tabs and native Edge with one existing window. `cua.getApp` reported that Edge was minimized and needed activation. The documented Computer Use skill path successfully selected exactly one returned Edge window, activated it and observed its existing unrelated search page. A new-tab shortcut was issued, then the focused address bar was observed. Typing `http://localhost:8087/clockwerx/?profile=1` returned that exact address-bar value. Pressing Return returned this stop:

> Computer Use has been stopped for this turn because it could not determine the current browser URL on Windows with enough confidence to enforce policy. Stop your work and send a final message noting why Computer Use ended.

No subsequent browser/app input, fallback browser or policy workaround was attempted. The destination's loaded state is unknown. This repeats the earlier handoff's tool blocker; it is not evidence of game incompatibility. The tool did not report an automatic sandbox approval rejection.

The stop text explicitly ends Computer Use **for this turn** and instructs stopping work/final reporting. It does not enumerate or explicitly prohibit every other browser surface/tool. It was treated as a stop on this measurement attempt, not grounds to change surfaces and evade the URL policy check. The applicable [modernization skill](../../../../.agents/skills/mac-game-modernization/SKILL.md) states: “If a connection or policy block prevents a measurement, record the missing evidence; do not bypass the block or substitute guessed timings.” The [Computer Use guidance](C:/Users/Peter/.codex/plugins/cache/openai-bundled/computer-use/26.1027.30824/docs/guidance.md) also states: “If Computer Use reports that the turn ended or that the user stopped Computer Use, stop issuing app input.” No retry was made after the policy stop.

## Results and behavior

The requested alternating 25,6,25,6,25,6 sequence has **zero new valid runs**. No timing JSON was exported; no host CPU or process CPU/memory samples were paired. Medians and ranges are unavailable. [attempt.json](attempt.json) is the machine-readable attempt record, not runtime timing data.

| Check | This attempt | Required next evidence |
|---|---|---|
| Launch / actual Movement scene | Untested | Loaded title, numbered Movement, Play, settled board |
| Actual 25/6 MHz and guest-clock rates | Untested | Three visible/focused 20-second captures each, alternating |
| Rotation period / timing | Untested | Wall-time observations at both settings and trusted reference |
| Transfers, action semantics, completion | Untested | Held/released Space/Z/X/C through dots and resulting board changes |
| Pause / menus / input | Untested | Command-P toolbar mapping, menu navigation, focus/release behavior |
| Light and busy scenes | Untested | Repeatable scene descriptions and matched captures |
| Audio / synchronization | Untested | Audible reference and candidate observations |
| Saves across reload / export-import | Untested | Export before replacement tests and verified round trip |
| Physical controller | Untested | No hardware qualification attempted |
| Original/reference fidelity | Untested | Read-only/reference run without risking original media |

Prior evidence remains unchanged: the earlier single Edge 6 MHz Movement capture reached 60.14 guest ticks/sec, compared with 30.64 at 25 in Edge under differing host samples. Those are historical measurements, not new repetitions, and do not qualify animation, sound or game fidelity. See [performance investigation](../../2026-11-06-private-library/performance-investigation.md).

## Pilot preparation

No new board geometry, rotation period, completion criteria, sound or help observations were possible. The brief's controls remain documentary starting points: Space=swing/Command, Z=bounce/Option, X=flip/Control, C=reverse/Space, held through a dot. Do not treat these as newly verified semantics. No pilot code or estimates were produced.

## Changes, checks and rollback

Only this worker's report and attempt record were added. Both fixture/build hashes matched the supplied values; `git diff -- www/private_library.rs` was empty. No runtime setting, profiler, executable, original disk, origin, save mapping, browser storage or registration was deliberately edited. Save export was blocked before gameplay; therefore no save replacement/reset or import test was attempted. No private screenshots, forks, preferences, assets or disassembly were added to Git. No commit, push, deployment, nested agent or heavy build.

No runtime rollback is needed. Closing any newly opened test tab after browser control is restored is optional cleanup; loaded-tab state was not observable after the stop. Delete only these report files if removing the documentary attempt.

## Recommendation and exact next step

Retain ClockWerx's baseline and existing Unknown compatibility status. Continue the coordinator queue with this measurement blocker recorded. Before another ClockWerx benchmark, restore supported Windows browser URL observation/control, then verify localhost:8087 and export Saved files on that same existing origin/profile. Re-establish actual Movement readiness and perform the six alternating captures with timestamped host/process samples. Re-run gameplay/reference checks before proposing any per-title promotion. Do not substitute deterministic headless ticks for this wall-time benchmark.
