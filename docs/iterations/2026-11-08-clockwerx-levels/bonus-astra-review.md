# Movement bonus dots: source and candidate review

2026-11-08. Focused source/art task on `SVG-Port`; no browser, native execution, build, benchmark, commit or deployment performed by this worker. Used the mac-game-modernization skill and HTML5 pilot reference. Coordinator owns integration and native-size acceptance.

## Confirmed correction

The packed cell word is a set of independent flags. Bit 0 means present, bit 1 means bonus, bit 2 means goal. Every present Movement cell with bit 1 set is a bonus, including cells whose word is `3`, not only `0x4003`. There are ten initial bonus dots: three gray, three red, three green, and one blue. The original tutorial label points to the gray ring at cell (9,3). Two additional gray rings flank the blue demonstration pivot on the bottom row.

`0x4000` is not a bonus discriminator. It populates DOSpec byte +15, used by the up/down initialization path to select its initially lowered/inactive state. The up/down mechanism has separate activation bits; the flag alone does not make Movement dots disappear. This identifies the source use, not complete qualification of up/down gameplay.

Color belongs to the cell's second word, independently of occupancy. In color mode 0, bits `0x10`, `0x100`, and `0x1000` contribute red=1, green=2, and blue=4. The blue tutorial pivot alone contains the blue permission bits; its neighbors are gray because their resource flags are gray, not because they are unoccupied. The red/green rows contain both rings and ordinary spheres. Coloring every dot in a row with one sphere is incorrect.

| Form | Group 300 descriptor | Source image |
| --- | --- | --- |
| Gray bonus ring | 301 | 1 |
| Red bonus ring | 302 | 2 |
| Green bonus ring | 303 | 3 |
| Blue bonus ring | 305 | 5 |
| Gray ordinary sphere | 309 | 0 (shared with descriptor 300) |
| Red ordinary sphere | 310 | 9 |
| Green ordinary sphere | 311 | 10 |
| Blue ordinary sphere | 313 | 12 |

## Source evidence

Private CODE 6 symbols and offsets: `DOCreateAll` starts at 0x393e; presence at 0x3984, bonus at 0x3a4a, goal at 0x3a5a, initial up/down flag at 0x3abe. `DOSpec2Info` copies the bonus into live byte +0x13 and look bit 0x800. `DOGetColorOffset` at 0x2c08 and `DOGetLook` at 0x2c54 select descriptor offset 1+color for a bonus, 9+color for an ordinary dot in the colored display branch. The alternate display mode has separate icon choices and is not implemented here.

`DOInitialGrabbed` at 0x458a temporarily clears the live bonus while attaching the initial hand, then restores it. Initial occupancy therefore does not collect a bonus. `DOGrabbed` at 0x45fa branches at 0x476c before awarding a bonus: tutorial demonstration actors do not consume their rings. A qualifying grab calls `DOGaveBonus` and `DOUnbonus`; the latter clears the bonus flag and regenerates the appearance. Collection therefore changes a ring to the same-color ordinary sphere and can occur only once until a level reset or other explicit bonus-restoring mechanic. Bounce does not perform a grab. Coordinator still needs a fresh native player collection check.

The source scoring routine `SCBonusDot` (CODE 7, 0x6f12) returns the current award, increments the next award by 1000, and caps it at 5000. Reset starts it at 1000. This does not justify adding partial scoring now: the pilot remains no-scoring, and broader score/reset/multiplayer rules remain outside this task.

## Candidate and visual evidence

Private candidate: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/bonus/assets`. It retains the accepted hands, goal, starbursts, backdrop, sounds, and existing dot 0/4; replaces dot 1/2/3/5 with smooth shaded ring SVGs; and adds ordinary red/green/blue dot 9/10/12. There are 20 payload files plus manifest. Existing dot 4 is unused on Movement and remains unqualified. Mixed-color art is not supplied by this candidate.

The original group 300 images use 10×10 binary masks, palette `pltt 1000`, and bright upper-left/lower-right ridges around a dark center for bonus forms. The SVG candidate uses smooth circles, an annulus, and gradients; it does not trace raster edge steps. Colors use source palette RGB high bytes transformed with exponent 0.7. This is a source-grounded analytic approximation, not a claim of pixel identity or final artistic approval.

Nine independent original-reference dot crops matched the corresponding original source sprites with per-channel MSE 0.273–0.451 after gamma correction, including gray/red/green/blue rings and red/green ordinary spheres. This strongly corroborates the selected original assets and palette. It does not measure SVG similarity. At the reference's 640×480 logical scale, matching tile origins are `(pivot.x-5, pivot.y-4)`; candidate manifest anchors preserve that measured placement. The old centered renderer places them one logical pixel higher.

Private review outputs: `source-candidate-dot-review.png` (original gamma-corrected sprites above candidate forms, enlarged); `source-dot-strip.png` and `source-dot-strip-8x.png`; `native-source-matches.json`; `build-candidate.py` (regeneration). Native screenshot input is the prior starburst task's `original-reference.png`, 1280×960, nearest downsampled by two for matching. Source paths, SHA-256 hashes and changed-file inventory are in the accompanying JSON report. No original media was modified.

## Proposed integration contract

1. Use `decodeDot(cell)` for presence/bonus/goal rather than equality against low types. In Movement, `kind` can be goal first, then bonus, then ordinary. Preserve the packed bits separately for future mechanics.
2. Preserve player-only collection and demo non-collection for this tutorial. On accepted player swing/flip onto any uncollected bonus, set `collected`, emit one bonus event, and retain its color. Reset restores all bonuses. Bounce and initial hand attachment leave rings intact.
3. Use `dotRenderSpec(dot)` to select `manifest.vectorAssets.dotVariants[spec.assetKey]`; load all unique `file` entries. Draw using each entry's explicit anchor and logical dimensions. Occupancy and hardcoded row groups must not choose artwork. Reject unsupported keys explicitly rather than substituting gray.
4. The manifest retains the old `dots` array for compatibility, but that six-image array is insufficient to distinguish the new ordinary red/green/blue forms. Native-size coordinator review must exercise the new map.
5. Ring shadows also have ring-like original forms. The existing generic ellipse shadow is a separate known fidelity gap; no shadow asset or shadow behavior change is claimed here.

Added only generic `dots.mjs` and `dots.test.mjs` to public source; no private paths/art/level tables inside those modules. `node --test prototypes/clockwerx-html5/dots.test.mjs` passes 3 tests covering independent flags, permission colors/modes, collection state and occupancy independence. No engine/board/app edits were made by this worker.

Coordinator acceptance remains: original-size current/fixed visual comparison, fresh native player collection and revisit, bounce preservation, restart restoration, and review of ring shading/shadows. This worker's completed result is the evidenced candidate and integration contract, not activation or full gameplay qualification.
