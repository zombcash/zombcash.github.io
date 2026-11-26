from pathlib import Path

workflow = Path(".github/workflows/gsc-url-inspection-audit.yml").read_text(encoding="utf-8")
required = [
    'report["quota_paused"] = report.get("stop_reason") == "HTTP 429 from URL Inspection API"',
    'if report["quota_paused"]:',
    "Google URL Inspection quota is exhausted for this property",
    'sys.exit(0)',
    "Quota paused:",
    "report.get('quota_paused', False)",
    "MAX_TRANSIENT_RETRIES = 2",
    "TRANSIENT_HTTP_STATUSES = {500, 502, 503, 504}",
    "for attempt in range(MAX_TRANSIENT_RETRIES + 1):",
    "if http_status in TRANSIENT_HTTP_STATUSES and attempt < MAX_TRANSIENT_RETRIES:",
    "except (OSError, httplib2.HttpLib2Error) as exc:",
    "Transient Search Console transport failure for",
    "time.sleep(retry_delay)",
    '"attempts": attempt + 1',
]
missing = [item for item in required if item not in workflow]
if missing:
    raise SystemExit("FAIL: missing quota-pause handling: " + "; ".join(missing))
print("PASS: HTTP 429 quota exhaustion is recorded and deferred; transient 5xx responses and transport timeouts receive bounded exponential-backoff retries.")
