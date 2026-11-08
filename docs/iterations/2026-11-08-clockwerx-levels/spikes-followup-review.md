# Spikes follow-up source qualification — 2026-11-08

This supersedes the candidate anchors, timer uncertainty and incomplete death semantics in `spikes-astra-review.md`. Placement, timer conversion, protected-dot contact and 64-angle initial phase are ready for integration. Smooth artwork, selected runtime speed and gameplay still require coordinator validation.

## Source placement reconciled with native evidence

Let B be the round's raw grid coordinate. `ROGetPixel:CODE7:5298–52ca` adds 48×column/row to the round origin; its Point overload at `52e4–5314` adds its offset. `DOGetInitialPixel:CODE6:2a80` uses DATA offset(−4,−4). `WAGetPixel:c30e` adds another(−28,−28), giving hand location B−32. `SPGetPixel:981c` uses(+4,+4), then the independently indexed subcell offsets. `SUMoveSprite:CODE4:3bfc–3c60` adds the source descriptor anchor to location; `SUGetLocation:3d1a–3d44` removes it. Collision bounds remove byte-alignment padding (`4130–41ae`) and retain the unpadded source-image placement.

`GPNewGame:CODE1:5900` creates a584×424 playfield. `ROStart:CODE7:4a46–4a9e` computes local Bx=(584−480)/2−18=34 and By=(424−336)/2−11=33. With frame origin(28,28), **B=(62,61)**. The established logical grid origin(74,72) equals **B+(12,11)**. Therefore:

| Frame | Top-left relative to logical grid pivot |
|---|---|
| SP | subcell + descriptor −(8,7) |
| WA | descriptor −(44,43) |
| Normal dot, descriptor(11,11) | (−5,−4) |

The earlier symmetric hand offset−44 tolerated a one-pixel Y error. The coordinator's prior frame37 source match—pivot(122,120), observed top-left(81,100), raw descriptor(x3,y23)—independently proves x−44/y−43. This is not a half-open rectangle or128-angle issue. The coordinator's new319 spike crops across29frames and all four phases verify x−8/y−7, typically MAE≈0.43 for unoccluded gamma0.7 source pixels; enemy-occluded crops are outliers. Private evidence is `spikes/native-anchor-review.json`.

The new private `spikes/qualified/` profile uses these per-axis offsets for all260 source collision frames. The old candidate remains unchanged. All twenty baseline payloads remain byte-identical; parent must align the unchanged canonical hand SVGs separately. The four spike SVG descriptors use the accepted native placement; smooth contours and shading remain candidates. Do not use candidate−7/−7 or the initial follow-up's superseded−8/−8 inference.

## Source clocks and actual initial angles

`TMInstallTimer:CODE5:0d3c–0d7e` initializes period, zero count, current Macintosh TickCount and remaining period. `TMLatch:0dd0–0e12` subtracts **16units per elapsed guest tick**, adding period/incrementing count while remaining≤0. Gaps exceeding5000units collapse to one base event. `MTAddClient:CODE7:3530–35b0` chooses the first matching scalability flag/base period dividing the client period. `MTLatch:33f8–3444` accumulates base counts, advancing while **remainder > divisor**, strictly greater. `createSourceTimerChain` implements these accumulators and the long-gap rule, without claiming host performance.

SP requests unscaled200 (`CODE6:9746–9752`), selecting registered unscaled40 (`CODE1:5776–5784`) with divisor5. Shared phase clock p is `floor((clientCount+p)/4)` (`9c74–9c98`). Spike i binds p=`i&3`, starts frame=`i%4`, and stores the current phase-clock reference (`98be–9956`). Subsequent clock changes advance and wrap its four frames. Sustained cadence at60guest ticks/sec is **1.2frames/sec**, cycle **10/3sec**, with quantized onset/phase. Timers preexist the round; preserve creation-time reference instead of assuming zero phase. These unscaled clocks are unaffected by difficulty/master rates and continue through normal single-player deaths.

WA uses a separate scalable23 client: `PAInit:CODE7:3718–372e` sets47/derives62; `WAInit:CODE6:bff6–c010` requests integer47/2. `GPInit` registers scalable23 and master choices `[60,75,100,150]` (`CODE1:56ec–5704`, `579e–57ae`). `GPSetMasterRate:585a–5876` selects by difficulty. `MTAdjustPeriod:CODE7:3656–36ae` applies `floor(floor(period*100/masterRate)*100/secondaryRate)`; zero rates effectively stop the clock. Secondary rate defaults100 but can change. Hero class0 and Spikes enemy class1 both divide by2; slowdown changes enemy class1 to4. At60/100, period23 becomes38units, giving **960/76=12.6316source frames/sec** at60guest ticks/sec; at100/100 it is **960/46=20.8696**. Confirm the selected native difficulty enum/secondary factor before choosing a port speed. WA also caps catch-up (`CODE6:e70c–e724`).

**There are64 actual source angles.** `WASpec2Info:dcb0–dcbe` doubles serialized word+6. `WASetFrameIndex:c248–c26c` masks63, adds frame-range base and selects the sprite frame. `SUSetFrameIndex` and `SUProcessSprite` use that value directly as `frame*46` to select descriptors (`CODE4:39da–39e2`, `3f1a–3f2a`). `WAHeroAnimate:d46a`/`WAEnemyAnimate:d8d0` use ordinary sprite frame advancement. None divides by2.

Canonical right-facing SVG angle, screen Y down: `((2*halfIndex)&63)*2π/64`. Descriptor0 points right,16down,32left,48up. Half-index24 means **frame48/270°**, and40 means **frame16/90°**. Existing Movement135° is not the original reset phase; delayed native captures may show later phases. `actorInitialFrame` and regression tests enforce this distinction.

## Protected dots and contact

`DOIsInvulnerable:CODE6:3f76–3f94` reads DOInfo+0x1f. `DOCreate:378a–3794` copies DOSpec at DOInfo+0x14, so this is DOSpec+0x0b. `DOCreateAll:3a8a–3a96` loads it from first flags-word **0x2000**, only for present dots, clearing it if activation mask misses active mode (`3ae2–3af6`). This is independent of bonus, goal, initial0x4000 state and visual color. `isProtectedDot` exposes the rule.

After visible-enemy outline contact and the same-pivot angular gate, `WAHitEnemy:e5a2–e5d2` tests enemy WAInfo+0x28. This is true for ordinary hands, false for types4/5 (`daa4–dade`). If true and the **hero's current pivot** is invulnerable, it plays sound40 without reporting death. Otherwise it calls `RODied(hero,0)`. Type5 has an earlier special branch and is outside this ordinary-hand rule. Spikes has zero protected dots and enemies of types2/3, so its qualified enemy contacts are lethal. SP bypasses dot protection and calls `RODied(hero,8)`.

RODied's second argument is forwarded to sound playback;8 is the spike death sound/reason argument, not a damage amount. `RODied:CODE7:5166–51cc` ignores the inactive second human and already-won heroes, latches death and plays its sound only on the first transition.

## Death correction — superseded by death-astra-review

The earlier hero-only single-player respawn conclusion was incorrect. A branch audit prompted by the coordinator's native screenshots proves gameType0 enters the frozen death substate, waits for the particle barrier, then calls ROReset and reveal. WA/DO/SP/SC reset callbacks run; both initial star chains restart. The hero-only DEActivate/ROResurrect branch belongs to another mode. See `death-astra-review.md` for exact addresses, reset ordering, effect helper, private atlas and remaining limitations. Do not use the superseded preserve-board conclusion.

SP sprite-clock clarification: i%4 is the initial frame; floor((clientCount+(i&3))/4) is a shared clock reference. SUProcessSprite advances once when that value changes and saves it, rather than adding an absolute quotient or catching up missed counts.

## Delivery

Eleven synthetic tests pass in `hazards.test.mjs`, including protection gating,64-angle initial phase, strict clock thresholds and long-gap collapse. The private qualified profile has260 original source frames; all twenty prior payload hashes are unchanged. Companion JSON records current paths/hashes. No browser/emulator/build/benchmark, original-media/save change, commit or upload ran. Source workload and writable files are released to the coordinator.
