"""Copy Koji out of HFS images, preserving forks; never mount or write originals."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import machfs


def digest(data):
    return hashlib.sha256(data).hexdigest()


def extract(source, dest):
    source = source.resolve(strict=True)
    dest = dest.resolve()
    if dest == source or source in dest.parents:
        raise ValueError('Output must be outside the original media folder')
    paths = [source / '001', source / 'Boot']
    originals = {}
    volumes = []
    for path in paths:
        data = path.read_bytes()
        originals[path.name] = digest(data)
        volume = machfs.Volume()
        volume.read(data)
        volumes.append(volume)
    games, boot = volumes
    output = machfs.Volume()
    output.name = 'Koji'
    output.crdate = output.mddate = 0
    output['Koji the Frog'] = machfs.Folder()
    for name, file in games['Koji the Frog'].items():
        if isinstance(file, machfs.File) and name != 'Icon\r':
            output['Koji the Frog'][name] = copy.deepcopy(file)
    app = output['Koji the Frog']['Koji the Frog 2.0.4']
    if app.type != b'APPL' or not app.rsrc:
        raise ValueError('Expected Koji 2.0.4 application with a resource fork')
    output['System Folder'] = machfs.Folder()
    output['System Folder']['Preferences'] = machfs.Folder()
    preferences = boot['System Folder']['Preferences']
    for name in ('Koji 2.0 Registration', 'Koji Registration'):
        if name in preferences:
            output['System Folder']['Preferences'][name] = copy.deepcopy(preferences[name])
    image = output.write(size=8*1024*1024, desktopdb=False, bootable=False)
    reread = machfs.Volume()
    reread.read(image)
    count = 0
    for folder, _, files in output.walk():
        for name in files:
            key = folder + (name,)
            before, after = output[key], reread[key]
            assert before.data == after.data and before.rsrc == after.rsrc, key
            assert before.type == after.type and before.creator == after.creator, key
            count += 1
    for path in paths:
        if digest(path.read_bytes()) != originals[path.name]:
            raise RuntimeError('Source changed during extraction; close SheepShaver and retry')
    dest.mkdir(parents=True, exist_ok=True)
    image_path = dest / 'koji.img'
    image_path.write_bytes(image)
    manifest = {
        'game': 'Koji the Frog 2.0.4', 'image': 'koji.img',
        'image_sha256': digest(image), 'image_bytes': len(image),
        'files_verified_both_forks': count, 'source_sha256': originals,
        'source_folder': str(source),
        'note': 'Private game and preferences. Do not publish or commit this directory.'
    }
    (dest/'extraction.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
    print(f'Extracted {count} files; both forks and Finder types verified. Original image hashes unchanged.')
    print(f'Private image: {image_path} ({len(image)} bytes)')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path(r'D:\SheepShaver_MAC_Emulator\Content'))
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1]/'www/private')
    args = parser.parse_args()
    extract(args.source, args.output)
