import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Bind to all interfaces so the admin app is reachable from other LAN machines.
    // Access via http://<this-machine-ip>:5173 from any device on the same network.
    host: true,
    port: 5173,
  },
});
