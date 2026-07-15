"""Server statico locale con supporto HTTP Range (per lo scrub del video).
Uso: python tools/range_server.py [porta]
Serve la cartella corrente. Solo per test locale — in produzione (Netlify)
le Range request sono gestite dalla CDN.
"""
import os
import re
import sys
import http.server


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        if path.endswith(".mp4"):
            return "video/mp4"
        return super().guess_type(path)

    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.isfile(path):
            return super().do_GET()

        size = os.path.getsize(path)
        ctype = self.guess_type(path)
        rng = self.headers.get("Range")

        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)", rng)
            start = int(m.group(1)) if m and m.group(1) else 0
            end = int(m.group(2)) if m and m.group(2) else size - 1
            end = min(end, size - 1)
            if start > end:
                self.send_error(416)
                return
            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
            self.send_header("Content-Length", str(length))
            self.end_headers()
            with open(path, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(65536, remaining))
                    if not chunk:
                        break
                    try:
                        self.wfile.write(chunk)
                    except (BrokenPipeError, ConnectionResetError):
                        break
                    remaining -= len(chunk)
        else:
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(size))
            self.end_headers()
            with open(path, "rb") as f:
                self.copyfile(f, self.wfile)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5599
    httpd = http.server.ThreadingHTTPServer(("", port), RangeHandler)
    print("Range server su http://localhost:%d" % port)
    httpd.serve_forever()
