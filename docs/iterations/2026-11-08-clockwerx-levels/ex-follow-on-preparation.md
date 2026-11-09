# Levels43–50 dependency review

All eight source hashes and57 stored program byte ranges were verified read-only. This is preparation, not admission or gameplay acceptance. Exact source maps, programs, actor starts and assembly stay privately under `ex-follow-on-preparation/` onD:.

Dots are present /Child bonus /Child goal. Counts exclude inactive objects; all active enemies here are ordinary types1–3, wall-free, PC1, with valid exact program references. Every map uses v12, large11×8, no moving programs/up-down/slowdown/transfer-death/guns/busters.

| # | Title | Dots | Active objects | Actors/programs | Required serial extension before parallel model work |
|---:|---|---|---|---|---|
|43|Betwixt|55/13/1|EX2,SP2|10; classes1/2/3;2f/n programs,8free|Static colored EX+SP/programmed NPC variant; best first content candidate|
|44|Weave|58/10/1|EX18,SP6,WL1,GO5|7free class1|Shared GO+EX sliding-actor/physical-collision scope; then independent from45|
|45|Slide|87/6/1|EX61,SP2,GO1|8class1;6b/n/s programs,2free|Same GO+EX support, programmed EX callbacks and exact61capacity|
|46|Prop Wash|70/8/1|EX8,SP7,PU1,GO8;3rings|7class1;5f/n/s programs,2free|Oil+EX arrival semantics, current ring collider frames, GO+Oil/ring composition and blue-ring artwork|
|47|Focus|76/35/1|EX22,SP4,BO8;1ring|5class1;2b/f/n/s programs,3free|Shared BO+EX sliding actors, recursive bonus/burnt propagation and background/reset handling; then independent from48|
|48|Thriller|70/2/1|EX8,WL6,BO30,WY1;1protected dot|4programmed class1 b/f/n/s|Same BO+EX support plus protected-checkpoint/wall reset composition|
|49|Playground|54/0/1|EX6,HY8;2rings|7programmed class1 b/f/n/s|Shared EX+HY/programmed ordinary teleport hooks and ring/reset qualification|
|50|Funhouse|63/33/1|EX20,SP1,PU2|7class1;3n/s programs,4free|Simpler first Oil+EX variant before46; actual DP sliding state and physical hand collision|

Recommended sequence after EX42 qualification:43 source-checked static variant; then a common GO+EX change unlocks44/45 as independent content jobs. A common BO+EX change similarly unlocks47/48. Qualify Oil+EX on50 before the richer46. Treat49's EX/HY join as its own serial integration. Root owns each common change and acceptance; content workers use frozen revisions. Native acceptance remains on the earned campaign chain, independently of out-of-order model preparation.

## Requirements found in the source

Sliding actors require their physical positions in goodie, spark and blast collision checks. Existing BombRuntime guards reject them; removing those guards alone would not implement the behavior. Oil arrival must receive the actual human sliding flag, while its successful-grab hook keeps its distinct contract. Oil collision against a shrinking ring must use the current ring frame rather than the ordinary dot outline.

EX bonus initialization recursively marks both endpoints and incident links. Pickup recursively clears the connected bonuses while awarding only the initiating grab. Burnt propagation and reset need their own source ordering. All eight imported maps already encode initial closure; that adds zero vertices here, but generated maps must satisfy the same contract.

The source has54 connector descriptors using50 images and six hidden sentinel slots. Colored and burnt forms extend beyond42's first white variants. Prop Wash additionally requires blue-ring visible frames51–57 in both main and shadow atlases; the private Fracas artwork is prepared for later review. Asset coverage is separate from collision and gameplay fidelity.

No additional engine, model, native, browser, conversion or heavy-build workload was started by this preparation worker. Root retains serial shared changes and review; frozen-engine content validation may run in parallel once the relevant combination is qualified. Earned original campaign progress remains necessary for native acceptance. No push, upload or deployment.
