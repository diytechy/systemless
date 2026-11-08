# How ClockWerx levels are stored

Yes: their core is a map with encoded designations for what occupies each grid location. In the original Macintosh game these are named binary resources inside the resource fork of `ClockWerx Levels`, rather than one ordinary map file per level. The copied owned resource inventory contains120resources of typeRND2, plus anRNDm resource and aSTR# resource. Resource ID151 is Movement. Resource names/IDs identify levels; the companion catalog and every record variant have not been fully decoded by this pilot.

For Movement, the2,902byte RND2 resource contains an8byte header followed by88cells on an11column×8row grid. Each cell is two big-endian16bit words (four bytes total): an encoded cell/object type and additional flags. Zero-type cells have no dot. Verified examples identify ordinary dots, bonus and goal types. Some flag/access-mask interpretation remains inferred from the original behavior; it is not a complete field specification.

Additional records follow the grid. Movement contains starting actor/pivot/direction information, short action sequences for tutorial demonstrations, and positioned instructional text with font/style information including Geneva. The collage/background graphics, sprite animations and sounds are separate resources/assets. Map data selects placements and object kinds; game code provides their behavior.

| Part | What it describes |
|---|---|
| Grid | Dot/object locations and encoded cell types |
| Flags | Additional cell attributes and access information; some meanings still provisional |
| Actor records | Initial hands/pivots/directions and related configuration |
| Demo action sequences | Short sequences used by tutorial demonstrations |
| Text records | Tutorial wording, positions and font/style data |
| Separate artwork/audio | How those objects look and sound |

The current HTML pilot exports Movement's cell pairs into its private JSON manifest. `board.mjs` maps grid indices to logical positions, identifies special dots, and adds reconstructed actor/physics configuration. Tutorial text and demonstration rules are still partly coded explicitly for Movement. It is not yet a general importer of all120resources. A complete port would extend the decoder, content loader and rule implementation for the remaining record/object types. Switching bitmap hands/dots to SVG changes presentation without changing this grid or collision model.

Evidence: private copied resource directory D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/clockwerx-html5/ClockWerx_Levels; Movement RND2_151.bin SHA25616a7069f99bafb6e0bbbfd9e83693678a994082c6b922dbb542f1293277c5f5c. The Movement decoder and observed playfield establish the11x8grid, with cell span offsets8through359inclusive; text records visibly contain Geneva and the tutorial strings. Header field meanings and older resource versions require further qualification. Preserve both Macintosh forks and Finder metadata; a plain data-fork-only copy can omit the level resources entirely. Actual maps/resources remain private onD.
