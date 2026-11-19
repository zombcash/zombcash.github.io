(() => {
  "use strict";
  const model = document.querySelector("[data-zc-ai-model]");
  const provider = document.querySelector("[data-zc-ai-provider]");
  const mode = document.querySelector("[data-zc-ai-mode]");
  if (!model || !provider || !mode) return;
  const style = document.createElement("style");
  style.textContent = `.zc-ai-engine-card{display:flex;align-items:center;gap:13px;width:min(100%,560px);margin:22px 0 0;padding:13px 15px;border:1px solid #42613b;background:linear-gradient(110deg,#101d13ed,#080e0beF);color:#e9f6e3;text-decoration:none;box-shadow:0 10px 30px #0005;transition:border-color .2s,transform .2s}.zc-ai-engine-card:hover{border-color:#a6ff54;transform:translateY(-2px)}.zc-ai-engine-pulse{width:9px;height:9px;flex:0 0 9px;border-radius:50%;background:#a6ff54;box-shadow:0 0 12px #a6ff54}.zc-ai-engine-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}.zc-ai-engine-copy small{color:#9bff45;font:700 8px/1.3 Orbitron,system-ui,sans-serif;letter-spacing:1.2px}.zc-ai-engine-copy strong{color:#f0f7eb;font:700 13px/1.35 Rajdhani,system-ui,sans-serif;overflow-wrap:anywhere}.zc-ai-engine-copy em{color:#8fa38a;font:500 11px/1.3 Rajdhani,system-ui,sans-serif;font-style:normal}.zc-ai-engine-live{flex:0 0 auto;padding:5px 7px;border:1px solid #42613b;color:#a6ff54;font:700 8px/1 Orbitron,system-ui,sans-serif;letter-spacing:.6px}@media(max-width:680px){.zc-ai-engine-card{margin-top:17px;padding:11px 12px}.zc-ai-engine-copy strong{font-size:12px}.zc-ai-engine-live{font-size:7px}}`;
  document.head.append(style);
  async function refresh() {
    try {
      const response = await fetch("https://zombcash-bot.fadehost.app/api/assistant/status", {cache:"no-store"});
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
    }
  }
  refresh();
  window.setInterval(refresh, 15000);
})();