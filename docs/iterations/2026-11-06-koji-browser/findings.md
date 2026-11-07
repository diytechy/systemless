# Koji browser iteration — 2026-11-06

## Objective
Run Peter's existing Koji the Frog from his SheepShaver disk images in his fork of Systemless, accessible in a browser on this Windows PC. Prepare a repeatable, self-contained static build for possible later private HomeHub hosting. No HomeHub deployment is requested yet.

## Findings carried from the research chat
- Systemless reimplements classic Mac APIs and executes original Mac software; it is not a rewritten HTML5 version of each game. Browser and Windows builds exist: https://github.com/benletchford/systemless
- Upstream Koji catalogue: www/catalogue/koji-the-frog.md. Its hosted 2.0.1 shareware package has SHA-256 c2bec83fb36c1804707699333f7ec14a619a4f74020ee9bf25fbbee885d36a74 (828251 bytes). https://systemless.org/koji-the-frog/
- Upstream evidence proves startup, level-one entry and left movement, NOT full playthrough or saves. Earlier chat descriptions of compatibility should be read with that limit.
- Documented controls: J/L move; U/I/O jump; Space tongue. Verify against Peter's actual version before final controller mapping.
- Public systemless.org does not accept arbitrary visitor game archives. This private fork must use locally supplied assets rather than rely on that public catalogue flow.
- Infinite Mac is a full-Mac browser fallback: https://infinitemac.org/ and https://blog.persistent.info/2025/07/infinite-mac-embedding.html
- JoyToKey (https://joytokey.net/en/) or AntiMicroX (https://github.com/AntiMicroX/antimicrox) can map controllers to keyboard/mouse input. A browser-native mapping is also possible in this fork.
- No verified modern port was found for classic Mac Delirium; ClockWerx has an old Windows edition, but this does not convert the owned Mac files. Neither has been tested here.
- Rendering filters/upscaling can be added independently of game logic. Replacement sprites require more invasive, game-specific work. resource_dasm is useful for extraction and analysis (https://github.com/fuzziqersoftware/resource_dasm); Emscripten compiles adapted source, not arbitrary Mac executables (https://emscripten.org/docs/introducing_emscripten/about_emscripten.html).

## Local inputs and constraints
- Fork: C:\Projects\systemless (Systemless 0.110.1 at initial inspection).
- Original media: D:\SheepShaver_MAC_Emulator\Content\Boot and 001–008. Treat these as independent Mac disk images, not split archive parts (7-Zip's extension auto-detection mistakes 001 for a multipart archive).
- Preserve original media and both Macintosh file forks. Extract only the relevant game and supporting files into ignored private assets.
- Build caches and tools: D:\SystemlessBuild (C: has much less free space).
- docs/ is already ignored by the upstream repository; these iteration notes stay local unless explicitly added later.
- Browser support, original-game version, input, audio and persistence still need verification.

## HomeHub preparation
Inspect existing local hosting configuration to document a compatible static-serving option. Keep the original game files private and out of Git. For browser capabilities requiring a secure context, use localhost for development and HTTPS for eventual LAN hosting. Revisit Content-Type application/wasm, SPA routes, worker paths and cross-origin isolation headers during packaging.

## Private implementation
- The owned copy is **Koji the Frog 2.0.4**, located in `001/Koji the Frog`, not the upstream 2.0.1 catalogue archive.
- `Boot/System Folder/Preferences` contains the two existing Koji registration preference files. They are copied only to the ignored private image; their contents are not included in these notes or source code.
- Extraction produced a new 8 MiB HFS volume named `Koji`, containing nine relevant files. All data/resource forks and Finder types/creators round-tripped exactly; the source disk hashes were unchanged.
- A compile-time private catalogue override selects that local HFS image, targets the original application's 68K resource code, maps its preference files into the runtime system folder, and gives its browser saves a separate game ID.
- A small browser Gamepad API adapter adds standard controller support to Systemless's existing keyboard input. No emulator core changes were needed to add the adapter.
- Optional GitHub-star requests are disabled in private mode. Local fonts, scripts, workers, WebAssembly and game data are packaged together.
- The picture selector currently provides crisp pixels or browser smoothing. It does not replace original sprites or implement an AI upscaler.
- A true HTML5 rewrite would need to reproduce level rules, physics, enemy behavior, collision, timing and saves, with separately decoded original resources or new artwork. This iteration keeps the original logic and provides a browser platform for later rendering work.

## Controls discovered during the owned-copy test
The 2.0.4 copy uses saved bindings of keypad 4/6 (movement), Space (jump up), brackets (diagonal jumps), Command (tongue), and Control (water drop). These differ from the upstream catalogue instructions. The private override translates J/L/arrows, U/I/O, Space, and K/Down onto those saved bindings. Browser touch-key translation now also accepts keypad, Command and Control keys. P remains pause; Start on the controller maps to P.

The control boxes briefly appeared empty while the dialog was drawing; a subsequent frame showed the saved bindings correctly. This was not retained as a confirmed rendering defect. Background tabs pause the runtime, so interactive verification must keep the tab visible.
