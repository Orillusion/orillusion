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
            }),
            new Promise((_, _rej) => setTimeout(_rej, 60 * 1000, new Error('timeout')))
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
    toSubequal(obj: any, threshold: any = 0.00001) {
        let min = obj - threshold;
        let max = obj + threshold;
        if (this.src < min || this.src > max) {
            throw new Error('not subequal')
        }
    }
    toRange(min: any, max: any) {
        if (this.src < min || this.src > max) {
            throw new Error('out of range')
        }
    }
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

// Poll `predicate()` until it returns truthy or we time out. Tests that
// read a lazy-init texture (GTAO/SSR post output is only created on the
// first render) used to race a fixed `await delay(...)` against the RAF
// tick and fail intermittently. Use this instead of a bare delay when
// the value you want only materializes after render work completes.
async function waitUntil<T>(predicate: () => T, timeoutMs = 5000, stepMs = 50): Promise<T> {
    const deadline = performance.now() + timeoutMs
    let v = predicate()
    while (!v && performance.now() < deadline) {
        await new Promise(r => setTimeout(r, stepMs))
        v = predicate()
    }
    return v
}

// no funcion types
function isEqual(a: any, b: any) {
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    if (a == null || b == null) return false;
    if (a !== a) return b !== b;
    if(typeof a === 'function' || typeof b === 'function')
        return false;
    if (typeof a !== 'object' || typeof b != 'object') 
        return false;
    // for other objects just compare stringify results
    return JSON.stringify(a) === JSON.stringify(b)
}

function isMatch(object: any, attrs: { [key: string]: any }) {
    const _keys = Object.keys(attrs), length = _keys.length;
    if (object == null) return !length;
    const obj = Object(object);
    for (let i = 0; i < length; i++) {
        const key = _keys[i];
        if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
}

function halfToFloat(h: number): number {
    const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
    if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
    if (e === 31) return f ? NaN : s * Infinity;
    return s * Math.pow(2, e - 15) * (1 + f / 1024);
}

/**
 * Read a `w`×1 row of an rgba16float texture back as [r,g,b,a] float
 * tuples. For GPU-vs-CPU checks on post-effect targets.
 */
async function readRowRGBA16F(device: GPUDevice, texture: GPUTexture, x: number, y: number, w: number = 1): Promise<number[][]> {
    const bytesPerRow = Math.ceil((w * 8) / 256) * 256;
    const buf = device.createBuffer({ size: bytesPerRow, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const enc = device.createCommandEncoder();
    enc.copyTextureToBuffer({ texture, origin: { x: Math.floor(x), y: Math.floor(y) } }, { buffer: buf, bytesPerRow }, { width: w, height: 1 });
    device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const u16 = new Uint16Array(buf.getMappedRange().slice(0, w * 8));
    buf.unmap(); buf.destroy();
    const out: number[][] = [];
    for (let i = 0; i < w; i++) out.push([halfToFloat(u16[i * 4]), halfToFloat(u16[i * 4 + 1]), halfToFloat(u16[i * 4 + 2]), halfToFloat(u16[i * 4 + 3])]);
    return out;
}

export { test, expect, end, delay, waitUntil, readRowRGBA16F }