import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5500,
    allowedHosts: ['obvious-unfixable-travesty.ngrok-free.dev'],
    proxy: {
      '/utente':   'http://127.0.0.1:8000',
      '/utenti':   'http://127.0.0.1:8000',
      '/login':    'http://127.0.0.1:8000',
      '/logout':   'http://127.0.0.1:8000',
      '^/annunci/': {
        target: 'http://127.0.0.1:8000',
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return '/index.html';
        },
      },
      '/preferiti': 'http://127.0.0.1:8000',
      '/immagini':  'http://127.0.0.1:8000',
      '/static':   'http://127.0.0.1:8000',
      '/api/chat': 'http://127.0.0.1:8000',
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        rewriteWsOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code !== 'ECONNRESET') console.error('[ws proxy]', err);
          });
        },
      },
    },
  },
});