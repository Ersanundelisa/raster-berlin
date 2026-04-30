import http.server, os
os.chdir('/Users/jakobfleig/Desktop/blueprint')
server = http.server.HTTPServer(('', 3000), http.server.SimpleHTTPRequestHandler)
server.serve_forever()
