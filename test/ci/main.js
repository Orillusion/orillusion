import { app, BrowserWindow, ipcMain } from 'electron/main'
import { join } from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url';
import { mkdirSync, writeFileSync } from 'fs'
const __dirname = fileURLToPath(new URL('.', import.meta.url));

app.commandLine.appendSwitch('log-level', 'silent')
const HOST = 'http://localhost:4000'

const createWindow = async ()=>{
    const win = new BrowserWindow({
        width: 400,
        height: 350,
        // show: false,
        // frame: false,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            nodeintegrationinsubframes: true,
            webviewTag: true
        }
    })
    ipcMain.on('end', (_event, result) => {
        let pass = true
        for(let i in result){
            if(result[i].pass === false){
                pass = false
                break
            }
        }
        if(pass)
            console.log('\x1b[32mCI pass\x1b[0m')
        else
            console.error('\x1b[31mCI not pass\x1b[0m')
        console.table(result)
        close( pass ? 0 : 1 )
    })
    ipcMain.on('error', (_event, log) => {
        console.error(`\x1b[31m${log.replaceAll(HOST + '/', '')}\x1b[0m\n-----------------`)
    })
    ipcMain.on('test', (_event, log) => {
        console.log(`\x1b[33m[${log.target}]\x1b[0m`)
        console.table(log.result)
        console.log('\n-----------------')
        // quit ci on any test fail
        for(let test in log.result){
            if(log.result[test].fail !== 0){
                close(1)
            }
        }
    })

    // UPDATE_BASELINES=1 rewrites test/visual/baselines/*.json instead of
    // comparing; TEST_FILTER=<substring> runs only matching test files.
    ipcMain.on('baseline', (_event, { name, data }) => {
        if (!process.env.UPDATE_BASELINES) return
        const dir = join(__dirname, '../visual/baselines')
        mkdirSync(dir, { recursive: true })
        const safe = String(name).replace(/[^a-zA-Z0-9_-]/g, '_')
        writeFileSync(join(dir, safe + '.json'), JSON.stringify(data) + '\n')
        console.log(`\x1b[36m[visual] baseline written: ${safe}.json\x1b[0m`)
    })
    const query = ['auto']
    if (process.env.UPDATE_BASELINES) query.push('update')
    if (process.env.TEST_FILTER) query.push('filter=' + encodeURIComponent(process.env.TEST_FILTER))
    await win.loadURL(HOST + '/test/?' + query.join('&'))
}

let vite
app.whenReady().then(() => {
    vite = spawn('npx', ['vite', '--port', '4000', '--strictPort'], {detached: true})
    vite.stdout.on('data', data=>{
        console.log(`\x1b[32m${data.toString()}\x1b[0m`)
        if(data.toString().match(/vite.*.ready/i)){
            createWindow()
        }
    })
    vite.stderr.on('data', data=>{
        console.error(`\x1b[31m${data.toString()}\x1b[0m`)
        close(1)
    })
    vite.unref()
})
app.on('window-all-closed', () => {
    app.quit()
})
app.on('before-quit',()=>{
    try {
        if(vite?.pid) process.kill(-vite.pid)
    } catch (e) { /* group already gone */ }
})

let closing = false
function close(code = 1){
    // A failing test file reports through both the 'test' and the 'end'
    // channel, so this can be called twice; and the vite process group may
    // already be gone. Killing a dead group throws (EPERM / ESRCH) and used
    // to surface as an "Uncaught Exception" dialog from the main process.
    if (closing) return
    closing = true
    console.log('Close Electron & Vite', vite?.pid)
    try {
        if (vite?.pid) process.kill(-vite.pid)
    } catch (e) {
        if (e.code !== 'ESRCH' && e.code !== 'EPERM') console.error(e)
    }
    process.exit(code)
}
