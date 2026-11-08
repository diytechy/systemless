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
    def test_unlisted_vector_reference_is_rejected_before_copy(self):
        self.manifest['vectorAssets']=dict(dots=['missing.svg'],hands={})
        self.save_manifest()
        with self.assertRaisesRegex(ValueError,'unverified asset'):package(self.dist,self.assets)

    def test_door_art_and_scene_collision_profiles_must_be_verified(self):
        for field in ('leaves','caps','switches','doorOutlinesFile'):
            with self.subTest(field=field):
                self.manifest['vectorAssets']=dict(dots=[],hands={})
                self.manifest['scenes']=[dict(title='Synthetic',levelDefinition=dict(outlinesFile='sample.png'))]
                if field=='doorOutlinesFile':self.manifest['scenes'][0]['levelDefinition'][field]='missing.json'
                else:self.manifest['vectorAssets']['doors']={field:dict(file='missing.svg')}
                self.save_manifest()
                with self.assertRaisesRegex(ValueError,'unverified asset'):package(self.dist,self.assets)

    def test_oil_atlases_and_profiles_cannot_escape_verified_payloads(self):
        for field in ('puddles','droplets','oilOutlinesFile','dotOutlinesFile','bombOutlinesFile','bombs','bombDots'):
            with self.subTest(field=field):
                self.manifest['vectorAssets']=dict(dots=[],hands={})
                self.manifest['scenes']=[dict(title='Synthetic',levelDefinition=dict(outlinesFile='sample.png'))]
                if field.endswith('File'):self.manifest['scenes'][0]['levelDefinition'][field]='missing.json'
                elif field in ('bombs','bombDots'):self.manifest['vectorAssets'][field]={'synthetic':dict(file='missing.svg')}
                else:self.manifest['vectorAssets']['oil']={field:dict(file='missing.svg')}
                self.save_manifest()
                with self.assertRaisesRegex(ValueError,'unverified asset'):package(self.dist,self.assets)
        self.assertFalse((self.dist/'clockwerx-html5').exists())
    def test_vector_references_and_renderer_are_packaged(self):
        vector=self.assets/'hand.svg';vector.write_text('<svg xmlns="http://www.w3.org/2000/svg"/>')
        self.manifest['files'].append(dict(name=vector.name,sha256=sha256_file(vector),bytes=vector.stat().st_size))
        self.manifest['vectorAssets']=dict(dots=['hand.svg'],hands={'700':dict(file='hand.svg')})
        self.save_manifest();record=package(self.dist,self.assets)
        self.assertEqual(record['presentation'],'svg-continuous')
        self.assertTrue((self.dist/'clockwerx-html5/rendering.mjs').is_file())
        self.assertTrue((self.dist/'clockwerx-html5/sparkles.mjs').is_file())
        self.assertTrue((self.dist/'clockwerx-html5/dots.mjs').is_file())
        self.assertEqual((self.dist/'clockwerx-html5/assets/hand.svg').read_bytes(),vector.read_bytes())
    def test_goal_art_must_be_verified(self):
        self.manifest['vectorAssets']=dict(dots=[],hands={},goal=dict(file='missing-goal.svg'))
        self.save_manifest()
        with self.assertRaisesRegex(ValueError,'unverified asset'):package(self.dist,self.assets)
        self.assertFalse((self.dist/'clockwerx-html5').exists())
    def test_starburst_art_must_be_verified(self):
        self.manifest['vectorAssets']=dict(dots=[],hands={},starbursts=dict(file='missing-stars.svg'))
        self.save_manifest()
        with self.assertRaisesRegex(ValueError,'unverified asset'):package(self.dist,self.assets)
        self.assertFalse((self.dist/'clockwerx-html5').exists())
    def test_dot_variants_must_be_verified(self):
        self.manifest['vectorAssets']=dict(dots=[],hands={},dotVariants={'bonus:0':dict(file='missing-ring.svg')})
        self.save_manifest()
        with self.assertRaisesRegex(ValueError,'unverified asset'):package(self.dist,self.assets)
        self.assertFalse((self.dist/'clockwerx-html5').exists())
    def test_unverified_hazard_effect_and_collision_data_are_rejected(self):
        for field in ('spikes','walls','death','levelDefinition'):
            with self.subTest(field=field):
                self.manifest.pop('levelDefinition',None)
                self.manifest['vectorAssets']=dict(dots=[],hands={})
                if field in ('spikes','walls'):self.manifest['vectorAssets'][field]=dict(frames=[dict(file='missing.svg')])
                elif field=='death':self.manifest['vectorAssets']['death']=dict(file='missing.svg')
                else:self.manifest['levelDefinition']=dict(outlinesFile='missing.json')
                self.save_manifest()
                with self.assertRaisesRegex(ValueError,'unverified asset'):package(self.dist,self.assets)
                self.assertFalse((self.dist/'clockwerx-html5').exists())
    def test_scene_outline_reference_is_verified(self):
        self.manifest['scenes']=[dict(title='Synthetic',levelDefinition=dict(outlinesFile='missing.json'))]
        self.save_manifest()
        with self.assertRaisesRegex(ValueError,'unverified asset'):package(self.dist,self.assets)
        self.assertFalse((self.dist/'clockwerx-html5').exists())


if __name__=='__main__':unittest.main()
