# 3d Brick Bash! 1.1.1 first pass — 2026-11-07

Outcome: preserved preparation fixture, native startup/menu evidence and limited mouse response at8-bit; rendering/readiness issues remain. No browser entry or performance baseline exists. No pacing/runtime/catalogue/controller change proposed. Native/extraction ownership explicitly released after final probe.

Worker used assigned existing `dev` checkout starting1f02ebf6d1191a7aad8b73ff1862137f89f08d8c, cached machfs Python and existing diagnostic executable. Model selection supplied by coordinator, not independently attested. Read modernization/tuning and headless skills, handoff, worker contract and library setup. No browser/Windows Computer Use, build, nested agent, commit, upload or deployment. Unrelated coordinator checkpoint changes preserved.

## Preservation and preparation

Original `D:/SheepShaver_MAC_Emulator/Content/001` read only; SHA256 before/after `82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e`. Exact executable `3d Brick Bash! 1.1.1/3d Brick Bash! 1.1.1`, APPL/Mtd-, CODE68K, resource version3d Brick Bash!1.1.1, preferred SIZE1,331,200bytes. Empty data fork SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; resource394,897bytes SHA256 `279b44742ecdd94dc5364344a9785c87498a53416fea98306b91cdb33da3411a`.

Folder contains executable, two TEXT docs and alias. README confirms Color QuickDraw, System6.0.5+/7+,68020+, <=256colors;1,300K at8-bit,800K at<=4-bit. Original-Mac16-color recommendation does not establish best Systemless depth. Resolution unspecified;800×600 exploratory. Boot filename Brick/Bash and creator Mtd- search found no relevant preference; bounded search is not proof none exists. No Boot files copied. Existing source state stays private. No save ID assigned/browser saves touched.

Whole-folder extraction initially refused altered alias resource(573→571bytes). No failed output retained. Tested fixture `game.img` explicitly selected executable+two docs, excluding nondependency alias:8MiB,3files verified, SHA256 `8064bd9557d7a8dbd3d5113173382a7e5ea760fcf06f68d8209bbd24a06b1a47`.

Coordinator authorized shared extractor fix: clear only derived Python `aliastarget` on deep-copied files, preventing machfs regeneration while preserving raw forks/Finder fields. Whole-folder `complete.img` now verifies all4files, SHA256 `1f4a9cf5598743694322088863e722919811904c5456c92e317f80eafeb57622`. Not separately native-tested; executable forks match tested image. Raw alias may target original volume; resolution not claimed. Scope is file forks/type/creator/flags/dates/location and represented folder dates; original folder Finder information unavailable through machfs, not a volume clone.

All private media, docs, scenarios, logs and PNGs are under `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/3d-brick-bash-1-1-1`.

## Native reproduction and observations

Build `D:/SystemlessBuild/target/ci-test/systemless.exe`, reported0.110.1; SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`, exact compile revision unknown. Explicit68K/executable, auto platform renderer/classic-system7,800×600; no partition override, source SIZE used. Typical command from repository root:

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='3d Brick Bash! 1.1.1'
& D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/3d-brick-bash-1-1-1/game.img --headless --prefer-classic-68k --screen-depth 8 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/3d-brick-bash-1-1-1/probe8.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/3d-brick-bash-1-1-1/NEW-EMPTY-OUTPUT
```

4-bit `launch/ready.png` shows initialized perspective brick field/menu bar, empty counters. Inspected `file/file-menu.png` and `menu/game-menu.png`: New Game Command-N, Pause Command-P, Resume Command-G; instructions/sound/gentler-speed options. Labels do not prove keyboard shortcuts. README: mouse position controls paddle; button press/release near paddle contact adjusts ball speed; pause does not pause bonus timer.

4-bit `play` and corrected held-menu `play2` select New Game then move mouse inside field. Content becomes black; later menu mouse-down redraws initial field. This is an observed depth-specific readiness/rendering issue, not a proven shared-service defect. No guessed pixel assertions.

Single8-bit `probe8`: wait120 frontend ticks; File menu(v10,h51), wait2; move(v26,h85), hold2, release; wait60 and capture `new-game`; move(v380,h300), wait60/capture `moved`; mouse down5ticks, move(v410,h450), wait15, release, wait60/capture `after-button`; open menu/capture. `new-game` shows field/counters and small white floor polygon. `moved` shows floor polygon shifted. `after-button` shows shifted floor polygon plus large white/gray horizontal slab across upper field; later menu capture retains anomaly. No independently identified ball motion, collision or scoring advancement established. Paddle/speed correctness not certified.

Six scenarios(`launch`,`menu`,`file`,`play`,`play2`,`probe8`) passed actions, zero assertions, zero budget-exhausted frames. Screenshots inspected. Passed script is not compatibility certification. No independent reference, real-time measurement, host-load sampling or audible check. Frontend/guest clocks are not performance figures.

| Area | Result |
|---|---|
| Startup/menu | Observed4-bit initialization/menu response. |
| New Game |4-bit black issue;8-bit field/counters initialize. |
| Mouse |8-bit floor polygon shifts; button sequence executed; drawing anomaly follows. |
| Motion/collision/scoring fidelity | Unverified. |
| Busy scene, pause/resume | Untested;4-bit pause attempt did not establish pause. |
| Sound/music | Untested; checked sound option not audio evidence. |
| Saves/preferences persistence | Untested; source state preserved, no mapping established. |
| Physical controller | Untested. |
| Browser/performance | Entry unprepared; no release baseline/pacing candidate. |

## Changes, validation and next step

Authorized `scripts/extract_owned_game.py` change suppresses alias regeneration on copies. `scripts/test_extract_owned_game.py` synthetic source-write/read alias round trip checks forks/metadata/folder dates, original immutability, unrelated-file exclusion, path/output/overlap guards. Cached Python:2tests passed. Real whole-folder reopen verification:4files passed. `git diff --check` passed(unrelated checkpoint LF/CRLF warning only). No expensive build.

Rollback: revert these two helper/test changes if needed; no runtime configuration changed. Scratch may be discarded, originals/preferences/browser state unaffected.

Next: independent reference screenshot and finite8-bit mouse-controlled scene to establish expected paddle/ball rendering. Determine whether slab is erroneous drawing or transient representation before shared-runtime diagnosis. No grounded low/likely/high effort estimate yet. Compiled browser entry and performance work follow usable gameplay preparation; no lower budget justified.
