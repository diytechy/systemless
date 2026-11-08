# Some Dots post-reset hero review

The returned native hero is at the previously reached saved waypoint and rotates in **direction -1**. Twenty independently fitted captures support this; five starburst-corrupted captures were rejected. This does not infer an unseen reset-time frame or accept the level.

The analysis uses after-approach-08 through 32 from the existing closed native-checkpoint-01 run. Every screenshot was searched globally across all present source pivots and all 64 group-700 poses, using original RGBA art, gamma 0.7 and the qualified anchors. No waypoint constraint or predicted reset phase restricted the fitting.

All twenty accepted poses match the saved waypoint reached earlier in the input route, and differ from the original level start. Accepted channel MAE is 0.219–0.753. The acceptance gate requires MAE below 2 and next-candidate gap above 10. Captures 10, 15, 20, 25 and 30 fail the MAE threshold and are excluded from the conclusion. Capture 10 was visually checked and shows an attention starburst crossing the hero.

| Accepted capture | Guest tick | Source frame |
|---|---:|---:|
| after-approach-08 | 5577 | 41 |
| after-approach-09 | 5607 | 34 |
| after-approach-11 | 5667 | 22 |
| after-approach-12 | 5697 | 15 |
| after-approach-13 | 5727 | 9 |
| after-approach-14 | 5757 | 3 |
| after-approach-16 | 5817 | 54 |
| after-approach-17 | 5847 | 48 |
| after-approach-18 | 5877 | 41 |
| after-approach-19 | 5907 | 35 |
| after-approach-21 | 5967 | 22 |
| after-approach-22 | 5997 | 16 |
| after-approach-23 | 6027 | 10 |
| after-approach-24 | 6057 | 3 |
| after-approach-26 | 6117 | 55 |
| after-approach-27 | 6147 | 49 |
| after-approach-28 | 6177 | 42 |
| after-approach-29 | 6207 | 36 |
| after-approach-31 | 6267 | 23 |
| after-approach-32 | 6297 | 17 |

Successive accepted 30-guest-tick intervals decrease by six or seven source frames, with modulo-64 wrap. Gaps of 60 ticks across rejected captures decrease by twelve or thirteen. This yields 152 decreasing steps over 720 guest ticks, consistent with the independently qualified class-0 rate. It supports signed direction -1 without relying on the occluded poses.

The first accepted image is already fully revealed at guest tick 5577, frame 41. The reset boundary is not captured by this subset; no exact initial frame 48, spawn timestamp or source timer phase is claimed. Waypoint animation/reset state and the preceding death effect belong to the separate dot/reset analysis.

Private protection-review/fit-reset-hero.py and reset-hero-fits.json retain all rankings and exact positions. The companion public JSON lists accepted frames, rejected fits and interval checks without map coordinates. No runtime, asset, queue, native/emulator, browser, build or conversion change was made. Reports are UTF-8/LF; files and workload are released.
