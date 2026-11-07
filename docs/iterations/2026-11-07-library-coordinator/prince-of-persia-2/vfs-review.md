# Prince 2: mounted-volume path investigation

The parent reviewed the preserved fixture, error image, application-requested ExitToShell and the additional FSSpec trace. No shared runtime patch or new build has been made. Read [the earlier CTB source/spec review](../ctb/vfs-review.md) alongside this second reproduction.

The title first opens and reads its existing `Data/Prince2.opt`, then writes only the copied virtual file. Its ancestor lookup exposes internal IDs: application folder20 has parent19; copied volume directory19 has parent2; global MacintoshHD directory2 has parent1. Immediately before MWHK error10310, the additional trace reports:

```text
FSMakeFSSpec dirNFErr
request_vRefNum=0 resolved_vRefNum=-1
request_dirID=0 resolved_dirID=20
name='Prince Persia 2:Prince Persia 2:Prince of Persia 2'
```

The copied volume name appears twice. The failed lookup does not produce a valid existence key, so it does not prove that particular Config Manager content is absent. The error is an application initialization failure followed by its supported ExitToShell request, rather than an unimplemented exit opcode. A missing OS Config Manager requirement has not been established.

Source-level hypothesis: the mounted volume root is exposed as an ordinary directory below the global boot root, while the application constructs a classic per-volume path and prefixes the volume name. This can count the synthetic mount root as a folder and then prefix it again. It is consistent with the namespace problem identified for CTB, but a corrected source-built reproduction and replay are still required to prove causality. Do not attribute unrelated blank screens or slow titles to this issue.

The next bounded investigation should create a redistributable mounted-volume ancestor/path regression, covering root directory2/parent1, positive working-directory refs, explicit volume refs, current-directory0 and absolute colon paths. Audit translations at PBGetCatInfo, FSSpec creation and their directory-ID resolver together; a duplicate-string stripping fallback would conceal the namespace problem. Preserve boot-volume behavior and test both title repros only on copied fixtures after the focused tests pass. Start with a two-hour regression/trace budget; broader implementation effort remains uncertain. Builds and game replays must wait for the other diagnostic workloads to release.

Private raw evidence remains under the assigned Prince2 scratch directory: `lookup.json`, `lookup.log`, `lookup/report.json`, `lookup/lookup60.png`, `preservation.json` and `evidence-manifest.json`. The worker report records source/fixture/binary hashes. This note contains only the non-sensitive boundary evidence.
