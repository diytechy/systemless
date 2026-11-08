# Oil bounded acceptance

Catalog5/resource224 is implemented, validated and locally activated on SVG-Port. The five-scene pilot retains Movement, Spikes, Walls and Doors. This acceptance covers the static-dot Child/single-player subset, its goal route and pursuit/reset/clone checks. Full audio, original scoring, campaign saves, hardware controllers, moving/special-dot interactions and exhaustive action timing remain unqualified or omitted. No public upload, push or deployment ran.

Inventory:50present dots,9bonus flags,1goal,1spike,3serialized puddles,5unused programs and human slots0/6. Child filters out both mask12 puddles before creation, leaving one mask15 kind1 puddle and one visible human. A sleeping puddle is harmless until touched. It wakes, acquires a dot and creates a separate pursuing droplet. A droplet kills when it finishes grabbing an occupied human pivot, or when a human grabs its resting frame0 dot. Generic hand-outline overlap is not its death rule. Details: [source review](oil-astra-review.md), [dot/traversal supplement](oil-integration-source.md).

## Behavior and timing

PU and DP callbacks observe separate scalable source clients over adjusted base83, divisors2/1. At60normalized guest ticks/second their sustained averages are5.783/11.566callbacks per second. Wake and movement deadlines instead add adjusted150=250 **guest ticks**; cloning uses adjusted700=1166guest ticks. They use strict deadline comparisons and run one callback per observed count change. Treating those delays as MT16-unit periods would make pursuit dramatically too fast.

Acquisition scans source dot slots in order within an inclusive±6pixel raw-position box, then checks the first match's permission. DP dot contact uses original main-dot outlines and returns the first overlap before ignoring previousDot. Ordinary/background dots and visible bonus dots remain eligible. Bonus pickup changes the collider frame. Goal shimmer is separate from the goal's main collider. Raw sprite bases, separate human/nonhuman permissions and source universe bounds are retained.

Layer11 Oil runs before ordinary enemies, then humans. New sprites append at the tail, traversal caches next before callbacks, and new DP/faders snapshot the current client count. Clone creation and its arrival/direction setup occur synchronously before the parent leaves its dot; the child waits for another count before its first frame. A death during human grab suppresses bonus and goal effects. Death freezes visible callbacks, preserves clocks, and resets all puddles, transient droplets/faders and cached human pivot after the explosion barrier. The32-droplet allocation budget includes hidden actors until reset.

## Reviewed evidence

| Check | Result |
|---|---|
| Original wake/pursuit/reset |3226frontend/3824guest ticks,0exhausted budgets. All5approach pivots independently source-sprite matched. Forty half-second samples show wake, acquisition/approach, DP pursuit, death and restored dormant puddle/spawn |
| Original phase fitting |Wake frames in idle03–10, approach in12–14, resting DP15–23, first travel24 fit original art with channel error below0.488. They agree with model stages; exact trigger and later death/fade frames are partly occluded |
| Original goal |3482frontend/4080guest ticks,0exhausted budgets. All13intended pivots matched. First pickup/attention overlay raises worst channel error15.90; the remaining fits are at most3.40. Completion shows3,000bonus+1,000Child=4,000 |
| Original clone branch |4506frontend/5104guest ticks,0exhausted budgets;15/15approach pivots matched. Exact original resting DP0 fits find two distinct droplets in16of32frames, first in idle11, error0.685. Their separate vertical/horizontal paths agree with the cloned preferences. This establishes branching, not every possible clone schedule or capacity edge |
| Pilot goal |13transfers,2bonuses,32.933simulation seconds,0resets. All166sampled clock onsets complete without a reset. These samples do not exhaust the Cartesian product of every clock and action |
| Browser goal/reset |Goal export confirms13transfers/2bonuses/0resets. Separate amber pursuit replay records reason10 death and full round reset: spawn restored, PU dormant, DP allocations0, no further input. Its status reports the reset correctly. Goal/reset exports are20second idle-state records; they are not matched resource workloads |
| Regression |Five actual-map goal routes pass; Walls38,Doors266 and Oil166clock-onset cases pass.95accepted-runtime Node entries and12packaging tests pass. The separate Some Dots helper remains unlinked/unaccepted |

The [Astra visual review](oil-visual-review.md) found correct placement but an overly bright gold candidate. The adopted amber atlases retain smooth silhouettes and anchors. Actual browser body meanRGB137.74/84.91/3.93 is close to native140.09/84.50/0; error on the same164native body pixels drops44.25→14.66, about67%. Smooth shading, fuller outlines, simplified texture and opacity faders remain intentional presentation differences. Exact original RNG, clipped native-window behavior and all special-dot/fader interactions remain limits.

Runtime profiles omit diagnostic descriptors/hashes after retaining source-profile provenance and comparing every collision field. The full159-frame oil profile298,229bytes becomes33,483; the current static-dot subset becomes2,853bytes from the full207-frame260,575byte source profile. Both complete originals remain private. All47Doors baseline payloads are byte-identical. No source collider or original media was changed.

Private evidence: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/oil/`, including native reports/screens, source fits, input traces, model snapshots, browser exports, original/amber candidates and compaction checks. Fixture SHA256 remains `03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4`. Headless tests neither import nor persist adjacent/browser saves. Oil clone and Combo initial functional runs used the two authorized runners; no CPU/memory benchmark is claimed. Prior frozen Movement performance results do not measure this increment. Engineering time was not separately instrumented.

Activation/retained prior route: `oil/activation.json` and `oil/previous-live-pilot`. Shared index, library metadata, profiler and WASM hashes are unchanged. The current uncompressed five-scene route is1,388,248bytes: source94,454, assets841,368, pretty manifest/map metadata452,426. It uses16source files and51payloads, retaining the original prototype save identity. Combo6 is next.
