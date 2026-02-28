import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite configuration for StoryTeller frontend MVP
 * 
 * Features:
 * - React plugin for JSX transformation
 * - Absolute imports via path alias (@ = src/)
 * - Fast refresh for HMR during development
 * - Optimized production build
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
