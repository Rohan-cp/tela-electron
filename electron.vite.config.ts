import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import dotenv from "dotenv";
import { existsSync } from "fs";

export default defineConfig(({ mode }) => {
  // Determine if we're in production
  // Default to production mode if NODE_ENV is set to production
  const isProduction =
    mode === "production" || process.env.NODE_ENV === "production";

  // Explicitly load .env.production if in production mode
  if (isProduction) {
    const envProdPath = resolve(process.cwd(), ".env.production");
    if (existsSync(envProdPath)) {
      const result = dotenv.config({ path: envProdPath });
      if (result.error) {
        console.warn("Warning: Failed to load .env.production:", result.error);
      } else {
        // Intentionally avoid logging env values in production
      }
    } else {
      console.warn("Warning: .env.production file not found at:", envProdPath);
    }
  }

  // Load environment variables based on mode (Vite's loadEnv handles .env.[mode] files)
  // Pass "production" explicitly if we're in production mode
  const loadMode = isProduction ? "production" : mode;
  const env = loadEnv(loadMode, process.cwd(), "");

  // Set the API base URL from environment or fallback
  // Priority: process.env (from dotenv) > env (from loadEnv) > fallback
  const apiBaseUrl = isProduction
    ? process.env.API_BASE_URL ||
      env.API_BASE_URL ||
      "https://tela-server-production.up.railway.app"
    : process.env.API_BASE_URL || env.API_BASE_URL || "http://localhost:3001";

  const viteApiBaseUrl = isProduction
    ? process.env.VITE_API_BASE_URL ||
      env.VITE_API_BASE_URL ||
      "https://tela-server-production.up.railway.app"
    : process.env.VITE_API_BASE_URL ||
      env.VITE_API_BASE_URL ||
      "http://localhost:3001";

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        "process.env.NODE_ENV": JSON.stringify(
          isProduction ? "production" : mode
        ),
        "process.env.API_BASE_URL": JSON.stringify(apiBaseUrl),
        __PRODUCTION_API_URL__: JSON.stringify(apiBaseUrl),
      },
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
    },
    renderer: {
      resolve: {
        alias: {
          "@renderer": resolve("src/renderer/src"),
        },
      },
      plugins: [react()],
      define: {
        "import.meta.env.VITE_API_BASE_URL": JSON.stringify(viteApiBaseUrl),
      },
    },
  };
});
