# Desk Invaders II first pass — 2026-11-07

Outcome: a preserved fixture and a reproduced loader/desk-accessory hosting blocker. No runtime, catalogue, browser state, pacing or original game bytes changed. This fresh post-crash assignment used the supplied existing native binary; the requested worker tool selection was Sol, without an independent model-identity claim. Diagnostic work overlapped an authorized independent runner and supplies no performance measurement.

## Original requirement and identity

The selected source is Content/001, `Desk Invaders II ƒ/Desk Invaders II`. Its sibling `Desk Invaders.Readme` identifies “Desk Invaders, version 2.3” and explicitly calls the game a DA implementation, explaining its use alongside applications and System 7's application-like operation. That is documentation version evidence, not a parsed executable version resource. The file remains Finder type `dfil`, creator `DsKi`, with zero data bytes and 149,666 resource bytes. DRVR 12 is named with a leading NUL followed by Desk Invaders II and contains 12,032 bytes. There is no CODE, cfrg, vers or SIZE resource. This is a desk accessory, not an ordinary application whose Finder type needs correction. The readme mentions asynchronous sound but does not establish required depth, resolution, precise controls or memory partition. Those remain unknown.

## Preservation and preferences

The existing read-only `scripts/extract_owned_game.py` copied only the three-file title folder into an 8 MiB HFS fixture. It reopened the result and compared every selected data/resource fork, represented Finder field and represented folder date. Source001 SHA-256 remained 82823905777df7e14e09cd9cd720987d7224ac3639ed7574403aefdfc9198f8e; fixture SHA-256 is db1e6acaad09017699ca1e844571cbe751c05ceed9fbbc482265f8bfada275b0. The executable resource hash matches the assigned c3650aa9987d553a3e38f400bfbda75352374063d55b66c9f4ae01484f665abf; its empty data fork matches the assigned empty digest.

A read-only Boot/System Folder/Preferences name/creator scan found no Invaders name or DsKi creator match. Broad “desk” matches were unrelated system desktop preferences and were deliberately excluded. Boot SHA-256 before/after was 01eef1c78b3fe192b3c98f8fb0dfb9e9980161cba1b1b8b55155dba019b71393. No preference fixture or save mapping was invented. An hscr resource exists inside the accessory, but persistence behavior is untested. Folder Finder information is not exposed by machfs. Raw aliases are retained without automatic target regeneration and are not promised to resolve on the new volume. No disk was mounted writable.

## Bounded native reproduction

Private `run.py` records the exact command and environment. It invokes `D:/SystemlessBuild/target/ci-test/systemless.exe` on `desk-invaders-ii.hfv` with `--headless --prefer-classic-68k --screen-depth 8 --play-script probe.json --play-output native-probe`, setting SYSTEMLESS_LOAD_EXECUTABLE to the full selected path above. The scenario requests 60 frontend ticks then a startup screenshot, with maximum 120. Eight-bit depth is solely an exploratory request; no partition override was supplied and no display requirement was established. The binary SHA-256 is 70062993d3a1a628b17b31d51fa988057a68a1acb21cd1f040e77c507a24757c, reporting 0.110.1; its exact compile revision is unknown. Checkout HEAD during reporting was 5b0b13e1386b8386049f049490c7a43bcd71fb44, distinct from binary provenance.

PID 18412 exited 1 within one second, under a hard 60-second wall bound. Durable owned-process.json records exited state. The failed report says “No executable found in disk image”: architecture null, frontend/guest ticks zero, assertions zero, budget exhaustion zero, no screenshots/checkpoints. These are load-failure counters, not completed gameplay evidence. No synthetic APPL conversion, driver extraction as CODE, original patch or substitute host was attempted.

## Interpretation and next step

Observed: original DA requirement, preserved resources, and actual rejection by this loader. Gameplay readiness, motion/timing, busy scenes, keyboard/mouse controls, pause/menu, audible sound, saves and physical controller support are all untested. Source Desk Manager documentation says accessories are unmodeled and OpenDeskAcc returns zero. This is corroborating source context, not a title execution trace proving that trap was reached.

The smallest next step is a separately scoped source-built redistributable DA host/DRVR lifecycle test: resource discovery, open/control/close, system-window event routing and periodic servicing. Establish that bounded service contract before loading this unchanged accessory. Implementation time is not estimated from this pre-guest failure. No pacing recommendation is justified. Workload was explicitly released before these lightweight notes. Rollback consists only of deleting this title's disposable scratch; originals and shared configuration require no rollback.
