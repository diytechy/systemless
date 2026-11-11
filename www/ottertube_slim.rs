//! Slim add-on variant for OtterTube: Cargo feature `ottertube`.
//!
//! Compiles exactly the three private entries below and nothing else: no public
//! catalogue entry and no Koji. It narrows an ordinary private library build, so
//! it needs the same inputs (`SYSTEMLESS_PRIVATE_LIBRARY=1`, the media directory
//! and an additions manifest that carries Blobbo). Without the feature this file
//! does nothing.
use std::env;
use systemless_catalogue_tools::catalogue_tools::catalogue::CompiledCatalogue;

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
}
