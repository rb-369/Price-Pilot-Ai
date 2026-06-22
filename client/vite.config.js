import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Only attach the dev proxy in development. In production, VITE_API_URL
  // must point at the deployed backend (set via the Vercel dashboard or
  // a `client/.env.production` file at build time).
  const isDev = mode === 'development';

  return {
    plugins: [react(), tailwindcss()],
    server: isDev
      ? {
          proxy: {
            '/api': {
              target: env.VITE_API_URL || 'http://localhost:5000',
              changeOrigin: true,
            },
          },
        }
      : undefined,
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            pdf: ['jspdf', 'jspdf-autotable'],
          },
        },
      },
    },
  };
});
