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
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
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
