//! Opt-in personal build. No private media enters the checked-in public catalogue.
use std::{env, path::Path};
use systemless_catalogue_tools::catalogue_tools::{
    catalogue::CompiledCatalogue,
    model::{ArtifactRole, Button, FileType, Redistribution},
};

pub fn apply(compiled: &mut CompiledCatalogue, site_dir: &Path) {
    println!("cargo:rerun-if-changed=private_koji.rs");
    println!("cargo:rerun-if-env-changed=SYSTEMLESS_PRIVATE_KOJI");
    match env::var("SYSTEMLESS_PRIVATE_LIBRARY")
        .or_else(|_| env::var("SYSTEMLESS_PRIVATE_KOJI"))
        .as_deref()
    {
        Err(env::VarError::NotPresent) => return,
        Ok("1") => {}
        _ => panic!("SYSTEMLESS_PRIVATE_KOJI must be 1 or unset"),
    }
    assert!(
        env::var_os("SYSTEMLESS_CATALOGUE_PRODUCTION").is_none(),
        "private Koji cannot be built as the upstream public catalogue"
    );
    let archive = site_dir.join("private/koji.img");
    println!("cargo:rerun-if-changed={}", archive.display());
    assert!(
        archive.is_file(),
        "Run scripts/extract_koji.py before the private build"
    );
    compiled.entries.retain(|entry| entry.id == "koji-the-frog");
    let game = compiled
        .entries
        .first_mut()
        .expect("upstream Koji entry missing");
    game.id = "koji-personal-204".into();
    game.title = "Koji the Frog 2.0.4".into();
    game.summary = "Catch insects, dodge the hazards, and keep Koji hopping.".into();
    game.aliases.clear();
    game.architecture_archives.clear();
    game.plugins.clear();
    game.content_html = "<h2>Your Koji collection</h2><p>Original 2.0.4 game from your SheepShaver library.</p><p>Move: J / L or arrow keys. Jump: U / I / O. Tongue: Space. Water drop: K or Down. Pause: P. Click inside the game for keyboard control.</p><p>Connect a standard gamepad and press a button: D-pad or left stick to move, A to jump, X/B to catch insects, Y for a water drop, shoulders for diagonal jumps, Start to pause.</p><p>Use the Saved files tab to export progress before changing browser or device.</p>".into();
    game.runtime.executable_path = Some("Koji/Koji the Frog/Koji the Frog 2.0.4".into());
    game.runtime.screen_size = Some((640, 480));
    game.runtime.screen_depth = Some(8);
    for name in ["Koji 2.0 Registration", "Koji Registration"] {
        game.runtime.file_mappings.insert(
            format!("Koji/System Folder/Preferences/{name}"),
            format!("System Folder/Preferences/{name}"),
        );
    }
    game.controls.key_mappings.clear();
    for (from, to) in [
        ("ArrowLeft", "Numpad4"),
        ("ArrowRight", "Numpad6"),
        ("ArrowUp", "Space"),
        ("ArrowDown", "Control"),
        ("j", "Numpad4"),
        ("l", "Numpad6"),
        ("i", "Space"),
        ("u", "["),
        ("o", "]"),
        ("k", "Control"),
        ("Space", "Meta"),
        ("J", "Numpad4"),
        ("L", "Numpad6"),
        ("I", "Space"),
        ("U", "["),
        ("O", "]"),
        ("K", "Control"),
    ] {
        game.controls.key_mappings.insert(from.into(), to.into());
    }
    game.controls.mobile.enabled = true;
    game.controls.mobile.joystick.left = "Numpad4".into();
    game.controls.mobile.joystick.right = "Numpad6".into();
    game.controls.mobile.joystick.up = "Space".into();
    game.controls.mobile.joystick.down = "None".into();
    game.controls.mobile.buttons = vec![
        Button {
            label: "Jump".into(),
            key: "Space".into(),
        },
        Button {
            label: "Tongue".into(),
            key: "Meta".into(),
        },
        Button {
            label: "Drop".into(),
            key: "Control".into(),
        },
    ];
    game.assets.retain(|a| a.role == ArtifactRole::Archive);
    let asset = game.assets.first_mut().expect("Koji archive missing");
    asset.url = "/private/koji.img".into();
    asset.format = FileType::Img;
    asset.sha256 = None;
    asset.size_bytes = Some(
        archive
            .metadata()
            .expect("read private image metadata")
            .len(),
    );
    asset.rights.redistribution = Redistribution::Unknown;
    asset.rights.original = false;
    asset.rights.permission = None;
    asset.rights.sources.clear();
    asset.rights.notes = Some("Personal extraction from the owner's Mac disks. No public redistribution permission is asserted.".into());
}
