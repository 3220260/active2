(function () {
  const currentScript = document.currentScript;
  const scriptUrl = currentScript ? new URL(currentScript.src) : new URL("/embed.js", window.location.href);
  const chatUrl = new URL(currentScript?.dataset.chatUrl || "/", scriptUrl.origin);
  const iframeTitle = currentScript?.dataset.title || "Βοηθός Synetelas";

  const frame = document.createElement("iframe");
  frame.src = chatUrl.href;
  frame.title = iframeTitle;
  frame.loading = "lazy";
  frame.allow = "microphone";
  frame.style.cssText = [
    "position:fixed",
    "right:max(16px,env(safe-area-inset-right,0px))",
    "bottom:max(16px,env(safe-area-inset-bottom,0px))",
    "width:min(460px,calc(100vw - 24px))",
    "height:min(780px,calc(100dvh - 24px))",
    "border:0",
    "border-radius:22px",
    "z-index:2147483647",
    "box-shadow:0 24px 70px rgba(15,23,42,.22)",
    "background:transparent"
  ].join(";");

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.textContent = "Βοηθός Synetelas";
  launcher.setAttribute("aria-label", "Άνοιγμα συνομιλίας");
  launcher.style.cssText = [
    "position:fixed",
    "right:max(16px,env(safe-area-inset-right,0px))",
    "bottom:max(16px,env(safe-area-inset-bottom,0px))",
    "z-index:2147483647",
    "display:none",
    "border:0",
    "border-radius:999px",
    "padding:14px 18px",
    "background:#12315f",
    "color:#fff",
    "font:800 14px system-ui,-apple-system,Segoe UI,sans-serif",
    "box-shadow:0 18px 42px rgba(15,43,92,.32)",
    "cursor:pointer"
  ].join(";");

  function restoreFrame() {
    frame.style.display = "block";
    frame.style.width = "min(460px,calc(100vw - 24px))";
    frame.style.height = "min(780px,calc(100dvh - 24px))";
    frame.style.borderRadius = window.innerWidth < 768 ? "0" : "22px";
    launcher.style.display = "none";
  }

  function minimizeFrame() {
    frame.style.width = "280px";
    frame.style.height = "86px";
    frame.style.borderRadius = "999px";
  }

  function closeFrame() {
    frame.style.display = "none";
    launcher.style.display = "block";
  }

  window.addEventListener("message", (event) => {
    if (event.source !== frame.contentWindow) return;
    if (event.data === "minimizeChat") minimizeFrame();
    if (event.data === "restoreChat") restoreFrame();
    if (event.data === "closeChat") closeFrame();
  });

  launcher.addEventListener("click", restoreFrame);

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(frame);
    document.body.appendChild(launcher);
    restoreFrame();
  });
})();