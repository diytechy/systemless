# Current follow-up outcome

CD dependencies are now preserved and opened successfully in a two-volume diagnostic pack. Initial readiness remains unresolved through360 frontend ticks. See [bounded follow-up](followup.md) for authoritative current results; the first-pass record below is historical.

# Star Trek: A Final Unity first pass

The selected installed 68K slice reaches a fatal missing-resource dialog because this finite copied installation lacks CD content. This is a preparation blocker, with no demonstrated emulator incompatibility or pacing candidate. The configured disc contains the named resource archive; its APM boundary discrepancy does not establish corruption.

## Source and preservation

Worked on dev, observed HEAD d87ccb0d97f38f7c64b444836710646c1bdfa3ad. Existing shared changes were untouched. Coordinator selected a fresh Sol worker; model identity was not independently verified. Used mac-game-modernization/tuning and systemless-headless/play instructions. No build, browser, commit, shared change, mount, conversion or upload.

Copied all 11 files beneath Content/002 Star Trek TNG, including both configuration files and the complete existing savegame folder, plus one Boot creator-STFU launcher alias. No title/name/creator-matched separate preference was found in Boot/System Folder. The launcher alias is preserved raw and is not claimed to resolve. Configuration was retained beside the executable; native PBHOpenDF/PBRead proves sttng.prefs.68k was actually opened and read. This is the original copied configuration state, not a newly created preference state. No save round trip was attempted.

12 files were compared after HFS serialization for data/resource forks, type/creator, flags, dates and Finder coordinates. HFS+ signed coordinates were represented modulo65536 to retain bit patterns. Represented ancestor/selected folder dates were retained; original folder Finder information remains unavailable in machfs. On-disk image was subsequently hashed and reopened. Scope is the complete installed folder, not complete game dependencies.

Source002 SHA256 before/after: 8119cbbb69d4a0d5ea4d2cbc2011467fbe396846c79ea0341919a399951ba946. Boot before/after: 01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393. Fixture SHA256: 2073c1cdb55ad345d4f1a7bfbbb4aac162fd1151cc8ce1680def7b447bdee775. Exact selected executable fork hashes match the assignment. No installed Read Me/help file exists in the selected folder.

## Bounded disc audit

Read only the first32KiB, HFS MDB, ~1MiB inline catalogue extent, and three small named documentation data/resource forks from the configured StarTrek_FinalUnity.toast. No large payload was read or copied. Apple_HFS starts2048 and declares end677014528,3072 bytes beyond physical677011456. The in-file catalogue extent1053696..2095616 was read successfully. This independently overcomes the strict catalogue reader boundary for discovery only; full CD fork/extent integrity and payload preservation remain unverified. Prior coordinator full-disc hash4478f39535074d51cea2b00baafbad833d92907834cb4898fe466d98bdc9b229 was not recomputed in this bounded pass.

Volume name is Star Trek. Root STTNG.ZIP has logical data length474238510 and zero resource bytes. The .movies folder has many QuickTime movies. Native lookup is Star Trek:sttng.zip, matching the disc volume/resource identity apart from case. Disc also has an executable variant with resource length802509 versus installed802561; it was not substituted. All catalogue entries and read bounds are private disc-audit JSON.

Inspected Read Me data fork, regardless of Finder type; preserved its resource fork too. It labels the CD Macintosh version1.0.1, dated12/3/95; this does not prove the installed selected version. It calls for12MB free RAM, QuickTime2.0 (2.1 recommended), Sound Manager/CD drivers, and suggests Sound Manager3.1. It documents Shift to speed walking and accent key for tactical Combat Options. It does not establish a display size/depth requirement. About QuickTime2.1 and Sound Manager Read Me forks were retained as supplementary documentation; no claim that their extensions are usable by Systemless.

## Native reproduction and observed behavior

Cached D:/SystemlessBuild/target/ci-test/systemless.exe version0.110.1, SHA25670062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c; exact compile revision unknown. Explicit classic68K, exact executable Star Trek TNG/"A Final Unity", exploratory8-bit default800x600. Original SIZE partition retained without override; inventory lists11776000/15390720/15390720 bytes. These are not verified production display requirements.

Run startup.json: run60, screenshot startup, run120, screenshot later; max180 frontend ticks,90-second wall bound. Command arguments and environment selection are encoded in run.py and owned-process.json. PID103628 exited0; durable ownership state is exited. At60 ticks screenshot is blank cyan. At180 the inspected dialog says the resource file cannot be found and asks to check the CD path in sttng.prefs. Log proves the copied local68K preference was read, then Star Trek:sttng.zip was looked up. Scenario actions passed with0 assertions,180 frontend ticks, guest tick780,0 budget exhaustion. This is successful script completion at an application error, not gameplay launch qualification. No second diagnostic was needed because the missing dependency is explicit.

| Area | Result |
|---|---|
| Startup | Original68K config loaded; fatal missing CD resource dialog observed |
| Gameplay/motion/timing/busy scene | Untested |
| Controls/menu/pause | Documentation inspected; input untested |
| Sound/music/synchronization | Untested |
| Existing saves | Copied and verified; not loaded or written |
| Controller | Untested |
| Browser/performance | Untested; no release entry or timing claim |

## Checks, rollback and next action

New absolute-path runner checks resolved ancestry for fixture/scenario/output/log/ownership before writing or starting a child; input existence and out-of-scope guard were tested without an emulator. Original media was opened read-only. Private logs contain configuration-dependent paths and remain outside Git. Existing diagnostics were not replaced. Evidence-manifest.json records private script/log/scenario/capture/report hashes. preservation.json records individual fork hashes and exact copied names. Native and extraction workload released before documentation.

No runtime settings changed. Rollback is simply to leave these owned diagnostic files unused; originals, existing library/save identities and shared changes remain intact. The next useful step is coordinator-controlled preparation of complete CD content under the correct Star Trek volume/path identity, preserving full forks/Finder metadata and checking every extent before another68K launch. Do not alter the original preference or silently flatten the disc. Runtime QuickTime/Sound Manager support remains a later discovery task. A bounded dependency-preparation task is justified; an implementation effort range is not yet grounded.


Follow-up: [bounded CD dependency preparation](followup.md) resolves the resource-path error with a verified two-volume diagnostic pack. Startup readiness remains unresolved. Original first-pass evidence above is retained.
