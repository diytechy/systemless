# Walls playable increment — coordinator review

2026-11-08, SVG-Port. Movement, Spikes and Walls are selectable in the local pilot. Walls is a bounded Child-mode reconstruction, not exhaustive campaign or timing qualification. Next implementation target is Doors.

## Requirements and implementation

Resource 222 has 62 present dots, nine bonuses, one goal, twelve wall specifications, two spikes, six actor records, three unused WP programs and five text records. The wall specifications union into **51 tiles**. Keep the small joints and third-cell arm masks; twelve straight segments are not an equivalent geometry.

Child uses activeMask 1. The right-hand green/red/blue records have masks 14/12/8 and are never instantiated in this mode. After the separately hidden second human, the active scene contains the player and lower green enemy. Wall permission is a separate v12 byte; color and activation do not replace it.

Wall contact reverses direction. The fourth consecutive human wall/door contact is lethal. The guard runs on source-class clock changes rather than every 120-Hz update. Human wall/spike checks precede input/rotation; enabled enemy wall checks follow its motion. Human-enemy overlap remains a separate periodic pass. Continuous poses/input are still a disclosed approximation of the original callbacks. Queued reverse waits for an eligible step and is suppressed by wall contact. Automatic wall bounce alone preserves attention flourishes.

The SVG wall layer is cached at the current canvas backing size. Collision uses original group-800 scanlines, including genuinely absent outline pointers. Gold/black retain separate profiles. Static wall appearance is independent of the collision outline.

## Reviewed evidence

- Source bitmap composition matches native placement with zero offset: **14,496 opaque pixels**, mean absolute channel error **0.664**, all within two levels. This validates the tile union and descriptor x−6/y−5 placement.
- Astra found the first SVG beams too dark/blue. A separate silver candidate preserves all offsets/outlines and 26 non-wall payloads. Coordinator comparison of actual canvas PNGs against the same native mask improved mean channel error from **46.27 to 4.32**, median to 1. Remaining differences include antialiasing, shadow edges and reconstructed font metrics.
- Original native goal replay completed Walls with four bonus awards totaling **10,000**, Child completion **1,000**, total **11,000**. Independent source-sprite matching located the player at **all fourteen intended transfer pivots**. Matching uses every source hand pose at every present dot; effects can occlude some pixels, so this is location evidence rather than pixel parity.
- Native held-input run: 1,730 frontend / 2,328 guest ticks. Goal run: 3,249 frontend / 3,847 guest ticks. Both have zero budget exhaustion and zero assertions; screenshots and the actual completion screen were separately reviewed. These are deterministic behavior checks, not real-time benchmarks.
- Browser input-only replay reaches the same goal with four pickups and no death/reset. Its observed simulation time is **33.925 seconds**. The widened route also passes **38/38 tested shared-clock start phases** in the current model, retaining all fourteen intended pivots.
- Those phase checks exposed a false trapping case: reversing a smooth angle near a quantized frame edge could test the identical collision pose again. Centering interpolation within that same source frame fixes the repeat without changing pivot, outline or adding a source step. A synthetic regression preserves the real fourth-contact guard.
- Current focused validation: **60 Node entries**, ten packaging tests and actual-map completion regressions for all three scenes pass. No Rust build or new resource benchmark.

Native forced trapping, exact cross-layer callback timing, higher difficulty, wall shattering, door interactions, wall sounds, scoring/persistence and physical controllers remain unqualified or omitted. The actual original goal route and bounded model checks establish this increment's playability; they do not prove every possible action sequence.

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/walls/`. Key files: `native-placement-review.json`, `browser-wall-color-review.json`, `native-route-review.json`, both native run folders, `checked-route.json`, retained `phase25-wall-diagnostic.json`, `pilot-goal-state.json`, `pilot-goal.png`, `three-scene-regression.json`, and `activation.json`.

Activated route: `http://localhost:8087/clockwerx-html5/`. Thirteen source files, 43 payloads and manifest total **505,724 bytes**, excluding ownership marker. Previous live route retained. Shared index/metadata/profiler/WASM hashes unchanged; original media and browser save identities preserved. No push, upload or public deployment. Earlier frozen Movement resource benchmarks do not measure this version.

Generation constraints: union overlapping wall specs, honor the eighteen-spec source capacity, preserve small joints and actor permissions, model wall/door contact history and eligible input timing, and validate safe intermediate rotations. The checked route illustrates route-first construction followed by simulation and an independent original replay; a general generator is not implemented.

Source contracts: [wall review](walls-astra-review.md), [callback and activation supplement](walls-callback-order.md), [visual review](walls-visual-review.md). Broader [requirements](requirements.md) and [catalog inventory](catalog-inventory.md) remain explicit about decoded versus playable coverage.
