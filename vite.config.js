import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-build',
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        format: 'iife',
        name: 'WorkProApp',
        entryFileNames: 'app-v183.js',
      }
    },
    minify: true,
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  }
});
