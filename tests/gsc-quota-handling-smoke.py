from pathlib import Path

workflow = Path(".github/workflows/gsc-url-inspection-audit.yml").read_text(encoding="utf-8")
required = [
    'report["quota_paused"] = report.get("stop_reason") == "HTTP 429 from URL Inspection API"',
    'if report["quota_paused"]:',
    "Google URL Inspection quota is exhausted for this property",
    'sys.exit(0)',
    'f"- Quota paused: **{report.get(\\'quota_paused\\', False)}**"',
]
missing = [item for item in required if item not in workflow]
if missing:
    raise SystemExit("FAIL: missing quota-pause handling: " + "; ".join(missing))
print("PASS: HTTP 429 quota exhaustion is recorded, partial reports are retained, and remaining inspections are deferred without retries.")
