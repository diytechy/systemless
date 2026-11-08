# Special dot callback and reset ordering

Source-only preparation for Some Dots integration. No helpers, runtime, assets or existing QA files were changed. No native/browser/build workload ran. This report resolves physical layer order and separates normal reset, explicit Restart Level and a fresh resource load. Native phase matching remains root-owned.

## Physical processing order

DOCreate, CODE6:3872-38a0, inserts secondary/shadow sprites on logical layer5 and main sprites on logical layer4, both at priority0. Rings and checkpoint animation use that main sprite; their secondary frame is assigned by the main callback rather than an independent animation timer. DOCreate clears the secondary timer pointer at3832-3836.

DOCreateMisc:3118-327e obtains its layer from the 14-byte table at A5-0x832. Type2 protection has step+1, visible=true, layer4 and the unscaled50 clock pointer. Type1 goal decoration also uses layer4. These are separate main-list sprites, not a second independent pass after every ordinary dot. The original table and excerpts stay private.

ROGetLayer, CODE7:4652-46e8, aliases logical IDs onto physical lists. ROStart appends lists in the following order at4ea2-4f0a:

| Sweep order | Logical layer IDs sharing that list | Relevant contents |
| --- | --- | --- |
| 1 | 5 | Dot secondaries/shadows |
| 2 | 4,7 | Dot mains, rings, checkpoints, protection and goal misc |
| 3 | 8,9 | Other source objects |
| 4 | 3 | Other source objects |
| 5 | 10,15 | Other source objects |
| 6 | 11 | Oil PU/DP/faders |
| 7 | 2 | Other source objects |
| 8 | 1 | Enemy actor slots >1 |
| 9 | 0 | Human actor slots0/1 |
| 10 | 12 | Death effects |
| 11 | 13,14,16 | Effect/display lists |

The actor layer selection is by slot index, not source actor type: WASpec2Info, CODE6:dbe0-dbf8. Logical layer6, used for optimized/background dot mains, is not appended to this normal active sweep. DOOptimize:3cca-3dae removes qualifying main/secondary sprites from4/5, hides both and retains the main in6. The runtime-mask0x0b94 exclusion includes rings0x200 and checkpoints0x100, so those animated mains remain in4. A protected ordinary main can be optimized while its independent protection misc stays in4; do not remove that overlay with the underlying main.

SUAddLayer appends to the universe tail (CODE4:4872-48aa). SUAddSprite priority0 appends to a physical list tail (2594-2644). SUProcessUniv (4a66-4aa2) walks the universe head through next pointers, then each layer head through sprite next pointers, skipping a layer whose processing-stop byte+0x10 is true. It caches the successor before calling SUProcessSprite. DO main and overlay callbacks therefore precede Oil, enemy and human callbacks when eligible in the same sweep.

Preserve order within layer4. DOCreate inserts a cell's main before invoking DOSpec2Info, which creates its misc sprites; subsequent source cells append later. A simple implementation that visits main then its applicable misc in source cell creation order matches this bounded initial population. A global pass over all mains followed by all overlays does not reproduce the exact list order. Nonzero priorities, later insertions/removals and dynamic variants require their own adapter. SUProcessSprite/SUIsFrameTime still coalesce a changed client count to one callback; layer order does not authorize elapsed-count catch-up.

## Normal ROReset

RORegisterReset (CODE7:3cd0-3ce6) prepends each callback and returns the prior callback; ROReset:3de6-3dfc follows that returned chain. WAInit is called at CODE7:43c4 and registers WAReset at CODE6:bf8a-bf96. DOInit follows at CODE7:43e2 and registers DOReset at CODE6:20ae-20ba. Consequently **DOReset runs before WAReset**.

The complete DOReset body is CODE6:2220-230c. It visits the primary dot records, not the misc-sprite array. In order it handles burnt appearance, saved bonus restoration, ring resurrection, checkpoint stop/detach, slowdown appearance, moving-dot reset and up/down reset, then clears the selected-checkpoint pointer. The earlier branches can alter a combined-special dot's frame, so a universal retain-frame rule would be too broad.

Both actual Some Dots WY dots are raw0x4011 with secondary15: present, waypoint marker and initial flag; no bonus/ring/burnt branch applies. For this plain checkpoint subset, DOReset at22a6 sets main step0 and22b0-22b2 detaches its static timer. It **does not set either frame to79**. It retains current main/secondary frame, then22fe clears the selected pointer. A previously completed checkpoint can therefore remain visually at89 while no longer selected. This is source state, not an inferred graphical reset.

Protection type2 misc is outside this loop. Normal ROReset does not reset its current frame, direction or saved animation-client reference. Layer freezing suppresses callbacks; underlying clocks continue. On a later eligible callback after thaw, a changed count produces one normal ping-pong step and refreshes the reference. Do not reconstruct protection at117 or reset its clock on normal death. Generic one-shot cleanup after the reset callbacks does not dispose this ordinary misc sprite; its automatic-disposal flag is false.

WAReset:dd46-de4a first reinitializes every actor in ascending slot order using its saved spec. After that loop, dd8c-ddaa calls DOInitialGrabbed for the human slots. Therefore reset-time human arrival hooks see the already reset dot permissions and all reinitialized actors. DOInitialGrabbed:458a-45e0 suppresses only the bonus byte temporarily; WY/DP and other human arrival hooks still run. A hero returned to its saved checkpoint reattaches its checkpoint clock and sets step+1 from the retained frame. At retained89, the next callback wraps to79, then animates back through89 as established in the timer review. The saved checkpoint/time is unchanged when its grid already matches.

## Explicit Restart Level and other frame resets

GPDoTheRestart, CODE1:5f00-5f2c, calls WARestartLevel through jump28b2 at5f08, **DORestartLevel through jump267a at5f0e**, then ROReset at5f14, substate1 and reveal. The second call is a material distinction from normal death.

DORestartLevel, CODE6:4be6-4c30, if a checkpoint is currently selected, sets that selected checkpoint's main and secondary frames to79 at4bf0-4c0c, detaches its static timer and clears the selected pointer. It does not reset every checkpoint or every misc sprite. ROReset then stops checkpoint steps and restores rings/bonuses as above; WAReset returns humans to original saved actor specifications because WARestartLevel restored those first. Protection phase remains preserved. This explicit restart does not reload the resource or rebuild all sprites.

Selecting a different checkpoint during a successful human grab is a third operation: DOGrabbed:46d6-4718 resets the previous selected checkpoint's two frames to79, sets step0 and detaches its static timer, then selects/activates the new checkpoint. That unselect operation must not be conflated with ordinary DOReset's retain-frame behavior.

A fresh resource load instead creates main/misc sprites from source initial frames and directions. WACreateInfo:e1fa-e216 invokes WASpec2Info and immediately DOInitialGrabbed for each human as that actor is created; later actors may not yet exist. After all records/layers are prepared, ROStart:4f30 invokes ROReset, whose WAReset initial-grab stage occurs after every actor has been reinitialized. These are two distinct initial-arrival paths. Preserve them if implementing generated starts on special pivots; do not replace them with per-frame occupancy polling.

## Bounded adapter contract

For current Some Dots: process shadow bookkeeping, then ordered layer4 main/misc callbacks, then the existing remaining physical order including Oil before enemy before human. Human release/grab changes happen synchronously inside the later human callback; they affect availability and orphan state immediately, while newly attached ring/checkpoint animation snapshots the current count and waits for a later count change. Apply normal-reset plain-checkpoint retain-frame/stop/detach, clear selection, preserve protection phase/reference, then actor reset and initial human arrivals. Apply explicit selected-checkpoint79 reset before that sequence only for Restart Level. Keep fresh scene construction distinct.

Combined bonus/checkpoint, burnt/checkpoint, moving/up/down/teleport dots, changed physical priorities and native synchronization remain outside this bounded acceptance. Reports and private excerpts under `some-dots/callback-order/` are released; no runtime acceptance is implied.
