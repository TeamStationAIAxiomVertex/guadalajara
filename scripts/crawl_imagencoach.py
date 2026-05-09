import re
import time
import warnings
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning

START_URL = "https://imagencoach.com/"
DOMAIN = "imagencoach.com"
OUT_DIR = Path("docs/sonia-site/raw-crawl/imagencoach")
OUT_DIR.mkdir(parents=True, exist_ok=True)
SITEMAP_URLS = [
    "https://imagencoach.com/sitemap_pages.xml",
    "https://imagencoach.com/imagen-presencia/sitemap.xml",
]

HEADERS = {
    "User-Agent": "TeamStationAI-SoniaSiteCrawler/1.0",
}
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)


def slugify(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    if not path:
        return "homepage"
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", path).strip("-").lower()
    return slug or "homepage"


def clean_text(soup: BeautifulSoup) -> str:
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    text = soup.get_text("\n")
    lines = []
    for line in text.splitlines():
        line = re.sub(r"\s+", " ", line).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


def page_links(soup: BeautifulSoup, base_url: str) -> list[str]:
    links = set()
    for a in soup.find_all("a", href=True):
        href = urljoin(base_url, a["href"])
        parsed = urlparse(href)
        if parsed.netloc.replace("www.", "") == DOMAIN:
            clean = parsed._replace(fragment="", query="").geturl()
            links.add(clean)
    return sorted(links)


def sitemap_links() -> list[str]:
    links = {START_URL}
    for sitemap_url in SITEMAP_URLS:
        try:
            response = requests.get(sitemap_url, headers=HEADERS, timeout=20)
            response.raise_for_status()
        except Exception as exc:
            print(f"FAILED sitemap {sitemap_url}: {exc}")
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        for loc in soup.find_all("loc"):
            href = loc.get_text(strip=True)
            parsed = urlparse(href)
            if parsed.netloc.replace("www.", "") == DOMAIN:
                links.add(parsed._replace(fragment="", query="").geturl())

    return sorted(links)


def crawl():
    queue = sitemap_links()
    seen = set()

    while queue:
        url = queue.pop(0)
        if url in seen:
            continue

        seen.add(url)
        print(f"Crawling {url}")

        try:
            response = requests.get(url, headers=HEADERS, timeout=20)
            response.raise_for_status()
        except Exception as exc:
            print(f"FAILED {url}: {exc}")
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        title = soup.title.get_text(strip=True) if soup.title else ""
        text = clean_text(soup)
        links = page_links(soup, url)

        filename = OUT_DIR / f"{slugify(url)}.md"
        filename.write_text(
            f"# Source URL\n{url}\n\n"
            f"# Page title\n{title}\n\n"
            f"# Raw visible text\n\n{text}\n\n"
            f"# Links found on page\n\n" + "\n".join(f"- {link}" for link in links) + "\n",
            encoding="utf-8",
        )

        for link in links:
            if link not in seen and link not in queue:
                queue.append(link)

        time.sleep(0.5)

    print(f"Done. Captured {len(seen)} pages into {OUT_DIR}")


if __name__ == "__main__":
    crawl()
