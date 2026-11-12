mod adaptive_clock;
// The slim OtterTube add-on build mounts its own one-game page instead.
#[cfg_attr(feature = "ottertube", allow(dead_code))]
mod app;
mod bench;
mod browser_bridge;
mod catalogue;
#[cfg(test)]
mod compact_vectors;
mod components;
mod emulator;
#[cfg(target_arch = "wasm32")]
mod gpu_compute_worker;
mod gpu_proxy;
mod gpu_wire;
mod host_cursor;
mod indexed_frame;
#[cfg(any(feature = "ottertube", test))]
mod ottertube;
#[cfg(any(feature = "ottertube", test))]
mod ottertube_data;
#[cfg(feature = "ottertube")]
mod ottertube_play;
#[cfg(any(feature = "ottertube", test))]
mod ottertube_touch;
mod paths;
mod presentation;
mod renderer_bridge;
mod save_store;
#[cfg(target_arch = "wasm32")]
mod wgpu_presenter;
mod worker_runtime;

use leptos::mount::{mount_to, mount_to_body};
use wasm_bindgen::JsCast;

fn main() {
    if web_sys::window().is_none() {
        return;
    }
    if catalogue::games().is_empty() {
        return;
    }
    // Calibrate saved page zoom while navigating the catalogue or booting a game.
    browser_bridge::systemless_cursor_zoom();
    #[cfg(not(feature = "ottertube"))]
    use app::App as Page;
    #[cfg(feature = "ottertube")]
    use ottertube::KioskApp as Page;
    if let Some(root) = root_element() {
        root.set_inner_html("");
        mount_to(root, Page).forget();
    } else {
        mount_to_body(Page);
    }
}

fn root_element() -> Option<web_sys::HtmlElement> {
    web_sys::window()?
        .document()?
        .get_element_by_id("root")?
        .dyn_into()
        .ok()
}
