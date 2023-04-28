// vite.config.js
import { defineConfig } from 'vite'
import { readFile, writeFile } from 'fs/promises'
import {resolve} from 'path'

module.exports = defineConfig({
    server: {
        port: 3000,
        // hmr: false // open this line if no auto hot-reload required
    },
    resolve: {
        alias: {
            '@orillusion/core': resolve(__dirname, './src/index.ts'),
            '@orillusion': resolve(__dirname, './src/libs')
        },
        mainFields: ['module:dev', 'module']
    },
    plugins: [{
        name: 'autoIndex',
        configureServer(server) {
            // server.ws.on('autoIndex', async (data) => {
            //     let content = await readFile(resolve(__dirname, './src/index.ts'), 'utf-8')
            //     if(data.content !== content)
            //         writeFile(resolve(__dirname, './src/index.ts'), data.content)
            // })
        }
    }],
    build: {
        lib: {
            entry: resolve(__dirname, './src/index.ts'),
            name: 'Orillusion',
            fileName: (format) => `orillusion.${format}.js`
        },
        // minify: 'terser'
    }
})
