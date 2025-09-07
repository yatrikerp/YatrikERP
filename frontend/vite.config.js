import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  cacheDir: 'node_modules/.vite',
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'react-hot-toast',
      'zustand'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  },
  build: {
    outDir: 'build',
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          icons: ['lucide-react'],
          state: ['zustand'],
          toast: ['react-hot-toast']
        }
      }
    }
  },
  define: {
    'process.env': {}
  }
});
