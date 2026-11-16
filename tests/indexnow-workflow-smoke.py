from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
indexnow = (ROOT / ".github/workflows/indexnow.yml").read_text(encoding="utf-8")
bing = (ROOT / ".github/workflows/bing-webmaster-api.yml").read_text(encoding="utf-8")
pages_smoke = (ROOT / ".github/workflows/sitemap-live-smoke.yml").read_text(encoding="utf-8")
seo_smoke = (ROOT / ".github/workflows/seo-internal-link-fixes-smoke.yml").read_text(encoding="utf-8")

assert 'workflow_run:' in pages_smoke and 'workflows: ["Deploy ZombieCash static site to GitHub Pages"]' in pages_smoke, "The live sitemap smoke must identify the actual Pages deployment workflow"
assert 'workflow_run:' in indexnow and '"Deploy ZombieCash static site to GitHub Pages"' in indexnow, "IndexNow must run after the Pages deployment"
assert 'types:\n      - completed' in indexnow, "IndexNow must wait for deployment completion"
assert 'branches:\n      - main' in indexnow, "IndexNow deployment trigger must be restricted to main"
assert "if: ${{ github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success' }}" in indexnow, "IndexNow must ignore failed deployments"

assert 'workflow_dispatch:' in bing, "Bing report must support manual runs"
assert 'schedule:' in bing and 'cron: "17 6 * * *"' in bing, "Bing report must run on its daily schedule"
assert 'push:' in bing and 'sitemap.xml' in bing and 'robots.txt' in bing, "Bing report must react to sitemap and robots changes"
assert 'workflow_run:' not in bing, "Bing report must not submit feeds after every Pages deployment; avoid repeated sitemap throttling"

assert 'GITHUB_EVENT_NAME" = "workflow_dispatch"' in indexnow, "Manual dispatch must retain the full-sitemap fallback"
assert 'GITHUB_EVENT_NAME" = "workflow_run"' in indexnow, "Successful Pages deployment must submit the full sitemap"
assert 'grep -qx ".github/workflows/indexnow.yml"' in indexnow, "The workflow-fix push must submit the full sitemap once so this correction does not miss the current deployment"
assert 'Collected {len(urls)} unique URL(s) from all sitemaps.' in indexnow, "IndexNow must collect every live sitemap URL"
assert 'https://api.indexnow.org/indexnow' in indexnow, "IndexNow endpoint must remain configured"
assert 'SubmitFeed?' in bing, "Bing workflow must continue submitting all robots.txt sitemap feeds"
assert '.github/workflows/bing-webmaster-api.yml' in seo_smoke, "SEO static smoke must run when Bing workflow changes"
assert 'tests/indexnow-workflow-smoke.py' in seo_smoke and 'python tests/indexnow-workflow-smoke.py' in seo_smoke, "SEO static smoke must execute this regression test"

print("PASS: IndexNow and Bing receive current sitemap URLs after successful GitHub Pages deployment.")
