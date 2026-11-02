import { defineConfig } from 'vite';
export default defineConfig({ server: { watch: { ignored: ['**/test-results/**','**/playwright-report/**'] } }, build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } } });
