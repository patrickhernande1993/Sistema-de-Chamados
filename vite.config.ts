import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Garante compatibilidade caso alguma lib legada use process.env
    'process.env': {}
  }
});