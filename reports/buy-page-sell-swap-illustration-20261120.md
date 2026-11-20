# Buy ZOMBCASH — Sell / Swap guide illustration

- Date: 2026-11-20
- Page: https://zombcash.github.io/buy-zombcash.html
- Section: `04 // SELL OR SWAP OUT`

## Change
Added a original ZombieCash survival-noir PNG illustration to the previously empty sell/swap guide card. The artwork depicts a rugged survivor swap terminal, ZOMBCASH and SOL token symbols, swap arrows, and a secure wallet against a ruined-city backdrop.

## Implementation
- Asset: `images/sell-swap-terminal.png`
- Embedded in the existing section below its explanatory paragraph.
- Responsive width with natural aspect ratio (1602×981); no fixed height or cropping.
- Lazy loading and descriptive alt text.
- Added a caption reinforcing output asset, route, price impact, and minimum-received checks.

## Scope and safety
Only `buy-zombcash.html`, the original PNG asset, and this audit report are changed. No wallet, Jupiter widget, swap logic, token details, navigation, or other pages changed. No transactions or wallet connections performed. `zombcash-world` was not modified.

## Validation
- Source confirms the PNG asset path and image element are present; the previous SVG placeholder is no longer referenced.
- The image uses `width:100%; height:auto` and preserves its 1602×981 ratio.
- Live browser visual verification remains pending after merge and GitHub Pages deployment.

## Git
- Branch: `feature/sell-swap-guide-illustration-20261120`
- Illustration replacement commit: `d4d4fed410931a0fb5e5057b6ac380cead634c1e`
