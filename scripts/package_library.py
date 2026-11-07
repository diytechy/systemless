"""Package an opt-in private library after Trunk completes; never publish it."""
import argparse
import json
import re
import shutil
from pathlib import Path
from private_library_manifest import BUILTINS, load_manifest, sha256_file

ROOT=Path(__file__).resolve().parents[1]
GAMES=('koji','clockwerx','delirium')

def package(dist, additions=None, media_directory=None):
    dist=dist.resolve(strict=True)
    media_directory = Path(media_directory or ROOT/'www/private').resolve(strict=True)
    rows = load_manifest(additions) if additions else []
    index=dist/'index.html'
    html=index.read_text(encoding='utf-8')
    wasm=list(dist.glob('*_bg.wasm'))
    if len(wasm)!=1:
        raise ValueError('Expected one Trunk WebAssembly bundle')
    binary=wasm[0].read_bytes()
    entries = [dict(id=identity, route='/'+route+'/', image_path='private/'+slug+'.img',
                    image_sha256=sha256_file(media_directory/(slug+'.img')),
                    source=media_directory/(slug+'.img')) for slug, route, identity in BUILTINS]
    entries += [dict(id=row['id'], route='/'+row['slug']+'/', image_path=row['packaged_path'],
                     image_sha256=row['image_sha256'], source=Path(row['image_path'])) for row in rows]
    for entry in entries:
        for marker in (entry['id'],entry['route'],'/'+entry['image_path']):
            if marker.encode() not in binary:
                raise ValueError('Build is missing private library entry/route/media '+entry['id'])
    private=dist/'private';private.mkdir(exist_ok=True)
    for entry in entries:
        target = dist/entry['image_path']
        if entry['source'].resolve() != target.resolve():
            shutil.copy2(entry['source'], target)
        if sha256_file(target) != entry['image_sha256']:
            raise ValueError('Packaged media hash changed: '+entry['id'])
    # Server/launcher consume these exact packaged routes, without source paths.
    public_entries = [{key: value for key, value in entry.items() if key != 'source'} for entry in entries]
    (dist/'private-library.json').write_text(json.dumps({'schema_version':1, 'entries':public_entries}, indent=2)+'\n', encoding='utf-8')
    for game in GAMES:
        preview=media_directory/f'{game}-preview.png'
        if preview.is_file(): shutil.copy2(preview,private/preview.name)
    shutil.copy2(ROOT/'scripts/game-controls.mjs',dist/'game-controls.mjs')
    shutil.copy2(ROOT/'scripts/runtime-profiler.js',dist/'runtime-profiler.js')
    shutil.copy2(ROOT/'www/src/emulator-worker.js',dist/'emulator-worker.js')
    title='<title>Macintosh Arcade</title><meta name="robots" content="noindex,nofollow">'
    html=re.sub(r'<!-- systemless-seo -->.*?<!-- /systemless-seo -->',title,html,flags=re.S)
    html=re.sub(r'<!-- systemless-fallback -->.*?<!-- /systemless-fallback -->','<p>Loading your Macintosh games…</p>',html,flags=re.S)
    html=re.sub(r'<link rel="preconnect"[^>]*>', '', html)
    html=html.replace('document.title = "Systemless";', 'document.title = "Macintosh Arcade";')
    html=re.sub(r'<!-- private-library -->.*?<!-- /private-library -->','',html,flags=re.S)
    css='''
.koji-toolbar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0}
.koji-toolbar button,.koji-toolbar select,.koji-toolbar a{font:inherit;padding:7px 12px}
.koji-toolbar span{font-size:13px;opacity:.8}
.koji-exit-fullscreen{display:none}
.game-canvas-wrap:fullscreen .koji-exit-fullscreen{display:block;position:absolute;top:12px;right:12px;z-index:100;padding:9px 14px;font:16px sans-serif}
.game-canvas-wrap:fullscreen{display:flex;align-items:center;justify-content:center;background:#111}
.game-canvas-wrap:fullscreen canvas{width:min(100vw,calc(100vh * 4 / 3))!important;height:auto!important;max-width:100vw;max-height:100vh;object-fit:contain}
.game-download,.cli-hint,.library-filters,.game-wiki__actions,.game-wiki__hint,.github-link,[id$="-tab-issues"]{display:none!important}
.library-hero{padding-bottom:24px}.library-hero__copy h1{max-width:900px}
'''
    html=html.replace('</head>',f'<!-- private-library --><script type="module" src="/game-controls.mjs"></script><style>{css}</style><!-- /private-library --></head>')
    html=html.replace('<script src="/runtime-profiler.js"></script>','')
    html=html.replace('<head>','<head><script src="/runtime-profiler.js"></script>')
    index.write_text(html,encoding='utf-8')
    (dist/'service-worker.js').write_text("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));\n",encoding='utf-8')
    (dist/'manifest.webmanifest').write_text(json.dumps({'name':'Macintosh Arcade','short_name':'Mac Games','start_url':'/','scope':'/','display':'standalone','theme_color':'#111111','background_color':'#111111'}),encoding='utf-8')
    shutil.copy2(ROOT/'LICENSE',dist/'LICENSE-systemless.txt')
    print('Private browser library ready:',dist,'entries:',len(entries))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('dist',type=Path)
    parser.add_argument('--additions',type=Path)
    parser.add_argument('--media-directory',type=Path)
    args=parser.parse_args()
    package(args.dist,args.additions,args.media_directory)
