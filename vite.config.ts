import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';

const logger = createLogger();
const originalWarn = logger.warn;
logger.warn = (msg, options) => {
  if (msg.includes('Failed to load source map') || msg.includes('points to missing source files')) return;
  originalWarn(msg, options);
};
const originalError = logger.error;
logger.error = (msg, options) => {
  if (msg.includes('Failed to load source map') || msg.includes('points to missing source files')) return;
  originalError(msg, options);
};

export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
  optimizeDeps: {
    exclude: ['graphql'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
});
