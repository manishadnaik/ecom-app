import react from '@vitejs/plugin-react';

// Vite dev proxies /api to node-api so UI has no CORS issue locally.
// In Docker/K8s, nginx or ingress does this instead.
export default {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  preview: { port: 4173 },
};
