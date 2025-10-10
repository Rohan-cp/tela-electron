/* eslint-disable @typescript-eslint/explicit-function-return-type */
const { contextBridge, ipcRenderer } = require("electron");
const { electronAPI } = require("@electron-toolkit/preload");

// Custom APIs for renderer
const api = {
  registerCreateDocumentClick: (callback) => {
    ipcRenderer.on("create-document-click", callback);
  },
  documentCreated: (callback) => {
    ipcRenderer.on("document-created", callback);
  },
  triggerCreateDocument: (textVal) => {
    ipcRenderer.send("create-document-triggered", textVal);
  },
  triggerSaveDocument: (filePath, textVal) => {
    ipcRenderer.send("save-document-triggered", { filePath, textVal });
  },
  triggerOpenDocument: () => {
    ipcRenderer.send("open-document-triggered");
  },
  onFileOpened: (callback) => {
    ipcRenderer.on("file-opened", callback);
  },
  onFileCreated: (callback) => {
    ipcRenderer.on("file-created", callback);
  },
  removeFileOpenedListener: (callback) => {
    ipcRenderer.removeListener("file-opened", callback);
  },
  removeFileCreatedListener: (callback) => {
    ipcRenderer.removeListener("file-created", callback);
  },
  notifyRouteChange: (route) => {
    ipcRenderer.send("route-changed", route);
  },
  initiateGoogleAuth: () => {
    ipcRenderer.send("initiate-google-auth");
  },
  onAuthSuccess: (callback) => {
    ipcRenderer.on("auth-success", (event, data) => {
      callback(event, data);
    });
  },
  removeAuthSuccessListener: (callback) => {
    ipcRenderer.removeListener("auth-success", callback);
  },
  checkAuthStatus: () => {
    ipcRenderer.send("check-auth-status");
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}

module.exports = {};
