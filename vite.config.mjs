import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration Vite pour React + déploiement Vercel
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Dossier de sortie attendu par Vercel
    emptyOutDir: true
  },
  server: {
    port: 5173, // Port par défaut pour ton dev local
    open: true
  },
  preview: {
    port: 8080, // Port pour le mode preview local
  }
});

