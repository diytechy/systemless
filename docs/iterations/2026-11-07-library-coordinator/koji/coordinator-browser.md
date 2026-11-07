# Koji release-browser baseline and review

Coordinator follow-up, 2026-11-07. The supported in-app browser works from root context; the worker's inability to show IAB was limited to its subagent context. Windows/Edge Computer Use was not retried. No runtime, pacing, display, executable, save-ID or preference-mapping change.

Existing release WASM SHA256 aa25ac7a47cbd323ce6b4909892db2158f3d4e7d03d8346575949e5e5840674c; source runtime ed74c8b4, documentary coordinator commit c6e0660f. In-app Chrome 156 on Windows, WebGL, worker true, 68K, actual 25 MHz, max ticks per paint 2. Fixed browser viewport 1024x1000 for comparable captures. Logical guest 640x480; output scale 2 gives canvas backing 1280x960; observed CSS box 798x598. Crisp mode. Do not interpret backing dimensions as guest resolution.

Three fresh launches: reload on the existing localhost:8087 origin, observe title, Focus game, P, observe settled Level 1 cyan lily-pad field, Koji bottom center, score 0, drops 1, lives 4, then idle 20 seconds. No gameplay inputs during capture. Starting bonus varied (1850, 1950, 1900) because readiness was observed manually; this is repeated same-level workload, not deterministic identical initial state. Ordinary insect/death/respawn progress was not held constant, so these captures cannot isolate a subtle implementation difference. No candidate is justified by these baselines alone.

| Run | Guest ticks/sec | Mean execution ms | p95 execution ms | Capture |
|---|---:|---:|---:|---|
| 1 | 59.959 | 1.803 | 13.800 | browser-default25-r1.json |
| 2 | 60.128 | 1.870 | 13.855 | browser-default25-r2.json |
| 3 | 59.903 | 1.856 | 13.945 | browser-default25-r3.json |

All three report complete/visible/focused and actual cpuMhz 25. Median guest-clock rate about 59.959 ticks/sec, range 59.903–60.128. These are guest-clock and runtime-call work measurements, not game animation FPS, physical displayed frames, or original-game fidelity. `browser-uncontrolled25-r0.json` is retained but excluded: the first probe began after uncontrolled idle play and was not a defined fresh-level baseline.

`browser-summary.json` pairs capture UTC intervals with timestamped host/process samples. Raw sampler files remain at their exact D: paths and their hashes are recorded. Run 1 resource sampling ends about three seconds before capture completion and is partial. Runs 2/3 cover the full capture interval, with host CPU sample medians 52%/53% and browser/Codex aggregate CPU sample medians 11.47%/11.20% of the 24-logical-processor host. Aggregate working-set medians were about 6898/6885 MiB. Samples include unrelated chats/tabs and cannot be called the game's CPU or memory. Per-interval CPU only includes processes present at both samples; arrivals/departures are counted as omissions. The sampler itself adds a small polling workload. No unrelated user processes were stopped.

Browser behavior after run 3: Pause/resume displayed red GAME PAUSED. Resuming and then holding L for 200 ms removed that state, moved Koji right, changed insect positions and decremented the bonus. Holding I for 200 ms visibly raised Koji in a jump. This supplies a browser resume/movement/jump observation beyond the native run's inconclusive resume sequence. K was delivered but water effect/consumption was not demonstrated; retain unqualified. No audio listening, later busy level, save export/import, original-reference pace/collision/scoring or physical controller qualification. Reload was a fresh run on the same origin; no state replacement/reset/import was performed. Saved-files count showed 0 in these loads; that does not establish persistence behavior.

Private screenshots: browser-paused.png, browser-resumed-moved.png, browser-jump.png and browser-final-paused.png under D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/koji. Browser test tab closed before the next title's workload. No game assets/screenshots/preferences are staged for Git.

Memory boundary: summed process working sets can count shared pages multiple times; these totals are not unique physical RAM or an isolated game allocation.

Recommendation: unchanged baseline at 25 MHz. No demonstrated guest-clock deficit in this first level warrants lowering its instruction budget. This is limited scene evidence, not comprehensive compatibility. Next useful tuning work requires a repeatable demanding scene and independent pace/audio/save checks. Rollback: documentary files and resource sampler only; no game setting to revert.

Later concurrency audit: the earlier app inventory showed an old Edge ClockWerx tab from the stopped attempt. Its background activity during these captures was not observable. Only one new coordinator test/worker was running, but full single-emulator isolation was not established; downgrade these to contextual scene probes under that uncertainty. No setting was promoted. The user subsequently reported that old tab closed or paused before future captures; this does not retroactively qualify these runs.
