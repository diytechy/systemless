# ClockWerx RND2 decoder review — 2026-11-08

All 120 copied level resources decode exactly to EOF using source-verified stream boundaries. This is **structural completeness**, not full mechanic, visual or gameplay support. Private normalized output is `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/decoded/v2/`; the earlier parent directory is preserved as an initial conversion snapshot. Each level has raw bytes, offsets, numeric fields, grid coordinates, object sections, actor records, programs and positioned text. The public companion JSON contains source hashes, numeric per-resource counts and remaining limits, without maps, tutorial text or disassembly.

## Source evidence and corrections

- `CODE7:484a–4f64` (`ROStart`, following `ROPrepare`) reads the level stream. `CODE7:48c2–492a` first **peeks** the signature, then consumes signature and version; `CODE3:404a–409c` confirms that the first call restores the stream position. Header word two is version, never column count. `_RNReadInfo` is preference/registration code and does not decode levels.
- Header word three feeds the round timer after difficulty scaling and rounding at `CODE7:4978–4a12` and `4e8e–4e9c`. The decoder calls it `timeLimitRaw`; it does not claim the displayed duration is unchanged across difficulty settings. Header word four selects display dimensions: 8 means 11 columns × 8 rows, otherwise 10 × 7 (`4a32–4aa6`). The serialized dot array still contains **88** cells (`CODE6:3956–3b7c`).
- `CODE6:393c–3ca6` (`DOCreateAll`) reads one flags word per cell for versions 4–8, and an additional attribute/mask word for versions >8. This decoder intentionally supports only observed versions **5, 6, 11, 12**; other versions fail explicitly rather than using an unverified layout. Counts are 1, 4, 2 and 113 respectively.
- Bits 0/1/2 of the first word independently mark presence/bonus/goal; bit `0x4000` is a separate initial state. The loader applies other flags only when presence is true. In versions >8 the second word supplies low-nibble activation mask and attribute bits. The decoder preserves both words and does not collapse them into a guessed color model. Conditional inline dot programs (`flags & 0x80`, with presence set) use Pascal text with even-byte stream padding. There are **373** such programs across the copied resources; assuming a fixed 352-byte grid payload loses these boundaries.
- Section order comes from `CODE7:4abe–4e8c`: **HY, SP, WL, DR, DS, PU, BO, GO, WY, WP; even alignment; WA, TX, EX, EL, GN, TR**. Every section begins with a 16-bit count. Version gating before TX/EX/EL/GN/TR is already satisfied by all four observed versions.
- Each fixed record follows its named `CODE6:*Stream2Spec` routine; offsets are included in the decoder. WP uses `CODE6:f190–f202`: unpadded length-prefixed programs, followed by alignment of the whole stream before WA. DR explicitly aligns after its record. The private audit `decoder/stream-layouts.txt` retains the inspected instruction evidence.

## Record layouts

Sizes below are serialized bytes, not in-memory struct sizes. Two leading signed words are retained as grid row/column for records beginning with a GridPos. WL uses its own axis/segment schema and is deliberately not coerced into a point.

| Class | v5 | v6 | v11 | v12 | Remaining interpretation |
|---|---:|---:|---:|---:|---|
| HY | 6 | 6 | 10 | 10 | Kind/activation behavior |
| SP | 8 | 8 | 12 | 12 | Orientation, reach/timing and collision |
| WL | 12 | 12 | 12 | 12 | Axis byte, segment endpoints and thirds-of-cell offsets |
| DR | 8 | 8 | 8 | 8 | Four trailing byte parameters and door state |
| DS | 8 | 8 | 8 | 8 | Trigger/state relationship |
| PU | 6 | 6 | 10 | 10 | Subtype and collision effect |
| BO | 6 | 8 | 8 | 8 | Fuse timing and added byte/padding |
| GO | 6 | 6 | 10 | 10 | Collision effect and parameter |
| WY | 8 | 8 | 12 | 12 | Waypoint/behavior semantics |
| WP | variable | variable | variable | variable | Program instruction language |
| WA | 16 | 16 | 20 | 22 | Actor types, speed/direction, action execution, v12 byte |
| TX | 107 | 107 | 107 | 107 | Coordinate transform, rendering byte and conditional visibility |
| EX | 6 | 6 | 6 | 6 | Endpoints and grab/collision behavior |
| EL | 8 | 8 | 12 | 12 | Parameters and collisions |
| GN | 10 | 10 | 14 | 14 | Parameter order (spec +6 before +4), firing behavior |
| TR | 8 | 8 | 12 | 12 | Trigger/collision behavior |

TX consists of a fixed 33-byte Pascal font name, five 16-bit fields, then a fixed 64-byte Pascal text buffer (`CODE6:011a–01d6`). `CODE6:0316–0342` and `CODE4:11a0–13c0` establish font size, face and rendering-style byte. The two signed position words are retained without guessing baseline/top-left behavior. `@` prefixes remain present in raw text; `CODE6:009a–00f6` strips a two-character prefix for display, while `0244–02da` applies mode conditions for `@M` and `@2`.

WA stores grid position, six short parameters, an activation mask in versions >7 and two extra bytes in v12 (the second is discarded by the original reader). The decoder exposes actor type, initial frame half-index, signed program reference, mask and v12 byte as raw values. Source conversion doubles the initial frame field (`CODE6:dcb0–dcbe`); program references are selected through WP/PROG logic (`e174–e1fa`). Negative values must not be converted into arbitrary array indexes.

## Conversion results and checks

- 120/120 complete structural parses; zero unsupported boundaries; zero trailing bytes. No level is gameplay-qualified by this conversion.
- 1,593 WA actors, 625 WP programs, 77 TX records. Movement independently yields 3 WP, 5 WA and 22 TX records.
- All 16 record classes occur somewhere in the copied inventory. The companion JSON provides totals and counts for each resource; catalog order remains the coordinator's responsibility.
- Eight synthetic tests pass. They exercise all four version layouts, every truncation point of a populated stream, inline-program padding, absent cells with a program bit, unknown flag preservation, signed text positions, malformed Pascal buffers, unexpected versions/tails, and empty sections. No private resource bytes were turned into test fixtures.

## Integration contract and remaining work

Join normalized files to catalog entries by `resourceId`, preserving the catalog's order and keeping unlisted resources separate. Require `structuralStatus == "complete"` before placement, while separately tracking each implemented and qualified mechanic. `gameplayQualified` remains false. Use grid `row`/`column` and source viewport offsets/48-pixel spacing for scene placement; the display dimensions do not change serialized row stride. Keep raw fields until semantic mappings are proved. The decoder's `mechanicInventory.recordCounts` is a source-class inventory, not a claim that class abbreviations have been fully identified or ported.

Prioritize WP and inline-dot action parsing; wall/door geometry; actor type, frame, speed and direction; activation-mask gating; per-class collision/timer rules; then text transforms and mode filtering. Verify each rendered class against native evidence before enabling corresponding campaign levels. The data now makes coverage and generation constraints measurable, but an automatic level generator still needs solvability and interaction constraints from qualified mechanics.

Work stayed within light source reading, Python conversion, synthetic tests and these reports. No emulator/browser workload, build, original media/save change, commit or upload was performed. Decoder work is released to the coordinator; source/runtime qualification remains explicitly outstanding.
