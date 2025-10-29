/// <reference types="vite/client" />
/// <reference types="electron" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
        callback: (event: Electron.IpcRendererEvent) => void
      ) => void;
      documentCreated: (
        callback: (event: Electron.IpcRendererEvent) => void
      ) => void;
      triggerCreateDocument: (textVal: string) => void;
      triggerSaveDocument: (filePath: string, textVal: string) => void;
      triggerOpenDocument: () => void;
      onFileOpened: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { filePath: string; content: string }
        ) => void
      ) => void;
      onFileCreated: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { filePath: string }
        ) => void
      ) => void;
      removeFileOpenedListener: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { filePath: string; content: string }
        ) => void
      ) => void;
      removeFileCreatedListener: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { filePath: string }
        ) => void
      ) => void;
      notifyRouteChange: (route: string) => void;
      initiateGoogleAuth: () => void;
      onAuthSuccess: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { email: string; token?: string }
        ) => void
      ) => void;
      removeAuthSuccessListener: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { email: string; token?: string }
        ) => void
      ) => void;
      checkAuthStatus: () => void;
      maximizeWindow: () => void;
      // Update-related APIs
      checkForUpdates: () => Promise<{
        available: boolean;
        version?: string;
        message?: string;
        error?: string;
      }>;
      getUpdateStatus: () => Promise<{
        version: string;
        releaseDate: string;
        isAvailable: boolean;
        downloaded: boolean;
        progress?: number;
      }>;
      downloadUpdate: () => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
      installUpdateAndRestart: () => Promise<{
        success: boolean;
        message?: string;
      }>;
      onUpdateChecking: (
        callback: (event: Electron.IpcRendererEvent) => void
      ) => void;
      onUpdateAvailable: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { version: string; releaseDate: string }
        ) => void
      ) => void;
      onUpdateNotAvailable: (
        callback: (event: Electron.IpcRendererEvent) => void
      ) => void;
      onUpdateError: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { message: string }
        ) => void
      ) => void;
      onUpdateDownloadProgress: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { percent: number; transferred: number; total: number }
        ) => void
      ) => void;
      onUpdateDownloaded: (
        callback: (
          event: Electron.IpcRendererEvent,
          data: { version: string; releaseDate: string }
        ) => void
      ) => void;
      removeUpdateListeners: () => void;
    };
  }
}

export {};
