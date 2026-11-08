# Doors source/helper/art preparation — 2026-11-08

Catalog4, resource223 is ready for coordinator integration and native comparison. This is source qualification and a private art candidate, not gameplay acceptance. Ten focused helper tests pass. The candidate preserves all43 payloads from the Walls silver baseline. No browser, native/emulator, benchmark, build, commit, activation, upload, deployment, media or save change ran.

## Records and active level inventory

`DRStream2Spec`, CODE6:1996–1a4a, reads two signed16-bit row/column words followed by **four separate bytes**: vertical, initiallyClosed, long, color. The decoder's two final rawWords must be split into bytes. There is no DR difficulty mask. `DRSpec2Info:1550–17a0` derives type=`(vertical?0:1)+(long?2:0)`. Types0/1 are short vertical/horizontal;2/3 are long vertical/horizontal. Color0=red,1=green,2=blue. The meaning of closed/open is also supported by the source graphics: phase0 is a solid beam, phase10 has no visible leaf image.

`DSStream2Spec:9f2c–9f86` reads four words: row,column,subcell,color. Subcell0/1/2/3 supplies(rowOffset,columnOffset)=(0,0)/(0,24)/(24,0)/(24,24). `DSSpec2Info:9d6e–9e2a` selects color frame0–2 and pressed frame=color+3. No DS difficulty mask is stored. DRCreate:1ab8–1b8c and DSCreate:9ff4–a088 create records without the WA/SP activation gate.

The initial inventory has closed long vertical red and green doors and a closed short horizontal blue door, with one matching switch per color. Exact placements and raw map records remain in the private level profile.

The level has3SP,4WL,3DR,3DS,6WP,3WA,12TX,58 present dots,9 raw bonus flags and1 raw goal flag. All three SP activation masks are15, so Child creates all three, with active phase indices0/1/2. All three WA masks are15: hero type0, separately hidden/stopped second-human type6, and green enemy type2. Each WA program reference is−1, and there are zero inline dot programs. **All six stored WP strings are unused**; no array-order assignment is justified. Both humans enable the version12 wall-check byte; the green enemy disables it. Child visible play therefore has one human and one ordinary green enemy. These conclusions use the corrected Child and callback reports, not a fresh native run.

## Switches toggle; they are not hold-to-open controls

`WACheckSwitches:cc02–cc4e` obtains the first visible switch whose original outline overlaps the actor (`DSCheckCollisions:a256–a29c`). It compares that switch index with the actor's saved previous index. Only a changed index invokes `DSActivate(new,old):a0ac–a158`. Hidden actors produce index−1; eligible ordinary enemies can activate switches too. Types4/5 are excluded from this ordinary-switch branch through WAInfo+0x28; neither occurs here.

On entering a visible switch, DSActivate calls `DRActivateByColor:1c68–1ca0` **before** incrementing its occupancy count. Every matching-color door is activated, even if another actor already holds that switch. The first occupant changes the switch art to color+3. Leaving decrements the old count; the last release restores its color frame. Leaving does not activate a door. A continuous overlap does not retrigger. Moving directly between two same-color switches is a new activation. Actor color does not restrict which switch it may press. Source order is new-switch activation/increment, then old-switch decrement.

There is no automatic close deadline in this subsystem. A rotating hand repeatedly entering/leaving a switch can repeatedly toggle its door. Do not invent a hold timer or interpret the green hand's periodic switching as a timed door.

`DRActivate:1bb0–1c54` starts a stopped closed door in direction+1/opening with sound1, or a stopped open door in direction−1/closing with sound3. An in-transit activation negates direction and requests sound3 even when reversing back toward open. The source also handles a nonzero direction observed exactly at an endpoint by stopping without sound; the helper retains this branch.

## Door phases and clock

Each type has11 phases. Primary frame=`type*11+phase`; the second leaf is primary+44. Closed phase0 and adjacent phase1 are represented mostly by the first leaf; intermediate phases split into two leaves. Open phase10 is empty. Do not collapse the pair into one scaled rectangle.

`DRFrameProc:18fe–1972` calls SUAutoFrame once, applies frame+44 to the second leaf, and stops when the new frame equals the type's closed/open endpoint. Arrival while moving negatively requests sound2; arrival while opening is silent. `SUProcessSprite:CODE4:3ebe–3f5c` calls it once when its saved client count differs; it does not loop over missed counts. This differs from WA's inner per-delta loop.

`DRInit:14e6–14f4` requests **scalable80**, with flag1. This is distinct from DE's unscaled80. `GPInit:CODE1:5748–5750` registers scalable80; MTAddClient therefore selects divisor1. At Child master60/secondary100, `MTAdjustPeriod:CODE7:3656–36ae` gives `floor(floor(80*100/60)*100/100)=133` timer units. At60guest ticks/sec and16units/tick, sustained animation is960/133≈7.218callbacks/sec. Ten callbacks take about1.385seconds plus shared-clock onset/observation phase. This is a source cadence calculation, not measured runtime timing.

The strict MT accumulator condition remains `remainder > divisor`; do not replace it with≥. The underlying clock exists before the round. DRSpec2Info snapshots its current client count at reset (`168a–1694`). Normal single-player death freezes the door sprite layer; underlying clocks continue. After the DE barrier, DRReset:17c4–1828 restores all saved door states and snapshots the current clock. DSReset:9e4e–9e96 clears occupancy/restores switch art; WAReset clears actor contact indices. Explicit restart and normal round reset must reset all three parts coherently. The helper does not own death orchestration or master-rate changes.

## Placement, caps and collision

For this small-board Doors level, raw B=(86,85), logical grid=(98,96), pitch48. The earlier use of large-board B=(62,61)/grid=(74,72) was incorrect; the per-object relative offsets below remain valid. DR body location uses B+(6,6), so **body base is logical cell−(6,5)**. Source descriptors are then added. DATA A5−0x89a supplies(+6,+6); the endpoint/type tables at−0x896 through−0x85e supply cap offsets and wall connections.

Relative to the body base, cap locations are:

| Type | First cap | Second cap | Far wall cell delta / mask |
|---|---|---|---|
|0 short vertical|(27,−10)|(27,58)|(row+1,col),8|
|1 short horizontal|(−10,27)|(58,27)|(row,col+1),4|
|2 long vertical|(27,0)|(27,96)|(row+2,col),8|
|3 long horizontal|(0,27)|(96,27)|(row,col+2),4|

Cap frame=`2*color+(vertical?6:0)`; only the far cap increments by1 when the corresponding merged wall cross-mask is present (`DRSpec2Info:174a–1796`, `WLSegExists:b8d2–b8fc`). Generic nearby wall presence is insufficient. In Doors, cap pairs are red6/6, blue4/5, green8/9. `DRDrawBackground:1dfa–1e6c` draws caps into the background and `DRMakeSprites:1ce2–1de4` retains cap sprites for collision. Animated leaves are layer8; switches are layer9.

Switch base is logical cell−(12,11)+subcell offset; add its descriptor(2,2). All three switches use subcell3. Original level placements are retained only in the private profile; generic placement offsets above are independent of the map.

Graphics group1300 supplies88 leaf descriptors, group2900 twelve caps, group1000 six switch states. **Group3800 supplies88 separate lethal-zone descriptors**, not visible art. The private profile preserves194 total frames,158 collidable frames, all original scanlines and outline hashes. Empty/noncollidable descriptors retain outlineIndex−1; return null collision objects for those frames. All valid scanline counts equal source height; inclusive spans are within source width; no frames in these groups require vertical reflection.

`DRCheckCollisions:1e94–1f9e` checks doors in record order. Within a door it checks both leaf outlines; the **second leaf wins if both overlap**. For lethal-enabled checks it places the matching group3800 descriptor at that selected leaf's location/frame and tests its outline. A lethal overlap calls RODied(hero,13) and returns−1: there is no bounce and no wall/door guard increment from this result. The test is not gated on direction; do not enable the lethal zone only while closing. Nonlethal leaf contact returns the door index. Only after every door's leaves miss does it scan cap outlines. Caps bounce but do not use the lethal group.

`WACheckDoors:cfae–cfea` always enables that lethal test and bounces only for a returned index≥0. In the human WACollide branch it follows enabled wall checks only when no wall response occurred. The ordinary enemy branch (`d0ee–d122`) does **not** call WACheckDoors; the green enemy here also disables walls. It still reaches switch checks. Do not apply human door collision/death to this green enemy. Nonlethal human door contact shares the existing fourth-consecutive wall/door guard. Human current-pose collision order and separate periodic human–enemy overlap remain as described in `walls-callback-order.md`.

## Helper and integration contract

New public files only: `prototypes/clockwerx-html5/doors.mjs` and `doors.test.mjs`.

- `decodeDoorRecord`/`decodeSwitchRecord` qualify raw words into explicit fields; retain raw records separately. The bounded helpers reject unknown axes, lengths, colors and subcells.
- `doorGeometry(spec,origin,hasWallArm)` returns body/cap bases and cap frames. `switchGeometry` returns the switch base. The wall callback receives(row,column,mask).
- `createDoorSystem(doorSpecs,switchSpecs,{clockCount})` snapshots an existing scalable80 client count. `contact(actorId,index)` takes the first visible source-outline switch match or−1, at that eligible actor's collision stage. `observeClock(count)` takes one door sprite-processing observation. Both return per-door sound requests; callers own playback.
- `snapshot()` returns door phase/direction and both leaf frames, switch occupancy/art frames, and the saved clock reference. `reset(currentClientCount)` restores saved initial state and clears every actor contact/occupancy. Underlying clock creation/scaling/freeze remains with the coordinator.
- `findDoorContact(doors,actorOutline)` takes already-placed `{leaves:[a,b],lethalLeaves:[a,b],caps:[a,b]}` with original integer scanlines. Its result explicitly distinguishes `lethal`, `bounce`, and `guardContact`. Do not increment the guard on its lethal return. Existing WABounce behavior, RODied latching and guard are outside this helper.

**Dedicated profile anchor contract:** unlike the shared baseline profiles, every frame in `door-source-outlines.json` is relative to the base returned by doorGeometry/switchGeometry. Its left/top are the raw descriptor values. Add the returned base exactly once. Do not apply another−6/−5, WA, SP or dot adjustment. This file is separate and the baseline `source-outlines.json` remains byte-identical. The SVG atlas frame records use the same base-relative x/y convention. Skip zero-size frames.

## Private candidate and generation constraints

Candidate: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/doors/assets/`. The copied complete baseline has43 unchanged payloads. Three SVG atlases plus `door-source-outlines.json` make47 candidate payloads. Manifest SHA256=`7d2d2b989d1fcd8bfbd8c44f73f595f07a43c2197e63f19d4a16d4effe67800f`.

`vectorAssets.doors` contains leaves/caps/switches atlas metadata and frames with `{frame,sourceGroup,sourceFrame,sx,sy,x,y,width,height}`. Crop at sx/sy and draw at base+x/base+y, retaining each descriptor's dimensions. Leaf phases share the source placement; color resides in the separate caps, not a recolored door beam. Switch colors become white in the pressed frames while their dark colored bezels remain. Each atlas cell is112pixels with ample separation; no phase interpolation is required by the source.

The beam candidate fits straight convex planar faces to the source palette regions, replacing pixel stairs and noisy seam detail with continuous edges and a small authored seam. Caps use straight extrusion planes and two colored lights. Switches use a smooth metallic disk, asymmetric highlight and two status lights. Source palette1000 with gamma0.7 retains the Walls silver findings: highlight238, face202, side79, shadow106, bevel130. No baseline backdrop, hand, dot, spike, wall, death, sound or collider payload changed.

ImageMagick locally rendered all three atlases; `candidate-contact.png` was inspected alongside `source-contact.png`. `candidate-door-board-small.svg` corrects the old placement preview by translating the preserved image24pixels in each axis; no new raster conversion was performed for the correction. The old `candidate-door-board.png` is explicitly superseded and archived. These are local diagnostics, not an actual browser/native comparison. Switch surface detail and beam seam/shadow edges remain approximations. No native pixel-match or SVG error score is claimed. `build-candidate.py`, `preview-candidate.py`, `source-profile.json`, and `level-profile.json` are private reproducibility/inventory files; hashes are in the companion JSON.

## Remaining acceptance and release

Ten tests cover byte schema, four geometry types and far-cap masks, activation/reversal sounds, ten-step endpoints, color fanout, continuous-contact suppression, multiple occupants, same-color switch transfer, skipped clock observations/reset, second-leaf precedence, lethal guard exclusion, and all-leaves-before-caps ordering. They use synthetic geometry and records. They do not qualify source callbacks in a live game.

Root still needs native Doors appearance/anchors, initial green-hand switching, repeated entry/reversal, clock cadence, human bounce versus lethal gap contact, fourth-contact trap behavior, death freeze/reset, goal completion, actual-browser atlas rendering and audio playback. Cross-layer traversal phase and the existing continuous120Hz input/pose approximation remain explicit limits. No complete-game, save, physical-controller, performance or full-audio claim is made.

Work comprised source schema/callback tracing, original descriptor/outline extraction, generic helper and tests, small private SVG generation, local visual inspection, and this handoff. Active time was not separately instrumented. Only the two new helper/test files, this report/JSON, and private `doors/` outputs were written. Writable files and source workload are released to the coordinator.
