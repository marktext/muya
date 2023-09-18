import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@muya",
        replacement: fileURLToPath(new URL("./lib", import.meta.url)),
      },
    ],
  },
});
