const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("picker", {
  list: () => ipcRenderer.sendSync("rv-pick-list"),
  choose: (id) => ipcRenderer.send("rv-pick-choose", id)
});
