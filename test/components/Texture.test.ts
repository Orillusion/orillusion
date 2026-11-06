import { test, expect, end } from '../util'
import { Color, Engine3D, Float16ArrayTexture, Float32ArrayTexture, SolidColorSky } from '@orillusion/core';

const engine = await Engine3D.init();
engine.frameRate = 10;
    
await test('textue2D create Uint8Texture', async () => {
    let texture2D = engine.res.createTexture(32, 64, 255, 255, 0, 255, 'uint8Texture')
    let success = (texture2D.gpuSampler && texture2D.getGPUTexture() && texture2D.getGPUView()) ? true : false;
    expect(success).toEqual(true);
})

await test('textue2D create Float16ArrayTexture', async () => {
    let texture2D = new Float16ArrayTexture();
    let color: number[] = [];
    let width = 64;
    let height = 64;
    for (let i = 0, count = width * height; i < count; i++) {
        color.push(1, 0.5, 0.0, 1);
    }
    texture2D.create(width, height, color, false, engine.context3D);
    let success = (texture2D.gpuSampler && texture2D.getGPUTexture() && texture2D.getGPUView()) ? true : false;
    expect(success).toEqual(true);
})

await test('textue2D create Float32ArrayTexture', async () => {
    let texture2D = new Float32ArrayTexture();
    let width = 64;
    let height = 64;
    let color: Float32Array = new Float32Array(width * height * 4);

    for (let i = 0, count = width * height; i < count; i++) {
        color[i * 4] = 1;
        color[i * 4 + 1] = 0;
        color[i * 4 + 2] = 0.5;
        color[i * 4 + 3] = 1;
    }
    texture2D.create(width, height, color, false, engine.context3D);
    let success = (texture2D.gpuSampler && texture2D.getGPUTexture() && texture2D.getGPUView()) ? true : false;
    expect(success).toEqual(true);
})

await test('textureCube create SolidColorSky', async () => {
    let color = new Color(1, 0, 1, 1);
    let texture2D = new SolidColorSky(color, engine.context3D);
    let success = (texture2D.gpuSampler && texture2D.getGPUTexture() && texture2D.getGPUView()) ? true : false;
    expect(success).toEqual(true);
})


await test('loadTexture from a base64 data URI (decoded via Blob, no <img>.decode dependency)', async () => {
    const make = (w: number, h: number) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'); g.fillStyle = '#ff8000'; g.fillRect(0, 0, w, h);
        return c.toDataURL('image/png');
    };
    const withTimeout = <T>(p: Promise<T>) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('base64 texture load hung')), 8000))]);
    const big = await withTimeout(engine.res.loadTexture(make(64, 48)));
    expect(big.width).tobe(64); expect(big.height).tobe(48);
    expect(!!big.getGPUTexture()).tobe(true);
    const tiny = await withTimeout(engine.res.loadTexture(make(2, 2)));
    expect(tiny.width).tobe(32); expect(tiny.height).tobe(32);      // tiny images are upsized to the 32 px minimum
    const uri = make(40, 40);
    const a = await withTimeout(engine.res.loadTexture(uri)), b = await withTimeout(engine.res.loadTexture(uri));
    expect(a === b).tobe(true);                                      // pooled by URL
})

setTimeout(end, 500)
