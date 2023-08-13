import { resolve as resolvePath } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import projectPackage from './package.json';

export default defineConfig({
  build: {
    lib: {
      entry: resolvePath(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') {
          return 'esm/index.js';
        }

        if (format === 'cjs') {
          return 'cjs/index.js';
        }

        return '';
      },
      name: projectPackage.name,
    },
  },
  plugins: [dts({ insertTypesEntry: true })],
});
