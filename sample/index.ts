import { Sample_Base_0 } from "./Sample_base_0";

/******** Load all samples in /src/sample/ ********/
// if (false) {
//     new Sample_Base_0().run();
// } else {
// }
function Menu() {
    // load all modules in /sample
    const modules = import.meta.glob(['./*/*.ts', '!./*/_*.ts'])
    // create menu
    let title = '', list = ''
    for (const path in modules) {
        const arr = path.split('/')
        let _title = arr[1]
        let _demo = arr[2].replace(/Sample_|Sample|\.ts/g, '')
        if (_title != title) {
            list += `<p>${_title}</p>`
            title = _title
        }
        list += `<a id="${path}">${_demo}</a>`
    }
    const menu = document.createElement('div')
    menu.className = 'menu'
    menu.innerHTML = list
    document.body.appendChild(menu)

    // change sessionStorage.target on click, and reload iframe
    menu.addEventListener('click', (e: Event) => {
        let button = e.target as HTMLElement
        if (!button.id)
            return
        // remove prev iframe to clear memory
        document.querySelector('iframe')?.remove()
        let target = button.id
        if (target && modules[target]) {
            addIframe()
            document.querySelector('.active')?.classList.remove('active')
            button.classList.add('active')
            sessionStorage.top = menu.scrollTop
            sessionStorage.target = target
        }
    })

    // load target on refresh
    if (sessionStorage.target) {
        let target = sessionStorage.target
        let a = document.querySelector(`[id="${target}"]`)
        if (a) {
            addIframe()
            a.classList.add('active')
            menu.scrollTop = sessionStorage.top
        }
    } else {
        document.querySelector('a')?.click()
    }

    // create an iframe inside page to load sample
    function addIframe() {
        const iframe = document.createElement('iframe') as HTMLIFrameElement
        iframe.srcdoc = `
        <style>html,body{margin:0;padding:0;overflow:hidden}canvas{touch-action:none}.stats{margin-left:190px}</style>
        <script>
            let target = sessionStorage.target
            if(target)
            import('./sample/'+target).then(m=>{
                for(let i in m){
                    new m[i]().run()
                    break
                }
            })
        </script>`
        document.body.appendChild(iframe)
    }
}
Menu()

// auto update index.ts, import all exports from /src/engine/
const modules = import.meta.glob(['../engine/**/*.ts', '!../engine/**/*-back.ts', '!../engine/**/_*.ts'])
let content = ''
for (let path in modules)
    content += `export * from "${path.slice(1, -3)}"\r\n`
import.meta.hot!.send('autoIndex', { content })