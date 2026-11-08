# More Doors source and route preparation — 2026-11-08

Catalog8, **More Doors**, RND2 resource227, is prepared for coordinator review. This is an **unaccepted private model/input route and an unexecuted native scenario candidate**, not level qualification. Root owns the QA manifest, browser/native runs and activation. This worker wrote only private route-prep files and this report, plus the explicitly identified Bombs report correction below.

## Source and current adapter

Version12, large11×8 display, raw time90;57 present dots,9 bonuses,1 goal. Nonempty blocks are WL9,DR3,DS6,WP7,WA2,TX4. Both WA records are the ordinary two human slots; single-player creates no enemies. There are no spikes or puddles. All seven WP strings are unused by active actors and require no program activation. Raw geometry, map/program/text data and route coordinates remain private under `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/more-doors/route-prep`.

All three DR records are initially closed, long and horizontal, one per color. Six DS records make two spatially separate switches per color. The existing source decoder and door helper support these records without a runtime change. SourceRound and its dependencies were copied read-only into private model-src to prevent concurrent edit drift; source-hashes.json pins them. At release all pinned modules still matched the coordinator's current files. The existing accepted51 payloads remain byte-identical. The coordinator advanced its own normal manifest from scene6 to scene7 during this work; this worker did not alter it.

Long-horizontal type3 uses primary frames33–43 and secondary77–87. Closed phase0 has a full-span primary leaf and empty secondary77. Mid-transit has two separate leaves and two matching diagonal lethal outlines. At open phase10 both leaves are empty sentinels. Horizontal caps remain visible/collidable; the far cap is the attached-wall variant, selected from the merged wall cross arm4, not generic wall presence. The three color pairs use existing horizontal cap frames0–5. The accepted Doors atlases already contain all needed art; no new conversion or asset registration was performed.

DS contact is entry-triggered per actor and source first-overlap order. Repeated occupancy does not toggle; leaving does not toggle. Entering the paired switch of the same color is a new activation. Source activates the new switch/color before releasing old occupancy; both switches retain independent pressed counts. During travel, another activation reverses the door; it does not restart from an endpoint. Callbacks coalesce missed counts into one phase step. These rules make naive waiting or returning past a switch capable of closing a door again.

## Goal route and model checks

The private route performs20 transfers:19 flips and one swing. The swing changes the return rotation so the hand avoids an unwanted repeat entry at a switch. The first all-flip attempt closed the upper door again and timed out on the next transfer; its summary is preserved in failed-model-attempt-note.json. The successful route changes only input, with no pivot, angle, door, timer or collision-state edits. State-observing waypoint choices are compiled into a fixed input trace before replay.

`guided-route.json` reaches the goal with all three doors open and no death/reset. `checked-route.json` replays fixed ±0.25-second held windows from266 persistent-clock startup offsets, each created by ordinary idle then model reset. All266 cases finish without death/reset, at66.708–66.783 model seconds, with the same20-transfer path. This finite offset sweep spans0–265 fixed120Hz steps; it is not an exhaustive joint clock-state or native-input proof. The route collects the three central bonuses; it does not claim every optional bonus.

The native action windows were separately replayed in the normalized model from nine ordinary-idle states displaying frame9. All9 finish without death/reset. This assumes frontend and guest ticks advance1:1 during gameplay; it is not a measured conversion. The live SourceRound retains continuous human movement/input and an approximate door/actor traversal boundary, so native switch-entry phase can diverge. Preserve native failure evidence and adjust actual held inputs from observed source poses; do not tune physics to force this trace.

## Existing native anchor and scenario candidate

Only an existing capture was read: `more-doors/native-play-01/initial-after-reveal.png`. Independent source-sprite matching against all57 present pivots and64 group700 poses identifies frame9 at the configured initial pivot. Mean absolute opaque-pixel RGB error after gamma0.7 is0.234; the next pose is58.827. This is a strong screenshot pose match, not new native execution or motion/timing evidence.

`route-prep/native-goal-route-candidate.json` preserves the previously prepared boot/selection/reveal prefix. The first desired encounter is frame32. The estimate is(32−9)×4.75=109.25 guest ticks; rounded center109 uses a conservative frontend hold94–124. Source checks input before animation, and a frame9 screenshot does not reveal its timer/subframe phase. Therefore109 is an estimate, not an exact source callback prediction. Later window centers retain relative spacing from the successful model route.

The candidate contains20 transfer screenshots, three estimated door-open screenshots, goal-arrival and post-route captures. Transfer13 is Space swing; all other transfers use Control flip, following the established original-game mappings. Gameplay actions use4081 frontend run ticks including180 post-route ticks; total with prefix5151, finite max5451. It includes logs/milestones and no guessed pixel/memory assertion. Metadata and expected pivots are private in native-input-windows.json. The scenario is ready for the coordinator and was not run by this worker.

## Focused tests and native review checklist

`route-prep/door-contract.test.mjs` passes six focused tests using the actual decoded records and accepted original outlines:

- All three long-horizontal definitions, independent switch pairs and attached cap variants are present; no active enemies/spikes/programs leak in.
- Closed, intermediate and open leaf states preserve their distinct source descriptors and empty sentinels.
- Closed leaf contact bounces; a source diagonal transit-edge witness is lethal with no bounce/guard increment; the same interior is clear when open; open-door caps still bounce.
- Holding/releasing either real switch does not toggle, while entering its paired same-color switch reverses travel.
- An additional test actor entering an occupied switch toggles independently and does not clear the first occupant. This is a helper contract test, not an actor present in this single-player map.
- Reset restores three closed doors and six unpressed switches at the current clock; unchanged counts do not animate and a large count jump advances once.

Private collision-witnesses-private.json preserves exact point probes. These tests exercise original row outlines, not enhanced SVG alpha. They do not establish that a hand can reach each witness through the original map in the required phase.

Coordinator native review should compare long-horizontal full-span closed art, both intermediate leaves, open disappearance and wall-attached colored caps; confirm each of the six switches activates its paired color on entry but not occupancy; verify repeat entry closes/reverses; check safe passage only after open, cap bounce while open and a separately timed lethal moving-edge attempt if reachable. The goal route deliberately avoids lethal transit and does not qualify that death path. Source mask priority remains leaves before all caps, with second-leaf selection on dual overlap and only that leaf's lethal mask checked.

No emulator, browser, build, benchmark, root runtime edit, active manifest write, media/save change, commit, upload or deployment was performed by this worker. Model route files, snapshot modules, tests and the native candidate are released. Coordinator browser/native evidence obtained concurrently is outside this preparation report.

## Bombs correction carried forward

The coordinator's transfer audit identified an overbroad claim in this worker's earlier Bombs report. Independent re-read of CODE6:d98e–d9b4 confirms that WAEnemyOneFrame permits hidden-until resurrection only when saved WASpec type is5. WABombed assigns a deadline to all hit actors, but Bombs' ordinary type1/2 enemies remain hidden until round reset. bombs-astra-review.md/json now explicitly supersede the earlier automatic ordinary-enemy return claim. No runtime change was made.
