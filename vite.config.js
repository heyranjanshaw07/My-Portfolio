import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures assets load correctly on Vercel, Netlify, and GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
