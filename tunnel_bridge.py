"""
GC Assist — Tunnel Bridge
Creates a Cloudflare tunnel for LM Studio and pushes the live URL to Supabase
so that any device on the Vercel URL can reach your local LM Studio.

Usage:
    python tunnel_bridge.py

Requirements:
    - LM Studio running on port 1234
    - npx available OR cloudflared installed globally
    - SUPABASE_SERVICE_KEY set in .env (service_role key from Supabase dashboard)
    - VITE_SUPABASE_URL set in .env (already there)
    - VITE_LM_STUDIO_TOKEN set in .env (already there)
"""

import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

# ─── CONFIG ───────────────────────────────────────────────────
LM_PORT = 1234
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(PROJECT_DIR, ".env")
# --------------------------------------------------------------


def load_env():
    """Parse key=value pairs from .env file."""
    env = {}
    if not os.path.exists(ENV_PATH):
        return env
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip()
    return env


def get_cloudflared_cmd(port):
    """Return the first working cloudflared command for the given port."""
    candidates = [
        ["npx", "-y", "cloudflared", "tunnel", "--url", f"http://localhost:{port}"],
        ["cloudflared", "tunnel", "--url", f"http://localhost:{port}"],
    ]
    for cmd in candidates:
        try:
            subprocess.run(cmd[:1] + ["--version"], capture_output=True, timeout=5)
            return cmd
        except Exception:
            continue
    return None


def push_to_supabase(supabase_url, service_key, lm_tunnel_url, token):
    """Upsert the tunnel URL into tunnel_config (row id=1)."""
    payload = json.dumps({
        "id": 1,
        "lm_studio_url": f"{lm_tunnel_url}/v1/chat/completions",
        "lm_studio_token": token,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/tunnel_config",
        data=payload,
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
        print(f"[supabase] Pushed tunnel URL: {lm_tunnel_url}/v1/chat/completions")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[supabase] ERROR pushing URL (HTTP {e.code}): {body}")
        print("           Make sure the tunnel_config table exists and RLS policies are set.")
        print("           See the README or plan for the required SQL.")
    except Exception as e:
        print(f"[supabase] ERROR pushing URL: {e}")


def clear_supabase(supabase_url, service_key):
    """Delete the tunnel_config row so the frontend falls back to local mode."""
    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/tunnel_config?id=eq.1",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        },
        method="DELETE",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
        print("[supabase] Cleared tunnel config — remote users will see 'not connected'.")
    except Exception as e:
        print(f"[supabase] Warning: could not clear config on exit: {e}")


def run_tunnel(supabase_url, service_key, token):
    """Start cloudflared tunnel and push URL to Supabase when ready."""
    cmd = get_cloudflared_cmd(LM_PORT)
    if cmd is None:
        print("[tunnel] ERROR: cloudflared not found.")
        print("         Install via: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")
        print("         Or ensure npx is available.")
        return

    print(f"[tunnel] Starting Cloudflare tunnel for LM Studio (port {LM_PORT})...")
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    except Exception as e:
        print(f"[tunnel] Failed to start: {e}")
        return

    url_found = False
    for line in process.stdout:
        line = line.strip()
        match = re.search(r"https://[a-zA-Z0-9\-]+\.trycloudflare\.com", line)
        if match:
            tunnel_url = match.group(0)
            print(f"[tunnel] Ready: {tunnel_url}")
            push_to_supabase(supabase_url, service_key, tunnel_url, token)
            url_found = True
            break

    if not url_found:
        print("[tunnel] ERROR: Could not capture tunnel URL from cloudflared output.")
        return

    # Keep tunnel process alive
    process.wait()
    print("[tunnel] Tunnel process exited.")


def main():
    env = load_env()

    supabase_url = env.get("VITE_SUPABASE_URL", "").rstrip("/")
    service_key = env.get("SUPABASE_SERVICE_KEY", "")
    token = env.get("VITE_LM_STUDIO_TOKEN", "")

    if not supabase_url:
        print("[error] VITE_SUPABASE_URL not found in .env")
        sys.exit(1)

    if not service_key:
        print("[error] SUPABASE_SERVICE_KEY not found in .env")
        print("        Go to Supabase Dashboard > Project Settings > API")
        print("        Copy the service_role secret and add it to .env:")
        print("        SUPABASE_SERVICE_KEY=<your-service-role-key>")
        sys.exit(1)

    print()
    print("  +==========================================+")
    print("  |     GC Assist — Tunnel Bridge            |")
    print("  |  LM Studio -> Cloudflare -> Supabase     |")
    print("  |  Vercel users will use YOUR LM Studio    |")
    print("  +==========================================+")
    print()

    # Run tunnel in a daemon thread
    t = threading.Thread(target=run_tunnel, args=(supabase_url, service_key, token), daemon=True)
    t.start()

    print("  Press Ctrl+C to stop the tunnel.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[bridge] Shutting down...")
        clear_supabase(supabase_url, service_key)
        print("[bridge] Done.")
        sys.exit(0)


if __name__ == "__main__":
    main()
