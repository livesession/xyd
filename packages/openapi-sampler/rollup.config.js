import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs({
      include: /node_modules/
    })
  ],
  external: []
}; 