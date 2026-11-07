"""Copy explicit classic-HFS paths read-only, preserving file forks/metadata.

Requires machfs. Private images/manifests belong outside the repository.
Folder dates exposed by machfs are retained. Its reader/writer does not expose
original folder Finder information, so this is not a complete volume clone.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import machfs

FIELDS = ('data', 'rsrc', 'type', 'creator', 'flags', 'crdate', 'mddate', 'bkdate', 'x', 'y')

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def parts(value):
    result = tuple(value.split('/'))
    if any(not x or x in ('.', '..') or ':' in x or len(x.encode('mac_roman')) > 31 for x in result):
        raise ValueError('Unsupported HFS path: ' + value)
    return result

def verify(left, right):
    if set(left) != set(right):
        raise ValueError('Catalogue names changed')
    count = 0
    for name in left:
        a, b = left[name], right[name]
        if type(a) is not type(b):
            raise ValueError('Catalogue kind changed')
        for field in FIELDS:
            if hasattr(a, field) and getattr(a, field) != getattr(b, field):
                raise ValueError('Preservation failure: ' + field)
        if isinstance(a, machfs.Folder):
            count += verify(a, b)
        else:
            count += 1
    return count

def copy_selected(source, selections):
    target = machfs.Volume(); target.name = 'Owned Game'
    for value in selections:
        path = parts(value)
        node = source[path]
        # Validate all descendants before machfs can encode/truncate a name.
        def validate(item):
            if isinstance(item, machfs.Folder):
                for name, child in item.items():
                    if '/' in name:
                        raise ValueError('Unsupported slash in catalogue name')
                    parts(name); validate(child)
        validate(node)
        parent = target
        for index, name in enumerate(path[:-1]):
            if name not in parent:
                parent[name] = copy.deepcopy(source[path[:index + 1]])
                parent[name].clear()
            parent = parent[name]
        if path[-1] in parent:
            raise ValueError('Overlapping selections')
        selected = copy.deepcopy(node)
        # machfs resolves raw aliases on read and rewrites them on write. Keep
        # their original forks/metadata instead; copied aliases can still refer
        # to the original volume and are not promised to resolve in this image.
        def preserve_alias_bytes(item):
            if isinstance(item, machfs.Folder):
                for child in item.values():
                    preserve_alias_bytes(child)
            elif isinstance(item, machfs.File):
                item.aliastarget = None
        preserve_alias_bytes(selected)
        parent[path[-1]] = selected
    return target

def extract(source, output, selections, size, original_root=None):
    source = source.resolve(strict=True); output = output.resolve()
    original_root = (original_root or source.parent).resolve(strict=True)
    if source != original_root and original_root not in source.parents:
        raise ValueError("Source must be within original root")
    if output == original_root or original_root in output.parents:
        raise ValueError('Output must be outside the original media directory')
    if output.exists():
        raise ValueError('Refusing to overwrite output')
    raw = source.read_bytes()
    if raw[1024:1026] != b'BD' or raw[1148:1150] == b'H+':
        raise ValueError('Only classic HFS supported; use checked HFS+ reader separately')
    volume = machfs.Volume(); volume.read(raw)
    target = copy_selected(volume, selections)
    result = target.write(size=size, desktopdb=False, bootable=False)
    check = machfs.Volume(); check.read(result)
    count = verify(target, check)
    if sha(source.read_bytes()) != sha(raw):
        raise ValueError('Source changed during extraction')
    output.parent.mkdir(parents=True, exist_ok=True); output.write_bytes(result)
    reopened = machfs.Volume(); reopened.read(output.read_bytes()); verify(target, reopened)
    return {'source_sha256':sha(raw), 'image_sha256':sha(result), 'files_verified':count,
            'metadata_scope':'File forks/Finder fields and represented folder dates; original folder Finder information not exposed by machfs',
            'selected_paths':selections, 'image_bytes':len(result)}

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', type=Path, required=True); p.add_argument('--output', type=Path, required=True)
    p.add_argument('--original-root', type=Path, required=True)
    p.add_argument('--select', action='append', required=True); p.add_argument('--size', type=int, default=8388608)
    a = p.parse_args(); print(json.dumps(extract(a.source, a.output, a.select, a.size, a.original_root), indent=2))
