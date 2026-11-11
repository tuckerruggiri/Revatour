const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("revatourDesktop", {
  isDesktop: true,
  shrink: () => ipcRenderer.send("rv-shrink"),
  expand: () => ipcRenderer.send("rv-expand"),
  quit: () => ipcRenderer.send("rv-quit"),
  menu: () => ipcRenderer.send("rv-menu")
});
