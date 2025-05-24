// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.ts'),
        service_worker: resolve(__dirname, 'src/service_worker.ts'),
        popup: resolve(__dirname, 'src/popup.ts')
      },
      output: { entryFileNames: '[name].js' }
    }
  }
});
