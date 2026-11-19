# ZombieCash AI engine status correction

Date: 2026-11-20

## Observed issue
The home-page engine card described Pollinations as currently serving the assistant based on the in-memory last-success state. The floating chat badge similarly presented a configured/previously successful provider as if it were a live status. During an app restart or a failed current request, this could contradict the chat's actual error response.

## Verified runtime behavior
- `GET /api/assistant/status` returned HTTP 200.
- A direct `POST /api/assistant/chat` test initially reached a FadeHost ingress error while the application was not listening on port 8080.
- A repeated direct chat test returned HTTP 200 with a valid reply from Pollinations model `openai/gpt-5.4-nano`.
- Runtime logs show Gemini news-model quota failures followed by successful selection of Pollinations for news enrichment. This is separate from, but consistent with, Pollinations availability.

## Changes in this PR
- Home-page engine card now says **Last successful response**, not that a provider is currently serving.
- Last-success age is displayed; after five minutes the state is marked stale.
- If the process has no successful response timestamp, the card says configuration is unverified rather than presenting a provider as live.
- Floating assistant badge shows a pending state while a request is in progress and a clear request-failed state after an error.
- Successful chat responses continue to update the badge with the actual provider and model returned by the API.
- Status refresh interval reduced to 15 seconds.

## Scope and limitations
- This is a truthful last-success indicator, not a synthetic uptime probe. A successful earlier request cannot guarantee the next request will succeed.
- No API keys or secrets were changed.
- No repository other than the ZombieCash website repository was modified.
- No production deployment has been performed by this PR; deployment follows the repository's normal GitHub Pages publishing workflow after merge.

## Validation
- Source-level change inspection completed.
- Direct production chat endpoint verified successful after a transient FadeHost startup failure.
- Browser visual verification of the updated labels remains pending deployment.
