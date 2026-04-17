import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/compare/ui/",
  server: {
    allowedHosts: ["ec2-13-57-25-198.us-west-1.compute.amazonaws.com"],
    proxy: {
      "/compare/api/": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        ws: true, // WebSocket proxying
      },
      "/compare/videos/": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
