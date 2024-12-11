import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build"
  },
  server: {
    host:"0.0.0.0",
    port:3001,
    strictPort: true,
    hmr: {
      clientPort: 443
    }
  },  css: {
    postcss: {
      plugins: [
        require("tailwindcss"),
        require("autoprefixer")
      ]
    }
  }
});
