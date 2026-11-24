# ClockWerx HTML5 pilot

Buildless Canvas2D reimplementation of ClockWerx 1.0 with an SVG foreground. The 100-level campaign uses a private bundle of original maps, backdrops and effects. Those files stay outside this directory and Git.

## Prepare locally

Requirements: Python with `machfs` and Pillow; ImageMagick `magick` on PATH. Run:

```powershell
python prototypes/clockwerx-html5/extract_assets.py <copied-clockwerx.img> <private-output>/bitmap-assets
python prototypes/clockwerx-html5/vectorize_assets.py <private-output>/bitmap-assets <private-output>/svg-assets
```

The extractor checks the known copied fixture SHA256 before reading its HFS resource/data forks. It decodes the original SUPT RLE bitmaps and shared1bit masks,64direction frame descriptors, Movement RND2 resource151 and original sampled sound resources; ImageMagick converts the original PICT401 backdrop. It writes only into the supplied private output. Generated files must stay outside Git. Source media is never written.

The vectorizer verifies the extracted input hashes and writes a separate asset set. It traces/simplifies each canonical zero-angle hand, preserving transparent holes; gradients reconstruct shading. Dots use analytic circles/gradients. One SVG per hand replaces all64 bitmap directions. The background and three WAV effects retain their exact bytes. Outlines/shading are deliberate approximations, visible at large scale. Neither SVGs nor original PNGs belong inGit.

Use `scripts/package_clockwerx_pilot.py` to serve the runtime files enumerated in its `CODE` list and the verified private assets. The local route has no dependency install or Rust build requirement. Missing assets produce a visible error. Private assets must remain outside Git; hosting/upload/deployment is not authorized.

## Game and evaluation modes

The default route and `?mode=game` open a viewport-filling game with a 4:3 board and four save slots. Mouse, touch and keyboard use a two-by-two slot grid. Connecting a standard gamepad changes it to a clock face. Use the left stick or D-pad to select a slot, R1/R2 to cycle, Cross/A to play, Square/X for levels, Triangle/Y to change the hand, Circle/B for sound or Options/Start to confirm a reset. `?level=NN` starts that level in the active slot.

**Level Select** groups the campaign into ten chapters. Use arrows, the left stick or D-pad to move across tiles, Page Up/Page Down or Square/X and Triangle/Y to change chapters, Enter or Cross/A to play, and Escape, Circle/B or Options/Start to go back. Move up from the top row to reach **All 100 Levels (Free Play)** with a controller. With Free Play off, Level Select unlocks through one level past the highest clear.

Hold Space, D or Left Mouse to swing; Z to bounce off a dot; Left Shift, X or Left+Right Mouse together to flip; tap W, C or Right Mouse (released without Left Mouse) to reverse. On a controller, hold Cross/A to swing, Circle/B to reverse, Square/X to flip or Triangle/Y to bounce. Press R1/RB to pause, R2/RT to restart or Options/Start to open Level Select. Open the pause plaque with R1, P, Esc or the onscreen **Menu** button. After a clear, browse the completion plaque with the left stick or D-pad and select with Cross/A (or press Enter / R on keyboard). On widescreen desktop displays with wide side borders, a live Controls panel in the right border tracks the active input family (PlayStation, Xbox or Keyboard & Mouse) and summarizes active level mechanics. Controller input requires a focused, visible page and a standard mapping. PS/Guide, L1, L2 and Share/Back are reserved for SpectreLaunch.

Touch Play starts on touch-first devices or with `?layout=play`. The gesture legend sits beside or below the 4:3 board. Tap to reverse, hold one finger to swing, hold two fingers to flip, or slide and hold to bounce. A hold commits after 150 ms. The board and legend act as a shared gesture surface.

Saves stay on the current browser origin under `systemless.clockwerx-html5.slots.v1`. **Export Saves** downloads all four slots. The first game visit copies any pilot progress into Slot I. Legacy clears carry over with no recorded best score. Each level adds its bonus points and 1,000 for completion. The campaign total sums the best clear per level. Replay adds only the increase over the saved best. Sound defaults on and unlocks on browser user activation. Toggle it in the title or pause menu.

Use `?mode=eval` or `?layout=page` for the developer evaluation page, including the original controller level picker, touch-view controls, diagnostics and scope notes. Evaluation uses its separate `systemless.clockwerx-html5.pilot.v1` progress and starts with sound off. **Scope and persistence** can export either save format. The loader also supports older single-board bitmap bundles.

Render interpolation follows the 120 Hz simulation without blending across pivot transfers or reversals. Canvas backing follows display density while gameplay stays on a 640×480 logical board with 48-pixel dot spacing. Tutorial timing follows an approximate observed 6 MHz reference. The fonts, plaques and vector foreground are reconstructions.

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

Terminology: “cursor stars” in earlier notes means the small white/light-blue starbursts visible near the hand/goal in original captures. Source investigation now establishes initial player/goal attention marquees, independent of mouse movement, that stop spawning after the first accepted player action. These particles are separate from the triangular goal shimmer. [Labelled evidence and saved snapshot](../../docs/iterations/2026-11-07-clockwerx-goal/evidence-archive.md).

Starburst update: original gameplay creates deterministic flourishes around the player pivot and goal dots. The private manifest supplies an11frame SVG atlas, source-derived ring offsets and cadence. `sparkles.mjs` handles overlapping lifetimes and anchors at birth; initial player/goal directions stay fixed. Existing particles finish after the first successful player swing/flip/bounce or accepted reverse; unsuccessful held actions keep the attention cues. Restart re-enables them, and pause follows simulation state. These are the effects formerly loosely labelled “cursor stars”; this gameplay path does not follow mouse movement. Source/trace evidence and remaining appearance/timing limits are recorded in [the starburst review](../../docs/iterations/2026-11-08-clockwerx-starbursts/report.md).

Bonus update: all ten Movement bonuses use ring artwork, including the colored tutorial rings. Presence, bonus and goal are independent cell flags; dot color comes from resource permissions, independently of occupancy. A player grab consumes a ring once and displays its same-color ordinary sphere. Initial occupancy, bouncing and tutorial demonstrations preserve it; restart restores it. A private `vectorAssets.dotVariants` map supplies source-qualified art and anchors. Unsupported color variants fail explicitly. Scoring and original ring-shaped shadows remain outside this increment. [Level and bonus evidence](../../docs/iterations/2026-11-08-clockwerx-levels/bonus-review.md).

Spikes update: a private multi-scene manifest enables a Level picker with Movement as default. `level.mjs` adapts decoded rounds and rejects unsupported requirements. `hazards.mjs`/`round.mjs` use private scanline collision outlines, distinct gold/black profiles and source-derived spike clocks. `death.mjs` handles fifteen staggered explosion particles; single-player death freezes play then resets actors, bonuses and flourishes. `replay.mjs` supplies bounded input-only route checks. Exact original callback timing, scoring, reveal pacing and full campaign support remain omitted or unqualified. Use `scripts/package_clockwerx_pilot.py` to copy all twelve required runtime files and verified assets. [Coordinator evidence](../../docs/iterations/2026-11-08-clockwerx-levels/spikes-review.md), [catalog inventory](../../docs/iterations/2026-11-08-clockwerx-levels/catalog-inventory.md), and [behavior/generation requirements](../../docs/iterations/2026-11-08-clockwerx-levels/requirements.md).

Walls update: source specs compile into merged tiles with original collision spans, independently gated actor permissions and Child-mode activation. Static SVG walls are cached at backing resolution. Wall/door trapping is counted on source-class steps; automatic bounces preserve attention flourishes and suppress queued reverse. A phase regression prevents smooth reflection from spuriously repeating an identical source pose. The corresponding original/browser goal route and 38 model clock-start phases pass. Current packager copies thirteen runtime files, including `walls.mjs`; `programs.mjs` is a tested source-language helper, while referenced-program execution remains gated. [Walls evidence and limits](../../docs/iterations/2026-11-08-clockwerx-levels/walls-review.md).

Late-level families (97-100): `moving-fuse-ordinary.mjs` (March97, source-only qualified earlier); an explicit `allowStaticGunRailHazards` extension of `static-gun-rails.mjs` adds unconditional SP spikes, WL walls and GN/TR of any colour/placement/direction (Slaughter98); `gun-trigger-oil.mjs` admits GN/TR with sleeping Oil kinds 0/2, rings, walls, spikes and class 1/3/4 b/f/n/s actors, with ring main-sprite Oil collision (Crossfire99); an explicit `allowStaticBombElevators` variant of `moving-programmed-busters.mjs` admits no movers/busters, initially lowered channel-0 TYPE2 dots, EL subcells 1-3, on-board GO with ignored out-of-range frame requests, inactive PU and class 1/3 actors (Break In100). Each is default-off; earlier families are unchanged (retained-route sweep matched all 96 earlier scenes exactly). These four levels are functionally ported, not original-compared. The player hand colour is now a live round preference (`setPlayerGroup`), so frozen source declarations stay valid with the black hand.

Serve the pilot with JavaScript MIME types for `.mjs` (Python 3.8 `http.server` serves them as `application/octet-stream`, which browsers refuse for module scripts).
