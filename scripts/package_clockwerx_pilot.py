"""Add the separately implemented ClockWerx pilot to an owned local bundle.

Generated artwork, sounds and board data stay in the private bundle. This never
publishes, starts a browser, changes emulator identities or deletes old files.
"""
import argparse
import json
import re
import shutil
from pathlib import Path
from private_library_manifest import BUILTINS, sha256_file

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'prototypes/clockwerx-html5'
CODE=('index.html','app.mjs','engine.mjs','board.mjs','rendering.mjs','sparkles.mjs','dots.mjs')
PILOT_ID='clockwerx-html5-pilot-v1'


def filename(value):
    if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9_.-]+',value) or value in ('.','..'):
        raise ValueError('Invalid private asset filename')
    return value


def package(dist,assets):
    dist=Path(dist).resolve(strict=True);assets=Path(assets).resolve(strict=True)
    metadata_path=dist/'private-library.json'
    metadata=json.loads(metadata_path.read_text(encoding='utf-8'))
    if metadata.get('schema_version')!=1 or not {x[2] for x in BUILTINS}<={x['id'] for x in metadata['entries']}:
        raise ValueError('Expected a preserved private library bundle')
    manifest_path=assets/'manifest.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest.get('logicalSize')!=[640,480]:raise ValueError('Unexpected prototype logical dimensions')
    files={}
    for row in manifest['files']:
        name=filename(row['name'])
        if name in files or not (assets/name).is_file() or sha256_file(assets/name)!=row['sha256']:
            raise ValueError('Missing, duplicate or changed private asset: '+name)
        files[name]=row
    references={manifest['backdrop'],*manifest['sounds'].values()}
    for group in manifest['groups'].values():references.update(group['images'])
    if manifest.get('vectorAssets'):
        vector=manifest['vectorAssets']
        references.update(vector['dots'])
        references.update(hand['file'] for hand in vector['hands'].values())
        if vector.get('goal'):references.add(vector['goal']['file'])
        if vector.get('starbursts'):references.add(vector['starbursts']['file'])
        references.update(dot['file'] for dot in vector.get('dotVariants',{}).values())
    for name in references:filename(name)
    if not references<=files.keys():raise ValueError('Manifest references an unverified asset')
    for name in CODE:
        if not (SOURCE/name).is_file():raise ValueError('Missing pilot source: '+name)
    target=dist/'clockwerx-html5'
    if target.resolve().parent!=dist:raise ValueError('Pilot route escapes selected bundle')
    if target.exists() and any(target.iterdir()) and not (target/'private-pilot.json').is_file():
        raise ValueError('Existing route has no owned pilot marker')
    target.mkdir(exist_ok=True)
    output_assets=target/'assets'
    if output_assets.resolve().parent!=target.resolve():raise ValueError('Asset path escapes pilot route')
    output_assets.mkdir(exist_ok=True)
    record=dict(schema_version=1,id=PILOT_ID,source_files={},assets_manifest_sha256=sha256_file(manifest_path),
        asset_count=len(files),asset_bytes=sum((assets/name).stat().st_size for name in files),
        logical_size=[640,480],scope='One reconstructed Movement board; separate engine and storage; original save compatibility omitted',
        presentation='svg-continuous' if manifest.get('vectorAssets') else 'bitmap-64-directions')
    # Mark ownership before copying, so a partial interrupted copy is resumable.
    (target/'private-pilot.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
    for name in CODE:
        shutil.copy2(SOURCE/name,target/name);record['source_files'][name]=sha256_file(target/name)
    for name,row in files.items():
        shutil.copy2(assets/name,output_assets/name)
        if sha256_file(output_assets/name)!=row['sha256']:raise ValueError('Copied asset changed: '+name)
    shutil.copy2(manifest_path,output_assets/'manifest.json')
    (target/'private-pilot.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
    experiments=[x for x in metadata.get('experiments',[]) if x['id']!=PILOT_ID]
    experiments.append(dict(id=PILOT_ID,route='/clockwerx-html5/',title='ClockWerx HTML5 pilot'))
    metadata['experiments']=experiments
    metadata_path.write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
    index=dist/'index.html';html=index.read_text(encoding='utf-8')
    html=re.sub(r'<!-- private-library-pilot -->.*?<!-- /private-library-pilot -->','',html,flags=re.S)
    link='<!-- private-library-pilot --><nav aria-label="Private experiments" style="padding:16px;text-align:center"><a href="/clockwerx-html5/">ClockWerx HTML5 pilot</a></nav><!-- /private-library-pilot -->'
    index.write_text(html.replace('</body>',link+'</body>'),encoding='utf-8')
    return record


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist',required=True,type=Path);parser.add_argument('--assets',required=True,type=Path)
    args=parser.parse_args();record=package(args.dist,args.assets)
    print('Private ClockWerx pilot packaged:',record['asset_count'],'assets,',record['asset_bytes'],'bytes')
