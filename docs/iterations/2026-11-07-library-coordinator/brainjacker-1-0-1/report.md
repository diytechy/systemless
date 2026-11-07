# BrainJacker 1.0.1 first pass — 2026-11-07

Outcome: preserved preparation and a bounded 68K startup blocker. The inspected failure screenshot shows a Stage window containing the BrainJacker/Cygnus splash. Gameplay readiness, controls and performance remain unqualified. No pacing setting is proposed. The coordinator selected this separate worker as gpt-6.1-sol; that selection is not an independently verified model-identity claim.

Work used the modernization/tuning and systemless-headless/play instructions on branch `dev`, starting revision `b714481fd2d98732d11ff116eeefd678a6acb0fd`. The coordinator's active-worker record was already modified and was preserved. No browser, build, runtime, catalogue, shared helper, executable patch or original-media write was performed.

## Source and preservation

The original is Content/003, `BrainJacker ƒ/BrainJacker 1.0.1`, a fat application with CODE and a PPC fragment. Both executable fork hashes match the supplied assignment. Its sibling Read me explicitly identifies “Cygnus' BrainJacker 1.0.1” and describes the 1.0.1 MacOS 8.5 score-rendering fix. The application vers resources naming 6.5 explicitly name Macromedia Director; they describe the embedded runtime, not a contradictory game version. The original SIZE -1 preferred partition is 6,291,456 bytes, minimum 2,097,152; no override was used.

The final private fixture is `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/brainjacker-1-0-1/game-title.img`. Three selected files were reopened and compared: game, raw alias and Read me. Data/resource forks and exposed Finder fields are retained. The HFS+ selected folder's creation/modification/backup dates were checked against raw offsets12/16/28. Three coordinate pairs were compared as raw16-bit patterns modulo65536. Folder Finder information is not exposed by machfs. Raw alias bytes are preserved; resolution to the new volume is unproved. The inline-extents reader refuses overflow rather than silently returning partial forks.

A narrow read-only Boot scan by BrainJacker name and PJ97 creator found only `System Folder/Launcher Items/Mouse Required/BrainJacker 1.0.1 alias`. It is a launcher alias, not an established preference, and is excluded from the final fixture. The earlier broader preparation and separate candidate image remain private for audit. No matching System Folder/Preferences file was found. Embedded Director/game state remains present; this is not a certified clean-default experiment or a preference-persistence test. Source003 and Boot before/after hashes match; full hashes and file inventory are in the private [manifest](D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/brainjacker-1-0-1/manifest.json).

## Native reproduction and inspected result

The unchanged cached `D:/SystemlessBuild/target/ci-test/systemless.exe` reports0.110.1; its exact compile revision is unknown. SHA256 is recorded in the manifest. Reproduction uses `SYSTEMLESS_LOAD_EXECUTABLE='BrainJacker ƒ/BrainJacker 1.0.1'` and:

```powershell
systemless.exe game-title.img --headless --prefer-classic-68k --screen-depth 8 --play-script startup.json --play-output startup
```

Paths above are relative to the assigned private directory. The saved run.py supplies absolute paths, records process ownership and enforces75 seconds wall time. The script requests120ticks/capture, then212ticks/capture, maximum360. Display8-bit is exploratory, not a documented requirement; actual inspected framebuffer is800×600. Original partition selection remains unchanged.

PID88248 exited1 after approximately9.4seconds. The runner failed action0 at103frontend ticks, guest tick702, with zero assertions and zero budget-exhausted frames. The log records `IllegalInstruction: $4088 at PC=$000000C2`, then CPU stopped and `guest halted before scenario completed`. No named checkpoint was reached. The inspected failure PNG shows the splash; its appearance alone does not prove a renderer defect. Extending ticks cannot resolve an already halted CPU. The available evidence does not identify a particular missing Mac service.

## Qualification and next action

Observed: splash rendering and explicit68K execution through startup. Untested: playable scene, mouse efficacy, menus/pause, busy scenes, collision/scoring/timing fidelity, audible sound, saves/reload, physical controller and release-browser performance. Read me delegates instructions to an “explain the game” button, never reached here; the Boot launcher category suggests mouse use but does not establish exact controls. Native ticks are not a real-time benchmark.

The coordinator additionally authorized exactly one explicit `--prefer-powerpc` run on the same fixture. PID7812 was stopped at its30-second wall cap; the distinct owned-process-PPC.json records final state. Only action0/frontend0 startup logging appeared; no report, screenshot or final counters were produced. This is a bounded readiness failure, not proof of a named missing service. No extension was attempted. Ownership was released again.

Next, investigate the bounded illegal-instruction reproduction around the Director startup transition and the separate PPC startup stall. Effort is not reliably estimable before locating the bad control transfer. Preserve this fixture as baseline. Rollback is simply discarding new private copies and these assigned reports; original installation and other titles are unchanged. Native/extraction ownership was explicitly released after durable final process state, before writing this report.
