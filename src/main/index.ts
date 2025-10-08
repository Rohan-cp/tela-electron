import { app, shell, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.svg?asset";
import { createServer, Server } from "http";
import { parse as parseUrl } from "url";
import * as path from "path";
import * as fs from "fs";

// Track all windows globally
let mainWindow: BrowserWindow | null = null;
let authWindows: BrowserWindow[] = [];
let authServer: Server | null = null;

// Add this to resolve the pendingAuthData global type
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
  // Create the browser window.
  // console.log('app.getAppPath()', app.getAppPath())
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

  mainWindow.webContents.openDevTools();

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
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

  // Track window closure
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
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

      fs.writeFile(filePath, textVal?.toString() ?? "alternate", (err) => {
        if (err) {
          console.error("error", err);
          return;
        } else {
          // Send the file path back to the renderer
          mainWindow?.webContents.send("file-created", { filePath });
        }
      });
    })
    .catch((err) => {
      console.error("Error in open dialog:", err);
    });
});

ipcMain.on("save-document-triggered", (_, { filePath, textVal }) => {
  if (!mainWindow) return;

  fs.writeFile(filePath, textVal?.toString() ?? "", (err) => {
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
        // console.log('File contents:', data)
        // Send the file contents to the renderer process
        if (mainWindow) {
          mainWindow.webContents.send("file-opened", {
            filePath: filePathToOpen,
            content: data,
          });
        }
      });
    })
    .catch((err) => {
      console.error("Error in open dialog:", err);
    });
});

// Add this handler after other ipcMain handlers
ipcMain.on("route-changed", (_, route) => {
  if (!mainWindow) return;

  // we changes /auth to / route but we keep this so we in case
  // we need to resize window later
  if (route === "/auth") {
    mainWindow.setSize(597, 669);
    mainWindow.center(); // Optional: center the window after resizing
  } else {
    // Default size for root route '/' or any other route
    mainWindow.setSize(900, 670);
    mainWindow.center(); // Optional: center the window after resizing
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

// Function to create auth callback server
function createAuthCallbackServer(): Server {
  // If a server is already running, close it first
  if (authServer) {
    try {
      authServer.close();
    } catch (err) {}
  }

  const server = createServer((req, res) => {
    if (!req.url) {
      res.writeHead(404);
      res.end();
      return;
    }

    const parsedUrl = parseUrl(req.url, true);

    if (parsedUrl.pathname === "/auth-success") {
      // Handle successful authentication
      const userData = {
        email: parsedUrl.query.email as string,
        name: parsedUrl.query.name as string,
        token: parsedUrl.query.token as string,
      };

      // Check if main window is available
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("auth-success", userData);
      } else {
        console.error("Error: Main window is not available to send auth data");

        // Store the auth data for when the window becomes available
        global.pendingAuthData = userData;

        // If the main window was closed, create a new one
        if (!mainWindow) {
          mainWindow = createMainWindow();

          // Send auth data after window is loaded
          mainWindow.webContents.on("did-finish-load", () => {
            if (global.pendingAuthData) {
              mainWindow?.webContents.send(
                "auth-success",
                global.pendingAuthData,
              );
              global.pendingAuthData = null;
            }
          });
        }
      }

      // Rest of your response code
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

      // Close the server after handling the callback
      setTimeout(() => {
        if (server) {
          server.close();
          authServer = null;
        }
      }, 5000);
    } else {
      // Handle unknown paths
      res.writeHead(404);
      res.end();
    }
  });

  // Add console logging when server starts
  server.on("listening", () => {
    const address = server.address();
    if (address && typeof address === "object" && "port" in address) {
    }
  });

  server.listen(3002);

  authServer = server;
  return server;
}

// Setup IPC handlers
function setupIpcHandlers(): void {
  ipcMain.on("initiate-google-auth", () => {
    try {
      // Start the local server to receive the OAuth callback
      createAuthCallbackServer();

      // Open the OAuth URL in the user's default browser
      shell.openExternal("http://localhost:3001/api/auth/google");
    } catch (err) {
      console.error("Error initiating Google auth:", err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("auth-error", {
          message: "Failed to start authentication process",
        });
      }
    }
  });

  // Add a check-auth-status handler
  ipcMain.on("check-auth-status", () => {
    if (global.pendingAuthData && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("auth-success", global.pendingAuthData);
      global.pendingAuthData = null;
    }
  });
}

// Clean up function to close all windows and servers
function cleanupAllResources(): void {
  // Close auth server if running
  if (authServer) {
    try {
      authServer.close();
      authServer = null;
    } catch (err) {}
  }

  // Close all auth windows
  authWindows.forEach((win) => {
    if (win && !win.isDestroyed()) {
      try {
        win.close();
      } catch (err) {}
    }
  });
  authWindows = [];

  // Close main window
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.close();
      mainWindow = null;
    } catch (err) {}
  }
}

// App event handlers
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

// Handle app quitting
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

// Uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  cleanupAllResources();
  app.quit();
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
