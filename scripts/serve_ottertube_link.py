"""Loopback static server for the slim OtterTube add-on bundle (three games).

For local tests only. It serves the packaged routes, and sends the bundle's
frame-ancestors list so that only the named OtterTube origins can frame a page.
It never serves the full private library: a bundle with other entries is refused.
"""
import argparse
import json
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from package_library import OTTERTUBE_SLUGS
from serve_library import Handler as LibraryHandler, library_routes


def bundle_policy(directory):
    """The frame-ancestors policy of a packaged slim bundle, after checking it is one."""
    directory = Path(directory)
    routes = library_routes(directory)
    if routes != {'/' + slug for slug in OTTERTUBE_SLUGS}:
        raise ValueError('Not the slim OtterTube bundle: routes are ' + ', '.join(sorted(routes)))
    link = json.loads((directory / 'ottertube-link.json').read_text(encoding='utf-8'))
    if link.get('schema_version') != 1 or not link.get('hosts'):
        raise ValueError('Invalid ottertube-link.json')
    return routes, 'frame-ancestors ' + ' '.join(link['hosts'])


class Handler(LibraryHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy', self.server.frame_policy)
        super().end_headers()

    def do_GET(self):
        if urlsplit(self.path).path == '/_macgames/health':
            body = json.dumps({'app': 'systemless-ottertube-link', 'pid': os.getpid(),
                               'directory': str(Path(self.directory).resolve())}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers(); self.wfile.write(body); return
        SimpleHTTPRequestHandler.do_GET(self)

    def log_message(self, *args):
        if self.server.verbose:
            super().log_message(*args)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, required=True)
    parser.add_argument('--port', type=int, default=8097)
    parser.add_argument('--bind', default='127.0.0.1')
    parser.add_argument('--verbose', action='store_true')
    parser.add_argument('--also-frame-ancestor', action='append', default=[], metavar='ORIGIN',
        help='Tests only: let this origin frame the pages too, although the bundle does not list it, '
             'to show that the page ignores a parent that is not OtterTube')
    args = parser.parse_args()
    directory = args.directory.resolve(strict=True)
    routes, policy = bundle_policy(directory)
    server = ThreadingHTTPServer((args.bind, args.port), partial(Handler, directory=str(directory)))
    server.library_routes = routes
    server.frame_policy = ' '.join([policy, *args.also_frame_ancestor])
    server.verbose = args.verbose
    print(f'OtterTube add-on bundle at http://{args.bind}:{server.server_address[1]}/ ({policy})', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
