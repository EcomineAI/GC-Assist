"""
GC Assist — Cloud Deploy
Builds the Vite app, serves it, and creates TWO Cloudflare tunnels:
  1. App tunnel  (port 5000) -> your public GC Assist URL
  2. LM Studio tunnel (port 1234) -> so remote users can reach YOUR LM Studio

The LM Studio tunnel URL is written to dist/config.json so every
visitor's browser automatically routes AI requests back to your machine.

Usage:
    python cloud.py

Requirements:
    - Node.js (npm run build)
    - LM Studio running (port 1234)
    - npx available  OR  cloudflared installed globally
"""

import json
import os
import re
import subprocess
import sys
import threading
import time
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

try:
    import qrcode
    HAS_QR = True
except ImportError:
    HAS_QR = False


# --- CONFIG ---
APP_PORT = 5000
LM_PORT = 1234
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(PROJECT_DIR, "dist")
CONFIG_FILE = os.path.join(DIST_DIR, "config.json")
# --------------

# Shared state between tunnel threads
tunnel_urls = {}
tunnel_lock = threading.Lock()
urls_ready = threading.Event()


# ─── HTTP SERVER ──────────────────────────────────────────────

class SPAHandler(SimpleHTTPRequestHandler):
    """Serve dist/ with SPA fallback: unknown paths -> index.html."""

    def do_GET(self):
        path = self.translate_path(self.path)
        # If no file extension and file doesn't exist, serve index.html
        if not os.path.splitext(self.path)[1] and not os.path.isfile(path):
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, format, *args):
        pass  # suppress noisy access logs


def run_server():
    os.chdir(DIST_DIR)
    handler = partial(SPAHandler, directory=DIST_DIR)
    server = HTTPServer(("0.0.0.0", APP_PORT), handler)
    print(f"[server] Serving dist/ on http://localhost:{APP_PORT}")
    server.serve_forever()


# ─── BUILD ────────────────────────────────────────────────────

def build_app():
    print()
    print("  +==========================================+")
    print("  |     GC ASSIST - Cloud Deploy             |")
    print("  |  App + LM Studio tunnels via Cloudflare  |")
    print("  +==========================================+")
    print()
    print("[1/4] Building production app (npm run build)...")

    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_DIR,
        shell=True,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print("[build] ERROR: Build failed!")
        print(result.stderr[-2000:])
        sys.exit(1)

    if not os.path.exists(DIST_DIR):
        print("[build] ERROR: dist/ folder not found after build.")
        sys.exit(1)

    print("[1/4] Build complete.\n")


# ─── TUNNELS ──────────────────────────────────────────────────

def get_cloudflared_cmd(port):
    """Return the first working cloudflared command for a given port."""
    candidates = [
        ["npx", "-y", "cloudflared", "tunnel", "--url", f"http://localhost:{port}"],
        ["cloudflared",              "tunnel", "--url", f"http://localhost:{port}"],
    ]
    for cmd in candidates:
        try:
            # Quick test: does the executable exist?
            subprocess.run(
                cmd[:1] + ["--version"],
                capture_output=True,
                timeout=5,
            )
            return cmd
        except Exception:
            continue
    return None


def tunnel_worker(label, port, url_key):
    """Run a cloudflared tunnel and capture its public URL."""
    cmd = get_cloudflared_cmd(port)
    if cmd is None:
        print(f"[{label}] ERROR: cloudflared / npx not found.")
        print("         Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")
        return

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    except Exception as e:
        print(f"[{label}] Failed to start tunnel: {e}")
        return

    for line in process.stdout:
        line = line.strip()
        match = re.search(r"https://[a-zA-Z0-9\-]+\.trycloudflare\.com", line)
        if match:
            url = match.group(0)
            with tunnel_lock:
                tunnel_urls[url_key] = url
            print(f"[{label}] Tunnel ready: {url}")
            # Signal if both tunnels are ready
            if "app" in tunnel_urls and "lm" in tunnel_urls:
                urls_ready.set()
            break  # URL captured; keep process alive below

    # Keep process running (don't let it die)
    process.wait()


# ─── CONFIG JSON ──────────────────────────────────────────────

def write_config(lm_url):
    """Write config.json into dist/ so the browser app can read it."""
    cfg = {
        "lmStudioUrl": f"{lm_url}/v1/chat/completions"
    }
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    print(f"[config] Written dist/config.json with LM Studio URL.")


# ─── MAIN ─────────────────────────────────────────────────────

if __name__ == "__main__":
    # Step 1: Build the app
    build_app()

    # Step 2: Start file server
    print("[2/4] Starting local file server...")
    threading.Thread(target=run_server, daemon=True).start()
    time.sleep(0.5)

    # Step 3: Start both tunnels in parallel
    print("[3/4] Starting Cloudflare tunnels (app + LM Studio)...")
    threading.Thread(target=tunnel_worker, args=("app-tunnel", APP_PORT, "app"), daemon=True).start()
    threading.Thread(target=tunnel_worker, args=("lm-tunnel",  LM_PORT,  "lm"),  daemon=True).start()

    # Wait up to 60s for both URLs
    print("      Waiting for tunnel URLs...")
    got_both = urls_ready.wait(timeout=60)

    if not got_both:
        # Report whatever we have
        with tunnel_lock:
            app_url = tunnel_urls.get("app", "(not ready)")
            lm_url  = tunnel_urls.get("lm",  None)
    else:
        with tunnel_lock:
            app_url = tunnel_urls["app"]
            lm_url  = tunnel_urls["lm"]

    # Step 4: Write config.json so remote browsers use our LM tunnel
    print("[4/4] Configuring remote LM Studio access...")
    if lm_url:
        write_config(lm_url)
    else:
        print("[config] WARNING: LM Studio tunnel not ready. Remote users may not get AI responses.")
        print("         Is LM Studio running on port 1234?")

    # Print summary
    print()
    print("  " + "=" * 50)
    print("  SHARE THIS URL:")
    print(f"  {app_url}")
    print("  " + "=" * 50)
    
    if HAS_QR:
        print("\n  SCAN TO OPEN ON MOBILE:")
        qr = qrcode.QRCode(version=1, box_size=1, border=2)
        qr.add_data(app_url)
        qr.make(fit=True)
        qr.print_ascii(invert=True)
    else:
        print("\n  [tip] Install 'qrcode' to see a scan-ready QR here:")
        print("        pip install qrcode")

    if lm_url:
        print(f"\n  LM Studio tunnel: {lm_url}")
        print("  [OK] Remote users will use YOUR LM Studio instance.")
    print("\n  Press Ctrl+C to stop all tunnels.\n")

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[cloud] Shutting down.")
        sys.exit(0)