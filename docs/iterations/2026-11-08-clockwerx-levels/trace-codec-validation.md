# Lossless trace codec qualification

The optional `observer-fast-delta.mjs` (3995261b) changes only the pure delta encoder. Original `observer.mjs`595f3ac1 stays unchanged and remains the default. The runner admits these two frozen hashes; use `--observer fast-delta` with the shared replay preparation helper after this review. It retains every snapshot, consumed hook, RNG/counter record and all native/visible gates. No state cache is enabled.

The new encoder compares complete2048-code-unit chunks, then binary-searches the first unequal UTF16 unit in each fringe. It preserves the maximal prefix/nonoverlapping suffix and exact old full-versus-delta decision, including Unicode and lone surrogates. A portable check requires all source outside that encoder to remain identical; five codec/observer tests pass. Initial private candidate checks cover2,688 comparisons. A192-pair sample from the start/middle/end of a real hook stream reproduces the old rows; its four microbenchmark rounds favor chunk comparison over character scanning and whole-prefix binary search.

The saved-only full audit reconstructs/re-encodes every inventory, lineage, hook metadata, full hook-state and terminal row from the old Descent witness. All3,744,770,823 encoded bytes are identical. The audit imports no engine and uses zero model updates; counters remain unchanged source and are additionally compared in the actual run.

The actual check uses the accepted Source54v2 and15,662-update Descent literal, with the old completed witness and original goal review. `descent70-fast-delta-proof01` closes accepted/goal9,000 with one constructor, no reset/death/RNG. Every logical digest, including counters, and all five encoded stream hashes match the old witness/fresh proof. Thus the complete intermediate hook-state comparison remains present.

| Diagnostic component (seconds) | Old full fresh | Fast delta full fresh |
|---|---:|---:|
| Snapshot construction | 47.171 | 43.550 |
| Serialization | 77.421 | 71.234 |
| Delta encoding | 54.510 | 18.378 |
| Output | 14.823 | 16.340 |
| Hashing | 10.970 | 11.318 |
| Whole owned process | 239.718 | 197.219 |

This measured pair saves42.499s (17.73%). Encoding falls from54.510s to18.378s; other components also vary with host/cache conditions. This is diagnostic-recording evidence, not browser/native gameplay performance or an isolated simulation benchmark.

Private `codec-optimization/root-qualification.json` is5fb9ce2e. The extra15,662 real updates are charged to Descent70:125,972/250,000 used across nine constructors,124,028 remaining. Its accepted gameplay proof remains the original595 record. The string-only codec change adds no mechanism branch or gameplay qualification; subsequent levels still require their own full proof, original goal, visible check and relevant retained-route sweep.
