"""Package an opt-in private library after Trunk completes; never publish it."""
import argparse
import json
import re
import shutil
from pathlib import Path
from private_library_manifest import BUILTINS, load_manifest, sha256_file

ROOT=Path(__file__).resolve().parents[1]
GAMES=('koji','clockwerx','delirium')
# The OtterTube add-on bundle (Cargo feature `ottertube`): these three and no others.
OTTERTUBE_SLUGS=('clockwerx','delirium','blobbo')
ORIGIN=re.compile(r'https?://[A-Za-z0-9.\-\[\]:]+\Z')

def package(dist, additions=None, media_directory=None, ottertube_hosts=None):
    dist=dist.resolve(strict=True)
    media_directory = Path(media_directory or ROOT/'www/private').resolve(strict=True)
    rows = load_manifest(additions) if additions else []
    slim = ottertube_hosts is not None
    builtins = [row for row in BUILTINS if not slim or row[0] in OTTERTUBE_SLUGS]
    if slim:
        ottertube_hosts = list(ottertube_hosts)
        if not ottertube_hosts or not all(isinstance(host, str) and ORIGIN.match(host) for host in ottertube_hosts):
            raise ValueError('Name OtterTube origins in full: https://host[:port], no path or wildcard')
        if sorted([row[0] for row in builtins]+[row['slug'] for row in rows]) != sorted(OTTERTUBE_SLUGS):
            raise ValueError('The OtterTube bundle holds exactly: '+', '.join(OTTERTUBE_SLUGS))
    index=dist/'index.html'
    html=index.read_text(encoding='utf-8')
    wasm=list(dist.glob('*_bg.wasm'))
    if len(wasm)!=1:
        raise ValueError('Expected one Trunk WebAssembly bundle')
    binary=wasm[0].read_bytes()
    entries = [dict(id=identity, route='/'+route+'/', image_path='private/'+slug+'.img',
                    image_sha256=sha256_file(media_directory/(slug+'.img')),
                    source=media_directory/(slug+'.img')) for slug, route, identity in builtins]
    entries += [dict(id=row['id'], route='/'+row['slug']+'/', image_path=row['packaged_path'],
                     image_sha256=row['image_sha256'], source=Path(row['image_path'])) for row in rows]
    for entry in entries:
        for marker in (entry['id'],entry['route'],'/'+entry['image_path']):
            if marker.encode() not in binary:
                raise ValueError('Build is missing private library entry/route/media '+entry['id'])
    if slim:
        # A slim build that still carries another entry is the wrong build: refuse before copying.
        for slug, route, identity in BUILTINS:
            if (slug, route, identity) not in builtins and (identity.encode() in binary or ('/private/'+slug+'.img').encode() in binary):
                raise ValueError('Build is not the slim OtterTube variant: it still holds '+identity)
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
    for game in (OTTERTUBE_SLUGS if slim else GAMES):
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
    if slim:
        # The page reads the origins from this tag; a static server sends the same list as frame-ancestors.
        shutil.copy2(ROOT/'www/vendor/ottertube-addon.js',dist/'ottertube-addon.js')
        shutil.copy2(ROOT/'www/src/ottertube-link.js',dist/'ottertube-link.js')
        tags=('<meta name="systemless-ottertube-hosts" content="'+' '.join(ottertube_hosts)+'">'
              '<script src="/ottertube-addon.js"></script><script src="/ottertube-link.js"></script>')
        html=html.replace('<!-- private-library -->','<!-- private-library -->'+tags,1)
        html=html.replace('<title>Macintosh Arcade</title>','<title>Macintosh game</title>')
        html=html.replace('</style><!-- /private-library -->',
            '.ottertube-plain{max-width:34rem;margin:15vh auto;padding:0 1.5rem;font:18px/1.5 system-ui,sans-serif;text-align:center}'
            '.ottertube-plain__reason{font-size:13px;opacity:.6}'
            '.app--ottertube .game-page{max-width:none;margin:0;padding:8px}'
            '</style><!-- /private-library -->',1)
        (dist/'ottertube-link.json').write_text(json.dumps({'schema_version':1,'hosts':ottertube_hosts,
            'frame_ancestors':"frame-ancestors "+' '.join(ottertube_hosts)},indent=2)+'\n',encoding='utf-8')
    index.write_text(html,encoding='utf-8')
    (dist/'service-worker.js').write_text("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));\n",encoding='utf-8')
    (dist/'manifest.webmanifest').write_text(json.dumps({'name':'Macintosh Arcade','short_name':'Mac Games','start_url':'/','scope':'/','display':'standalone','theme_color':'#111111','background_color':'#111111'}),encoding='utf-8')
    shutil.copy2(ROOT/'LICENSE',dist/'LICENSE-systemless.txt')
    print('Private browser library ready:',dist,'entries:',len(entries))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('dist',type=Path)
    parser.add_argument('--additions',type=Path)
    parser.add_argument('--media-directory',type=Path)
    parser.add_argument('--ottertube-host',action='append',metavar='ORIGIN',
        help='Package the slim OtterTube add-on bundle; repeat for each OtterTube origin (https://host[:port])')
    args=parser.parse_args()
    package(args.dist,args.additions,args.media_directory,args.ottertube_host)
