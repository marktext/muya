import libAssetsPlugin from "@laynezh/vite-plugin-lib-assets";
import { fileURLToPath, URL } from "node:url";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@muya",
        replacement: fileURLToPath(new URL("./lib", import.meta.url)),
      },
    ],
  },
  esbuild: {
    supported: {
      "top-level-await": true, //browsers can handle top-level-await features
    },
  },
  plugins: [
    dts({ entryRoot: "lib" }),
    libAssetsPlugin({
      outputPath: (url) => {
        return url.endsWith(".png") ? "assets/icons" : "assets/fonts";
      },
    }),
  ],
  build: {
    copyPublicDir: false,
    sourcemap: false,
    lib: {
      entry: {
        index: resolve(__dirname, "lib/index.ts"),
        "locales/en": resolve(__dirname, "lib/locales/en.ts"),
        "locales/ja": resolve(__dirname, "lib/locales/ja.ts"),
        "locales/zh": resolve(__dirname, "lib/locales/zh.ts"),
        "state/markdownToHtml": resolve(
          __dirname,
          "lib/state/markdownToHtml.ts"
        ),
        "ui/index": resolve(__dirname, "lib/ui/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        // Put chunk files at <output>/chunks
        chunkFileNames: "chunks/[name].[hash].js",
        // Put chunk styles at <output>/styles
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
