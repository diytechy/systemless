# Some Dots native protection and reversal review

The native captures exercise actual ordinary-hand contact while the hero is protected: **16 screenshots contain overlapping original hero/red collision outlines**, and the hero remains visibly alive and continues rotating afterward. All **18 transfer pivots match** the scripted expectations. The recorded key-49 interval also reverses the hero's rotation at the unchanged protected pivot. These are bounded native findings, not level acceptance.

The existing native-checkpoint-01 run completed at 5,699 frontend / 6,297 guest ticks, with zero exhausted-budget frames and zero scripted assertions. This read-only analysis used 67 captures: initial-after-reveal, eighteen transfer captures, forty-seven protected samples and protected-reverse. Source resource 11330 matches the queue hash. No native/emulator/browser/build/conversion workload was launched.

## Independent actor fitting

Hero group 700 and red group 500 were independently searched across every present source pivot and all 64 original descriptor poses. The fitter uses qualified per-axis anchors, descriptor reflections and gamma-0.7 source RGB. No expected actor position, model trajectory, frame or per-sample timing restricts that search.

The hero draws over the red hand. After a confident hero fit, its opaque source pixels are excluded from the red RGB score. They are **not** excluded from either original collision outline. Fits require channel MAE below 2, a next-candidate error gap above 10, at least 50% visible source pixels and at least 40 visible pixels. A candidate failing those gates would be rejected; none did.

| Actor | Accepted | Channel MAE | Minimum next-candidate gap | Minimum visible fraction |
|---|---:|---:|---:|---:|
| Hero | 67/67 | 0.219–0.627 | 41.49 | 100% |
| Red | 67/67 | 0.569–0.637 | 33.05 | 91.13% |

At least 112 red opaque pixels remain even in the most occluded captures, protected-sample-23 and 24. Thus the contact fits are not inferred from tiny fragments. Full ranked candidates, exact positions and collision pixels remain private. The final transfer-18 photo contains a clear hero pose and passes the same fit gates; it is not treated as a fitted death effect.

## Contact and survival

For every accepted pair, the original source scanline spans were translated to their fitted integer anchors, with vertical reflection and inclusive horizontal endpoints. A separate Node check using outlineCollision and enemyFrameGate agrees with all 67 Python comparisons, with zero discrepancies.

Source overlap occurs in protected-samples **15 through 29**, and again at **33**: sixteen sampled contacts, ranging from one to sixteen overlapping collision pixels. In every case the hands occupy different pivots, so the same-pivot angular gate does not block contact. The hero's pivot carries the active raw 0x40 protection property throughout.

The strongest poses are samples 20–22, with sixteen overlapping source collision pixels. Sample 33 independently shows a later three-pixel overlap at another pair of poses. Samples 20 and 33 were visually reviewed; the red and gold hands are both clearly present. These tests use original collision spans rather than enhanced SVG silhouettes or opaque-art overlap.

The hero remains a confidently fitted source hand at the same protected pivot in all forty-seven protected samples. Samples 34–47 show continued rotation after the sampled contacts, and subsequent transfers 15–18 move to the expected pivots. This is direct evidence of surviving a window that actually contains source-geometry contact, rather than an inference from merely waiting near an enemy.

Screenshots do not expose the precise WAHitEnemy return value or a live invulnerability field. Repeated screenshots can share a pose, so sixteen contact captures are not claimed as sixteen distinct callback hits. Sampling also leaves exact first-hit timing and additional unsampled contacts unknown. The result is limited to an ordinary red hand; it does not qualify protection against spikes, bullets, rotating spikes or busters.

The root's deliberately disabled-protection model is useful as a counterfactual but was not used to establish these native contacts or survival. Both derive independently from the screenshots and original source geometry.

## Fixture reversal and transfers

Before the recorded reverse input, the hero advances through source frames 35, 42 and 45 at the same pivot. protected-sample-02 captures frame 45 immediately before key-down. The script then holds key 49, character 32 for six guest ticks, releases it and captures protected-reverse at frame 44. Subsequent samples continue in the decreasing-frame direction, totaling 106 source-frame steps over 504 guest ticks, with no pivot change during that interval.

This confirms a reversal in this existing native fixture. It does not settle the earlier discrepancy between the statically traced default key combination and observed Space-alone behavior. No universal default binding or cause of that discrepancy is asserted.

All eighteen transfer screenshots independently match their expected pivots, including the checkpoint approach and departure from protection. The exact route remains private. This actor review does not assess dot restoration, checkpoint animation, the later SPI/death effect, or respawn/reset ordering; those are owned by the separate dot/reset review. No forced pose was assigned to a death-particle image.

## Evidence and release

Private some-dots/protection-review contains fit-protected.py, actor-fits-and-collisions.json, check-outlines.mjs, outline-crosscheck.json, analysis-summary.json and provenance.json. The public JSON records every contact checkpoint, fit quality, original-outline pixel counts, reversal evidence, all transfer outcomes and limitations without coordinates or map/program data.

All reports are UTF-8/LF. No runtime/helper/assets/queue file, media or save was changed; no acceptance or commit was performed. Files and the read-only workload are released for root review.
