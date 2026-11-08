# Doors bounded acceptance

Catalog4/resource223 is implemented and locally activated on SVG-Port. Movement, Spikes and Walls remain available. This accepts one Child/single-player route and the documented mechanics with limits; it does not qualify the whole campaign, every door interaction or original hardware timing. Original media, source map, both forks, preferences and browser identities remain preserved. No push, upload or public deployment ran.

The board has58present dots,9bonus flags,1goal,3spikes,4wall records,3doors,3switches,6unused stored programs and3actor slots. Single-player hides the second human. The green enemy selects timer class4 and rotates at one quarter of the human rate. Spikes/Walls select class1 and keep their existing equal-hero rate. The source-worker initially confused adjacent words6/7; live native pointer/class/divisor assertions now independently resolve that mistake. See [clock audit](enemy-clock-review.md) and [small-board geometry](small-board-geometry-review.md).

Switch entry toggles every door of that color; holding and release do not toggle. Multiple entrants and transfers between switches can toggle again. Occupancy changes the switch artwork. Ordinary enemies activate switches and ignore doors. Doors have two leaves,11phases, fixed colored caps and separate invisible lethal outlines. Human walls are tested before doors, lethal zones precede bounce/guard, and caps follow all leaves. The fourth consecutive nonlethal wall/door contact is fatal. Normal death freezes door sprite updates, then resets door state, switch occupancy and actor contacts while the underlying clocks continue. Exact layer traversal and continuous input sampling remain approximations. Details: [source helper](doors-astra-review.md).

## Independent evidence

| Check | Result |
|---|---|
| Original initial/motion run |1790frontend/2388guest ticks, zero exhausted budgets; all3spikes and the small-board placement reviewed |
| Live native timer probe |6read-only assertions passed at guest1668: CurrentA5, green's actual clock pointer, saved class4 and current divisor8 |
| Original actor progression |Nine green samples advance13frames in240guest ticks; nine hero samples advance51. Source averages3.158 and12.632frames/normalized second agree within endpoint quantization |
| Original green-door phases |All11original leaf-pair candidates compared: phases1,5,8,10 at guest1668/1698/1728/1758; remains10through1908. Correct caps/measured gray130 included. Mean channel error0.032–0.386; these are original-art fits, not SVG quality scores |
| Original goal route |4327frontend/4925guest ticks, zero exhausted budgets. All17intended transfer pivots independently matched against every original hero pose at every present dot; worst channel error5.04. Completion screen shows20,000bonus+1,000Child=21,000 |
| Pilot model route |17transfers,6bonuses,51.933simulation seconds, no death/reset. Widened input-only replay completes266/266shared-clock start cases, all without resets; this is not exhaustive spike/actor state coverage |
| Browser route |Goal observed. Exported end state confirms17transfers,6bonuses,0resets. Capture from50.608to51.933simulation seconds contains route finish, valid20.003wall seconds, no capped catch-up. Concurrent native work means no resource benchmark claim |
| Existing scenes |Current actual-map inputs complete Movement(1bonus),Spikes(2),Walls(4),Doors(6), all without reset. Walls38clock-start cases still pass |
| Focused checks |75Node entries for accepted runtime;11packaging tests. Oil's separate11synthetic helper tests also pass, but Oil is still gated |

The [Astra saved-image audit](doors-visual-review.md) found no material leaf/cap/switch placement defect. It verified all43baseline payload hashes remain unchanged. Smooth switch detail, seams, substituted Geneva fonts and continuous rotation are presentation differences; audio, scoring, reveal timing, original saves and hardware controllers remain omitted or unqualified. Forced native crushing/trapping/reset scenarios and all opening/closing approach phases have not been exhaustively checked.

Private evidence root: `D:/SystemlessBuild/diagnostics/2026-11-08-clockwerx-levels/doors/`. Raw native reports/screens, original-art fit scripts/results, input traces, browser exports and full source reports remain there. Sanitized reports exclude the actual map tables. The executed native route's comment predicted initial hero frame8; subsequent independent fit shows9. Its30guest-tick input windows covered that one-frame difference; all17observed transfers matched. Two deliberately failing memory probes exposed A5/class1 values before the correct class4 probe; those diagnostic mismatches are retained and are not gameplay failures.

Local activation guard/backup: `doors/activation.json` and `doors/previous-live-pilot`. Four shared library index/metadata/profiler/WASM hashes stayed unchanged. The normal route has14source files,47payloads and1,135,253uncompressed bytes including337,399bytes of pretty JSON manifest/map metadata. Source75,080bytes; assets722,774bytes. This increment has no new CPU/memory benchmark, and prior frozen Movement comparisons do not measure it. Existing prototype preference key remains unchanged. Oil is next.
