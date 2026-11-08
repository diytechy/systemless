# More Doors initial native visual/source fit

**Bounded art and goal evidence accepted after corrected native run02.** The native initial/transition captures support the existing long-horizontal door geometry, cap orientation and switch artwork; the browser initial canvas and completion presentation agree within the stated smooth-art limits. Native run02 visibly completes, and the saved browser final state confirms completion with all three doors open. Run01 remains a failed route despite retaining useful unoccluded art evidence. This is not full scoring, animation, pressed-switch, audio or campaign parity. No new runtime or rendering workload was performed for this review.

Private task root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/more-doors/`. Reviewed `native-play-01/initial-after-reveal.png`, the16 existing idle captures numerically, decoded resource227 and the original level4 door profile/source sprites. Native game region is(80,60)–(720,540), logical origin(74,72). This is the large board; do not reuse level4's small-board origin.

## Initial appearance

The three horizontal metal gates are stacked green, red and blue from top to bottom. Their silver top highlights, gray faces and down-right extrusion meet the enclosure walls consistently. Fixed end caps carry the appropriate paired color markers. Six metallic switches are visible, two of each matching color, with unpressed colored indicators. No missing gate, inverted extrusion, displaced cap or switch is apparent in the native scene.

Source records confirm that all three gates are long, horizontal and initially closed. Type3 uses primary frame33+phase and secondary77+phase. At phase0 the second leaf is an empty descriptor; this is expected, not missing art. The far cap of each gate selects its attached-wall variant through the actual merged wall-arm mask. The selected cap pairs are blue4/5, red0/1 and green2/3. All six switches use their unpressed color frames0–2. No difficulty activation mask is present on door or switch records.

## Numeric source fit

Original images use the established palette gamma0.7 interpretation. For each gate, all11 phase pairs were compared within a fixed interior ROI, excluding the complete first-cap shadow and the far cap. Each of the17 captures selects phase0 for all three gates. Mean absolute channel error is0.696 for each gate; the next phase is worse. This validates closed placement/orientation in these captures, not a measured opening cadence.

Cap comparisons use the original opaque masks at their independently calculated bases. Colored cap pixels have mean error0 for red/blue and0.410 for green. Whole-cap errors range approximately0.724–3.532 because the joined leaf/cap/wall layers share boundary and shadow pixels; those scores are not isolated cap-image identity. They do not suggest an anchor correction. Switch opaque-mask errors are0.674–0.711, with all102 switch observations preferring unpressed over pressed art.

## Reusable lightweight check

Private `visual-review/fit-native-doors.py` reads existing captures and source images, performs numeric array comparisons and writes JSON only. It does not launch the game, render new images, alter assets or call the browser. The default reads `native-play-01`; an optional single direct-child capture-directory name selects a future run. The resolved path is checked to remain directly under this task root. Output is `visual-review/<capture-directory>-source-fits.json`.

The script retains all phase scores, cap colors and unpressed/pressed alternatives. Actor overlap, death effects, reveal fades, text and completion screens may invalidate a fit; it intentionally does not automatically convert a lowest-error result into gameplay acceptance. A moving switch occupant may obscure its indicator. Future transition captures require those limits to be reviewed before inferring state or cadence.

Only this sanitized report/JSON and the private fit script/results were written. Original asset/profile payloads, runtime code and scene manifests were untouched. No emulator, browser, build, conversion or benchmark ran. Source-fitting workload and files are released; root retains functional-route and forthcoming browser/goal work.

## Actual-browser static and completion follow-up

Reviewed `browser-initial-canvas.png`, an exact640×480 canvas, against the native crop. The three long horizontal silver leaves, green/red/blue end markers and six corresponding switches align with native. The central enclosure joins remain continuous, with the expected upper/left highlights and down-right shading. Smooth switch disks, reduced small surface detail and continuous bevels retain the established enhanced style. No material scene-specific placement, orientation or color correction is requested.

The fixed closed-leaf interior ROIs have native-versus-browser mean channel error7.786 for each of the three doors. This is a bounded static comparison, not a pixel-identity claim: source seam/shadow edges and smooth SVG surfaces differ. The actual source-sprite fit above is a separate, lower-error measurement and must not be quoted as SVG fidelity.

Inventory agrees:57 source-present dots,9 bonus flags,1 goal,3 gates,6 switches, one visible human and no enemy hand or spike. All present-dot masks are15, with no extra dot color attributes. The second human slot is hidden separately. Source counts include partly obscured dots; the screenshot was not used as an automated count. Bonus rings and the goal remain distinguishable. All four text records are present in the expected lower regions, including the three-line switch reminder. Font substitution and different human/attention phases remain explicit limits.

`browser-goal.png` visibly displays the More Doors completion overlay and goal-grabbed message. Its full-page view is scaled and the overlay obscures upper gate details, so it establishes completion presentation rather than all three final gate states. The coordinator reported20 transfers; this audit did not independently reconstruct that route or inspect a final state export. Original route/transition comparison remains pending and was not polled or launched here.

All51 QA payloads independently hash-match accepted More Spikes QA payloads. Browser initial SHA256: `d93fa4ec8331c50a88aef6f165e0ba0fae5c390dfd3006a690dc4f1f7be8be0a`; browser goal SHA256: `c72ba13b2f981183fd42e10b4663def666894a4061a2783fd4b157fe00aeeda5`. Private `visual-review/browser-static-review.json` retains these measurements. Only report/measurement updates were written; files and workload are released again with native acceptance still pending.

## Native route01 phase evidence — route failed

Root confirmed run01 ended at5151 frontend/5749 guest ticks with zero exhausted-frame budgets. Its `passed` script status means execution finished, not that the goal was reached. Root's independent route check matched12 of20 intended pivots and identified the transfer13 key error; corrected run02 remains pending. The inspected `after-route.png` visibly remains in play rather than showing completion.

Existing `visual-review/native-goal-route-01-source-fits.json` contains26 saved observations. Reviewed interior fits support blue phases0/2/10, red0/3/10 and green0/3/10. Closed phase0 error is0.696, intermediate phase2 error0.563, phase3 error0.478, and open phase10 error0.098. Transfer13 visibly shows the partially open green pair; transfer19 visibly shows the partially open blue pair. The fixed caps remain while the leaves retract. These observations validate the depicted source frame shapes/orientation at those anchors despite the wrong route; they do not validate all eleven phases, direction, transition cadence or successful traversal.

The sole best-pressed switch classification is the left green switch at transfer13. The yellow human visibly overlaps it. Pressed-template error17.942 versus unpressed19.580 is far above the0.674–0.711 clean-switch baseline; that small relative preference **does not qualify pressed artwork or switch occupancy from pixels**. The remaining155 switch observations prefer the unpressed template at the established low errors. Retain the high-error row as explicitly occluded rather than treating it as successful pressed-state evidence.

No new fit, runtime, conversion or asset change was needed for this follow-up; existing outputs and saved images were reviewed. Reports are released again, with native goal/route acceptance and clean occupied-switch evidence still pending.

## Corrected native run02 — bounded acceptance

Run02 finished at5151 frontend/5749 guest ticks with zero exhausted-frame budgets. Root independently matched20 of20 intended pivots (maximum source-hand fit error4.280). The inspected final panel explicitly says More Doors completed, with6,000 bonus points plus1,000 Child completion points, total7,000. These are score amounts, **not a count of bonus pickups**. Native bonus-award policy is not qualified by this art audit.

The26-sample run02 fitting output requires manual exclusions. Reject the entire `after-route` completion-panel row, including its deceptively low open-door scores: a gray results screen can resemble an empty door ROI, but no game sprites are present to compare. Also exclude the affected green/red/blue door ROI at transfers17/18/19, respectively; the crossing human, pickup text and effects inflate their errors to9.709/10.276/9.596. These are occluded samples, not malformed doors.

The remaining72 door observations are valid low-error art evidence. Run02 covers blue phases0/10, red0/3/10 and green0/7/10. Errors are0.696 closed,0.478 red phase3,0.134 green phase7 and0.098 fully open. Transfer07's partial red pair and transfer13's partial green pair were visually checked. All three doors are clearly open by transfer14 and in the unobscured later samples. Along with run01's legitimate phase2/3 images, this validates the sampled shapes and fixed caps; it does not validate every phase or infer transition direction from one frame.

All150 non-completion switch observations in run02 prefer unpressed art at errors≤0.711. The two best-pressed classifications on the completion panel are invalid scene matches and are discarded. Run01's hand-occluded pressed preference remains unqualified. No clean pressed-indicator capture was added by run02; this limits artwork comparison rather than negating the separate functional switch evidence.

The saved `browser-goal-state.json` independently shows complete=true at66.7833 simulation seconds,20 transfers, and all three doors at phase10/direction0 with zero switch occupants. The browser goal image shows the completion overlay. Root separately reports three browser bonus pickups, seven toggles and zero resets; those counts must not be equated directly with the native6,000 bonus points. The pilot completion overlay remains different from the native score-breakdown interface.

No material artwork correction is requested. Remaining limits are clean pressed-switch appearance, full11-phase/temporal comparison, scoring policy and broader gameplay parity. Only report and manual-exclusion metadata updates were written. Runtime/assets/manifests remained untouched; files and workload are released.
