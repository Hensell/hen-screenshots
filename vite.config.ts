import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";
import { landingSeo } from "./src/landing/seo-plugin.ts";

export default defineConfig({
  plugins: [react(), cloudflare(), landingSeo()],
  build: {
    chunkSizeWarningLimit: 650,
    rolldownOptions: {
      input: {
        agents: fileURLToPath(new URL("./agents/index.html", import.meta.url)),
        landing: fileURLToPath(new URL("./index.html", import.meta.url)),
        studio: fileURLToPath(new URL("./studio/index.html", import.meta.url)),
      },
    },
  },
});
