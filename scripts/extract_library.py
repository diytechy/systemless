"""Extract the three owned games read-only into separate fork-preserving HFS images."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import machfs
from extract_koji import extract as extract_koji
from hfsplus_read import HfsPlusReader


def sha(data):
    return hashlib.sha256(data).hexdigest()


def image(volume_name, folder, files, preferences, output, image_size):
    volume = machfs.Volume()
    volume.name = volume_name
    volume.crdate = volume.mddate = 0
    volume[folder] = machfs.Folder()
    for name, file in files:
        if name.endswith(' alias') or name == 'Icon\r':
            continue
        if '/' in name:
            raise ValueError('Unexpected nested game file: '+name)
        volume[folder][name] = copy.deepcopy(file)
    volume['System Folder'] = machfs.Folder()
    volume['System Folder']['Preferences'] = machfs.Folder()
    for name, file in preferences:
        volume['System Folder']['Preferences'][name] = copy.deepcopy(file)
    raw = volume.write(size=image_size, desktopdb=False, bootable=False)
    check = machfs.Volume(); check.read(raw)
    count = 0
    for path, _, names in volume.walk():
        for name in names:
            key = path+(name,)
            left, right = volume[key], check[key]
            if (left.data,left.rsrc,left.type,left.creator) != (right.data,right.rsrc,right.type,right.creator):
                raise ValueError('Fork/metadata round-trip failed: '+str(key))
            count += 1
    output.write_bytes(raw)
    return {'image':output.name,'image_sha256':sha(raw),'image_bytes':len(raw),'files_verified_both_forks':count}


def extract(source, output):
    source = source.resolve(strict=True)
    output = output.resolve()
    if source == output or source in output.parents:
        raise ValueError('Output must be outside the source media directory')
    extract_koji(source,output)
    originals = {name:(source/name).read_bytes() for name in ('001','002','Boot')}
    hashes = {name:sha(raw) for name,raw in originals.items()}
    games = machfs.Volume(); games.read(originals['001'])
    boot = machfs.Volume(); boot.read(originals['Boot'])
    prefs = boot['System Folder']['Preferences']
    def selected_preferences(names):
        return [(name,prefs[name]) for name in names if name in prefs]
    clock_files = list(HfsPlusReader(originals['002']).files('ClockWerx Folder'))
    if not any(name=='ClockWerx' and file.type==b'APPL' and file.rsrc for name,file in clock_files):
        raise ValueError('ClockWerx application not found')
    results = {'clockwerx':image('ClockWerx','ClockWerx Folder',clock_files,
        selected_preferences(['ClockWerx Scores','ClockWerx Settings']),output/'clockwerx.img',8*1024*1024)}
    delirium = games['Delirium 1.1 Folder']
    if delirium['Delirium 1.1'].type != b'APPL':
        raise ValueError('Delirium application not found')
    results['delirium'] = image('Delirium','Delirium 1.1 Folder',
        [(name,file) for name,file in delirium.items() if isinstance(file,machfs.File)],
        selected_preferences(['Delirium 1.1 Preferences']),output/'delirium.img',2*1024*1024)
    for name, expected in hashes.items():
        if sha((source/name).read_bytes()) != expected:
            raise RuntimeError('Source changed during extraction; close SheepShaver and retry')
    manifest = {'source_folder':str(source),'source_sha256':hashes,'games':results,
        'note':'Private game files and existing preferences; do not publish or commit.'}
    (output/'library-extraction.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    for key, result in results.items():
        print(key+': '+str(result['files_verified_both_forks'])+' files verified, both forks preserved')
    print('All original source hashes unchanged.')


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=Path(r'D:\SheepShaver_MAC_Emulator\Content'))
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'www/private')
    args=parser.parse_args()
    extract(args.source,args.output)
