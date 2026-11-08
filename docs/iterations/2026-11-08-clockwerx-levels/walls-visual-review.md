# Walls saved-canvas visual review

The existing SVG walls are too dark and blue-green. Their thin, muted highlight and nearly black stepped side make them read differently from the native silver-gray beams. Placement is already correct and should remain unchanged. This review uses the saved actual browser `walls/pilot-initial.png` and native `walls/native-play-01/{swing-03,after-release}.png`; native game-region origin is (80,60), size640×480. Private paths below are relative to `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/`.

## Separate candidate

`walls/visual-review/silver-candidate/assets/` contains all17 wall SVG variants and a complete copied asset set. Only the17 wall payloads and manifest metadata changed; all26 non-wall payloads, including `source-outlines.json`, are byte-identical to the reviewed `walls/qa/assets/` baseline. Every frame's size, anchor, source group/frame and manifest placement record is unchanged. The baseline was hash-checked before and after generation. Candidate manifest SHA256: `e10a6acf2ebf6ac1d4cd3af9ba2ff1af44180de4603142dd549092779536abd7`.

The candidate uses analytic unions of four-pixel axis-aligned faces, swept diagonally down-right for their extrusion. Top/left exposed edges receive the bright bevel; bottom/right edges receive the darker bevel. Internal union edges are removed, preserving T/cross continuity. Small pale-blue caps remain at genuine tile ends, matching the native repeated joints. This is compact geometric SVG construction, not raster staircase tracing. The native tiny wall's diagonal side replaces the old square offset bars.

Source palette1000 with the existing gamma0.7 interpretation supplies neutral highlight238, face202, side79, outer-shadow106 and bevel130; native captures show side80/shadow107. The cap is RGB217/235/255. No global palette, backdrop, actor, dot or collider changes are included.

| Native source surface | Native mean RGB | Existing browser mean RGB | Candidate local SVG mean RGB |
|---|---|---|---|
| Top/left highlight,1029pixels |238/238/238|108.13/116.13/121.13|237.79/237.79/237.79|
| Face,2242pixels |202/202/202|138.97/146.97/150.48|202.10/202.10/202.10|
| Side,7206pixels |80/80/80|45.04/49.71/48.39|79.30/79.30/79.30|
| Outer shadow,2415pixels |107/107/107|53.13/59.12/57.16|92.66/92.66/92.67|

Across13343 opaque wall pixels with unambiguous source colors, mean absolute channel error versus native falls from48.23 in the existing canvas to4.56 in the locally rasterized candidate. This metric excludes source RGB130 because it is also the background value. Outer-shadow edge coverage and antialiased cap/junction pixels remain approximate; this is not pixel parity or actual-browser qualification. See `visual-review/wall-comparison-native-size.png`, `wall-comparison-3x.png`, `candidate-contact.png`, and `measurements.json`. All17 variants were locally rasterized at their unchanged dimensions and the contact sheet inspected;11 appear in this level's51 tiles.

The coordinator's independent source-bitmap placement check covers14496 opaque wall pixels: best offset(0,0), mean channel error0.664 and100% within2. It validates source placement, not the old SVG colors. No offsets or collision geometry were adjusted.

## Other scene elements

- The decoded source has62 present dots,9 bonus dots and1 goal. All bonus/goal masks are15 and therefore active for Child. The saved scenes agree with the grid layout and marked-dot locations; the right shared pivot is a bonus ring without a hand. Counts come from the source, not an automated count of partly occluded screenshot dots. Marked row/column coordinates are retained in the JSON report. The goal is row6,column9, at logical(506,360).
- Dot/bonus placement looks consistent. Smooth SVG dots have somewhat broader dark outlines and smooth oval shadows; native dots use small blue rims and textured shadows. Those existing art differences remain. Attention sparkles and actor poses differ because the captures are from different moments; no animation-phase or behavior conclusion follows from their appearance.
- Child shows the hero and one lower green enemy, plus two red spikes. No green/red/blue right-stack hand is present. This agrees with source activeMask1: actor masks14/12/8 fail creation, lower-green mask15 passes. The separately hidden second-human record remains distinct from activation exclusion. See `walls-callback-order.md` for source offsets.
- All five text strings are present in the expected regions. Native uses Geneva12 for the narrative and Geneva9 for the four small labels. Browser glyphs are narrower, softer and have different weight; the small labels' bright pixels begin about1px lower. For example native narrative bright-ink bounds are(152,75)–(435,87), browser(155,75)–(428,86); native Goal Dot is(488,374)–(524,381), browser(490,375)–(523,382). These are thresholded bright-ink bounds, not exact text-layout bounds. Source positions should not be moved to compensate for font substitution without a separate font decision. The pilot HUD remains visibly different from the native HUD.

## Acceptance boundary and release

Recommend integrating the silver candidate for the wall art comparison, retaining current source placement and collision data. Root still owns actual-browser rendering, runtime wall bounce/death, goal path and final acceptance. This worker performed no browser/native run, benchmark, build, runtime edit or commit. Only this report/JSON and private `walls/visual-review/` outputs were written in this follow-up. Files and workload are released.
