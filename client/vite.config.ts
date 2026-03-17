import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [react()],
  base: isProd ? "/BirdSounds/" : "/",
  server: {
    proxy: {
      "/random-bird": "http://localhost:3002",
      "/birds-by-region": "http://localhost:3002",
      "/health": "http://localhost:3002",
    },
  },
});
