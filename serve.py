import http.server
import os
import sys

os.chdir("/Users/jakobfleig/Desktop/blueprint")
port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
handler = http.server.SimpleHTTPRequestHandler
with http.server.HTTPServer(("", port), handler) as httpd:
    print(f"Serving at port {port}")
    httpd.serve_forever()
