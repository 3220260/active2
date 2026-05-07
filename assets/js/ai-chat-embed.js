(function () {
  const currentScript = document.currentScript;
  const scriptUrl = currentScript ? new URL(currentScript.src) : new URL("/embed.js", window.location.href);
  const chatUrl = new URL(currentScript?.dataset.chatUrl || "/", scriptUrl.origin);
  const iframeTitle = currentScript?.dataset.title || "Βοηθός Synetelas";

  const host = document.createElement("div");
  host.style.cssText = [
    "position:fixed",
    "right:max(16px,env(safe-area-inset-right,0px))",
    "bottom:max(16px,env(safe-area-inset-bottom,0px))",
    "width:min(460px,calc(100vw - 24px))",
    "height:min(780px,calc(100dvh - 24px))",
    "z-index:2147483647"
  ].join(";");

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
    "position:absolute",
    "inset:0",
    "width:100%",
    "height:100%",
    "border:0",
    "border-radius:22px",
    "z-index:2147483647",
    "box-shadow:0 24px 70px rgba(15,23,42,.22)",
    "background:transparent"
  ].join(";");

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Κλείσιμο συνομιλίας");
  closeBtn.title = "Κλείσιμο";
  closeBtn.textContent = "×";
  closeBtn.style.cssText = [
    "position:absolute",
    "top:-12px",
    "right:-12px",
    "width:34px",
    "height:34px",
    "border:0",
    "border-radius:999px",
    "background:#0f172a",
    "color:#fff",
    "font:700 20px/1 system-ui,-apple-system,Segoe UI,sans-serif",
    "display:grid",
    "place-items:center",
    "cursor:pointer",
    "box-shadow:0 10px 24px rgba(15,23,42,.25)"
  ].join(";");

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.textContent = "Βοηθός Synetelas";
  ].join(";");

  function restoreFrame() {
    frame.style.display = "block";
    frame.style.width = "min(460px,calc(100vw - 24px))";
    frame.style.height = "min(780px,calc(100dvh - 24px))";
    host.style.display = "block";
    host.style.width = "min(460px,calc(100vw - 24px))";
    host.style.height = "min(780px,calc(100dvh - 24px))";
    frame.style.borderRadius = window.innerWidth < 768 ? "0" : "22px";
    launcher.style.display = "none";
  }

  function minimizeFrame() {
    frame.style.width = "280px";
    frame.style.height = "86px";
    host.style.width = "280px";
    host.style.height = "86px";
    frame.style.borderRadius = "999px";
  }

  function closeFrame() {
    frame.style.display = "none";
    host.style.display = "none";
    launcher.style.display = "block";
  }

  });

  launcher.addEventListener("click", restoreFrame);
  closeBtn.addEventListener("click", closeFrame);

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(frame);
    host.appendChild(frame);
    host.appendChild(closeBtn);
    document.body.appendChild(host);
    document.body.appendChild(launcher);
    restoreFrame();
  });