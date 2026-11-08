# Some Dots source preparation — 2026-11-08

Catalog9 is **Some Dots**, RND2 resource11330, verified against the private catalog queue. This is source preparation, not activation, visual acceptance or gameplay qualification. Rings, waystations/checkpoints and ordinary-enemy protection are new requirements. The bounded static-ring helper and corrected protection helper pass15 focused tests together. All files and source workloads are released to the coordinator.

## Inventory and mode boundaries

Version12, large11×8 board, raw time90;74 present dots,7 bonuses,1 goal;51 white ring dots,2 waystation marker dots,1 invulnerable dot. Ordinary dots also include red and green. No inline dot programs occur. Nonempty blocks: SP1,DR1,DS1,PU2,WY2,WP2,WA4,TX8. Exact map coordinates, text, programs and original artwork remain private under `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/some-dots`.

Child creates the spike, both WY records and all four WA records. The usual second-human type6 is not a second visible player in Child single-player. Ordinary enemies are red/type1 and green/type2, each clock class1 (multiplier1/divisor2), checksWalls=false, active program. Both PU records are inactive in Child (masks12 and14); one is kind2, so other difficulties require additional qualification. The door is initially closed, long, horizontal and red/type3; the red switch uses subcell3. There are no wall records. Text is plain Geneva9/12.

## Protection correction and appearance

The earlier Spikes follow-up mistakenly called raw0x2000 protection. `DOCreateAll`, CODE6:3a9c–3aa6, maps **raw0x40** to DOSpec+0xb. `DOCreate:378a–3794` copies it to DOInfo+0x1f; `DOIsInvul:3f76–3f94` reads that field. DOSpec's stack-local base is ff6a; raw0x2000 at3a8a maps to a separate DOSpec+0xd field. The earlier claim is retracted in the follow-up report and requirements. Accepted catalog1–5 were checked and contain neither bit; their runtime gate still rejects both. This does not qualify raw0x2000 behavior.

`WAHitEnemy:e5a2–e5d2` respects the hero's protected current pivot only for the ordinary-hand path (enemy WAInfo+0x28 true). Both enemies here qualify. Protection requests sound40 instead of RODied; spikes still use their separate death8 path. Human arrival on a protected dot requests sound46 (`DOGrabbed:4748`). This is not general hazard immunity.

Protection creates separate DO miscellaneous type2 over the ordinary dot. `DOGetLookMisc:2e8c` selects group300 frames117–124. `DOMiscFrameProc:25ba–2604` reverses direction at both endpoints. The type2 DATA table at A5−0x832+2*14 points to **A5−0x7a14, the unscaled50 client** created at CODE6:2106–2112; it sets step+1 and visible. GPInit registers unscaled50 at CODE1:578a–5798, giving base50/divisor1. This overlay clock differs from the ring/checkpoint unscaled80 clock. Keep the separate animated overlay rather than substituting a base-dot color.

## Ring lifecycle and permissions

Raw0x8 maps to DOSpec+7 and runtime look0x200. `DOGetLook:2cb6–2cd6` sets min=23+7*colorIndex, max=min+7 inclusive. Actual rings here need white23–30; extra red/green30–44 remain inventory only. Initially a static ring is visible, at min with step0, available to both humans and nonhumans.

Only human `DOReleased:4818–48fa` starts collapse. It immediately clears human availability, increments both sprite frames once, sets main step+1 and attaches the persistent unscaled80 client while snapshotting its current count. It requests sound42 and calls WAOrphanOccupants, excluding the releasing actor. Integrate this at successful transfer/release; occupancy duration or ordinary contact does not trigger it.

`DOOneFrameProc:2708–2804` hides both sprites on reaching max, sets step0, and stores **fresh TickCount+[300,600,900,1200][difficulty]**. Child uses300 guest ticks. On a later callback, only latchedTick **strictly greater than** the deadline shows both at max−1 and sets step−1. Human availability stays false while growing. Reaching min calls DOResurrectRing, restoring visibility, frame and human availability and detaching the static timer. DOReset also resurrects rings.

The clock is the shared **unscaled80 MT client, base40/divisor2**, independent of gameplay speed scaling. SUProcessSprite invokes one callback per observed count change; missed counts do not catch up. Hidden rings keep their timer and check the deadline at those callbacks. The nominal five-second Child delay starts at complete disappearance, followed by reverse animation. A single guessed respawn-seconds constant is insufficient.

Human grab permission is DOInfo+0x11; nonhuman permission is+0x10 (`DOCanGrab:4494–44d4`). Collapse clears only the human byte. DOFindGrabbable checks configured presence/position, not visual visibility. An ordinary enemy can therefore choose a collapsed ring; `DOGrabbed:475c–476a` then sees the unavailable human byte and calls WAOrphan on that enemy. Keep collapsed dots in nonhuman lookup. Orphaning occupants and an enemy arriving at an unavailable ring are actor hooks that the ring helper does not own.

`createStaticRingDot` in `special-dots.mjs` implements only static-ring state. Supply persistent clock counts, latched guest ticks and optionally separate fresh guest ticks. `release` returns sound/orphan requests; `snapshot` separates human and nonhuman permissions from visibility. Skip observations during frozen play; reset snapshots the current clock. Moving, up/down and combined special dots are excluded. Four tests cover immediate denial, nonhuman release, callback coalescing, strict expiry, reverse revival and reset. These are source-contract tests, not native equivalence.

## WY checkpoint definitions and state

`WYStream2Spec:f468–f4ee` reads grid position, half-index word, signed direction word, then a32-bit activation mask for version>9; earlier versions default15. `WYCreate:f558–f5ee` filters by mode before deduplicating positions, with capacity10 unique records. Duplicates replace their12-byte definition. New records call `DOMakeWaystation:4b42–4b7e`, setting saved DOSpec+8/DOInfo+0x1c and runtime look0x100. Raw0x10 is an editor marker in this path; the bit alone does not create an active checkpoint. WY is the authoritative active definition.

`DOGetLook:2c88–2c98` selects group300 frames79–89. Human DOGrabbed invokes WAWaystation, attaches unscaled80 for a static checkpoint and sets step+1; at max it stops/detaches. Selecting another waypoint resets the previous main/secondary sprites to79, stops them and detaches the static timer. DOReset clears the selected-waypoint pointer. Nonhuman grabs do not update saved checkpoints or activate this animation.

`WAWaystation:eca0–ed2e` compares the current grid position to the actor's **saved reset WASpec** position. Only a different position overwrites that saved position and copies WY reset half-index/direction. Live angle and pivot do not change. Player slot1 adds16 half-index units. WYGetInfo fallback is half-index24,direction−1,mask15; both actual records supply those values explicitly. Sound23 occurs even when the saved checkpoint already matches.

For a changed checkpoint, WAWaystation calls `SCSetCurTimer`, CODE7:73e6, copying current remaining integer time to its saved reset value. `SCReset:6e74` restores through SCSetTimer using that value. Therefore normal single-player death retains the established frozen effect/barrier→ROReset sequence, returning the hero to checkpoint position/direction/angle/time while ordinary callbacks restore ring/bonus/door transient state. It is not a whole-board snapshot. Explicit Restart Level first restores original actor/timer specifications through WARestartLevel/SCRestartLevel. Re-entering the same saved checkpoint does not refresh its timer.

## Active enemy programs

Both enemies have actual WP references, initial PC1 and alphabet n/s/b. `WAControlFromPC:caba` consumes a command and wraps one-based PC even when its action fails. Decisions happen at cardinal source frames while not sliding. n is no action; s requests transfer; b requests bounce. `WAAction:c65e` first calls nonhuman DOCanGrab. Eligible s reverses direction and performs WAGrabDot, including old-release/new-grab hooks and opposite-end phase shift. Eligible b reverses at the existing pivot. Failed lookup is a no-op after PC has advanced. Earlier More Spikes bounce-only coverage does not cover this level. Exact strings remain private.

Activation requires checkpoint saved spawn/time/reset hooks; ring permissions and actor orphan hooks; protected contact/overlay; n/s/b transfer semantics; and new special-dot artwork. Existing Oil support alone proves none of these. Keep other difficulties, unrelated flags and combined moving-dot cases rejected until separately qualified.

## Private artwork and remaining gates

Private inventory retains original group300 descriptors and existing collision outlines plus group4100 secondary descriptor/image references for41 frames per group. Required frames are white ring23–30, checkpoint79–89 and protection overlay117–124; extra red/green ring frames are inventory only. No raw outlines or bitmaps entered Git; no conversion ran. Main-dot placement uses established logical center minus(16,15), then each raw descriptor offset. Preserve variable bounds. Secondary descriptors contain empty/offscreen sentinel shapes; do not normalize those into visible shadows.

Future smooth SVGs must retain source ring aperture and shrinking silhouette, checkpoint transition endpoints and separate moving protection overlay. Use smooth geometry rather than aliased outlines; retain original outlines independently for collisions. Preserve every accepted baseline payload byte. Actual runtime/native comparison must still qualify new appearance/shadows/anchors, clock phase, checkpoint death return and timer, hidden-ring enemy behavior and a goal path.

No native, browser, emulator, build, benchmark, conversion, media/save mutation, manifest activation or commit ran. No implicit level acceptance or scope waiver is granted. The narrow hazard correction and four-test ring helper, reports and private inventory are released.
