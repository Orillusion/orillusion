// load all modules in /test
const modules = import.meta.glob(['./*/*.test.ts'])
// create menu
let title = '', list = ''
for (const path in modules) {
    const arr = path.split('/')
    let _title = arr[1]
    let _demo = arr[2].replace(/\.test\.ts/g, '')
    if (_title != title) {
        list += `<p>${_title}</p>`
        title = _title
    }
    list += `<a id="${path}">${_demo}</a>`
}
list += '<hr><button>Test All</button>'
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
        addIframe(target)
        document.querySelector('.active')?.classList.remove('active')
        button.classList.add('active')
        sessionStorage.top = menu.scrollTop
        sessionStorage.target = target
    }
})

if (sessionStorage.target) {
    let target = sessionStorage.target
    let a = document.querySelector(`[id="${target}"]`)
    if (a) {
        addIframe(target)
        a.classList.add('active')
        menu.scrollTop = sessionStorage.top
    }
} else {
    document.querySelector('a')?.click()
}

function addIframe(target: string) {
    const iframe = document.createElement('iframe') as HTMLIFrameElement
    iframe.srcdoc = `
    <style>html,body{margin:0;padding:0;overflow:hidden}canvas{touch-action:none}.stats{margin-left:190px}</style>
    <script type="module" src="/test/${target}"></script>
    `
    document.body.appendChild(iframe)
}

menu.querySelector('button')?.addEventListener('click', async (e: any) => {
    e.target.innerHTML = 'RUNING'
    e.target.disabled = true
    try {
        let links = menu.querySelectorAll('a')
        let result: { [key: string]: any } = {}
        for (let a of links as any) {
            a.click()
            await new Promise(res => {
                window.addEventListener('message', e => {
                    if (e.data.type === 'end') {
                        result[a.id] = {
                            pass: e.data.fail > 0 ? false : true,
                            success: e.data.success,
                            fail: e.data.fail
                        }
                        res(true)
                    }
                }, { once: true })
            })
        }
        console.table(result)
        window.electron?.end(result)
    } catch (e) {
        console.error(e)
    }
    e.target.innerHTML = 'TEST ALL'
    e.target.disabled = false
})

if (location.search.match(/auto/)) {
    menu.querySelector('button')?.click()
}

declare global {
    interface Window {
        electron: {
            test: (e: any) => void
            error: (e: any) => void
            end: (e: any) => void
        }
    }
}
export { }