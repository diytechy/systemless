# Movement bonus increment — coordinator review

2026-11-08, `SVG-Port`. The local pilot now displays all ten Movement bonus rings and uses resource permissions for color. A player grab changes a ring into its same-color ordinary sphere. Initial attachment, bounce and tutorial demonstration grabs preserve bonuses. Restart restores them. The original scoring system is still omitted.

The bug combined two assumptions: bonus classification incorrectly depended on `0x4000`, and ordinary spheres/occupancy were used to choose dot artwork. The source has independent presence, bonus and goal bits. `0x4000` belongs to a separate initial-state path. Astra's [source and artwork review](bonus-astra-review.md) supplies the offsets, sprite choices and limits. The coordinator reviewed that report before integration.

## Evidence and acceptance boundary

- Fresh original gameplay on isolated loopback origin 8092 showed the labelled ring becoming an ordinary sphere, a 1,000-point award, and subsequent Spikes total score 2,000. Before/after source-sprite comparison gave mean absolute channel error below 0.57 for the correct form versus above 53 for the wrong form. This qualifies the form transition and first observed award, not the whole scoring/reset system.
- The current SVG page was inspected at native logical size. All ten initial ring choices, static red/green/blue permissions and the two gray rings beside the blue pivot are represented. A restart screenshot preserves the ring artwork. Dot anchors use the independently matched original offset (−5,−4). Ring shading is reconstructed; generic ellipse shadows remain a fidelity difference.
- A coordinator check using the actual private map and current engine held swing at fixed 120 Hz. It collected `(9,3)` exactly once at simulation second 36.025, selected `normal:0`, reached the goal at 43.608333 seconds, and verified restart restored every initial render specification. This is a deterministic engine check, not an original gameplay trace or browser benchmark.
- The visible browser pickup attempt did **not** reach the bonus. Its 20.474-second export advanced only 5.383 simulation seconds and dropped 15.120 seconds of catch-up time. Although the old exporter labelled it valid based on focus, coordinator review **rejects it for pickup and performance acceptance**. Browser pickup/revisit remains unqualified; source reasoning and engine tests support this increment.
- Four bonus behavior tests and three dot-state/color tests pass. Existing engine, rendering and sparkle checks also pass (14 Node test entries total). Eight packager tests and eleven inventory/decoder tests pass. No Rust build was needed.

The candidate has 20 payload assets; thirteen original payloads remain byte-identical. The changes replace four ring SVGs and add three same-color ordinary spheres. Mixed-color art is not qualified and missing keys fail explicitly. Original backdrop, sound, hands, goal shimmer and starbursts retain their bytes.

## Preservation and activation

Activation replaced only the owned `clockwerx-html5` route. Its previous directory is retained intact. Shared library index, metadata, profiler and WASM hashes remained unchanged. The save key and game identities are unchanged; the native reference used a separate test origin and did not read the production origin's browser saves. No original media was written, and no assets were added to Git or uploaded.

Live route: `http://localhost:8087/clockwerx-html5/`. Seven source files, 20 payloads and manifest total **132,615 bytes**, excluding ownership marker. This increment has not been benchmarked against the older frozen bitmap/SVG runs.

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/bonus/`. Key files: `native-collection-review.json`, `native-after-uninstrumented-hold.png`, seven `native-swing-*.json` motion records, `coordinator-integration-check.json`, `pilot-initial-rings.png`, `pilot-restart-rings.png`, rejected `pilot-collection-check.json`, and `activation.json`. Raw maps, frames, artwork and source analysis remain private.

## Next level

Continue with catalog ordinal 2, Spikes (resource 221). Structural decoding is complete; collision, enemy contact, death/restart and native visual qualification remain separate requirements. This increment does not complete the requested remaining-level review.
