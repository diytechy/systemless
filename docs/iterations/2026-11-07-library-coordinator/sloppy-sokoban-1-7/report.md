# Sloppy Sokoban 1.7 first pass

Outcome: **compatibility blocker**, no settings accepted. Source004 contains a PPC-only executable, resource version1.7.0, creator SdSb, no CODE resources, preferred SIZE7,168,000 bytes. The APPL data/resource SHA256s match the assignment. Exact executable: `Sloppy Sokoban 1.7 ƒ/Sloppy Sokoban 1.7`. Fresh worker was selected by the coordinator as Sol; model identity was not independently verified.

## Preservation and preparation

Read AGENTS, modernization/tuning, headless/play guide, handoff, worker brief and current common/concurrency instructions. Dev checkout HEAD b1d553f3 was inspected; unrelated source changes left untouched. Source004 is HFS+ within HFS wrapper. The complete title folder plus the narrow Boot System Folder/Preferences match by title/creator were read only. The ttro Sokoban Readme and Game Instructions data forks were decoded in disposable private copies and inspected (formatting is not a rendered original). All sibling music, extra levels and documentation retained.

Fixture: `D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\sloppy-sokoban-1-7\fixture.img`; SHA256 `f54694a9ce98cead77c66d666736aec52d079fd34b929ccd7113ff2dc1249bb8`. Reopened and compared 33 files with both forks, Finder type/creator/flags/coordinates and available dates. Selected and ancestor folder dates retained; original folder Finder information is not exposed by machfs. Signed HFS+ coordinates normalized modulo65536 to preserve their raw16bit patterns. Raw alias forks preserved; alias resolution is unproven. Source and Boot hashes before/after are in summary/inventory and match after native testing. Original files were never mounted writable or launched.

Boot preference was found by title and creator SdSb and included at System Folder/Preferences/Sloppy Sokoban1.7 Preferences (exact spelling in private inventory). No values are published. Native startup halts before preference IO evidence, so virtual-path reachability/loading remains unresolved; this is not an established existing-preference gameplay baseline.

## Bounded reproduction

Binary D:/SystemlessBuild/target/ci-test/systemless.exe, version0.110.1, SHA25670062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c. Exact compiled revision unknown. No build performed. Environment SYSTEMLESS_LOAD_EXECUTABLE is the exact path above. Command uses fixture.img --headless --prefer-powerpc --screen-depth8 --play-script startup.json --play-output startup, all absolute paths under private scratch. Original SIZE retained (no partition override). Scenario runs120 frontend ticks, then requests startup screenshot, max180. Existing runner has strict resolved scratch ancestry and existence guards for fixture/scenario before logs or child creation; tested missing-input and out-of-scope rejection.90second wall bound; PID98424 exited with code1 in about1.8seconds, ownership state durable.

Run `D:/SystemlessBuild/uv-cache/archive-v0/YghSmGhw_A5RgPIr/Scripts/python.exe D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\sloppy-sokoban-1-7\runner.py startup` only with a new scenario/output name; existing output intentionally prevents overwrite.

Failed action0: guest halted before scenario completed. Frontend1, guest tick0, assertions0, budget exhaustion0, checkpoints0. PPC stderr: Halted pc0 cycles891, SP07F6FE00 LR03000218. Inspected failure.png: uniform cyan800×600; no title or gameplay. No evidence of legitimate startup progress warrants extending this halt. Specific failing import/service is unproven.

Readme requires MacOS X or System8.1+, CarbonLib1.1+, at least4MB free; advertises24bit graphics. CLI only supports1/2/4/8bit;8bit was an explicitly exploratory native probe, not a supported-depth claim. Carbon resource/import compatibility deserves a narrow loader trace next, rather than inference that display is the cause.

## Behavior, limits, next action

Controls documented: New Game then dialog/Okay, mouse point/click or default literal arrows; command-Z undo, command-R redo; Edit/Controls supports customization. None was reached/tested. Movement/timing, busy scene, menus/pause, sound, saves, physical controller and fidelity all untested. Sibling MP3 music may require additional service; no audible/fidelity assertion. No browser compiled route exists and no release performance capture occurred. Native counters are behavior diagnostics only; concurrent diagnostic contention is not a performance result.

Next: trace PPC import resolution and the PC0 transfer with this minimal fixture, then evaluate documented Carbon requirements. Likely service unknown; no grounded low/likely/high implementation estimate until trace. No shared fixes attempted. Rollback: remove only this title's report/private scratch if desired; source/runtime/preferences/browser state unchanged. Workload released to coordinator before documentation completion.

Raw inventory, decoded documentation, guarded runner, scenario, stdout/stderr, report, failure image and SHA256 manifest remain private at `D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\sloppy-sokoban-1-7`. Review summary is non-sensitive; no binaries/preferences/screenshots staged or committed.
