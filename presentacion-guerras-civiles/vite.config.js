import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Configuracion de Vite.
 *
 * `npm run build` genera UN SOLO archivo: dist/index.html, con el JavaScript,
 * el CSS y las fuentes metidos dentro. Se abre con doble clic en cualquier
 * computadora, sin internet y sin instalar nada.
 */
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024, // mete las fuentes dentro del HTML
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
  server: {
    host: true,
    port: 5173,
    open: false,
  },
});
