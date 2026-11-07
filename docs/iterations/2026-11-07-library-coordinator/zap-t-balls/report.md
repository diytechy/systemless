# Zap'T'Balls 7.1 first pass

Outcome: copied preparation and native title/menu evidence; gameplay qualification remains incomplete. No compatibility blocker or pacing candidate is established. This worker used the coordinator-selected Sol tool assignment; model identity was not independently verified. Applied mac-game-modernization and systemless-headless skills. Workload released; both child processes exited normally, durable ownership is `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/zap-t-balls/owned-process.json`.

## Source and preservation

Selected Content/003 `Zap'T'Balls v7.1/Zap'T'Balls v7.1 (FAT)`, explicitly preferring its 68K slice. Read Me's version history and executable vers1 bytes `07 10 80 00 00 32 00 03 37 2e 31` independently identify7.1. CODE plus PPC fragment evidence identifies FAT. SIZE preferred/minimum are5,242,880bytes; unchanged, no override. The older Content/001 v3.6 was copied and reopen-verified separately as `older-36.hfv`, never substituted.

Seven files were fork/metadata reopen-compared in `fixture.hfv`: entire original title folder including Register, alias, both ttro readmes and optional16bit level-data subtree, plus the original Boot preference. All source before/after SHA256 hashes match; see review-summary.json and private preservation.json for full values. Fixture SHA256 `70b351a1c91230c78ed39ece1ebccf109c28c1f1f4f41d5cadd7f8478f91f99b`. Original sources were read-only, never mounted writable.

A narrow Boot name/creator inventory located `System Folder/Preferences/Zap'T'Balls Prefs`; retained in separate `boot-preferences.hfv` and included at the native reachable path. Logs show exists=true, FSpOpenDF and PBRead count768 from `Owned Game/System Folder/Preferences/Zap'T'Balls Prefs`, followed by delete/recreate/write in disposable VFS. This is existing-state input, not a default-preference test; values remain private. Navigation recent-item records and launcher alias were identified but are not game dependencies and were not included.

Read Me documents mouse control, Caps Lock pause and Q abort. Optional16bit backgrounds require moving the data file into the game folder and selecting16bit; original layout retained, that optional installation was not performed.8bit is an exploratory successful probe, not a proven minimum depth/resolution. Represented folder dates retained; folder Finder information unavailable through machfs. Raw aliases preserved but their resolution is unverified; signed Finder coordinate bit patterns retained modulo65536.

## Bounded native evidence

Binary `D:/SystemlessBuild/target/ci-test/systemless.exe`, version0.110.1, SHA256 `70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c`; exact compile revision unknown. Dev checkout inspected with unrelated coordinator/runtime changes left untouched. Runtime baseline recorded by assignment ed74c8b4; current diagnostic executable provenance does not prove that revision.

All outputs/logs/scenarios are under the exact private root. New absolute-path runner resolves fixture/scenario/output/log/ownership paths before redirected logs or child start, requires inputs to exist, and passed out-of-scope/missing-input guard checks. Each process had90second bound and durable PID/start/path ownership; neither needed termination.

Reproduction from repository root (cached Python path from assignment):

```powershell
& 'D:/SystemlessBuild/uv-cache/archive-v0/YghSmGhw_A5RgPIr/Scripts/python.exe' 'D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/zap-t-balls/runner.py' probe1
& 'D:/SystemlessBuild/uv-cache/archive-v0/YghSmGhw_A5RgPIr/Scripts/python.exe' 'D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/zap-t-balls/runner.py' probe2
```

Runner sets exact SYSTEMLESS_LOAD_EXECUTABLE and calls fixture.hfv with `--headless --prefer-classic-68k --screen-depth 8 --play-script ABSOLUTE --play-output ABSOLUTE`. Defaults produced800×600. Existing SIZE applies; no partition override. Repeat commands require fresh empty output names; existing evidence is retained.

| Probe | Observed actions | Frontend ticks | Final guest tick | Assertions | Budget exhaustion | Result |
|---|---|---:|---:|---:|---:|---|
|1|Startup captures at120 and600|600|1200|0|0|Passed script; title inspected|
|2|Fresh startup600; File mouse-down(v10,h51), move(v32,h82), menu screenshot; release parent;30tick followup|662|1230|0|0|Passed script; submenu inspected; closed back to title|

Images were inspected. The New Game submenu displays Normal Mode and Help! Mode; next-run Normal Mode target is observed near(h250,v35). No start action selected that submenu entry. No gameplay failure should be inferred. Guest tick stays1200 during retained menu tracking and reaches1230 after release; these are simulated counters, not performance measurements. Concurrency policy allowed independent workers, so host wall time is not a benchmark.

| Area | State |
|---|---|
|Startup/title, menu open/close|Observed|
|Actual initial gameplay, mouse movement/button fire, busy scene|Untested|
|Caps Lock pause, Q abort, keyboard shortcuts|Documented only; untested|
|Sound|Resources requested; audio fidelity untested|
|Preferences|Existing copied preference read verified; durable save roundtrip untested|
|Controller and browser timing|Untested; no compiled entry/route prepared|

## Next action and limits

Two-diagnostic finite cap reached. Next worker/coordinator can select evidenced Normal Mode from a fresh settled title and inspect before moving/clicking the mouse. Then check pause and abort separately. Keep5MiB SIZE and8bit exploratory display until requirements are better established. No runtime change or release build is justified by this result. Performance tuning requires repeated release-browser captures and independent fidelity checks; native scripts certify neither.

Only own docs and private scratch were created; no shared edits, build, commit, upload, deployment or browser-state replacement. Rollback is removal of these exact owned artifacts; original sources and shared checkout are unchanged by this worker. Full private hashes/scenarios/captures/logs: `D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/zap-t-balls/evidence-manifest.json`. Private screenshots contain registration text and must remain private. Review-summary.json is non-sensitive; status.json retains raw native counters.
