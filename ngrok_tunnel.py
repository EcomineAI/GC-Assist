"""
GC Assist — ngrok Tunnel for LM Studio
=======================================
This script creates an ngrok tunnel to your local LM Studio (port 1234)
and writes the public URL to public/config.json so your Vercel-hosted
GC Assist app can reach your machine's AI model.

Usage:
    1. Install ngrok: https://ngrok.com/download
    2. Install pyngrok: pip install pyngrok
    3. Set your ngrok auth token once: ngrok authtoken YOUR_TOKEN
    4. Run: python ngrok_tunnel.py

Leave this script running while you want remote users to use LM Studio.
When LM Studio is offline, the app falls back to Groq automatically.
"""

import json
import os
import sys
import time

# ─── CONFIG ────────────────────────────────────────────────────
LM_PORT      = 1234          # LM Studio default port
PROJECT_DIR  = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE  = os.path.join(PROJECT_DIR, "public", "config.json")
# ───────────────────────────────────────────────────────────────


def check_dependencies():
    try:
        from pyngrok import ngrok
        return ngrok
    except ImportError:
        print("[ERROR] pyngrok is not installed.")
        print("        Run:  pip install pyngrok")
        sys.exit(1)


def check_lm_studio_running():
    import urllib.request
    try:
        urllib.request.urlopen(f"http://localhost:{LM_PORT}/v1/models", timeout=3)
        return True
    except Exception:
        return False


def write_config(url):
    """Write the ngrok URL to public/config.json for the Vercel app to read."""
    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
    cfg = {
        "lmStudioUrl": f"{url}/v1/chat/completions"
    }
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    print(f"[config] Written to public/config.json")
    print(f"[config] LM Studio URL: {url}/v1/chat/completions")


def clear_config():
    """Remove config.json so app falls back to Groq after script exits."""
    if os.path.exists(CONFIG_FILE):
        cfg = {}
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f)
        print("[config] Cleared config.json — app will use Groq fallback.")


def main():
    print()
    print("  +========================================+")
    print("  |  GC Assist — ngrok LM Studio Tunnel   |")
    print("  +========================================+")
    print()

    ngrok = check_dependencies()

    # Check if LM Studio is running
    print("[1/3] Checking if LM Studio is running on port 1234...")
    if not check_lm_studio_running():
        print("[WARNING] LM Studio does not appear to be running on port 1234.")
        print("          Please start LM Studio and load a model first.")
        print("          Starting tunnel anyway — it will fail until LM Studio is up.\n")
    else:
        print("[1/3] LM Studio is running. ✓\n")

    # Start ngrok tunnel
    print("[2/3] Starting ngrok tunnel to port 1234...")
    try:
        tunnel = ngrok.connect(LM_PORT, "http")
        public_url = tunnel.public_url.replace("http://", "https://")
        print(f"[2/3] Tunnel active: {public_url} ✓\n")
    except Exception as e:
        print(f"[ERROR] Failed to start ngrok tunnel: {e}")
        print()
        print("Possible fixes:")
        print("  1. Run 'ngrok authtoken YOUR_TOKEN' to authenticate.")
        print("     Get your token at: https://dashboard.ngrok.com/auth/your-authtoken")
        print("  2. Make sure ngrok is installed: https://ngrok.com/download")
        sys.exit(1)

    # Write config.json
    print("[3/3] Writing public URL to public/config.json...")
    write_config(public_url)

    print()
    print("  " + "=" * 50)
    print("  NGROK TUNNEL ACTIVE!")
    print(f"  LM Studio → {public_url}")
    print()
    print("  Your Vercel app will now use YOUR LM Studio.")
    print("  Press Ctrl+C to stop and fall back to Groq.")
    print("  " + "=" * 50)
    print()

    try:
        while True:
            time.sleep(5)
            # Periodically check if LM Studio is still alive
            if not check_lm_studio_running():
                print("[WARNING] LM Studio connection lost. Tunnel is still active but AI may not respond.")
    except KeyboardInterrupt:
        print("\n[ngrok] Shutting down tunnel...")
        ngrok.disconnect(tunnel.public_url)
        ngrok.kill()
        clear_config()
        print("[ngrok] Done. App will now use Groq API as fallback.")
        sys.exit(0)


if __name__ == "__main__":
    main()
