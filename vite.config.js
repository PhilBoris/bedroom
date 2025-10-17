import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // ✅ très important pour les déploiements (Vercel, GitHub Pages, etc.)
  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    host: true, // ✅ permet d'accéder via réseau local (utile pour tests sur téléphone)
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
