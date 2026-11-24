#!/usr/bin/env python3
"""Verify every managed sitemap lastmod equals the latest Git commit for its HTML page."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from update_sitemap_lastmod import refresh

refresh(check_only=True)
