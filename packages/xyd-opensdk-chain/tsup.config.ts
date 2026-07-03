import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'cjs'],
  target: 'node16',
  dts: {
    entry: 'index.ts',
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  esbuildOptions: (options) => {
    options.platform = 'node';
  },
});
