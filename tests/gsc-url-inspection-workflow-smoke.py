from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
workflow = (ROOT / ".github/workflows/gsc-url-inspection-audit.yml").read_text(encoding="utf-8")

assert "workflow_dispatch:" in workflow, "GSC URL inspection audit must support manual runs"
assert 'cron: "43 6 * * 0"' in workflow, "GSC URL inspection audit must run weekly"
assert "GSC_SERVICE_ACCOUNT_JSON" in workflow, "GSC URL inspection audit must use the existing service-account secret"
assert "urlInspection().index().inspect(" in workflow, "GSC URL inspection audit must call Google's URL Inspection API"
assert '"inspectionUrl": url' in workflow and '"siteUrl": site_url' in workflow, "GSC inspection requests must identify both the inspected URL and verified property"
assert "time.sleep(0.2)" in workflow, "GSC inspection requests must be paced below the documented per-site quota"
assert 'name: gsc-url-inspection-report' in workflow, "GSC URL inspection results must be archived as an Actions artifact"
assert "unique_sitemap_urls" in workflow and "coverage_state" in workflow, "GSC report must preserve per-URL index coverage details"

print("PASS: GSC URL inspection audit is scheduled, quota-paced, and archives per-URL index results.")
