(() => {
  "use strict";
  const model = document.querySelector("[data-zc-ai-model]");
  const provider = document.querySelector("[data-zc-ai-provider]");
  const mode = document.querySelector("[data-zc-ai-mode]");
  if (!model || !provider || !mode) return;
  let refreshing = false;
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      const response = await fetch("https://zombcash-bot.fadehost.app/api/assistant/status", {
        cache: "no-store",
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error("status unavailable");
      const data = await response.json();
      const hasSuccess = Number.isFinite(Number(data.updated_at)) && Number(data.updated_at) > 0;
      const age = hasSuccess ? Math.max(0, Math.floor(Date.now() / 1000 - Number(data.updated_at))) : null;
      const stale = age !== null && age > 300;
      const providerName = data.provider || (data.configured_primary ? "Google Gemini" : data.configured_fallback ? "Pollinations" : "No provider");
      const modelName = data.model || data.configured_primary || data.configured_fallback || "Not reported";
      model.textContent = modelName;
      if (hasSuccess) {
        provider.textContent = "Last successful response: " + providerName + (stale ? " · last success " + Math.floor(age / 60) + " min ago" : " · recently confirmed");
        mode.textContent = stale ? "STALE" : "LAST OK";
        mode.title = "Last successful response only; this is not a live health check.";
      } else {
        provider.textContent = "Configured only — no successful response recorded since this process started";
        mode.textContent = "UNVERIFIED";
        mode.title = "Provider configuration is not proof that requests are currently succeeding.";
      }
    } catch (_) {
      model.textContent = "STATUS UNAVAILABLE";
      provider.textContent = "Could not reach the assistant status endpoint";
      mode.textContent = "OFFLINE";
      mode.title = "The status endpoint could not be reached.";
    } finally {
      refreshing = false;
    }
  }
  refresh();
  window.setInterval(refresh, 15000);
})();