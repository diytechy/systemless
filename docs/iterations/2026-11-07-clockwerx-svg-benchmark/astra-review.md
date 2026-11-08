# Astra symmetric hand reconstruction

Candidate complete; coordinator visual/game alignment acceptance remains pending. Work stayed on `SVG-Port`; no engine, renderer, board, save key, browser or emulator changes were made by this worker. No nested agents, provider substitution, builds, timing captures, commits, uploads or deployment.

I inspected the actual bitmap references at frames 0, 8, 16, 24 and 32 for all five hands (25 descriptor-resolved PNGs, respecting flipY), and the previous canonical vector comparison. Private `original-multi-angle.png` preserves that contact sheet; `viewed-inputs.json` records each path, descriptor and SHA-256. I then inspected `reconstruction-review.png`, showing originals and the new vectors enlarged 8x and rotated. ImageMagick rendered the vectors locally; the rotated review cells are rotated raster previews, not a browser rotation qualification.

The shapes were interpreted manually from repeated visual features, without contour tracing. Gold and black share exactly one private geometry: a smooth swept open loop crossed by a narrow shaft and tapered tip. Red retains its oval ring and smaller spear tip; green retains a rounded broad base and taper; blue retains its long narrow shaft and leaf-shaped tip. No unsupported ornament was added. Four original-palette colors supply approximate directional metallic gradients.

Each outline and cutout is authored only above its longitudinal axis. The generic generator reverses the segment order, reverses each Bezier's controls, and negates their y coordinates to close the reflected lower half. Thus reflection maps every boundary point to another boundary point; this is longitudinal symmetry, not equal tip/tail or 180-degree symmetry. Gold/black reuse identical geometry, with different palettes. An independent XML/path check verified every generated segment against its reflected counterpart, with exact numeric equality. The same construction covers cutouts and overlapping shaft/loop shapes. RGB shading is deliberately directional.

All five hands retain the original logical start/reach, pivot at the coordinate origin, and unchanged `vectorAssets` descriptors. The 48-pixel gameplay reach remains untouched. The output also contains the six current dot SVGs, original backdrop and three sounds, all byte-identical to the current asset set. Manifest board, dimensions, fixture hash, sound mappings and descriptor layout compare equal. Every output file hash and all 25 source-reference hashes passed. The four focused generic tests cover cubic reflection, invalid axis/control geometry, holes/viewport bounds, and traversal rejection.

Private deliverables are under `D:/SystemlessBuild/diagnostics/2026-11-07-svg-benchmark/astra/`: `assets/manifest.json`, eleven SVGs plus backdrop/three sounds, `design-profile.json`, `viewed-inputs.json`, both contact sheets, five rendered hand previews, and `validation.json`. The asset set has 15 content files totaling 66,697 bytes, plus its 3,315-byte manifest; the five hand SVGs total 3,501 bytes. Detailed hashes and validation results are in [astra-review.json](astra-review.json). Artwork and design/path data remain outside Git.

Regenerate to a new empty private output directory:

```powershell
python prototypes/clockwerx-html5/reconstruct_assets.py --source D:/SystemlessBuild/diagnostics/2026-11-07-svg-port/assets-v2 --profile D:/SystemlessBuild/diagnostics/2026-11-07-svg-benchmark/astra/design-profile.json --output D:/SystemlessBuild/diagnostics/2026-11-07-svg-benchmark/astra/assets-regenerated
```

Run focused checks from `prototypes/clockwerx-html5` with `python -m unittest test_reconstruct_assets.py`. Generation refuses a nonempty output, validates source hashes and control hulls, and refuses artwork/profile paths inside this repository.

Estimated active effort: about 12 minutes (3 reading/viewing, 6 generator/design, 2 local rendering/checks, 1 report). This is an estimate, not a stopwatch or benchmark. The primary remaining uncertainty is the precise original designer's curves: tiny aliased sprites support the motifs and proportions but do not uniquely determine vector geometry. These are intentional smooth reconstructions. Native-scale legibility, game pivot/rotation alignment, browser gradient rendering and performance are coordinator acceptance work; this worker makes no gameplay, sound, saves, controller or runtime claims.
