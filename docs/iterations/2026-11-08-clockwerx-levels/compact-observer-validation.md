# Compact observer validation — 2026-11-10

The optional reusable recorder is in `scripts/clockwerx-diagnostics/`. Game source42 and the accepted normal57 bundle are unchanged. Private control evidence lives at `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/compact-observer-check02/`; receipt SHA256 `7ead54523e012e58d3e1b84f8b43e06b1c3433c30367ee3488487ef7c15e5434`. Independent saved-only peer receipt: `observer-peer-20261110/receipt.json`, SHA256 `04ff6c0485d6a8bb7f963402cb8d4a89910879dc8007318105f767a5c9a22d81` under the same private root. Final observer SHA256: `595f3ac1461b0d2a048df3970366db115e394a5af2502a401941abe313c32403`.

## Controlled result

Each mode replayed the same first1,200 inputs of the accepted57 literal on immutable source42 with identical fixture/profiles/settings. Check02 closed PID301076, exit0,22.360s: three constructors/constructor resets,3,600 attempted/completed updates, zero explicit resets and RNG draws.

| Recorder | Case elapsed | Saved bytes |
|---|---:|---:|
| Full callback snapshots (`old`) |12.064s|675,818,707|
| Lossless full witness deltas |6.442s|165,532,588|
| Compact search |2.725s|86,694,608|

Compact search used87.2% fewer bytes and4.43× less elapsed time in this one sequential observation per mode. This is diagnostic harness evidence, not a native/browser speed measurement or a promise for another level. Separate snapshot, serialization, encoding, output and hash timers are retained. The reported simulation residual still contains unmeasured wrapper overhead and is not isolated engine CPU time.

All1,201 per-update rows, ordered hook metadata, inventory, terminal and128-row failure window match across modes. Full witness deltas reconstruct all65,808 full callback rows exactly. The peer independently reconstructed and hashed all21 saved streams, checked nested original-call ordering and each mode's1,200 before/after counter pairs. A separate saved-only comparison matched historical accepted57 source state, inputs, accepted dot fields and65,808 consumed callback rows. Added physical/canonical samples and decoded dot fields, historical diagnostic-query exclusions and the administrative footer are explicit in the private audit; no differing source state was normalized away.

Exercised paths include one player transfer,14,400 NPC callbacks,15,850 colliders and nonlethal enemy/spike/wall queries. This check exercises no goal, death, RNG or Death58 moving-human path. Those paths need actual trial evidence and the chosen witness/fresh literal proof. Three portable codec/filesystem tests pass, including the counter-hash regression and shutdown reconstruction.

## Retained failure and durability

The first check was manually stopped after77.596s because forcing a physical disk flush before and after every update dominated recording. PID133420 exited4294967295; this was an early termination, not a timeout or gameplay mismatch. Its last journal retains one constructor/reset and797 attempted/completed updates, RNG0. The stale PREIMPORT summary is preserved; counters are authoritative. Evidence remains in `compact-observer-20261110/`.

Corrected counters append synchronously each update and flush physically at constructor, every128 completed updates and terminal. Terminal flushes every stream; counter hashes now cover actual journal bytes. Aggregate harness accounting, including the failure: four constructors/constructor resets,4,397 updates, zero explicit resets/RNG. These used the accepted57 fixture and are separate from Death58's15,788 updates spent before continuation.

The4,397 harness updates are also charged to Mortality57's existing functional budget:48,866 +4,397 =53,263/250,000 spent,196,737 remaining. This accounting does not add gameplay, reset or native qualification.

Compact files use exact JSON-text deltas and periodic complete checkpoints. Search retains full per-update source/dot/actor state and ordered original calls/results, with a128-update terminal window; it omits intermediate callback-state snapshots. Witness mode retains those snapshots losslessly. Buffer limits and peaks are per-stream/aggregate output buffers, not total-process memory; previous strings, current snapshots and the failure window also occupy memory. JSON-level losslessness preserves the legacy serialization's omissions and does not extend it to JavaScript identity or undefined fields.

## Next authorized work

Root reviewed the observer, independent peer and the complete focused58 runner/controller/supervisor. One new package, `death58/content/continuation-prepare02/root-focused-authorization.json`, SHA256 `43d54d11711d59e139c949bd88536706faee060c61a1371c274dc6959958b1ff`, authorizes four alternatives after a fresh exact replay through saved case04 step3207, stopping on first goal. Bounds include witness/proof: six constructors,48,000 updates, zero explicit resets,120s external wall limit. It preserves cold706 and707 tie/residuals. Source42 and original collisions remain authoritative. Search/witness per-update and ordered callback metadata must match before fresh full proof. One-step alternative inputs still need native-window qualification before original replay. No scene58 acceptance or activation follows from this observer check.

That one package subsequently closed exit1 at the prerequisite3207, before any alternative input, in10.031s. It retained one constructor/reset,3,207 attempted/completed updates and RNG0. The serialized state/dot/physical records matched the historical row; a raw-object assertion rejected own undefined fields omitted by the established JSON contract. This was a harness comparison error, not an observed gameplay divergence. The failed run remains in `death58/content/continuation02/`; its consumed authorization cannot be retried. Death58 spending becomes18,995/250,000. Any corrected continuation needs a separately frozen runner and new bounded package.
