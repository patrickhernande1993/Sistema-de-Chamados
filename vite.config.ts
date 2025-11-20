import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Troque 'nexticket-ai' pelo nome exato do seu repositório no GitHub
  base: '/Sistema-de-Chamados/',
  define: {
    'process.env': {}
  }
});
