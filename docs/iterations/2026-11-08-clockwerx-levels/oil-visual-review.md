# Oil saved-image visual and lifecycle audit

The initial browser scene places the one Child-active amber puddle correctly. Its smooth artwork is visibly lighter and fuller than the native textured amber, but there is no misplaced, missing or extra pool. Keep the raw placement and original collision data. The main remaining art decision is whether to retain that smooth gold treatment or darken it for closer native color fidelity.

Evidence is private under `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/oil/`: `browser-idle.png`, `native-play-01/initial-after-reveal.png`, the40 existing idle captures, source/candidate contact sheets, source profiles and the coordinator's `native-script-model.json`. Native crop is(80,60)–(720,540); browser is640×480. Both use large-board origin(74,72). No new browser/emulator run was performed. A subsequently requested color candidate received bounded local atlas previews.

## Initial artwork

Within a fixed pool ROI, the same simple warm-color threshold gives bounds(345,173)–(360,188) in both images. Native has164 qualifying body pixels with mean RGB140.09/84.50/0; browser has193 with mean179.04/120.20/42.78. These means describe different threshold-selected coverage, not a pixel-parity score. They substantiate the visual difference: the smooth convex body fills small native indentations and its broad pale highlight makes it read more like a rounded gold drop than the darker, irregular oil glob. Amber hue, general diagonal orientation and scale remain recognizable.

The requested separate color candidate is in `amber-candidate/`: two revised SVG atlases plus `color-report.json` and locally inspected previews. It uses source gamma0.7 amber palette tones, reducing the pale highlight's radii to55% and opacity to55% while retaining body silhouettes, atlas layout, dimensions, shadows and source colliders. Dormant candidate body mean RGB136.76/83.09/1.75 is much closer to the gamma-corrected original139.37/83.88/0 than the prior browser gold179.04/120.20/42.78. Different body coverage and browser versus local rasterization remain explicit limits. Seven representative PU/DP frames are tabulated in the private color report; darker moving midtones remain approximate. DP/fader contact sheets show simplified rounded shapes and smooth opacity fades; the initial screenshot cannot qualify those animation states.

Candidate SHA256: `oil-puddles.svg`=`48baecc8db96ddbfe1ad3511b81627ebe41b1d3bcd366f63bdd61bb600c6d3d4`; `oil-droplets.svg`=`50d9f59bcf2729cd452329722106eb6b9595238c592c532c83fa0f252c0bca6d`. Both atlases were locally rasterized and a representative contact sheet inspected. The original50-payload candidate and its manifest remain untouched, as do all47 Doors baseline payloads. Root owns actual-browser review and adoption; no integration manifest was edited.

The active inventory is consistent with the source masks: one visible human, one puddle and one spike. Instructional text and goal are in the expected regions; font weight/width, smooth dot shadows and unsynchronized attention effects retain previously documented differences. The private asset set preserves all47 Doors baseline payloads byte-for-byte, independently hash-checked.

## Existing-frame lifecycle fit

A lightweight read-only comparison tested the original PU/DP images at source-derived bases against all40 idle captures plus the initial image. Error is mean absolute channel difference over opaque colored source pixels, excluding gray shadow/background. It tests the observed kind1 PU and the first DP's target/leftward travel, not arbitrary droplets anywhere. Identical images or colored subregions can produce multiple frame matches; alternatives are retained privately.

- Initial and idle01–02 match dormant-looking PU art. First unambiguous waking image is idle03, native guest tick2714, frame1. Idle04–10 follow frames0,3,2,1,0,3,2. Errors are0.449–0.487. Frame0 also appears during waking, so screenshots alone cannot identify the exact trigger tick.
- Idle11 is ambiguous between dormant-looking frame0 and approach-start19. Idle12/13/14 distinctly match approach frames21/24/27 at ticks2984/3014/3044, with errors0.455/0.431/0.422.
- The DP is present at the acquired target by idle15, tick3074, and stays there through idle23, tick3314. The standing frame0 interpretation fits at error0.369, though several other source frames share matching colored subregions. Spawn therefore occurred after the visible approach at3044 and no later than3074.
- Idle24, tick3344, fits the first leftward-travel image at error0.417. Frames76/83 are indistinguishable under this color-only comparison; the source sequence and candidate model select83. This establishes travel, not a uniquely identified direction frame from pixels alone.
- Initial through idle24 all fit below0.488. Overall34 of41 captures have a best fit below1. Later travel/hero overlap and death particles increase errors; idle28 visibly contains the death explosion. Idle32 visibly shows a restarted scene under a fade; normal-color dormant art fits again from idle33. These are not reliable samples for exact DP phase or death-barrier duration.

The model checkpoints share a native-minus-model guest-tick offset1549. Its predicted trigger2701, acquisition2955 and spawn3069 are compatible with the visible checkpoint sequence and image ambiguity above. PU approach and the first DP stages align; this is not proof of every callback, exact trigger tick, complete pursuit, clone behavior or runtime equivalence. The model's fixed death delay and native random barrier/fade prevent using the later reset captures as an exact timing comparison.

The reproducible fit script and full per-frame alternatives are private at `visual-review/fit-existing.py` and `visual-review/native-frame-fits.json`. No original images or frame tables are copied into this sanitized report.

## Release

Only this report/JSON, the new private fit script/results and the separate private amber candidate/previews were written. No original atlas, integration manifest, root code, media, save, native/browser run, build or benchmark changed. Two bounded local color-preview passes ran. Root owns runtime acceptance and the separate goal route. Files and workload are released.

## Actual-browser amber follow-up

The coordinator's saved `browser-amber-idle.png` confirms the correction in the actual browser. The pool now reads as dark amber with a small warm highlight, much closer to the native scene. Its body bounds remain(345,173)–(360,188), identical to native and the earlier gold browser capture. Mean threshold-selected body RGB is137.74/84.91/3.93, versus native140.09/84.50/0 and old gold179.04/120.20/42.78.

Using the exact same164 native body pixels for both browser comparisons, mean absolute channel error decreases from44.246 to14.663 (about67%). This is a static body-color comparison; smooth shape fill, shading and missing native texture still prevent pixel identity. It confirms the intended color improvement without implying animation, shadow, fader or gameplay equivalence. Recommend retaining the amber revision.

The actual amber capture SHA256 is `813c90f9a1be96c7af68a08a0c01170078b64d259f05a49459495a8ff598bbb0`; full input hashes and measurements are private at `visual-review/actual-browser-amber-review.json`. This follow-up only read existing screenshots and wrote the measurement/report updates. No new browser, emulator, rendering or runtime workload ran. Files and workload are released again.
