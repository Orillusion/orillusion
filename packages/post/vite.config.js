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
            name: 'Post',
            fileName: (format) => `post.${format}.js`
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