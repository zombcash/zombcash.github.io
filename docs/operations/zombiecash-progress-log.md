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
