"""Build a PRIVATE vector foreground from the owned pilot's extracted PNGs.

One canonical hand replaces each 64-direction bitmap animation. Alpha contours
are simplified, including transparent holes; gradients reconstruct the shading.
Dots become analytic spheres. These are vector approximations, not lossless art.
The source assets are read-only, and generated SVG/map/audio stay outside Git.
"""
import argparse
import hashlib
import json
import math
import shutil
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image


def contours(mask):
    """Trace clockwise cell boundaries, keeping holes and diagonal islands."""
    height, width = len(mask), len(mask[0])
    edges = {}
    def opaque(x, y):
        return 0 <= x < width and 0 <= y < height and mask[y][x]
    def edge(a, b):
        edges.setdefault(a, []).append(b)
    for y in range(height):
        for x in range(width):
            if not opaque(x, y):
                continue
            if not opaque(x, y - 1): edge((x, y), (x + 1, y))
            if not opaque(x + 1, y): edge((x + 1, y), (x + 1, y + 1))
            if not opaque(x, y + 1): edge((x + 1, y + 1), (x, y + 1))
            if not opaque(x - 1, y): edge((x, y + 1), (x, y))
    direction = {(1, 0): 0, (0, 1): 1, (-1, 0): 2, (0, -1): 3}
    result = []
    while edges:
        start = min(edges)
        current, previous_direction, loop = start, None, []
        while True:
            loop.append(current)
            choices = edges[current]
            if previous_direction is None:
                target = choices[0]
            else:
                def rank(target):
                    d = direction[(target[0] - current[0], target[1] - current[1])]
                    return {1: 0, 0: 1, 3: 2, 2: 3}[(d - previous_direction) % 4]
                target = min(choices, key=rank)
            choices.remove(target)
            if not choices: del edges[current]
            previous_direction = direction[(target[0] - current[0], target[1] - current[1])]
            current = target
            if current == start: break
        result.append(loop)
    return result


def distance(point, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    if not dx and not dy: return math.dist(point, a)
    t = max(0, min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy)


def simplify(points, tolerance=1):
    def rdp(line):
        if len(line) <= 2: return line
        i = max(range(1, len(line) - 1), key=lambda i: distance(line[i], line[0], line[-1]))
        if distance(line[i], line[0], line[-1]) <= tolerance: return [line[0], line[-1]]
        return rdp(line[:i + 1])[:-1] + rdp(line[i:])
    # Split a closed loop at its widest separation so endpoints are distinct.
    a = min(range(len(points)), key=lambda i: points[i])
    points = points[a:] + points[:a]
    b = max(range(1, len(points)), key=lambda i: math.dist(points[0], points[i]))
    shape = rdp(points[:b + 1])[:-1] + rdp(points[b:] + [points[0]])[:-1]
    return shape if len(shape) >= 3 else points


def color(rgb):
    return '#' + ''.join('%02x' % max(0, min(255, round(v))) for v in rgb)


def palette(image):
    pixels = [p[:3] for p in image.getdata() if p[3]]
    middle = tuple(sorted(p[c] for p in pixels)[len(pixels) // 2] for c in range(3))
    light = max(pixels, key=lambda p: sum(p))
    dark = min(pixels, key=lambda p: sum(p))
    return color(light), color(middle), color(dark)


def hand_svg(image):
    w, h = image.size
    mask = [[image.getpixel((x, y))[3] > 0 for x in range(w)] for y in range(h)]
    shapes = [simplify(loop) for loop in contours(mask)]
    path = ' '.join('M' + 'L'.join('%s %s' % p for p in loop) + 'Z' for loop in shapes)
    light, mid, dark = palette(image)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w + 2}" height="{h + 2}" viewBox="-1 -1 {w + 2} {h + 2}">'
            f'<defs><linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{light}"/>'
            f'<stop offset=".42" stop-color="{mid}"/><stop offset=".65" stop-color="{light}"/>'
            f'<stop offset="1" stop-color="{dark}"/></linearGradient></defs>'
            f'<path d="{escape(path)}" fill="url(#metal)" fill-rule="evenodd"/></svg>')


def dot_svg(image):
    light, mid, dark = palette(image)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">'
            f'<defs><radialGradient id="ball" cx=".3" cy=".25" r=".75"><stop stop-color="#fff"/>'
            f'<stop offset=".24" stop-color="{light}"/><stop offset=".62" stop-color="{mid}"/>'
            f'<stop offset="1" stop-color="{dark}"/></radialGradient></defs>'
            '<circle cx="5" cy="5" r="4.65" fill="url(#ball)" stroke="#30363a" stroke-width=".7"/></svg>')


def build(source, output):
    source, output = source.resolve(strict=True), output.resolve()
    if output == source or source in output.parents or output in source.parents:
        raise ValueError('Use a separate private output directory')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Refuse to overwrite an existing asset set; choose a new directory')
    old = json.loads((source / 'manifest.json').read_text(encoding='utf-8'))
    verified = set()
    for row in old['files']:
        if Path(row['name']).name != row['name'] or '/' in row['name'] or '\\' in row['name']:
            raise ValueError('Invalid source asset filename')
        if hashlib.sha256((source / row['name']).read_bytes()).hexdigest() != row['sha256']:
            raise ValueError('Changed source asset: ' + row['name'])
        verified.add(row['name'])
    references = {old['backdrop'], *old['sounds'].values()}
    for group in old['groups'].values(): references.update(group['images'])
    if not references <= verified:
        raise ValueError('Source manifest references unverified assets')
    output.mkdir(parents=True, exist_ok=True)
    vector = {'hands': {}, 'dots': []}
    for gid in ['500', '4400', '4500', '700', '4300']:
        group = old['groups'][gid]
        frame = group['frames'][0]
        image = Image.open(source / group['images'][frame['image']]).convert('RGBA')
        if frame['flipY']: raise ValueError('Expected unflipped canonical angle0')
        name = 'hand-' + gid + '.svg'
        (output / name).write_text(hand_svg(image), encoding='utf-8')
        vector['hands'][gid] = dict(file=name, x=frame['x'] - 1, y=frame['y'] - 1,
                                    width=image.width + 2, height=image.height + 2)
    for i in range(6):
        image = Image.open(source / old['groups']['300']['images'][i]).convert('RGBA')
        name = 'dot-' + str(i) + '.svg'
        (output / name).write_text(dot_svg(image), encoding='utf-8')
        vector['dots'].append(name)
    for name in {old['backdrop'], *old['sounds'].values()}:
        shutil.copy2(source / name, output / name)
    manifest = dict(fixtureSha256=old['fixtureSha256'], logicalSize=old['logicalSize'],
                    groups={}, vectorAssets=vector, backdrop=old['backdrop'],
                    board=old['board'], sounds=old['sounds'], files=[],
                    presentation='SVG canonical hands with continuous rotation; analytic sphere dots; original bitmap backdrop; shading/outline approximated')
    for f in sorted(output.iterdir()):
        manifest['files'].append(dict(name=f.name, bytes=f.stat().st_size, sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
    (output / 'manifest.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n', encoding='utf-8')
    return dict(files=len(manifest['files']), svg_files=11,
                asset_bytes=sum(f['bytes'] for f in manifest['files']), manifest_bytes=(output / 'manifest.json').stat().st_size)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    print(json.dumps(build(args.source, args.output)))
