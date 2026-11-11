# Optimized original capture executable

The existing Cargo `fast` profile produced `D:/SystemlessBuild/target/fast/systemless.exe` without changing native source or the ci-test executable. The first build took 15m06s in the background. Private evidence is under `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/native-fast-build01`.

The optimized executable SHA256 is `6dadffdf4ab6c829704093dc4bce079b4e7cca3b3a4f0dd1755e29d3ae519c00`. The preserved ci-test executable remains `289c2de80e7997efd0ad3605aad240d3f078218a9d715ebb8c7fcaf8aebf0ef8`.

The same earned-through67 fixture and exact Jumble cold scenario ran in separate original processes. Both closed successfully after 2,224 frontend ticks / 2,824 observed guest ticks, with all 35 PNGs byte identical, identical checkpoint reports, zero exhausted frames and unchanged fixture/original media. The shared source-only actor fitter froze its method before the baseline dedicated pixel read. `root-capture-comparison.json` records every image comparison and both closures.

The optimized capture took 86.03 seconds versus 111.02 seconds for the baseline (1.29× observed ratio). The baseline overlapped the tail of compilation, so this is one diagnostic comparison under different host load, not an interactive performance benchmark or a general speed estimate. The optimized build can now be pinned for subsequent captures, retaining per-run original entry/goal and independent source comparisons. Keep the ci-test executable available for concrete discrepancies.
