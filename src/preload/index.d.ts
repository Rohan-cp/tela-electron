import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      registerCreateDocumentClick: (callback: () => void) => void;
      documentCreated: (
        callback: (
          event: Electron.IpcRendererEvent,
          ...args: unknown[]
        ) => void,
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
          ...args: unknown[]
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
          userData: { email: string; token?: string },
        ) => void,
      ) => void;
      removeAuthSuccessListener: (
        callback: (
          event: Electron.IpcRendererEvent,
          userData: { email: string; token?: string },
        ) => void,
      ) => void;
      checkAuthStatus: () => void;
    };
  }
}
