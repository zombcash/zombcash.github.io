from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
indexnow = (ROOT / ".github/workflows/indexnow.yml").read_text(encoding="utf-8")
gallery = (ROOT / ".github/workflows/sync-gallery-image-seo.yml").read_text(encoding="utf-8")

assert 'name: Sync gallery image SEO assets' in gallery, "Gallery generator workflow name changed"
assert 'workflows:\n      - "Sync gallery image SEO assets"' in indexnow, "IndexNow must listen for the gallery SEO generator"
assert 'types:\n      - completed' in indexnow, "IndexNow must run after the generator completes"
assert 'branches:\n      - main' in indexnow, "The workflow_run trigger must be restricted to main"
assert "if: ${{ github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success' }}" in indexnow, "Failed gallery runs must not trigger IndexNow"
assert 'fetch-depth: 0' in indexnow, "IndexNow needs full history to diff generated pages"
assert 'WORKFLOW_RUN_BEFORE="${{ github.event.workflow_run.head_sha }}"' in indexnow, "workflow_run must use its triggering commit as the diff base"
assert 'git fetch origin main' in indexnow and 'AFTER="$(git rev-parse origin/main)"' in indexnow, "workflow_run must compare against the generated commit on main"
assert 'git diff --name-only --diff-filter=AMDR "$BEFORE" "$AFTER"' in indexnow, "IndexNow must enumerate changed files between the two commits"
assert 'case "$path" in' in indexnow and '*.html|*/index.html)' in indexnow, "Only changed HTML pages should be submitted"
assert 'GITHUB_EVENT_NAME" = "workflow_dispatch"' in indexnow, "Manual dispatch must retain the full-sitemap fallback"

print("PASS: IndexNow receives generated gallery HTML changes after the gallery SEO workflow completes.")
