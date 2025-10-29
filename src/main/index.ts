import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.svg?asset";
import { createServer, Server } from "http";
import { parse as parseUrl } from "url";
import * as path from "path";
import * as fs from "fs";

// Load environment variables based on NODE_ENV
// Check for production flag in command line arguments or environment
const isProduction =
  process.argv.includes("--prod") ||
  process.env.NODE_ENV === "production" ||
  process.env.ELECTRON_IS_DEV === "false";

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("isProduction:", isProduction);

// Try to load .env files if they exist, but don't fail if they don't
try {
  const envFile = isProduction ? ".env.production" : ".env";
  console.log("Attempting to load env file:", envFile);
  require("dotenv").config({ path: envFile });
} catch (error) {
  console.log("No .env file found, using hardcoded values");
}

// Environment variables with production fallbacks
const API_BASE_URL = isProduction
  ? process.env.API_BASE_URL || "https://tela-server-production.up.railway.app"
  : process.env.API_BASE_URL || "http://localhost:3001";

console.log("API_BASE_URL:", API_BASE_URL);

// Track all windows globally
let mainWindow: BrowserWindow | null = null;
let authWindows: BrowserWindow[] = [];
let authServer: Server | null = null;

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
  mainWindow.webContents.openDevTools();

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
      console.log(`Auth server listening on port ${address.port}`);
    }
  });

  server.listen(3002);

  authServer = server;
  return server;
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
      console.log("Maximizing window...");
      mainWindow.show();
      mainWindow.maximize();
    }
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
