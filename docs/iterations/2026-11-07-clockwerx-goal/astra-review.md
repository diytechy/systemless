# Astra goal animation review

Candidate ready for root integration and visual acceptance. The original goal uses six marker states around a stationary sphere; it does not simply rotate a fixed opaque silhouette. The refined private SVG reproduces the changing triangle size and pale color. All 15 other assets are byte-identical, including the sphere and hands. No source app, saves, original media, branch, or commit was changed by this worker.

## Cadence evidence and chosen setting

The initial 32-frame reference has severe fourfold/sampling ambiguity. Circular state fits produced plausible rates near 19.25, 57.78 and 96.32 states/sec; taking its strongest peak would select the wrong alias. Two new original captures each contain 69 samples over about two seconds. Both show source states advancing in order, with duplicate frames and no observed change larger than one state. This resolves the practical alias and direction.

Under readback/capture overhead, observed conceptual full rotations were 1.512 and 1.534 seconds. The guest clock reached only about 48–50 ticks/sec. Regressing unwrapped state against the latest worker guest tick yields 3.144 and 3.122 ticks/state, corresponding to full rotations of 1.258 and 1.249 seconds at 60 guest ticks/sec. The selected setting is **0.052083333333333336 seconds/state**, a **0.3125-second six-state repeat**, or **1.25 seconds per conceptual full rotation**. The full turn is not visually unique because of fourfold symmetry.

The previous 1.25-second setting was unevidenced; its magnitude happens to agree with the new normalized estimate. The material correction is the source six-state size/color cycle. Exact source timer constants were not recovered. Latest-worker timestamps may lag presentation, and these appearance captures are not performance benchmarks. The choice targets nominal guest-clock pace, not the slower wall-clock pace imposed by PNG capture.

## Apparent transparency

The six extracted marker sprites have binary alpha only (0 or 255). Opaque coverage is 76, 48, 20, 12, 20, 48 pixels; palette colors also darken at the smallest state. Thus apparent fading is supported as changing coverage and luminosity, not a measured fractional alpha value.

The prior four SVG triangles occupied a constant 110 logical square pixels. The candidate triangle areas follow source coverage, averaging 37.33 square pixels, approximately 66% less than that prior silhouette. Source geometry occupies 14–18-pixel bounding boxes; the atlas uses a centered 18-pixel cell instead of the former 26-pixel asset. Smooth triangular shapes preserve source centroids, coverage and mean palette colors, with approximate gradients. No arbitrary global transparency factor is applied. Exact raster texture and white sparkle pixels remain approximated.

## Integration contract

Private candidate: `D:/SystemlessBuild/diagnostics/2026-11-07-clockwerx-goal/refined/assets`.

The goal SVG is one 108×18 sheet. Manifest goal geometry is x/y −9, width/height 18. Its `animation` contains `type: atlas`, `frameWidth: 18`, `frameHeight: 18`, `frameCount: 6`, `frameOrder: [0,1,2,3,4,5]` and the frame duration above. Select `frameOrder[floor(game.time / frameSeconds) % frameCount]`; draw that 18×18 source rectangle at the goal pivot plus the manifest offset. Apply no additional rotation. Draw the unchanged sphere on top. Root owns app changes, packaging and browser review.

## Evidence and checks

The private evidence root is `D:/SystemlessBuild/diagnostics/2026-11-07-clockwerx-goal`. It contains decoded contacts, source-state measurements, sparse alias candidates, both original dense references, per-frame classifications, six-cell shape specifications, regeneration scripts, and `source-vs-candidate.png`. The latter isolates marker differences using the same original sphere in both rows; it is an offline geometric preview, not a browser rendering assertion. The actual SVG still needs root's browser inspection.

All 16 payload assets match manifest hashes and byte counts. Fifteen non-goal payloads match the prior asset set exactly. The six source/candidate states were visually inspected; both dense crops were classified against the extracted source markers. Final hashes, evidence paths, capture summaries, limits and regeneration commands are in `astra-review.json`. Raw artwork, profiles and detailed references remain private on D.

Approximately 17 active minutes were spent on bounded discovery, reconstruction, and dense-reference analysis. Another 5–10 minutes should cover root renderer integration and appearance review; no new performance captures are warranted for this cosmetic change. No gameplay, sound, saves or physical-controller claim is added. Worker workload is released.
