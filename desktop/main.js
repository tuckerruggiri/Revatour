// Revatour desktop: a small always-on-top clock. Click it and it opens the full app; "Shrink to clock" brings it back.
const { app, BrowserWindow, ipcMain, Menu, shell, session, desktopCapturer, screen } = require("electron");
const path = require("path");
const fs = require("fs");

const HOME = process.env.REVATOUR_URL || "https://www.revatour.com/";
const MINI = { width: 340, height: 92 };
let mini = null, full = null, quitting = false;
const prefFile = () => path.join(app.getPath("userData"), "prefs.json");
function prefs() { try { return JSON.parse(fs.readFileSync(prefFile(), "utf8")); } catch (e) { return {}; } }
function savePrefs(p) { try { fs.writeFileSync(prefFile(), JSON.stringify(Object.assign(prefs(), p))); } catch (e) {} }

function onScreen(b) {
  return screen.getAllDisplays().some((d) => b.x >= d.bounds.x - 20 && b.y >= d.bounds.y - 20 && b.x + 100 <= d.bounds.x + d.bounds.width && b.y + 40 <= d.bounds.y + d.bounds.height);
}
function createMini() {
  const p = prefs(), pos = p.mini && onScreen(p.mini) ? { x: p.mini.x, y: p.mini.y } : {};
  mini = new BrowserWindow(Object.assign({
    width: MINI.width, height: MINI.height, frame: false, resizable: false, maximizable: false, fullscreenable: false,
    alwaysOnTop: p.onTop !== false, skipTaskbar: false, title: "Revatour clock", backgroundColor: "#0e1117",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false }
  }, pos));
  mini.setAlwaysOnTop(p.onTop !== false, "screen-saver");
  mini.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mini.loadFile(path.join(__dirname, "mini.html"));
  mini.on("moved", () => { const b = mini.getBounds(); savePrefs({ mini: { x: b.x, y: b.y } }); });
  mini.on("closed", () => { mini = null; });
}
function createFull() {
  const p = prefs();
  full = new BrowserWindow({
    width: (p.full && p.full.width) || 1500, height: (p.full && p.full.height) || 950, minWidth: 900, minHeight: 600,
    title: "Revatour", backgroundColor: "#0e1117", show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false }
  });
  full.loadURL(HOME);
  full.webContents.setVisualZoomLevelLimits(1, 1);
  full.webContents.on("did-finish-load", () => { if (full) full.webContents.setZoomLevel(prefs().zoom || 0); });
  // Ctrl + (plus), Ctrl - (minus), Ctrl 0 (reset), and Ctrl + mouse wheel
  full.webContents.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown" || !(input.control || input.meta)) return;
    const k = input.key;
    if (k === "=" || k === "+" || k === "Add") { zoomBy(0.5); e.preventDefault(); }
    else if (k === "-" || k === "_" || k === "Subtract") { zoomBy(-0.5); e.preventDefault(); }
    else if (k === "0") { setZoom(0); e.preventDefault(); }
    else if (k.toLowerCase() === "m") { shrink(); e.preventDefault(); }
  });
  full.webContents.on("zoom-changed", (e, dir) => zoomBy(dir === "in" ? 0.5 : -0.5));
  full.once("ready-to-show", () => full && full.show());
  full.on("resize", () => { if (!full.isMaximized()) { const b = full.getBounds(); savePrefs({ full: { width: b.width, height: b.height } }); } });
  full.on("close", (e) => { if (!quitting) { e.preventDefault(); shrink(); } });
  full.on("closed", () => { full = null; });
  full.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\/([a-z0-9-]+\.)?revatour\.com\//i.test(url)) return { action: "allow" };
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
}
function setZoom(z) {
  z = Math.max(-5, Math.min(3, Math.round(z * 2) / 2));
  if (full) full.webContents.setZoomLevel(z);
  savePrefs({ zoom: z });
}
function zoomBy(d) { setZoom(((full && full.webContents.getZoomLevel()) || 0) + d); }
function expand() {
  if (!full) createFull(); else { full.show(); full.focus(); }
  if (mini) mini.hide();
}
function shrink() {
  if (full) full.hide();
  if (!mini) createMini(); else { mini.show(); }
}
function menu() {
  const p = prefs(), onTop = p.onTop !== false;
  Menu.buildFromTemplate([
    { label: "Open Revatour", click: expand },
    { label: "Zoom in (Ctrl +)", click: () => zoomBy(0.5) },
    { label: "Zoom out (Ctrl -)", click: () => zoomBy(-0.5) },
    { label: "Reset zoom (Ctrl 0)", click: () => setZoom(0) },
    { label: "Always on top", type: "checkbox", checked: onTop, click: (i) => { savePrefs({ onTop: i.checked }); if (mini) mini.setAlwaysOnTop(i.checked, "screen-saver"); } },
    { label: "Opacity", submenu: [100, 85, 70, 50].map((v) => ({ label: v + "%", type: "radio", checked: (p.opacity || 100) === v, click: () => { savePrefs({ opacity: v }); if (mini) mini.setOpacity(v / 100); } })) },
    { type: "separator" },
    { label: "Quit Revatour", click: () => { quitting = true; app.quit(); } }
  ]).popup();
}

app.whenReady().then(() => {
  // Screen recording: show our own picker (pictures of every screen and window), then record the one picked
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ["screen", "window"], thumbnailSize: { width: 360, height: 220 }, fetchWindowIcons: false }).then((sources) => {
      if (!sources.length) return callback({});
      let done = false;
      const finish = (id) => {
        if (done) return; done = true;
        const s = id && sources.filter((x) => x.id === id)[0];
        if (!s) return callback({});
        callback(request.audioRequested && process.platform === "win32" ? { video: s, audio: "loopback" } : { video: s });
      };
      const parent = (full && full.isVisible() && full) || (mini && mini.isVisible() && mini) || undefined;
      const pk = new BrowserWindow({
        width: 860, height: 600, parent, modal: !!parent, title: "Pick what to record", backgroundColor: "#0e1117", autoHideMenuBar: true, minimizable: false, maximizable: false,
        webPreferences: { preload: path.join(__dirname, "picker-preload.js"), contextIsolation: true, nodeIntegration: false }
      });
      pk.setMenuBarVisibility(false);
      const list = sources.map((s) => ({ id: s.id, name: s.name, screen: /^screen:/.test(s.id), thumb: s.thumbnail && !s.thumbnail.isEmpty() ? s.thumbnail.toDataURL() : "" }));
      const onList = (e) => { if (e.sender === pk.webContents) e.returnValue = list; };
      const onChoose = (e, id) => { if (e.sender === pk.webContents) { finish(id); pk.close(); } };
      ipcMain.on("rv-pick-list", onList); ipcMain.on("rv-pick-choose", onChoose);
      pk.on("closed", () => { ipcMain.removeListener("rv-pick-list", onList); ipcMain.removeListener("rv-pick-choose", onChoose); finish(null); });
      pk.loadFile(path.join(__dirname, "picker.html"));
    }).catch(() => callback({}));
  });
  ipcMain.on("rv-expand", expand);
  ipcMain.on("rv-shrink", shrink);
  ipcMain.on("rv-menu", menu);
  ipcMain.on("rv-quit", () => { quitting = true; app.quit(); });
  createMini();
  const o = prefs().opacity; if (o && mini) mini.setOpacity(o / 100);
  app.on("activate", () => { if (!mini && !full) createMini(); else if (mini && !mini.isVisible() && !(full && full.isVisible())) mini.show(); });
});
app.on("before-quit", () => { quitting = true; });
app.on("window-all-closed", () => { /* stay alive: the clock lives in the corner */ });
if (!app.requestSingleInstanceLock()) app.quit();
else app.on("second-instance", () => { if (full && full.isVisible()) full.focus(); else if (mini) mini.show(); });
