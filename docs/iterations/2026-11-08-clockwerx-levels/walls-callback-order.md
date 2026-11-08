# Walls callback ordering and follow-up source inventory

This supplement makes the source-only callback clarification durable. It also records the missing red-hand collision group and the Child activation audit. No runtime, native, build, art or engine changes were made for these follow-ups. The coordinator owns the native Walls comparison and integration.

## Two collision schedules

Wall/spike checks occur inside actor source-frame substeps. Human–enemy overlap runs separately once per active game-loop pass. They must not share an unconditional120Hz contact/counter loop.

`GPPeriodicProc`, CODE1:68d0–690a, calls SUProcessUniv, SUDrawUniv, then (when playing) ROPeriodicProc, then GPCheckProgress. Initial A5 jump entries independently resolve2d7a→CODE4:4a66,2d82→CODE4:4ab8,245a→CODE7:50e6.

`SUProcessUniv:CODE4:4a66–4aa2` visits sprites in unfrozen layers. `SUProcessSprite:3ebe–3f5c` calls the actor frame callback only when its clock count differs from the saved reference (`SUIsFrameTime:3e6c–3e98`). It snapshots the count and calls once. However, WA callbacks contain an inner loop: `WAHeroFrameProc:CODE6:d826–d842` and `WAEnemyFrameProc:da02–da20` execute the one-frame function classClock.delta times. A single sprite callback can therefore execute multiple source substeps. This differs from the SP/DE single-callback frame advancement discussed in earlier reports.

## Human source substep

`WAHeroOneFrame`, CODE6:d498–d54e:

1. WACollide tests the existing pose. In its human branch the call order is spikes, goodies, puddles, matches, sparks, bullets, enabled walls, doors if no wall collision, then switches/waystations/triggers (`d07a–d146`). Human–enemy hand overlap is not in this routine.
2. Update consecutive wall/door collision counter. False clears it; fourth consecutive true calls RODied(hero,36) (`d4c6–d4e8`). Spike death does not itself increment this counter.
3. WAStopSliding (`d4e8–d4ea`).
4. WADirectHero reads/consumes eligible input and invokes WAAction, including any pivot transfer (`d4ee–d4fa`; implementationc8ae–ca90).
5. WAStartSliding (`d500–d504`).
6. If won/dead, clear rotation direction (`d508–d52a`).
7. WAHeroAnimate advances sliding position, or calls SUAutoFrame once and installs the returned frame (`d52e–d540`, helperd42e–d47a; SUAutoFrame CODE4:3de2–3e4a).

Human input/transfer thus follows current-pose spike/wall checks and precedes animation. There is no second spike/wall test immediately after transfer within that same substep. Wall bounce reverses the direction used by the subsequent animation. Do not add penetration correction or a compensating extra rotation step to the bounce routine without separate evidence.

## Enemy source substep and periodic overlap

`WAEnemyOneFrame`, CODE6:d938–d9c0: animate/slide and install new frame; WACollide on that new pose; stop sliding; eligible program instruction; start sliding. Ordinary enemies skip the human spike branch. There is no corresponding human consecutive-contact death guard.

`WAPeriodicProc:e7a6` first calls `WACheckCollisions:e5f4–e6de`, using poses left by the pass's sprite processing. This human–enemy overlap pass runs even when neither hand clock changed. It then calls `WALatchTimer:e6fa` to calculate class counts/deltas, then samples reverse/input latches (`e7ba–e8b6`). These deltas feed subsequent sprite processing.

Integration contract: increment the wall guard once per human source substep; keep human–enemy overlap sampling separate. A continuous120Hz average-angle simulation remains an explicitly approximate port. Moving every actor before all collision tests does not reproduce the human source order. Exact cross-actor/layer traversal order was not qualified in this follow-up.

## Child activation: omitted actors are not hidden actors

`ROPrepare:CODE7:4734–4746` sets activeMask=`1 << difficulty` in normal play. Its demo branch uses15. Child is difficulty0, hence activeMask1. The copied STR#130 resource orders the names Child/Easy/Medium/Hard; the difficulty label lookup at CODE7:6090–609c uses index difficulty+1. GP passes the selected difficulty through CODE1:6a1c–6a26. STR#130 SHA256 is `981287225fe2ce9c49b7d2aaad0f1d1ed0ed9c58d70fd71b06752ab8b34c0677`.

`WACreate:CODE6:e0ea–e0f8` returns immediately when `(WASpec.activationMask & activeMask)==0`. This precedes the actor-count increment (`e12a–e12e`), saved-spec copy (`e166`), WASpec2Info/sprite creation (`e1fa–e202`) and initial human dot grab (`e210–e216`). Consequently excluded actors have no runtime actor entry, sprite, dot attachment or collision participation. This is creation filtering, not merely suppressing their drawing.

For Walls in Child, the three right-side variants with masks14/12/8 are excluded. The lower green actor with mask15 is included. Both human specs pass mask15; the second human is separately hidden and its frame clock detached in single-player (`CODE6:dcf4–dd04`). This is a different mechanism from activation exclusion. Preserve the serialized inventory and record identity even though the active actor list is smaller. The coordinator's reported native after-release observation is consistent with this source interpretation; this worker did not perform that native comparison.

SP uses its own creation gate (`CODE6:9a90–9a9e`), before the active SP index/count increment at9ab8–9abc. Thus exclude masked-out SP records before assigning their index-derived phase. Do not transfer actor filtering to dots: `DOCreateAll:3ae2–3b06` retains dot presence while clearing selected feature fields when the low-nibble activation mask misses. Those cleared fields include bonus, goal, protection and other flag/color attributes; inline-program and initial-state fields are not all cleared by this branch. The exact dot-feature mapping stays with the prior decoder/source reviews and must be applied per feature.

## Red-hand collision inventory addition

Private addition: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/walls/red-hand-collision-profile.json`. SHA256: `6079b87232857ca827fbb512555478b1a4a9f62372b7048eefce92ada7a866ae`. Source Graphics/data.bin SHA256: `1b2286712f7783848730474051c6497323400be31fc303e078f0c748977346dc`.

It supplies group500 only:64 frames,33 source images and33 distinct original outlines. The existing red SVG's presence did not imply collision-data coverage; the Spikes profile omitted this group. Merge `groups["500"]` into the selected collision profile without replacing other groups. At Child this actor is inactive; the addition supplies complete inventory/future-difficulty data, not a reason to instantiate it now.

Each frame uses descriptorX−44 and descriptorY−43, independent of SVG alpha or shadow. All64 descriptors are30 bytes and within the source buffer. All source image dimensions match their descriptors. Every outline has exactly height scanlines; all1612 rows are nonempty inclusive spans satisfying0≤left≤right<width. Widths/heights range8–38. The union of normalized bounds is left−43,top−42,right43,bottom44 (exclusive bottom).

Frames0–32 are unreflected. Frames33–63 set flipY and share image/outline with frame64−i. Each pair has identical X bounds and satisfies rawY(i)+rawY(64−i)+height=88. Validation checks runtime reversal of scanline order while retaining the original row payload. The profile records per-outline byte offsets/hashes, raw descriptors and these assertions. This validates shape-table structure, placement algebra and reflection handling; no native red-hand crop or behavioral comparison is claimed.

Only this supplemental report and the new private profile were written. Existing source media, Spikes assets and Walls candidate files remain untouched. Follow-up writable files and source workload are released.
