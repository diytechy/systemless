# Three-game Macintosh browser library

Open `Play-MacGames.cmd` in the repository root. The launcher starts a hidden loopback server and opens `http://localhost:8087/`. Choose Koji the Frog, ClockWerx or Delirium. `Stop-MacGames.cmd` stops the matching server. All games use the same browser runtime, with separate game images, display settings and saved-file IDs. Koji keeps its existing ID and origin so the shared launcher preserves its previous browser saves.

## Build

```powershell
.\scripts\Build-MacGames.ps1
# Refresh private media from the original, closed SheepShaver installation:
.\scripts\Build-MacGames.ps1 -Extract
```

Prerequisites and pinned Trunk installation are documented in `../2026-11-06-koji-browser/README.md`. Build caches stay at `D:\SystemlessBuild`. Python and uv/machfs are used for extraction; only Python is needed for the local launcher. The finished `www/dist` folder is a static site for eventual HomeHub hosting.

`SYSTEMLESS_PRIVATE_LIBRARY=1` selects the three private entries during compilation. Normal upstream builds keep their public catalogue. Private media and extraction manifests remain in ignored `www/private`; build output remains ignored in `www/dist`. Source code, scripts and these notes can be committed without the game binaries or preference contents.

## Owned media and runtime settings

| Game | Source | Runtime | Browser save ID |
|---|---|---|---|
| Koji the Frog 2.0.4 | 001 / Koji the Frog | 68K, 640×480, 8-bit | koji-personal-204 |
| ClockWerx 1.0 | 002 / ClockWerx Folder | 68K, 640×480, 8-bit, 4,096,000-byte application partition | clockwerx-personal-10 |
| Delirium 1.1 | 001 / Delirium 1.1 Folder | 68K, 640×480, 4-bit, 2,048,000-byte application partition | delirium-personal-11 |

The existing relevant preference and score files from Boot are copied into each private image and mapped to the runtime's System Folder/Preferences. They are never printed into source or documentation. Both executable selection and display depth are game-specific; Delirium includes another application used for registration and explicitly requires 16-color mode.

Volume 002 is an HFS+ filesystem inside an HFS wrapper. machfs alone sees its three placeholder files, not the game collection. `hfsplus_read.py` reads its embedded volume, catalogue and inline extents without mounting or writing it. It refuses forks requiring unimplemented overflow extents. Every extracted ClockWerx fork was independently compared byte for byte with 7-Zip's HFS+ output. New HFS images are reopened and all data/resource forks and Finder type/creator pairs are checked; original images are rehashed to confirm no source changes.

## Controls

Koji: J/L or Left/Right move; U/I/O jump; Space uses tongue; K/Down drops water; P pauses. Controller: A jump, B/X tongue, Y water, shoulders diagonal jump, Start pause.

ClockWerx: Space swing, Z bounce, X flip, C reverse. Hold an action through a dot; a short tap between dots does nothing. Controller A/B/X/Y map to swing/bounce/flip/reverse. Start sends Command-P. The browser toolbar has a New game button, so Windows users do not need a Command-key shortcut. Enter a player name, select a numbered level (not the TUTORIAL heading), then click Play. These aliases target the original Command/Option/Control/Space actions. The controller tracks shared modifiers so releasing pause while Swing is held does not cancel Swing.

Delirium: arrows map to the saved keypad 8/2/4/6 directions. Z fires (Command), X uses a smart bomb (Shift), C/Space thrusts, and V reverses (Control). Controller: stick/D-pad directions, A fire, B smart bomb, X reverse, Y thrust, Start pause. P pauses; any key resumes; Escape aborts. Classic mode uses four directions; Delirium mode uses up/down with thrust and reverse. Existing keyboard mode and preferences are preserved.

Each game offers Focus game, Pause / resume, fullscreen with a visible exit, crisp/smooth scaling, and an All games link. Use Saved files to export MacBinary files before moving to another browser or hostname. Actual save round trips and physical controller compatibility must be distinguished from smoke-tested input in the verification notes.

## HomeHub handoff

Serve `www/dist` at the root of a dedicated private HTTPS hostname. Python, Rust, and SheepShaver are not needed on HomeHub. Use `Caddyfile.example`, adapt its hostname and read-only mount through the existing MiniPC-Deployer/HomeHub workflow, and preserve existing private access controls. This task does not deploy HomeHub or change network access.

All three SPA routes and `/` must resolve to `index.html`. The server must provide WebAssembly MIME type `application/wasm`, plus COOP `same-origin` and COEP `credentialless`. The bundle includes original game data and existing preferences, so it should stay within the user's private access boundary. This is original Mac software running through Systemless WebAssembly, with display scaling rather than replacement artwork.

## Compatibility work in this iteration

The first browser build exposed two missing Macintosh services, rather than damaged game extraction:

- ClockWerx calls List Manager `LAddColumn` immediately after `LNew`. The old runtime consumed its arguments but did not create a column. All subsequent 12-byte cells in column 1 were rejected, producing corrupt level labels. The fix implements insertion, shifts existing cells and selection, and synchronizes the guest record.
- Delirium initialization module 5 requests `GetResource('itlb', 0)` and reads the keyboard-layout ID at byte 16. A missing bundle caused its explicit “Module failed: 5” alert. The fix supplies the standard Roman bundle pointing at the already implemented `KCHR 0`, after checking application resources first. It does not bundle a Macintosh System file or patch the game executable. The structure was checked against Apple's [IntlResources.h SDK header](https://github.com/phracker/MacOSX-SDKs/blob/master/MacOSX10.4u.sdk/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/CarbonCore.framework/Versions/A/Headers/IntlResources.h).

Private disassemblies and headless play captures are diagnostic scratch under `D:\SystemlessBuild\diagnostics`. They are not committed. Final compatibility results are recorded separately in `verification.md`; these diagnoses alone do not establish full-game compatibility.

Optional launcher previews are private `www/private/<game>-preview.png` captures. The build includes them when present; extraction alone does not generate previews. They remain ignored along with the owned game images.
