(function () {
  "use strict";

  var ROOT_ID = "synetelas-ai-chat";
  var DEFAULT_CHAT_URL = "https://chat-bot-flame-six.vercel.app/";
  var DEFAULT_TITLE = "Βοηθός Π.Κ.Σ.Α.Α.";
  var DEFAULT_SUBTITLE = "Ρώτησε για προσφορές & διαδικασίες";

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function getConfig() {
    var script = document.currentScript || document.querySelector('script[src*="ai-chat-embed.js"]');

    return {
      chatUrl: script && script.dataset.chatUrl ? script.dataset.chatUrl : DEFAULT_CHAT_URL,
      title: script && script.dataset.title ? script.dataset.title : DEFAULT_TITLE,
      subtitle: script && script.dataset.subtitle ? script.dataset.subtitle : DEFAULT_SUBTITLE,
      openOnLoad: script && script.dataset.openOnLoad === "true"
    };
  }

  function safeUrl(value) {
    try {
      return new URL(value, window.location.href).href;
    } catch (error) {
      return DEFAULT_CHAT_URL;
    }
  }

  function createButton(config) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "synetelas-ai-chat-button";
    button.setAttribute("aria-controls", "synetelas-ai-chat-panel");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Άνοιγμα συνομιλίας με τον βοηθό");

    button.innerHTML =
      '<span class="synetelas-ai-chat-bubble" aria-hidden="true">💬</span>' +
      '<span class="synetelas-ai-chat-label">' +
      "<strong>" + config.title + "</strong>" +
      "<small>" + config.subtitle + "</small>" +
      "</span>";

    return button;
  }

  function createPanel(config) {
    var panel = document.createElement("section");
    panel.id = "synetelas-ai-chat-panel";
    panel.className = "synetelas-ai-chat-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", config.title);
    panel.setAttribute("aria-modal", "false");

    var header = document.createElement("div");
    header.className = "synetelas-ai-chat-header";
    header.innerHTML =
      "<div>" +
      "<strong>" + config.title + "</strong>" +
      "<span>" + config.subtitle + "</span>" +
      "</div>";

    var actions = document.createElement("div");
    actions.className = "synetelas-ai-chat-actions";

    var refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "synetelas-ai-chat-refresh";
    refresh.setAttribute("aria-label", "Ανανέωση συνομιλίας");
    refresh.title = "Ανανέωση";
    refresh.textContent = "↻";

    var close = document.createElement("button");
    close.type = "button";
    close.className = "synetelas-ai-chat-close";
    close.setAttribute("aria-label", "Κλείσιμο συνομιλίας");
    close.title = "Κλείσιμο";
    close.textContent = "×";

    actions.appendChild(refresh);
    actions.appendChild(close);
    header.appendChild(actions);

    var iframe = document.createElement("iframe");
    iframe.className = "synetelas-ai-chat-frame";
    iframe.title = config.title;
    iframe.src = safeUrl(config.chatUrl);
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allow = "clipboard-write; microphone";

    panel.appendChild(header);
    panel.appendChild(iframe);

    return {
      panel: panel,
      iframe: iframe,
      refresh: refresh,
      close: close
    };
  }

  function mountChat() {
    if (document.getElementById(ROOT_ID)) {
      return;
    }

    var config = getConfig();

    var root = document.createElement("div");
    root.id = ROOT_ID;

    var button = createButton(config);
    var panelBundle = createPanel(config);
    var panel = panelBundle.panel;
    var iframe = panelBundle.iframe;
    var refresh = panelBundle.refresh;
    var close = panelBundle.close;

    function openChat() {
      panel.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      document.body.classList.add("synetelas-ai-chat-open");
      window.setTimeout(function () {
        try {
          iframe.focus();
        } catch (error) {}
      }, 50);
    }

    function closeChat() {
      panel.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      document.body.classList.remove("synetelas-ai-chat-open");
      button.focus();
    }

    function toggleChat() {
      if (panel.classList.contains("is-open")) {
        closeChat();
      } else {
        openChat();
      }
    }

    button.addEventListener("click", toggleChat);
    close.addEventListener("click", closeChat);
    refresh.addEventListener("click", function () {
      iframe.src = iframe.src;
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("is-open")) {
        closeChat();
      }
    });

    root.appendChild(panel);
    root.appendChild(button);
    document.body.appendChild(root);

    if (config.openOnLoad) {
      openChat();
    }
  }

  onReady(mountChat);
})();
