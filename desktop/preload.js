const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("revatourDesktop", {
  isDesktop: true,
  shrink: () => ipcRenderer.send("rv-shrink"),
  expand: () => ipcRenderer.send("rv-expand"),
  quit: () => ipcRenderer.send("rv-quit"),
  menu: () => ipcRenderer.send("rv-menu")
});

// A small "Back to clock" button on every page of the full app
window.addEventListener("DOMContentLoaded", () => {
  if (document.title === "Revatour clock" || !/^(https?|file):$/.test(location.protocol)) return;
  const b = document.createElement("button");
  b.id = "rv-back"; b.type = "button"; b.textContent = "\u25F1 Back to clock"; b.title = "Shrink to the small pinned clock (Ctrl M)";
  b.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:2147483000;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:#0e1117;color:#fff;font:700 13px system-ui,Segoe UI,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.35);opacity:.92";
  b.onmouseenter = () => { b.style.opacity = "1"; b.style.background = "#232a36"; };
  b.onmouseleave = () => { b.style.opacity = ".92"; b.style.background = "#0e1117"; };
  b.onclick = () => ipcRenderer.send("rv-shrink");
  document.body.appendChild(b);
});
