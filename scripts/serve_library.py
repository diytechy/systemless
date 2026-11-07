"""Loopback-only static server for the private Macintosh game library."""
import argparse
import json
import os
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from serve_koji import Handler as BaseHandler

def library_routes(directory):
    """Read packaged metadata, allowing the original three-game bundle as before."""
    path = Path(directory)/'private-library.json'
    if not path.is_file():
        return {'/koji-the-frog','/clockwerx','/delirium'}
    metadata=json.loads(path.read_text(encoding='utf-8'))
    if metadata.get('schema_version') != 1 or not isinstance(metadata.get('entries'),list):
        raise ValueError('Invalid packaged library metadata')
    routes=set()
    for entry in metadata['entries']:
        route=entry['route']
        if not re.fullmatch(r'/[a-z0-9]+(?:-[a-z0-9]+)*/',route) or route.rstrip('/') in routes:
            raise ValueError('Invalid/duplicate packaged route')
        image=entry['image_path']
        if not re.fullmatch(r'private/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:img|kpk)',image) or not (Path(directory)/image).is_file():
            raise ValueError('Missing/invalid packaged media')
        routes.add(route.rstrip('/'))
    return routes

class Handler(BaseHandler):
    def send_head(self):
        if urlsplit(self.path).path.rstrip('/') in {'',*self.server.library_routes}:
            self.path='/index.html'
        return SimpleHTTPRequestHandler.send_head(self)

    def do_GET(self):
        if urlsplit(self.path).path == '/_macgames/health':
            body=json.dumps({'app':'systemless-private-library','pid':os.getpid(),'directory':str(Path(self.directory).resolve())}).encode()
            self.send_response(200)
            self.send_header('Content-Type','application/json')
            self.send_header('Content-Length',str(len(body)))
            self.end_headers();self.wfile.write(body);return
        SimpleHTTPRequestHandler.do_GET(self)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory',type=Path,default=Path(__file__).resolve().parents[1]/'www/dist')
    parser.add_argument('--port',type=int,default=8087)
    parser.add_argument('--bind',default='127.0.0.1')
    args=parser.parse_args();directory=args.directory.resolve(strict=True)
    for file in ('index.html','private/koji.img','private/clockwerx.img','private/delirium.img'):
        if not (directory/file).is_file(): parser.error('Build the library first: scripts/Build-MacGames.ps1')
    server=ThreadingHTTPServer((args.bind,args.port),partial(Handler,directory=str(directory)))
    server.library_routes=library_routes(directory)
    print(f'Macintosh Arcade is ready at http://localhost:{server.server_address[1]}/',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
