# Spikes playable increment — coordinator review

2026-11-08, SVG-Port. **Movement and Spikes are now selectable in the local HTML5 pilot.** This is a bounded two-level reconstruction. The full catalog has 100 levels; its inventory is complete, while runtime implementation continues with Walls next.

## Inventory and behavior

Spikes (catalog 2, RND2 221) contains 51 present dots, eight bonuses, one goal, eleven spikes, four actor records, two stored actor programs and four positioned text records. One human is active in single-player; the second human is hidden. Green and blue enemies rotate at fixed pivots. All actor program references are negative, so both stored programs are unused.

The decoded adapter reads source cells, phases, directions, subcell offsets and actors. It rejects unsupported mechanics, programs, activation states and missing artwork. Smooth SVG hands retain independent original collision outlines, including small gold/black profile differences. Spikes uses the original half-index-to-64-angle reset phase; Movement retains its earlier capture-relative phase.

Spikes use four phases and independently indexed subcell offsets. Their unscaled timer and one-advance-per-observed-clock-change gate are separate from smooth hand motion. Original scanline collision uses inclusive row spans, not SVG contours or display alpha. Same-pivot enemy contact has an additional angular gate. Spikes has no protected dots; later special behavior remains gated.

Normal **single-player death freezes play, waits for all fifteen explosion particles, then resets actors, bonuses and both attention flourishes**. Underlying unscaled clocks continue. The earlier worker interpretation of a hero-only respawn branch was retracted after source/native review, before activation. Total-score policy and reveal pacing are not implemented. No lives counter was invented.

## Coordinator evidence

| Check | Result and boundary |
|---|---|
| Original alignment | 319 crops across 29 native frames, all four phases: fitted offsets all (0,0) against descriptor x−8/y−7. Unoccluded gamma-corrected pixels typically have mean channel error about 0.43; enemy overlap explains large outliers. Placement evidence, not SVG identity. |
| Original death | Actual Command swing input captured overlap, explosion, hidden hero and restored spawn/flourishes. 1,730 frontend / 2,328 guest ticks, no budget exhaustion, zero assertions. Screenshots were reviewed; script completion alone was not treated as gameplay proof. |
| Original goal | Thirteen widened Control/Command input windows reached the same two bonuses and goal. Final screen: Spikes completed, bonus during level 3,000, Child completion bonus 1,000, total 4,000. 3,176 frontend / 3,774 guest ticks, no budget exhaustion, zero assertions. |
| Prototype engine | Input-only 120-Hz route reaches goal at simulation second 32.933333, collects (6,6) and (7,6), no death/reset. No state edits or collision bypass. |
| Prototype browser | Goal screenshot/export confirms those two pickups and no death/reset. Repeat through the Level picker also completed. Post-goal capture is state evidence, not a comparable gameplay performance benchmark. |
| Prototype death | Twelve-second input replay produced enemy death and one round reset. Actual SVG explosion composite inspected and saved. Fixed-step check agrees on cause/reset. RNG and exact native frame parity remain unqualified. |
| Visual review | Astra identified faint spike tips and text 3px high; stronger silver rays and text correction reviewed. Bonus/goal/spike counts and distinct green/blue hands agree. Enhanced flames have fewer fine embers and flatter color bands. |
| Checks | 44 Node entries and ten packaging tests pass. Decoder/catalog checks passed separately. No Rust build or new resource benchmark. |

Private evidence: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/spikes/`. Key files: `native-anchor-review-v2.json`, both native run folders/reports, `guided-route.json`, `pilot-goal.png`, `pilot-goal-state.json`, `pilot-replay-state.json`, `pilot-death-composite.png`, `activation.json`. Raw maps, art, original text, source analysis and scenarios remain private. Copied fixture hash is unchanged after both runs: `03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4`.

## Limits and preservation

Hand motion uses the source Child-speed average normalized to 60 Macintosh guest ticks/sec, continuous 120-Hz input/rotation and source-frame collision sampling. Original callbacks have distinct schedules; exact input/collision tick parity and original hardware timing are not claimed. Ordering is being refined for Walls. Original scoring, music, campaign saves, reveal transitions and physical controller qualification are omitted. Fonts and shadows are reconstructed. The route proves bounded playability and a corresponding original solution, not exhaustive action qualification or a generator.

Activated bundle: twelve source files, 26 verified payloads and manifest, **422,001 bytes** excluding ownership marker. Outline data and complex death atlas account for much of the growth. SVG does not guarantee every individual effect is smaller than a bitmap. Older bitmap/literal-SVG/Astra benchmarks concern frozen Movement versions; this increment has no new CPU/memory/smoothness comparison.

Only the owned local pilot route was replaced; prior directory retained intact. Shared index, metadata, profiler and WASM hashes are unchanged. Original media were read only. Native headless state and QA origin 8091 were isolated from original browser saves. Existing prototype preference key remains. Nothing pushed, uploaded or publicly deployed.

Local route: `http://localhost:8087/clockwerx-html5/`. Movement is default; choose Spikes in Level. Diagnostics offers optional input-only checked-route playback.

Source reviews: [Spikes](spikes-astra-review.md), [corrected followup](spikes-followup-review.md), [death](death-astra-review.md), [visual correction](spikes-visual-review.md). Next: Walls, resource 222; helpers/assets prepared, native qualification and integration pending.
