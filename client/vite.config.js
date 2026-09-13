import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // Keep Vite's generated cache outside node_modules. This avoids Windows/OneDrive
  // file-lock errors when Vite needs to refresh optimized dependencies.
  cacheDir: '../.vite-cache-client',
  test: { environment: 'jsdom', setupFiles: './src/test/setup.js' },
});
