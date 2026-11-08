# Some Dots: rings, checkpoints and protection

Level 9 is accepted as a bounded playable Child scene. Its inventory is 74 present dots, 51 white disappearing rings, 7 optional bonuses, 1 goal, 2 waypoints, 1 protected ordinary dot, 1 spike, 1 red long horizontal door and 1 switch. Two ordinary enemies execute programs; the alternate human is hidden. Both Oil records are inactive in Child. Eight text records include one empty record.

## Rules implemented

Human departure starts ring collapse and immediately denies further human actions at that pivot, including bounce. Enemies can still target it and become orphaned: they keep moving/programming, flicker on source callbacks and eventually hide. The ring and its shadow disappear, wait for the source deadline and grow back. Appearance, presence and human/nonhuman permissions remain distinct.

Ordinary enemy n/s/b/f programs use canonical source frames, one-based Pascal PCs and shared class deltas. A static transfer changes pivot and adds 32 to the frame immediately. Continuous SVG motion presents those decisions without consuming extra instructions. True EX sliding, moving dots and active Oil/transfer combinations remain gated.

Waypoints update the saved spawn, angle/direction and current integer time when the saved position changes. They do not save the whole board. Normal death restores rings, bonuses and doors, and returns to the saved waypoint. Its plain waypoint frame survives the reset before arrival reactivates it; explicit Restart additionally resets the selected waypoint to79 and restores the original spawn. Protection's separate animation retains phase/direction through resets. Child disables the round countdown; its current/saved integer90 is not simulation elapsed time.

Protection prevents ordinary-hand contact deaths, while spikes remain lethal. New v2 waypoint art uses a stable blue orb with balanced bands, one moving glint and the source red-marker onset. Main sprites, shadows and protection each use the same raw base with their own descriptor offset exactly once. Empty protection-shadow sentinels are not drawn.

## Independent evidence

| Check | Reviewed result |
|---|---|
| Native idle/programs | 2,030 frontend / 2,628 guest ticks, zero exhausted budgets. Red and green each match all33 positions/frames under one independently hero-derived class phase; wrong-PC controls fail. Failed grab/bounce commands advance the program as the source requires |
| Native ring lifecycle | 1,756 / 2,354 ticks, zero exhausted budgets. Both transfer endpoints match. Collapse25–29, paired hidden main/shadow, regrowth25 and full23 are observed. Early24 and obscured shadow phases are excluded. The300-guest-tick strict wait is compatible with bounds, not resolved to a single tick |
| Native goal | 4,394 / 4,992 ticks, zero exhausted budgets.17/17 pivot fits, max channel error0.287. Original completion shows zero bonus plus1,000Child |
| Native protection | 5,699 / 6,297 ticks, zero exhausted budgets.18/18 approach pivots and134 actor fits accepted. Sixteen captures have actual original collision-outline overlaps of1–16pixels while the hero survives on protection. Fitted red pixels remain at least91.13% visible. Exact Python spans and JS collision helpers agree67/67 |
| Native normal reset | Death effects, fade/reveal and saved-waypoint return are visible. Twenty accepted global hero fits confirm saved position and direction−1; five starburst-corrupted fits are rejected. Old waypoint89 persists through death, then85 and89 are observed after return. Exact79 wrap remains source-derived. All51 ring mains/shadows, seven restored bonuses and the closed door fit after reset |
| Browser/model | Goal17transfers at53.2seconds, zero bonus/reset. Separate browser case records spike death at63.817seconds, one reset to saved waypoint/direction−1, time90 and closed door. Both fixed input traces pass266clock-start samples.137runtime tests,12packaging tests and all eight previous actual-map routes pass |

The goal and checkpoint browser exports are valid idle-after-event records; the first20second preview records active idle rotation/program transfers. They are functional evidence, not matched CPU/memory or physical input-latency benchmarks. Numeric death reasons and timer90 are source/model facts, not values read from original screenshots. Original total1,000 survives the reset; the pilot's full scoring policy/display remains omitted.

The original key49 interval demonstrably reverses the hero at the protected pivot, then yields106 decreasing source frames over504guest ticks. Its static source reverse-mask discrepancy remains documented; this is fixture-specific evidence, not a universal Space binding. The HTML controls keep C for reverse. Reproducible input traces now support a rising-edge reverse flag through the existing source-clock queue.

## Generator requirements and retained failures

Carry separate human/nonhuman availability, ring phase/visibility/deadline, orphan state, program PC/direction, shared clock remainders, selected waypoint/saved spawn/time and the reverse-input latch. A protected-looking dot is not universal immunity. Certify an ordinary-hand overlap rather than merely waiting safely nearby: the first counterfactual tests showed no contact; a legal off-cardinal reverse produced a real protected contact case. Counterfactual protection removal was used only as a diagnostic, never as a solution certificate.

The first shortest static path died at an enemy. The final goal route opens the door and visits a waypoint. Its immediate backtrack uses an ordinary dot, so it does not prove ring regrowth; that proof comes from the separate native ring run. A planned death test at a nearby safe pivot never died and is retained; the final test deliberately approaches the spike. One screenshot named denied-ring-01 is only a label error from a two-step held segment containing a successful waypoint grab; supplemental event-range review corrects its interpretation while preserving every raw action/timing/photo. All17 goal windows correspond to successful transfers.

The first browser preview omitted new atlas preloads and stopped drawing; the error/source copy is preserved and the loader fixed before qualification. Rings are intentionally smoother/softer and dimmer than original masks (mean201→176); v2 blue waypoint shapes simplify the source glints. Fonts, exact startup/reveal timing, fresh-vs-latched tick jitter, every unobserved phase, all bonus routes, other difficulties, multiplayer, full sound/scoring/campaign saves and physical hardware remain unqualified. Source contracts and accepted/rejected observations are linked in the companion reviews.

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/some-dots/`. Activation guard/backup: `activation.json`, `previous-live-pilot`. The nine-scene bundle has21source files and55payloads:125,348source bytes,994,200asset bytes,740,933pretty JSON bytes; total1,860,481uncompressed bytes. All51previous payloads, shared library index/metadata/profiler/WASM and save identity are unchanged. FixtureSHA256 remains03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4. No heavy build, upload or deployment occurred. Bombs10 is next; the remaining-level request is unfinished.
