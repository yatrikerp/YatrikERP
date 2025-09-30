import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
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
    // Ensure environment variables are properly loaded
    envPrefix: ['VITE_', 'REACT_APP_'],
    define: {
      // Don't override process.env completely, just provide fallback
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      // Explicitly define environment variables
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY)
    }
  };
});
