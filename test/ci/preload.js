const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electron', {
    test: (e) => ipcRenderer.send('test', e),
    error: (e) => ipcRenderer.send('error', e),
    end: (e) => ipcRenderer.send('end', e),
})