# Spikes death effect source review — 2026-11-08

The bounded particle implementation and private smooth atlas are ready for coordinator integration. **This review corrects the prior single-player death interpretation in spikes-followup-review.md. Single-player death freezes play and resets the round after the effect; it does not preserve the board and restore only the hero.** The coordinator's native screenshots prompted the branch audit that exposed that error. No life counter is introduced.

## Particle geometry and frame lifecycle

`DEActivate`, CODE6:10fe–1308, marks the affected hero backgroundized and obtains its current dot position and source sprite frame. The inspected numeric constants and SANE sin/cos operations produce a length48 endpoint at `frame*2π/64`. Both components are truncated toward zero **before** applying the random fraction. Fifteen iterations each draw an unsigned16-bit Random value modulo100, multiply both integer endpoint components by that percentage, then divide by100 with truncation toward zero. The resulting particles are stationary along the hand, including its pivot and excluding its exact endpoint. There is no outward velocity, gravity or radial random spray.

Each iteration then calls `DECreate`, CODE6:0f8e–10de, which makes a separate unsigned16-bit Random draw modulo60 for the start delay. Draw order is position, delay, position, delay. The current scene guest tick is the creation reference. `DEFrameProc`, 0e86–0f64, waits until the observed guest tick is **strictly greater** than that deadline. Eligibility is checked only when the sprite's animation client count changes. The first eligible callback shows frame0. Each later callback advances one frame through9; the next callback removes the particle. The first removed particle calls WAHide on the affected hero. Completion requires all15 particles to be removed; it is not a fixed number of seconds.

`DEInit`, 0d72–0d7e, requests an unscaled80 client. It shares registered unscaled base40 with a client divisor2. `TM` subtracts16units per guest tick; `MT` advances on remainder strictly greater than divisor. `SUIsFrameTime`, CODE4:3e6c–3e98, compares current count with a saved reference and snapshots it on change. `SUProcessSprite`, 3ebe–3f5c, invokes the callback once for that change. Missed counts do not run multiple callbacks. A long pause therefore must not instantly finish the effect from an elapsed-time formula. Keep underlying timers alive across deaths and round resets; capture the current count at particle creation.

`WAGetHeroInfo`, CODE6:eed8–ef38, supplies current dot pixel B−(4,4) (or the current floating-position branch). `DECreate` adds sampled offset and DATA Point(−15,−15), then selects the source descriptor. With the accepted logical pivot B+(12,11), final image placement is **particle logical anchor + descriptor −(31,30)**. Frame0 descriptor(x23,y24) consequently starts at anchor(−8,−6). Moving-dot/slide death requires the actual current pivot position; the bounded Spikes integration uses its stationary dot positions. Native per-frame death anchor matching has not been performed.

## Correct single-player death and star restart ordering

The earlier report followed the wrong side of the game-type branch. In `GPCheckProgress`, CODE1:606e–6072, gameType0 takes the branch to6088. That path pauses the score timer (`SCPauseTimer`, CODE7:74a6), then enters substate3. The DEActivate→ROResurrect path at609e belongs to the other mode branch and must not be substituted for single-player behavior.

`GPSetSubstate(3)`, CODE1:6aa8–6ae8, calls `ROFreeze(false)`, then activates DE for dead heroes and records score state. `ROFreeze`, CODE7:4f92–4fda, freezes ordinary sprite layers, exempting the effect/display layers; death layer12 and flourish layer14 remain processable. Underlying global MT clocks continue. Ordinary actors and spike sprite phases should not advance during this frozen scene.

Substate3 processing at CODE1:60ea waits for both DEIsComplete calls. At6108–6120 this inspected binary calls RODidDie but explicitly clears its local Boolean results before testing them. Thus, absent a pending explicit restart, it reaches **613a: ROReset → GPSetSubstate(1) → SUReveal**. The alternative target5bd4 is GPEndGame, not a round-begin helper. These details are recorded because following the apparently named calls without the surrounding branches caused the earlier error.

ROReset, CODE7:3de6–3e46, runs registered reset callbacks, redraws, activates goal initial flourishes, then player initial flourishes, and clears round win/death flags. Relevant callbacks include:

- WAReset, CODE6:dd46–de4a: restores every actor from its current saved specification, initial grabs and action state. Spikes has no waystations changing those saved spawn specifications.
- DOReset, CODE6:2220–230c: restores originally configured bonus-dot state and transient dot state.
- SPReset invokes SPSpec2Info: initial sprite i%4 and a fresh reference to its current shared phase clock.
- SCReset, CODE7:6e74–6ede: next bonus value1000, round bonus/score storage zero, other round bookkeeping reset; timer restored through SCSetTimer from the current reset specification. This does not establish the complete total-score policy; the coordinator owns that SC review.

`DOInitialFlourishes`, CODE6:3eb8, and `WAInitialFlourishes`, e30a, are reached from ROReset at CODE7:3e0e/3e14. Both call FLActivateMarquee, whose6522 assignment enables the shared marquee flag. Consequently reset both star chains **after the death barrier when the round reset is applied**, using the reset hero direction and pivots. No universal hero-only respawn hook is justified. Explicit Restart Level additionally restores level-start saved actor/timer specifications before ROReset. A fresh round reveal/start interval remains a separate UI/timing qualification.

The coordinator's existing native-play-01 sequence corroborates explosion, hero disappearance, restored spawn and renewed player/goal stars. I inspected its swing-10 and after-release images. Its report records1730frontend ticks,2328guest ticks, zero budget-exhausted frames and zero assertions. It is visual evidence, not an automated lifecycle assertion or performance result. Native score preservation, bonus restoration and exact callback-to-frame timing still need matched observation.

## Integration contract and private candidate

New public files are `prototypes/clockwerx-html5/death.mjs` and `death.test.mjs`; hazards files are untouched. Seven synthetic tests pass. Tests cover interleaved random draws, signed truncation, strict start gating, shared clock phase, one callback for skipped counts, last-particle completion and invalid inputs.

Create a persistent `createDeathClock()` for the scene and advance it on every active simulation pass, including the death interval. Factory:

```js
createDeathEffect({
  pivot: logicalCurrentPivot,
  frame: sourceFrame(hand.angle),
  randomUnsigned: nextUnsigned16,
  clock: deathClock,
  advanceClock: false
})
```

Then `effect.update(integerGuestTickDelta)` reads that already-advanced clock. Alternatively the default advanceClock=true advances it inside update; do not advance it twice. The effect has `complete`, `remaining` and `heroVisible` getters. `snapshot()` supplies visible `{id,x,y,frame}` particles only. It mutates no board, hero, score, bonus, life count or round state. The supplied RNG is explicit; reproducing the Macintosh Random generator/global seed and other consumers is still unqualified.

Private candidate root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/spikes/death/`. `assets/manifest.json` extends the accepted qualified Spikes baseline with `vectorAssets.death`: one640×64 SVG atlas plus ten frame records `{frame,sx,sy,width,height,x,y,sourceGroup,sourceFrame}`. Crop the atlas at sx/sy with width/height and draw at particle.x+x, particle.y+y at the same size. This candidate contains25 payloads; **all24 accepted baseline payloads are byte-identical**. `death-profile.json` preserves raw descriptors privately.

The source group2600 phases run from a small bright spark through expanding yellow/red fire to brown smoke and isolated embers. The candidate uses shared palette fitting, spatially smoothed color fields, simplified closed cubic curves, and final ember ellipses. It does not preserve pixel staircases. The rendered SVG was inspected locally through ImageMagick; browser rendering and native side-by-side matching are unqualified. The palette/color contours are a smooth candidate, not exact source raster reproduction.

No browser, emulator, build, benchmark, commit, upload, original-media edit or save modification ran in this increment. The coordinator owned the native workload. Source investigation, seven tests, private generation and local SVG inspection are complete. Files and workload are released to the coordinator.
