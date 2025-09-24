import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Ensure a valid URL is used for the proxy target.
  // An empty or invalid string from a malformed .env can cause a crash.
  let targetUrl = env.VITE_API_BASE_URL;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    targetUrl = 'http://localhost:8000';
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy API requests to the backend server during development
        '/api': {
          target: targetUrl,
          changeOrigin: true,
          // No rewrite needed as the backend endpoints are prefixed with /api
        },
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
