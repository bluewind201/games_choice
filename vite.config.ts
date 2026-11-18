import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 100000 },
  test: { environment: 'node' },
} as any);
