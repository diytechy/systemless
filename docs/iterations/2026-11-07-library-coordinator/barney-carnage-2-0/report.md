# Barney Carnage 2.0 first pass

Outcome: copied-fixture preparation and inspected initial gameplay smoke; no performance or full compatibility qualification. No runtime/catalogue changes. Workload released to coordinator after three native processes exited normally.

Repository dev at2cb9d20cc116bf3c48673ebdf0c5735e9047e0f2; unrelated active-worker.json left intact. Used mac-game-modernization and systemless-headless skills. Assigned worker tool selection was Sol; model identity was not independently verified.

Source Content/001 folder BarneyCarnage2.0ƒ has the game, raw alias, readme and folder icon. Readme confirms2.0 with five levels and shooting mouse gameplay. Executable has CODE, no PPC fragment or vers; empty data fork, resource587219 bytes; original SIZE2560000 retained without override. No documented resolution/depth requirement established. Native framebuffer and visible content are800×600,8-bit exploratory; earlier progress message640×480 was corrected by actual capture/log inspection.

Private root: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/barney-carnage-2-0`. preservation.json records hashes and metadata checks. game.hfv verified all4 selected files, both forks/type/creator/flags/dates/locations. Source001 hash before/after82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e; Boot before/after01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393. Fixture88770f04e5ad4431795520228eaa35de233e12f665e21a991a2f826b8d44ec46. Folder Finder information unexposed by machfs; represented dates retained. Raw aliases preserve bytes but may still reference original volume; resolution not claimed.

Mandatory read-only Boot/System Folder/Preferences scan by title and creator found16 matches because creator???? is generic. Only title-name match was a Navigation Services Recent Items alias. No actual title preference established; this is not proof none exists. All matches preserved separately in prefs.hfv (16 files), never imported into game or runtime; unrelated settings/registration content remains private. Consequently no reachable existing game preference was demonstrated, and default-state/native preference persistence remains unverified. No missing-preference-create log was observed. No browser save mapping assigned or existing browser state touched.

Native binary D:/SystemlessBuild/target/ci-test/systemless.exe version0.110.1 SHA25670062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c; exact compile revision unknown. No build. Reproduce from repo using private script startup.json, play.json or input.json:

```powershell
$env:SYSTEMLESS_LOAD_EXECUTABLE='Barney Carnage 2.0'
D:/SystemlessBuild/target/ci-test/systemless.exe D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/barney-carnage-2-0/game.hfv --headless --prefer-classic-68k --screen-depth 8 --play-script D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/barney-carnage-2-0/input.json --play-output D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/barney-carnage-2-0/new-empty-output
```

Each run was wrapped by Start-Process Hidden, own PID recorded, WaitForExit90000 then own-PID Stop-Process if necessary; no timeout/termination occurred. Startup360 ticks, play274 ticks, input288 ticks all passed,0 assertions,0 budget exhaustion, no reported error. These are finite action-completion checks, not compatibility tests. Captures and report.json inspected. Private manifest.json lists exact evidence hashes.

Sequence:120 frontend ticks shows title explicitly requesting mouse button. Click(v250,h400), hold2 ticks, release,60 ticks reveals Level1 story. Click(v300,h450), hold2, release,90 ticks reveals white playfield and small target near top. Name after_shot is historical: this second click advanced story, not verified shooting. Final aimed click(v38,h490),2 ticks, release,10 ticks produces target at changed position. Options click(v10,h130),2 ticks screenshot shows no opened menu; no menu/pause claim.

| Area | Evidence |
|---|---|
| Startup/readiness | Observed title, Level1 story and initial playfield |
| Mouse input | Title/story advance observed; aimed gameplay click completed but no verified hit/score |
| Motion | Target position changed between inspected captures; correct pace/animation unverified |
| Busy scenes/levels/collision/scoring | Untested |
| Menu/pause | Menu bar visible; Options click did not establish menu opening; pause untested |
| Audio | Resources requested in logs; audible output/fidelity untested |
| Saves/preferences/controller | Unverified; no physical controller test |
| Browser timing | Not measured; no compiled title entry/route |

No substantial compatibility blocker established. No pacing candidate: native frontend ticks cannot supply release-browser wall-time evidence, and no independent reference was used. Next: coordinator prepare isolated catalogue entry with explicit executable/originalSIZE and stable new save ID, inspect browser gameplay mouse aiming/hit/score and menus, resolve any actual preference mapping, then capture release baseline. No grounded shared-fix estimate required. Rollback consists of removing own report/private copies; originals, runtime and existing three-game mappings unchanged. No commit/push/upload/deploy.
