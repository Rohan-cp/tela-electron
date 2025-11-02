import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { autoUpdater } from "electron-updater";
import icon from "../../resources/icon.svg?asset";
import { createServer, Server } from "http";
import { parse as parseUrl } from "url";
import * as path from "path";
import * as fs from "fs";

// Environment variables - sourced from build-time defines (see electron.vite.config.ts)
// NOTE: Previous hardcoded production values kept here for packaging fallback when
// env injection fails during production builds (via electron-builder, etc.).
// To use the fallback, replace the two consts below with these lines:
// const API_BASE_URL = "https://tela-server-production.up.railway.app";

const API_BASE_URL =
  (process.env.API_BASE_URL as string) ||
  (is.dev
    ? "http://localhost:3001"
    : "https://tela-server-production.up.railway.app");

// Configure auto-updater for GitHub Releases
// It will auto-detect repository from package.json
// Make sure your package.json has the repository field set correctly
autoUpdater.setFeedURL({
  provider: "github",
});

// Disable auto-download, we'll handle it manually
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Track all windows globally
let mainWindow: BrowserWindow | null = null;
let authWindows: BrowserWindow[] = [];
let authServer: Server | null = null;

// Update state
interface UpdateInfo {
  version: string;
  releaseDate: string;
  isAvailable: boolean;
  downloaded: boolean;
  progress?: number;
}

let updateInfo: UpdateInfo = {
  version: app.getVersion(),
  releaseDate: "",
  isAvailable: false,
  downloaded: false,
};

interface AuthData {
  email: string;
  name: string;
  token: string;
}

// Use globalThis instead of NodeJS namespace
declare const global: typeof globalThis & {
  pendingAuthData: AuthData | null;
};

function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/index.js"),
    },
  });

  // Only open dev tools in development
  if (is.dev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on("ping", () => {});

  createMainWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

ipcMain.on("create-document-triggered", (_, textVal) => {
  if (!mainWindow) return;

  dialog
    .showSaveDialog(mainWindow, {
      filters: [{ name: "Markdown", extensions: ["md"] }],
    })
    .then(({ filePath }) => {
      if (!filePath) return;

      fs.writeFile(filePath, textVal?.toString() ?? "alternate", err => {
        if (err) {
          console.error("error", err);
          return;
        } else {
          mainWindow?.webContents.send("file-created", { filePath });
        }
      });
    })
    .catch(err => {
      console.error("Error in open dialog:", err);
    });
});

ipcMain.on("save-document-triggered", (_, { filePath, textVal }) => {
  if (!mainWindow) return;

  fs.writeFile(filePath, textVal?.toString() ?? "", err => {
    if (err) {
      console.error("Error saving file:", err);
      return;
    }
  });
});

ipcMain.on("open-document-triggered", () => {
  if (!mainWindow) return;

  dialog
    .showOpenDialog(mainWindow, {
      filters: [{ name: "Markdown", extensions: ["md"] }],
    })
    .then(({ filePaths, canceled }) => {
      if (canceled || !filePaths || filePaths.length === 0) return;
      const filePathToOpen = filePaths[0];

      fs.readFile(filePathToOpen, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          return;
        }
        if (mainWindow) {
          mainWindow.webContents.send("file-opened", {
            filePath: filePathToOpen,
            content: data,
          });
        }
      });
    })
    .catch(err => {
      console.error("Error in open dialog:", err);
    });
});

ipcMain.on("route-changed", (_, route) => {
  if (!mainWindow) return;

  // we changes /auth to / route but we keep this so we in case
  // we need to resize window later
  if (route === "/auth") {
    mainWindow.setSize(597, 669);
    mainWindow.center();
  } else {
    mainWindow.setSize(900, 670);
    mainWindow.center();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function createAuthCallbackServer(): Server {
  if (authServer) {
    try {
      authServer.close();
    } catch (err) {
      console.error("Error closing auth server:", err);
    }
  }

  const server = createServer((req, res) => {
    if (!req.url) {
      res.writeHead(404);
      res.end();
      return;
    }

    const parsedUrl = parseUrl(req.url, true);

    if (parsedUrl.pathname === "/auth-success") {
      const userData = {
        email: parsedUrl.query.email as string,
        name: parsedUrl.query.name as string,
        token: parsedUrl.query.token as string,
      };

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("auth-success", userData);
      } else {
        console.error("Error: Main window is not available to send auth data");

        // Store the auth data for when the window becomes available
        global.pendingAuthData = userData;

        if (!mainWindow) {
          mainWindow = createMainWindow();

          mainWindow.webContents.on("did-finish-load", () => {
            if (global.pendingAuthData) {
              mainWindow?.webContents.send(
                "auth-success",
                global.pendingAuthData
              );
              global.pendingAuthData = null;
            }
          });
        }
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
              h2 { color: #4CAF50; }
            </style>
          </head>
          <body>
            <h2>Authentication Successful</h2>
            <p>You have successfully signed in. You can close this window now.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);

      setTimeout(() => {
        if (server) {
          server.close();
          authServer = null;
        }
      }, 5000);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.on("listening", () => {
    const address = server.address();
    if (address && typeof address === "object" && "port" in address) {
      // Avoid logging in production for cleaner output
    }
  });

  server.listen(3002);

  authServer = server;
  return server;
}

function setupAutoUpdater(): void {
  // Only check for updates in production
  if (!is.dev) {
    // Check for updates immediately after app is ready
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.error("Error checking for updates:", err);
      });
    }, 3000);

    // Check for updates every hour
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.error("Error checking for updates:", err);
      });
    }, 3600000); // 1 hour
  }

  autoUpdater.on("checking-for-update", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-checking");
    }
  });

  autoUpdater.on("update-available", info => {
    updateInfo = {
      version: info.version,
      releaseDate: info.releaseDate || "",
      isAvailable: true,
      downloaded: false,
    };
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-available", {
        version: info.version,
        releaseDate: info.releaseDate,
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    updateInfo.isAvailable = false;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-not-available");
    }
  });

  autoUpdater.on("error", err => {
    console.error("Error in auto-updater:", err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-error", {
        message: err.message,
      });
    }
  });

  autoUpdater.on("download-progress", progressObj => {
    const percent = Math.round(progressObj.percent);
    updateInfo.progress = percent;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-download-progress", {
        percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    }
  });

  autoUpdater.on("update-downloaded", info => {
    updateInfo.downloaded = true;
    updateInfo.progress = 100;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-downloaded", {
        version: info.version,
        releaseDate: info.releaseDate,
      });
    }
  });
}

function setupIpcHandlers(): void {
  ipcMain.on("initiate-google-auth", () => {
    try {
      createAuthCallbackServer();
      shell.openExternal(`${API_BASE_URL}/api/auth/google`);
    } catch (err) {
      console.error("Error initiating Google auth:", err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("auth-error", {
          message: "Failed to start authentication process",
        });
      }
    }
  });

  ipcMain.on("check-auth-status", () => {
    if (global.pendingAuthData && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("auth-success", global.pendingAuthData);
      global.pendingAuthData = null;
    }
  });

  ipcMain.on("maximize-window", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.maximize();
    }
  });

  // Update-related IPC handlers
  ipcMain.handle("check-for-updates", async () => {
    try {
      if (is.dev) {
        return { available: false, message: "Updates disabled in development" };
      }
      const result = await autoUpdater.checkForUpdates();
      return {
        available: result?.updateInfo ? true : false,
        version: result?.updateInfo?.version,
      };
    } catch (error) {
      console.error("Error checking for updates:", error);
      return { available: false, error: (error as Error).message };
    }
  });

  ipcMain.handle("get-update-status", () => {
    return updateInfo;
  });

  ipcMain.handle("download-update", async () => {
    try {
      if (is.dev) {
        return { success: false, message: "Updates disabled in development" };
      }
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      console.error("Error downloading update:", error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle("install-update-and-restart", () => {
    if (is.dev) {
      return { success: false, message: "Updates disabled in development" };
    }
    if (updateInfo.downloaded) {
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    }
    return { success: false, message: "Update not downloaded yet" };
  });
}

function cleanupAllResources(): void {
  if (authServer) {
    try {
      authServer.close();
      authServer = null;
    } catch (err) {
      console.error("Error closing auth server:", err);
    }
  }

  authWindows.forEach(win => {
    if (win && !win.isDestroyed()) {
      try {
        win.close();
      } catch (err) {
        console.error("Error closing auth server:", err);
      }
    }
  });
  authWindows = [];

  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.close();
      mainWindow = null;
    } catch (err) {
      console.error("Error closing auth server:", err);
    }
  }
}

app.on("ready", () => {
  mainWindow = createMainWindow();
  setupIpcHandlers();
  setupAutoUpdater();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

app.on("will-quit", () => {
  cleanupAllResources();
});

// Additional safety for forced termination
process.on("SIGINT", () => {
  cleanupAllResources();
  app.quit();
});

process.on("SIGTERM", () => {
  cleanupAllResources();
  app.quit();
});

process.on("uncaughtException", error => {
  console.error("Uncaught exception:", error);
  cleanupAllResources();
  app.quit();
});
