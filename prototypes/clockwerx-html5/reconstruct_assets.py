"""Generate private symmetric SVGs from an external design profile.

Profiles contain artwork. This generic helper reflects explicit upper-half
Bezier paths around y=0, with unchanged logical pivot-relative coordinates.
"""
import argparse
import copy
import hashlib
import json
import math
import shutil
from pathlib import Path


def validated_segments(half):
    if not half or half[0][0] != 'M' or len(half[0]) != 3:
        raise ValueError('Half-path must start with M x y')
    current = tuple(half[0][1:])
    if current[1] != 0:
        raise ValueError('Half-path starts off symmetry axis')
    result = []
    for command in half[1:]:
        op = command[0]
        if op not in {'L', 'Q', 'C'} or len(command) != {'L': 3, 'Q': 5, 'C': 7}[op]:
            raise ValueError('Only explicit L/Q/C segments are supported')
        points = [tuple(command[i:i+2]) for i in range(1, len(command), 2)]
        result.append((op, current, points))
        current = points[-1]
    coordinates = [tuple(half[0][1:])] + [p for _, _, points in result for p in points]
    if not result or current[1] != 0:
        raise ValueError('Half-path ends off symmetry axis')
    if any(not isinstance(v, (int, float)) or not math.isfinite(v) for p in coordinates for v in p):
        raise ValueError('Coordinates must be finite numbers')
    if any(p[1] > 0 for p in coordinates):
        raise ValueError('Half-path control points must be on/above axis')
    return result


def mirrored_path(half):
    segments = validated_segments(half)
    commands = [list(c) for c in half]
    for op, start, points in reversed(segments):
        reflected = [(x, -y) for x, y in list(reversed(points[:-1])) + [start]]
        commands.append([op] + [v for p in reflected for v in p])
    return ' '.join(str(c[0]) + ' '.join(format(float(v), '.12g') for v in c[1:]) for c in commands) + ' Z'


def geometry_bounds(shapes):
    points = []
    for shape in shapes:
        for half in [shape['outer']] + shape.get('holes', []):
            validated_segments(half)
            points.append(tuple(half[0][1:]))
            points.extend(tuple(c[i:i+2]) for c in half[1:] for i in range(1, len(c), 2))
    return [min(x for x,y in points), -max(abs(y) for x,y in points),
            max(x for x,y in points), max(abs(y) for x,y in points)]


def svg(shapes, colors, descriptor):
    bounds = geometry_bounds(shapes)
    x,y,w,h = (descriptor[k] for k in ['x','y','width','height'])
    if bounds[0] < x or bounds[1] < y or bounds[2] > x+w or bounds[3] > y+h:
        raise ValueError('Geometry/control hull exceeds unchanged asset viewport')
    if len(colors) != 4 or any(len(c) != 7 or c[0] != '#' or any(v not in '0123456789abcdefABCDEF' for v in c[1:]) for c in colors):
        raise ValueError('Expected four hex gradient colors')
    stops = ''.join('<stop offset="%s" stop-color="%s"/>' % (offset,color)
                    for offset,color in zip(['0','.34','.55','1'],colors))
    paths = ''.join('<path d="%s" fill-rule="evenodd"/>' % ' '.join(
        mirrored_path(half) for half in [shape['outer']] + shape.get('holes',[])) for shape in shapes)
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="%s %s %s %s">' % (w,h,x,y,w,h)
            + '<defs><linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">' + stops
            + '</linearGradient></defs><g fill="url(#metal)">' + paths + '</g></svg>\n')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def filename(value):
    if not isinstance(value,str) or not value or Path(value).name != value or '/' in value or '\\' in value or value in {'.','..'}:
        raise ValueError('Expected a plain asset filename')
    return value


def build(source, profile_path, output):
    source, profile_path, output = source.resolve(strict=True), profile_path.resolve(strict=True), output.resolve()
    repository = Path(__file__).resolve().parents[2]
    if output == repository or repository in output.parents or profile_path == repository or repository in profile_path.parents:
        raise ValueError('Artwork/profile must stay outside the repository')
    if output == source or source in output.parents or output in source.parents:
        raise ValueError('Use a separate output directory')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output is not empty; choose a new private directory')
    manifest = json.loads((source/'manifest.json').read_text(encoding='utf-8'))
    profile = json.loads(profile_path.read_text(encoding='utf-8'))
    verified = set()
    for row in manifest['files']:
        name = filename(row['name'])
        if digest(source/name) != row['sha256']:
            raise ValueError('Source hash mismatch: ' + name)
        verified.add(name)
    for row in profile.get('references',[]):
        if digest(Path(row['path'])) != row['sha256']:
            raise ValueError('Reference hash mismatch: ' + row['path'])
    references = {manifest['backdrop'], *manifest['sounds'].values(), *manifest['vectorAssets']['dots']}
    references.update(d['file'] for d in manifest['vectorAssets']['hands'].values())
    if manifest['vectorAssets'].get('goal'):
        references.add(manifest['vectorAssets']['goal']['file'])
    if manifest['vectorAssets'].get('starbursts'):
        references.add(manifest['vectorAssets']['starbursts']['file'])
    references.update(d['file'] for d in manifest['vectorAssets'].get('dotVariants',{}).values())
    references.update(d['file'] for d in manifest['vectorAssets'].get('spikes',{}).get('frames',[]))
    references.update(d['file'] for d in manifest['vectorAssets'].get('walls',{}).get('frames',[]))
    death=manifest['vectorAssets'].get('death',{})
    if death.get('file'):references.add(death['file'])
    else:references.update(d['file'] for d in death.get('frames',[]))
    if manifest.get('levelDefinition'):references.add(manifest['levelDefinition']['outlinesFile'])
    for scene in manifest.get('scenes',[]):
        if scene.get('levelDefinition'):references.add(scene['levelDefinition']['outlinesFile'])
    if not references <= verified:
        raise ValueError('Unverified asset reference')
    hands = manifest['vectorAssets']['hands']
    if set(hands) != set(profile['hands']):
        raise ValueError('Profile must cover precisely the existing hand set')
    generated, checks = {}, {}
    for key, descriptor in hands.items():
        hand = profile['hands'][key]
        shapes = profile['geometries'][hand['geometry']]
        bounds = geometry_bounds(shapes)
        if [bounds[0],bounds[2]] != hand['longitudinalBounds']:
            raise ValueError('Longitudinal reach differs from profile contract')
        generated[filename(descriptor['file'])] = svg(shapes, hand['colors'], descriptor)
        checks[key] = dict(controlHull=bounds, symmetric=True, symmetryAxis='y=0',
                           method='exact reflected reverse Bezier control points',
                           shapeCount=len(shapes), holeCount=sum(len(s.get('holes',[])) for s in shapes))
    output.mkdir(parents=True,exist_ok=True)
    for name in sorted(references - set(generated)):
        shutil.copy2(source/name,output/name)
    for name, data in generated.items():
        (output/name).write_text(data,encoding='utf-8')
    result = copy.deepcopy(manifest)
    result['presentation'] = 'Manually reconstructed symmetric SVG geometry from multiple private bitmap views; approximate directional metallic shading'
    result['files'] = [dict(name=p.name,bytes=p.stat().st_size,sha256=digest(p)) for p in sorted(output.iterdir())]
    (output/'manifest.json').write_text(json.dumps(result,separators=(',',':'))+'\n',encoding='utf-8')
    return dict(profileSha256=digest(profile_path), sourceManifestSha256=digest(source/'manifest.json'),
                manifestSha256=digest(output/'manifest.json'), handChecks=checks,
                assetBytes=sum(r['bytes'] for r in result['files']), manifestBytes=(output/'manifest.json').stat().st_size,
                svgBytes=sum((output/n).stat().st_size for n in generated), files=len(result['files']))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',required=True,type=Path)
    parser.add_argument('--profile',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    args = parser.parse_args()
    print(json.dumps(build(args.source,args.profile,args.output),indent=2))
