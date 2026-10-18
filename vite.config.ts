import { resolve } from "node:path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  // Relative base so the build works under any sub-path (e.g. /squaregrid/).
  base: "./",
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        square: resolve(import.meta.dirname, "square.html"),
      },
    },
  },
  worker: {
    format: "es",
  },
});
