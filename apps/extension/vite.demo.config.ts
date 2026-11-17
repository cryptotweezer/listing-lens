// Builds the landing page demo (demo/) into the web app's public folder, as static files.
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: `${root}demo`,
  base: "./",
  publicDir: `${root}public`,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": root.replace(/\/$/, "") } },
  build: { outDir: `${root}../web/public/panel`, emptyOutDir: true, target: "es2022" },
});
