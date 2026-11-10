# Moving dots with static spikes

The shared engine now supports an explicit, default-off composition of ordinary moving bonus dots, static spikes, a static white goal and the reviewed ordinary actor programs. It reuses the existing movement, grab, scoring and collision rules. No per-level physics or ordinal allowlist is added. This source review does not accept Headache56 gameplay.

The original spike lifecycle distinguishes a new level from an ordinary reset. New instances start at allocated ordinal modulo four. Existing instances retain their frame and last observed client reference across death or restart; visibility is restored. The global timer continues during death, while the derived spike bank is latched after normal universe processing. A legal poll advances one frame when its pointed bank value changes, with no elapsed-time catch-up. Original collider frames and drawing offsets stay independent of SVG artwork.

The candidate passed an independent source and boundary review. Root then ran 386 public tests, 21 focused packaging tests and actual Headache import, constructor, palette and reset checks with zero gameplay updates. One complete Square Dance replay and one complete Hokey Pokey model replay preserve all declared dynamic fields, complete snapshot and geometry lineages, and the latter's exact final phase: 12,116 updates in two constructors/processes. The Hokey Pokey model replay is a compatibility check, not evidence that its original-game replay succeeded.

The checkout preserves 35 unchanged modules byte for byte. Five changed or new modules use CRLF, while the private reviewed candidate uses LF. The initial exact-byte gate failed before gameplay; its failure is retained. Root authorized source-text newline equivalence, recorded actual hashes and verified that no source changed during the checks. No gameplay state, pose, frame or clock was normalized.

The packager includes the new module, bringing the runtime dependency set to 40 files. The normal 54-level bundle and isolated 55-level QA bundle remain on their immutable 39-file source. No assets, maps, original media, preferences or saves are committed. No Rust build, push, upload or deployment occurred. Native Headache timing, spike startup phase and gameplay remain pending earned progression through level55.

Private candidate receipt: `080b5e3e9db5fc2fcc4c7a1497c47701c4d1405412ac1dcf98911ec58ff65af7`; candidate peer: `0da27df118d6484d6316d993d0a8fe649096486b1de4bca8c9db80a5313e41d7`; root integration: `8cacc2bcb5882a0c688e141d7150ccd2c67848b2b26baa2db3ca241aff3fc9c1`.
