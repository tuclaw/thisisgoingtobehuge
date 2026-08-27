#!/usr/bin/env python3
"""Static dev server with live reload for Last Trader Standing."""

from __future__ import annotations

import hashlib
import os
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", "8000"))
WATCH_EXTENSIONS = {".html", ".css", ".js", ".json", ".svg"}
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".cursor"}

LIVEReload_SCRIPT = """
<script>
(function () {
  var last = null;
  function check() {
    fetch("/__livereload__", { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (v) {
        if (last !== null && last !== v) location.reload();
        last = v;
      })
      .catch(function () {});
  }
  setInterval(check, 400);
  check();
})();
</script>
"""

_revision_lock = threading.Lock()
_revision_token = ""


def compute_revision_token() -> str:
    parts: list[str] = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [name for name in dirnames if name not in SKIP_DIRS]
        for name in filenames:
            ext = os.path.splitext(name)[1].lower()
            if ext not in WATCH_EXTENSIONS:
                continue
            full = os.path.join(dirpath, name)
            try:
                stat = os.stat(full)
            except OSError:
                continue
            rel = os.path.relpath(full, ROOT).replace("\\", "/")
            parts.append(f"{rel}:{stat.st_mtime_ns}:{stat.st_size}")
    parts.sort()
    digest = hashlib.sha256("\n".join(parts).encode("utf-8")).hexdigest()
    return digest[:16]


def watch_files() -> None:
    global _revision_token
    while True:
        token = compute_revision_token()
        with _revision_lock:
            _revision_token = token
        time.sleep(0.35)


def get_revision_token() -> str:
    with _revision_lock:
        return _revision_token


def inject_live_reload(body: bytes) -> bytes:
    lower = body.lower()
    marker = b"</body>"
    idx = lower.rfind(marker)
    if idx == -1:
        return body + LIVEReload_SCRIPT.encode("utf-8")
    snippet = LIVEReload_SCRIPT.encode("utf-8")
    return body[:idx] + snippet + body[idx:]


def resolve_html_path(path: str) -> str | None:
    cleaned = unquote(path.split("?", 1)[0])
    fs_path = os.path.abspath(os.path.join(ROOT, cleaned.lstrip("/")))
    if not fs_path.startswith(ROOT):
        return None
    if os.path.isdir(fs_path):
        for index_name in ("index.html", "index.htm"):
            index_path = os.path.join(fs_path, index_name)
            if os.path.isfile(index_path):
                return index_path
        return None
    if os.path.isfile(fs_path) and fs_path.lower().endswith(".html"):
        return fs_path
    return None


class DevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, format: str, *args) -> None:
        if args and isinstance(args[0], str) and "/__livereload__" in args[0]:
            return
        super().log_message(format, *args)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == "/__livereload__":
            payload = get_revision_token().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        html_path = resolve_html_path(self.path)
        if html_path:
            with open(html_path, "rb") as handle:
                body = inject_live_reload(handle.read())
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        super().do_GET()


def main() -> int:
    os.chdir(ROOT)
    global _revision_token
    _revision_token = compute_revision_token()

    watcher = threading.Thread(target=watch_files, daemon=True)
    watcher.start()

    server = ThreadingHTTPServer(("127.0.0.1", PORT), DevHandler)
    print(f"Dev server with live reload: http://127.0.0.1:{PORT}/")
    print("Watching .html, .css, .js, .json, .svg — save a file to auto-refresh.")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
