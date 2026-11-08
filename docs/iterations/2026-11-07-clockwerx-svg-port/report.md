# ClockWerx SVG foreground pilot

Updated on the user's SVG-Port branch from df8d0c1e. Same playable Movement board, simulation and storage identity; no full-game expansion. The normal local route http://localhost:8087/clockwerx-html5/ now uses SVG hands and dots, with the original bitmap collage and unchanged three WAV effects. No emulator/WASM build was needed.

Five canonical SVG hand shapes replace five64-direction bitmap animations; six analytic sphere SVGs replace the map-dot images. The reusable converter verifies the owned PNG input hashes, traces and simplifies alpha contours including transparent holes, and reconstructs shading with gradients. Generated artwork remains private onD. The source contains conversion/rendering code, not extracted artwork. Rotating canonical gradients changes the original per-angle lighting and some outlines/details; this is an explicitly enhanced presentation, not lossless vector conversion.

Hands rotate continuously around the original pivots. Rendering interpolates previous/current120Hz poses, bypassing interpolation at transfers/reversals. This introduces up to one8.33ms simulation-step presentation offset; input-to-display latency is not measured. Collision radius48, map coordinates and game rules remain byte-identical source. Canvas backing follows display density with a bounded4x scale; browser inspection was atDPR1, with higher-density sizing covered by a focused allocation test.

| Runnable package (source + assets + manifest) | Bitmap reference | SVG version |
|---|---:|---:|
| Source |21,533B|24,057B|
| Assets |220,030B /364files|65,428B /15files|
| Manifest |165,615B|3,315B|
| Total |407,178B|92,800B|

The clean route is77.21percent smaller. This includes replacing pre-rotated frames, compacting metadata and excluding unused sprites/raw map copies. It is not purely an SVG-vs-PNG encoding comparison. The bitmap loader did not fetch every packaged asset: its runtime-referenced total and the separate reduction against that boundary are in evidence.json. WAV preloading/cache/HTTP compression affect actual transfer; no new tunnel-byte measurement is claimed. Original bitmap assets/manifests remain intact privately; no obsolete PNGs are mixed into the clean active SVG directory.

Root IAB checks: canonical shapes viewed at4x against the original PNGs; SVG scene loads and hands intentionally overdraw the frame; keyboard heldX9seconds visibly transfers the pivot right; heldswing30+20seconds with a tool gap reaches the goal overlay; Restart and P pause/resume work. Canvas PNG export returned a valid640x480 image. A black-hand toggle was issued and restored, but its cropped screenshot does not independently show the black player, so that appearance is not certified by this record. Physical controller/audio fidelity remain unqualified.

One20second SVG-only diagnostic completed visible/focused with3,301callbacks,2,401active120Hz steps and0dropped catch-up. Mean main-thread work0.619ms/p950.845ms at640x480 backing/CSS615x461.25, DPR1. These are work/callback counters, not displayedFPS or physical input latency. There is no matched-load CPU/RAM comparison and no claim SVG lowers rendering cost. The old nine-run ClockWerx comparison belongs to the frozen bitmap pilot and must not be reused as SVG measurements.

Validation passed: existing engine assertions, rendering wrap/continuous-angle/transfer/reversal/isolation tests and HiDPI bound, three contour/hole/vector-geometry tests, five packaging preservation/unverified-reference tests, app syntax and Git whitespace. No shared runtime, media or game save mapping changed. Source engine/board, background and sounds were compared byte-for-byte. The active library index/metadata/WASM hashes remained unchanged during the owned pilot-directory swap.

Private baseline and generated versions are in D:/SystemlessBuild/diagnostics/2026-11-07-svg-port. The live bitmap route was moved intact to live-bitmap-reference after exact hash/ownership/path checks; a validated staged SVG directory replaced it at the same route, with rollback on a failed swap. The temporary preview server is stopped at task completion; normal8087 remains running. To roll back the pilot, use the retained owned bitmap directory after checking the live SVG marker and paths; do not replace original game storage or media. No push/upload/public deployment was authorized or performed by the coordinator.
