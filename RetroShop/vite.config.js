import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5500,
    proxy: {
      '/utente':  'http://127.0.0.1:8000',
      '/utenti':  'http://127.0.0.1:8000',
      '/login':   'http://127.0.0.1:8000',
      '/logout':  'http://127.0.0.1:8000',
      '/annunci': 'http://127.0.0.1:8000',
      '/static':  'http://127.0.0.1:8000',
    },
  },
});