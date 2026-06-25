const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  checkLicense: () => ipcRenderer.invoke('check-license'),
  getDeviceId: () => ipcRenderer.invoke('get-device-id'),
});