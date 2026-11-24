use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde::Deserialize;
use systemless::controller_data::{GameData, Seed, Tuning};
use systemless::systems::macintosh::{
    game, machine_profile::reference_machine_profile, runner::FixtureRunner,
};

#[derive(Clone, Copy, Debug, Deserialize)]
pub(super) enum Architecture {
    #[serde(rename = "68k")]
    Classic,
    #[serde(rename = "ppc")]
    PowerPc,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct GameConfig {
    pub image_path: Option<PathBuf>,
    pub architecture: Option<Architecture>,
    pub executable_path: Option<String>,
    pub file_mappings: BTreeMap<String, String>,
    pub application_partition_size: Option<u32>,
    pub screen_size: Option<(u16, u16)>,
    pub screen_depth: Option<u16>,
    pub extra_save_paths: Vec<String>,
    pub boot_patches: Vec<Seed>,
    pub title: Option<String>,
    pub window_title: Option<String>,
    pub save_root: Option<PathBuf>,
    pub controls: GameData,
    pub tuning: Tuning,
}

impl GameConfig {
    pub fn read(path: &Path) -> Result<Self, String> {
        let text = std::fs::read_to_string(path)
            .map_err(|error| format!("cannot read {}: {error}", path.display()))?;
        let mut config: Self = serde_json::from_str(text.trim_start_matches('\u{feff}'))
            .map_err(|error| format!("{}: {error}", path.display()))?;
        let parent = path.parent().unwrap_or_else(|| Path::new("."));
        for path in [&mut config.image_path, &mut config.save_root]
            .into_iter()
            .flatten()
        {
            if path.is_relative() {
                *path = parent.join(&*path);
            }
        }
        Ok(config)
    }

    pub fn validate(&self) -> Result<(), String> {
        if let Some(size) = self.screen_size {
            validate_screen_size(size)?;
        }
        if let Some(depth) = self.screen_depth {
            super::parse_screen_depth(&depth.to_string())?;
        }
        if self
            .application_partition_size
            .is_some_and(|size| size < 131_072)
        {
            return Err("application partition size must be at least 131072 bytes".into());
        }
        for path in self
            .executable_path
            .iter()
            .chain(self.file_mappings.keys())
            .chain(self.file_mappings.values())
            .chain(&self.extra_save_paths)
            .chain(self.patches().map(|patch| &patch.path))
        {
            if path.trim_matches('/').split('/').any(|part| {
                part.is_empty() || part == "." || part == ".." || part.contains(['\\', ':', '\0'])
            }) {
                return Err(format!("invalid guest path {path:?}"));
            }
        }
        if let Some(patch) = self.patches().find(|patch| {
            patch.bytes.is_empty() || patch.offset.checked_add(patch.bytes.len()).is_none()
        }) {
            return Err(format!("invalid boot patch for {:?}", patch.path));
        }
        self.tuning.check()?;
        let profile = reference_machine_profile();
        let (width, height) = self
            .screen_size
            .unwrap_or((profile.screen_width, profile.screen_height));
        self.controls.check_for_screen([width, height])
    }

    fn patches(&self) -> impl Iterator<Item = &Seed> {
        self.controls.seed.iter().chain(&self.boot_patches)
    }

    pub fn apply_patches(&self, runner: &mut FixtureRunner, enforced_only: bool) {
        for patch in self
            .patches()
            .filter(|patch| !enforced_only || patch.enforce)
        {
            patch.apply_to_guest(runner);
        }
    }

    pub fn new_runner(&self, addressing_32_bit: bool, depth: Option<u16>) -> FixtureRunner {
        let mut runner =
            game::new_runner_with_display_options(addressing_32_bit, depth, self.screen_size);
        runner.set_preferred_executable_path(self.executable_path.as_deref());
        runner.set_application_partition_size(self.application_partition_size);
        if let Some(architecture) = self.architecture {
            runner.set_prefer_powerpc_executables(matches!(architecture, Architecture::PowerPc));
        }
        runner
    }
}

pub(super) fn parse_screen_size(value: &str) -> Result<(u16, u16), String> {
    let size = value
        .split_once(['x', 'X'])
        .and_then(|(w, h)| Some((w.parse().ok()?, h.parse().ok()?)))
        .ok_or("expected screen dimensions WxH")?;
    validate_screen_size(size)?;
    Ok(size)
}

fn validate_screen_size((width, height): (u16, u16)) -> Result<(), String> {
    let profile = reference_machine_profile();
    if (128..=profile.screen_width).contains(&width)
        && (128..=profile.screen_height).contains(&height)
    {
        Ok(())
    } else {
        Err(format!(
            "screen must be at least 128x128 and at most {}x{} for this machine",
            profile.screen_width, profile.screen_height
        ))
    }
}

pub(super) fn parse_file_mapping(value: &str) -> Result<(String, String), String> {
    value
        .split_once('=')
        .map(|(source, destination)| (source.to_owned(), destination.to_owned()))
        .ok_or_else(|| "expected a guest file mapping src=dst".into())
}

pub(super) fn parse_boot_patch(value: &str) -> Result<Seed, String> {
    serde_json::from_str(value)
        .map_err(|error| format!("expected a boot patch JSON object: {error}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use systemless::systems::macintosh::runner::VfsFileSnapshot;

    #[test]
    fn manifest_paths_are_relative_and_invalid_display_options_are_rejected() {
        let temp = tempfile::tempdir().unwrap();
        let path = temp.path().join("config.json");
        std::fs::write(
            &path,
            r#"{"imagePath":"game.img","saveRoot":"saves","screenSize":[640,480]}"#,
        )
        .unwrap();
        let mut config = GameConfig::read(&path).unwrap();
        assert_eq!(config.image_path, Some(temp.path().join("game.img")));
        assert_eq!(config.save_root, Some(temp.path().join("saves")));
        assert_eq!(parse_screen_size("640x480"), Ok((640, 480)));
        assert!(parse_screen_size("65535x480").is_err());
        config.validate().unwrap();
        config.screen_depth = Some(3);
        assert!(config.validate().is_err());
    }

    #[test]
    fn saved_settings_win_except_where_a_boot_patch_is_enforced() {
        let mut runner = FixtureRunner::new(8 * 1024 * 1024, Default::default());
        let mut config = GameConfig::default();
        let mut file = VfsFileSnapshot {
            path: "System Folder/Preferences/Fictional".into(),
            data_fork: vec![0, 0],
            resource_fork: vec![4],
            file_type: u32::from_be_bytes(*b"pref"),
            creator: u32::from_be_bytes(*b"TEST"),
            finder_flags: 0,
            created_date: 1,
            modified_date: 1,
        };
        config.boot_patches = vec![
            Seed {
                path: file.path.clone(),
                offset: 0,
                bytes: vec![1],
                enforce: false,
            },
            Seed {
                path: file.path.clone(),
                offset: 1,
                bytes: vec![2],
                enforce: true,
            },
        ];
        runner.import_vfs_file(&file);
        config.apply_patches(&mut runner, false);
        assert_eq!(
            runner.vfs_file_snapshot(&file.path).unwrap().data_fork,
            [1, 2]
        );
        file.data_fork = vec![8, 9];
        runner.import_vfs_file(&file);
        config.apply_patches(&mut runner, true);
        file.data_fork = vec![8, 2];
        assert_eq!(runner.vfs_file_snapshot(&file.path), Some(file));
    }
}
