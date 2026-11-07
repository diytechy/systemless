"""Read-only Macintosh application inventory. Requires the extraction machfs env.

Emits names, architecture evidence and hashes, never fork or preference contents.
An architecture is a candidate, not a compatibility claim. Source images are
hashed again after reading; no images are mounted or opened for writing.
"""
import argparse
import hashlib
import json
import struct
from collections import Counter
from pathlib import Path

import machfs
import macresources
from hfsplus_read import HfsPlusReader


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def applications(raw):
    # Apple partition map images (including the configured Toast disc).
    if raw[512:514] == b'PM':
        count = struct.unpack_from('>I', raw, 516)[0]
        for i in range(min(count, 256)):
            row = raw[(i + 1) * 512:(i + 2) * 512]
            if row[48:80].rstrip(b'\0') == b'Apple_HFS':
                start, blocks = struct.unpack_from('>II', row, 8)
                if (start + blocks) * 512 > len(raw):
                    raise ValueError('Apple_HFS partition extends past image; requires independent reader')
                yield from applications(raw[start * 512:(start + blocks) * 512])
                return
        raise ValueError('No complete Apple_HFS partition')
    if raw[1024:1026] in (b'H+', b'HX') or raw[1148:1150] == b'H+':
        reader = HfsPlusReader(raw)
        for cnid, (_, _, kind, record) in reader.records.items():
            if kind == 2 and record[48:52] == b'APPL':
                yield reader.path(cnid), record[52:56], reader.read_fork(record[88:168]), reader.read_fork(record[168:248])
        return
    volume = machfs.Volume()
    volume.read(raw)
    for folder, _, files in volume.walk():
        for name in files:
            file = volume[folder + (name,)]
            if file.type == b'APPL':
                yield '/'.join(folder + (name,)), file.creator, file.data, file.rsrc


def describe(path, creator, data, rsrc):
    result = {'path': path, 'creator': creator.decode('mac_roman'),
              'data_bytes': len(data), 'resource_bytes': len(rsrc),
              'data_sha256': hashlib.sha256(data).hexdigest(),
              'resource_sha256': hashlib.sha256(rsrc).hexdigest()}
    try:
        resources = list(macresources.parse_file(rsrc)) if rsrc else []
        types = sorted({r.type.decode('mac_roman') for r in resources})
        has_code = any(r.type == b'CODE' for r in resources)
        fragments = [r for r in resources if r.type == b'cfrg']
        ppc = any(b'pwpc' in r for r in fragments) or data[:12] == b'Joy!peffpwpc'
        result['architecture'] = 'fat (CODE + PPC fragment)' if has_code and ppc else '68K (CODE)' if has_code else 'PPC fragment' if ppc else 'unknown'
        result['resource_types'] = types
        result['version_strings'] = []
        for resource in resources:
            if resource.type == b'vers' and len(resource) > 6:
                length = resource[6]
                result['version_strings'].append(bytes(resource[7:7 + length]).decode('mac_roman'))
        sizes = [r for r in resources if r.type == b'SIZE' and len(r) >= 10]
        result['preferred_partition_bytes'] = [struct.unpack_from('>I', r, 2)[0] for r in sizes]
    except Exception as exc:
        result['architecture'] = 'unknown'
        result['resource_error'] = str(exc)
    return result


def container_inventory(raw):
    """Name-only coverage audit for compressed/media candidates, no contents."""
    rows, top_folders, non_appl = [], [], []
    if raw[1024:1026] in (b'H+', b'HX') or raw[1148:1150] == b'H+':
        reader = HfsPlusReader(raw)
        for cnid, (parent, name, kind, record) in reader.records.items():
            if kind == 1 and parent == 2:
                top_folders.append(name)
            elif kind == 2:
                rows.append((reader.path(cnid), record[48:52], struct.unpack_from('>Q', record, 88)[0]))
                if record[48:52].lower() == b'dfil':
                    non_appl.append(dict(describe(reader.path(cnid), record[52:56], reader.read_fork(record[88:168]), reader.read_fork(record[168:248])), finder_type=record[48:52].decode('mac_roman'), program_kind='desk accessory candidate'))
        format_name = 'HFS+'
    else:
        volume = machfs.Volume(); volume.read(raw)
        top_folders = [name for name, node in volume.items() if isinstance(node, machfs.Folder)]
        for folder, _, names in volume.walk():
            for name in names:
                file = volume[folder + (name,)]
                rows.append(('/'.join(folder + (name,)), file.type, len(file.data)))
                if file.type.lower() == b'dfil':
                    non_appl.append(dict(describe('/'.join(folder + (name,)), file.creator, file.data, file.rsrc), finder_type=file.type.decode('mac_roman'), program_kind='desk accessory candidate'))
        format_name = 'HFS'
    extensions = ('.sit', '.sitx', '.hqx', '.zip', '.sea', '.img', '.dsk', '.dmg', '.toast', '.gz', '.tar', '.bin')
    candidates = [{'path': path, 'finder_type': kind.decode('mac_roman'), 'data_bytes': size}
                  for path, kind, size in rows if path.lower().endswith(extensions) or kind.startswith(b'SIT')]
    type_counts = Counter(kind.decode('mac_roman') for _, kind, _ in rows)
    return {'format': format_name, 'file_count': len(rows), 'top_level_folders': sorted(top_folders),
            'finder_type_counts': [{'finder_type': key, 'count': count} for key, count in sorted(type_counts.items())],
            'container_candidates': candidates,
            'non_appl_program_candidates': non_appl,
            'container_method': 'Name suffix or SIT Finder-type heuristic; not proof that each container is a game. Unrecognized types remain in type counts.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--installation', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    installation = args.installation.resolve(strict=True)
    configured = []
    for line in (installation / 'SheepShaver_prefs').read_text().splitlines():
        if line.startswith('disk '):
            configured.append((installation / line[5:]).resolve())
    paths = list(dict.fromkeys(configured + sorted((installation / 'Content').glob('00[1-8]'))))
    report = {'schema': 1, 'method': 'Read-only catalogue, APPL Finder type, CODE/cfrg resource evidence; no launch claim.', 'volumes': []}
    for path in paths:
        before = digest(path)
        row = {'source': str(path.relative_to(installation)), 'configured': path in configured,
               'bytes': path.stat().st_size, 'sha256_before': before}
        try:
            raw = path.read_bytes()
            row['applications'] = [describe(*app) for app in applications(raw)]
            row.update(container_inventory(raw))
        except Exception as exc:
            row['catalogue_error'] = str(exc)
        row['sha256_after'] = digest(path)
        row['unchanged'] = before == row['sha256_after']
        if not row['unchanged']:
            raise RuntimeError('Source changed: ' + str(path))
        report['volumes'].append(row)
        print(row['source'], len(row.get('applications', [])), row.get('catalogue_error', ''), flush=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
