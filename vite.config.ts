import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // A propriedade 'base' foi removida para permitir o deploy na raiz (Vercel/Netlify).
  // Se for voltar para o GitHub Pages, adicione base: '/nome-do-repo/' novamente.
});