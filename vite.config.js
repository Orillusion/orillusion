// vite.config.js
import { defineConfig } from 'vite'
import { readFile, writeFile, readdir, lstat } from 'fs/promises'
import { resolve, parse } from 'path'

export default defineConfig( option => ({
    server: {
        port: 3000,
        // hmr: false // open this line if no auto hot-reload required
    },
    publicDir: option.command === 'build' ? false : 'public',
    resolve: {
        alias: {
            '@orillusion/core': resolve(__dirname, './src/index.ts'),
            '@orillusion': resolve(__dirname, './packages'),
            '@samples': resolve(__dirname, './samples')
        },
        mainFields: ['module:dev', 'module']
    },
    plugins: option.command === 'build' ? undefined : [{
        name: 'autoIndex',
        configureServer(server) {
            const tsFile = /\/src\/.*.ts$/
            async function dir(folder, ts = []) {
                let files = await readdir(folder)
                for (let f of files) {
                    let path = resolve(folder, f).replace(/\\/g, '/') // fix windows path
                    let ls = await lstat(path)
                    if (ls.isDirectory()) {
                        await dir(path, ts)
                    } else if (tsFile.test(path)) {
                        let name = parse(path).name
                        if (name !== 'index' && !name.startsWith('_') && !name.endsWith('-back'))
                            ts.push(path)
                    }
                }
                return ts
            }
            async function autoIndex(file) {
                if(file && !tsFile.test(file.replace(/\\/g, '/'))) // fix windows path
                    return
                let ts = await dir('./src')
                ts.sort() // make sure same sort on windows and unix
                let improts = '', _dir = __dirname.replace(/\\/g, '/') + '/src' // fix windows path
                for (let path of ts) {
                    improts += `export * from "${path.replace(_dir, '.').slice(0, -3)}"\r\n`
                }
                let content = await readFile(resolve(__dirname, './src/index.ts'), 'utf-8')
                if (improts !== content) {
                    console.log('[autoIndex] index.ts')
                    writeFile(resolve(__dirname, './src/index.ts'), improts)
                }
            }
            server.httpServer.on('listening', autoIndex)
            server.watcher.on('change', autoIndex)
            server.watcher.on('unlink', autoIndex) 
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
}))