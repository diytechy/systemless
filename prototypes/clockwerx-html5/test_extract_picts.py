import json
import struct
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import extract_picts as ep


def build_synthetic_rsrc(items):
    """Build a minimal valid Macintosh resource fork containing (type4, rid, payload) tuples."""
    data_section = bytearray()
    offsets = []
    for _, _, payload in items:
        offsets.append(len(data_section))
        data_section += struct.pack(">I", len(payload)) + payload

    # Group by type
    by_type = {}
    for idx, (kind, rid, _) in enumerate(items):
        by_type.setdefault(kind, []).append((rid, offsets[idx]))

    # Resource map: 16B copy of header + 4B next + 2B ref + 2B attrs + 2B type_off + 2B name_off = 28 bytes
    type_list = bytearray(struct.pack(">H", len(by_type) - 1))
    ref_lists = bytearray()
    type_list_header_len = 2 + 8 * len(by_type)
    for kind, entries in by_type.items():
        ref_off = type_list_header_len + len(ref_lists)
        type_list += struct.pack(">4sHH", kind, len(entries) - 1, ref_off)
        for rid, data_off in entries:
            ref_lists += struct.pack(">hHB", rid, 0xFFFF, 0) + data_off.to_bytes(3, "big") + struct.pack(">I", 0)

    type_list_off = 28
    name_list_off = type_list_off + len(type_list) + len(ref_lists)
    rsrc_map = bytearray(24) + struct.pack(">HH", type_list_off, name_list_off) + type_list + ref_lists

    data_off = 256
    map_off = data_off + len(data_section)
    header = struct.pack(">4I", data_off, map_off, len(data_section), len(rsrc_map))
    rsrc_map[0:16] = header
    return header + bytes(256 - 16) + bytes(data_section) + bytes(rsrc_map)


class ExtractPictsTests(unittest.TestCase):
    def test_private_assets_dir_rejects_git_repo_paths(self):
        with self.assertRaisesRegex(ValueError, "outside the Git repository"):
            ep.private_assets_dir(Path(__file__).resolve().parent)

    def test_extract_picts_from_synthetic_resource_fork_and_update_manifest(self):
        synthetic_items = [(b"PICT", rid, f"synthetic-pict-{rid}".encode("ascii")) for rid, _, _ in ep.PICT_SPECS]
        fork = build_synthetic_rsrc(synthetic_items)

        seen = {}
        def fake_converter(pict_data, output_png, magick="magick"):
            seen[Path(output_png).name] = pict_data
            Path(output_png).write_bytes(b"\x89PNG\r\n\x1a\n" + pict_data)

        with tempfile.TemporaryDirectory() as tmp:
            assets = Path(tmp) / "assets"
            assets.mkdir()
            (assets / "backdrop.png").write_bytes(b"png")
            (assets / "manifest.json").write_text(
                json.dumps({"logicalSize": [640, 480], "backdrop": "backdrop.png", "sounds": {}, "files": []}),
                encoding="utf-8",
            )
            pict_assets = ep.extract_picts_from_rsrc(fork, assets, converter=fake_converter)
            self.assertEqual(len(pict_assets), len(ep.PICT_SPECS))
            self.assertEqual(pict_assets["title"], "pict-title.png")
            self.assertEqual(pict_assets["completed"], "pict-completed.png")
            self.assertEqual(seen["pict-title.png"], b"synthetic-pict-300")

            manifest = ep.update_manifest(assets, pict_assets)
            self.assertEqual(manifest["pictAssets"], pict_assets)
            names = {row["name"] for row in manifest["files"]}
            self.assertTrue(set(pict_assets.values()).issubset(names))
            self.assertIn("backdrop.png", names)

    def test_missing_pict_resource_raises_key_error(self):
        fork = build_synthetic_rsrc([(b"PICT", 300, b"only-title")])
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(KeyError):
                ep.extract_picts_from_rsrc(fork, tmp, converter=lambda *a, **k: None)


if __name__ == "__main__":
    unittest.main()
