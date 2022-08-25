import { defineConfig } from 'vite';
import { million } from 'million/vite-plugin-million';

export default defineConfig(async (mode) => (
  {
  plugins: [million()],
  build: {
      target: 'esnext',
      polyfillDynamicImport: false
      //minify: "esbuild"
    }
}));
