import { defineConfig } from 'vite'
const path = require('path')
export default defineConfig({
    resolve: {
        alias: {
            '@orillusion/core': path.resolve(__dirname, '../../src')
        }
    },
    build: {
        lib: {
            entry: path.resolve('index.ts'),
            name: 'Stats',
            fileName: (format) => `stats.${format}.js`
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