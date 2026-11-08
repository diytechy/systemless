# Some Dots checkpoint v2 — future, unaccepted

The separate v2 candidate replaces the irregular checkpoint interior patches with a stable blue orb, two balanced curved bands and one moving white glint. The inspected contact sheet reads as an intentional symmetric body while retaining directional lighting and phase variation. This is a styling candidate, **not native level9 appearance, anchor or gameplay approval**.

Private candidate: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/some-dots/vector-candidate-v2/assets/`. Original `vector-candidate/` remains intact. Only `some-dots-group-300.svg` checkpoint interiors79–89 and the private atlas sidecar changed. The original author's `orb()` implementation in `bombs/build-vector-candidates.py` supplied the outer circle/gradient/clip, retained literally; the new revision script replaces only their clipped interior groups.

## Design and preservation

The circle remains centered(5,5), radius4.75, in the same10×10 descriptor bounds. The original gray/slate outer shading forms a deliberate narrow rim. A blue inner body and centered horizontal/vertical bands replace fitted bitmap color islands. A single smooth glint moves and grows from upper-left toward center through the middle phases, then returns. Frame88 introduces a smaller red center marker and89 enlarges it. No raster staircase or irregular color-island tracing was used.

All51 baseline payloads and the baseline runtime manifest are byte-identical. The30 main-atlas ring/protection frame spans remain byte-identical. The complete secondary atlas, original collision/profile payload, frame offsets, dimensions, flips, atlas cells and animation/lifecycle metadata are unchanged. No runtime registration, active manifest, source media or save was edited.

## Validation and review

One controlled ImageMagick job rasterized group300 at4× resolution; the unchanged secondary preview was reused. XML/dimension checks and all82 frame-cell checks passed, including empty sentinels and no atlas bleed. All eleven checkpoints retain exactly the same nonzero-alpha silhouette at4×. Their antialiased alpha values differ at14–31 boundary pixels because the old interior layers touched the clip edge differently; the circle/clip geometry, alpha support and original collider are unchanged. This is not a claim of byte-identical alpha values.

The30 untouched main frames have exactly equal preview alpha and RGB differences of at most1 from the existing preview's output quantization; their serialized SVG is byte-identical. The source/v1/v2 contact sheet was visually inspected. V2 removes the faceted appearance without changing the rings or protection markers. Native-size readability, exact palette balance, source glint timing and selected-marker placement still need original level9 comparison.

Private reproducibility/evidence: `prepare-v2.py`, `validate-v2.py`, `preflight.json`, `validation.json`, `group-300-preview-4x.png`, `group-300-preview.png`, and `checkpoint-source-v1-v2-contact.png` under the v2 root. The sidecar records the new main-atlas hash and phase parameters. The original v1 tree was hash-checked before and after.

- Main SVG SHA256: `e56b6796804902f4e660fa2b1f8b582a1de933f71451a8e4023dde37a0ebab88`.
- Private atlas sidecar SHA256: `7aa2e8b6914fd5c2f0259169155112a59198df272ee6b5b1f53b9bda9cc1999b`.

The controlled conversion/validation workload is finished and released. No emulator, browser, build, benchmark or activation ran. Only private v2 files and this sanitized report/JSON were written. Root owns adoption and native acceptance; files are released.
