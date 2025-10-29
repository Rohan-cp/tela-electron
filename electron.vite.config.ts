import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), "");

  // Determine if we're in production
  const isProduction =
    mode === "production" || process.env.NODE_ENV === "production";

  // Set the API base URL from environment or fallback to localhost
  const apiBaseUrl = isProduction
    ? env.API_BASE_URL || "https://tela-server-production.up.railway.app"
    : "http://localhost:3001";

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        "process.env.NODE_ENV": JSON.stringify(mode),
        "process.env.API_BASE_URL": JSON.stringify(apiBaseUrl),
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
        "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
          isProduction
            ? env.VITE_API_BASE_URL ||
                "https://tela-server-production.up.railway.app"
            : "http://localhost:3001"
        ),
      },
    },
  };
});
