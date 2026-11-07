"""Copy Koji out of HFS images, preserving forks; never mount or write originals."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import machfs


def digest(data):
    return hashlib.sha256(data).hexdigest()

def folder_dates(target, source):
    for field in ('crdate','mddate','bkdate'):
        setattr(target,field,getattr(source,field))

def preserved_file(source):
    target=copy.deepcopy(source)
    target.aliastarget=None
    # machfs writes unsigned Finder coordinate words; HFS+ reads signed values.
    target.x &= 65535; target.y &= 65535
    return target

def verify_metadata(left, right):
    if set(left) != set(right):
        raise ValueError('Catalogue names changed')
    count=0
    for name,node in left.items():
        copied=right[name]
        if type(node) is not type(copied):
            raise ValueError('Catalogue kind changed')
        for field in ('data','rsrc','type','creator','flags','crdate','mddate','bkdate','x','y'):
            if not hasattr(node,field): continue
            original,actual=getattr(node,field),getattr(copied,field)
            if field in ('x','y'): original,actual=original&65535,actual&65535
            if original != actual: raise ValueError('Fork/metadata changed: '+field)
        if isinstance(node,machfs.Folder): count+=verify_metadata(node,copied)
        else: count+=1
    return count


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
    folder_dates(output['Koji the Frog'],games['Koji the Frog'])
    for name, file in games['Koji the Frog'].items():
        if isinstance(file, machfs.File) and name != 'Icon\r':
            output['Koji the Frog'][name] = preserved_file(file)
    app = output['Koji the Frog']['Koji the Frog 2.0.4']
    if app.type != b'APPL' or not app.rsrc:
        raise ValueError('Expected Koji 2.0.4 application with a resource fork')
    output['System Folder'] = machfs.Folder()
    output['System Folder']['Preferences'] = machfs.Folder()
    folder_dates(output['System Folder'],boot['System Folder'])
    folder_dates(output['System Folder']['Preferences'],boot['System Folder']['Preferences'])
    preferences = boot['System Folder']['Preferences']
    for name in ('Koji 2.0 Registration', 'Koji Registration'):
        if name in preferences:
            output['System Folder']['Preferences'][name] = preserved_file(preferences[name])
    image = output.write(size=8*1024*1024, desktopdb=False, bootable=False)
    reread = machfs.Volume()
    reread.read(image)
    count = verify_metadata(output,reread)
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
        'metadata_scope': 'Both file forks/Finder fields/raw16 coordinates/dates and represented folder dates; folder Finder info unexposed; raw aliases retained, resolution unqualified',
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
