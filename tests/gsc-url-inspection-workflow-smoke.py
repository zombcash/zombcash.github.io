from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
workflow = (ROOT / ".github/workflows/gsc-url-inspection-audit.yml").read_text(encoding="utf-8")

assert "workflow_dispatch:" in workflow, "GSC URL inspection audit must support manual runs"
assert 'cron: "43 6 * * *"' in workflow, "GSC URL inspection audit must run weekly"
assert "GSC_SERVICE_ACCOUNT_JSON" in workflow, "GSC URL inspection audit must use the existing service-account secret"
assert "urlInspection().index().inspect(" in workflow, "GSC URL inspection audit must call Google's URL Inspection API"
assert '"inspectionUrl": url' in workflow and '"siteUrl": site_url' in workflow, "GSC inspection requests must identify both the inspected URL and verified property"
assert "time.sleep(delay)" in workflow and "next_request_at[0] = time.monotonic() + 1.0" in workflow, "GSC inspection requests must be globally paced at one request per second to leave headroom below API quotas"
assert "ThreadPoolExecutor(max_workers=1)" in workflow, "GSC URL inspection must use a single sequential worker to avoid quota bursts"
assert "thread_local.service = build(" in workflow, "Each GSC inspection worker must use its own API client"
assert 'name: gsc-url-inspection-report' in workflow, "GSC URL inspection results must be archived as an Actions artifact"
assert "unique_sitemap_urls" in workflow and "coverage_state" in workflow, "GSC report must preserve per-URL index coverage details"
assert 'default: "50"' in workflow, "GSC URL inspection must default to a small batch"
assert 'requested_limit > 100' in workflow, "GSC URL inspection must cap manual batches at 100"
assert "batch_size = 50" in workflow and "scheduled_batch_index" in workflow, "Scheduled inspections must rotate 50-URL batches over the current sitemap size"
assert "selected_urls = urls[start_index:start_index + url_limit]" in workflow, "GSC batch selection must support resumable start indexes"

assert 'record.get("verdict") or ("ERROR"' in workflow and 'record.get("coverage_state") or ("ERROR"' in workflow, "GSC summary must safely group missing verdict and coverage fields"

print("PASS: GSC URL inspection audit is scheduled, quota-paced, and archives per-URL index results.")
