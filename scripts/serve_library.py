"""Loopback-only static server for the private Macintosh game library."""
import argparse
import json
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from serve_koji import Handler as BaseHandler

class Handler(BaseHandler):
    def send_head(self):
        if urlsplit(self.path).path.rstrip('/') in ('','/koji-the-frog','/clockwerx','/delirium'):
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
    print(f'Macintosh Arcade is ready at http://localhost:{args.port}/',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
