import { resolve } from 'node:path';
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

// eslint-disable-next-line node/prefer-global/process
const dirname = process.cwd();

export default defineConfig({
    build: {
        target: 'chrome70',
        outDir: 'lib',
        lib: {
            entry: resolve(dirname, 'src/index.ts'),
            name: pkg.name,
            fileName: format => `${format}/index.js`,
            formats: ['es', 'umd', 'cjs'],
        },
    },
    test: {
        coverage: {
            include: ['src/**/*.ts'],
            reporter: ['html', 'text', 'json'],
            provider: 'istanbul',
        },
    },
    plugins: [
        dts({
            entryRoot: 'src',
            outDir: 'lib/types',
        }),
        libAssetsPlugin({
            outputPath: (url) => {
                return url.endsWith('.png') ? 'assets/icons' : 'assets/fonts';
            },
        }),
    ],
});
