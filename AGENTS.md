# ZombieCash repository working rules

## Scope and safety
- Website tasks belong in `zombcash/zombcash.github.io`. Never modify `zombcash-world`.
- Never expose, print, commit, or overwrite secrets, tokens, private keys, or local configuration.
- Inspect current `main` and target files before editing. Preserve unrelated changes.

## One task, one atomic commit
- Group all files and all eight localized variants for one logical task into one commit.
- Prefer existing generators for localized pages; update the English source and generator instead of hand-editing repeated locale files.
- Never create a sequence of one-file commits for one task.
- Review the complete diff and confirm no unrelated files are included before committing.
- Do not start another run for the same task while a generator or workflow is still writing. Wait, fetch latest `main`, reconcile, then continue.
- Never force-push, rewrite history, or delete commits from `main` as cleanup.

## Required validation
- Run relevant static checks and browser smoke tests before calling work complete.
- Gallery: Python compilation, `tests/gallery-feature-static-smoke.py`, `tests/gallery-discovery-smoke.cjs`; verify root plus all eight localized pages, asset versions, canonical/hreflang and image sitemap.
- Homepage/navigation/sponsor/responsive: run `tests/mobile-viewport-smoke.cjs`; inspect complete logs and artifacts for every failed viewport.
- A commit on `main` is not proof of completion. Verify GitHub Actions checks and the published page after deployment.
- On failure, inspect the job log and fix the actual cause before starting another related feature.
- Distinguish cancelled checks (superseded runs) from failed checks (build/test errors); neither is a successful validation.

## Automation discipline
- Keep one authoritative generator/workflow per generated output. Avoid overlapping workflows that both commit the same files.
- Use narrow path filters so unrelated workflows do not run on every change.
- Generated-file commits must be idempotent: if output is unchanged, exit without committing.
- Batch edits so GitHub Pages deployments and live-site checks are not repeatedly cancelled by rapid commits.
- After automation changes, verify triggers, permissions, concurrency policy, and the resulting run.

## Completion report
- Report the exact commit, files changed, passed/failed/cancelled checks, and anything still awaiting deployment or browser confirmation.
