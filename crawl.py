import json
import re
import time
import sys
import asyncio
import hashlib
import argparse
import io
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

try:
    import aiohttp
    from bs4 import BeautifulSoup
    import markdownify
except ImportError:
    print("Missing dependencies. Install them with:")
    print("  pip install aiohttp beautifulsoup4 markdownify")
    sys.exit(1)

# Optional PDF support
try:
    import pdfplumber
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

# ─── Paths ────────────────────────────────────────────────────
SITE_JSON       = Path(__file__).parent / "site.json"
OUTPUT_DIR      = Path(__file__).parent / "public"
CACHE_FILE      = Path(__file__).parent / "crawl_cache.json"
REPORT_FILE     = OUTPUT_DIR / "crawl_report.json"
MANUAL_DATA     = Path(__file__).parent / "manual_data.json"
TXT_KB_FILE     = OUTPUT_DIR / "knowledge_base.txt"
OUTPUT_DIR.mkdir(exist_ok=True)

# ─── Config ───────────────────────────────────────────────────
HEADERS         = {"User-Agent": "GCAssist-Crawler/3.0 (Async/Smart)"}
REMOVE_TAGS     = ["script", "style", "nav", "footer", "header", "aside", "form", "iframe", "noscript"]
BASE_DOMAIN     = "gordoncollege.edu.ph"
MAX_CONCURRENT  = 5      # Max parallel requests (polite rate limiting)
REQUEST_DELAY   = 0.35   # Seconds between individual requests

# Pages that MUST have at least one chunk — validated after crawl
CRITICAL_URLS = [
    "https://gordoncollege.edu.ph/w3/academics/academic-calendar/",
    "https://gordoncollege.edu.ph/w3/academics/academic-programs/",
    "https://gordoncollege.edu.ph/w3/admission/freshmen-students/",
    "https://gordoncollege.edu.ph/w3/admission/transferees-and-second-courser/",
    "https://gordoncollege.edu.ph/w3/campus-life/library-and-instructional-media-center/",
    "https://gordoncollege.edu.ph/w3/call-us/",
    "https://gordoncollege.edu.ph/w3/email-us/",
]

SKIP_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".svg", ".ico",
    ".webp", ".mp4", ".mp3", ".zip", ".rar", ".exe",
    ".css", ".js", ".xml", ".json"
}


# ═══════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════
def parse_args():
    parser = argparse.ArgumentParser(
        description="GC Assist Smart Web Crawler v3",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python crawl.py               # Normal run (uses cache, skips unchanged pages)
  python crawl.py --force       # Force re-crawl all pages
  python crawl.py --depth 3     # Follow links 3 levels deep
  python crawl.py --max-pages 200
        """
    )
    parser.add_argument("--force",      action="store_true", help="Ignore cache and re-crawl all pages")
    parser.add_argument("--depth",      type=int, default=2,   help="Max recursive link-follow depth (default: 2)")
    parser.add_argument("--max-pages",  type=int, default=150, help="Max total pages to crawl (default: 150)")
    return parser.parse_args()


# ═══════════════════════════════════════════════════════════════
# Cache
# ═══════════════════════════════════════════════════════════════
def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def content_hash(text):
    return hashlib.md5(text.encode("utf-8", errors="replace")).hexdigest()


# ═══════════════════════════════════════════════════════════════
# Site list
# ═══════════════════════════════════════════════════════════════
def load_sites():
    with open(SITE_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    sites = data["trusted_sites"]

    # Dynamically include 10 pages of campus news
    for page in range(1, 11):
        url = (
            f"https://gordoncollege.edu.ph/w3/category/news/page/{page}/"
            if page > 1
            else "https://gordoncollege.edu.ph/w3/category/news/"
        )
        sites.append({
            "url": url,
            "category": "campus_news",
            "keywords": ["news", "latest", "events", "bulletin", f"page {page}"]
        })

    return sites


# ═══════════════════════════════════════════════════════════════
# URL helpers
# ═══════════════════════════════════════════════════════════════
def is_internal(url):
    try:
        return BASE_DOMAIN in urlparse(url).netloc
    except Exception:
        return False


def normalize_url(url):
    """Strip fragment and trailing slash for consistent deduplication."""
    return url.split("#")[0].rstrip("/")


def classify_link(href, base_url):
    """Return ('page' | 'pdf' | 'skip') for a given href."""
    full = normalize_url(urljoin(base_url, href.strip()))
    if not full.startswith("http"):
        return "skip", full
    if not is_internal(full):
        return "skip", full
    ext = Path(urlparse(full).path).suffix.lower()
    if ext == ".pdf":
        return "pdf", full
    if ext in SKIP_EXTENSIONS:
        return "skip", full
    return "page", full


# ═══════════════════════════════════════════════════════════════
# Content extraction
# ═══════════════════════════════════════════════════════════════
def extract_page_title(soup):
    title_tag = soup.find("title")
    if title_tag:
        t = title_tag.get_text().strip()
        for suffix in [" - Gordon College", " | Gordon College", " – Gordon College"]:
            t = t.replace(suffix, "")
        return t.strip()
    h1 = soup.find("h1")
    return h1.get_text().strip() if h1 else ""


def extract_internal_links(soup, base_url):
    """Return (set of page URLs, set of PDF URLs) found on this page."""
    pages, pdfs = set(), set()
    for a in soup.find_all("a", href=True):
        kind, full = classify_link(a["href"], base_url)
        if kind == "page":
            pages.add(full)
        elif kind == "pdf":
            pdfs.add(full)
    return pages, pdfs


def extract_markdown(html):
    """
    Convert HTML to clean Markdown.
    - Replaces <img> with [Image: alt text] when alt is present.
    - Preserves <figcaption> as [Caption: ...].
    - Strips noisy short lines.
    """
    soup = BeautifulSoup(html, "html.parser")
    page_title = extract_page_title(soup)

    for tag in REMOVE_TAGS:
        for el in soup.find_all(tag):
            el.decompose()

    # ── Image alt-text ──
    for img in soup.find_all("img"):
        alt = img.get("alt", "").strip()
        if alt:
            p = soup.new_tag("p")
            p.string = f"[Image: {alt}]"
            img.replace_with(p)
        else:
            img.decompose()

    # ── Figure captions ──
    for figcaption in soup.find_all("figcaption"):
        cap_text = figcaption.get_text().strip()
        if cap_text:
            p = soup.new_tag("p")
            p.string = f"[Caption: {cap_text}]"
            figcaption.replace_with(p)

    main = (
        soup.find("main")
        or soup.find("article")
        or soup.find("div", class_=re.compile(r"(content|entry|post|page)", re.I))
        or soup.find("div", id=re.compile(r"(content|main|primary)", re.I))
        or soup.body
    )
    if not main:
        return "", page_title

    md = markdownify.markdownify(str(main), heading_style="ATX", strip=[])
    md = re.sub(r"\n{3,}", "\n\n", md)

    # Remove lines that are too short or purely decorative
    cleaned = [
        line for line in md.split("\n")
        if not (len(line.strip()) < 3 and not line.strip().startswith("#"))
        and not re.match(r'^[\|\-\*\s]{1,6}$', line.strip())
    ]
    return "\n".join(cleaned).strip(), page_title


async def fetch_pdf(session, url):
    """Download a PDF and extract its text."""
    if not PDF_SUPPORT:
        return None
    try:
        async with session.get(url, headers=HEADERS, timeout=30) as resp:
            resp.raise_for_status()
            raw = await resp.read()
        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            pages_text = [p.extract_text() for p in pdf.pages if p.extract_text()]
        return "\n\n".join(pages_text).strip() or None
    except Exception as e:
        print(f"  [X] PDF FAILED: {url} — {e}")
        return None


# ═══════════════════════════════════════════════════════════════
# Core fetch
# ═══════════════════════════════════════════════════════════════
async def fetch_page(session, site, semaphore, cache, force, link_pool, pdf_pool, depth, max_depth):
    """
    Fetch one page with:
      - Rate-limiting semaphore + polite delay
      - Incremental cache (skip if hash unchanged)
      - Link & PDF discovery
    """
    url = site["url"]

    async with semaphore:
        await asyncio.sleep(REQUEST_DELAY)
        try:
            async with session.get(url, headers=HEADERS, timeout=15) as resp:
                resp.raise_for_status()
                html = await resp.text()
        except Exception as e:
            return {"url": url, "status": "failed", "reason": str(e)}

    # ── Cache check ──
    h = content_hash(html)
    if not force and cache.get(url) == h:
        return {"url": url, "status": "skipped", "reason": "unchanged"}
    cache[url] = h

    soup = BeautifulSoup(html, "html.parser")
    page_title = extract_page_title(soup)

    # ── Recursive link discovery ──
    if depth < max_depth:
        new_pages, new_pdfs = extract_internal_links(soup, url)
        link_pool.update(new_pages)
        pdf_pool.update(new_pdfs)

    # ── Content ──
    if "category/news" in url:
        news = []
        for h3 in soup.find_all("h3"):
            blurb = re.sub(r"[ \t]+", " ", h3.parent.get_text(separator=" ").strip())
            news.append(f"- {blurb}")
        content = "\n\n".join(news)
        page_title = page_title or "Campus News"
    else:
        content, page_title = extract_markdown(html)

    if not content or len(content) < 30:
        return {"url": url, "status": "empty", "reason": "no content extracted"}

    return {
        "source":         url,
        "page_title":     page_title,
        "category":       site.get("category", "general"),
        "keywords":       site.get("keywords", []),
        "content":        content,
        "content_length": len(content),
        "crawled_at":     datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "status":         "ok",
    }


# ═══════════════════════════════════════════════════════════════
# Orchestrator
# ═══════════════════════════════════════════════════════════════
async def crawl_all(sites, cache, force, max_depth, max_pages):
    semaphore   = asyncio.Semaphore(MAX_CONCURRENT)
    visited     = {normalize_url(s["url"]) for s in sites}
    link_pool   = set()   # discovered internal HTML pages
    pdf_pool    = set()   # discovered PDF links
    results     = []
    report_pages = []

    async with aiohttp.ClientSession() as session:

        # ── Phase 1: Seed pages ──────────────────────────────
        print(f"  [Phase 1] Crawling {len(sites)} seed pages...")
        tasks = [
            fetch_page(session, site, semaphore, cache, force, link_pool, pdf_pool, 0, max_depth)
            for site in sites
        ]
        for r in await asyncio.gather(*tasks):
            if r.get("status") == "ok":
                results.append(r)
            report_pages.append(r)

        # ── Phase 2: Discovered links ────────────────────────
        to_visit = list(link_pool - visited)[:max_pages - len(visited)]
        if to_visit:
            print(f"  [Phase 2] Following {len(to_visit)} discovered internal links...")
            visited.update(to_visit)
            disc_sites = [{"url": u, "category": "discovered", "keywords": []} for u in to_visit]
            tasks = [
                fetch_page(session, site, semaphore, cache, force, set(), pdf_pool, 1, max_depth)
                for site in disc_sites
            ]
            for r in await asyncio.gather(*tasks):
                if r.get("status") == "ok":
                    results.append(r)
                report_pages.append(r)
        else:
            print("  [Phase 2] No new internal pages discovered.")

        # ── Phase 3: PDFs ────────────────────────────────────
        if pdf_pool:
            if PDF_SUPPORT:
                to_fetch = list(pdf_pool)[:30]  # cap at 30 PDFs
                print(f"  [Phase 3] Extracting text from {len(to_fetch)} PDF(s)...")
                pdf_results = []
                for pdf_url in to_fetch:
                    text = await fetch_pdf(session, pdf_url)
                    if text:
                        name = Path(urlparse(pdf_url).path).stem.replace("-", " ").replace("_", " ").title()
                        pdf_results.append({
                            "source":         pdf_url,
                            "page_title":     name,
                            "category":       "document",
                            "keywords":       ["pdf", "document"],
                            "content":        text,
                            "content_length": len(text),
                            "crawled_at":     datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                            "status":         "ok",
                        })
                        report_pages.append({"url": pdf_url, "status": "ok", "type": "pdf", "content_length": len(text)})
                    else:
                        report_pages.append({"url": pdf_url, "status": "empty", "type": "pdf"})
                results.extend(pdf_results)
                print(f"  [Phase 3] Extracted {len(pdf_results)} PDF document(s).")
            else:
                print(f"  [Phase 3] Found {len(pdf_pool)} PDF(s) — pdfplumber not installed, skipping.")
                print("            Install with: pip install pdfplumber")
        else:
            print("  [Phase 3] No PDF documents discovered.")

    return results, report_pages


# ═══════════════════════════════════════════════════════════════
# Chunker
# ═══════════════════════════════════════════════════════════════
def chunk_text(text, chunk_size=600, overlap=100):
    if len(text) <= chunk_size:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start:start + chunk_size])
        start += chunk_size - overlap
        if start + chunk_size >= len(text):
            chunks.append(text[start:])
            break
    return chunks


def build_chunks(results):
    chunks = []
    for r in results:
        url     = r["source"]
        title   = r.get("page_title", "")
        cat     = r.get("category", "general")
        ts      = r.get("crawled_at", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
        label   = title or url.replace("https://gordoncollege.edu.ph/w3/", "").replace("/", " › ").strip()

        split = chunk_text(r["content"], 600, 100)
        for i, chunk in enumerate(split):
            chunks.append({
                "source":       url,
                "label":        label,
                "category":     cat,
                "crawled_at":   ts,
                "chunk_index":  i,
                "total_chunks": len(split),
                "content":      f"[Source: {url}]\n{chunk}",
            })
    return chunks


# ═══════════════════════════════════════════════════════════════
# Post-crawl Validation
# ═══════════════════════════════════════════════════════════════
def validate(chunks, report_pages):
    print("\n  ─── Post-Crawl Validation ─────────────────────")
    issues  = []
    sources = {c["source"] for c in chunks}

    if len(chunks) < 20:
        issues.append(f"Only {len(chunks)} chunks — expected ≥ 20.")

    for url in CRITICAL_URLS:
        if not any(url in s for s in sources):
            issues.append(f"MISSING CRITICAL PAGE: {url}")

    failed  = [p for p in report_pages if p.get("status") == "failed"]
    skipped = [p for p in report_pages if p.get("status") == "skipped"]
    ok      = [p for p in report_pages if p.get("status") == "ok"]

    if issues:
        for iss in issues:
            print(f"  [!] {iss}")
    else:
        print("  [✓] All validation checks passed!")

    print(f"  [✓] {len(chunks)} chunks | {len(ok)} crawled | {len(skipped)} cached/skipped | {len(failed)} failed")
    if failed:
        print("  [!] Failed URLs:")
        for p in failed[:10]:
            print(f"       - {p['url']} ({p.get('reason', '?')})")

    return issues, {"ok": len(ok), "skipped": len(skipped), "failed": len(failed)}


# ═══════════════════════════════════════════════════════════════
# Exporters
# ═══════════════════════════════════════════════════════════════
def save_text_kb(results):
    """
    Save a human-readable and legacy-compatible .txt version of the KB.
    Groups entries by category for better organization.
    """
    print(f"  Generating {TXT_KB_FILE.name}...")
    
    # Sort results by category for grouped output
    results_by_cat = {}
    for r in results:
        cat = r.get("category", "general").upper().replace("_", " ")
        if cat not in results_by_cat:
            results_by_cat[cat] = []
        results_by_cat[cat].append(r)

    source_count = len({r["source"] for r in results})
    
    lines = [
        "=" * 60,
        "GORDON COLLEGE — KNOWLEDGE BASE",
        "Auto-generated by GC Assist Crawler",
        f"Source: {source_count} pages from gordoncollege.edu.ph",
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC",
        "=" * 60,
        ""
    ]

    for cat in sorted(results_by_cat.keys()):
        lines.append("-" * 60)
        lines.append(f"CATEGORY: {cat}")
        lines.append("-" * 60)
        lines.append("")

        for r in results_by_cat[cat]:
            lines.append(f"### Source: {r['source']}")
            if r.get("keywords"):
                lines.append(f"### Keywords: {', '.join(r['keywords'])}")
            lines.append("")
            lines.append(r["content"])
            lines.append("\n")

    with open(TXT_KB_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    
    print(f"  [OK] knowledge_base.txt — {TXT_KB_FILE.stat().st_size / 1024:.1f} KB")


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════
def main():
    args = parse_args()

    print("\n  +=============================================+")
    print("  |   GC ASSIST - Smart Web Crawler  v3.0      |")
    print("  +=============================================+\n")

    if args.force:
        print("  [!] --force: Ignoring cache — all pages will be re-crawled.\n")
        cache = {}
    else:
        cache = load_cache()
        cached_count = len(cache)
        if cached_count:
            print(f"  [i] Cache loaded: {cached_count} page(s) cached from previous run.")
            print("      Unchanged pages will be skipped. Use --force to re-crawl all.\n")

    if not PDF_SUPPORT:
        print("  [i] pdfplumber not found — PDF extraction disabled.")
        print("      Install with: pip install pdfplumber\n")

    sites = load_sites()
    print(f"  Seeds: {len(sites)} | Max depth: {args.depth} | Max pages: {args.max_pages} | Concurrent: {MAX_CONCURRENT}\n")

    start = time.time()
    results, report_pages = asyncio.run(
        crawl_all(sites, cache, args.force, args.depth, args.max_pages)
    )
    elapsed = time.time() - start
    print(f"\n  [OK] Crawl complete: {len(results)} pages in {elapsed:.1f}s")

    # ── Manual entries (optional) ──
    if MANUAL_DATA.exists():
        with open(MANUAL_DATA, "r", encoding="utf-8") as f:
            manual = json.load(f)
        if manual:
            results.extend(manual)
            print(f"  [OK] +{len(manual)} manual entries from manual_data.json")

    # ── Save .txt KB ──
    save_text_kb(results)

    # ── Save cache ──
    save_cache(cache)
    print(f"  [OK] Cache updated: {len(cache)} entries → crawl_cache.json")

    # ── Save report ──
    report = {
        "crawled_at":     datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "elapsed_seconds": round(elapsed, 1),
        "args": {
            "force":     args.force,
            "depth":     args.depth,
            "max_pages": args.max_pages,
        },
        "pages":       report_pages,
    }
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"  [OK] Crawl report saved → crawl_report.json")

if __name__ == "__main__":
    main()
