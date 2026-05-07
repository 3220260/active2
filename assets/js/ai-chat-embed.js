(function () {
  const DEFAULT_CHAT_APP_URL = "https://chat-bot-flame-six.vercel.app/";

  const currentScript = document.currentScript;
  const scriptUrl = currentScript
    ? new URL(currentScript.src)
    : new URL("/assets/js/ai-chat-embed.js", window.location.href);

  const chatUrl = new URL(
    currentScript?.dataset.chatUrl || DEFAULT_CHAT_APP_URL,
    scriptUrl.origin
  );

  const iframeTitle = currentScript?.dataset.title || "Βοηθός Synetelas";

  function initSynetelasChat() {
    if (document.getElementById("synetelas-ai-chat")) return;

    const widget = document.createElement("div");
    widget.id = "synetelas-ai-chat";

    widget.innerHTML = `
      <button class="synetelas-ai-chat-button" type="button" aria-label="Άνοιγμα AI βοηθού">
        <span class="synetelas-ai-chat-bubble">💬</span>
        <span class="synetelas-ai-chat-label">
          <strong>AI Βοηθός</strong>
          <small>Ρώτησέ με εδώ</small>
        </span>
      </button>

      <div class="synetelas-ai-chat-backdrop" hidden></div>

      <section class="synetelas-ai-chat-panel" aria-hidden="true" aria-label="${iframeTitle}">
        <header class="synetelas-ai-chat-header">
          <div>
            <strong>${iframeTitle}</strong>
            <span>Τηλεφωνία, TV, Internet & δικαιολογητικά</span>
          </div>

          <div class="synetelas-ai-chat-actions">
            <button class="synetelas-ai-chat-refresh" type="button" aria-label="Ανανέωση chat">↻</button>
            <button class="synetelas-ai-chat-close" type="button" aria-label="Κλείσιμο chat">×</button>
          </div>
        </header>

        <iframe
          class="synetelas-ai-chat-frame"
          title="${iframeTitle}"
          src="about:blank"
          data-src="${chatUrl.href}"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="microphone; clipboard-write"
        ></iframe>
      </section>
    `;

    document.body.appendChild(widget);

    const openButton = widget.querySelector(".synetelas-ai-chat-button");
    const panel = widget.querySelector(".synetelas-ai-chat-panel");
    const backdrop = widget.querySelector(".synetelas-ai-chat-backdrop");
    const closeButton = widget.querySelector(".synetelas-ai-chat-close");
    const refreshButton = widget.querySelector(".synetelas-ai-chat-refresh");
    const iframe = widget.querySelector(".synetelas-ai-chat-frame");

    let iframeLoaded = false;

    function openChat() {
      panel.classList.add("is-open");
      panel.classList.remove("is-minimized");
      panel.setAttribute("aria-hidden", "false");
      backdrop.hidden = false;
      document.body.classList.add("synetelas-ai-chat-open");

      if (!iframeLoaded) {
        iframe.src = iframe.dataset.src;
        iframeLoaded = true;
      }
    }

    function closeChat() {
      panel.classList.remove("is-open");
      panel.classList.remove("is-minimized");
      panel.setAttribute("aria-hidden", "true");
      backdrop.hidden = true;
      document.body.classList.remove("synetelas-ai-chat-open");
    }

    function minimizeChat() {
      panel.classList.remove("is-open");
      panel.classList.add("is-minimized");
      panel.setAttribute("aria-hidden", "true");
      backdrop.hidden = true;
      document.body.classList.remove("synetelas-ai-chat-open");
    }

    function refreshChat() {
      iframe.src = `${iframe.dataset.src}${iframe.dataset.src.includes("?") ? "&" : "?"}t=${Date.now()}`;
      iframeLoaded = true;
    }

    openButton.addEventListener("click", openChat);
    closeButton.addEventListener("click", closeChat);
    refreshButton.addEventListener("click", refreshChat);
    backdrop.addEventListener("click", closeChat);

    window.addEventListener("message", (event) => {
      if (event.source !== iframe.contentWindow) return;

      if (event.data === "minimizeChat") minimizeChat();
      if (event.data === "restoreChat") openChat();
      if (event.data === "closeChat") closeChat();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && panel.classList.contains("is-open")) {
        closeChat();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSynetelasChat);
  } else {
    initSynetelasChat();
  }
})();