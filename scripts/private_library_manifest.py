"""Validate explicitly reviewed additions to the opt-in private game library.

The manifest contains metadata and paths to already preserved private fixtures,
never game bytes or preference contents. It cannot change pacing or replace the
three existing game identities. Compilation and packaging consume the same file.
"""
import hashlib
import json
import re
from pathlib import Path

BUILTINS = (
    ('koji', 'koji-the-frog', 'koji-personal-204'),
    ('clockwerx', 'clockwerx', 'clockwerx-personal-10'),
    ('delirium', 'delirium', 'delirium-personal-11'),
)
RESERVED_SLUGS = {part for image, route, _ in BUILTINS for part in (image, route)} | {
    'private', 'clockwerx-html5', '_macgames',
}
CATEGORIES = {'Arcade', 'Art', 'FPS', 'Puzzle', 'Role-Playing', 'Simulation',
              'Space Trading', 'Strategy'}
REQUIRED = {'slug', 'id', 'title', 'summary', 'image_path', 'image_sha256',
            'architecture', 'executable_path', 'screen_size', 'screen_depth'}
OPTIONAL = {'developer', 'year', 'category', 'notes_html',
            'application_partition_size', 'file_mappings', 'key_mappings'}
TOKEN = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')


def sha256_file(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def _text(value, label):
    if not isinstance(value, str) or not value.strip() or '\x00' in value:
        raise ValueError('Expected nonempty text: ' + label)
    return value


def _vfs_path(value, label):
    _text(value, label)
    if value.startswith('/') or '\\' in value or ':' in value or any(
            part in ('', '.', '..') for part in value.split('/')):
        raise ValueError('Expected relative guest path: ' + label)
    return value


def validate_manifest(document, verify_assets=True):
    if not isinstance(document, dict) or set(document) != {'schema_version', 'entries'}:
        raise ValueError('Expected manifest schema_version and entries only')
    if type(document['schema_version']) is not int or document['schema_version'] != 1:
        raise ValueError('Unsupported private additions schema')
    if not isinstance(document['entries'], list):
        raise ValueError('entries must be a list')
    ids = {row[2] for row in BUILTINS}
    slugs = set(RESERVED_SLUGS)
    entries = []
    for original in document['entries']:
        if not isinstance(original, dict) or not REQUIRED <= set(original) or set(original) - REQUIRED - OPTIONAL:
            raise ValueError('Missing or unknown private entry fields')
        row = dict(original)
        for field in ('id', 'slug'):
            if not isinstance(row[field], str) or not TOKEN.fullmatch(row[field]):
                raise ValueError('Invalid entry ' + field)
        if row['id'] in ids or row['slug'] in slugs:
            raise ValueError('Duplicate or reserved game identity/route')
        ids.add(row['id']); slugs.add(row['slug'])
        for field in ('title', 'summary'):
            _text(row[field], field)
        if row['architecture'] not in ('68k', 'ppc'):
            raise ValueError('Unknown selected architecture')
        _vfs_path(row['executable_path'], 'executable_path')
        size = row['screen_size']
        if not isinstance(size, list) or len(size) != 2 or any(
                type(value) is not int or not 128 <= value <= 4096 for value in size):
            raise ValueError('Invalid logical screen dimensions')
        if type(row['screen_depth']) is not int or row['screen_depth'] not in (1, 2, 4, 8, 16, 32):
            raise ValueError('Unsupported screen depth')
        partition = row.get('application_partition_size')
        if partition is not None and (type(partition) is not int or not 131072 <= partition <= 0xffffffff):
            raise ValueError('Invalid explicit partition override; omit to preserve SIZE')
        year = row.get('year')
        if year is not None and (type(year) is not int or not 1970 <= year <= 2100):
            raise ValueError('Invalid known publication year; omit when unknown')
        row.setdefault('developer', 'Unknown')
        _text(row['developer'], 'developer')
        row.setdefault('category', 'Arcade')
        if row['category'] not in CATEGORIES:
            raise ValueError('Unknown category')
        row.setdefault('notes_html', '')
        if not isinstance(row['notes_html'], str):
            raise ValueError('notes_html must be text')
        for field in ('file_mappings', 'key_mappings'):
            mapping = row.setdefault(field, {})
            if not isinstance(mapping, dict):
                raise ValueError(field + ' must be an object')
            for source, target in mapping.items():
                if field == 'file_mappings':
                    _vfs_path(source, field); _vfs_path(target, field)
                else:
                    _text(source, field); _text(target, field)
        path = Path(_text(row['image_path'], 'image_path'))
        if not path.is_absolute() or path.suffix.lower() not in ('.img', '.hfv', '.dsk', '.kpk'):
            raise ValueError('Expected absolute reviewed HFS/KPK fixture path')
        expected = row['image_sha256']
        if not isinstance(expected, str) or not re.fullmatch(r'[0-9a-f]{64}', expected):
            raise ValueError('Expected reviewed lowercase image SHA256')
        if verify_assets and (not path.is_file() or sha256_file(path) != expected):
            raise ValueError('Missing or changed reviewed fixture: ' + row['slug'])
        row['packaged_path'] = 'private/' + row['slug'] + ('.kpk' if path.suffix.lower() == '.kpk' else '.img')
        entries.append(row)
    return entries


def load_manifest(path, verify_assets=True):
    return validate_manifest(json.loads(Path(path).read_text(encoding='utf-8-sig')),
                             verify_assets=verify_assets)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--normalized', action='store_true', help='Emit validated metadata for the private build script')
    args = parser.parse_args()
    rows = load_manifest(args.manifest)
    if args.normalized:
        print(json.dumps(rows, ensure_ascii=True))
    else:
        print('Verified private additions:', len(rows))
