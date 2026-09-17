const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.send('window:set-always-on-top', alwaysOnTop),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  saveState: (data) => ipcRenderer.invoke('storage:save', data),
  loadState: () => ipcRenderer.invoke('storage:load'),
  onShortcut: (callback) => {
    ipcRenderer.on('shortcut:triggered', (_, action) => callback(action));
  },
});
