from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
indexnow = (ROOT / ".github/workflows/indexnow.yml").read_text(encoding="utf-8")
bing = (ROOT / ".github/workflows/bing-webmaster-api.yml").read_text(encoding="utf-8")
pages_smoke = (ROOT / ".github/workflows/sitemap-live-smoke.yml").read_text(encoding="utf-8")
seo_smoke = (ROOT / ".github/workflows/seo-internal-link-fixes-smoke.yml").read_text(encoding="utf-8")

assert 'workflow_run:' in pages_smoke and 'workflows: ["pages build and deployment"]' in pages_smoke, "The live sitemap smoke must identify the actual Pages deployment workflow"
for name, workflow in (("IndexNow", indexnow), ("Bing Webmaster", bing)):
    assert 'workflow_run:' in workflow and '"pages build and deployment"' in workflow, f"{name} must run after the Pages deployment"
    assert 'types:\n      - completed' in workflow, f"{name} must wait for deployment completion"
    assert 'branches:\n      - main' in workflow, f"{name} deployment trigger must be restricted to main"
    assert "if: ${{ github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success' }}" in workflow, f"{name} must ignore failed deployments"

assert 'GITHUB_EVENT_NAME" = "workflow_dispatch"' in indexnow, "Manual dispatch must retain the full-sitemap fallback"
assert 'GITHUB_EVENT_NAME" = "workflow_run"' in indexnow, "Successful Pages deployment must submit the full sitemap"
assert 'Collected {len(urls)} unique URL(s) from all sitemaps.' in indexnow, "IndexNow must collect every live sitemap URL"
assert 'https://api.indexnow.org/indexnow' in indexnow, "IndexNow endpoint must remain configured"
assert 'SubmitFeed?' in bing, "Bing workflow must continue submitting all robots.txt sitemap feeds"
assert '.github/workflows/bing-webmaster-api.yml' in seo_smoke, "SEO static smoke must run when Bing workflow changes"
assert 'tests/indexnow-workflow-smoke.py' in seo_smoke and 'python tests/indexnow-workflow-smoke.py' in seo_smoke, "SEO static smoke must execute this regression test"

print("PASS: IndexNow and Bing receive current sitemap URLs after successful GitHub Pages deployment.")
