"""Export local launch metadata and controller profiles without touching game media."""

import argparse
from copy import deepcopy
import json
import os
from pathlib import Path
import re
from tempfile import NamedTemporaryFile

if __package__:
    from .private_library_manifest import BUILTINS, TOKEN, load_manifest
else:
    from private_library_manifest import BUILTINS, TOKEN, load_manifest

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "docs/spectrelaunch-catalog-audit.json"
NATIVE_CONTROLS = ROOT / "scripts/spectre-native-controls.json"
SHARED_CONTROLS = ROOT / "src/ottertube-games.json"
HTML5_CONTROLS = ROOT / "prototypes/clockwerx-html5/gamepad-bindings.json"
CLOCKWERX = "clockwerx-personal-10"

RESERVED = {4, 6, 8, 16}
BUTTONS = {
    0: "Cross", 1: "Circle", 2: "Square", 3: "Triangle",
    5: "R1", 7: "R2", 9: "Options", 10: "L3", 11: "R3",
    12: "D-pad up", 13: "D-pad down", 14: "D-pad left", 15: "D-pad right",
}

# The three built-ins are compiled by www/private_koji.rs and www/private_library.rs.
BUILTIN_EXECUTABLES = {
    "koji": ("Koji", "Koji the Frog/Koji the Frog 2.0.4", None,
             ["Koji 2.0 Registration", "Koji Registration"]),
    "clockwerx": ("ClockWerx", "ClockWerx Folder/ClockWerx", 4096000,
                  ["ClockWerx Scores", "ClockWerx Settings"]),
    "delirium": ("Delirium", "Delirium 1.1 Folder/Delirium 1.1", 2048000,
                 ["Delirium 1.1 Preferences"]),
}

EXTRA_SAVES = {
    "angband": ["System Folder/Preferences/Angband Preferences"],
    "blobbo": ["System Folder/Preferences/Blobbo Preferencs"],
    "mantra": ["System Folder/Preferences/Mantra Prefs"],
}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def checked_button(index):
    if type(index) is not int or index in RESERVED or index not in BUTTONS:
        raise ValueError(f"invalid or reserved controller button {index!r}")
    return BUTTONS[index]


def native_controls():
    controls = read_json(SHARED_CONTROLS)
    additions = read_json(NATIVE_CONTROLS)
    if controls.keys() & additions.keys():
        raise ValueError("duplicate native control definition")
    controls.update(additions)
    for control in controls.values():
        buttons = control.get("pad", {}).get("buttons", {})
        for number, binding in list(buttons.items()):
            checked_button(int(number))
            if str(int(number)) != number:
                raise ValueError(f"invalid controller button spelling {number!r}")
            if binding.get("exit"):
                if set(binding) != {"exit"}:
                    raise ValueError("kiosk exit must be its own button")
                del buttons[number]
        # The browser kiosk's help still describes its own R3 exit.
        control.pop("pad_help", None)
    return controls


def tuning_defaults(controls):
    step = controls.get("stick_step", {})
    mouse = controls.get("mouse", {})
    return {
        "stickDeadzone": 0.25,
        "stickStepPulseMs": step.get("pulse_ms", 90),
        "stickStepDelayMs": step.get("delay_ms", 450),
        "stickStepRepeatMs": step.get("repeat_ms", 220),
        "cursorSpeed": mouse.get("cursor_speed", 420),
        "precisionCursorSpeed": mouse.get("precision_cursor_speed", 110),
    }


def overlay_rows(controls):
    pad = controls.get("pad", {})
    rows = []
    if pad.get("directions"):
        rows.append({"input": "Left stick / D-pad", "action": pad["directions_label"]})
    if mouse := controls.get("mouse"):
        stick = mouse.get("stick", "left").capitalize()
        rows.append({"input": f"{stick} stick", "action": "Move cursor"})
        for key, label in [("click_button", "Click / hold to drag"),
                           ("precision_button", "Hold for precision")]:
            if key in mouse:
                rows.append({"input": checked_button(mouse[key]), "action": label})
    for number, binding in sorted(pad.get("buttons", {}).items(), key=lambda item: int(item[0])):
        rows.append({"input": checked_button(int(number)), "action": binding["label"]})
    return rows


def profile(slug, title, process, window_title, rows, legacy_title_match):
    return {
        "schema": "controller-overlay-profile/1",
        "id": f"systemless-{slug}",
        "title": title,
        "match": {
            "processNames": [] if legacy_title_match else [process],
            "windowTitleContains": [window_title],
        },
        "sections": [{"title": "Game controls", "rows": rows}],
        # Track C calls IPC. This also lets existing SpectreLaunch versions take focus.
        "pausePolicy": {"policy": "focus", "takeFocus": True},
    }


def builtin_settings():
    settings = {}
    for image, slug, game_id in BUILTINS:
        volume, app, partition, preferences = BUILTIN_EXECUTABLES[image]
        settings[game_id] = {
            "slug": slug, "executable_path": f"{volume}/{app}",
            "application_partition_size": partition,
            "file_mappings": {
                f"{volume}/System Folder/Preferences/{name}": f"System Folder/Preferences/{name}"
                for name in preferences
            },
        }
    return settings


def keyed(rows):
    by_id = {row["id"]: row for row in rows}
    if len(rows) != len(by_id):
        raise ValueError("duplicate game ID")
    return by_id


def output_documents(audit, installed, additions, controls, html5_controls,
                     library, runtime, web_url, legacy_title_match=False):
    if audit.get("schema") != "systemless-spectrelaunch-playability-audit/1":
        raise ValueError("unsupported playability audit")
    if installed.get("schema_version") != 1:
        raise ValueError("unsupported installed route manifest")
    if len(audit["games"]) != 61 or sum(row["controllerVerified"] for row in audit["games"]) > 40:
        raise ValueError("expected 61 routes and at most 40 controller-verified games")

    routes = keyed(installed["entries"])
    build = builtin_settings()
    build.update(keyed(additions))
    audited = keyed(audit["games"])
    if routes.keys() != audited.keys() or build.keys() != audited.keys():
        raise ValueError("installed, build and audited game IDs differ")
    if {row["id"] for row in audited.values() if row.get("nativeQualificationBatch") == 1} - controls.keys():
        raise ValueError("missing controller data for a Batch 1 native game")
    html5_rows = [
        {"input": checked_button(row["button"]), "action": row["label"]}
        for row in sorted(html5_controls.values(), key=lambda row: row["button"])
    ]
    if len({row["input"] for row in html5_rows}) != len(html5_rows):
        raise ValueError("duplicate HTML5 button")

    games = []
    documents = {}
    for game_id, game in audited.items():
        slug = game["slug"]
        source = build[game_id]
        installed_row = routes[game_id]
        if not TOKEN.fullmatch(slug) or source["slug"] != slug or installed_row["route"] != f"/{slug}/":
            raise ValueError(f"route mismatch for {game_id}")
        image_rel = Path(installed_row["image_path"])
        digest = installed_row["image_sha256"]
        if (len(image_rel.parts) != 2 or image_rel.parts[0] != "private"
                or image_rel.suffix.lower() not in {".img", ".kpk"}
                or not re.fullmatch(r"[0-9a-f]{64}", digest)
                or source.get("image_sha256", digest) != digest):
            raise ValueError(f"archive metadata mismatch for {game_id}")
        image = library / image_rel
        art = image.with_name(f"{image.stem}-preview.png")
        controls_for_game = deepcopy(controls.get(game_id, {}))
        patches = controls_for_game.pop("seed", [])
        tuning = tuning_defaults(controls_for_game)
        window_title = f"{game['title']} — Systemless"
        classic = game["classicConfig"]
        config = {
            "imagePath": str(image),
            "architecture": classic["architecture"],
            "executablePath": source["executable_path"],
            # Blobbo's reviewed save/start scripts reference the tested 640x480 desktop.
            "screenSize": [640, 480] if slug == "blobbo" else classic["screenSize"],
            "screenDepth": classic["screenDepth"],
            "applicationPartitionSize": source.get("application_partition_size"),
            "fileMappings": source.get("file_mappings", {}),
            "extraSavePaths": EXTRA_SAVES.get(slug, []),
            "bootPatches": patches,
            "windowTitle": window_title,
            "controls": controls_for_game,
            "tuning": tuning,
        }
        config_path = f"game-config/{slug}.json"
        documents[config_path] = config

        native_profile = None
        if controls_for_game:
            native_profile = f"profiles/systemless-{slug}.json"
            documents[native_profile] = profile(
                slug, game["title"], "systemless.exe", window_title,
                overlay_rows(controls_for_game), legacy_title_match)
        launch_mode = game["launchMode"]
        if game.get("nativeQualificationBatch") == 1:
            launch_mode = "native"
        profile_path = native_profile
        if game_id == CLOCKWERX:
            profile_path = "profiles/systemless-clockwerx-html5.json"
            documents[profile_path] = profile(
                "clockwerx-html5", game["title"], "msedge.exe", "— HTML5 pilot",
                html5_rows, legacy_title_match)

        games.append({
            "id": game_id,
            "slug": slug,
            "title": game["title"],
            "platform": "Classic Mac (PPC)" if classic["architecture"] == "ppc" else "Classic Mac (68K)",
            "tier": game["tier"],
            "controllerVerified": game["controllerVerified"],
            "physicalControllerVerified": game["physicalControllerVerified"],
            "defaultVisible": game["controllerVerified"] and game["defaultVisible"],
            "controlArchetype": game["controlArchetype"],
            "launchMode": launch_mode,
            "launchRoute": game.get("launchRoute", installed_row["route"]),
            "nativeQualificationBatch": game.get("nativeQualificationBatch"),
            "gameConfig": config_path,
            "profile": profile_path,
            "nativeProfile": native_profile,
            "imagePath": str(image),
            "imageSha256": digest,
            "architecture": classic["architecture"],
            "art": str(art) if art.is_file() else None,
            "tuning": tuning,
        })

    documents["catalog.json"] = {
        "schema": "systemless-spectre-catalog/1",
        "runtimeExe": str(runtime),
        "webServerUrl": web_url,
        "games": games,
    }
    return documents


def write_documents(documents, output, library, protected_inputs):
    library = library.resolve()
    output = output.resolve()
    paths = {name: (output / name).resolve() for name in documents}
    if library in (output, *output.parents) or any(
            output not in path.parents or library in (path, *path.parents) or path in protected_inputs
            for path in paths.values()):
        raise ValueError("export output escapes its destination or overlaps source files")
    for name, document in documents.items():
        path = paths[name]
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = None
        try:
            with NamedTemporaryFile(dir=path.parent, delete=False) as staging:
                temporary = Path(staging.name)
                data = json.dumps(document, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
                staging.write(data.encode("utf-8"))
            os.replace(temporary, path)
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--library", type=Path, required=True, help="installed library directory")
    parser.add_argument("--build-manifest", type=Path, required=True)
    parser.add_argument("--runtime-exe", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--audit", type=Path, default=AUDIT)
    parser.add_argument("--legacy-title-match", action="store_true",
                        help="omit process names for SpectreLaunch's process-or-title resolver")
    parser.add_argument("--web-server-url", default="http://127.0.0.1:8087")
    args = parser.parse_args()
    library = args.library.resolve()
    installed = library / "private-library.json"
    inputs = [args.audit, installed, args.build_manifest, SHARED_CONTROLS,
              NATIVE_CONTROLS, HTML5_CONTROLS, args.runtime_exe]
    try:
        documents = output_documents(
            read_json(args.audit), read_json(installed),
            load_manifest(args.build_manifest, verify_assets=False),
            native_controls(), read_json(HTML5_CONTROLS), library,
            args.runtime_exe.resolve(), args.web_server_url, args.legacy_title_match,
        )
        write_documents(documents, args.output, library, {path.resolve() for path in inputs})
    except (OSError, ValueError, KeyError) as error:
        parser.exit(1, f"Catalog export failed: {error}\n")
    profile_count = sum(name.startswith("profiles/") for name in documents)
    print(f"Exported {len(documents['catalog.json']['games'])} routes and {profile_count} profiles.")


if __name__ == "__main__":
    main()
