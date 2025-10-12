/// <reference types="vite/client" />
/// <reference types="electron" />

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare global {
  interface Window {
    electron: import("@electron-toolkit/preload").ElectronAPI;
    api: {
      registerCreateDocumentClick: (
        callback: (event: Electron.IpcRendererEvent) => void,
      ) => void;
      documentCreated: (
        callback: (event: Electron.IpcRendererEvent) => void,
      ) => void;
      triggerCreateDocument: (textVal: string) => void;
      triggerSaveDocument: (filePath: string, textVal: string) => void;
      triggerOpenDocument: () => void;
      onFileOpened: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { filePath: string; content: string },
        ) => void,
      ) => void;
      onFileCreated: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { filePath: string },
        ) => void,
      ) => void;
      removeFileOpenedListener: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { filePath: string; content: string },
        ) => void,
      ) => void;
      removeFileCreatedListener: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { filePath: string },
        ) => void,
      ) => void;
      notifyRouteChange: (route: string) => void;
      initiateGoogleAuth: () => void;
      onAuthSuccess: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { email: string; token?: string },
        ) => void,
      ) => void;
      removeAuthSuccessListener: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { email: string; token?: string },
        ) => void,
      ) => void;
      checkAuthStatus: () => void;
    };
  }
}

export {};
