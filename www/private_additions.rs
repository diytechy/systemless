//! Explicitly reviewed copied media, available only in a private library build.
use serde::Deserialize;
use std::{collections::BTreeMap, env, path::Path, process::Command};
use systemless_catalogue_tools::catalogue_tools::{
    catalogue::CompiledCatalogue,
    community::CommunityLinks,
    model::{Architecture, ArtifactRole, Controls, FileType, Runtime, Status},
};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Addition {
    slug: String,
    id: String,
    title: String,
    summary: String,
    developer: String,
    year: Option<u16>,
    category: String,
    notes_html: String,
    image_path: String,
    image_sha256: String,
    packaged_path: String,
    architecture: Architecture,
    executable_path: String,
    screen_size: (u16, u16),
    screen_depth: u16,
    application_partition_size: Option<u32>,
    file_mappings: BTreeMap<String, String>,
    key_mappings: BTreeMap<String, String>,
}

pub fn apply(compiled: &mut CompiledCatalogue, site_dir: &Path) {
    println!("cargo:rerun-if-changed=private_additions.rs");
    println!("cargo:rerun-if-env-changed=SYSTEMLESS_PRIVATE_ADDITIONS");
    println!("cargo:rerun-if-env-changed=SYSTEMLESS_PRIVATE_PYTHON");
    let Some(manifest) = env::var_os("SYSTEMLESS_PRIVATE_ADDITIONS") else {
        return;
    };
    assert_eq!(
        env::var("SYSTEMLESS_PRIVATE_LIBRARY").as_deref(),
        Ok("1"),
        "private additions require SYSTEMLESS_PRIVATE_LIBRARY=1"
    );
    assert!(
        env::var_os("SYSTEMLESS_CATALOGUE_PRODUCTION").is_none(),
        "private additions cannot enter the production catalogue"
    );
    let validator = site_dir
        .parent()
        .unwrap()
        .join("scripts/private_library_manifest.py");
    println!("cargo:rerun-if-changed={}", validator.display());
    println!("cargo:rerun-if-changed={}", Path::new(&manifest).display());
    let output =
        Command::new(env::var_os("SYSTEMLESS_PRIVATE_PYTHON").unwrap_or_else(|| "python".into()))
            .arg(&validator)
            .arg(&manifest)
            .arg("--normalized")
            .output()
            .expect("run private manifest validator");
    assert!(
        output.status.success(),
        "invalid private additions: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    let rows: Vec<Addition> =
        serde_json::from_slice(&output.stdout).expect("validated addition metadata");
    let template = compiled
        .entries
        .first()
        .expect("private Koji entry")
        .clone();
    for row in rows {
        println!("cargo:rerun-if-changed={}", row.image_path);
        let mut game = template.clone();
        game.id = row.id;
        game.title = row.title;
        game.path = format!("/{}/", row.slug);
        game.summary = row.summary;
        game.developer = row.developer;
        game.publisher = None;
        // Zero is rendered as an empty year by the private build below.
        game.year = row.year.unwrap_or(0);
        game.category = row.category;
        game.architectures = vec![row.architecture];
        game.default_architecture = row.architecture;
        game.architecture_archives.clear();
        game.aliases.clear();
        game.plugins.clear();
        game.references.clear();
        game.compatibility.status = Status::Unknown;
        game.compatibility.verified.clear();
        game.content_html = row.notes_html;
        game.community = CommunityLinks {
            source: String::new(),
            edit: String::new(),
            metadata_issue: String::new(),
            compatibility_issue: String::new(),
            suggest_controls_config: String::new(),
            takedown_request: String::new(),
            open_reports: String::new(),
            history: String::new(),
        };
        game.runtime = Runtime {
            show_menu_bar: true,
            executable_path: Some(row.executable_path),
            screen_size: Some(row.screen_size),
            screen_depth: Some(row.screen_depth),
            application_partition_size: row.application_partition_size,
            file_mappings: row.file_mappings,
            ..Runtime::default()
        };
        game.controls = Controls {
            key_mappings: row.key_mappings,
            ..Controls::default()
        };
        game.assets.retain(|a| a.role == ArtifactRole::Archive);
        let asset = game.assets.first_mut().expect("private archive");
        asset.id = "private-image".into();
        asset.format = if row.packaged_path.ends_with(".kpk") {
            FileType::Kpk
        } else {
            FileType::Img
        };
        asset.url = format!("/{}", row.packaged_path);
        asset.sha256 = Some(row.image_sha256);
        asset.size_bytes = Some(
            std::fs::metadata(row.image_path)
                .expect("verified image metadata")
                .len(),
        );
        asset.rights.rights_holder = None;
        asset.rights.license = None;
        compiled.entries.push(game);
    }
}
