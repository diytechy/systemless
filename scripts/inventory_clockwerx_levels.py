"""Inventory owned extracted level resources without interpreting unknown fields."""
import argparse
import hashlib
import json
import struct
from pathlib import Path


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_catalog(data):
    if len(data)<2:raise ValueError('Truncated catalog header')
    count=struct.unpack_from('>H',data)[0]
    rows=[];pos=2;seen=set()
    for ordinal in range(1,count+1):
        if pos+3>len(data):raise ValueError('Truncated catalog entry')
        resource_id,length=struct.unpack_from('>hB',data,pos);pos+=3
        if pos+length>len(data):raise ValueError('Truncated catalog name')
        name=data[pos:pos+length].decode('mac_roman');pos+=length
        if pos%2:
            if pos>=len(data) or data[pos]!=0:raise ValueError('Invalid catalog alignment')
            pos+=1
        if resource_id in seen:raise ValueError('Duplicate catalog resource')
        seen.add(resource_id);rows.append(dict(ordinal=ordinal,resourceId=resource_id,menuTitle=name))
    if pos!=len(data):raise ValueError('Unexpected catalog tail')
    return rows


def inventory(directory):
    directory=directory.resolve(strict=True)
    metadata=directory/'resources.json'
    resources=json.loads(metadata.read_text(encoding='utf-8'))
    maps={};provenance=[]
    for row in resources:
        name=row['file']
        if Path(name).name!=name or '/' in name or '\\' in name:raise ValueError('Invalid resource filename')
        path=directory/name
        if path.stat().st_size!=row['size']:raise ValueError('Resource size differs from inventory')
        item=dict(resourceId=row['id'],resourceTitle=row['name'],bytes=row['size'],sha256=sha(path),file=name)
        provenance.append(dict(type=row['type'],**item))
        if row['type']=='RND2':
            if row['id'] in maps:raise ValueError('Duplicate level resource')
            data=path.read_bytes()
            if len(data)<8:raise ValueError('Truncated level header')
            item['rawHeaderWords']=list(struct.unpack_from('>4H',data))
            maps[row['id']]=item
    catalogs=[row for row in resources if row['type']=='RNDm']
    if len(catalogs)!=1:raise ValueError('Expected one level catalog')
    catalog=directory/catalogs[0]['file'];ordered=parse_catalog(catalog.read_bytes())
    levels=[]
    for row in ordered:
        if row['resourceId'] not in maps:raise ValueError('Catalog refers to missing level')
        levels.append({**maps[row['resourceId']],**row,'status':'queued','nativeChecks':[],
                       'requirements':[],'svgStatus':'not-reviewed','generationConstraints':[]})
    listed={row['resourceId'] for row in ordered}
    unlisted=[{**item,'status':'resource-inventoried','catalogStatus':'not-listed','requirements':[]}
              for rid,item in sorted(maps.items()) if rid not in listed]
    return dict(schema='clockwerx-level-inventory-v1',sourceDirectory=str(directory),
                resourceIndexSha256=sha(metadata),catalogSha256=sha(catalog),
                catalogLevelCount=len(levels),resourceLevelCount=len(maps),unlistedCount=len(unlisted),
                levels=levels,unlisted=unlisted,resourceProvenance=provenance,
                boundary='Catalog order verified; raw header words retained without assigning unverified meanings. No gameplay or mechanics inferred from a title.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory',type=Path);parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if args.output.exists():parser.error('Use a new output; existing evidence is preserved')
    result=inventory(args.directory)
    args.output.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({key:result[key] for key in ['catalogLevelCount','resourceLevelCount','unlistedCount']}))
