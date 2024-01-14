import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@muya',
        replacement: fileURLToPath(new URL('./packages', import.meta.url)),
      },
    ],
  },
  esbuild: {
    supported: {
      'top-level-await': true, //browsers can handle top-level-await features
    },
  },
  plugins: [
    dts({ entryRoot: 'packages' }),
    libAssetsPlugin({
      outputPath: (url) => {
        return url.endsWith('.png') ? 'assets/icons' : 'assets/fonts';
      },
    }),
  ],
  build: {
    copyPublicDir: false,
    sourcemap: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'packages/index.ts'),
        'locales/en': resolve(__dirname, 'packages/locales/en.ts'),
        'locales/ja': resolve(__dirname, 'packages/locales/ja.ts'),
        'locales/zh': resolve(__dirname, 'packages/locales/zh.ts'),
        'state/markdownToHtml': resolve(
          __dirname,
          'packages/state/markdownToHtml.ts'
        ),
        'ui/index': resolve(__dirname, 'packages/ui/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        // Put chunk files at <output>/chunks
        chunkFileNames: 'chunks/[name].[hash].js',
        // Put chunk styles at <output>/styles
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
