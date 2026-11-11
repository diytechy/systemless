//! Slim add-on variant for OtterTube: Cargo feature `ottertube`.
//!
//! Compiles exactly the three private entries below and nothing else: no public
//! catalogue entry and no Koji. It narrows an ordinary private library build, so
//! it needs the same inputs (`SYSTEMLESS_PRIVATE_LIBRARY=1`, the media directory
//! and an additions manifest that carries Blobbo). Without the feature this file
//! does nothing.
use std::env;
use systemless_catalogue_tools::catalogue_tools::{
    catalogue::CompiledCatalogue,
    model::{Button, Controls},
};

/// Game id and route, in the order they are listed.
pub const ENTRIES: [(&str, &str); 3] = [
    ("clockwerx-personal-10", "/clockwerx/"),
    ("delirium-personal-11", "/delirium/"),
    ("blobbo-full-personal-101", "/blobbo/"),
];

pub fn apply(compiled: &mut CompiledCatalogue) {
    println!("cargo:rerun-if-changed=ottertube_slim.rs");
    if env::var_os("CARGO_FEATURE_OTTERTUBE").is_none() {
        return;
    }
    assert_eq!(
        env::var("SYSTEMLESS_PRIVATE_LIBRARY").as_deref(),
        Ok("1"),
        "the ottertube feature narrows a private library build: set SYSTEMLESS_PRIVATE_LIBRARY=1"
    );
    assert!(
        env::var_os("SYSTEMLESS_PRIVATE_ADDITIONS").is_some(),
        "the ottertube feature needs SYSTEMLESS_PRIVATE_ADDITIONS (the manifest row for Blobbo)"
    );
    assert!(
        env::var_os("SYSTEMLESS_CATALOGUE_PRODUCTION").is_none(),
        "the ottertube add-on build cannot be the production catalogue"
    );
    compiled
        .entries
        .retain(|entry| ENTRIES.iter().any(|(id, _)| *id == entry.id));
    compiled.entries.sort_by_key(|entry| {
        ENTRIES
            .iter()
            .position(|(id, _)| *id == entry.id)
            .unwrap_or(usize::MAX)
    });
    let found: Vec<(&str, &str)> = compiled
        .entries
        .iter()
        .map(|entry| (entry.id.as_str(), entry.path.as_str()))
        .collect();
    assert_eq!(
        found,
        ENTRIES.to_vec(),
        "the ottertube add-on build must hold exactly ClockWerx, Delirium and Blobbo"
    );
    for entry in &mut compiled.entries {
        held_controls(&entry.id, &mut entry.controls);
        // Blobbo's board is a fixed 590 by 390 window. On the library's 800 by
        // 600 screen it is a small island; on 640 by 480 it nearly fills the
        // picture, which is what a finger needs.
        if entry.id == "blobbo-full-personal-101" {
            entry.runtime.screen_size = Some((640, 480));
        }
    }
}

/// The on-screen stick and held buttons of each game, for a child at a touch
/// screen: `(label, key)` in the order they are stacked, labelled with a word
/// and never a Mac key name. The key is what the game is set to read. A stick
/// direction of `None` means the game has no use for a stick.
fn held_controls(id: &str, controls: &mut Controls) {
    let (stick, buttons): ([&str; 4], &[(&str, &str)]) = match id {
        // Four timed actions and nothing to steer.
        "clockwerx-personal-10" => (
            ["None"; 4],
            &[
                ("Swing", "Meta"),
                ("Bounce", "Alt"),
                ("Flip", "Control"),
                ("Reverse", "Space"),
            ],
        ),
        // Up, down, left, right on the keypad keys its saved settings name.
        "delirium-personal-11" => (
            ["Numpad8", "Numpad2", "Numpad4", "Numpad6"],
            &[
                ("Fire", "Meta"),
                ("Bomb", "Shift"),
                ("Thrust", "Space"),
                ("Turn", "Control"),
            ],
        ),
        // Tapping beside Blobbo moves him; the stick presses the keys its Set
        // Keys dialog shows (8, 2, 4, 6: the keypad ones), with Rest and Drop beside it.
        "blobbo-full-personal-101" => (
            ["Numpad8", "Numpad2", "Numpad4", "Numpad6"],
            &[("Wait", "Space"), ("Drop", "s")],
        ),
        _ => return,
    };
    let mobile = &mut controls.mobile;
    mobile.enabled = true;
    mobile.joystick.up = stick[0].into();
    mobile.joystick.down = stick[1].into();
    mobile.joystick.left = stick[2].into();
    mobile.joystick.right = stick[3].into();
    mobile.buttons = buttons
        .iter()
        .map(|(label, key)| Button {
            label: (*label).into(),
            key: (*key).into(),
        })
        .collect();
}
