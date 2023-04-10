import { defineConfig } from "vite";
import UnoCSS from "unocss/vite";
import react from "@vitejs/plugin-react";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    copy({
      targets: [{ src: ["src/assets", "src/manifest.json"], dest: "./dist" }],
      hook: "writeBundle",
    }),
  ],
  build: {
    assetsDir: "./",
    rollupOptions: {
      input: {
        main: "index.html",
        background: "src/background.ts",
        content: "src/content.ts",
        navigator: "src/navigator.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
