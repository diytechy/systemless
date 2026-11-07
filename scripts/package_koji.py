"""Finish a private Trunk build with local media and controller controls."""
import argparse
import json
import re
import shutil
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('dist',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
dist=args.dist.resolve(strict=True)
index=dist/'index.html'
html=index.read_text(encoding='utf-8')
if 'systemless-org-' not in html:
    raise SystemExit('Not a Trunk output directory')
wasm_files=list(dist.glob('*_bg.wasm'))
if len(wasm_files) != 1 or b'koji-personal-204' not in wasm_files[0].read_bytes():
    raise SystemExit('Refusing to package a build without the private Koji catalogue')
private=dist/'private'
private.mkdir(exist_ok=True)
shutil.copy2(root/'www/private/koji.img',private/'koji.img')
shutil.copy2(root/'scripts/koji-controls.mjs',dist/'koji-controls.mjs')
html=re.sub(r'<title>.*?</title>', '<title>Koji the Frog</title>', html, flags=re.S)
html=re.sub(r'<!-- systemless-seo -->.*?<!-- /systemless-seo -->',
    '<title>Koji the Frog</title><meta name="robots" content="noindex,nofollow">',html,flags=re.S)
html=re.sub(r'<!-- systemless-fallback -->.*?<!-- /systemless-fallback -->',
    '<p>Loading Koji the Frog…</p>',html,flags=re.S)
html=re.sub(r'<link rel="preconnect"[^>]*>', '', html)
html=html.replace('document.title = "Systemless";', 'document.title = "Koji the Frog";')
html=html.replace('</head>', '<script type="module" src="/koji-controls.mjs"></script><style>.koji-toolbar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0}.koji-toolbar button,.koji-toolbar select{font:inherit;padding:7px 12px}.koji-toolbar span{font-size:13px;opacity:.8}.koji-exit-fullscreen{display:none}.game-canvas-wrap:fullscreen .koji-exit-fullscreen{display:block;position:absolute;top:12px;right:12px;z-index:100;padding:9px 14px;font:16px sans-serif}.game-canvas-wrap:fullscreen{display:flex;align-items:center;justify-content:center;background:#111}.game-canvas-wrap:fullscreen canvas{width:min(100vw,calc(100vh * 4 / 3))!important;height:auto!important;max-width:100vw;max-height:100vh;object-fit:contain}.game-download{display:none!important}</style></head>')
index.write_text(html,encoding='utf-8')
# Avoid public-site service-worker routes/caches on the personal origin.
(dist/'service-worker.js').write_text("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));\n",encoding='utf-8')
manifest={'name':'Koji the Frog','short_name':'Koji','start_url':'/koji-the-frog/','scope':'/','display':'standalone','background_color':'#111111','theme_color':'#111111'}
(dist/'manifest.webmanifest').write_text(json.dumps(manifest),encoding='utf-8')
shutil.copy2(root/'LICENSE',dist/'LICENSE-systemless.txt')
print(f'Private browser bundle ready: {dist}')
