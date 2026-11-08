# Spikes saved-canvas visual review — 2026-11-08

The current saved Spikes canvas preserves the visible level arrangement and distinct enemy types. It is not yet a visual-parity acceptance: spike tips are too faint, the explanatory text sits3pixels above the native sample, and death rendering has not been compared at matched particle frames. A separate spike-ray correction candidate is ready for coordinator review. No browser/emulator/build or activation ran.

## Comparison boundary

Inputs are the coordinator's `spikes/pilot-initial.png`, `native-spikes-initial.png`, native-play-01/swing-11.png, the original four spike phases, and death/death-preview.png. The1280×960 native initial image was normalized to640×480 by nearest-neighbor downsampling in a new private visual-review directory. The native-play-01 images instead contain an800×600 host canvas with the640×480 game at offset(80,60). Do not compare those unadjusted host coordinates with logical game coordinates.

These are different runtime instants, with different hand angles, effect phases and score state. Apparent hand directions, individual sparkle locations, and HUD numbers are not frame-synchronized acceptance evidence. The menu overlay/top crop also differs. Source descriptor placement and smooth SVG appearance are separate checks.

The coordinator's `native-anchor-review-v2.json` was summarized independently: **319results,319predicted offsets(0,0), all four source spike phases**. Enemy-overlap error outliers remain expected. This strongly supports the existing x−8/y−7 SP descriptor placement, not a pixel-equivalence claim for the replacement SVG shapes.

## Current canvas findings

| Area | Original versus enhanced finding | Disposition |
|---|---|---|
| Spike rays | Native/source phases have legible diagonal silver/white terminal tips. Pilot tips are much less visible at native size and often merge into the red core. The pilot reads more like a red bead. | Concrete art correction recommended; separate candidate supplied. |
| Red spike core | Pilot is smoothly shaded and more spherical; native is a dark-edged, irregular rounded red core with a compact bright highlight. Existing pilot core is slightly pale/soft at this scale. | Candidate deepens the rim and strengthens the core while preserving smooth shading. |
| Spike shadow | Both have an offset dark green-gray shadow and short diagonal extensions. Pilot shadow is a regular smooth oval; native is irregular and stepped. Position is consistent with the accepted source anchors. | Acceptable enhancement difference for review; no shadow-position correction made. |
| Green/blue enemies | Both captures show separate green and blue variants on the expected adjacent pivots. Green has a green rounded pivot/tapered blade; blue is cyan/blue with a distinct blade. Neither appears accidentally substituted with the player's yellow or the other enemy's asset. | Bounded saved-canvas pass for distinct variants. Exact phase/collision pose comparison is not available here. |
| Bonus/goal inventory | Eight visibly marked bonus dots and one goal occupy the corresponding grid positions; eleven spikes and the two visible enemies occupy the expected arrangement. Goal attention stars and the Goal Dot label are present. | Bounded inventory/layout pass. The source's51present dots are independently known from decoding; this review is not a per-pixel audit of every dot under overlapping art. |
| Explanatory text | Three tested lines begin at essentially matching X, but pilot white ink begins3pixels too high. Two lines are slightly narrower with different glyph metrics. | Recommend TX Y+3 for this saved comparison; font fidelity remains approximate. |
| HUD | Pilot labels and current score state differ from the native reference. | Review-scene UI/state difference; no source-score fidelity claim. |

White-ink bounding boxes use only pixels whose minimum RGB channel exceeds230 inside isolated explanatory-text regions. Bounds are exclusive at right/bottom:

| Text | Native bounds | Pilot bounds |
|---|---|---|
| Look out… | (249,69)–(381,78) | (249,66)–(380,75) |
| Avoid enemy… | (356,191)–(486,203) | (357,188)–(480,197) |
| Spikes do not… | (357,235)–(516,247) | (357,232)–(509,243) |

The common−3Y is concrete evidence. Width differences of1,7,7pixels and differing glyph heights mean a vertical move alone does not establish font parity. The goal label is partly overlapped by attention effects, so no equivalent clean white-ink bound is asserted for it.

## Separate spike candidate

Private directory: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/spikes/visual-review/ray-candidate/`.

It extends the25-payload death candidate, replacing only spike-0.svg through spike-3.svg. **All21non-spike payloads, including death.svg, remain byte-identical.** The four frame records, source IDs, dimensions, offsets and source collision profile remain unchanged. This is not activated and does not modify root QA images or released helpers.

The new smooth needle polygons have wider silver bases and explicit white terminal facets, varying by source phase. The core uses a dark red rim and radius3.4; its continuous center moves by(+0.5,+0.5) inside the same sprite bounds to align with source pixel-center geometry. The shadow center/shape remain unchanged. The replacement retains the four-phase visual distinction and increases tip legibility without changing collision behavior. The high-resolution SVG render and a separate18×18render enlarged with nearest-neighbor sampling were both inspected locally. The latter confirms the tips survive rasterization at native size; it is not a browser-canvas render or a phase-matched native difference image.

Manifest SHA256: `faf65552392aa99f6e33cef293dd933cc8d69795f3d80d7c77801c36799f5072`. `ray-profile.json` records the exact changed/preserved payload lists and collision-profile reference. Root may integrate this candidate for a fresh canvas review; this report does not authorize or imply Spikes activation.

## Death appearance

The inspected native swing-11 capture shows several overlapping orange/red/yellow explosions arranged along the dying hand. The private ten-frame atlas reproduces the source progression: bright initial spark, growing flames, red breakup, brown smoke and sparse final embers. It uses smooth color regions and curves, while native flames have strong dark outlines, pixel-scale texture and small jagged embers. The candidate is visibly flatter and more banded in its highlights; the late smoke/ember shapes are simplified.

This is a reasonable source-informed smooth candidate, with clear remaining differences. A single atlas preview cannot qualify the runtime15-particle composite, placement, start distribution, hero hiding, barrier timing or round reveal. Those require the coordinator's actual death/restart comparison. No particle geometry/timing change is proposed from this unsynchronized visual sample. The corrected single-player freeze→DE barrier→ROReset→renewed player/goal stars ordering remains as documented in death-astra-review.md.

## Delivery and limitations

Private evidence includes normalized native screenshot, enlarged spike crops, text-ink bounds, separate SVG candidate, high-resolution and native-size candidate contacts. Companion JSON records input/output hashes. No release helper, root QA image, active asset directory, save, media, native workload, browser, build, benchmark or commit was changed. Visual review and candidate workload are complete and released.
