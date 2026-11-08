# More Spikes: programmed enemy qualification

Level7 is a bounded playable Child scene in the private SVG pilot. The source inventory is62present dots,11optional bonuses,1goal,6spikes,7text records,12stored programs and4raw actors. One human is active, the alternate human is hidden, and green/blue ordinary enemies are active. The blue hand uses a bounce-only program; the other stored programs do not become active merely because they exist. All51accepted asset payloads are reused unchanged. Source/map data stay private.

## Behavior and evidence

The source advances an integer actor frame before interpreting an instruction at a cardinal pose. The decoded source PC1 reads the first character; PC0 reads the Pascal length byte. Commands consume a byte even when a missing or nonhuman-forbidden facing dot prevents the action. Successful bounce reverses direction without transferring the pivot. Logical decisions use the canonical frame, while the SVG predicts a fractional pose from the shared class clock. Render calls do not consume instructions. The shared upstream latch caps accumulated work, preserves per-class remainders and discards excess backlog as the source does. Programmed wall-reacting actors, transfers and sliding remain gated for later qualification.

| Check | Result |
|---|---|
| Original idle trajectory |2030frontend/2628guest ticks, zero exhausted budgets.33/33blue and33/33green source-sprite fits; blue error0.176–0.289, green0.265–0.369. Green advances202frames/960guest ticks |
| Original program agreement |Current integer interpreter predicts33/33blue poses from independently fitted green class advances.13turnarounds inferred; exact boundary instants and every PC wrap are source-derived, not directly photographed |
| Original goal |5534frontend/6132guest ticks, zero exhausted budgets.26/26mixed-action pivot fits, max mean channel error5.776. Completion shows0bonus and1,000Child completion score |
| Pilot model |26transfers, four direction-changing swings,67.133simulation seconds,0bonus/0reset. The input-only route passes166clock-start cases with±0.25second holds |
| Browser |Goal visibly reached; exported complete67.133seconds,26transfers,0bonus/0reset. A valid20second record covers35.667–55.675seconds of gameplay. A separate valid export records the completed idle state |
| Regression |109accepted-runtime Node tests and12packaging tests pass. Previous six actual-map routes pass. Previously reviewed Walls38/Doors266/Oil166/ComboGoal166/ComboWake166cases also remain passing |

The green source-normalized rate is12.625frames/sec, agreeing with12.6316derived from its class. This normalizes60guest ticks/sec and measures no host CPU or physical display speed. The program comparison conditions on the observed logical advances; it is not an exact startup/reveal replay. Browser and model can report different bounce totals because restart preserves shared clock phase. Both retain the same fixed-pivot arc and reach the goal.

## Solution and generation requirements

All-flip and incomplete local action changes failed against a spike or green hand. The retained final route changes direction at four transfers and avoids optional bonuses. A generated board needs a time-dependent solution: pivot, direction, canonical enemy frames, PC, class count/remainder, spike phase and legal input intervals. Static adjacency is insufficient. Evaluate commands against nonhuman permission independently of artwork color, retain denied-command PC advancement, and test multiple clock onsets. Programmed enemies must not be silently replaced by unrestricted rotators.

Native screenshot fits use original raster masks. Existing SVGs intentionally smooth outlines and rotate continuously; tutorial text uses a substitute font. Sound, all bonus routes, arbitrary programs/PC0 lengths, slowdown transitions, exhaustive deaths, other difficulties, full score policy, campaign saves and physical controls remain unqualified. Full source behavior and saved-image review are separate from these bounded goal checks.

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/more-spikes/`. Source-program reports and33sample comparison are linked separately. Failed route candidates are described; the successful trace is replayed through rules, not teleported state. The original fixture SHA256 remains03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4. Media, shared library metadata and browser save identity are preserved.

Activation:7scenes,18source files,51payloads. Uncompressed total1,540,684bytes:103,894source,841,368assets,595,422pretty JSON manifest/maps. Guard and retained prior route: `more-spikes/activation.json`, `more-spikes/previous-live-pilot`. Shared library index/metadata/profiler/WASM hashes are unchanged. No resource benchmark or heavy build was run for this increment. Next:More Doors8; the remaining-level request is unfinished.
