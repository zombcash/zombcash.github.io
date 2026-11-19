# ZombieCash Operations Progress Log

## 2026-11-19 — Zombie Sniper fullscreen and results refresh

### Website: `zombcash.github.io`
- User supplied a 1600×900 screenshot showing the fullscreen terminal ending around y=772 with unused viewport space below it.
- Root cause found in `sniper-demo.js`: the fullscreen CSS Grid defines seven explicit rows for a dashboard with an additional trailing child. The implicit auto-sized row can consume leftover viewport height.
- Fix merged in PR [#511](https://github.com/zombcash/zombcash.github.io/pull/511), merge commit `7e01e0ac25edc6fd0b2823ee626611ebbdce4e6f`: set `grid-auto-rows:0!important` in fullscreen layout to prevent the implicit row from stretching.
- Added a visible `REFRESH RESULTS` control. It pulls the authenticated paper-position ledger, refreshes market quotes, recalculates P/L, and rerenders positions and KPI cards.
- Automatic refresh now runs every 10 seconds while the page is visible and immediately after returning to the tab.
- Cache-busting update merged in PR [#512](https://github.com/zombcash/zombcash.github.io/pull/512), merge commit `c29f1a02ac98d23fe4b2ef9c25762d1ef8d87c91`: script URL changed to `sniper-demo.js?v=sniper-fullscreen-refresh-v10-20261119`.
- Source changes are merged. A fresh visual/browser check at 1600×900 is still pending; do not mark the fullscreen issue visually verified until that check is completed.

### Bot and launch aggregator
- FadeHost app `zombcash-bot` was checked and reported `running`.
- Live runtime logs show repeated `[Sniper] Launch event stored` records for Pump.fun `create` and `migrate` events during this check. The launch aggregator is actively receiving and storing launch events.
- The SOI collection scheduler reported one skipped run because its maximum number of running instances was already reached. Investigate collection duration/overlap before changing its cadence.
- News worker continues to log `JSONDecodeError` at `news_worker.py:531` in `prepare_post`; separate from Sniper aggregation, but remains an outstanding bot reliability issue.
- No changes were made to the bot during this task; no live trading was enabled.

### Next actions
1. Verify deployed fullscreen geometry and repeat open/close/Escape cycles at 1600×900.
2. Verify manual refresh updates P/L and position history while auto mode is paused, and when the browser tab returns from background.
3. Inspect why registered paper-position records and the dashboard counters can diverge; reconcile server ledger, API response, and UI state before changing entry thresholds.
4. Measure launch-to-first-trade coverage and actual paper entries over time. Preserve PAPER mode.
5. Investigate SOI collection overlap and the independent news-worker JSON parsing failure.

## 2026-11-19 — Short-viewport fullscreen panel sizing (PR #513)

- Reviewed the user's fresh 1600×900 screenshot. The browser content viewport is under 760px tall because Chrome's tabs/toolbars/taskbar are outside the page viewport.
- Confirmed the active `@media(max-height:760px)` fullscreen rule reserved a 76px sixth grid row for the journal panel even while the Sniper tab hides that panel. This left unused space below the three main columns.
- PR [#513](https://github.com/zombcash/zombcash.github.io/pull/513) changes that unused row from 76px to 0px and adds an 8px top offset to the three-column workspace, keeping the columns stretched to the available bottom edge.
- Bumped `buy-zombcash.html` script cache key to `sniper-short-viewport-fill-v11-20261119`.
- PR is open and its SEO smoke workflow is still running. Do not report deployed or visually verified until merged, deployment succeeds, and the user/browser confirms the new geometry.
- No trading rules, PAPER settings, bot cadence, or `zombcash-world` repository were changed.


## 2026-11-19 — Smooth price chart rendering (PR #514)

- Reproduced the user's report against the live source: the chart was rendered as an SVG `polyline`, so each quote interval appeared as a sharp straight segment; position refresh cadence is 10 seconds.
- Replaced the presentation line with a bounded Catmull–Rom cubic Bezier path. The recorded `priceHistory` samples remain unchanged; only the visual path is smoothed, so raw observations remain suitable for later analysis.
- Corrected the chart label from `LIVE · 20 SEC` to `LIVE · 10 SEC`, matching the existing quote refresh interval.
- Updated `buy-zombcash.html` cache key to `sniper-smooth-chart-v12-20261119`.
- PR [#514](https://github.com/zombcash/zombcash.github.io/pull/514) merged as `1f252a7fd79d7e9ed995117c2a615d8a933f51b4`. GitHub Pages deployment workflow was queued at the time of this log entry; confirm completion before asking for a browser hard refresh.
- No entry thresholds, position limits, PAPER mode, aggregator cadence, or bot code changed. No live trading enabled.
