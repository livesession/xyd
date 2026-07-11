import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node16',
  dts: { entry: 'src/index.ts' },
  splitting: false,
  sourcemap: true,
  clean: true,
  esbuildOptions: (options) => {
    options.platform = 'node';
  },
});
