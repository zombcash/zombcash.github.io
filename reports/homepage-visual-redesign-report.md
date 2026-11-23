# Homepage Visual Redesign Report

**Date:** 2026-11-23  
**Status:** COMPLETED — all seven required CI workflows passed on the final code snapshot.  
**Issue:** #655 — Cinematic ZombieCash homepage redesign  
**Repository:** zombcash/zombcash.github.io  
**Branch:** feat/homepage-cinematic-redesign  
**PR:** https://github.com/zombcash/zombcash.github.io/pull/656

## 1. Summary

The redesign adds a cinematic, dark survival visual layer while preserving existing homepage content, navigation, SEO metadata, and localization.

Final QA found and corrected two regressions before acceptance:
- The eight localized homepage files in the PR had been truncated after the promo-video section. Their full content was restored from the PR base commit, then the visual stylesheet and survivor artwork slot were reapplied.
- The artwork-only wrapper reused the Adsterra sponsor-panel class, which incorrectly activated ad-specific responsive assertions. The wrapper and its CSS selectors were renamed to `.zc-hero-art-panel`; the mobile smoke test now asserts the artwork panel separately from ad slots.

## 2. Changes

1. Added the cinematic palette, typography, hero treatment, card styling, focus states, reduced-motion handling, and responsive refinements in `homepage-visual.css`.
2. Added one project-owned survivor artwork slot to each of the nine homepages.
3. Kept the artwork wrapper distinct from the Adsterra ad container using `.zc-hero-art-panel`.
4. Replaced Wikimedia hero preload references with the local project asset `/assets/zombcash-survivor-640.avif` and removed Wikimedia preconnects from all nine homepage documents.
5. Updated the homepage visual stylesheet cache version to `cinematic-redesign-20261123-1`.
6. Restored all existing localized homepage sections and scripts, including ZombieCash TV, Living World, Outbreak, Radar, Community Console, Snake Game, community, visitor and campaign sections.
7. Updated the sitemap lastmod entry for `index.html`.
8. Updated Core Web Vitals and mobile responsive smoke tests to validate the local hero asset and distinguish artwork from ad slots.

## 3. Files Changed

- `homepage-visual.css` — cinematic visual layer, local assets, art-panel layout and scoped selectors.
- `index.html` — artwork panel, stylesheet cache version and local hero preload.
- `de/index.html` through `hi/index.html` — full localized pages restored with artwork panel and local hero preload.
- `sitemap.xml` — homepage lastmod.
- `tests/cwv-static-smoke.cjs` — assertion updated for the local hero preload asset.
- `tests/mobile-viewport-smoke.cjs` — explicit survivor-art assertion, separate from Adsterra ad-slot checks.
- `reports/homepage-visual-redesign-report.md` — final QA report.

## 4. CI Results

| Check | Run | Result |
| --- | ---: | --- |
| Homepage visual refresh smoke checks | #137 | PASS |
| Core Web Vitals Static Guard | #119 | PASS |
| SEO internal-link fix static smoke | #521 | PASS |
| AI Worlds Smoke Tests | #160 | PASS |
| Sitemap lastmod refresh | #27 | PASS |
| Local branch visual QA | #249 | PASS |
| Mobile viewport smoke test | #1769 | PASS |

## 5. Browser and Responsive QA

Playwright ran in GitHub Actions against a local preview of this PR branch.

- Homepage visual QA passed across all nine locales, including desktop and mobile layouts, language selector visibility, navigation labels, and horizontal-overflow checks.
- Mobile viewport smoke passed at **320, 360, 375, 390, 430, 768, 1024 and 1440px**.
- Local branch visual QA passed ZombieCash TV desktop/tablet/mobile layout, localized article pages, Survivor Field Manual, multilingual comparison article, and language persistence/fallback routing.
- The separate mobile suite passed homepage layouts across locales, reduced-zoom layouts, ZombieCash TV, Survivor Hub localization/navigation, and Arcade dynamic-record/progress checks.
- Screenshot and diagnostic artifacts were uploaded by the successful GitHub Actions runs.

The earlier deployed-site check at 1345px was performed against the old deployed CSS and is retained only as historical context; the new CSS was validated through the branch-local Playwright preview.

## 6. Source Integrity Checks

- All nine homepage documents contain zero `upload.wikimedia.org` references.
- All nine pages contain exactly one `.zc-hero-art-panel` and one `.zc-sponsor-art-slot`.
- All nine pages retain their locale tags, canonical/hreflang metadata, homepage ticker, deferred Jupiter loader, lazy TV artwork, and key homepage sections.
- `homepage-visual.css` has balanced braces (724 opening / 724 closing).
- No standalone broad `.card` or `p` selector was found in the stylesheet.
- `zombcash-world` was not modified.

## 7. Verified Code Snapshot

- Branch: `feat/homepage-cinematic-redesign`
- Code snapshot before final CSS cleanup: `f2b34bfe184f935efe656c3501da42afcabc7726`.
- Follow-up CSS cleanup commit: `16c547327322b2f044aa2173a5800234ac0ffca2`.
- Final code snapshot and all seven CI workflows were verified on PR head `7858f3f647cc29f6c775232eb96628bfb7f319a5`.
- PR: https://github.com/zombcash/zombcash.github.io/pull/656

**Snake iframe:** The Snake iframe is present in `arcade.html` and retains its `index.html?arcadeSnake=1#snake-game` source, load handler, start/key/fullscreen message bridge, and same-origin result handling. The current browser suite passes Arcade dynamic records and AI Worlds, but does not independently launch the Snake iframe; the historical iframe timeout is therefore not certified as fixed by this PR's QA.

**Merge status:** PR remains open and unmerged. No merge was performed. `zombcash-world` was not modified.
