//! "Inside OtterTube" mode: the slim add-on build (Cargo feature `ottertube`).
//!
//! OtterTube opens a game route in a frame (or a desktop site view), tells the
//! page who is playing by an opaque `subject` and hands back that user's save.
//! The game then keeps its files under `{game_id}@{subject}` and sends every
//! change back as one save text. See docs/iterations/2026-11-11-ottertube-link.
//!
//! The save text and the choice between the local copy and OtterTube's are
//! plain functions, compiled for tests in every build. Everything that touches
//! the browser is behind the feature, so no other build changes.
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde::{Deserialize, Serialize};
use systemless::systems::macintosh::runner::VfsFileSnapshot;

/// The format written today. A reader refuses any other version.
pub const SAVE_TEXT_VERSION: u32 = 1;
const SAVE_TEXT_PREFIX: &str = "systemless-save:";
/// OtterTube's limit on a checkpoint: `{"data":...}` in UTF-8, 256 KiB.
pub const CHECKPOINT_BODY_MAX: usize = 256 * 1024;
/// The bytes `{"data":""}` adds around the text. The text is ASCII with nothing
/// JSON escapes, so its body is exactly this much longer than the text.
const CHECKPOINT_BODY_OVERHEAD: usize = 11;
/// No honest save unpacks past this. A reader refuses a text that does, so
/// the writer refuses to make one: zeros deflate well enough to pass the
/// checkpoint limit while being far larger than this.
const INFLATE_LIMIT: usize = 16 * 1024 * 1024;

/// One user's files for one game, with the counter that orders two copies.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SaveBundle {
    pub game_id: String,
    /// Rises with every change; the copy with the larger counter is the newer.
    pub counter: u64,
    pub files: Vec<VfsFileSnapshot>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum SaveTextError {
    /// The text would not fit a checkpoint. `body_bytes` is what it would be.
    TooLarge { body_bytes: usize },
    /// The files are more than any reader will unpack. `bytes` is their size
    /// as the payload, before deflate.
    TooLargeUnpacked { bytes: usize },
    /// Not a Systemless save text at all.
    NotSaveText,
    /// A save text of a version this build does not read.
    UnsupportedVersion(String),
    /// The right version, but damaged.
    Corrupt(String),
}

impl std::fmt::Display for SaveTextError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::TooLarge { body_bytes } => write!(
                f,
                "save is {body_bytes} bytes, over the {CHECKPOINT_BODY_MAX} byte limit"
            ),
            Self::TooLargeUnpacked { bytes } => write!(
                f,
                "save unpacks to {bytes} bytes, over the {INFLATE_LIMIT} byte limit"
            ),
            Self::NotSaveText => write!(f, "not a Systemless save text"),
            Self::UnsupportedVersion(version) => {
                write!(f, "save text version {version} is not supported")
            }
            Self::Corrupt(reason) => write!(f, "damaged save text: {reason}"),
        }
    }
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Payload {
    game_id: String,
    counter: u64,
    files: Vec<PayloadFile>,
}

/// One guest file: its FULL path, both forks and its Finder fields.
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct PayloadFile {
    path: String,
    file_type: u32,
    creator: u32,
    finder_flags: u16,
    created_date: u32,
    modified_date: u32,
    data_fork: String,
    resource_fork: String,
}

/// `systemless-save:1:` then base64 of the deflated JSON payload. Files are
/// written in path order, so equal bundles give equal texts.
pub fn encode_save_text(bundle: &SaveBundle) -> Result<String, SaveTextError> {
    let mut files: Vec<&VfsFileSnapshot> = bundle.files.iter().collect();
    files.sort_by(|left, right| left.path.cmp(&right.path));
    let payload = Payload {
        game_id: bundle.game_id.clone(),
        counter: bundle.counter,
        files: files
            .into_iter()
            .map(|file| PayloadFile {
                path: file.path.clone(),
                file_type: file.file_type,
                creator: file.creator,
                finder_flags: file.finder_flags,
                created_date: file.created_date,
                modified_date: file.modified_date,
                data_fork: BASE64.encode(&file.data_fork),
                resource_fork: BASE64.encode(&file.resource_fork),
            })
            .collect(),
    };
    let json =
        serde_json::to_vec(&payload).map_err(|error| SaveTextError::Corrupt(error.to_string()))?;
    if json.len() > INFLATE_LIMIT {
        return Err(SaveTextError::TooLargeUnpacked { bytes: json.len() });
    }
    let deflated = miniz_oxide::deflate::compress_to_vec(&json, 9);
    let text = format!(
        "{SAVE_TEXT_PREFIX}{SAVE_TEXT_VERSION}:{}",
        BASE64.encode(deflated)
    );
    let body_bytes = text.len() + CHECKPOINT_BODY_OVERHEAD;
    if body_bytes > CHECKPOINT_BODY_MAX {
        return Err(SaveTextError::TooLarge { body_bytes });
    }
    Ok(text)
}

pub fn decode_save_text(text: &str) -> Result<SaveBundle, SaveTextError> {
    let rest = text
        .strip_prefix(SAVE_TEXT_PREFIX)
        .ok_or(SaveTextError::NotSaveText)?;
    let (version, encoded) = rest.split_once(':').ok_or(SaveTextError::NotSaveText)?;
    if version != SAVE_TEXT_VERSION.to_string() {
        return Err(SaveTextError::UnsupportedVersion(version.to_string()));
    }
    let deflated = BASE64
        .decode(encoded)
        .map_err(|error| SaveTextError::Corrupt(format!("base64: {error}")))?;
    let json = miniz_oxide::inflate::decompress_to_vec_with_limit(&deflated, INFLATE_LIMIT)
        .map_err(|error| SaveTextError::Corrupt(format!("inflate: {error}")))?;
    let payload: Payload = serde_json::from_slice(&json)
        .map_err(|error| SaveTextError::Corrupt(format!("payload: {error}")))?;
    let mut files = Vec::with_capacity(payload.files.len());
    let mut seen = std::collections::BTreeSet::new();
    for file in payload.files {
        if !is_plain_guest_path(&file.path) {
            return Err(SaveTextError::Corrupt(format!("path {:?}", file.path)));
        }
        if !seen.insert(file.path.to_ascii_lowercase()) {
            return Err(SaveTextError::Corrupt(format!(
                "path {:?} twice",
                file.path
            )));
        }
        files.push(VfsFileSnapshot {
            data_fork: BASE64
                .decode(&file.data_fork)
                .map_err(|error| SaveTextError::Corrupt(format!("data fork: {error}")))?,
            resource_fork: BASE64
                .decode(&file.resource_fork)
                .map_err(|error| SaveTextError::Corrupt(format!("resource fork: {error}")))?,
            path: file.path,
            file_type: file.file_type,
            creator: file.creator,
            finder_flags: file.finder_flags,
            created_date: file.created_date,
            modified_date: file.modified_date,
        });
    }
    Ok(SaveBundle {
        game_id: payload.game_id,
        counter: payload.counter,
        files,
    })
}

/// A relative guest path with real components: `Volume/Folder/File`.
fn is_plain_guest_path(path: &str) -> bool {
    !path.is_empty()
        && !path.contains(['\0', '\\', ':'])
        && path
            .split('/')
            .all(|part| !part.is_empty() && part != "." && part != "..")
}

/// The counter for a new change. It never repeats or falls on one device, and
/// following the clock lets two devices be compared: the later change wins.
pub fn next_counter(previous: u64, now_ms: u64) -> u64 {
    previous.saturating_add(1).max(now_ms)
}

/// Which copy the game starts from.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Resume {
    /// Neither side holds a save.
    Fresh,
    /// The local copy is newer than OtterTube's, or OtterTube holds none. It
    /// is sent again, so OtterTube is brought up to date.
    KeepLocal,
    /// OtterTube's copy is as new as the local one or newer (another device,
    /// or a cleared browser). On a tie OtterTube's is taken: it is the copy
    /// that was acknowledged, and taking it costs one local write.
    TakeSaved,
}

pub fn choose_resume(local_counter: Option<u64>, saved_counter: Option<u64>) -> Resume {
    match (local_counter, saved_counter) {
        (None, None) => Resume::Fresh,
        (Some(_), None) => Resume::KeepLocal,
        (None, Some(_)) => Resume::TakeSaved,
        (Some(local), Some(saved)) if saved >= local => Resume::TakeSaved,
        (Some(_), Some(_)) => Resume::KeepLocal,
    }
}

/// The id a user's files are stored under: `{game_id}@{subject}`. The stored
/// key is this, a NUL, then the path, so no user's prefix matches another's.
pub fn namespaced_game_id(game_id: &str, subject: &str) -> String {
    format!("{game_id}@{subject}")
}

/// `subject` as OtterTube writes it: 32 lowercase hex characters.
pub fn is_subject(value: &str) -> bool {
    value.len() == 32
        && value
            .bytes()
            .all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
}

/// Guest paths saved in addition to the ordinary save paths, per game. Root
/// `System Folder/Preferences/` is not saved by the browser runtime, so a game
/// that keeps its scores or settings there needs its files named here, each
/// from an observed write.
///
/// None of the three games needs one. Observed in the browser, 2026-11-11:
/// - ClockWerx writes `ClockWerx/System Folder/Preferences/ClockWerx Scores`
///   and `.../ClockWerx Settings` when a game starts.
/// - Delirium writes `Delirium/System Folder/Preferences/Delirium 1.1 Preferences`
///   as it quits (caught by the scan on halt).
/// - Blobbo writes `Untitled/System Folder/Preferences/Blobbo Preferencs` on a
///   preference change, and a saved game wherever its Save dialog is pointed
///   (by default `Untitled/Blobbo1.0.1 Fullversion/<name>`).
/// All are under the game's own volume folder, which is an ordinary save path.
/// The root copies made by the entries' file mappings were not written.
pub fn extra_save_paths(game_id: &str) -> &'static [&'static str] {
    // Add an arm here, with the observation, for a game that writes at the root.
    let _ = game_id;
    &[]
}

/// One number for a set of files: equal sets, in any order, give equal numbers.
pub fn files_fingerprint(files: &[VfsFileSnapshot]) -> u64 {
    fn mix(hash: &mut u64, bytes: &[u8]) {
        for &byte in bytes {
            *hash ^= u64::from(byte);
            *hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
        }
        // A length mark keeps ("ab", "c") apart from ("a", "bc").
        *hash ^= bytes.len() as u64;
        *hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    let mut sorted: Vec<&VfsFileSnapshot> = files.iter().collect();
    sorted.sort_by(|left, right| left.path.cmp(&right.path));
    let mut hash = 0xcbf2_9ce4_8422_2325u64;
    for file in sorted {
        mix(&mut hash, file.path.as_bytes());
        mix(&mut hash, &file.data_fork);
        mix(&mut hash, &file.resource_fork);
        mix(&mut hash, &file.file_type.to_be_bytes());
        mix(&mut hash, &file.creator.to_be_bytes());
        mix(&mut hash, &file.finder_flags.to_be_bytes());
        mix(&mut hash, &file.created_date.to_be_bytes());
        mix(&mut hash, &file.modified_date.to_be_bytes());
    }
    hash
}

/// The file the runtime reports (MacBinary plus its full guest path) as a
/// snapshot. MacBinary keeps only the last name, so the path comes from beside it.
pub fn snapshot_from_download(
    file: &crate::save_store::DownloadableSaveFile,
) -> Result<VfsFileSnapshot, String> {
    let mut snapshot = crate::save_store::decode_macbinary_save_file("", &file.macbinary)?;
    snapshot.path = file.path.clone();
    Ok(snapshot)
}

#[cfg(feature = "ottertube")]
pub use link::*;

#[cfg(feature = "ottertube")]
mod link {
    use super::*;
    use crate::catalogue::{game_from_path, Game};
    use crate::components::game_screen::GameScreen;
    use crate::save_store::{self, DownloadableSaveFile};
    use leptos::prelude::*;
    use leptos::task::spawn_local;
    use std::cell::{Cell, RefCell};
    use std::future::Future;
    use std::pin::Pin;
    use std::rc::Rc;
    use wasm_bindgen::{prelude::*, JsCast};
    use wasm_bindgen_futures::JsFuture;

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = ["window", "systemlessOtterTube"], js_name = start, catch)]
        fn link_start() -> Result<js_sys::Promise, JsValue>;
        #[wasm_bindgen(js_namespace = ["window", "systemlessOtterTube"], js_name = checkpoint, catch)]
        fn link_checkpoint(counter: f64, text: &str) -> Result<js_sys::Promise, JsValue>;
        #[wasm_bindgen(js_namespace = ["window", "systemlessOtterTube"], js_name = onPageHide, catch)]
        fn link_on_page_hide(callback: &js_sys::Function) -> Result<(), JsValue>;
        #[wasm_bindgen(js_namespace = ["window", "systemlessOtterTube"], js_name = onLeave, catch)]
        fn link_on_leave(callback: &js_sys::Function) -> Result<(), JsValue>;
        #[wasm_bindgen(js_namespace = ["window", "systemlessOtterTube"], js_name = exit, catch)]
        fn link_exit() -> Result<(), JsValue>;
        #[wasm_bindgen(js_namespace = ["window", "systemlessOtterTube"], js_name = wait, catch)]
        fn link_wait(ms: f64) -> Result<js_sys::Promise, JsValue>;
        #[wasm_bindgen(js_namespace = ["window", "systemlessOtterTube"], js_name = onInput, catch)]
        fn link_on_input(callback: &js_sys::Function) -> Result<(), JsValue>;
        #[wasm_bindgen(js_namespace = ["window", "systemlessOtterTube"], js_name = setPad, catch)]
        fn link_set_pad(json: &str) -> Result<(), JsValue>;
    }

    const OVERSIZE_KEY: &str = "systemless.ottertube.oversize:";
    const BLOCKED_KEY: &str = "systemless.ottertube.not-sending:";
    /// A checkpoint OtterTube refused for now (`rate`, `storage`) is sent again
    /// after this long, then after twice as long, up to `MAX_RETRIES` times.
    const RETRY_FIRST_MS: f64 = 2500.0;
    const MAX_RETRIES: u32 = 4;
    /// How long leaving waits for the newest change to be stored and answered.
    const LEAVE_WAIT_MS: f64 = 3000.0;

    struct Session {
        game_id: &'static str,
        /// `None` is Guest: nothing is read, kept or sent.
        scope: Option<String>,
        /// Checkpoints go to OtterTube. Off under `self`/`none`, and for the
        /// whole session when the save OtterTube holds could not be used: a
        /// save this build cannot read must never be overwritten by it.
        host_saves: bool,
        counter: u64,
        /// The file set last accounted for. `None` until the booted machine reports its first.
        baseline: Option<u64>,
        resend_first: bool,
        /// The newest save text and its counter.
        latest: Option<(u64, String)>,
        acknowledged: u64,
        /// The counter of the last local commit (files and counter together).
        stored: u64,
        retries: u32,
        retry_waiting: bool,
        /// How many files the local copy held when the session began.
        local_files: usize,
        /// The held save could not be used. Nothing is sent and nothing is
        /// written to the scope either, as for Guest: the next visit must find
        /// the same local copy beside the same held save, not a newer local
        /// one that would then be uploaded over it.
        frozen: bool,
    }

    /// One local write: the scope, its files and the counter they belong to.
    type LocalWrite = (String, Vec<VfsFileSnapshot>, u64);
    /// Asks the running machine for a save scan now, to be answered before the
    /// given `Date.now()` time. `None` is "not scanned": no machine is running
    /// yet, or it did not answer in time.
    pub type SaveScanner =
        Rc<dyn Fn(f64) -> Pin<Box<dyn Future<Output = Option<Vec<DownloadableSaveFile>>>>>>;
    pub use crate::ottertube_play::{
        busy as script_running, game_unmounted, guest_point, on_takeover, screen_reply,
        set_guest_pointer, set_screen_reader, set_tap_keys, stick_is_stepped, stick_steps,
        swallows_touch, KeyOwner, ScreenRequest,
    };

    thread_local! {
        static SESSION: RefCell<Option<Session>> = const { RefCell::new(None) };
        static NEXT_WRITE: RefCell<Option<LocalWrite>> = const { RefCell::new(None) };
        static WRITING: Cell<bool> = const { Cell::new(false) };
        static SCANNER: RefCell<Option<SaveScanner>> = const { RefCell::new(None) };
        static LEAVING: Cell<Option<RwSignal<bool>>> = const { Cell::new(None) };
        static HALTED: Cell<bool> = const { Cell::new(false) };
    }

    /// How the game's files are stored for whoever is playing.
    pub struct SaveScope {
        pub id: String,
        /// Guest: nothing is read or written.
        pub memory_only: bool,
        /// The machine loads the scope at boot and never writes it. This page
        /// writes it instead, files and counter in one transaction.
        pub load_only: bool,
        pub extra_paths: Vec<String>,
        /// The game's seed. It is written into the mounted files on every
        /// boot, before the saved files are put over them, so a real save
        /// always wins and a save that lacks the seeded file still gets it.
        pub boot_patches: Vec<save_store::BootPatch>,
        /// Tests only (`?systemless-test-scan=paused`): explicit scans only.
        pub scan_paused: bool,
    }

    /// The scope for the machine about to boot. Without a session (which cannot
    /// happen once the page has let the game mount) nothing is kept.
    pub fn save_scope(game_id: &str) -> SaveScope {
        let extra_paths = extra_save_paths(game_id)
            .iter()
            .map(|path| path.to_string())
            .collect();
        let boot_patches = seed_patches(game_id);
        let scan_paused = test_scan_mode().is_some();
        SESSION.with(|session| match session.borrow().as_ref() {
            Some(Session {
                scope: Some(scope), ..
            }) => SaveScope {
                id: scope.clone(),
                memory_only: false,
                load_only: true,
                extra_paths,
                boot_patches,
                scan_paused,
            },
            _ => SaveScope {
                id: format!("{game_id}@guest"),
                memory_only: true,
                load_only: false,
                extra_paths,
                boot_patches,
                scan_paused,
            },
        })
    }

    /// The game screen hands over a way to scan the running machine's saves now.
    pub fn set_save_scanner(scanner: Option<SaveScanner>) {
        SCANNER.with(|slot| *slot.borrow_mut() = scanner);
    }

    /// A browser check's request in the page address: `paused` stops the
    /// machine's periodic save scan, `paused-slow` also makes an explicit scan
    /// answer late. Nothing in OtterTube sets it.
    fn test_scan_mode() -> Option<String> {
        let location = web_sys::window()?.location();
        // Loopback only: a bundle served from a real name never acts on it.
        if !matches!(
            location.hostname().ok()?.as_str(),
            "127.0.0.1" | "localhost" | "[::1]"
        ) {
            return None;
        }
        let search = location.search().ok()?;
        let value = search
            .trim_start_matches('?')
            .split('&')
            .find_map(|pair| pair.strip_prefix("systemless-test-scan="))?;
        matches!(value, "paused" | "paused-slow").then(|| value.to_string())
    }

    pub fn test_scan_delay_ms() -> f64 {
        if test_scan_mode().as_deref() == Some("paused-slow") {
            1200.0
        } else {
            0.0
        }
    }

    fn seed_patches(_game_id: &str) -> Vec<save_store::BootPatch> {
        crate::ottertube_play::game()
            .seed
            .iter()
            .map(|patch| save_store::BootPatch {
                path: patch.path.clone(),
                offset: patch.offset,
                bytes: patch.bytes.clone(),
                enforce: patch.enforce,
            })
            .collect()
    }

    /// The game's data: what is compiled in. On a loopback host a file beside
    /// the page, `/ottertube-games.dev.json`, is used instead when it is there
    /// and passes the same checks: for whoever is working out a game's screens
    /// and scripts. A bundle served from a real name never looks for it.
    async fn game_data(game_id: &str) -> crate::ottertube_data::GameData {
        let mut games = crate::ottertube_data::embedded();
        let loopback = web_sys::window()
            .and_then(|window| window.location().hostname().ok())
            .is_some_and(|host| matches!(host.as_str(), "127.0.0.1" | "localhost" | "[::1]"));
        if loopback {
            if let Ok(response) = gloo_net::http::Request::get("/ottertube-games.dev.json")
                .send()
                .await
            {
                if response.ok() {
                    match response.text().await.map_err(|error| error.to_string()) {
                        Ok(text) => match crate::ottertube_data::parse(&text) {
                            Ok(dev) => {
                                warn("using /ottertube-games.dev.json");
                                games = dev;
                            }
                            Err(error) => warn(&format!("/ottertube-games.dev.json: {error}")),
                        },
                        Err(error) => warn(&format!("/ottertube-games.dev.json: {error}")),
                    }
                }
            }
        }
        games.remove(game_id).unwrap_or_default()
    }

    fn warn(message: &str) {
        web_sys::console::warn_1(&JsValue::from_str(&format!("[ottertube] {message}")));
    }

    fn storage() -> Option<web_sys::Storage> {
        web_sys::window()?.local_storage().ok().flatten()
    }

    fn note(key: &str, scope: &str, value: Option<&str>) {
        if let Some(storage) = storage() {
            let key = format!("{key}{scope}");
            let _ = match value {
                Some(value) => storage.set_item(&key, value),
                None => storage.remove_item(&key),
            };
        }
    }

    fn js_field(value: &JsValue, name: &str) -> JsValue {
        js_sys::Reflect::get(value, &JsValue::from_str(name)).unwrap_or(JsValue::UNDEFINED)
    }

    fn js_message(value: JsValue) -> String {
        value
            .as_string()
            .or_else(|| js_field(&value, "message").as_string())
            .unwrap_or_else(|| format!("{value:?}"))
    }

    pub async fn wait_ms(ms: f64) {
        if let Ok(promise) = link_wait(ms) {
            let _ = JsFuture::from(promise).await;
        }
    }

    /// The save state on the page's root element, for a parent-side page and for tests.
    fn publish() {
        let Some(root) = web_sys::window()
            .and_then(|window| window.document())
            .and_then(|document| document.query_selector(".app--ottertube").ok().flatten())
        else {
            return;
        };
        SESSION.with(|session| {
            let session = session.borrow();
            let Some(session) = session.as_ref() else {
                return;
            };
            for (name, value) in [
                ("data-save-counter", session.counter.to_string()),
                ("data-save-stored", session.stored.to_string()),
                ("data-save-acknowledged", session.acknowledged.to_string()),
                (
                    "data-save-host",
                    if session.host_saves { "on" } else { "off" }.to_string(),
                ),
            ] {
                let _ = root.set_attribute(name, &value);
            }
        });
    }

    fn new_session(game_id: &'static str) -> Session {
        Session {
            game_id,
            scope: None,
            host_saves: false,
            counter: 0,
            baseline: None,
            resend_first: false,
            latest: None,
            acknowledged: 0,
            stored: 0,
            retries: 0,
            retry_waiting: false,
            local_files: 0,
            frozen: false,
        }
    }

    /// Wait for OtterTube's `init`, then make the local store hold whichever of
    /// its copy and OtterTube's is newer. `Err` means the page is not inside
    /// OtterTube: the caller shows a plain message and starts nothing.
    async fn begin(game: &'static Game) -> Result<(), String> {
        let start = link_start().map_err(js_message)?;
        let init = JsFuture::from(start).await.map_err(js_message)?;
        if js_field(&init, "ok").as_bool() != Some(true) {
            return Err(js_field(&init, "reason")
                .as_string()
                .unwrap_or_else(|| "OtterTube did not answer".into()));
        }
        let subject = js_field(&init, "subject")
            .as_string()
            .filter(|subject| is_subject(subject));
        let Some(subject) = subject else {
            // Guest, or a mode that names nobody: a session that keeps nothing.
            SESSION.with(|session| *session.borrow_mut() = Some(new_session(game.id)));
            register_page_callbacks();
            return Ok(());
        };
        let scope = namespaced_game_id(game.id, &subject);
        let mut session = new_session(game.id);
        session.host_saves = js_field(&init, "mode").as_string().as_deref() == Some("host");

        // The local copy counts only with its counter, which is committed in
        // the same transaction as the files it belongs to.
        let local_state = match save_store::read_scope_state(&scope).await {
            Ok(state) => state,
            Err(error) => {
                warn(&format!("the local copy could not be read ({error})"));
                None
            }
        };
        let local = local_state.map(|(counter, _)| counter);
        session.local_files = local_state.map_or(0, |(_, files)| files);
        // A save is held but this build cannot use it: play on from the local
        // copy and send nothing, so what OtterTube holds stays as it is.
        let mut unusable = None;
        let saved =
            js_field(&init, "saved")
                .as_string()
                .and_then(|text| match decode_save_text(&text) {
                    Ok(bundle) if bundle.game_id == game.id => Some(bundle),
                    Ok(bundle) => {
                        unusable = Some(format!("the save held is for {}", bundle.game_id));
                        None
                    }
                    Err(error) => {
                        unusable = Some(format!("the save held could not be read: {error}"));
                        None
                    }
                });
        let mut resume = match unusable {
            Some(_) if local.is_some() => Resume::KeepLocal,
            Some(_) => Resume::Fresh,
            None => choose_resume(local, saved.as_ref().map(|bundle| bundle.counter)),
        };
        session.counter = local.unwrap_or(0);
        session.stored = session.counter;
        if resume == Resume::TakeSaved {
            let bundle = saved.as_ref().expect("a save to take");
            match save_store::write_scope(&scope, &bundle.files, bundle.counter).await {
                Ok(()) => {
                    session.counter = bundle.counter;
                    session.stored = bundle.counter;
                    session.acknowledged = bundle.counter;
                }
                Err(error) => {
                    unusable = Some(format!(
                        "the save held could not be stored on this device: {error}"
                    ));
                    resume = if local.is_some() {
                        Resume::KeepLocal
                    } else {
                        Resume::Fresh
                    };
                }
            }
        }
        if let Some(reason) = &unusable {
            warn(&format!(
                "{reason}; nothing will be sent to OtterTube or stored this time"
            ));
            session.host_saves = false;
            session.frozen = true;
        }
        note(BLOCKED_KEY, &scope, unusable.as_deref());
        // A fresh start has no files; anything the game then writes is a change.
        session.baseline = (resume == Resume::Fresh).then(|| files_fingerprint(&[]));
        session.resend_first = resume == Resume::KeepLocal;
        session.scope = Some(scope);
        SESSION.with(|slot| *slot.borrow_mut() = Some(session));
        register_page_callbacks();
        Ok(())
    }

    fn register_page_callbacks() {
        let on_hide = Closure::<dyn FnMut()>::new(flush_on_page_hide);
        if link_on_page_hide(on_hide.as_ref().unchecked_ref()).is_ok() {
            on_hide.forget();
        }
        let on_leave = Closure::<dyn FnMut()>::new(|| spawn_local(leave()));
        if link_on_leave(on_leave.as_ref().unchecked_ref()).is_ok() {
            on_leave.forget();
        }
        let on_input = Closure::<dyn FnMut(String, js_sys::Array, bool)>::new(
            |kind: String, names: js_sys::Array, down: bool| {
                let names: Vec<String> = names.iter().filter_map(|name| name.as_string()).collect();
                crate::ottertube_play::input(&kind, names, down);
            },
        );
        if link_on_input(on_input.as_ref().unchecked_ref()).is_ok() {
            on_input.forget();
        }
    }

    /// The running machine's changed files, each time the set changes. The
    /// first report after boot is what was restored; later ones are progress.
    pub fn on_save_files(files: &[DownloadableSaveFile]) {
        let outgoing = SESSION.with(|session| {
            let mut session = session.borrow_mut();
            let session = session.as_mut()?;
            let scope = session.scope.clone()?;
            if session.frozen {
                // Played in memory only: see `Session::frozen`.
                return None;
            }
            let snapshots: Vec<VfsFileSnapshot> = files
                .iter()
                .filter_map(|file| match snapshot_from_download(file) {
                    Ok(snapshot) => Some(snapshot),
                    Err(error) => {
                        warn(&format!(
                            "{} could not be read for the save ({error})",
                            file.path
                        ));
                        None
                    }
                })
                .collect();
            let fingerprint = files_fingerprint(&snapshots);
            let first = session.baseline.is_none();
            if first && snapshots.is_empty() && session.resend_first && session.local_files > 0 {
                // Not what a machine that loaded the local copy reports. An
                // empty list here must never become the save that is sent.
                return None;
            }
            if session.baseline == Some(fingerprint) {
                return None;
            }
            session.baseline = Some(fingerprint);
            if first {
                // What the machine loaded: already stored under its counter.
                if !std::mem::take(&mut session.resend_first) || session.counter == 0 {
                    return None;
                }
            } else {
                session.counter = next_counter(session.counter, js_sys::Date::now() as u64);
                queue_local_write(scope.clone(), snapshots.clone(), session.counter);
            }
            session.retries = 0;
            let bundle = SaveBundle {
                game_id: session.game_id.to_string(),
                counter: session.counter,
                files: snapshots,
            };
            match encode_save_text(&bundle) {
                Ok(text) => {
                    note(OVERSIZE_KEY, &scope, None);
                    session.latest = Some((session.counter, text.clone()));
                    session.host_saves.then_some((session.counter, text))
                }
                Err(error) => {
                    // Keep playing: the local copy still holds everything. The
                    // note is for a parent-side page; the child sees nothing.
                    warn(&format!("checkpoint not sent: {error}"));
                    note(OVERSIZE_KEY, &scope, Some(&error.to_string()));
                    None
                }
            }
        });
        publish();
        if let Some((counter, text)) = outgoing {
            send_checkpoint(counter, text);
        }
    }

    /// Store the files and their counter locally, in one transaction. Writes
    /// run one at a time; a change arriving meanwhile replaces the one waiting.
    fn queue_local_write(scope: String, files: Vec<VfsFileSnapshot>, counter: u64) {
        NEXT_WRITE.with(|next| *next.borrow_mut() = Some((scope, files, counter)));
        if WRITING.with(|writing| writing.replace(true)) {
            return;
        }
        spawn_local(async {
            while let Some((scope, files, counter)) =
                NEXT_WRITE.with(|next| next.borrow_mut().take())
            {
                match save_store::write_scope(&scope, &files, counter).await {
                    Ok(()) => SESSION.with(|session| {
                        if let Some(session) = session.borrow_mut().as_mut() {
                            session.stored = session.stored.max(counter);
                        }
                    }),
                    Err(error) => warn(&format!("the local copy was not stored ({error})")),
                }
                publish();
            }
            WRITING.with(|writing| writing.set(false));
        });
    }

    fn send_checkpoint(counter: u64, text: String) {
        let promise = match link_checkpoint(counter as f64, &text) {
            Ok(promise) => promise,
            Err(error) => {
                warn(&format!("checkpoint not sent: {}", js_message(error)));
                return;
            }
        };
        spawn_local(async move {
            let Ok(answer) = JsFuture::from(promise).await else {
                return;
            };
            let reason = js_field(&answer, "reason").as_string().unwrap_or_default();
            let retry = SESSION.with(|session| {
                let mut session = session.borrow_mut();
                let session = session.as_mut()?;
                if js_field(&answer, "saved").as_bool() == Some(true) {
                    session.acknowledged = session.acknowledged.max(counter);
                    session.retries = 0;
                    return None;
                }
                warn(&format!("checkpoint {counter} was not kept: {reason}"));
                match reason.as_str() {
                    // Refused for now: the newest text goes again shortly.
                    "rate" | "storage" => {
                        if session.retry_waiting || session.retries >= MAX_RETRIES {
                            return None;
                        }
                        session.retry_waiting = true;
                        session.retries += 1;
                        Some(RETRY_FIRST_MS * f64::from(1u32 << (session.retries - 1)))
                    }
                    // OtterTube keeps no save here at all: stop offering one.
                    "mode" | "no-user" => {
                        session.host_saves = false;
                        None
                    }
                    _ => None,
                }
            });
            publish();
            if let Some(delay) = retry {
                wait_ms(delay).await;
                let again = SESSION.with(|session| {
                    let mut session = session.borrow_mut();
                    let session = session.as_mut()?;
                    session.retry_waiting = false;
                    unacknowledged(session)
                });
                if let Some((counter, text)) = again {
                    send_checkpoint(counter, text);
                }
            }
        });
    }

    /// The newest text, if OtterTube takes saves and has not acknowledged it.
    fn unacknowledged(session: &Session) -> Option<(u64, String)> {
        let (counter, text) = session.latest.as_ref()?;
        (session.host_saves && *counter > session.acknowledged).then(|| (*counter, text.clone()))
    }

    /// The page is going away without notice. Hand OtterTube the newest text
    /// once more if it has not acknowledged it. OtterTube takes one checkpoint
    /// per 2 s and tears the page down without waiting, so this can still be
    /// lost: the local copy under the user's scope, with its counter, is what
    /// carries the tail to the next `init`.
    fn flush_on_page_hide() {
        let pending = SESSION.with(|session| session.borrow().as_ref().and_then(unacknowledged));
        if let Some((counter, text)) = pending {
            send_checkpoint(counter, text);
        }
    }

    /// Leave on purpose (the Exit button, or the game quitting): scan for a
    /// change not yet seen, wait until the newest one is stored locally and
    /// answered by OtterTube, then ask OtterTube to leave. The wait is bounded;
    /// what it misses is still in the local copy.
    pub async fn leave() {
        let Some(signal) = LEAVING.with(|leaving| leaving.get()) else {
            let _ = link_exit();
            return;
        };
        if signal.get_untracked() {
            return;
        }
        signal.set(true);
        // A script that is running stops here: its keys and pointer are let go.
        crate::ottertube_play::cancel_script("leaving");
        // One deadline for the scan, the local commit and OtterTube's answer.
        let deadline = js_sys::Date::now() + LEAVE_WAIT_MS;
        if let Some(scanner) = SCANNER.with(|slot| slot.borrow().clone()) {
            // No machine yet, or no answer in time: nothing new is known, and
            // the list the page already has is not sent in its place.
            if let Some(files) = scanner(deadline).await {
                on_save_files(&files);
            }
        }
        loop {
            let settled = SESSION.with(|session| {
                session.borrow().as_ref().is_none_or(|session| {
                    session.scope.is_none()
                        || (session.stored >= session.counter && unacknowledged(session).is_none())
                })
            });
            if settled || js_sys::Date::now() >= deadline {
                break;
            }
            wait_ms(50.0).await;
        }
        let _ = link_exit();
    }

    /// The game quit (its own Quit button or menu). A halted guest shows a
    /// dead picture, so the page saves and leaves as the Exit button does.
    pub fn guest_halted() {
        if !HALTED.with(|halted| halted.replace(true)) {
            spawn_local(leave());
        }
    }

    #[derive(Clone, PartialEq)]
    enum LinkState {
        Connecting,
        Ready,
        Absent(String),
    }

    /// The whole page in this build: one game, no library, no links out.
    #[component]
    pub fn KioskApp() -> impl IntoView {
        let path = web_sys::window()
            .and_then(|window| window.location().pathname().ok())
            .unwrap_or_default();
        let game = game_from_path(&path).filter(|game| game.approved);
        let state = RwSignal::new(LinkState::Connecting);
        let leaving = RwSignal::new(false);
        LEAVING.with(|slot| slot.set(Some(leaving)));
        let help_open = RwSignal::new(false);
        let signals = crate::ottertube_play::Signals {
            busy: RwSignal::new(None),
            screens: RwSignal::new(Vec::new()),
            pad: RwSignal::new(false),
            starting: RwSignal::new(false),
        };
        let has_stick = game.is_some_and(|game| {
            let stick = game.settings.mobile_controls.joystick;
            game.settings.mobile_controls.enabled
                && [stick.up, stick.down, stick.left, stick.right]
                    .iter()
                    .any(|key| *key != "None")
        });
        match game {
            Some(game) => spawn_local(async move {
                // The game's data first: its seed goes into the boot, and the
                // controller adapter reads its buttons.
                crate::ottertube_play::set_game(game_data(game.id).await, signals);
                let pad =
                    serde_json::to_string(&crate::ottertube_play::game().pad).unwrap_or_default();
                let _ = link_set_pad(&pad);
                state.set(match begin(game).await {
                    Ok(()) => LinkState::Ready,
                    Err(reason) => LinkState::Absent(reason),
                });
                publish();
            }),
            None => state.set(LinkState::Absent(
                "There is no game at this address.".into(),
            )),
        }
        view! {
            <div class="app app--ottertube" data-view="playing"
                data-kiosk-game=game.map(|game| game.id)
                data-kiosk-stick=if has_stick { "on" } else { "off" }
                data-ottertube=move || match state.get() {
                    LinkState::Connecting => "connecting",
                    LinkState::Ready => "ready",
                    LinkState::Absent(_) => "absent",
                }>
                {move || match (state.get(), game) {
                    (LinkState::Ready, Some(game)) => {
                        let data = crate::ottertube_play::game();
                        let (help_lines, pad_lines) = (data.help.clone(), data.pad_help.clone());
                        view! {
                            <main class="app__main">
                                <div class="game-page">
                                    <div class="game-screen-wrap"><GameScreen game=game/></div>
                                </div>
                            </main>
                            // Everything a child needs besides the picture: leave, help, and the
                            // game's own actions as big buttons. No link anywhere.
                            <div class="kiosk-chrome kiosk-chrome--system">
                                <button type="button" class="kiosk-button kiosk-button--exit" data-kiosk-exit="true"
                                    on:click=move |_| spawn_local(leave())>"Exit"</button>
                                <button type="button" class="kiosk-button kiosk-button--help" data-kiosk-help="true"
                                    on:click=move |_| help_open.set(true)>"How to play"</button>
                            </div>
                            <div class="kiosk-chrome kiosk-chrome--actions">
                                {data.actions.iter().cloned().map(|action| {
                                    // A button shows on the screens it is for, once the game has been started.
                                    let (when, unless) = (action.when.clone(), action.unless.clone());
                                    let shown = move || {
                                        let screens = signals.screens.get();
                                        !signals.starting.get()
                                            && (when.is_empty() || when.iter().any(|name| screens.contains(name)))
                                            && !unless.iter().any(|name| screens.contains(name))
                                    };
                                    view! {
                                        <button type="button" class="kiosk-button kiosk-button--action"
                                            data-kiosk-keys=action.keys.clone()
                                            data-kiosk-script=action.script.clone()
                                            style:display=move || if shown() { "" } else { "none" }
                                        >{action.label.clone()}</button>
                                    }
                                }).collect_view()}
                            </div>
                            // The game is being started, or a script is driving it: say so, and take no touch but Exit.
                            <Show when=move || signals.starting.get() || signals.busy.get().is_some()>
                                <div class="kiosk-busy" role="status"><span>"One moment\u{2026}"</span></div>
                            </Show>
                            <Show when=move || help_open.get()>
                                <div class="kiosk-help" role="dialog" aria-label="How to play">
                                    <div class="kiosk-help__card">
                                        <h2>{game.title}</h2>
                                        <ul>
                                            {
                                                // With a controller connected, its buttons.
                                                let lines = if signals.pad.get_untracked() && !pad_lines.is_empty() {
                                                    pad_lines.clone()
                                                } else {
                                                    help_lines.clone()
                                                };
                                                lines.into_iter().map(|line| view! { <li>{line}</li> }).collect_view()
                                            }
                                        </ul>
                                        <button type="button" class="kiosk-button kiosk-button--close" data-kiosk-help-close="true"
                                            on:click=move |_| help_open.set(false)>"OK"</button>
                                    </div>
                                </div>
                            </Show>
                        }.into_any()
                    }
                    (LinkState::Absent(reason), _) => view! {
                        <main class="ottertube-plain">
                            <h1>"This game opens inside OtterTube"</h1>
                            <p>"Open it from the OtterTube home screen. Nothing was started here, and no saved game was touched."</p>
                            <p class="ottertube-plain__reason">{reason}</p>
                        </main>
                    }.into_any(),
                    _ => view! { <main class="ottertube-plain"><p>"Starting\u{2026}"</p></main> }.into_any(),
                }}
                <Show when=move || leaving.get()>
                    <div class="ottertube-saving" role="status">"Saving\u{2026}"</div>
                </Show>
            </div>
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn file(path: &str, data: &[u8], resource: &[u8]) -> VfsFileSnapshot {
        VfsFileSnapshot {
            path: path.to_string(),
            data_fork: data.to_vec(),
            resource_fork: resource.to_vec(),
            file_type: u32::from_be_bytes(*b"PREF"),
            creator: u32::from_be_bytes(*b"ClWx"),
            finder_flags: 0x4100,
            created_date: 2_900_000_001,
            modified_date: 2_900_000_777,
        }
    }

    fn bundle(counter: u64, files: Vec<VfsFileSnapshot>) -> SaveBundle {
        SaveBundle {
            game_id: "clockwerx-personal-10".into(),
            counter,
            files,
        }
    }

    /// Bytes deflate cannot shrink, so a test can reach the size limit.
    fn noise(len: usize) -> Vec<u8> {
        let mut state = 0x9e37_79b9_7f4a_7c15u64;
        (0..len)
            .map(|_| {
                state ^= state << 13;
                state ^= state >> 7;
                state ^= state << 17;
                (state >> 32) as u8
            })
            .collect()
    }

    #[test]
    fn save_text_round_trips_every_field_of_every_file() {
        let original = bundle(
            1_800_000_000_123,
            vec![
                file(
                    "ClockWerx/System Folder/Preferences/ClockWerx Scores",
                    &[0, 1, 2, 255, 254],
                    &[9, 8, 7],
                ),
                file(
                    "System Folder/Preferences/ClockWerx Settings",
                    b"settings",
                    &[],
                ),
                file("ClockWerx/Saved Games/Level \u{2122} 7", &[], &noise(700)),
            ],
        );
        let text = encode_save_text(&original).unwrap();
        let decoded = decode_save_text(&text).unwrap();
        assert_eq!(decoded.game_id, original.game_id);
        assert_eq!(decoded.counter, original.counter);
        let mut expected = original.files.clone();
        expected.sort_by(|left, right| left.path.cmp(&right.path));
        assert_eq!(decoded.files.len(), 3);
        for (decoded, expected) in decoded.files.iter().zip(&expected) {
            assert_eq!(decoded.path, expected.path);
            assert_eq!(decoded.data_fork, expected.data_fork);
            assert_eq!(decoded.resource_fork, expected.resource_fork);
            assert_eq!(decoded.file_type, expected.file_type);
            assert_eq!(decoded.creator, expected.creator);
            assert_eq!(decoded.finder_flags, expected.finder_flags);
            assert_eq!(decoded.created_date, expected.created_date);
            assert_eq!(decoded.modified_date, expected.modified_date);
        }
    }

    #[test]
    fn save_text_keeps_full_paths_and_both_forks_apart() {
        // Two files with one last name in different folders, which MacBinary
        // export would merge; and a file whose forks differ.
        let original = bundle(
            7,
            vec![
                file("Volume/Slot A/Game", b"data-a", b"rsrc-a"),
                file("Volume/Slot B/Game", b"data-b", b""),
                file("System Folder/Preferences/Game", b"", b"only-resource"),
            ],
        );
        let decoded = decode_save_text(&encode_save_text(&original).unwrap()).unwrap();
        let by_path = |path: &str| {
            decoded
                .files
                .iter()
                .find(|file| file.path == path)
                .unwrap_or_else(|| panic!("{path} missing"))
        };
        assert_eq!(by_path("Volume/Slot A/Game").data_fork, b"data-a");
        assert_eq!(by_path("Volume/Slot A/Game").resource_fork, b"rsrc-a");
        assert_eq!(by_path("Volume/Slot B/Game").data_fork, b"data-b");
        assert!(by_path("Volume/Slot B/Game").resource_fork.is_empty());
        assert!(by_path("System Folder/Preferences/Game")
            .data_fork
            .is_empty());
        assert_eq!(
            by_path("System Folder/Preferences/Game").resource_fork,
            b"only-resource"
        );
    }

    #[test]
    fn save_text_is_versioned_ascii_and_stable() {
        let files = vec![file("B/Two", b"2", b""), file("A/One", b"1", b"r")];
        let mut reversed = files.clone();
        reversed.reverse();
        let text = encode_save_text(&bundle(3, files)).unwrap();
        assert!(text.starts_with("systemless-save:1:"));
        assert!(text.is_ascii());
        assert!(!text.contains(['"', '\\']), "nothing JSON would escape");
        assert_eq!(text, encode_save_text(&bundle(3, reversed)).unwrap());
        assert_ne!(
            text,
            encode_save_text(&bundle(
                4,
                vec![file("B/Two", b"2", b""), file("A/One", b"1", b"r")]
            ))
            .unwrap()
        );
    }

    #[test]
    fn other_versions_and_other_text_are_refused() {
        let text = encode_save_text(&bundle(1, vec![file("A/One", b"1", b"")])).unwrap();
        let newer = text.replacen("systemless-save:1:", "systemless-save:2:", 1);
        assert_eq!(
            decode_save_text(&newer),
            Err(SaveTextError::UnsupportedVersion("2".into()))
        );
        assert_eq!(decode_save_text(""), Err(SaveTextError::NotSaveText));
        assert_eq!(
            decode_save_text("{\"level\":3}"),
            Err(SaveTextError::NotSaveText)
        );
        assert_eq!(
            decode_save_text("systemless-save:1"),
            Err(SaveTextError::NotSaveText)
        );
        assert!(matches!(
            decode_save_text("systemless-save:1:not base64!"),
            Err(SaveTextError::Corrupt(_))
        ));
        let mut cut = text.clone();
        cut.truncate(text.len() - 8);
        assert!(matches!(
            decode_save_text(&cut),
            Err(SaveTextError::Corrupt(_))
        ));
    }

    #[test]
    fn a_save_over_the_checkpoint_limit_is_refused_and_one_under_it_is_not() {
        // Incompressible forks: the text is about 4/3 of the bytes, twice over.
        let under = bundle(1, vec![file("A/Big", &noise(120_000), b"")]);
        let text = encode_save_text(&under).unwrap();
        assert!(text.len() + CHECKPOINT_BODY_OVERHEAD <= CHECKPOINT_BODY_MAX);
        assert_eq!(
            decode_save_text(&text).unwrap().files[0].data_fork.len(),
            120_000
        );

        let over = bundle(1, vec![file("A/Big", &noise(100_000), &noise(100_000))]);
        match encode_save_text(&over) {
            Err(SaveTextError::TooLarge { body_bytes }) => {
                assert!(body_bytes > CHECKPOINT_BODY_MAX);
            }
            other => panic!("expected a size refusal, got {other:?}"),
        }
    }

    #[test]
    fn a_save_no_reader_would_unpack_is_refused_when_written() {
        // Zeros deflate to almost nothing: under the checkpoint limit as text,
        // over the unpack limit as files.
        let over = bundle(1, vec![file("A/Zeros", &vec![0; 13 * 1024 * 1024], b"")]);
        match encode_save_text(&over) {
            Err(SaveTextError::TooLargeUnpacked { bytes }) => assert!(bytes > INFLATE_LIMIT),
            other => panic!("expected an unpack-size refusal, got {other:?}"),
        }
        // Just under the limit both directions agree.
        let under = bundle(1, vec![file("A/Zeros", &vec![0; 11 * 1024 * 1024], b"")]);
        let text = encode_save_text(&under).unwrap();
        assert_eq!(
            decode_save_text(&text).unwrap().files[0].data_fork.len(),
            11 * 1024 * 1024
        );
    }

    #[test]
    fn the_size_measured_is_the_checkpoint_body() {
        let text = encode_save_text(&bundle(1, vec![file("A/One", b"1", b"")])).unwrap();
        let body = serde_json::to_string(&serde_json::json!({ "data": text })).unwrap();
        assert_eq!(body.len(), text.len() + CHECKPOINT_BODY_OVERHEAD);
    }

    #[test]
    fn damaged_paths_are_refused() {
        for path in [
            "",
            "/Rooted",
            "A//B",
            "A/../B",
            "A/./B",
            "A\\B",
            "Volume:File",
            "A/B/",
        ] {
            assert!(!is_plain_guest_path(path), "{path:?}");
        }
        assert!(is_plain_guest_path(
            "System Folder/Preferences/Blobbo Preferencs"
        ));
        assert!(is_plain_guest_path("File"));
    }

    #[test]
    fn the_counter_rises_and_follows_the_clock() {
        assert_eq!(next_counter(0, 1_000), 1_000);
        assert_eq!(next_counter(1_000, 1_000), 1_001);
        assert_eq!(
            next_counter(1_001, 900),
            1_002,
            "a clock set back never lowers it"
        );
        assert_eq!(next_counter(5, 2_000), 2_000);
        assert_eq!(next_counter(u64::MAX, 1), u64::MAX);
        let mut counter = 0;
        for now in [10, 10, 10, 9, 500, 500] {
            let next = next_counter(counter, now);
            assert!(next > counter);
            counter = next;
        }
    }

    #[test]
    fn the_newer_copy_wins_at_init() {
        assert_eq!(choose_resume(None, None), Resume::Fresh);
        assert_eq!(choose_resume(None, Some(1)), Resume::TakeSaved);
        assert_eq!(choose_resume(Some(4), Some(9)), Resume::TakeSaved);
        // A tie goes to the copy OtterTube acknowledged.
        assert_eq!(choose_resume(Some(9), Some(9)), Resume::TakeSaved);
        assert_eq!(choose_resume(Some(9), Some(4)), Resume::KeepLocal);
        assert_eq!(choose_resume(Some(1), None), Resume::KeepLocal);
    }

    #[test]
    fn the_counter_inside_the_text_is_what_is_compared() {
        let files = vec![file("A/One", b"1", b"")];
        let older =
            decode_save_text(&encode_save_text(&bundle(100, files.clone())).unwrap()).unwrap();
        let newer = decode_save_text(&encode_save_text(&bundle(101, files)).unwrap()).unwrap();
        assert_eq!(
            choose_resume(Some(older.counter), Some(newer.counter)),
            Resume::TakeSaved
        );
        assert_eq!(
            choose_resume(Some(newer.counter), Some(older.counter)),
            Resume::KeepLocal
        );
    }

    #[test]
    fn each_subject_has_its_own_scope_and_guest_has_none() {
        let a = "0123456789abcdef0123456789abcdef";
        let b = "fedcba9876543210fedcba9876543210";
        assert!(is_subject(a) && is_subject(b));
        assert_eq!(
            namespaced_game_id("clockwerx-personal-10", a),
            "clockwerx-personal-10@0123456789abcdef0123456789abcdef"
        );
        assert_ne!(namespaced_game_id("g", a), namespaced_game_id("g", b));
        for not_a_subject in [
            "",
            "guest",
            "0123456789ABCDEF0123456789ABCDEF",
            &a[1..],
            "0123456789abcdef0123456789abcdeg",
        ] {
            assert!(!is_subject(not_a_subject), "{not_a_subject:?}");
        }
    }

    #[test]
    fn fingerprint_sees_any_change_and_ignores_order() {
        let one = file("A/One", b"1", b"r");
        let two = file("B/Two", b"2", b"");
        let base = files_fingerprint(&[one.clone(), two.clone()]);
        assert_eq!(base, files_fingerprint(&[two.clone(), one.clone()]));
        assert_ne!(base, files_fingerprint(&[one.clone()]));
        assert_ne!(base, files_fingerprint(&[]));
        let mut changed = one.clone();
        changed.resource_fork = b"R".to_vec();
        assert_ne!(base, files_fingerprint(&[changed, two.clone()]));
        let mut dated = one.clone();
        dated.modified_date += 1;
        assert_ne!(base, files_fingerprint(&[dated, two.clone()]));
        // Bytes moving from one fork to the other are a change.
        let moved = file("A/One", b"1r", b"");
        assert_ne!(files_fingerprint(&[one]), files_fingerprint(&[moved]));
    }

    #[test]
    fn a_reported_file_keeps_its_full_path_and_forks() {
        let original = file(
            "ClockWerx/System Folder/Preferences/ClockWerx Scores",
            b"scores",
            b"resources",
        );
        let reported = crate::save_store::downloadable_save_file(&original);
        let snapshot = snapshot_from_download(&reported).unwrap();
        assert_eq!(snapshot.path, original.path);
        assert_eq!(snapshot.data_fork, original.data_fork);
        assert_eq!(snapshot.resource_fork, original.resource_fork);
        assert_eq!(snapshot.file_type, original.file_type);
        assert_eq!(snapshot.creator, original.creator);
        assert_eq!(snapshot.finder_flags, original.finder_flags);
        assert_eq!(snapshot.created_date, original.created_date);
        assert_eq!(snapshot.modified_date, original.modified_date);
    }

    #[test]
    fn no_game_has_an_extra_path_without_an_observed_write() {
        // Observed 2026-11-11: all three write only under their own volume folder.
        for id in [
            "clockwerx-personal-10",
            "delirium-personal-11",
            "blobbo-full-personal-101",
            "koji-personal-204",
            "anything-else",
        ] {
            assert!(extra_save_paths(id).is_empty(), "{id}");
        }
    }
}
