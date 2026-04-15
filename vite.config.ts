import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@heroicons/react/24/outline": path.resolve(rootDir, "src/icons/heroicons/outline.tsx"),
      "@heroicons/react/24/solid": path.resolve(rootDir, "src/icons/heroicons/solid.tsx"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // FastAPI matching (évite CORS en dev : même origine que Vite)
      "/matching-api": {
        target: process.env.VITE_MATCHING_PROXY_TARGET || "http://127.0.0.1:8003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/matching-api/, ""),
      },
    },
  },
});
