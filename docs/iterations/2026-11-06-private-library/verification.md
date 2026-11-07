# Verification record

Date: 2026-11-06. Branch: `dev`. Final private-library WebAssembly build and browser checks completed.

## Extraction and packaging

- Source images 001, 002 and Boot were opened read-only and rehashed after extraction; unchanged.
- Koji: 9 extracted files verified across both forks; ClockWerx: 9; Delirium: 4.
- Every selected ClockWerx file's data/resource concatenation matched 7-Zip's independent HFS+ extraction.
- Private game binaries, existing preferences, title previews and build output stay ignored. No upload or HomeHub deployment.
- `/`, `/koji-the-frog/`, `/clockwerx/`, `/delirium/` respond with HTTP 200, including HEAD requests. Isolation headers are present and WebAssembly is served as `application/wasm`.

## Automated checks

With `CARGO_TARGET_DIR=D:\SystemlessBuild\target`, package-only optimization disabled to keep local diagnostic builds practical:

```powershell
cargo --config 'profile.ci-test.package.systemless.opt-level=0' test --locked --profile ci-test --lib pack0
cargo --config 'profile.ci-test.package.systemless.opt-level=0' test --locked --profile ci-test --lib pack1
cargo --config 'profile.ci-test.package.systemless.opt-level=0' test --locked --profile ci-test --lib roman_bundle_resolves_a_stable_usable_keyboard_layout
node --test scripts/koji-controls.test.mjs scripts/game-controls.test.mjs
```

Pass: 20 Pack0-filter tests, 33 Pack1-filter tests (also matches Pack10–15), and the keyboard-bundle regression. The two package filters overlap on the new combined entry-point test. The new callback test executes generated 68K code and verifies distinct row data, geometry, selection, register preservation and stack return across two redraws. All 5 controller-adapter tests pass. Python AST and PowerShell parse checks pass.

The original broad optimized native build was stopped when it became stale after the LAddColumn change; the completed tests above use the final source and package-only optimization override. This changes build speed, not the assertions.

## Coverage limits

No physical controller was available for a hardware test. Gamepad mappings are tested as input state transitions; browser keyboard/toolbar behavior is checked separately. Full playthroughs, all sound/music paths, and browser-save export/import round trips are not established by a launch smoke test. Exact game observations and final screenshots follow below.

## Observed native gameplay

Delirium now reaches its title, hall of fame, preferences and playfield. The saved input fields were inspected narrowly: directions are keypad 8/2/4/6 (Mac virtual keys 91/84/86/88), keyboard mode is already enabled, and fire/bomb/reverse/thrust are Command/Shift/Control/Space. A bounded native run held keypad 8 and Command; the ship moved upward and a shot appeared. The initial arrow-key probes did not move because they targeted different key codes, not because preferences needed resetting.

ClockWerx now renders the numbered level names correctly and enters the “Welcome to Stage 1 — TUTORIAL” screen after selecting Movement and Play. Early input during its palette transition was insufficient; the successful check waited for the options screen to settle. The additional redundant native puzzle-screen run was stopped to avoid contention with the browser build; the final browser check below is the gameplay evidence for that transition.
## Final browser verification

The release WebAssembly build completed successfully through Trunk and the private-library packager. The shared server was reused successfully with `Start-MacGames.ps1 -NoBrowser`. The generated bundle was built from the source staged for this iteration; its compile-time Git footer shows the preceding Koji commit, because the library commit had not yet been created.

Checks used the in-app Chromium browser at `http://localhost:8087/`, with its normal viewport and real keyboard/mouse events:

- The launcher displays exactly three titles with loaded private previews. Each card opens its corresponding game; All games returns to the same launcher.
- ClockWerx: New game opens its options, numbered levels render correctly, and selecting Movement enters the actual first tutorial puzzle. Holding Space changes the yellow hand's pivot between dots. Fullscreen and its exit control work. Pause/resume visibly pauses and resumes the puzzle. Saved files shows two files; export/import was not tested.
- Delirium: title, hall of fame and Play lead to the active playfield without the former initialization failure. Holding Up moves the ship upward; Down moves it back. Z fires a long horizontal projectile, captured after P paused the game. The game shows its own pause message.
- Koji: the shared build reaches its title and first level. P starts from the menu and pauses in play; L moves Koji right. Its existing standalone browser tab was left untouched.
- Smooth scaling changes the canvas to `image-rendering: auto`; Crisp pixels was restored afterward. Keyboard focus remains on the canvas without scrolling when toolbar actions focus it.
- The captured browser console warning/error query returned no entries after visiting all three games.

The launcher is left open. These are gameplay smoke checks, not full compatibility certification. No physical controller, full playthrough, comprehensive sound/music check, or save export/import round trip was performed. Controller mapping/state-transition tests passed as recorded above.

Screenshots: [launcher](launcher.jpg), [ClockWerx tutorial](clockwerx-browser.jpg), [Delirium projectile and pause](delirium-browser.jpg), [Koji first level](koji-library-browser.jpg), and [Delirium native input check](delirium-native-input.png).