# Outbreak Transmission — Editorial Operating Guide

Last reviewed: 2026-10-27
Site: https://zombcash.github.io/
Editorial archive: https://zombcash.github.io/outbreak-transmission.html

## Purpose
Publish useful, source-grounded explainers and market reports. Favor two strong articles each week over filler. Never present sponsored content as independent analysis, make unsupported accusations, invent market data, or promise returns.

## Article categories
- Meme Coin Analysis: explain what a token's observable metrics do and do not show.
- Scam Alerts: explain schemes and verifiable warning signals; do not label a named project a scam without strong documented evidence.
- Security Guides: repeatable wallet, transaction, domain and on-chain checks.
- Market Notes: a specific event with timestamp, observation window, primary sources, what changed, implications, and limitations.

## Publish checklist
1. Answer one concrete reader question.
2. Separate observation, interpretation and unknowns.
3. Use primary sources first: official Solana docs, explorer transactions/accounts, and market-data pages for the exact pair.
4. Include publication date and, for volatile data, the timestamp/time window checked.
5. State the sample, chain, pool/pair and metric definition when reporting numbers.
6. Explain source limitations; a score, scanner or snapshot cannot guarantee token safety or prove intent.
7. Link to 1–3 existing relevant ZombieCash pages and confirm URLs exist before publishing.
8. Give the article one next action and a related guides block.
9. Include canonical metadata and Article JSON-LD consistent with the URL and title; update hreflang only where real translations exist.
10. Check desktop and mobile rendering, navigation, external links, and UTM URLs.
11. If facts change materially, update the body and dateModified; preserve the original publication date.

## First-month schedule
Dates are editorial targets, not claims that articles are already published.

| Target date | Category | Working title | Practical outcome |
|---|---|---|---|
| 2026-10-28 | Meme Coin Analysis | How to Check a Memecoin Before You Buy | Repeatable pre-buy checks |
| 2026-10-30 | Scam Alerts | Rug Pull Warning Signs: 7 Checks Before You Buy | Risk indicators and limits |
| 2026-11-01 | Security Guides | Wallet Security: Five Red Flags Before You Sign | Prevent seed phrase theft and unsafe signatures |
| 2026-11-04 | Market Notes | Liquidity Is Not Market Cap | Explain executable liquidity using sourced examples |
| 2026-11-06 | Scam Alerts | Fake Token Websites and Impersonation | Domain and token identity checks |
| 2026-11-08 | Security Guides | Mint and Freeze Authority Explained | Explain capabilities and trade-offs |
| 2026-11-11 | Meme Coin Analysis | Reading Volume, Buys and Sells | Read activity without treating it as proof of organic demand |
| 2026-11-13 | Scam Alerts | Liquidity Withdrawal: What the Chain Shows | Examine pool changes with transaction evidence |
| 2026-11-15 | Security Guides | Token-2022 Extensions: What to Inspect | Explain relevant extensions and caveats |
| 2026-11-18 | Market Notes | A Source-Checked Market Event Review | Review one verified event or skip if none merits coverage |
| 2026-11-20 | Security Guides | How to Investigate a Suspicious Token | Evidence worksheet and escalation paths |
| 2026-11-22 | Market Notes | Monthly Outbreak Risk Briefing | Sourced observations and explicit limitations |

## Measurement (existing GA4)
The public site initializes GA4 centrally in shared-nav.js. Do not add a duplicate GA tag without diagnosing the existing implementation first.

Use distinct lowercase UTM values:
- Telegram: utm_source=telegram&utm_medium=social
- X: utm_source=x&utm_medium=social
- Campaign: utm_campaign=outbreak_transmission
- Content: unique stable article slug, e.g. memecoin_prebuy_check, rug_pull_warning_signs, wallet_security_checklist

Review:
- Views per article: page views for the page path.
- Telegram/X visits: Session source / medium and Session campaign / campaign content.
- Engagement: engaged sessions and engagement rate for the relevant landing page/campaign.
- Internal navigation: current shared-nav.js instrumentation and internal navigation events, subject to PR #230 rollout/verification.
- Related-guide clicks: currently not guaranteed to have article-specific events; use available internal navigation events where they expose destination/label, or add a reviewed, privacy-safe event in a future change.
- Returning audience: returning users/retention reports if available; do not claim article-level repeat reading without suitable data.

Views do not prove reading. UTM attribution may be affected by consent, browser privacy, copied/reshared links, referrer stripping and Analytics processing delay. Do not invent numbers; record the reporting period and export date.

## Primary reference starting points
- Solana token docs: https://solana.com/docs/tokens
- Solana Explorer: https://explorer.solana.com/
- DexScreener Solana pairs: https://dexscreener.com/solana
- Google Safe Browsing phishing report: https://safebrowsing.google.com/safebrowsing/report_phish/

## Publishing status
Do not mark Telegram/X content published until a human or verified posting integration confirms delivery. This document is editorial guidance; it does not itself schedule or publish posts.
