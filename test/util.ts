import { isEqual, isMatch } from 'https://unpkg.com/underscore@1.13.6/underscore-esm-min.js'

let target = sessionStorage.target.split('/').pop()
let result: { [key: string]: any } = {}
let totalS = 0, totalF = 0
console.group(`%c[${target}]`, 'color:yellow')
async function test(unit: string, run: () => Promise<any>) {
    result[unit] = {
        success: 0,
        fail: 0
    }
    console.group(`%c[${unit}]`, 'color:green')
    console.time('[time]')
    let rej: any
    try {
        await Promise.race([
            run(),
            new Promise((_, _rej) => {
                rej = (e: any) => _rej(e.reason)
                window.addEventListener('unhandledrejection', rej, { once: true })
            })
        ])
        result[unit].success++
        totalS++
    } catch (e: any) {
        console.error('[TEST]', e.stack || e)
        window.parent.electron?.error(e.stack || e.message)
        result[unit].fail++
        totalF++
    }
    window.removeEventListener('unhandledrejection', rej)
    console.timeEnd('[time]')
    console.groupEnd()
}

class Compare {
    src: any
    constructor(obj: any) {
        this.src = obj
    }
    toEqual(obj: any) {
        if (!isEqual(this.src, obj)) {
            //console.error('[TEST] toEqual', this.src, obj)
            throw new Error('toEqual')
        }
    }
    notEqual(obj: any) {
        if (isEqual(this.src, obj)) {
            //console.error('[TEST] notEqual', this.src, obj)
            throw new Error('notEqual')
        }
    }
    tobe(obj: any) {
        if (this.src !== obj) {
            //console.error('[TEST] tobe', this.src, obj)
            throw new Error('tobe')
        }
    }
    isMatch(obj: any) {
        if (!isMatch(this.src, obj)) {
            //console.error('[TEST] isMatch', this.src, obj)
            throw new Error('isMatch')
        }
    }
    // TODO
}
function expect(object: any) {
    return new Compare(object)
}

function end() {
    console.table(result)
    console.groupEnd()
    window.parent.postMessage({
        type: 'end',
        success: totalS,
        fail: totalF
    }, '*')
    window.parent.electron?.test({
        target, result
    })
}

function delay(time?: number) {
    return new Promise(res => {
        setTimeout(res, time || 200)
    })
}
export { test, expect, end, delay }