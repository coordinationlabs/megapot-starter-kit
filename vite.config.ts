import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Dev-server proxy so `/api/megapot/*` forwards to api.megapot.io while you
  // work locally — no separate Hono process needed for development. In
  // production, mount `server/proxy.ts` on your backend of choice (see
  // `examples/`) or skip the proxy entirely (use the anonymous or browser-key
  // tiers documented in `.env.example`).
  server: {
    proxy: {
      '/api/megapot': {
        target: 'https://api.megapot.io',
        changeOrigin: true,
        rewrite: (incomingPath) => incomingPath.replace(/^\/api\/megapot/, '/v1'),
      },
    },
  },
});
