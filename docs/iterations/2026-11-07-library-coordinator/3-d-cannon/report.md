# 3-D Cannon first pass — 2026-11-07

Outcome: unchanged native baseline; extraction and initial gameplay reached. Browser performance is **not yet measured**, because this title has no compiled private catalogue entry or release route. No runtime/catalogue/pacing/save mapping changed. Worker used the assigned Sol tool selection; model identity was not independently verified.

## Source and preservation

Started `dev` HEAD `65b995d881be0c36cddeb76d1afd828d9b0517fb`; runtime baseline ed74c8b4. SheepShaver process lookup returned none. Original `D:\SheepShaver_MAC_Emulator\Content\001` was read only, never mounted. SHA256 before/after extraction: `82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e`.

Exact executable `3-D Cannon/3-D Cannon(FAT)`, Finder APPL/TDCa, fat CODE + PPC fragment. Initial native test explicitly selected 68K. Version unresolved: no vers resource strings in initial inventory. App data/resource SHA256 respectively `d1d51bde8fb57290080f05f9154290a9379afb9be39a8ed42eeac538f45e1e70` / `8c6d7e1ba122a17019fa750c6df78986cdc5867170e5ab0842fe2a7d2e5b44cb`. Source preferred SIZE partition 5,120,000 bytes, no override used.

Folder has app, ReadMe, alias and custom icon. Small fixture selects exact app and ReadMe; excludes alias/custom icon. Full-folder attempt correctly refused a round-trip resource-fork difference (machfs regenerates aliases); no partially verified image was written. ReadMe requirements: System 7+, Sound Manager 3.0+, 4MB RAM, about 1.3MB disk. FAT intended for both CPU families; FPU build described but not present. No external content dependency identified in this narrow inventory. PPC shared libraries mentioned by ReadMe; PPC not tested.

Existing `Boot/System Folder/Preferences/3-D Cannon Preferences` copied privately without printing contents. Boot SHA256 before/after `01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393`. No browser save ID established. Source extraction image hash `7c3a24f51020a760a9f9a527a1dd6dc995c25e4ba3a33fe725df86982e8a9e74`; final 8MiB fixture `be9e19bcd467018a6669c0323d836bc30e3e90da630b98d8038bfba9cabd4073`. Three files verified on reopened output: both forks, type/creator, flags, dates, x/y where represented. Generated fixtures/private manifests remain on D:.

## Reproduction and observations

Private evidence root: `D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\3-d-cannon`.

Extraction:

```powershell
& D:\SystemlessBuild\uv-cache\archive-v0\YghSmGhw_A5RgPIr\Scripts\python.exe scripts/extract_owned_game.py --source D:\SheepShaver_MAC_Emulator\Content\001 --original-root D:\SheepShaver_MAC_Emulator --output D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\3-d-cannon\game.img --select '3-D Cannon/3-D Cannon(FAT)' --select '3-D Cannon/3-D Cannon ReadMe'
& D:\SystemlessBuild\uv-cache\archive-v0\YghSmGhw_A5RgPIr\Scripts\python.exe D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\3-d-cannon\fixture.py
```

Native command (launch/menu/extended/play use respective script and fresh output):

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='3-D Cannon(FAT)'
& D:\SystemlessBuild\target\ci-test\systemless.exe D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\3-d-cannon\cannon.img --headless --prefer-classic-68k --screen-depth 8 --play-script D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\3-d-cannon\play.json --play-output D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\3-d-cannon\play
```

Diagnostic executable reports 0.110.1; exact compile revision unknown. SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`. Platform renderer selected; headless 800×600 default, explicit 8-bit exploratory setting, original SIZE partition retained. No release build, browser renderer or CPU-load performance capture.

Inspected captures: blank 400×320 game window at frontend tick120; early Game menu attempt tick122 did not open it. Extended startup and Return input reached actual title with 1 Player/2 Players/Quit at tick332. Thus early blank window is not a proven blocker. Click 1 Player at v160,h60, hold2/release, run120: terrain map, score readouts, velocity50%, Fire button at tick454. Space hold2/release, run90: perspective/crosshair view at tick546. This observes input response and rendering transition; does not prove projectile/collision/scoring fidelity. `play/report.json`: passed, exit0, frontend546, guest1146, assertions0, budget-exhausted frames0, no halt/error. Scripts completing without assertions are action completion evidence only. Initial missing-file run was a preparation failure before valid fixture creation, not a compatibility failure.

ReadMe controls: left/right rotate horizontally, up/down elevation, < and > velocity, Space fire, Command accelerates adjustments. Guns are stationary. Literal arrow semantics should be preserved in future mapping; native aiming keys not tested here.

| Area | Result |
|---|---|
| Startup/title, 1 Player terrain | Observed in inspected captures |
| Space input | Observed perspective/crosshair transition |
| Aiming/velocity, full shot/collision/scoring | Untested |
| Busy scene, pace, independent fidelity reference | Untested |
| Pause/menu after readiness | Untested; early menu click inconclusive |
| Sound/music | Untested; no audio assertion/audible qualification |
| Save round trip, physical controller, browser focus/fullscreen | Untested |
| Browser wall-time / candidate pacing | Not measured; no compiled route |

## Changes, checks, next step

Added `scripts/extract_owned_game.py`: explicit classic-HFS file/folder selections, checked path/name encoding, deep copies, original-installation output guard, refuse overwrite, source rehash, reopened fork/metadata comparison. HFS+ intentionally refused; use existing checked reader for that format. Alias rewrite mismatches fail rather than silently change resources. Added nonprivate synthetic `check-helper.py` in this report folder. Run with cached Python: nested fork/metadata/date/flag/location preservation, unrelated-root-file exclusion, unsafe/overlong path rejection, original-installation output rejection, successful extraction/reopen and overwrite refusal all passed. The helper's final ancestor-folder metadata preservation improvement passed synthetic checks; title fixture was produced with the earlier helper revision, with newly constructed parent folder metadata rather than original folder dates. Selected file metadata/forks are verified; final helper now copies ancestor metadata. No regeneration after workload release.

Rollback: remove helper/report/check files and D: copied fixtures; originals and existing library remain unchanged. No commits/push/deploy/uploads.

Coordinator review clarified an extraction limit: machfs1.3 does not read/write original folder Finder flags/positions/information. The helper preserves selected file forks/Finder fields and represented folder dates, including partial-selection ancestor dates; it is not a complete volume/folder-Finder clone. Synthetic file metadata and partial-ancestor date checks pass. Do not promote this diagnostic fixture as a full metadata-preserving library extraction until that gap is addressed or independently shown irrelevant for the selected files. Source images remain unchanged.

Next action: coordinator can prepare a reviewed private catalogue/packaging entry after agreeing display size/depth and save mapping; then capture release-browser baseline. Readiness should wait for real title, not tick120. Further native work should check aiming, velocity, actual shot completion, menu/pause and sound before compatibility approval. No missing Mac service diagnosed and no runtime fix justified. Full fidelity/performance effort cannot yet be estimated; next bounded preparation is one catalogue/packaging addition plus smoke capture, not a speculative compatibility rewrite.
