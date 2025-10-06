/* eslint-disable @typescript-eslint/explicit-function-return-type */
const { contextBridge, ipcRenderer } = require('electron')
const { electronAPI, webFrame } = require('@electron-toolkit/preload')

// Custom APIs for renderer
const api = {
  registerCreateDocumentClick: (callback) => {
    ipcRenderer.on('create-document-click', callback)
  },
  documentCreated: (callback) => {
    ipcRenderer.on('document-created', callback)
  },
  triggerCreateDocument: (textVal) => {
    console.log('textVal here', textVal)
    ipcRenderer.send('create-document-triggered', textVal)
  },
  triggerSaveDocument: (filePath, textVal) => {
    ipcRenderer.send('save-document-triggered', { filePath, textVal })
  },
  triggerOpenDocument: () => {
    ipcRenderer.send('open-document-triggered')
  },
  onFileOpened: (callback) => {
    ipcRenderer.on('file-opened', callback)
  },
  onFileCreated: (callback) => {
    ipcRenderer.on('file-created', callback)
  },
  removeFileOpenedListener: (callback) => {
    ipcRenderer.removeListener('file-opened', callback)
  },
  removeFileCreatedListener: (callback) => {
    ipcRenderer.removeListener('file-created', callback)
  },
  notifyRouteChange: (route) => {
    ipcRenderer.send('route-changed', route)
  },
  initiateGoogleAuth: () => {
    console.log('Initiating Google Auth from preload')
    ipcRenderer.send('initiate-google-auth')
  },
  onAuthSuccess: (callback) => {
    console.log('Setting up auth success listener in preload')
    ipcRenderer.on('auth-success', (event, data) => {
      console.log('Auth success received in preload:', data)
      callback(event, data)
    })
  },
  removeAuthSuccessListener: (callback) => {
    console.log('Removing auth success listener in preload')
    ipcRenderer.removeListener('auth-success', callback)
  },
  checkAuthStatus: () => {
    console.log('Checking auth status from preload')
    ipcRenderer.send('check-auth-status')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

module.exports = {}
