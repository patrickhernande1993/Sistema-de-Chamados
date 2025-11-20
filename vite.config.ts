import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: O base deve corresponder ao nome do repositório no GitHub Pages
  // Se o repositório for https://usuario.github.io/nexticket-ai/, o base é '/nexticket-ai/'
  base: '/Sistema-de-Chamados/', 
});
