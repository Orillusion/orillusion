// vite.config.js
import { defineConfig } from 'vite'
import { readFile, writeFile, readdir, lstat } from 'fs/promises'
import {resolve, parse} from 'path'

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
            server.httpServer.on('listening', autoIndex)
            server.watcher.on('change', (file)=>{
                if(file.match(/\/src\/.*.ts$/))
                    autoIndex()
            })
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

const tsFile = /\.ts$/
async function dir(folder, ts=[]){
    let files = await readdir(folder)
    for(let f of files){
        let path = resolve(folder, f)
        let ls = await lstat(path)
        if(ls.isDirectory()){
            await dir(path, ts)
        }else if(tsFile.test(path)){
            let name = parse(path).name
            if(name !== 'index' && !name.startsWith('_') && !name.endsWith('-back'))
                ts.push(path)
        }
    }
    return ts
}
async function autoIndex(file){
    let ts = await dir('./src')
    let improts = ''
    for (let path of ts){
        improts += `export * from "${path.replace(__dirname + '/src', '.').slice(0, -3)}"\r\n`
    }
    let content = await readFile(resolve(__dirname, './src/index.ts'), 'utf-8')
    if(improts !== content){
        console.log('[autoIndex] index.ts')
        writeFile(resolve(__dirname, './src/index.ts'), improts)
    }
}
