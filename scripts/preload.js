console.log('⚙️  preload.js is running');
const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, limited API to the renderer
contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openScrapesFolder: (basePath) => ipcRenderer.invoke('open-scrapes-folder', basePath),

  // Core scrape invocation
  scrape: (params) => ipcRenderer.invoke('scrape', params),

  // Selector history (file-based)
  getSelectorHistory: () => ipcRenderer.invoke('get-selector-history'),
  saveSelectorHistory: (data) => ipcRenderer.invoke('save-selector-history', data),

  // Update UI notifications
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, ...args) => callback(...args)),
  onClearUrlHistory: (callback) => ipcRenderer.on('clear-url-history', () => callback()),
});
