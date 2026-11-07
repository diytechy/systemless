# Alien Action Dome 1.0 first pass

Prepared a verified copied fixture and reached actual Stage 1 gameplay. The selected executable is named `Action Dome 1.0`; its bundled Read Me calls the title **Alien Action Dome 1.0**, matching the title artwork. This is bounded native compatibility evidence, with no pacing candidate or runtime change.

## Preservation and dependencies

Original `D:/SheepShaver_MAC_Emulator/Content/001`, selected `Action Dome` folder, was read only. The validated `scripts/extract_owned_game.py` copied all seven files: executable, required `Sprund` sprite/sound resources, Read Me, Registration, existing AAD Prefs, AAD Scores, and folder icon resource. No preference contents or registration values are included here. Both helper synthetic tests passed. Extraction reopened the image and compared all selected forks and exposed file Finder fields (including flags/dates/positions); represented folder dates were retained. Original folder Finder information is unavailable through machfs. The raw-alias preservation helper was reused; aliases, if present, are not promised to resolve on their copied volume. No original disks, saves, executables, or existing browser state were mutated.

The 8 MiB image and private scenarios/captures are under `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/action-dome-1-0/`. Hashes and the exact native report are in `review-summary.json`. Original source hash before extraction, after extraction, and after native work matched `82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e`. The fixture hash is `3412f06ee4cd3dbe456834518119b5b41327a7026197943c3ba748507f5fe875`.

## Requirements and run

Read Me specifies 256 colors, at least 3 MB RAM, and LC III through Power Mac 6100/66 test machines, noting lower performance below 68040 and an animation option. Executable source inventory identifies classic CODE/68K, creator SLVS, empty data fork and resource fork 1,772,089 bytes; assigned SIZE evidence is 5,120,000 bytes. The run explicitly selected 68K, 8-bit and the exact executable, retaining its SIZE rather than overriding partition. Native default 800×600 was observed; a minimum resolution remains unverified.

Reproduction from repository root (PowerShell):

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='Action Dome 1.0'
& D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/action-dome-1-0/action-dome.hfv --headless --prefer-classic-68k --screen-depth 8 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/action-dome-1-0/assertions.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/action-dome-1-0/NEW-EMPTY-RUN
```

Existing executable reports 0.110.1; exact compile revision is unknown. No build was run. Starting checkout was clean `dev`, revision 34cc78e1. The assigned runtime baseline is ed74c8b4. Tool selection followed the requested Sol worker workflow; model identity was not independently verified.

## Inspected behavior and bounds

At frontend tick 120 the application shows LOADING; by tick 600 the title menu is present. Instructions successfully cycle through enemies, collectibles and storyline. Options shows saved keypad8/2/6/4 directions, Esc stop, Return pause and volume7. Clicking PLAY at v126/h208 for two ticks enters STAGE1; after another 420 ticks a populated field with player, monsters, bowls and timer is visible. Holding keypad6 (virtual key88, character54) for 30 ticks moves the green player from the upper-left area toward the right while other sprites and timer change. Return (key36/ch13) produces a large PAUSED screen; a second Return restores the field. These observations come from inspected screenshots, not an independent reference.

The final `assertions-verified/report.json` passes at 1116 frontend ticks, zero exhausted frames and three pixel assertions derived from earlier inspected captures. Two assert field color [0,0,179] at (350,150); the pause assertion checks only black at (400,300), so visual PAUSED text inspection supplies the pause evidence. No assertion certifies motion, scoring, collision, pause timer semantics or artistic fidelity. Earlier exploratory runs have no assertions and only prove their scripted actions completed. One attempted assertion setup used a Python without Pillow and then produced a missing-script failed report in `assertions/`; it is retained as invalid setup evidence, superseded by `assertions-verified/` using system Python for pixel inspection.

| Area | Evidence |
|---|---|
| Launch / initial gameplay | Observed title, Stage1 and populated field |
| Movement / held input | Right motion observed with saved keypad6 mapping |
| Pause / resume | PAUSED screen then restored field observed |
| Menu / instructions / options | Observed |
| Timing, collision, scoring fidelity | Unqualified; no independent reference |
| Busy levels / complete controls | Untested |
| Audio / synchronization | Untested; volume setting does not prove sound |
| Saves / reload / export-import | Untested; copied original local files only |
| Physical controller / focus / fullscreen | Untested |
| Release-browser wall time | No entry/build or measurement yet |

## Recommendation and rollback

No blocking service was encountered in this first scene. Keep default pacing; native guest/frontend clocks are not real-time performance evidence. Next prepare an explicit release entry with Sprund and the selected folder state, 8-bit display, intentional save identity and these controls, then measure visible release-browser gameplay and inspect reference fidelity. 640×480 is not established for this title. No global or other-game settings changed. Rollback is deletion of this title's copied scratch and own report files; originals remain untouched. Exclusive workload ownership was released to the coordinator immediately after tests, before report writing. No commit, push, deployment or upload occurred.
