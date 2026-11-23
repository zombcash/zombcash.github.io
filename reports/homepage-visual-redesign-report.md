# Homepage Visual Redesign Report

**Date:** 2026-11-23  
**Status:** IMPLEMENTED — STATIC CHECKS PASS; FINAL VISUAL WORKFLOWS PENDING  
**Issue:** #655 — Cinematic ZombieCash homepage redesign  
**Repository:** zombcash/zombcash.github.io  
**Branch:** feat/homepage-cinematic-redesign  
**PR:** https://github.com/zombcash/zombcash.github.io/pull/656

## 1. Summary

The redesign adds a cinematic, dark survival visual layer while retaining the existing homepage content, multilingual navigation, SEO metadata, and interactive sections.

During final QA, a destructive regression was found in the eight localized homepage files: the PR version had removed the sections after the promo-video block. The localized pages were restored from the PR base commit and the redesign changes were reapplied without dropping existing content.

## 2. Changes

1. Added the cinematic palette, typography, hero treatment, card styling, focus states, reduced-motion handling, and responsive refinements in `homepage-visual.css`.
2. Added the project-owned survivor artwork slot to all nine homepages.
3. Named the artwork wrapper `.zc-hero-art-panel` so it is not confused with the separate Adsterra sponsor/ad container used by the responsive smoke test.
4. Replaced Wikimedia hero preload references with the local project asset `/assets/zombcash-survivor-640.avif`; removed Wikimedia preconnects from all nine homepage documents.
5. Updated the homepage visual stylesheet cache version to `cinematic-redesign-20261123-1`.
6. Restored all existing localized homepage sections and their scripts, including ZombieCash TV, Living World, Outbreak, Radar, Community Console, Snake Game, community, visitor and campaign sections.
7. Updated the sitemap lastmod entry for `index.html`.
8. Updated the Core Web Vitals static smoke test to expect the local hero preload asset instead of the retired Wikimedia URL.

## 3. Files Changed

- `homepage-visual.css` — cinematic visual layer, local assets, scoped selectors, art-panel layout.
- `index.html` — artwork panel, stylesheet cache version, local hero preload.
- `de/index.html` through `hi/index.html` — restored full localized pages with artwork panel and local hero preload.
- `sitemap.xml` — homepage lastmod.
- `tests/cwv-static-smoke.cjs` — assertion updated for the local hero asset.
- `reports/homepage-visual-redesign-report.md` — this report.

## 4. Static and CI Checks

| Check | Run | Result |
| --- | ---: | --- |
| Homepage visual refresh smoke checks | #131 | PASS |
| Core Web Vitals Static Guard | #113 | PASS |
| SEO internal-link fix static smoke | #515 | PASS |
| AI Worlds Smoke Tests | #154 | PASS |
| Sitemap lastmod refresh | #21 | PASS |
| Local branch visual QA | #243 | PENDING |
| Mobile viewport smoke test | #1763 | PENDING |

The passing homepage smoke confirms all nine locales have the expected language tags, canonical/hreflang metadata, stylesheet, ticker, and survivor artwork. The Core Web Vitals guard confirms deferred Jupiter loading, lazy TV artwork, promo video preload behavior, and the local hero preload asset.

Additional source inspection:
- All nine homepage documents contain zero `upload.wikimedia.org` references.
- All nine pages retain the key homepage sections and the language-specific navigation.
- `homepage-visual.css` has balanced braces (724 opening / 724 closing).
- No standalone broad `.card` or `p` selector was found in the stylesheet.

## 5. Browser Verification and Limitations

The deployed-site check previously covered a 1345px viewport, with no horizontal overflow or JavaScript console errors. That deployed site still served the pre-redesign CSS at the time, so it is not evidence of the new CSS in production.

Playwright is installed by the GitHub Actions visual QA workflow. The first branch visual run exposed a test-classification issue: the new artwork wrapper reused the Adsterra sponsor-panel class, causing the ad-specific assertions to run against an artwork-only panel. The wrapper and related CSS selectors were renamed to `.zc-hero-art-panel`. The next visual QA and mobile viewport runs are pending.

Full acceptance requires those two pending workflows to complete successfully. No merge has been performed.

## 6. Verified Code Snapshot

- Branch: `feat/homepage-cinematic-redesign`
- Code SHA before this report-only update: `a3bee5637ad37320e15de5398dd93e340497a037`
- PR: https://github.com/zombcash/zombcash.github.io/pull/656
- `zombcash-world` was not modified.
