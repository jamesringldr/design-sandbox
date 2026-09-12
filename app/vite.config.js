import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import localRepoPlugin from "./vite-plugin-local-repo.js";
import previewProxyPlugin from "./vite-plugin-preview-proxy.js";

export default defineConfig({
  plugins: [react(), localRepoPlugin(), previewProxyPlugin()],
  server: {
    port: 5180,
    strictPort: true,
    host: "127.0.0.1",
    proxy: {
      "/github-api": {
        target: "https://api.github.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/github-api/, ""),
      },
    },
  },
});
