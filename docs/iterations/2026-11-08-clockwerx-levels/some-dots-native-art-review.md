# Some Dots native source-art placement — runtime pending

**Use the same raw base for main, secondary and protection sprites:** logical pivot minus(16,15), then add that sprite's own raw descriptor exactly once. Native level9 confirms this for the observed rings, waystations and protection overlay. Do not add the main descriptor offset again when drawing the secondary shadow. This is original-art placement evidence; v2 checkpoint appearance and runtime acceptance remain pending.

Private root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/some-dots/`. One directory inventory found the initial capture plus idle01–21; only those22 saved images were read. The active run's report was not read or polled, and later captures were not awaited. Native game crop is(80,60)–(720,540), with large logical origin(74,72). Fits use original8-bit source images with gamma0.7, not candidate SVG pixels.

## Drawing contract and evidence

At the initial capture, all51 source ring dots match group300/frame23 at the hypothesized raw base with mean absolute channel error0.214 for each ring. Both waystations match group300/frame79 at0.432. A small local translation search selects correction(0,0) for both groups. Main frame23/79 descriptors are(11,11), giving top-left logical pivot minus(5,4) for these10×10 images.

Their group4100 secondary descriptors are(20,20). Applying them to the **same** raw base gives shadow top-left logical pivot plus(4,5), nine pixels down-right from the main top-left. All51 ring shadows and both checkpoint shadows match at error1.0. Adding the main(11,11) offset a second time raises median error to23.143 for ring shadows and50.181 for checkpoint shadows. The source shadow displacement is already encoded in its descriptor.

The protection overlay also uses logical pivot minus(16,15). Its phase-specific descriptor selects the green markers' bounds; do not recenter each atlas crop or attach it to the main image's top-left. All22 sampled protection poses have exact observed-versus-source green-mask agreement (IoU1, zero differing mask pixels), with best offset correction(0,0). Colored-pixel errors are0.417–0.583. All eight frames117–124 occur in the sample set. This establishes changing marker geometry/placement across the whole range, not the exact clock onset or callback rate. The known independent unscaled50 protection clock remains the source scheduling contract; these sparse photographs are not a timing measurement.

All eight corresponding group4100 protection descriptors are empty/offscreen sentinels. Skip them; do not synthesize a second protection shadow or reuse the main descriptor for them. Ring/checkpoint secondary sprites remain separate, matching the selected main frame index when their source state changes.

## Boundaries and reproducibility

Private `native-art-review/fit-existing.py` reads the fixed capture list, source descriptors and raw image copies, and writes `native-art-fits.json`. The file retains per-object fits, nearby/wrong-offset alternatives and per-capture protection phases. No raw coordinate map or original pixels are reproduced here. No new image, rendering, emulator, browser, build or benchmark was created/run. Ordinary enemy poses were outside this focused pass.

Ring collapse/regrowth, waystation activation frames80–89/red selection, checkpoint reset behavior, protected contact behavior, exact source-clock cadence, source-frame traversal and candidate SVG comparison are not qualified by these idle images. Native source anchors are now supported for the sampled static forms; future application drawing should preserve the above per-descriptor contract. Only this report/JSON and the private fitter/results were written. Files and workload are released; runtime/native-run completion remains with root.
