# ClockWerx Movement HTML5 pilot report

Status: playable source checkpoint; root-supported browser validation and final comparison pending. Source only; no commit/push/upload/deploy by worker. Workload released; root owns emulator/build/browser.

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

## Acceptance (checkpoint; final browser results pending)

| Check | Evidence/result | Limit |
|---|---|---|
| Owned fixture unchanged/hash | Input SHA checked; read-only bytes | Root owns prior metadata-preservation proof |
| Original assets/map | Resource extraction and private contact sheet; exactPICT401 | Final mask regeneration passed; original shared masks preserve white highlights |
|4actions/combinedflip | Engine test passes documented pivot/direction behavior | Browser original action sequence pending |
| Earlyrelease/heldaction/pause/restart | Engine assertions pass | Root browser UI pending |
| Goal reachable | Private actual-map hold-swing43.6083sec;hold-flip39.8167sec | Reconstructed simulation only, NOT original completion |
| Bounce | Actual-map120sec heldbounce:0transfers, pivotunchanged | Original behavior comparison pending |
|640x480/demos | Source renders real map/direction assets | Final root PNG pending |
| Sound |3original WAV extracted,22255Hz8bitmono | Audibility/synchronization pending; reverse/music omitted |
| Controller | Standardmapping adapter; focus/visibility gated | Physical hardware untested |
| Timing/PNG/memory UI | Sourcechecks pass | Root browser validation pending |
| Performance | None claimed by worker | Root sequential matched captures pending |

## Checks and artifacts

node --test prototypes/clockwerx-html5/engine.test.mjs passes. Node syntax checks for app/board/engine pass. Python extractor py_compile passes. Private reachability.mjs uses actualprivate map; output does not imply original qualification. No release build/native emulator run by worker. All owned conversion children exited; only short synchronous processes, no unrelated termination. See worklog.md for activity/budget/failures.

## Effort and full-port estimate

Budget recorded before implementation:120active minutes discovery/implementation plus45coordinated validation,3hourselapsed target. At source freeze23:38UTC, worker elapsed~24minutes from23:14UTC; active categories are approximate (instructions1min,asset/behavior discovery5min,implementation/checks14min,reports4min), not an externally sampled CPU/work tracker. Short synchronous converter/test tool time is included; no long build/emulator wait was charged. Root reference/export/build work is separate and sometimes overlapped source coding. Root prototype validation time will be finalized after UI review. Initial runnable checkpoint arrived in~18minutes elapsed, with asset decoding, behavior evidence, code and focused tests; further validation remains material.

Cheap resource inventory found120 RND2 board resources in the Levels fork,48 graphics groups (38 sprite groups and10 background/palette groups), and29 application help-text resources. These counts describe available data, not120 qualified distinct campaign levels or38 distinct rules. Help topics identify at least9 substantial mechanic families beyond simple pivot transfer: enemy clock hands; spikes/moving spikes; walls/doors/switches; guns/triggers/bullets; wallbusters; oil globs/droplets; lighters/fuses/bombs; special dots across3help sections; and two-player interactions. None is implemented merely because its graphics are accessible.

Provisional full-port effort, person-hours, based on this slice, resource counts and those mechanic families: reusable engine/presentation/input/state/audio low40/likely100/high220; remaining mechanics/enemies/doors/guns/oil/fuses/specialdots low100/likely280/high700; 120 RND2 level resources/content pipeline low40/likely120/high300; fidelity/browser/audio/controller/playthrough validation low100/likely300/high800. Total low280/likely800/high2020hours. These are provisional developer-hours, not a conversion of agent minutes into human productivity. This is a broad feasibility estimate, not a commitment or linear level extrapolation. Hiddenrules, unsupported content/resource variants, timing/audio and fullcampaign validation dominate. Reassess after3–5distinct complex boards; no automatic conversion claim.

Recommendation at checkpoint: retain both original runner and bounded pilot; do not replace library entry or accept global pacing based on this slice. Further port work depends on independently validated action/timing fidelity and user value from extra features, not only simpler-scene resource savings. Root comparison must describe omissions and must not call end-to-end differences pure emulation overhead.

## Rollback and next action

Remove separate prototype route/source and generated private assets; original game/saveIDs/config remain untouched. Root owns packaging/integration. Next: final masked assets are ready and all conversion workload released; root serves separate local route, verifies actual presentation/actions/pause/goal/sound/diagnostics, requests any fixes, and runs sequential final comparison. No deployment authorization exists.
