import copy
import tempfile
import unittest
from pathlib import Path
from private_library_manifest import sha256_file, validate_manifest


class PrivateManifestTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.image = self.root / 'copy.hfv'
        self.image.write_bytes(b'owned synthetic fixture')
        self.entry = dict(slug='synthetic-game', id='synthetic-personal-10', title='Synthetic',
                          summary='Preservation test', image_path=str(self.image),
                          image_sha256=sha256_file(self.image), architecture='68k',
                          executable_path='Owned Game/Synthetic/Game', screen_size=[640, 480],
                          screen_depth=8)

    def tearDown(self):
        # TemporaryDirectory owns this exact resolved test root, containing no user files.
        self.assertEqual(Path(self.temp.name).resolve(), self.root)
        self.temp.cleanup()

    def document(self, entry=None):
        return {'schema_version': 1, 'entries': [entry or self.entry]}

    def rejects(self, key, value):
        row = copy.deepcopy(self.entry); row[key] = value
        with self.assertRaises(ValueError):
            validate_manifest(self.document(row))

    def test_explicit_fixture_and_preserved_size_default(self):
        row = validate_manifest(self.document())[0]
        self.assertNotIn('application_partition_size', row)
        self.assertEqual(row['file_mappings'], {})
        self.assertEqual(row['developer'], 'Unknown')

    def test_existing_save_identity_cannot_be_reused(self):
        self.rejects('id', 'clockwerx-personal-10')

    def test_existing_route_or_prototype_route_cannot_be_reused(self):
        self.rejects('slug', 'koji-the-frog')
        self.rejects('slug', 'clockwerx-html5')

    def test_duplicate_addition_is_rejected(self):
        doc = self.document(); doc['entries'].append(copy.deepcopy(self.entry))
        with self.assertRaises(ValueError):
            validate_manifest(doc)

    def test_changed_media_is_rejected(self):
        self.image.write_bytes(b'changed')
        with self.assertRaises(ValueError):
            validate_manifest(self.document())

    def test_pacing_changes_are_not_manifest_fields(self):
        self.rejects('cpu_mhz', 6)

    def test_guest_path_traversal_is_rejected(self):
        self.rejects('executable_path', '../Game')
        self.rejects('file_mappings', {'Owned/Prefs': '../Prefs'})

    def test_boolean_dimensions_or_partition_are_not_numbers(self):
        self.rejects('screen_size', [True, 480])
        self.rejects('application_partition_size', True)

    def test_missing_or_relative_media_is_rejected(self):
        self.rejects('image_path', 'copy.hfv')
        self.rejects('image_path', str(self.root / 'missing.hfv'))

    def test_reviewed_dsk_and_kpk_get_canonical_packaged_paths(self):
        for suffix,target in (('.dsk','private/synthetic-game.img'),('.kpk','private/synthetic-game.kpk')):
            path=self.image.with_suffix(suffix);path.write_bytes(self.image.read_bytes())
            row=copy.deepcopy(self.entry);row['image_path']=str(path)
            self.assertEqual(validate_manifest(self.document(row))[0]['packaged_path'],target)
        self.rejects('packaged_path','private/unreviewed.img')


if __name__ == '__main__':
    unittest.main()
