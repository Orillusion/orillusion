import { defineConfig } from 'vite'
const path = require('path')
export default defineConfig({
    resolve: {
        alias: {
            '@orillusion/core': path.resolve(__dirname, '../../src'),
            '@orillusion': path.resolve(__dirname, '../')
        }
    },
    build: {
        target: 'esnext',
        lib: {
            entry: path.resolve('index.ts'),
            name: 'Graphic',
            fileName: (format) => `graphic.${format}.js`
        },
        rollupOptions: {
            external: ['@orillusion/core'],
            output: {
                globals: {
                    '@orillusion/core': 'Orillusion'
                }
            }
        }
    }
})