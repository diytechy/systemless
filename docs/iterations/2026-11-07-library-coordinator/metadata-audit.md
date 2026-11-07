# Preserved folder-date audit and staged copies

Read-only audit confirms current Adventure and preserved-preference Angband copies retain their inspected file forks/Finder fields and represented folder dates. No replacement is required for those fixtures. Old Koji/ClockWerx/Delirium images retain inspected file forks/fields but each constructed title/System Folder/Preferences folders with missing creation/modification dates. Source media is intact.

Updated older extractors retain those represented folder dates and verify forks, Finder fields, flags, dates and raw16 coordinates. Synthetic tests exposed signed HFS+ coordinates rejected by machfs's unsigned writer; copied values now normalize modulo65536 without changing source bit patterns. Three metadata tests pass, including deliberately lost dates and changed resource forks. Folder Finder information remains unavailable; raw alias resolution is not qualified.

Both active workers released their runtimes; root confirmed no systemless.exe process before the single controlled three-game extraction. New copies are in D:/SystemlessBuild/private-library-20261107/media-preserved-v1. All source001/002/Boot hashes remained unchanged. Independent reopened comparison found all22 files unchanged against old copies for both forks/type/creator/flags/dates/coordinates. All nine copied folders now match their original source dates. Old images remain intact in www/private and are still the baseline bundle's media. Nothing is activated by staging these copies; normal IDs, executable paths, save mappings and browser data are unchanged.

| Title | Preserved staged SHA256 | Files unchanged / folders dates verified |
| --- | --- | --- |
| Koji | 33aedf584568818b5642f0f8269e074361ff8745ef78d04b6a00c6403e1b2f3a | 9 / 3 |
| ClockWerx | 03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4 | 9 / 3 |
| Delirium | b6b2d59f486c8ba1cfaa2d1c37a8c524b042adfb53488072f5c9cf3b5398b458 | 4 / 3 |

Private audit evidence: D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/metadata-audit/baseline-audit.json and staged-comparison.json. The staged extraction manifest also records hashes. Before selecting a replacement bundle, preserve/export browser saves and run representative behavior checks; no gameplay/fidelity result follows from metadata verification alone. Roll back by selecting retained baseline media/bundle; no original source or browser save migration occurred.

After all69 first passes, a read-only cross-check selected66 additional copied fixtures by their reviewed image hashes and matched their application forks to the original inventory. Ambiguities were resolved explicitly: complete Brick Bash folder, Bachman's .dsk, Blobbo Full with preferences, Bonkheads' narrow game fixture. It found missing ancestor dates in the earlier3-D Cannon fixture (three folders) and Verttice fixture (two Boot folders), despite the latter's initial roundtrip claim. All other represented folder dates in the selected66 matched their source. Separate corrected copies now live in D:/SystemlessBuild/private-library-20261107/media-corrected-v1; all3/69 files respectively retain identical forks and inspected file metadata. Prior images/native evidence remain intact; corrected copies have not been replayed. These are metadata corrections, not new compatibility results.

| Additional corrected copy | SHA256 |
| --- | --- |
| 3-D Cannon | a6e7a80d112d705738e6ac9e97cbe0acfec3baeffd528f446543858fdc9435b2 |
| Verttice | 848dbe338a718e90edbbc6920ac57de3ad7367307ab7ded22fe97b3c5cb72c95 |

Exact copied volume labels were read from the HFS MDB Pascal drVN bytes and preserved. machfs.Volume.read retains dates but leaves its .name property at default Untitled; that property must not establish a browser executable path or silently rename a serialized correction. Verified raw labels include the existing Koji/ClockWerx/Delirium identities and Verttice Copy. Private candidate-audit.json and metadata-corrections.json under D:/SystemlessBuild/private-library-20261107 retain selection/path/date evidence. Browser catalogue preparation must overlay the corrected copies and use the raw volume-prefixed executable paths.
