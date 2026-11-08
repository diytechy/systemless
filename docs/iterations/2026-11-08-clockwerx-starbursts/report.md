# ClockWerx starbursts added to the SVG pilot

Accepted and activated on SVG-Port from52d04155 after the user explicitly requested Astra investigate triggers and match timing/appearance. The source calls these flourishes/marquees: initial attention effects attached to the player pivot and flagged goal dots, independent of mouse movement. The earlier loose label “cursor stars” is superseded. [Astra review](astra-review.md) describes source paths, timing, private asset generation and limits; [root evidence](evidence.json) records independent checks and activation.

## Original behavior and implementation

Eleven source frames form each pale-blue/white starburst. At nominal60guestticks/sec, frames advance every1/24sec; a successor starts at frame5(0.208333sec), while the old particle continues through its0.458333sec lifetime. The eight-position ring has radius24logical pixels (diagonals17,17). Goal advances clockwise; player starts in the direction opposite the initial hand rotation. Both spawn immediately at offset0, resolve the anchor at each new birth, and leave old particles at their birth coordinates. Layer14 supports drawing flourishes over hands/text.

These are initial attention cues. Original WAAction disables successor spawning only for a human's valid dot action after DOCanGrab succeeds; holding/releasing a modifier before a valid encounter does not suffice. Accepted immediate reverse also disables. Existing stars drain naturally; restart re-enables the cues. The SVG pilot follows its actual player swing/flip/bounce/reverse events, ignores demonstration-hand events, and stops spawning before the corresponding particle update. Pause stops active simulation; completion freezes the bounded scene. No campaign/award-screen random flourish behavior is added.

Source timerparameter40,16units per guesttick and default master rates yield2.5guestticks/frame. Root captured three original full-board traces:150stationary-pointer,144relocated-pointer and160reverse samples,454total. Root independently rechecked681source-pixel matches against private gamma-corrected sprites and recomputed the fits:2.49860/2.49056ticks perframe on the first two controls; both player/goal agree. PNG readback slowed wall cadence to54.49/57.31ms perframe. Use the nominal1/24sec cadence, not those slowed wall intervals. Latest-worker tick metadata can lag presentation; this is a source-clock normalization, not original-hardware/cycle-exact certification.

The stationary pointer remained over the diagnostic toolbar. The relocation trace used short native clicks on empty background in Keyboardmode; DOM event logs and source trigger paths support the pointer-independent behavior. The reverse trace corroborates disabling/draining, not a persistent direction change. Large-star matches cease around0.411sec after the DOM KeyC event and the final board is star-free; exact input-to-guest acceptance and the last tiny-particle frame are not measured by this classifier.

Original group2400 supplies11frames and binary masks. The private new SVG atlas is198x18, with18x18cells at offset−9,−8. Palette gamma0.7 agrees closely with sampled original bitmap colors; SVG ray outlines/layers are simplified interpretations and antialiasing differs. All16previous payloads, including the hand/goal art, backdrop and sounds, remain byte-identical. Logical board, physics, collision, original media, save IDs and storage key are unchanged.

## Coordinator acceptance

Root inspected original/candidate galleries, native-size loaded pilot rays and placement. A20second browser integration capture supplied3,301rawrAF rows and2,400active simulation steps, visible/focused with no dropped catch-up. A short swing was held only at simulation0.2417–0.275sec, caused no transfer and left both attention chains running. The sole actual player event was reverse at1.7083sec; all2,935records more than0.5sec later show no particles. Root verified1,362submitted particle positions/frame indices against the source-derived ring/cadence. Restart visibly restored flourishes; pause/resume worked. A separate successful held swing moved the player left and starbursts drained. SVG canvas export remained640x480. These are trigger/presentation checks, not resource benchmarks.

Engine/rendering assertions and5generic lifecycle tests passed (overlap, fixed birth position, wrap, stop/drain/reset, pause/time partition/large jump, and isolation/invalid inputs). Seven geometry/generator and7packaging checks passed, including unverified star-asset rejection and packaging the new module. App syntax and Git whitespace passed. No Rust/WASM build was needed.

## Level-storage question

Yes: the core is a grid with encoded designations for what is where. Original levels are named RND2binary resources inside the resource fork of ClockWerx Levels; the copied inventory has120records. Movement has an11x8grid, with each cell storing a typeword and flagword. Additional records describe actor starts, tutorial action sequences and positioned text/font data. Graphics/sounds are stored separately; code implements behavior. The pilot currently exports Movement's grid to its private JSON and adds reconstructed rules; it is not yet a general120level importer. See [level-storage details](level-storage.md), including unqualified field/version meanings.

## Preservation and limits

Final local route http://localhost:8087/clockwerx-html5/ observed ready and marked deliverable. Final uncompressed bundle119,479bytes(source30,617; assets84,136; manifest4,726). Previous owned pilot retained intact privately. Library root index/metadata/WASM and shared profiler hashes remained identical. The temporary original trace UI was restored byte-for-byte; native runner closed before pilot review; preview8091stopped. No push, upload or public deployment. Original media/forks/Finder metadata and browser save mappings were preserved.

Raw JSONs, original sprite/code analysis, private vector profiles, replay/capture helpers, source hashes, UI proofs and activation audit are under D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-starbursts. Raw art/disassembly stay out of Git. The earlier9foreground benchmarks exclude these particles and are not measurements of this final route. Other boards/flourish sites, timer-rate settings, original hardware, physical controllers and audio/save fidelity remain outside acceptance.

Astra estimates about12active minutes for source discovery, trace analysis, atlas/lifecycle implementation and tests. Root added the three bounded5second captures, independent source-pixel/timing review, integration, UI validation, preservation and activation. No full-game scope expansion occurred.

Evidence preservation: a separate self-contained private snapshot with 76payloadfiles/113122465bytes was copied and everySHA256verified; see evidence-archive.json forpath/manifesthash. The report/index is committed; rawcaptures/art/disassembly remain private.
