# ClockWerx Movement HTML5 pilot

Buildless Canvas2D reimplementation of one owned ClockWerx1.0 tutorial board, with an SVG foreground. This is a playable rules reconstruction, not an emulator or an automatic binary conversion. Private artwork/map/audio are deliberately absent from this directory and Git.

## Prepare locally

Requirements: Python with `machfs` and Pillow; ImageMagick `magick` on PATH. Run:

```powershell
python prototypes/clockwerx-html5/extract_assets.py <copied-clockwerx.img> <private-output>/bitmap-assets
python prototypes/clockwerx-html5/vectorize_assets.py <private-output>/bitmap-assets <private-output>/svg-assets
```

The extractor checks the known copied fixture SHA256 before reading its HFS resource/data forks. It decodes the original SUPT RLE bitmaps and shared1bit masks,64direction frame descriptors, Movement RND2 resource151 and original sampled sound resources; ImageMagick converts the original PICT401 backdrop. It writes only into the supplied private output. Generated files must stay outside Git. Source media is never written.

The vectorizer verifies the extracted input hashes and writes a separate asset set. It traces/simplifies each canonical zero-angle hand, preserving transparent holes; gradients reconstruct shading. Dots use analytic circles/gradients. One SVG per hand replaces all64 bitmap directions. The background and three WAV effects retain their exact bytes. Outlines/shading are deliberate approximations, visible at large scale. Neither SVGs nor original PNGs belong inGit.

Serve `index.html`, `app.mjs`, `engine.mjs`, `board.mjs`, `rendering.mjs` and the private `svg-assets` directory renamed to `assets/` under a separate local route. Missing assets produce a visible error. Root's library packager owns the final private route. No dependency installation or Rust build is needed for the prototype itself. No hosting/upload/deployment is authorized.

## Controls and scope

Hold Space swing, Z bounce, X flip; tap C reverse; P pause. Held swing+bounce is also flip, explicitly documented by original TEXT3006/3008. Click the board for keyboard focus. Onscreen hold buttons are available. Standard gamepad: A/B/X/Y, Start pause; nonstandard mappings and unfocused/hidden input are ignored. Hardware is unqualified.

The player and three tutorial demonstrations use canonical SVG hands rotated around the original logical pivots. Render interpolation follows the120Hz simulation without blending across pivot transfers or reversals. Canvas backing follows display density; gameplay coordinates/collisions stay640x480/48pixels. The loader also supports an old bitmap manifest for private reference comparisons. A goal grab completes the board; restart resets it. Movement has no reconstructed enemies or invented failure. Original scores, campaign, menus, starburst sparkle particles, music and original save compatibility are omitted. Gold/black preference and a completion count use only `systemless.clockwerx-html5.pilot.v1`; audio starts off each visit. Original action WAVs are triggered at reconstructed action events; reverse and music are omitted.

Timing is approximate: observed experimental6MHz reference5.05547sec/revolution from32 ordinary rendered PNG samples with encoding overhead. Fixed120Hz simulation is independent of rAF. Collision uses logical48px dot spacing, independent of shorter original artwork. Fonts, dot shadows and completion overlay are reconstructed; the vector foreground is an enhanced reconstruction.

## Diagnostics

- Capture from restart resets scene, inputs and timing atomically for a matched idle capture. Capture20seconds uses the current scene. Raw rAF timestamp/delta, work, render, fixed-step-call/active-step counts, focus/visibility, game time and held actions are exported. Blur/hidden and PNG-export-during-capture invalidate the capture. rAF is not physical presentation FPS.
- JSON download includes the latest completed page-memory result without altering captured frame conditions. Memory requests are disallowed during capture; capture is disabled while a memory request is pending. Unsupported `measureUserAgentSpecificMemory` returns unavailable; no heap or physical RAM guess is substituted.
- PNG download exports the actual Canvas2D640x480 presentation.
- Recorded input demo holds swing for12simulation seconds. It is disclosed, deterministic pilot input, not an original gameplay trace.
- Startup boundary is module evaluation to required local asset decode/manifest parse; ResourceTiming load sizes are recorded. This is not browser process memory, network cold-start time or isolated emulation overhead.

## Focused checks

```powershell
node --test prototypes/clockwerx-html5/engine.test.mjs prototypes/clockwerx-html5/rendering.test.mjs
python -m unittest discover -s prototypes/clockwerx-html5 -p test_vectorize_assets.py
node --check prototypes/clockwerx-html5/app.mjs
python -m py_compile prototypes/clockwerx-html5/extract_assets.py
```

Detailed evidence and limits: `docs/iterations/2026-11-07-library-coordinator/clockwerx-html5/report.md`. Private generated maps/assets/reference frames remain under the dated diagnostics path recorded there.

SVG branch evidence and size/check limits: [SVG review](../../docs/iterations/2026-11-07-clockwerx-svg-port/report.md). The older nine-run comparison applies to the frozen bitmap pilot; it is not a benchmark of this SVG version.

Astra revised the hands using private upper-half Bezier profiles and exact longitudinal reflection. `reconstruct_assets.py` regenerates those profiles with source-hash, viewport and reach checks; art/profile data stays private. A separate optional `vectorAssets.goal` descriptor supplies the original goal's four triangular markers. Their shape/placement is screenshot-grounded; six-state shrink/color shimmer follows the original sprites, with cadence estimated from two dense original-game captures normalized to60guestticks/sec. The matched bitmap/literalSVG/Astra benchmark uses frozen pre-goal-correction assets: [foreground comparison](../../docs/iterations/2026-11-07-clockwerx-svg-benchmark/report.md).

Goal follow-up: [cadence, source opacity and tutorial text findings](../../docs/iterations/2026-11-07-clockwerx-goal/report.md). Atlas rendering changes presentation only. Original sprites use binary masks; their changing covered area and color create the apparent fade. Exact original-hardware cadence remains unqualified.

Terminology: “cursor stars” in earlier notes means the small white/light-blue starbursts visible near the hand/goal in original captures. Their input/cursor association has not been verified. These particles are separate from the implemented triangular goal shimmer. [Labelled evidence and saved snapshot](../../docs/iterations/2026-11-07-clockwerx-goal/evidence-archive.md).
