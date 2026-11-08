# Doors saved-image visual audit

No material door-art defect was identified in the supplied browser idle capture. Retain the corrected small-board origin(98,96), the current silver leaves, cap anchors and switch locations. This is a bounded visual review, not animation or gameplay acceptance.

Reviewed private evidence under `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/doors/`: native `native-play-01/initial-after-reveal.png` and `idle-04.png`, browser `browser-idle.png`, original `source-contact.png`, existing leaf/cap/switch previews, and `native-gate-review.json`. Native screenshots are800×600 with game rectangle(80,60)–(720,540); browser is640×480. The earlier large-board preview was not used.

## Findings

- **Leaves:** the closed red vertical and blue horizontal beams meet the adjoining silver walls at the expected positions. Highlight orientation and neutral face/side luminance are consistent with the original art; the earlier dark blue-green Walls defect is absent. The native initial frame shows a partially opened green pair, while native idle and browser idle show an empty passage with fixed end caps. That difference is consistent with the deliberately different timestamps. There is no visible stray leaf, reversed bevel, gross gap or displacement in the reviewed browser scene.
- **Caps:** red, green and blue markers appear at the corresponding door ends, retaining their light edging and down-right dark extrusion. The open green door retains both fixed markers, including the far cap's connection to the wall. The reviewed images do not justify changing cap offsets or sizing. Smooth edges and simplified small seams remain art approximations.
- **Switches:** all three disks appear at their expected subcell positions and use the correct red, blue and green indicators. The SVG disks have smoother, more uniform shading and a more simplified dark outer rim than the native textured metal. Their silhouette and colored indicators remain readable; this is an enhancement difference, not a missing control or placement failure. The screenshots do not establish pressed/unpressed transition fidelity.
- **Other presentation:** instructional content and line grouping are present in the expected regions. The substituted browser font is visibly heavier/softer and changes small-label widths compared with native Geneva. This is an existing shared text-rendering limitation; a separate font pass should address it if typographic fidelity is required. Actor poses, sparkle positions and green-switch contact state must not be compared as synchronized animation samples. The visible actor/hazard inventory is consistent: one hero, one lower-right green enemy and three red spikes.

The coordinator's original-art phase fit independently identifies green phases1,5,8,10 at the corrected anchors, with original fixed caps and measured gray130 background. Its reported mean absolute channel errors are0.386,0.175,0.045,0.032 respectively. Those scores validate the original-art placement/phase interpretation in that ROI; they are **not SVG error scores** and do not quantify this audit's visual judgment.

## Action and scope

Proceed with the current candidate for the bounded visual comparison; no door-specific art correction is requested. Keep the global font difference explicit. Any later leaf-motion issue should be checked with phase-aligned captures before changing geometry.

Read-only hash comparison confirms the reviewed QA candidate has47 payloads and preserves all43 Walls baseline payloads exactly. Its manifest SHA256 is `8c284c05187f765cff66cfe01c9c8e13e015d820fe143db433410e26c29c259f`. Only this sanitized report and its JSON companion were written. No source assets, app/round/level files, private artifacts, browser, emulator, new render, build or benchmark were changed/run. No complete phase sequence, timing, collision, sound, goal route or pressed-switch behavior was qualified here. Files and workload are released.
