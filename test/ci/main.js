const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const {spawn, execSync} = require('child_process')

app.commandLine.appendSwitch('log-level', 'silent')
const HOST = 'http://localhost:4000'

const createWindow = async ()=>{
    const win = new BrowserWindow({
        width: 400,
        height: 350,
        // show: false,
        // frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
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

    await win.loadURL(HOST + '/test/?auto')
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
    if(vite)
        process.kill(-vite.pid)
})

function close(code = 1){
    console.log('Close Electron & Vite', vite.pid)
    process.kill(-vite.pid)
    process.exit(code)
}