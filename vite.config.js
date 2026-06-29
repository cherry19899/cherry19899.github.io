import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: '/',
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  build: {
    outDir: 'dist-build',
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        format: 'iife',
        name: 'WorkProApp',
        entryFileNames: 'app-v200.js',
      }
    },
    minify: true,
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  }
});
