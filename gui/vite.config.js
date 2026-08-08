import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // VITE_API_URL and VITE_WS_URL are injected at build time by Zerops
  // via envVariables on the gui service.
  // Default values support local dev: api runs on port 8000.
  define: {},
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
