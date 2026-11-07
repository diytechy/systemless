import tempfile
import unittest
from pathlib import Path
import machfs
from extract_koji import verify_metadata, folder_dates, preserved_file
from extract_library import image


class MetadataTests(unittest.TestCase):
    def fixture(self):
        volume=machfs.Volume();volume.name='Synthetic'
        volume['Folder']=machfs.Folder()
        volume['Folder'].crdate=3000000000;volume['Folder'].mddate=3000000010;volume['Folder'].bkdate=3000000020
        file=machfs.File();file.data=b'data';file.rsrc=b'resource';file.type=b'BINA';file.creator=b'TEST'
        file.crdate=3000000030;file.mddate=3000000040;file.bkdate=3000000050;file.x=-17;file.y=-31;file.flags=0x400
        volume['Folder']['File']=file
        return volume

    def test_forks_finder_fields_dates_and_raw_coordinates(self):
        original=self.fixture()
        writable=self.fixture();writable['Folder']['File']=preserved_file(original['Folder']['File'])
        copied=machfs.Volume();copied.read(writable.write(size=2*1024*1024,desktopdb=False,bootable=False))
        self.assertEqual(verify_metadata(original,copied),1)
        copied['Folder']['File'].rsrc=b'changed'
        with self.assertRaisesRegex(ValueError,'rsrc'):verify_metadata(original,copied)

    def test_folder_date_loss_is_detected(self):
        original=self.fixture();copied=self.fixture();copied['Folder'].mddate=0
        with self.assertRaisesRegex(ValueError,'mddate'):verify_metadata(original,copied)
        folder_dates(copied['Folder'],original['Folder'])
        self.assertEqual(verify_metadata(original,copied),1)

    def test_library_image_preserves_all_three_folder_dates(self):
        source=self.fixture();boot=machfs.Volume();boot['System Folder']=machfs.Folder()
        boot['System Folder']['Preferences']=machfs.Folder()
        for folder in (boot['System Folder'],boot['System Folder']['Preferences']):folder_dates(folder,source['Folder'])
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/'synthetic.img'
            result=image('Synthetic','Folder',list(source['Folder'].items()),[],target,2*1024*1024,source['Folder'],boot)
            self.assertEqual(result['files_verified_both_forks'],1)
            reopened=machfs.Volume();reopened.read(target.read_bytes())
            for path in [('Folder',),('System Folder',),('System Folder','Preferences')]:
                self.assertEqual(reopened[path].crdate,source['Folder'].crdate)
                self.assertEqual(reopened[path].mddate,source['Folder'].mddate)
                self.assertEqual(reopened[path].bkdate,source['Folder'].bkdate)


if __name__=='__main__':unittest.main()
