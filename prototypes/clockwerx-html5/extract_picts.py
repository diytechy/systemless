"""Extract owned ClockWerx UI PICT screens into a private assets directory.

Outputs are PRIVATE and must never be written inside the Git repository.
Reads the copied HFS fixture without modifying it and converts Mac PICT
resources (prefixed with a 512-byte file header) via ImageMagick (`magick`).
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

from extract_assets import resources

IMAGE_SHA256 = "03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4"

PICT_SPECS = (
    (300, "title", "pict-title.png"),
    (301, "options", "pict-options.png"),
    (303, "frame", "pict-frame.png"),
    (304, "topScores", "pict-top-scores.png"),
    (305, "credits", "pict-credits.png"),
    (306, "player2", "pict-player2.png"),
    (310, "completed", "pict-completed.png"),
    (500, "logo", "pict-logo.png"),
)


def private_assets_dir(path):
    path = Path(path).resolve()
    repo = Path(__file__).resolve().parents[2]
    if path == repo or repo in path.parents:
        raise ValueError("Use a private assets directory outside the Git repository.")
    return path


def convert_pict_bytes(pict_data, output_png, magick="magick", timeout=15):
    """Convert raw Mac PICT resource bytes (without 512-byte header) to PNG."""
    output_png = Path(output_png)
    with tempfile.TemporaryDirectory(dir=output_png.parent) as temp:
        pict_file = Path(temp) / (output_png.stem + ".pict")
        pict_file.write_bytes(bytes(512) + pict_data)
        proc = subprocess.run(
            [magick, str(pict_file), str(output_png)],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        if proc.returncode != 0 or not output_png.is_file():
            detail = (proc.stderr or proc.stdout or "").strip()
            raise RuntimeError(f"PICT conversion failed for {output_png.name}: {detail}")


def extract_picts_from_rsrc(rsrc_bytes, output_dir, *, magick="magick", converter=convert_pict_bytes):
    """Extract all PICT_SPECS from a ClockWerx app resource fork into output_dir."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    bank = {rid: data for kind, rid, _, data in resources(rsrc_bytes) if kind == b"PICT"}
    pict_assets = {}
    for rid, key, filename in PICT_SPECS:
        if rid not in bank:
            raise KeyError(f"Missing PICT resource {rid} ({key})")
        converter(bank[rid], output_dir / filename, magick=magick)
        pict_assets[key] = filename
    return pict_assets


def update_manifest(assets_dir, pict_assets):
    assets_dir = private_assets_dir(assets_dir)
    path = assets_dir / "manifest.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest["pictAssets"] = dict(pict_assets)
    manifest["files"] = [
        dict(name=file.name, bytes=file.stat().st_size, sha256=hashlib.sha256(file.read_bytes()).hexdigest())
        for file in sorted(assets_dir.iterdir()) if file.is_file() and file != path
    ]
    with tempfile.TemporaryDirectory(dir=assets_dir) as temp:
        staged = Path(temp) / path.name
        staged.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        os.replace(staged, path)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--update-manifest", required=True, type=Path, metavar="ASSETS_DIR")
    parser.add_argument("--magick", help="Override the ImageMagick executable")
    parser.add_argument("--allow-any-hash", action="store_true")
    args = parser.parse_args()

    try:
        assets = private_assets_dir(args.update_manifest)
        manifest = json.loads((assets / "manifest.json").read_text(encoding="utf-8"))
        raw = args.image.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if digest != IMAGE_SHA256 and not args.allow_any_hash:
            raise ValueError("Unexpected ClockWerx image SHA-256: " + digest)
        if manifest.get("fixtureSha256", digest) != digest:
            raise ValueError("The existing assets manifest refers to a different disk image.")
        magick = shutil.which(args.magick) if args.magick else shutil.which("magick")
        if not magick:
            raise ValueError("ImageMagick `magick` executable not found.")

        import machfs

        volume = machfs.Volume()
        volume.read(raw)
        folder = volume["ClockWerx Folder"]
        app_rsrc = folder["ClockWerx"].rsrc
        with tempfile.TemporaryDirectory(dir=assets) as temp:
            output = Path(temp)
            pict_assets = extract_picts_from_rsrc(app_rsrc, output, magick=magick)
            for png in output.iterdir():
                if png.is_file():
                    os.replace(png, assets / png.name)
            update_manifest(assets, pict_assets)
        print(json.dumps({"pictAssets": pict_assets, "count": len(pict_assets)}), flush=True)
    except (OSError, ValueError, RuntimeError, ImportError, KeyError, subprocess.SubprocessError) as error:
        parser.exit(1, f"PICT extraction failed: {error}\n")


if __name__ == "__main__":
    main()
