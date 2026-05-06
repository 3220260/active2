(() => {
  const CHAT_APP_URL = "https://chat-bot-flame-six.vercel.app/";

  if (document.getElementById("synetelas-ai-chat")) return;

  const widget = document.createElement("div");
  widget.id = "synetelas-ai-chat";

  widget.innerHTML = `
    <button class="synetelas-ai-chat-button" type="button" aria-label="Άνοιγμα AI βοηθού">
      <span class="synetelas-ai-chat-icon">💬</span>
      <span class="synetelas-ai-chat-text">AI Βοηθός</span>
    </button>

    <section class="synetelas-ai-chat-panel" aria-hidden="true" aria-label="AI Βοηθός">
      <header class="synetelas-ai-chat-header">
        <div>
          <strong>Βοηθός Synetelas</strong>
          <span>Τηλεφωνία, TV, Internet & δικαιολογητικά</span>
        </div>

        <div class="synetelas-ai-chat-actions">
          <button class="synetelas-ai-chat-refresh" type="button" aria-label="Ανανέωση chat">↻</button>
          <button class="synetelas-ai-chat-close" type="button" aria-label="Κλείσιμο chat">×</button>
        </div>
      </header>

      <iframe
        class="synetelas-ai-chat-frame"
        title="Βοηθός Synetelas"
        src="about:blank"
        data-src="${CHAT_APP_URL}"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        allow="clipboard-write"
      ></iframe>

      <a
        class="synetelas-ai-chat-open-new"
        href="${CHAT_APP_URL}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Άνοιγμα σε νέο παράθυρο
      </a>
    </section>
  `;

  document.body.appendChild(widget);

  const openButton = widget.querySelector(".synetelas-ai-chat-button");
  const panel = widget.querySelector(".synetelas-ai-chat-panel");
  const closeButton = widget.querySelector(".synetelas-ai-chat-close");
  const refreshButton = widget.querySelector(".synetelas-ai-chat-refresh");
  const iframe = widget.querySelector(".synetelas-ai-chat-frame");

  let iframeLoaded = false;

  function openChat() {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");

    if (!iframeLoaded) {
      iframe.src = iframe.dataset.src;
      iframeLoaded = true;
    }
  }

  function closeChat() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  }

  function refreshChat() {
    iframe.src = `${iframe.dataset.src}?t=${Date.now()}`;
    iframeLoaded = true;
  }

  openButton.addEventListener("click", openChat);
  closeButton.addEventListener("click", closeChat);
  refreshButton.addEventListener("click", refreshChat);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) {
      closeChat();
    }
  });
})();