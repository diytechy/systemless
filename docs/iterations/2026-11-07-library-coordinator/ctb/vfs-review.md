# Coordinator review: mounted-volume parent traversal

CTB's captured diagnostic run reports this PBGetCatInfo sequence on volume reference -2, using negative directory index and an empty name:

| Returned name | Directory ID | Parent ID |
| --- | ---: | ---: |
| Preferences | 22 | 21 |
| System Folder | 21 | 19 |
| Untitled | 19 | 2 |
| MacintoshHD | 2 | 1 |
| Untitled (input ID1) | 19 | 2 |

The final two entries repeat before TrapInstruction #2. The cycle is observed; its causal relationship to the application's trap is unproven. No preference-file open/read or gameplay was reached. Original media and copied preference forks remain intact. The diagnostic binary's exact compile revision is unknown, so source inspection is a separate line of evidence.

Current source contains a matching inconsistency. `TrapDispatcher::mount_vfs_volume` retains an extracted volume as a top-level internal directory beneath the boot VFS. `resolve_directory_id` maps directory IDs0/1 on a mounted volume reference back to that volume's internal root. `fill_directory_catalog_info` returns internal directory/parent IDs directly. Together these can expose the synthetic boot root in a mounted-volume parent walk, then redirect the special parent ID1 back into the mounted volume. Source locations: src/systems/macintosh/trap/dispatch.rs (mount_vfs_volume/resolve_directory_id), src/systems/macintosh/trap/resource.rs (lookup_catalog_entry_for_hfs_lookup/fill_directory_catalog_info). Existing PBGetCatInfo root tests in resource/tests.rs cover the boot volume; mounted-volume traversal needs its own regression.

Apple's original [Directory IDs reference, preserved mirror](https://leopard-adc.pepas.com/documentation/mac/Files/Files-83.html) specifies a root ID2 and parent ID1 on each volume, with no actual directory corresponding to that parent. The [PBGetCatInfo reference, preserved mirror](https://leopard-adc.pepas.com/documentation/mac/Files/Files-238.html) says a negative directory index selects the explicit directory ID and ignores the name. These are Classic File Manager semantics, distinct from the emulator's internal flattened namespace.

This merits a bounded shared File Manager investigation, rather than a per-title pacing change. Start with a synthetic mounted-volume/Preferences parent-walk test that terminates at the proper volume boundary and preserves named-root lookup using parent ID1. Cover boot and mounted references, working-directory references, explicit root ID2 and existing internal IDs before choosing a fix. Check PBGetCatInfo, FSSpec/FCB parent reporting and the shared PPC view together. Changing one returned parent field alone could leave inconsistent path construction elsewhere.

Bound the initial follow-up to two hours for the failing regression and CTB trace; implementation and broader regression effort remain uncertain until the namespace boundary is specified. The current coordinator pass records this concrete compatibility obstacle and continues the queue, as authorized for substantial service issues. No runtime patch, executable-byte change or release build was made. Reproduce CTB with its private fixture/scenario named in report.md, and use the preserved stderr for exact requests and IDs.
