import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the same build works on GitHub Pages (/scope-creep/draft-arena/) and locally.
  base: './',
  build: {
    target: 'es2022',
    reportCompressedSize: false,
  },
});
