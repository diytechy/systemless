"""Synthetic extraction checks; no private Macintosh content required."""
import copy
import tempfile
import unittest
from pathlib import Path

import machfs

from extract_owned_game import copy_selected, extract, parts, sha, verify


class ExtractionTests(unittest.TestCase):
    def test_alias_forks_and_metadata_survive_read_copy_write(self):
        source = machfs.Volume()
        source.name = 'Original'
        source['Game'] = machfs.Folder()
        folder = source['Game']
        folder.crdate, folder.mddate, folder.bkdate = 123456, 234567, 345678
        app = machfs.File()
        app.data, app.rsrc = b'data fork', b'resource fork'
        app.type, app.creator = b'APPL', b'TEST'
        app.flags, app.x, app.y = 1024, 12, 34
        app.crdate, app.mddate, app.bkdate = 123456, 234567, 345678
        folder['App'] = app
        alias = machfs.File()
        alias.aliastarget = app
        alias.flags = 0x8000
        folder['App alias'] = alias
        source['Unrelated'] = copy.deepcopy(app)
        raw = source.write(size=2097152, desktopdb=False, bootable=False)
        parsed = machfs.Volume()
        parsed.read(raw)
        original_alias = parsed['Game']['App alias']
        self.assertIsNotNone(original_alias.aliastarget)
        original_forks = original_alias.data, original_alias.rsrc
        selected = copy_selected(parsed, ['Game'])
        self.assertIsNone(selected['Game']['App alias'].aliastarget)
        self.assertIsNotNone(original_alias.aliastarget)
        reopened = machfs.Volume()
        reopened.read(selected.write(size=2097152, desktopdb=False, bootable=False))
        self.assertEqual(verify(selected, reopened), 2)
        self.assertEqual(original_forks, (reopened['Game']['App alias'].data,
                                         reopened['Game']['App alias'].rsrc))
        self.assertNotIn('Unrelated', reopened)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            originals = root / 'originals'
            originals.mkdir()
            image = originals / 'source.img'
            image.write_bytes(raw)
            result = extract(image, root / 'copied.img', ['Game'], 2097152, originals)
            self.assertEqual(result['files_verified'], 2)
            self.assertEqual(sha(image.read_bytes()), sha(raw))
            with self.assertRaises(ValueError):
                extract(image, originals / 'bad.img', ['Game'], 2097152, originals)
            with self.assertRaises(ValueError):
                extract(image, root / 'copied.img', ['Game'], 2097152, originals)

    def test_path_guards_and_overlapping_selections(self):
        for name in ('../App', '/App', 'Game//App', 'A' * 32, 'bad:name'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                parts(name)
        source = machfs.Volume()
        source['Game'] = machfs.Folder()
        source['Game']['App'] = machfs.File()
        with self.assertRaises(ValueError):
            copy_selected(source, ['Game', 'Game/App'])


if __name__ == '__main__':
    unittest.main()
