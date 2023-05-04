import { defineConfig } from 'vite'
const path = require('path')
export default defineConfig({
    resolve: {
        alias: {
            '@orillusion/ammo': path.resolve(__dirname, '../ammo'),
            '@orillusion/core': path.resolve(__dirname, '../../src')
        }
    },
    build: {
        lib: {
            entry: path.resolve('index.ts'),
            name: 'Physics',
            fileName: (format) => `physics.${format}.js`
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