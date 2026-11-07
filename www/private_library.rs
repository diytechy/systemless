//! Additional owned games in the opt-in, private three-game library.
use std::{env, path::Path};
use systemless_catalogue_tools::catalogue_tools::{
    catalogue::CompiledCatalogue,
    model::{ArtifactRole, Button, Controls, FileType, Runtime, Status},
};

pub fn apply(compiled: &mut CompiledCatalogue, site_dir: &Path) {
    println!("cargo:rerun-if-changed=private_library.rs");
    println!("cargo:rerun-if-env-changed=SYSTEMLESS_PRIVATE_LIBRARY");
    match env::var("SYSTEMLESS_PRIVATE_LIBRARY").as_deref() {
        Err(env::VarError::NotPresent) => return,
        Ok("1") => {}
        _ => panic!("SYSTEMLESS_PRIVATE_LIBRARY must be 1 or unset"),
    }
    let template = compiled
        .entries
        .first()
        .expect("private Koji entry missing")
        .clone();
    for (slug, id, title, developer, folder, executable, depth, memory, preferences, summary, notes) in [
        ("clockwerx", "clockwerx-personal-10", "ClockWerx", "Spectrum HoloByte", "ClockWerx", "ClockWerx Folder/ClockWerx", 8, 4_096_000,
         vec!["ClockWerx Scores", "ClockWerx Settings"],
         "Swing, bounce and flip between dots in the original clock-hand puzzle.",
         "<h2>ClockWerx controls</h2><p>Space: swing. Z: bounce. X: flip. C: reverse. Hold an action as you reach a dot. These browser keys map to the original Command, Option, Control and Space bindings.</p><p>Controller A: swing, B: bounce, X: flip, Y: reverse. Start: pause (Command-P). Click New game above, enter a name, select a numbered level, then click Play.</p>"),
        ("delirium", "delirium-personal-11", "Delirium 1.1", "Tuan Huynh", "Delirium", "Delirium 1.1 Folder/Delirium 1.1", 4, 2_048_000,
         vec!["Delirium 1.1 Preferences"],
         "Defend the landscape in this classic Macintosh arcade shooter.",
         "<h2>Delirium controls</h2><p>Arrow keys move in Classic mode. In Delirium mode use Up/Down, Space or C to thrust, and V to reverse. Z fires; X uses a smart bomb. Controller A: fire, B: smart bomb, X: reverse, Y: thrust. P pauses; any key resumes. Escape aborts. These mappings match the saved Command/Shift/Control/Space actions; Preferences / Set Keys can change them.</p><p>Use Saved files to download browser-local progress before moving to another browser or device.</p>"),
    ] {
        let archive = site_dir.join(format!("private/{slug}.img"));
        println!("cargo:rerun-if-changed={}",archive.display());
        assert!(archive.is_file(), "Run scripts/extract_library.py first");
        let mut game = template.clone();
        game.id = id.into();
        game.title = title.into();
        game.path = format!("/{slug}/");
        game.developer = developer.into();
        game.publisher = None;
        game.year = 1995;
        game.category = if slug == "clockwerx" { "Puzzle" } else { "Arcade" }.into();
        game.summary = summary.into();
        game.content_html = notes.into();
        game.compatibility.status = Status::Unknown;
        game.compatibility.verified.clear();
        game.references.clear();
        game.runtime = Runtime::default();
        game.runtime.show_menu_bar = true;
        game.runtime.executable_path = Some(format!("{folder}/{executable}"));
        game.runtime.screen_size = Some((640,480));
        game.runtime.screen_depth = Some(depth);
        game.runtime.application_partition_size = Some(memory);
        for name in preferences {
            game.runtime.file_mappings.insert(format!("{folder}/System Folder/Preferences/{name}"),format!("System Folder/Preferences/{name}"));
        }
        game.controls = Controls::default();
        if slug == "clockwerx" {
            for (from,to) in [("Space","Meta"),("z","Alt"),("x","Control"),("c","Space"),("Z","Alt"),("X","Control"),("C","Space")] {
                game.controls.key_mappings.insert(from.into(),to.into());
            }
            game.controls.mobile.enabled = true;
            for direction in [&mut game.controls.mobile.joystick.up, &mut game.controls.mobile.joystick.down, &mut game.controls.mobile.joystick.left, &mut game.controls.mobile.joystick.right] {
                *direction = "None".into();
            }
            game.controls.mobile.buttons = [("Swing","Meta"),("Bounce","Alt"),("Flip","Control"),("Reverse","Space")].into_iter().map(|(label,key)|Button{label:label.into(),key:key.into()}).collect();
        }
        if slug == "delirium" {
            for (from,to) in [("ArrowUp","Numpad8"),("ArrowDown","Numpad2"),("ArrowLeft","Numpad4"),("ArrowRight","Numpad6"),("z","Meta"),("x","Shift"),("c","Space"),("v","Control"),("Z","Meta"),("X","Shift"),("C","Space"),("V","Control")] {
                game.controls.key_mappings.insert(from.into(),to.into());
            }
            game.controls.mobile.enabled = true;
            game.controls.mobile.joystick.up = "Numpad8".into();
            game.controls.mobile.joystick.down = "Numpad2".into();
            game.controls.mobile.joystick.left = "Numpad4".into();
            game.controls.mobile.joystick.right = "Numpad6".into();
            game.controls.mobile.buttons = [("Fire","Meta"),("Bomb","Shift"),("Thrust","Space"),("Reverse","Control")].into_iter().map(|(label,key)|Button{label:label.into(),key:key.into()}).collect();
        }
        let asset = &mut game.assets[0];
        asset.url = format!("/private/{slug}.img");
        asset.size_bytes = Some(archive.metadata().expect("archive metadata").len());
        asset.rights.rights_holder = None;
        asset.rights.license = None;
        compiled.entries.push(game);
    }
    for (game, slug) in compiled.entries.iter_mut().zip(["koji", "clockwerx", "delirium"]) {
        let preview = site_dir.join(format!("private/{slug}-preview.png"));
        println!("cargo:rerun-if-changed={}", preview.display());
        if preview.is_file() {
            let mut asset = game.assets[0].clone();
            asset.id = "private-preview".into();
            asset.role = ArtifactRole::Screenshot;
            asset.format = FileType::Png;
            asset.url = format!("/private/{slug}-preview.png");
            asset.size_bytes = Some(preview.metadata().expect("preview metadata").len());
            asset.rights.content_only = true;
            game.assets.push(asset);
        }
    }
}
