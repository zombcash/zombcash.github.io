from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
indexnow = (ROOT / ".github/workflows/indexnow.yml").read_text(encoding="utf-8")
bing = (ROOT / ".github/workflows/bing-webmaster-api.yml").read_text(encoding="utf-8")
pages_smoke = (ROOT / ".github/workflows/sitemap-live-smoke.yml").read_text(encoding="utf-8")
seo_smoke = (ROOT / ".github/workflows/seo-internal-link-fixes-smoke.yml").read_text(encoding="utf-8")

assert 'workflow_run:' in pages_smoke and 'workflows: ["Deploy ZombieCash static site to GitHub Pages"]' in pages_smoke
assert 'workflow_run:' in indexnow and '"Deploy ZombieCash static site to GitHub Pages"' in indexnow
assert 'types:\n      - completed' in indexnow
assert 'branches:\n      - main' in indexnow
assert "if: ${{ github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success' }}" in indexnow

assert 'workflow_dispatch:' in bing
assert 'schedule:' in bing and 'cron: "17 6 * * *"' in bing
assert 'push:' in bing and 'sitemap.xml' in bing and 'robots.txt' in bing
assert 'workflow_run:' not in bing

assert 'GITHUB_EVENT_NAME" = "workflow_dispatch"' in indexnow
assert 'GITHUB_EVENT_NAME" = "workflow_run"' in indexnow
assert "grep -Eq" in indexnow and r"robots\.txt|sitemap\.xml|sitemap-" in indexnow
assert 'Collected {len(urls)} unique URL(s) from all sitemaps.' in indexnow
assert 'https://api.indexnow.org/indexnow' in indexnow
assert 'SubmitFeed?' in bing
assert '"fetched_urls": "GetFetchedUrls"' in bing
assert '"GetUrlInfo?"' in bing and '"GetChildrenUrlInfo?"' in bing
assert 'domain:zombcash.github.io' in bing
assert '.github/workflows/bing-webmaster-api.yml' in seo_smoke
assert 'tests/indexnow-workflow-smoke.py' in seo_smoke and 'python tests/indexnow-workflow-smoke.py' in seo_smoke

print("PASS: IndexNow refresh runs after successful Pages deployment, manual runs, and sitemap changes; ordinary HTML pushes stay scoped.")
