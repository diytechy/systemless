"""Select a validated local bundle for the existing Play/Stop launchers.

This changes only an ignored local pointer. Restart the owned server separately.
--original removes that pointer and returns to the retained www/dist bundle.
"""
import argparse
import json
from pathlib import Path
from private_library_manifest import BUILTINS,sha256_file
from serve_library import library_routes

ROOT=Path(__file__).resolve().parents[1]


def verify_bundle(directory):
    directory=Path(directory).resolve(strict=True)
    if not (directory/'index.html').is_file():raise ValueError('Missing bundle index')
    metadata=json.loads((directory/'private-library.json').read_text(encoding='utf-8'))
    library_routes(directory)
    if not {row[2] for row in BUILTINS}<={entry['id'] for entry in metadata['entries']}:
        raise ValueError('Selected bundle must retain the original three identities')
    wasm=list(directory.glob('*_bg.wasm'))
    if len(wasm)!=1:raise ValueError('Expected one compiled WebAssembly bundle')
    binary=wasm[0].read_bytes()
    for entry in metadata['entries']:
        if sha256_file(directory/entry['image_path'])!=entry['image_sha256']:
            raise ValueError('Changed packaged media: '+entry['id'])
        for marker in (entry['id'],entry['route'],'/'+entry['image_path']):
            if marker.encode() not in binary:raise ValueError('Missing compiled entry/route/media: '+entry['id'])
    return dict(schema_version=1,directory=str(directory),wasm_sha256=sha256_file(wasm[0]),
        metadata_sha256=sha256_file(directory/'private-library.json'),entries=len(metadata['entries']))


def select_bundle(directory,pointer):
    selection=verify_bundle(directory)
    pointer=Path(pointer);pointer.parent.mkdir(parents=True,exist_ok=True)
    pending=pointer.with_suffix('.json.tmp')
    pending.write_text(json.dumps(selection,indent=2)+'\n',encoding='utf-8')
    pending.replace(pointer)
    return selection


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--directory',type=Path);group.add_argument('--original',action='store_true')
    args=parser.parse_args();pointer=ROOT/'www/private/active-library.json'
    if args.original:
        pointer.unlink(missing_ok=True)
        print('Original www/dist selected; restart the owned server.')
    else:
        selection=select_bundle(args.directory,pointer)
        print('Selected local bundle:',selection['directory'],'entries:',selection['entries'],'; restart the owned server.')
