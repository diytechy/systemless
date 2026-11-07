"""Synthetic compile/package/route agreement checks; no private media required."""
import json
from pathlib import Path
import tempfile
import unittest
from package_library import package
from private_library_manifest import BUILTINS, sha256_file
from serve_library import library_routes
from select_library_bundle import select_bundle


class PackagingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.dist = self.root/'dist'; self.dist.mkdir()
        (self.dist/'index.html').write_text('<html><head></head><body></body></html>', encoding='utf-8')
        self.media = self.root/'media'; self.media.mkdir()
        for slug, _, _ in BUILTINS:
            (self.media/(slug+'.img')).write_bytes(b'synthetic image '+slug.encode())
        self.image = self.root/'sample.hfv'; self.image.write_bytes(b'synthetic additional game')
        self.row = dict(slug='sample',id='sample-personal-1',title='Sample',summary='Synthetic test',
                        image_path=str(self.image),image_sha256=sha256_file(self.image),
                        architecture='68k',executable_path='Volume/Folder/Sample',screen_size=[800,600],screen_depth=4)
        self.manifest=self.root/'additions.json'
        self.manifest.write_text(json.dumps(dict(schema_version=1,entries=[self.row])),encoding='utf-8')
        self.binary=self.dist/'synthetic_bg.wasm'
        markers=[part for slug,route,identity in BUILTINS for part in (identity,'/'+route+'/','/private/'+slug+'.img')]
        markers+=['sample-personal-1','/sample/','/private/sample.img']
        self.binary.write_bytes(b'\0asm'+b' '.join(value.encode() for value in markers))

    def test_copied_hashes_routes_and_compiled_id_agree(self):
        package(self.dist,self.manifest,self.media)
        self.assertIn('/sample',library_routes(self.dist))
        self.assertEqual(sha256_file(self.dist/'private/sample.img'),self.row['image_sha256'])
        metadata=json.loads((self.dist/'private-library.json').read_text())
        self.assertNotIn('source',metadata['entries'][-1])
        self.assertNotIn(str(self.root),json.dumps(metadata))

    def test_missing_compiled_addition_fails_before_copy(self):
        self.binary.write_bytes(b' '.join(row[2].encode() for row in BUILTINS))
        with self.assertRaisesRegex(ValueError,'missing private library entry'):
            package(self.dist,self.manifest,self.media)
        self.assertFalse((self.dist/'private').exists())

    def test_changed_media_and_invalid_routes_are_rejected(self):
        self.image.write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError,'changed reviewed fixture'):
            package(self.dist,self.manifest,self.media)
        self.assertFalse((self.dist/'private').exists())
        (self.dist/'private-library.json').write_text(json.dumps(dict(schema_version=1,entries=[dict(route='/../',image_path='private/x.img')])))
        with self.assertRaises(ValueError): library_routes(self.dist)

    def test_missing_compiled_route_fails_before_copy(self):
        self.binary.write_bytes(self.binary.read_bytes().replace(b'/sample/',b'/missing/'))
        with self.assertRaisesRegex(ValueError,'missing private library entry/route/media'):
            package(self.dist,self.manifest,self.media)
        self.assertFalse((self.dist/'private').exists())

    def test_original_bundle_route_fallback(self):
        self.assertEqual(library_routes(self.dist),{'/koji-the-frog','/clockwerx','/delirium'})

    def test_two_volume_diagnostic_pack_keeps_its_format(self):
        pack=self.root/'sample.kpk';pack.write_bytes(self.image.read_bytes())
        self.row['image_path']=str(pack)
        self.manifest.write_text(json.dumps(dict(schema_version=1,entries=[self.row])),encoding='utf-8')
        self.binary.write_bytes(self.binary.read_bytes().replace(b'/private/sample.img',b'/private/sample.kpk'))
        package(self.dist,self.manifest,self.media)
        self.assertEqual(sha256_file(self.dist/'private/sample.kpk'),self.row['image_sha256'])
        self.assertIn('/sample',library_routes(self.dist))

    def test_selection_is_atomic_and_changed_media_preserves_prior_pointer(self):
        package(self.dist,self.manifest,self.media)
        pointer=self.root/'active-library.json'
        result=select_bundle(self.dist,pointer)
        self.assertEqual(result['entries'],4)
        before=pointer.read_bytes()
        (self.dist/'private/sample.img').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError,'Changed packaged media'):select_bundle(self.dist,pointer)
        self.assertEqual(pointer.read_bytes(),before)


if __name__ == '__main__':
    unittest.main()
