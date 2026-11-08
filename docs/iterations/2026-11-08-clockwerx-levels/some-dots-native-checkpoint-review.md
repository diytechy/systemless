# Some Dots checkpoint death/reset — bounded native evidence

The completed checkpoint run demonstrates a selected waypoint's completed appearance surviving the death-effect interval, subsequent waypoint re-animation at the saved return position, and board restoration of rings, bonuses and the closed door. This qualifies the available native images; it does not accept catalog9 or its browser implementation. Normal catalog8 remains the accepted boundary.

The private `some-dots/native-checkpoint-01/report.json` records5699 frontend/6297 guest ticks and zero exhausted-frame budgets. Its passed status means the script completed. Existing source sprites and saved images alone were inspected; no native/browser/build/render/conversion workload ran. Exact map locations, templates and per-object scores remain private under `some-dots/native-checkpoint-review/`.

## Method and observations

Original group300 waypoint frames79–89 and group4100 secondary variants were compared at the established shared raw base: logical pivot minus(16,15), then each descriptor's own offset once. RGB uses source gamma0.7. Scores are mean absolute channel errors on original opaque masks. Door phase scores use an interior region excluding caps and wall overlap. Main frames have equal sprite bounds; high-error actor/effect/fade overlap is rejected, rather than accepted from the lowest score alone.

| Saved sample / guest tick | Accepted waypoint evidence |
| --- | --- |
| Initial1668 through transfer06/2700 | Main79, error0.432; common shadow1.000 |
| Transfer07/2928 | Main82, error0.455; checkpoint activation has progressed |
| Transfer08/3232 through transfer18/5337 | Main89, error0.424, including all saved protected-window samples |
| After-approach01–05 /5367–5487 | Main89 remains at0.424; death particles are visible at5397 and5427, away from this waypoint |
| After-approach06–07 /5517–5547 | Whole-scene fade/reveal: raw main/shadow scores rejected |
| After-approach08 /5577 | Main85, error0.432; returned human visibly occupies the selected waypoint |
| After-approach09–32 /5607–6297 | Main89 again, error0.424; human rotation persists at the saved waypoint |

The return pivot is visibly the selected waypoint rather than the original starting pivot. Hero-angle, direction and exact transfer-pose qualification belong to the separate actor review. The frame89→85→89 sequence around reset demonstrates replay of the waypoint animation. It does **not** directly capture the89→79 wrap or all intervening frames: the two intervening images are palette-faded and were excluded. Nor does a30-tick capture interval resolve the first reset callback or exact animation cadence.

Group4100 uses a common shadow image for79/81/82/83/85–89;80/84 use a different source image. Thus a common-shadow fit cannot independently identify the phase. Clear accepted waypoint samples fit that common image at1.000, including the returned main85. At5697,5727,5757,5997,6027,6057 and6297, the returning hand/shadow crosses the secondary region and raises its error to4.26–68.95; these secondary fits are rejected. Main89 remains clear and well fitted. No secondary80/84 appearance is qualified by these samples.

## Board restoration and death presentation

At5577, all51 ring mains match full frame23 at error0.214, all51 ring shadows match at1.000, and all seven bonuses match their initial uncollected sprite at error0.273–0.433. These appearances remain matched in the subsequent saved samples. A released ring that did not match full size before the fade is restored; this is consistent with the previously qualified ring reset contract. This does not assert that all51 rings had disappeared before death.

The consumed bonus provides an independent state contrast. At5487 its ordinary-dot image matches at0.561 while the uncollected image differs by53.470. At5577 its restored bonus matches at0.433 while the ordinary alternative differs by54.061. The pre-reset door is fully open, phase10/error0.098; the fully revealed return and subsequent samples show closed phase0/error0.696. Those are whole-board transient resets, rather than a hero-only relocation.

Death particles are directly visible in5397/5427 captures; by5487 they have cleared. The scene is dark at5517, revealing at5547, and fully revealed at5577 with the returned hero and restored objects. These images agree with a death-effect/freeze barrier followed by reset and reveal. They do not expose internal freeze bytes, the exact death cause/reason number, or the precise barrier completion tick. Enemy/protection behavior and collision attribution remain with the separate actor/protection review.

The HUD visibly carries1000 before the reset and1000 in the total field afterward, while the current field becomes0. This is visual evidence of retained score across this reset, not a qualified scoring policy, pickup count or implemented browser score model. No round countdown is readable; Child's disabled countdown and saved integer90 remain source-only facts.

## Source interpretation and limits

The source explanation is in [dot callback/reset ordering](dot-callback-order-source.md) and [Child/checkpoint timer contract](child-checkpoint-timer-review.md). For these plain waypoints, CODE6:2220–230c DOReset stops/detaches but retains the current frame and clears selection. WAReset:dd46–de4a resets all actors and then invokes human DOInitialGrabbed; the returned human activates the retained waypoint. DOGrabbed:46b6–46c6 attaches the unscaled80 clock and sets step+1 without an immediate increment. DOOneFrameProc:26e4–26ee invokes SUAutoFrame before its max stop; CODE4:3e26–3e46 wraps above-max89 to min79 on the next eligible callback. The saved-image sequence is consistent with that contract, but does not independently prove the unseen wrap instant or distinguish it from an immediate reset-to79 using these sparse captures alone.

Normal death must therefore retain its source-defined ordering; the image evidence does not authorize replacing it with an immediate frame79 assignment. Explicit Restart Level is a separate path and was not exercised here. The private fit file contains every attempted score, including rejected fade and occlusion samples, and is not an automatic acceptance list.

Only this report/JSON and the private fitter/results were written. Runtime, source assets, manifests and saved media are untouched. Files and workload are released.
