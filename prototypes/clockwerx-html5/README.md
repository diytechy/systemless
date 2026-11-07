# ClockWerx Movement HTML5 pilot

Buildless Canvas2D reimplementation of one owned ClockWerx1.0 tutorial board. This is a playable rules reconstruction, not an emulator or an automatic binary conversion. Private artwork/map/audio are deliberately absent from this directory and Git.

## Prepare locally

Requirements: Python with `machfs` and Pillow; ImageMagick `magick` on PATH. Run:

```powershell
python prototypes/clockwerx-html5/extract_assets.py <copied-clockwerx.img> <private-output>/assets
```

The extractor checks the known copied fixture SHA256 before reading its HFS resource/data forks. It decodes the original SUPT RLE bitmaps and shared1bit masks,64direction frame descriptors, Movement RND2 resource151 and original sampled sound resources; ImageMagick converts the original PICT401 backdrop. It writes only into the supplied private output. Generated files must stay outside Git. Source media is never written.

Serve `index.html`, `app.mjs`, `engine.mjs`, `board.mjs` and that private `assets/` folder under a separate local route. Missing assets produce a visible error. Root's library packager owns the final private route. No dependency installation or Rust build is needed for the prototype itself. No hosting/upload/deployment is authorized.

## Controls and scope

Hold Space swing, Z bounce, X flip; tap C reverse; P pause. Held swing+bounce is also flip, explicitly documented by original TEXT3006/3008. Click the board for keyboard focus. Onscreen hold buttons are available. Standard gamepad: A/B/X/Y, Start pause; nonstandard mappings and unfocused/hidden input are ignored. Hardware is unqualified.

The player and three tutorial demonstrations use original direction frames. A goal grab completes the board; restart resets it. Movement has no reconstructed enemies or invented failure. Original scores, campaign, menus, cursor-star animation, music and original save compatibility are omitted. Gold/black preference and a completion count use only `systemless.clockwerx-html5.pilot.v1`; audio starts off each visit. Original action WAVs are triggered at reconstructed action events; reverse and music are omitted.

Timing is approximate: observed experimental6MHz reference5.05547sec/revolution from32 ordinary rendered PNG samples with encoding overhead. Fixed120Hz simulation is independent of rAF. Collision uses logical48px dot spacing, independent of shorter original artwork. Fonts, dot shadows and completion overlay are reconstructed; no enhanced art is used.

## Diagnostics

- Capture20seconds uses the current scene. Restart and provide no input for the idle comparison. Raw rAF timestamp/delta, work, render, fixed-step-call/active-step counts, focus/visibility, game time and held actions are exported. Blur/hidden and PNG-export-during-capture invalidate the capture. rAF is not physical presentation FPS.
- JSON download includes the latest completed page-memory result without altering captured frame conditions. Memory requests are disallowed during capture; capture is disabled while a memory request is pending. Unsupported `measureUserAgentSpecificMemory` returns unavailable; no heap or physical RAM guess is substituted.
- PNG download exports the actual Canvas2D640x480 presentation.
- Recorded input demo holds swing for12simulation seconds. It is disclosed, deterministic pilot input, not an original gameplay trace.
- Startup boundary is module evaluation to required local asset decode/manifest parse; ResourceTiming load sizes are recorded. This is not browser process memory, network cold-start time or isolated emulation overhead.

## Focused checks

```powershell
node --test prototypes/clockwerx-html5/engine.test.mjs
node --check prototypes/clockwerx-html5/app.mjs
python -m py_compile prototypes/clockwerx-html5/extract_assets.py
```

Detailed evidence and limits: `docs/iterations/2026-11-07-library-coordinator/clockwerx-html5/report.md`. Private generated maps/assets/reference frames remain under the dated diagnostics path recorded there.
