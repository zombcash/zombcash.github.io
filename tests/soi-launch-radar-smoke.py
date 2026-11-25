from collections import Counter
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]


def test_market_data_soi_ids_are_unique_and_controls_exist():
    html = (ROOT / "zombcash-market-data.html").read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    ids = [node.get("id") for node in soup.select("[id]")]
    duplicates = sorted(key for key, count in Counter(ids).items() if count > 1)
    assert not duplicates, f"Duplicate IDs on SOI Market Data page: {duplicates}"

    for required in (
        "soi-status", "soi-refresh", "soi-count", "soi-buys",
        "soi-sells", "soi-pools", "soi-observations", "soi-launches",
        "soi-history", "soi-coverage",
    ):
        assert soup.find(id=required), f"Missing SOI element: {required}"

    assert soup.select_one('script[src^="/soi-launch-radar.js"]')
    assert soup.select_one('[data-soi-filter="all"]')
    assert soup.select_one('[data-soi-filter="promoted"]')


def test_soi_dashboard_supports_all_site_locales():
    source = (ROOT / "soi-launch-radar.js").read_text(encoding="utf-8")
    for locale in ("en", "de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi"):
        assert f'"{locale}":{{' in source or f'"{locale}": {{' in source
    for label in ("snapshotCoverage", "lastSnapshot", "profileObserved", "details"):
        assert f'"{label}":' in source


def test_soi_503_uses_translated_paused_state_on_all_market_data_pages():
    source = (ROOT / "soi-launch-radar.js").read_text(encoding="utf-8")
    assert source.count('"notPublished":') == 9
    assert 'if(response.status===503)' in source
    assert 'status.dataset.state="paused"' in source
    assert 'set("soi-status",T.notPublished)' in source

    version = "20261125-soi-paused-state-1"
    for locale in ("en", "de", "fr", "it", "ja", "zh-CN", "ru", "tr", "hi"):
        page = ROOT / ("zombcash-market-data.html" if locale == "en" else locale / "zombcash-market-data.html")
        soup = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
        script = soup.select_one('script[src^="/soi-launch-radar.js"]')
        assert script and version in script.get("src", ""), f"{locale}: stale SOI script cache key"
        assert '.soi-status[data-state="paused"]' in page.read_text(encoding="utf-8"), f"{locale}: missing paused-state styling"
