"""The exporter tests use reviewed metadata and synthetic local paths only."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from scripts import export_spectre_catalog as exporter


class ExportSpectreCatalogTest(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.library = self.root / "installed"
        self.library.mkdir()
        self.audit = exporter.read_json(exporter.AUDIT)
        builtin = {game_id: image for image, _, game_id in exporter.BUILTINS}
        self.additions = []
        rows = []
        for game in self.audit["games"]:
            game_id, slug = game["id"], game["slug"]
            rows.append({"id": game_id, "route": f"/{slug}/",
                         "image_path": f"private/{builtin.get(game_id, slug)}.img",
                         "image_sha256": "0" * 64})
            if game_id not in builtin:
                self.additions.append({"id": game_id, "slug": slug, "executable_path": f"Volume/{slug}"})
        self.installed = {"schema_version": 1, "entries": rows}

    def render(self, legacy_title_match=False):
        return exporter.output_documents(
            self.audit, self.installed, self.additions, exporter.native_controls(),
            exporter.read_json(exporter.HTML5_CONTROLS), self.library, self.root / "systemless.exe",
            "http://127.0.0.1:8087", legacy_title_match,
        )

    def test_catalog_schema_route_evidence_and_batch_one_configs(self):
        outputs = self.render()
        catalog = outputs["catalog.json"]
        self.assertEqual(catalog["schema"], "systemless-spectre-catalog/1")
        self.assertEqual(len(catalog["games"]), 61)
        verified = [game for game in catalog["games"] if game["controllerVerified"]]
        self.assertLessEqual(len(verified), 40)
        self.assertEqual([game["slug"] for game in verified], ["clockwerx"])
        clockwerx = verified[0]
        self.assertEqual(clockwerx["launchMode"], "html5")
        self.assertEqual(clockwerx["launchRoute"], "/clockwerx-html5/")
        games = {game["slug"]: game for game in catalog["games"]}
        self.assertEqual(sum(game["launchMode"] == "native" for game in games.values()), 7)
        for game in games.values():
            self.assertIn(game["tier"], [1, 2, 3])
            self.assertIn(game["controlArchetype"], "ABCDE")
            self.assertIn("art", game)
            self.assertIn(game["gameConfig"], outputs)
            self.assertEqual(game["tuning"], outputs[game["gameConfig"]]["tuning"])
            self.assertEqual(game["defaultVisible"], game["controllerVerified"])
        blobbo = outputs[games["blobbo"]["gameConfig"]]
        self.assertEqual(blobbo["screenSize"], [640, 480])
        self.assertTrue(blobbo["extraSavePaths"])
        self.assertTrue(blobbo["controls"]["pad"]["step"])
        self.assertTrue(outputs[clockwerx["gameConfig"]]["bootPatches"][1]["enforce"])

    def test_profiles_match_runtime_bindings_without_reserved_buttons(self):
        documents = self.render()
        profiles = [doc for name, doc in documents.items() if name.startswith("profiles/")]
        self.assertEqual(len(profiles), 9)
        for profile in profiles:
            self.assertEqual(profile["schema"], "controller-overlay-profile/1")
            self.assertTrue(profile["match"]["windowTitleContains"])
            self.assertIn(profile["match"]["processNames"][0], {"systemless.exe", "msedge.exe"})
            for section in profile["sections"]:
                for row in section["rows"]:
                    self.assertNotIn(row["input"], {"PS", "L1", "L2", "Share"})
        for number in (4, 6, 8, 16):
            with self.assertRaisesRegex(ValueError, "reserved"):
                exporter.checked_button(number)
        blobbo = documents["game-config/blobbo.json"]
        self.assertEqual(
            documents["profiles/systemless-blobbo.json"]["sections"][0]["rows"],
            exporter.overlay_rows(blobbo["controls"]),
        )

    def test_legacy_matches_do_not_select_a_game_by_process_alone(self):
        documents = self.render(legacy_title_match=True)
        for game in documents["catalog.json"]["games"]:
            if game["nativeProfile"]:
                config = documents[game["gameConfig"]]
                match = documents[game["nativeProfile"]]["match"]
                self.assertEqual(match["windowTitleContains"], [config["windowTitle"]])
                self.assertEqual(match["processNames"], [])
        self.assertEqual(
            documents["profiles/systemless-clockwerx-html5.json"]["match"],
            {"processNames": [], "windowTitleContains": ["— HTML5 pilot"]},
        )

    def test_generation_is_byte_deterministic_and_protects_source(self):
        documents = self.render()
        first, second = self.root / "first", self.root / "second"
        manifest = self.library / "private-library.json"
        manifest.write_text(json.dumps(self.installed), encoding="utf-8")
        before = manifest.read_bytes()
        exporter.write_documents(documents, first, self.library, {manifest})
        exporter.write_documents(self.render(), second, self.library, {manifest})
        for name in documents:
            self.assertEqual((first / name).read_bytes(), (second / name).read_bytes(), name)
        with self.assertRaisesRegex(ValueError, "overlaps"):
            exporter.write_documents(documents, self.library / "export", self.library, {manifest})
        self.assertEqual(manifest.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
