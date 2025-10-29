const { contextBridge, ipcRenderer } = require("electron");
const { electronAPI } = require("@electron-toolkit/preload");

type IpcRendererEvent = Electron.IpcRendererEvent;

interface WindowWithGlobals extends Window {
  electron: typeof electronAPI;
  api: typeof api;
}

// Custom APIs for renderer
const api = {
  registerCreateDocumentClick: (
    callback: (event: IpcRendererEvent) => void
  ): void => {
    ipcRenderer.on("create-document-click", callback);
  },
  documentCreated: (callback: (event: IpcRendererEvent) => void): void => {
    ipcRenderer.on("document-created", callback);
  },
  triggerCreateDocument: (textVal: string): void => {
    ipcRenderer.send("create-document-triggered", textVal);
  },
  triggerSaveDocument: (filePath: string, textVal: string): void => {
    ipcRenderer.send("save-document-triggered", { filePath, textVal });
  },
  triggerOpenDocument: (): void => {
    ipcRenderer.send("open-document-triggered");
  },
  onFileOpened: (
    callback: (
      event: IpcRendererEvent,
      data: { filePath: string; content: string }
    ) => void
  ): void => {
    ipcRenderer.on("file-opened", callback);
  },
  onFileCreated: (
    callback: (event: IpcRendererEvent, data: { filePath: string }) => void
  ): void => {
    ipcRenderer.on("file-created", callback);
  },
  removeFileOpenedListener: (
    callback: (event: IpcRendererEvent, ...args: unknown[]) => void
  ): void => {
    ipcRenderer.removeListener("file-opened", callback);
  },
  removeFileCreatedListener: (
    callback: (event: IpcRendererEvent, data: { filePath: string }) => void
  ): void => {
    ipcRenderer.removeListener("file-created", callback);
  },
  notifyRouteChange: (route: string): void => {
    ipcRenderer.send("route-changed", route);
  },
  initiateGoogleAuth: (): void => {
    ipcRenderer.send("initiate-google-auth");
  },
  onAuthSuccess: (
    callback: (
      event: IpcRendererEvent,
      data: { email: string; token?: string }
    ) => void
  ): void => {
    ipcRenderer.on("auth-success", callback);
  },
  removeAuthSuccessListener: (
    callback: (
      event: IpcRendererEvent,
      data: { email: string; token?: string }
    ) => void
  ): void => {
    ipcRenderer.removeListener("auth-success", callback);
  },
  checkAuthStatus: (): void => {
    ipcRenderer.send("check-auth-status");
  },
  maximizeWindow: (): void => {
    ipcRenderer.send("maximize-window");
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
  const globalWindow = window as unknown as WindowWithGlobals;
  globalWindow.electron = electronAPI;
  globalWindow.api = api;
}

module.exports = {};
