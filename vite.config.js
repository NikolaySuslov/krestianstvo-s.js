import { defineConfig } from 'vite';

export default defineConfig(async (mode) => (
  {
  plugins: [],
  esbuild: {
    jsxFactory: 'h',
    jsxInject: `import { h } from 'million/jsx-runtime';`
  },
  build: {
      target: 'esnext',
      polyfillDynamicImport: false
      //minify: "esbuild"
    }
}));
