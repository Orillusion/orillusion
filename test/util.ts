import { Time } from '@orillusion/core'

let target = sessionStorage.target.split('/').pop()
let result: { [key: string]: any } = {}
let totalS = 0, totalF = 0
console.group(`%c[${target}]`, 'color:yellow')

// ---- GPU health ---------------------------------------------------------
// Every device this page creates is watched, so a test fails with the real
// cause instead of hanging on frames or failing a later readback:
// - device lost (e.g. the GPU process crashed or was killed by its watchdog):
//   the running test fails at once.
// - uncaptured validation errors: an invalid pipeline only logs and skips its
//   draws, so a test that does not read pixels would still pass.
const gpuHealth = {
    adapterInfo: null as GPUAdapterInfo | null,
    lost: null as string | null,
    errors: [] as string[],
    onLost: [] as ((e: Error) => void)[],
}
if (typeof GPUAdapter !== 'undefined') {
    const requestDevice = GPUAdapter.prototype.requestDevice
    GPUAdapter.prototype.requestDevice = async function (this: GPUAdapter, ...args: any[]) {
        const device: GPUDevice = await requestDevice.apply(this, args as any)
        gpuHealth.adapterInfo ??= (this as any).info ?? null
        device.addEventListener('uncapturederror', (e: any) => {
            gpuHealth.errors.push(String(e.error?.message ?? e.error).split('\n')[0].slice(0, 300))
        })
        device.lost.then(info => {
            if (info.reason === 'destroyed') return   // engine teardown
            gpuHealth.lost = `GPU device lost (${info.reason}): ${info.message}`
            const err = new Error(gpuHealth.lost)
            gpuHealth.onLost.splice(0).forEach(f => f(err))
        })
        return device
    }
}

/** Adapter info of the first device created in this page (null before Engine3D.init). */
function gpuAdapterInfo(): GPUAdapterInfo | null {
    return gpuHealth.adapterInfo
}

/**
 * True on a software rasterizer (SwiftShader: CI and GPU-less machines).
 * Only for scenes that are too heavy there; every other GPU test should run as is.
 */
function isSoftwareAdapter(): boolean {
    const i = gpuHealth.adapterInfo
    return !!i && /swiftshader|software|llvmpipe/i.test(`${i.vendor} ${i.architecture} ${i.device} ${i.description}`)
}

async function test(unit: string, run: () => Promise<any>) {
    result[unit] = {
        success: 0,
        fail: 0
    }
    console.group(`%c[${unit}]`, 'color:green')
    console.time('[time]')
    let rej: any, onLost: any
    const errorsBefore = gpuHealth.errors.length
    try {
        await Promise.race([
            run(),
            new Promise((_, _rej) => {
                rej = (e: any) => _rej(e.reason)
                window.addEventListener('unhandledrejection', rej, { once: true })
            }),
            new Promise((_, _rej) => {
                onLost = _rej
                if (gpuHealth.lost) _rej(new Error(gpuHealth.lost))
                else gpuHealth.onLost.push(_rej)
            }),
            new Promise((_, _rej) => setTimeout(_rej, 60 * 1000, new Error('timeout')))
        ])
        const errors = gpuHealth.errors.slice(errorsBefore)
        if (errors.length)
            throw new Error(`${errors.length} uncaptured GPU error(s), first: ${errors[0]}`)
        result[unit].success++
        totalS++
    } catch (e: any) {
        console.error('[TEST]', e.stack || e)
        window.parent.electron?.error(e.stack || e.message)
        result[unit].fail++
        totalF++
    }
    window.removeEventListener('unhandledrejection', rej)
    const i = gpuHealth.onLost.indexOf(onLost)
    if (i >= 0) gpuHealth.onLost.splice(i, 1)
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

/**
 * Read a w×h region of an rgba16float texture. Returns rows (top to bottom)
 * of [r,g,b,a] tuples.
 */
async function readRegionRGBA16F(device: GPUDevice, texture: GPUTexture, x: number, y: number, w: number, h: number): Promise<number[][][]> {
    const bytesPerRow = Math.ceil((w * 8) / 256) * 256;
    const buf = device.createBuffer({ size: bytesPerRow * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const enc = device.createCommandEncoder();
    enc.copyTextureToBuffer({ texture, origin: { x: Math.floor(x), y: Math.floor(y) } }, { buffer: buf, bytesPerRow, rowsPerImage: h }, { width: w, height: h });
    device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const u16 = new Uint16Array(buf.getMappedRange().slice(0));
    buf.unmap(); buf.destroy();
    const rows: number[][][] = [];
    for (let j = 0; j < h; j++) {
        const row: number[][] = [];
        const base = j * (bytesPerRow / 2);
        for (let i = 0; i < w; i++) row.push([halfToFloat(u16[base + i * 4]), halfToFloat(u16[base + i * 4 + 1]), halfToFloat(u16[base + i * 4 + 2]), halfToFloat(u16[base + i * 4 + 3])]);
        rows.push(row);
    }
    return rows;
}

/**
 * Wait until `count` whole frames that began after this call have rendered.
 * CI runs WebGPU on SwiftShader at ~2 fps or slower, so a wall-clock delay after
 * changing a setting may not cover a single frame and a readback sees the old image.
 */
async function frames(count: number = 1) {
    const until = Time.frame + count + 1
    await waitUntil(() => Time.frame >= until, 30000, 10)
}

export { test, expect, end, delay, waitUntil, frames, readRowRGBA16F, readRegionRGBA16F, gpuAdapterInfo, isSoftwareAdapter }
