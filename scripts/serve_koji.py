"""Local static Koji server. Deploy the same dist directory behind HTTPS on HomeHub."""
import argparse
import json
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
        '.wasm': 'application/wasm', '.js': 'text/javascript', '.mjs': 'text/javascript',
        '.img': 'application/octet-stream'}

    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'credentialless')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/_koji/health':
            body = json.dumps({'app': 'systemless-private-koji', 'pid': os.getpid(), 'directory': str(Path(self.directory).resolve())}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if path == '/':
            self.send_response(302)
            self.send_header('Location', '/koji-the-frog/')
            self.end_headers()
            return
        if path.rstrip('/') == '/koji-the-frog':
            self.path = '/index.html'
        super().do_GET()

    def list_directory(self, path):
        self.send_error(404)
        return None

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, default=Path(__file__).resolve().parents[1]/'www/dist')
    parser.add_argument('--port', type=int, default=8087)
    parser.add_argument('--bind', default='127.0.0.1')
    args = parser.parse_args()
    directory = args.directory.resolve(strict=True)
    if not (directory/'index.html').is_file() or not (directory/'private/koji.img').is_file():
        parser.error('Build the private Koji browser bundle first')
    server = ThreadingHTTPServer((args.bind, args.port), partial(Handler, directory=str(directory)))
    print(f'Koji is ready at http://localhost:{args.port}/koji-the-frog/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
