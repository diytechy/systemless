> This single-game iteration is retained as history. The current launcher and build instructions are in [the three-game iteration](../2026-11-06-private-library/README.md). Play-Koji.cmd now opens Koji through that shared launcher.

# Private Koji browser bundle

The local entry point is `C:\Projects\systemless\Play-Koji.cmd`. It starts a hidden, loopback-only server and opens `http://localhost:8087/koji-the-frog/` in the default browser. `Stop-Koji.cmd` stops only the matching server launched from this checkout. Python must remain installed; neither SheepShaver nor a Mac ROM is needed to play this build.

## Build again

From PowerShell in `C:\Projects\systemless`:

```powershell
.\scripts\Build-KojiBrowser.ps1
```

Add `-Extract` to refresh the private game image from the original disks. Close SheepShaver first so its image files are readable and stable. Extraction is read-only and checks that the source hashes do not change. It preserves data forks, resource forks and Finder type/creator metadata, and verifies them by reopening the generated HFS image. It copies the Koji folder's files from `Content\001` and the two existing Koji registration preferences from `Content\Boot`; it does not copy unrelated subfolders.

Build prerequisites used here:

- Rust/Cargo 1.96.0 with `rustup target add wasm32-unknown-unknown`.
- Trunk 0.21.14 at `D:\SystemlessBuild\tools\trunk-0.21.14\trunk.exe`. The official Windows release archive was checked against its published SHA-256 before extraction: https://github.com/trunk-rs/trunk/releases/tag/v0.21.14
- Python 3.8+ for serving and packaging; `uv` supplies Python 3.12 and `machfs==1.3` for HFS extraction.
- Build/cache storage at `D:\SystemlessBuild`; change `-BuildRoot` if necessary.

The first release build can take a while. Output is `www\dist`; private input media and extraction provenance are `www\private`. Both are ignored by Git. `SYSTEMLESS_PRIVATE_KOJI=1` selects a single-game catalogue at compile time; without it the upstream catalogue remains the default. The private build refuses the upstream production flag. No game binaries or registration values were added to tracked source.

## Playing

Click the game canvas or **Focus game** before using the keyboard/controller. Keyboard controls: J/L (or Left/Right) move; U/I/O jump left/up/right; Space extends the tongue, K/Down releases a water drop, and P pauses. These browser aliases map onto the existing saved Mac controls (keypad 4/6, Space, Command, Control and brackets); the original preferences are preserved. A standard-mapped controller uses its left stick/D-pad to move, A/D-pad up to jump, B/X for tongue, Y for water drops, shoulder buttons for diagonal jumps, and Start to pause. The gamepad adapter releases held keys when focus is lost or the pad disconnects. Nonstandard controllers need an OS mapping utility or a future custom binding UI.

**Picture** selects crisp pixels or browser smoothing. This is display scaling, not replacement artwork. **Fullscreen** expands the playing surface. A true high-resolution art pass would require decoding/replacing the game's resources or intercepting individual sprites; a rewritten HTML5 engine is a separate project.

Use Systemless's **Saved files** UI to export progress for transfer to another browser/device. Saves are browser-local and tied to this origin and the private `koji-personal-204` game ID; they do not write back to the SheepShaver images. Moving to a HomeHub hostname creates a different browser origin, so export/import first. The original score file is copied into the private archive as the starting state.

## Later HomeHub hosting

The finished `www\dist` is a static site. Python/Rust/SheepShaver are not needed on HomeHub. Use a dedicated HTTPS hostname with this directory at the web root, because the existing application uses root-relative worker and asset URLs. Serve `.wasm` as `application/wasm` and preserve the isolation headers in `Caddyfile.example`. The route `/koji-the-frog/` must fall back to `index.html`.

Local inspection found the relevant Caddy deployment source at `C:\Projects\MiniPC-Deployer\stack\caddy\Caddyfile`, alongside its Docker Compose configuration. That stack is managed through the HomeHub deployment workflow. This task has not changed that stack, DNS, firewall rules, authentication, or a live HomeHub service.

For a future deployment, mount a copy of `www\dist` read-only at `/srv/koji`, adapt the example site's hostname to the existing HTTPS setup, and apply the deployment repository's own instructions. Keep the site within your existing private access boundary: the bundle includes the original game and your existing registration preferences. The `.gitignore` and `noindex` settings are not access controls.

Do not use `file://` to open `index.html`; browser modules, workers and WebAssembly need a web server. The minimal local server intentionally binds only to 127.0.0.1 and is not the HomeHub production service. The private service worker does not pre-cache assets; offline-installable play has not been implemented.

## Verification

See `verification.md` for the final build and browser checks. Research and initial compatibility qualifications are in `findings.md`.
