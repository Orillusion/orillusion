/******** Load all samples in /src/sample/ ********/
{
    // find all demos in /sample
    const modules = import.meta.glob(['./*/*.ts', '!./*/_*.ts'])
    // create menu
    let title = '', list = ''
    for (const path in modules) {
        if (!path.includes('Sample_')) continue
        const arr = path.split('/')
        const _title = arr[1]
        const _demo = arr[2].replace(/Sample_|\.ts/g, '')
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
        const button = e.target as HTMLElement
        if (!button.id)
            return
        // remove prev iframe to clear memory
        document.querySelector('iframe')?.remove()
        const target = button.id
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
        const target = sessionStorage.target
        const a = document.querySelector(`[id="${target}"]`)
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
            import('./samples/'+target).then(m=>{
                for(let i in m){
                    new m[i]().run()
                    break
                }
            })
        </script>`
        document.body.appendChild(iframe)
    }
}