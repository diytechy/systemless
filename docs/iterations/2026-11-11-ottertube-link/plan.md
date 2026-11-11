# Mac games inside OtterTube, with per-child saves: plan (2026-11-11)

Status: plan only. Nothing is built. Scope: the emulated ClockWerx, Delirium and Blobbo (not the ClockWerx HTML5 port, which is
separate work on `SVG-Port`). Work happens in the worktree `C:\Projects\systemless-ottertube-saves`, branch
`research/ottertube-saves`; the main checkout and `D:\SystemlessBuild\private-library-20261107` are not touched.

V = read in code or measured. U = unproven, a test decides.

## 1. Answers first

- **Where the emulation runs: in the child's browser.** Systemless is WebAssembly in a web worker on the device that shows the
  game (V: `www/src/worker_runtime.rs`, `emulator-worker.js`). A server only hands out files. The hub would never run a game.
- **What a three-game bundle weighs:** about 35 MB: the 14 MB WebAssembly file plus images of 8 MB (ClockWerx), 2 MB (Delirium)
  and 8 MB (Blobbo) (V, measured in the active build). The full 61-game library is 1.3 GB; this plan does not ship it.
- **How it links to OtterTube: each game is an "At home" add-on.** OtterTube opens the game's page, tells it who is playing by a
  private id (never a name) and hands back that child's save (V: OtterTube `docs/ADDONS.md` sections 6-7).
- **Controls: Systemless already has an on-screen layer** (a joystick and up to four labelled buttons, mapped to Mac keys per
  game) and a gamepad adapter. ClockWerx and Delirium have layouts (V: `www/private_library.rs:55-75`). Blobbo is played by
  clicking in a direction, which a tap already does (V: its first-pass report). What is unproven is that the layer shows and
  works inside OtterTube's desktop window (section 5).

## 2. The shape

```
 child's device                                home network
 +-----------------------------------+        +---------------------------+
 | OtterTube (desktop app or browser)|        | hub: Caddy, static files  |
 |  +------------------------------+ |  https | macgames.<home name>/     |
 |  | add-on view / frame          |<---------|   index.html, .wasm       |
 |  |  Systemless page             | |        |   /private/clockwerx.img  |
 |  |   wasm worker = the Mac      | |        |   /private/delirium.img   |
 |  |   control layer, filter      | |        |   /private/blobbo.img     |
 |  +-------^----------------------+ |        |   addons.json + .sig      |
 |          | init(subject, saved)   |        +---------------------------+
 |          | checkpoint(save text)  |
 |  OtterTube keeps the save per user (and syncs it, section 4)
 +-----------------------------------+
```

Three pieces of work, in three repositories:

| Piece | Repository | Size |
|---|---|---|
| A. "Inside OtterTube" mode, save bridge, slim three-game build | Systemless (this worktree) | the main build |
| B. A LAN-only https site for the bundle, and the signed add-on list | HomeHub + MiniPC-Deployer | small: one Caddy site, one folder, one release step |
| C. Entries in a home list; tests in raw touch; possibly where saves sync | OtterTube | none to small, depending on section 4 |

## 3. Piece A: Systemless

All of it behind one switch (a build feature `ottertube` plus the page noticing it is opened by OtterTube), so the existing
library build and its saves behave exactly as today.

1. **Slim build.** The game list is fixed at compile time (V: `www/build.rs:41-43`). Add a build variant that compiles only the
   three entries and their images. Own output folder and own Cargo target folder on `D:` (for example
   `D:\SystemlessBuild\ottertube-link\`), so the running library build and the other session's caches are never written.
2. **Connect before boot.** Vendor OtterTube's `ottertube-addon.js` (one file). On a game route, call `connect`, send `ready`,
   and wait for `init` before creating the machine. Today the route boots at page load (V: `www/src/catalogue.rs:234-241`).
   No answer within a few seconds means "not inside OtterTube": show a plain message, do not boot with shared saves.
3. **Per-child saves.** `init` carries `subject` (32 hex, the same on every device for this child and this game) and `saved`.
   - Namespace the local store by subject: the key becomes `{game_id}@{subject}\0{path}` (V: today `{game_id}\0{path}`,
     `www/src/save_store.rs:224`). Guest (`subject` null) gets a memory-only session: nothing kept.
   - If `saved` is present, unpack it into the overlay the machine loads at boot (V: the restore path at
     `www/src/emulator.rs:438-460`).
4. **Checkpoint out.** The worker already posts `saveFiles` on every change (V: `emulator-worker.js:120-126`). Collect it,
   and at most once per 2 s send one checkpoint: a versioned text holding every changed file with its FULL path, both forks,
   type, creator and dates, deflated then base64. Limit 256 KiB per save (OtterTube's); ClockWerx today is about 20 KB (V).
   Over the limit: keep playing, show nothing to the child, record it for the parent page. Not the MacBinary export: that
   loses folders (V: `save_store.rs:349-373`).
5. **Do not lose the tail.** OtterTube tears an add-on down at once on leaving and keeps only the last acknowledged
   checkpoint. So: checkpoint immediately on the first change after a quiet spell, flush on `pagehide`, and keep the
   namespaced local copy as a second source; at `init`, take whichever of local and `saved` is newer (a counter inside
   the save text).
6. **Saved paths per game.** Root `System Folder/Preferences/` is never saved in the browser (V: `emulator.rs:1495-1512`).
   - ClockWerx: Scores and Settings land in `ClockWerx/System Folder/Preferences/`, which is saved (V).
   - Delirium: preferences and high scores, path to be traced (U).
   - Blobbo: its preference file is opened at ROOT `System Folder/Preferences/Blobbo Preferencs` (V: its report), which is
     the excluded path; saved games are files the player writes (U where). Fix per game with an allow-list of extra saved
     paths in the entry, not by lifting the exclusion for everyone.
7. **Kiosk manners.** In this mode: no "All games" and "Library" links (V: they reach all games,
   `scripts/game-controls.mjs:100`), no Saved files tab, no fullscreen button (OtterTube owns the window), a
   `frame-ancestors` header naming OtterTube's origins, and an Exit that calls the add-on `exit`.
8. **Name entry.** ClockWerx asks for a player name to start a game (V: its notes). Either pre-seed one neutral pilot per
   child in the save, or accept typing. A typed name inside a save is the privacy question in section 4.

Checks for A: unit tests for the save text (round trip, both forks, paths, size refusal, version); a browser test with a fake
OtterTube host page doing `init` and reading checkpoints for two subjects, proving one child never sees the other's file.

## 4. Where saves live and sync

OtterTube offers an add-on two modes (V: `docs/ADDONS.md` section 7). A third needs new OtterTube work.

| | How | Syncs to | Cost | Catch |
|---|---|---|---|---|
| **1. `save: host`** (recommended to start) | OtterTube stores the checkpoint under the user | the family's devices, through the user service (Cloudflare), like game progress | nothing new in OtterTube | 256 KiB per save; about 4 MiB per device for all users and add-ons; a typed pilot name would reach Cloudflare |
| **2. `save: self` + a save endpoint on the hub** | the page PUTs the save to the hub, keyed by `subject`; the hub writes it to the media share | the media share only; nothing leaves home | a small hub service with write access; LAN-only | new moving part on the hub; no save when the hub is down unless the local copy carries it |
| **3. Host saves that follow the creations folder** | OtterTube writes add-on saves into the parent-set network path, as it does creations | the family's own folder | an OtterTube change (new record route, conflict rule) | largest; a design of its own |

Recommendation: **pilot on mode 1**, with a neutral pre-seeded pilot name so no typed name is in the save. It is built,
works in a browser and on the desktop, and the three games are far under the limits. Decide between staying there and
mode 2 after the pilot, on the Owner's call about what may reach Cloudflare. The save text is the same in every mode, so
the choice does not change piece A.

"Sync to the media location that is already handled" maps to mode 2 or 3. Mode 2 fits an add-on today: the add-on's own
origin is the hub, so a same-origin PUT needs no OtterTube change, and `subject` is stable across devices. It does put a
writing service on the hub, which OtterTube's build-out plan ("the hub stays out of the loop") did not plan for; that
ruling would be amended for this.

## 5. Controls, a controller, filters

What exists (V):
- Touch or pen on the picture is a one-button Mac mouse (`www/src/components/game_screen.rs:3500-3520`).
- The on-screen layer: a joystick and labelled buttons per entry, each bound to a Mac key. It appears only when the entry
  enables it AND the screen matches `(hover: none) and (pointer: coarse) and (orientation: landscape)` or a short
  landscape window (`www/src/style.css:1750-1751`).
- A gamepad adapter that presses the same keys (`scripts/game-controls.mjs`), needing the picture to have focus.
- Picture scaling: crisp or smooth. The picture is drawn through WebGL shaders (`www/src/presentation.rs`).

| Game | Play needs | Plan |
|---|---|---|
| ClockWerx | four timed actions; menus by tap | existing layout (Swing, Bounce, Flip, Reverse); buttons sized for a child; pause button |
| Delirium | move, fire, bomb, thrust, reverse | existing layout (joystick + four); arcade pace on glass is the risk: judge by play |
| Blobbo | click a direction; menus | taps work as is; optional four-arrow pad bound to its keys once the keys are read from its settings |

To build:
1. **Show the layer by request, not by media query.** In OtterTube mode the layer is on whenever the entry has one. On the
   desktop's touch monitor the media query may not match (a mouse is attached), which would hide it (U).
2. **Layout per game in the entry** (position, size, which buttons), so a new game is data, not code.
3. **Multi-touch:** joystick and a button at once. Works in a browser; inside OtterTube's raw-touch add-on view it is
   unproven (OtterTube lists raw touch on add-on views as an open item) (U). This is the main feasibility test.
4. **Controller:** the adapter needs keyboard focus in the game's view; OtterTube in raw touch gives its window the keyboard
   only after a mouse click, by design. Test whether a pad reaches an add-on view; if not, it needs a small OtterTube change
   (focus the add-on view on gamepad input) (U).
5. **Filters:** add a picture option beyond crisp and smooth, as a fragment-shader pass (scanlines or a soft CRT look), chosen
   per entry with a parent-side override. Optional; after the pilot.

## 6. Piece B: serving it

The player needs its own origin root (V: root-relative URLs), and a home list needs https on a name whose every address is
private (V: `docs/ADDONS.md` section 5; loopback and public addresses are refused).

- **Hub (recommended).** It already serves OtterTube's web build and update channel through Caddy, LAN-only, with real
  certificates. Add one more LAN-only name (for example `macgames.<home name>`, a labelled exception, no wildcard) serving a
  read-only folder: the 35 MB bundle and the signed `addons.json`. Load on the hub: static files, fetched once per device and
  cached. Release step: a publish script from the dev PC, like the OtterTube update publish.
- **Dev PC** as the server: works for a pilot (Caddy locally with a LAN name), but every device then depends on this PC
  being on. Use it only if the hub is ruled out.
- The bundle holds original game files. LAN-only serving behind the home network is the same boundary as the hub's other
  private content, but Systemless `AGENTS.md` says preparation "does not authorize deployment". Serving it from the hub is
  therefore an explicit Owner decision, recorded before anything is published.
- Away from home the tile is greyed on a desktop and says "This app works at home" (V). That is acceptable for these games.

## 7. Piece C: OtterTube

- One home list, three entries (`save: host`, touch type per game). Signed with the list key; the parent adds the list once.
- Tests on the real touch monitor: the layer in raw touch, two fingers, a controller, leaving mid-game, user switch
  (the view must close and the next child must get their own save), Guest keeps nothing.
- `docs/DECISIONS.md` row "ClockWerx: no emulator" is amended: an emulator is acceptable where it has a fitted control
  layer and the play is judged good (the Owner, 2026-11-11). The HTML5 port stays the preferred route if it lands.
- Possible small changes, only if tests demand: gamepad focus for add-on views; the 4 MiB device cap if more games follow.

## 8. Order of work

| Step | What | Proves | Stop if |
|---|---|---|---|
| 0 | Decisions in section 9 | | |
| 1 | Slim build of the three games in its own folders; open it locally | the variant builds without touching the library | |
| 2 | Save text + namespacing + fake-host browser test | two children, two saves, restore works (ClockWerx first) | a game's progress cannot be captured as files |
| 3 | Control layer forced on; child-sized layouts; Blobbo taps | playable by touch in a plain browser | Delirium is not playable on glass: drop it from the first set |
| 4 | Serve from a LAN https name (dev PC first), signed home list, open in OtterTube desktop | the add-on handshake, raw touch, multi-touch, leaving, user switch | raw touch cannot drive an add-on view: needs OtterTube work first |
| 5 | Hub site + publish script; second device | a save follows the child to another device | |
| 6 | Controller, filter, more games | | |

Steps 1 to 3 touch only this worktree and can start now. Step 4 is the first that needs the Owner at the touch monitor.

## 9. Decisions for the Owner

1. Hub serves the three-game bundle on a LAN-only https name: yes or no (section 6).
2. Saves: start with OtterTube's own per-user save, syncing through the user service, with no typed names in it; decide the
   media-share route after the pilot (section 4). Or go straight to the hub save endpoint.
3. ClockWerx name entry: one pre-seeded neutral pilot per child, or let children type.
4. Blobbo: Full 1.0.1 (the registered copy in the library) is the one to ship at home: confirm.

### Decided by the Owner, 2026-11-11

1. Yes: the hub serves the bundle on a LAN-only https name. Serving a private network is not the "deployment" the
   Systemless guide withholds. Other sessions are working on the hub: coordinate before any hub change.
2. The player name should ideally be the child's own, so a child jumps straight in. An add-on is given only the private id,
   never a name (OtterTube's rule), so this needs either an OtterTube change (pass a display name to home add-ons) or the
   HTML5 port. Until then: a pre-seeded neutral pilot per child, no typing.
3. Blobbo Full 1.0.1, as far as recalled.
4. Proceed with the work.

## 10. Not known yet

- Whether the control layer and two-finger play work inside OtterTube's raw-touch add-on view (step 4).
- Where Delirium and Blobbo write scores and saved games, and whether the allow-list covers them (step 2).
- Whether a controller reaches an add-on view without an OtterTube change.
- Real-time pace of the three games on the kids' devices (only the dev PC has been measured).
- No game has had a browser save taken out and put back; step 2 is the first such test.
