# ClockWerx Movement HTML5 pilot report

Status: accepted bounded playable Movement prototype; root-supported GUI acceptance and all9 primary comparison captures reviewed. No full fidelity or production pacing qualification. Source only; no commit/push/upload/deploy by worker. Workload released; root owns emulator/build/browser.

## Scope and inputs

One actual Movement tutorial board from ClockWerx1.0/68K; executable ClockWerx Folder/ClockWerx;640x480 original resolution. Copied fixture D:/SystemlessBuild/private-library-20261107/media-preserved-v1/clockwerx.img SHA25603f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4 matched. Original SheepShaver disks were not opened/written by worker. Bothfork/Finder preservation was established by root before assignment; worker only reads the copied HFS image.

Writable scope: prototypes/clockwerx-html5 plus this report folder. Original resources, images, sounds, maps and private analysis stay at D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/clockwerx-html5/. Source extractor can be reviewed without owned content.

## Observed rules before implementation

Original application TEXT3004 defines swing: pivot transfer and angular-direction reversal; flip: pivot transfer with angular direction retained; bounce: retain pivot and reverse on adjacent-dot encounter; reverse: immediate direction change. TEXT3008/3009 require holding action through encounter, permit held repeats and state that early release has no effect. TEXT3006/3008 explicitly document Command+Option as flip; the pilot's swing+bounce combination is therefore ClockWerx evidence, not a borrowed SpinDoctor rule.

Original help examples call blue flip/green bounce, but actual Movement RND2 labels and root's actual board say red swing, green flip, blue bounce. The pilot follows the actual Movement scene. Movement RND2 resource151 contains11columns x8rows of cells; original screenshot verifies48px spacing, origin74,72; goldplayer(1,1), red(1,4), green(1,6), blue(8,7). Cell4003 is bonus at(9,3),4005 goal at(10,5). Numeric scoring is not reconstructed.

Root's valid original still: private reference-movement-valid-6.png. Initial reference-movement-6.png was a blank WebGL-buffer export and is INVALID; never used as visual proof. Root's32frame ordinaryUI PNG sequence reference-motion-6.json SHA256aaafe63a77e1fb5bb18aeb58c8deb492e8e6ba3394e24def7b43d9396197acc3 covers23:23:25.745–23:23:30.755UTC. Gold-color centroid outside9px around pivot122,120, angle unwrapping/OLS vs request/completion midpoint gives5.0554688sec/revolution clockwise. Raw analysis reference-rotation-analysis.json records all32angles. Encoding/sampling adds work; this is approximate observed6MHz experimental-runner timing, not an independent original fidelity oracle or performance capture.

## Implementation

Buildless Canvas2D, fixed120Hz simulation separated from rAF rendering. Original PICT401 collage/backdrop, original SUPT color bitmaps/shared1bit masks and64angle descriptors, actual Movement map, original ActionSwing/ActionFlip/ActionBounce sampled WAV. No enhanced art. Sprite origin44 and bitmap-local vertical mirroring are established by originalgoldtemplate alignment (frame37 matches at81,100 forpivot122,120, within~1px); original bitmap art is shorter than48px logical collision spacing. No sprite resizing derives collision. Actor grab masks are an explicit inference from resource nibble flags000f/00ff/0f0f/f00f and observed demo extents: player000f,red00f0,green0f00,bluef000; bounce reflects from adjacent dots without grabbing. Exact actor-access semantics and demonstration choreography remain unqualified. The pilot permits player grabs on colored demonstration dots; it does not artificially isolate the player path.

Four actions, actual3demos, goal completion, pause/restart, onscreen hold controls, standard-gamepad adapter, distinct local preference/completion key. Effects off by default each visit; hardware controller and audio fidelity unqualified. Original scoring, music/reverseeffect, campaign/menus/savecompatibility, cursor-star effects, original font rasterization and exact shadows omitted. Fonts, dot shadows and completion overlay reconstructed. No enemies/failure invented on Movement.

Ordinary UI:20second capture, timing JSON, actual canvasPNG, page-memory request with pending/capture exclusion and completion timestamps. No nonstandard JS-heap fallback. Latest completed memory result is attached on JSON download separately from raw frame conditions. Raw rAF/render/fixed-call/active-step counters are distinct; focus/visibility and invalidblur reasons are recorded. Browser CPU/process-memory sampling remains root responsibility.

## Acceptance (final bounded acceptance)

| Check | Evidence/result | Limit |
|---|---|---|
| Owned fixture unchanged/hash | Input SHA checked; read-only bytes | Root owns prior metadata-preservation proof |
| Original assets/map | Resource extraction and private contact sheet; exactPICT401 | Final mask regeneration passed; original shared masks preserve white highlights |
|4actions/combinedflip | Engine test passes documented pivot/direction behavior | Original6 held-swing advances to Spikes; exact timing/collision unqualified |
| Earlyrelease/heldaction/pause/restart | Engine assertions pass | Root keyboard/pause/restart/goal/PNG checks pass; see coordinator-review.md |
| Goal reachable | Root actual-keyboard prototype goal and original6 progression to Spikes observed; private engine hold-swing43.6083sec | Tool gaps/phase prevent precise original completion-time comparison |
| Bounce | Actual-map120sec heldbounce:0transfers, pivotunchanged | Root six-second pilot bounce retains pivot; exact original collision window unqualified |
|640x480/demos | Source renders real map/direction assets | Root PNG/geometry pass; actors intentionally not globally clipped |
| Sound |3original WAV extracted,22255Hz8bitmono | Audibility/synchronization unqualified; reverse/music omitted |
| Controller | Standardmapping adapter; focus/visibility gated | Physical hardware untested |
| Timing/PNG/memory UI | Sourcechecks pass | Root ordinary UI capture/JSON/PNG/memory evidence reviewed |
| Performance |9primary runs reviewed, all paired windows bracket captures | Broad aggregate CPU only; differing pace/scope prevents pure overhead claim |

## Checks and artifacts

node --test prototypes/clockwerx-html5/engine.test.mjs passes. Node syntax checks for app/board/engine pass. Python extractor py_compile passes. Private reachability.mjs uses actualprivate map; output does not imply original qualification. No release build/native emulator run by worker. All owned conversion children exited; only short synchronous processes, no unrelated termination. See worklog.md for activity/budget/failures.

## Effort and full-port estimate

Budget recorded before implementation:120active minutes discovery/implementation plus45coordinated validation,3hourselapsed target. Measured timestamps: start23:14:05UTC; first source freeze23:37:55 (~23m50s); final presentation-only clip removal00:12:19; final evidence review resumed00:55:28; final report completed~01:04UTC, about1h50elapsed. Estimated active worker categories (not stopwatch measurements): initial discovery/implementation/reports24min, coordinated GUI fixes2min, final evidence review/reports10min, total~36min. Worker was explicitly idle while root used the browser/build/capture workload; root work sometimes overlapped source coding. Root GUI/capture phase from first freeze to final raw handoff spans~77min elapsed, including coordination/idle/export retries/memory waits, exceeding the nominal45min validation elapsed target. This overrun is disclosed rather than converted into worker active time. The initial120active-minute implementation budget and3hour elapsed target were not exceeded.

Cheap resource inventory found120 RND2 board resources in the Levels fork,48 graphics groups (38 sprite groups and10 background/palette groups), and29 application help-text resources. These counts describe available data, not120 qualified distinct campaign levels or38 distinct rules. Help topics identify at least9 substantial mechanic families beyond simple pivot transfer: enemy clock hands; spikes/moving spikes; walls/doors/switches; guns/triggers/bullets; wallbusters; oil globs/droplets; lighters/fuses/bombs; special dots across3help sections; and two-player interactions. None is implemented merely because its graphics are accessible.

Provisional full-port effort, person-hours, based on this slice, resource counts and those mechanic families: reusable engine/presentation/input/state/audio low40/likely100/high220; remaining mechanics/enemies/doors/guns/oil/fuses/specialdots low100/likely280/high700; 120 RND2 level resources/content pipeline low40/likely120/high300; fidelity/browser/audio/controller/playthrough validation low100/likely300/high800. Total low280/likely800/high2020hours. These are provisional developer-hours, not a conversion of agent minutes into human productivity. This is a broad feasibility estimate, not a commitment or linear level extrapolation. Hiddenrules, unsupported content/resource variants, timing/audio and fullcampaign validation dominate. Reassess after3–5distinct complex boards; no automatic conversion claim.

Recommendation: retain both original runner and bounded pilot; do not replace library entry or accept global pacing based on this slice. Further port work depends on independently validated action/timing fidelity and user value from extra features, not only simpler-scene resource savings. Root comparison must describe omissions and must not call end-to-end differences pure emulation overhead.

## Rollback and next action

Remove separate prototype route/source and generated private assets; original game/saveIDs/config remain untouched. Root owns packaging/integration. Next: source and assets remain frozen; root independently reviews final-comparison-review.md/JSON and completes remaining release-route checks. Full sound/controller/fidelity work is a separate follow-up. No deployment authorization exists.

## Coordinated GUI correction

Root confirmed actual keyboard hold-swing goal completion in the prototype, restart, pause/resume status, PNG export and exact615x460.75CSS/640x480backing. Small yellow12px paused text replaces the initial largeblack text. A temporary actor clip was added after the first GUI request, supported only by a5second/32frame sample with no left/bottom changes. This was insufficient: root subsequently observed originalred/greenhands extending across the left column/collage at the leftmost dot (green approximatelyx74→34,y360). The clip was removed before every final prototype performance run. No global clip behavior is claimed from the short sample; failed hypothesis retained in worklog. Current app SHA2561e04a0e7bc3a86ccc96cb6cc97ed9c39d8e85667c9239e176c7f239848511758.

## Final comparison

See final-comparison-review.md and final-comparison-review.json for all9 primary runs, explicit CPU/memory/startup boundaries and motion evidence. Final default motion estimate13.0893sec/revolution is extrapolated from26PNGframes/0.36turn;6-c33PNGframes give5.0002sec/revolution. Prototype exported-angle/walltime gives5.0542–5.0567sec/revolution, about1.1%slower than the newer sampled6reference. PNG overhead/no independent oracle apply. Default pace is materially slower and does not supply a pace-matched causal resource comparison. Page API estimates19.91/20.12/5.12MiB are separate from~162.625MiB workerlinear allocation and do not measure physical RAM. Broad browser/Codex CPU associates lower values with the pilot in B/C but cannot isolate game CPU or pure emulation overhead. No setting promoted or original library entry replaced.
