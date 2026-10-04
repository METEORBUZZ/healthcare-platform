import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const rootEnv = {
    ...loadEnv(mode, path.resolve(__dirname, '../..'), ''),
    ...process.env,
  };
  return {
    plugins: [react()],
    define: {
      __PUBLIC_APP_URL__: JSON.stringify(rootEnv.PUBLIC_APP_URL || 'http://localhost:3000'),
      __ADMIN_APP_URL__: JSON.stringify(rootEnv.ADMIN_APP_URL || 'http://localhost:3001'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
