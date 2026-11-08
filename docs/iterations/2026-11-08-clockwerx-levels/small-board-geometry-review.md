# ClockWerx display-grid centering correction

Doors uses the small10×7 display grid, so its logical grid origin is **(98,96)**. The earlier Doors source report/private preview incorrectly used the large-board origin(74,72). Every grid-attached absolute position therefore needs(+24,+24). The helper's explicit `origin` argument already supports this; no helper or root runtime module was changed. Original descriptor coordinates, collision scanlines, relative anchors and SVG atlases are unchanged.

## Source formula and the two board sizes

`ROStart`, CODE7:4960–4976, reads the display-size word into its local value at−0x24. In the normal play branch, `4a32–4a44` tests whether this value equals8. Equal selects rows8/columns11; otherwise the inspected source selects rows7/columns10. `4a46–4a9e` computes the **display span between outer grid points**, with48pixel pitch:

```text
columns = displaySizeRaw == 8 ? 11 : 10
rows    = displaySizeRaw == 8 ?  8 :  7

rawLocalX = trunc((playfieldWidth  - (columns - 1) * 48) / 2) - 18
rawLocalY = trunc((playfieldHeight - (rows    - 1) * 48) / 2) - 11
rawBoardB = frameOrigin + (rawLocalX, rawLocalY)
logicalGridOrigin = rawBoardB + (12,11)
```

The source arithmetic helpers perform signed integer division; the qualified sizes have exact integer halves. `4aa2–4aa6` saves the chosen display dimensions. Use explicit supported values7/8 in a bounded port rather than silently accepting every unknown header value merely because the original has an `else` branch. Editor/special-mode branches around4a16–4a30 are outside this normal-play qualification.

`GPNewGame:CODE1:5900–5952` creates a584×424 playfield and centers it within the game content bounds. Its WPCenterWithin helper (`CODE5:39cc–3a56`, reached through jump entry2be2) computes ordinary rectangle centering. For the established640×480 game content region, the playfield frame origin is((640−584)/2,(480−424)/2)=(28,28).

| Display-size word | Display columns×rows | Display span | Raw local B | Raw game-region B | Logical grid origin |
|---|---|---|---|---|---|
|8|11×8|480×336|(34,33)|(62,61)|(74,72)|
|7|10×7|432×288|(58,57)|(86,85)|(98,96)|

The private decoded Doors header records displaySizeRaw7, displayRows7, displayColumns10, **serializedRows8 and serializedColumns11**. The serialized stride is not the display width used for centering. Preserve that distinction when decoding cell indices, including the serialized boundary row/column. This report contains metadata and generic geometry only, not the level map.

`ROGetPixel:CODE7:5298–52ca` computes raw local B plus48×row/column. Its Point-offset overload at52e4–5314 adds the supplied object offset. The same raw origin therefore shifts grid-attached dots, actors, spikes, walls, doors and switches together. Existing per-class adjustments remain: WA descriptor−(44,43), SP descriptor/subcell−(8,7), WL/DR body base logical−(6,5), DS base logical−(12,11)+subcell. Do not add another(+24,+24) inside any class helper when the board origin is already(98,96).

The coordinator's native first-dot logical location(98,96) agrees with this branch and arithmetic. This worker did not perform or independently inspect a new native run.

## TX stays in playfield coordinates

**TX uses the fixed playfield/frame origin(28,28), independent of grid centering.** `TXDrawBackground:CODE6:02fe–035a` gets the active universe through jump entry2d32, then chooses its background frame at universe+0x14. It forwards the saved TX position words directly to jump entry2c2a; it does not call ROGetPixel or read the grid-origin globals.

The initialized A5 jump table independently resolves2d32→CODE4:4548 (`SUGetUniverse`) and2c2a→CODE4:1216 (`SUDrawString`). SUDrawString forwards the supplied coordinates to SUDrawText (`CODE4:126e–1376`); the destination rectangle is offset by those coordinates at132a–1336 and copied into the passed background frame. `SUCreateUniverse:CODE4:4568–4616` constructs that background frame from the playfield rectangle normalized to local origin0,0. The window/display transfer later supplies the fixed frame placement.

Thus the current adapter's TX `positionWords[0]+28`, `positionWords[1]+28` convention remains applicable to both qualified board sizes. Do not shift tutorial text(+24,+24), and do not derive TX placement from the first dot. Font metric/baseline and substituted-glyph differences remain separate from this origin correction.

## Corrected evidence and limits

Private root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/doors/`.

- `superseded-large-board/` preserves the prior report/JSON, actual-record placement profile, original isolated board PNG and report generator. Their hashes are retained in `small-board-correction-evidence.json`.
- `level-profile.json` now carries display/serialized dimensions, frame/raw/logical origins, and corrected door/switch/cap bases. Relative descriptors and art frames are unchanged.
- `candidate-door-board-small.svg` embeds the preserved isolated diagnostic PNG and translates it(+24,+24) over the original gray background. This provides the corrected private preview **without image conversion or rasterization**. It is a placement diagnostic, not new native or browser evidence. The old `candidate-door-board.png` has an explicit `.superseded.json` note.
- `preview-candidate.py` now derives origin from display metadata and writes a distinctly named small-board PNG when a later rasterization is permitted. It was edited but not run for this correction.
- `doors-astra-review.md/.json` now supersede the old absolute positions and link this correction. Their complete prior versions remain in the private archive.

The dedicated `door-source-outlines.json` convention remains **raw descriptor bounds relative to the base returned by doorGeometry/switchGeometry**. Its source-profile SHA256 is unchanged: `3ebb7768e3d23cb92abc45cbc296e45d6c3ccc3f13019d49e4ac9f0c918194bd`. Candidate manifest SHA256 remains `7d2d2b989d1fcd8bfbd8c44f73f595f07a43c2197e63f19d4a16d4effe67800f`; all47 candidate payloads and all43 preserved baseline payloads are untouched.

Validation is bounded to source branch/arithmetic tracing, jump-target resolution, metadata/placement algebra and hashes. No native/browser run, build, benchmark, image conversion, atlas generation, runtime/module edit, commit, media or save change occurred. Native current-scene phase, collisions, sound and gameplay acceptance remain with the coordinator. Correction files and source workload are released.
