import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { readFileSync, renameSync } from "node:fs";

export default defineConfig({
  plugins: [react(), {
    name: "demo-entry-and-license",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "LICENSE.txt", source: readFileSync("LICENSE", "utf8") });
      this.emitFile({ type: "asset", fileName: "nexthook.svg", source: readFileSync("public/nexthook.svg", "utf8") });
    },
    closeBundle() {
      renameSync("dist/demo/demo.html", "dist/demo/index.html");
    },
  }],
  base: "./",
  publicDir: false,
  define: { __PUBLIC_DEMO__: true },
  build: {
    outDir: "dist/demo",
    rollupOptions: { input: resolve("demo.html") },
    chunkSizeWarningLimit: 3000,
  },
});
