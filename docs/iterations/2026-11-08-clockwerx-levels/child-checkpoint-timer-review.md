# Child timer and human checkpoint source contract

Source-only preparation for catalog 9 Some Dots and subsequent levels. No runtime or existing helpers were edited, and no native/browser/build workload ran. This supplements `some-dots-astra-review.md` and `enemy-transfer-source-review.md`; it does not accept a level. All references identify code-resource offsets, not native loaded addresses.

## Child countdown is disabled

CODE1:59bc-59d6 passes GAParams difficulty at +0x10 to SCNewGame, with its first Boolean argument computed as difficulty !=0. Child difficulty is 0. SCNewGame, CODE7:607a, stores this Boolean at A5-0xada. That same enable byte guards:

- SCPeriodicProc at CODE7:7156: no countdown update or time-expiry death when false.
- SCDrawTimer at 726a: no countdown drawing when false.
- SCRoundTimeExpired at 75b0: returns false when disabled.
- SCAwardBonus at 6d2c and 6d48: both time-award contributions become zero when disabled.

Thus Child should not acquire a running countdown merely because its round header contains time. Native absence of a timer is consistent with this source branch. The exact unrelated HUD glyphs are not identified by this review. An optional overall game-duration limit is separate (A5-0xb08), not the round countdown; it is outside this bounded Child checkpoint contract.

## Integer state and checkpoint copies

Keep distinct original, saved-reset and current integer time values. ROPrepare/round start reads the signed header time and calls SCSetTimerSpec (CODE7:4e8e-4e9c). SCSetTimerSpec at 734e stores original time at A5-0xaf4, then calls SCSetTimer at 737c. Normally SCSetTimer copies its argument to current A5-0xaf8 and saved-reset A5-0xaf0. A one-shot restored-state override at A5-0xae0, when not -1, replaces both values and is then cleared to -1; loaded-game state must not silently discard this exception.

SCSetTimer also stores the refresh threshold current*60+59 and clears started (A5-0xadc) and paused (A5-0xadb). Its draw call has the disabled-Child guard above. Child periodic processing never decrements current, so for the fresh Some Dots round the initialized integer remains 90 unless another explicitly implemented source API changes it. Simulation elapsed time is not this state.

WAWaystation, CODE6:eca0-ed2e, compares current grid position against the player's saved reset WASpec. Only a different position updates that saved position, WY half-index and direction, then calls SCSetCurTimer through jump2542 at ed18. SCSetCurTimer, CODE7:73e6-73f2, simply copies current integer to saved-reset. It does not sample fresh TickCount, derive a fractional remainder or restart the timer. Revisiting the same saved checkpoint does not refresh saved time. Sound23 is outside the changed-position branch and still occurs.

SCReset at CODE7:6e7a-6e7e calls SCSetTimer(saved-reset). Normal single-player death therefore restores the saved integer and clears started/paused, subject to the explicit one-shot restore override. Explicit Restart Level instead invokes WARestartLevel, CODE6:f0d2-f0f4, which restores original human specifications and calls SCRestartLevel. SCRestartLevel, CODE7:7326-7336, calls SCSetTimer(original). The later normal ROReset now receives that restored original saved value. Do not let a checkpoint rewrite the immutable original specification.

## Death ordering and enabled-mode boundary

Single-player death is detected at CODE1:6062-6088. The game-type-0 branch calls SCPauseTimer at6088 before entering substate3. Substate3 initialization at6aa8 first calls ROFreeze(false), then activates death effects. Ordinary layers freeze while effect layers and underlying clocks continue. After the particle completion barrier, the ordinary no-explicit-restart branch at613a calls ROReset, enters substate1 and reveals. ROReset runs registered reset callbacks, including SCReset and actor/dot reset; it is not hero-only resurrection. This preserves the ordering already established in `death-astra-review.md`.

SCPauseTimer (CODE7:74a6) records fresh TickCount only on the first pause, with no current-time recomputation. SCResumeTimer (745e) shifts the absolute deadline by the elapsed pause duration, then clears paused. Normal death takes SCReset/SCSetTimer instead of simply resuming the old deadline.

For reference only, the enabled-mode SCStartTimer (7408) sets deadline=fresh TickCount+current*60, marks started and clears paused. SCPeriodicProc (7146-7246) is additionally gated by started, paused and the award-animation state. It derives integer remaining time from deadline minus fresh TickCount, refreshing only at its source threshold; timeout tests a negative remainder. This is guest TickCount arithmetic, not scaled actor clocks or wall-clock simulation seconds. Other difficulties, pause/UI transitions, overall game duration, loaded-state overrides and all time-award arithmetic need their own integration qualification. No generalized timer helper is claimed here.

## Human targeting and initial occupancy

DOCanGrab, CODE6:4494-44d4, chooses runtime DOInfo+0x11 for a human and +0x10 for a nonhuman. WAAction:c6d8 exits on failed target before the c710-c728 reversal. Consequently **bounce is denied when the target ring is unavailable to humans**, even if that ring remains available to nonhumans. Missing ordinary targets likewise prevent reversal and grab while program PC consumption remains separate. Human wall/edge grab fallback at44d6-44fc is a separate branch and is not generalized by this static-dot finding.

The secondary word's low nibble is a difficulty activation mask, not a human grab mask. DOCreateAll at39cc-39d4 stores secondary&15 in DOSpec+0x12. At3ae2-3b06, a mode-mask miss clears selected special properties, including ring/bonus/goal/protection/slowdown/up-down fields; it preserves configured presence. DOSpec2Info:349a-34a0 initializes both runtime permissions from DOSpec+4 presence. Higher secondary nibbles feed difficulty-dependent appearance colors (DOCreate:37a4-37fe); DOCanGrab does not use actor-color nibbles as permissions. Accepted low-nibble15 static levels made the existing human engine mask check inert; it is not a valid future conditional-dot permission rule. Preserve the distinction between appearance, activation, presence and current permissions.

Initial/reset human occupancy is not hook-free. WAReset atdd8c-ddaa calls DOInitialGrabbed (458a-45e0) for the human slots. That wrapper temporarily clears the dot's bonus byte, calls DOGrabbed with human=true, then restores the bonus byte. It avoids an initial bonus award but can run WY and other human arrival hooks. It must not be replaced by arbitrary per-frame occupancy polling.

For a static checkpoint, DOGrabbed:469a calls WAWaystation;46b6-46bc attaches the unscaled80 clock and46c2-46c6 sets the main sprite step+1. **There is no immediate frame increment on grab.** This differs from ring release. A different previously selected checkpoint resets both sprites to79, sets main step0 and detaches its static timer (46d6-4718), then the global selected pointer is changed. Initial/reset occupancy can also take this animation branch. WAWaystation's unchanged-saved-position check independently prevents unnecessary saved-time updates.

Re-grabbing the already selected checkpoint at completed frame89 replays the animation. Jump2cfa resolves to CODE4:3de2 SUAutoFrame. DOOneFrameProc, CODE6:26e4-26ee, calls it before the checkpoint's max-frame stop test at2810-2826. SUAutoFrame first adds the step; an above-max result wraps to min when sprite+0x62 is false (CODE4:3e26-3e46). Default sprite creation clears +0x62 at32dc; ordinary dot setup sets min/max at CODE6:2f18/2f20 without enabling that alternative boundary behavior. Thus the grab itself retains89; the next callback wraps to79, subsequent callbacks reach80 through89, and the max test then stops/detaches again. Re-grab partway through an animation continues from the current frame. Do not clamp89 and detach on the first callback, or reset79 immediately at grab.

Private excerpts are retained under taskroot `some-dots/enemy-transfer/`. This report and its JSON are released. Root owns timer integration, human targeting fixes, checkpoint helper changes and native acceptance.
