# Buy ZOMBCASH page — hero image crop fix

- Date: 2026-11-20
- Page: https://zombcash.github.io/buy-zombcash.html
- Scope: `buy-zombcash.html` only; no wallet, Jupiter, swap, token, navigation, localization, or production behavior changes.

## Finding
The hero image `/images/buy-survivor-process.webp` was forced into a fixed responsive height with `object-fit: cover`. On desktop this cropped the original 1672×941 composition vertically. A separate mobile media rule forced a 250px height, causing the same issue on narrow screens.

## Fix
- Set the hero image to `height: auto` and `max-height: none`.
- Use `object-fit: contain` and centered positioning.
- Removed the fixed 250px mobile height override.
- Preserved the existing image asset, alt text, intrinsic width/height attributes, caption, and lazy loading.

## Source validation
- Confirmed the desktop crop rule is absent on the fix branch.
- Confirmed the mobile fixed-height crop rule is absent.
- Confirmed desktop and mobile rules preserve natural image proportions.
- Confirmed the original hero asset reference remains present.
- No live browser visual check has been performed on the PR branch; GitHub Pages production will not reflect this change until the PR is reviewed and merged.

## Files
- `buy-zombcash.html` — hero image sizing only.
- `reports/buy-page-image-crop-fix-20261120.md` — this report.

## Safety
No transaction was signed, no wallet connected, no swap executed, no production deployment triggered, and `zombcash-world` was not modified.

## Git
- Branch: `fix/buy-page-full-image-20261120`
- Latest source commit before report: `c784627640e3b360738310ffa6506ca05e03b9f8`
