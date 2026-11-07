# Acquire 1.0 first pass

Outcome: unchanged baseline; copied preparation and useful native gameplay smoke evidence. No release-browser entry exists, so browser performance remains unmeasured. No runtime, catalogue, control or pacing setting changed.

Tool selection followed the assigned Sol worker workflow; model identity was not independently verified. Used mac-game-modernization/tuning and systemless-headless/play guide. Inspected dev checkout (clean), assigned starting revision 17f7dd72bc54c75f061ad098e1bc13993f6be4ed. Native binary reports 0.110.1; exact compilation revision unknown. No builds, browser control or source-media launches.

## Source and preparation

Original Content/001, `Acquire ƒ/Acquire 1.0`, APPL creator TTcA, CODE 68K, two vers strings 1.0, SIZE preferred partition 768000 bytes. Data fork empty, resource fork 134543 bytes. Resource types include CODE, SIZE, vers, PICT, cicn, snd, MENU and application-specific resources. Read Me independently identifies Acquire 1.0 (1993). Entire sibling folder copied: executable, Read Me - Acquire, Acquire 1.0 alias. No helper application in folder. Boot name/creator scan found only a launcher alias, no preference candidate; this does not prove preferences cannot be created at runtime.

Extraction used existing scripts/extract_owned_game.py with --source D:/SheepShaver_MAC_Emulator/Content/001 --original-root D:/SheepShaver_MAC_Emulator --select "Acquire ƒ" --output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/acquire-1-0/acquire.hfv. Default 8388608-byte fixture. Three files verified after reopening: both forks, Finder fields and represented folder dates. Raw alias forks retained but may still target original volume; alias resolution unqualified. Original folder Finder information is unexposed by machfs, so this is not a complete volume clone. Source hashed unchanged around extraction; Boot hashed unchanged around inspection. Hashes in review-summary.json/private metadata.json.

## Native reproduction and observations

Private root: D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/acquire-1-0. Set SYSTEMLESS_LOAD_EXECUTABLE='Acquire 1.0'. Run:

`D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/acquire-1-0/acquire.hfv --headless --prefer-classic-68k --screen-depth 8 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/acquire-1-0/click.json --play-output <new-empty-private-directory>`

No partition override: original SIZE preference applies. Default native display actually 800x600 (confirmed screenshot/log), 8-bit exploratory color probe. Readme recommends color, does not specify exact depth or resolution; 640x480 and other depths not qualified. Native renderer requested Auto, selected platform. Startup, menu, game and click scenarios/logs/report.json/captures preserved privately. click report: passed, architecture 68k, 209 frontend ticks, guest tick805, zero exhausted frames, zero assertions; script completion alone is not compatibility proof.

Inspected startup.png: splash explicitly asks any key/click. After 120 ticks, Space down2ticks/up then20ticks dismisses splash. Inspected ready.png: legend and New Game. File menu lists New Game Command-N, Help Command-H, Quit Command-Q. New Game click h441/v292 with down2ticks/up then30ticks displays ten collectible/penalty icons, score0. Inspected game.png before selecting h69/v176 cross. Click down1tick/up then2ticks: clicked.png removes cross and score becomes100, matching legend. After another30ticks, later.png shows an additional icon change. File menu opens during gameplay; guest tick stayed805 while frontend advanced207→209. No claim of pause/resume qualification from this short retained-menu observation.

Readme: click items to acquire points; evil eye/poison/bomb incur penalties; overlap/ghost images are explicitly documented; game ends after about130seconds. This makes mouse movement/click primary control. No keyboard gameplay or controller mapping established.

| Area | Result |
|---|---|
| Launch/readiness | Observed splash dismissal and board |
| Mouse scoring | Observed cross disappears, 0→100 |
| Scene changes | Observed item change after30 frontend ticks; no timing fidelity claim |
| Menu | Observed File menu before/during game |
| Pause/resume, busy scene, end-game | Untested |
| Sound/music | snd resources present; audible fidelity and sample assertion untested |
| Saves/preferences persistence | Untested; no browser saves touched |
| Controller/fullscreen/focus | Untested |
| Reference fidelity/performance | Unmeasured; native ticks are not real-time benchmark |

No source assertions were added. Optional pixel-inspection attempt lacked Pillow in cached environment; did not install dependencies. Screenshots were visually inspected directly. No blocker observed within bounded smoke, no full compatibility certification.

## Next action and rollback

Prepare one explicit private catalogue/packaging entry only after coordinator review: executable Acquire 1.0, 68K; use inspected 8-bit as exploratory, separately verify640x480 layout. No pacing candidate. Root can establish release-browser input/audio/save checks and independent reference behavior. Rollback is deleting this title's newly created D: fixture/evidence and two report files; originals/browser saves unaffected. Native/extraction ownership explicitly released to coordinator before report completion. Changed repository files: this report and review-summary.json only; no shared helper edits.
