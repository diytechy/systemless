import json
from pathlib import Path
import tempfile
import unittest
from package_clockwerx_pilot import package
from private_library_manifest import BUILTINS,sha256_file


class PilotPackagingTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        root=Path(self.temp.name);self.dist=root/'dist';self.assets=root/'assets'
        self.dist.mkdir();self.assets.mkdir()
        self.entries=[dict(id=row[2]) for row in BUILTINS]
        (self.dist/'private-library.json').write_text(json.dumps(dict(schema_version=1,entries=self.entries)))
        (self.dist/'index.html').write_text('<html><body>Library</body></html>')
        pixel=self.assets/'sample.png';pixel.write_bytes(b'synthetic private pixel')
        self.manifest=dict(logicalSize=[640,480],backdrop='sample.png',sounds={},
            groups={'dots':dict(images=['sample.png'])},
            files=[dict(name='sample.png',sha256=sha256_file(pixel),bytes=pixel.stat().st_size)])
        self.save_manifest()
    def save_manifest(self):
        (self.assets/'manifest.json').write_text(json.dumps(self.manifest))
    def test_valid_private_copy_and_repeat_keep_original_identities(self):
        package(self.dist,self.assets);package(self.dist,self.assets)
        meta=json.loads((self.dist/'private-library.json').read_text())
        self.assertEqual(meta['entries'],self.entries)
        self.assertEqual(len(meta['experiments']),1)
        self.assertEqual((self.dist/'index.html').read_text().count('aria-label="Private experiments"'),1)
        self.assertEqual((self.dist/'clockwerx-html5/assets/sample.png').read_bytes(),b'synthetic private pixel')
    def test_changed_or_unlisted_art_fails_before_copy(self):
        (self.assets/'sample.png').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError,'changed private asset'):package(self.dist,self.assets)
        self.assertFalse((self.dist/'clockwerx-html5').exists())
        self.manifest['files'][0]['sha256']=sha256_file(self.assets/'sample.png')
        self.manifest['groups']['dots']['images']=['not-listed.png'];self.save_manifest()
        with self.assertRaisesRegex(ValueError,'unverified asset'):package(self.dist,self.assets)
    def test_existing_unowned_route_is_preserved(self):
        route=self.dist/'clockwerx-html5';route.mkdir();(route/'keep.txt').write_text('unrelated')
        with self.assertRaisesRegex(ValueError,'no owned pilot marker'):package(self.dist,self.assets)
        self.assertEqual((route/'keep.txt').read_text(),'unrelated')


if __name__=='__main__':unittest.main()
