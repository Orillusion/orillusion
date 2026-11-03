import { test, expect, end, waitUntil, delay } from '../util'
import { BoxGeometry, CameraUtil, Color, Engine3D, MeshRenderer, Object3D, Scene3D, TonemapMode, TonemapUtil, UnLitMaterial, Vector3, View3D } from '@orillusion/core';

const near = (a: number, b: number, eps: number) => Math.abs(a - b) <= eps;

await test('TonemapUtil: selector table and known curve values', async () => {
    expect(TonemapUtil.MODES.map(m => TonemapUtil.modeIndex(m))).toEqual([0, 1, 2, 3, 4, 5]);
    expect(TonemapUtil.modeIndex('bogus')).tobe(1);                     // unknown → ACES
    expect(TonemapUtil.modeIndex(undefined)).tobe(1);
    expect(TonemapUtil.apply('None', [2, 0.5, 0.1], 2)).toEqual([4, 1, 0.2]);
    expect(TonemapUtil.apply('ACES', [1, 1, 1])[0]).toSubequal(2.54 / 3.16, 1e-6);
    expect(TonemapUtil.apply('Reinhard', [4, 4, 4], 1, 4)[0]).toSubequal(1, 1e-6);      // white point → 1
    expect(TonemapUtil.apply('Reinhard', [1, 1, 1], 1, 1e6)[0]).toSubequal(0.5, 1e-4);  // plain x/(1+x)
    expect(TonemapUtil.apply('Uncharted2', [5.6, 5.6, 5.6])[0]).toSubequal(1, 1e-6);    // 2×5.6 = W
    expect(TonemapUtil.apply('Neutral', [0.5, 0.5, 0.5])[0]).toSubequal(0.46, 1e-6);    // below compression: −0.04 offset only
    const n = TonemapUtil.apply('Neutral', [0.5, 0.3, 0.2]);
    expect(n[0] - n[1]).toSubequal(0.2, 1e-6);                                          // hue/chroma untouched under 0.76
})

await test('TonemapUtil: every curve is monotonic on a gray ramp and maps 0 → ~0', async () => {
    for (const mode of TonemapUtil.MODES) {
        let prev = -1;
        for (let i = 0; i <= 200; i++) {
            const x = i * 0.08;                                         // 0 … 16
            const y = TonemapUtil.apply(mode, [x, x, x])[0];
            if (!(y >= prev - 1e-6)) throw new Error(`${mode} not monotonic at ${x}: ${prev} → ${y}`);
            prev = y;
        }
        expect(Math.abs(TonemapUtil.apply(mode, [0, 0, 0])[0]) < 0.02).tobe(true);
    }
    // Display-referred curves stay inside [0,1] even for absurd inputs.
    for (const mode of ['ACES', 'AgX', 'Neutral'] as TonemapMode[]) {
        const y = TonemapUtil.apply(mode, [1000, 1000, 1000]);
        expect(y[0] <= 1.04 && y[0] > 0.9).tobe(true);
    }
    // AgX desaturates a very bright pure red toward white instead of clipping to (1,0,0).
    const agx = TonemapUtil.apply('AgX', [50, 0, 0]);
    expect(agx[1] > 0.3 && agx[2] > 0.3).tobe(true);
})

// ---- GPU: the WGSL curves must match the CPU mirror ------------------------

const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(60, engine.aspect, 0.1, 100);
view.camera.lookAt(new Vector3(0, 0, 5), new Vector3(0, 0, 0));
// A wall that fills the whole view with one HDR color.
const wall = new Object3D();
const mr = wall.addComponent(MeshRenderer);
mr.geometry = new BoxGeometry(200, 200, 1);
const mat = new UnLitMaterial();
mat.baseColor = new Color(3.0, 1.0, 0.2, 1);
mr.material = mat;
view.scene.addChild(wall);
engine.startRenderView(view);

function halfToFloat(h: number): number {
    const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
    if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
    if (e === 31) return f ? NaN : s * Infinity;
    return s * Math.pow(2, e - 15) * (1 + f / 1024);
}

function tonemapPost(): any {
    const job: any = engine.getRenderJob(view);
    return job?.graph?.getPass('PostPass')?.postList?.get('TonemapPost');
}

async function readCenter(): Promise<[number, number, number]> {
    const post = tonemapPost();
    const tex: GPUTexture = post.renderTexture.getGPUTexture();
    const device = engine.context3D.device;
    const buf = device.createBuffer({ size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const enc = device.createCommandEncoder();
    enc.copyTextureToBuffer(
        { texture: tex, origin: { x: tex.width >> 1, y: tex.height >> 1 } },
        { buffer: buf, bytesPerRow: 256 },
        { width: 1, height: 1 });
    device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const u16 = new Uint16Array(buf.getMappedRange().slice(0, 8));
    buf.unmap(); buf.destroy();
    return [halfToFloat(u16[0]), halfToFloat(u16[1]), halfToFloat(u16[2])];
}

await test('TonemapPost is attached by default and renders an rgba16float target', async () => {
    await waitUntil(() => tonemapPost()?.renderTexture, 15000);
    const post = tonemapPost();
    expect(post != null).tobe(true);
    expect(post.renderTexture.getGPUTexture().format).tobe('rgba16float');
})

let hdr: [number, number, number] = [0, 0, 0];
await test("'None' passes the HDR scene color through (values above 1 survive)", async () => {
    const tm = engine.setting.render.tonemap;
    tm.mode = 'None'; tm.exposure = 1;
    await delay(400);
    hdr = await readCenter();
    console.log('[Tonemap] scene-linear input at center:', hdr.map(v => v.toFixed(4)).join(', '));
    expect(hdr[0] > 1.5).tobe(true);                                    // really HDR, not clamped upstream
    expect(hdr[0] > hdr[1] && hdr[1] > hdr[2]).tobe(true);
})

for (const mode of ['ACES', 'Reinhard', 'Uncharted2', 'AgX', 'Neutral'] as TonemapMode[]) {
    await test(`GPU '${mode}' matches TonemapUtil.apply (exposure 1 and 0.5)`, async () => {
        const tm = engine.setting.render.tonemap;
        for (const exposure of [1, 0.5]) {
            tm.mode = mode; tm.exposure = exposure; tm.whitePoint = 4;
            await delay(300);
            const gpu = await readCenter();
            const cpu = TonemapUtil.apply(mode, hdr, exposure, 4);
            console.log(`[Tonemap] ${mode} e=${exposure} gpu=(${gpu.map(v => v.toFixed(4))}) cpu=(${cpu.map(v => v.toFixed(4))})`);
            for (let i = 0; i < 3; i++) {
                if (!near(gpu[i], cpu[i], 0.01)) throw new Error(`${mode} e=${exposure} ch${i}: gpu ${gpu[i]} vs cpu ${cpu[i]}`);
            }
        }
    })
}

await test('whitePoint drives Reinhard (higher white point → darker highlights)', async () => {
    const tm = engine.setting.render.tonemap;
    tm.mode = 'Reinhard'; tm.exposure = 1; tm.whitePoint = 2;
    await delay(300);
    const a = await readCenter();
    const cpu = TonemapUtil.apply('Reinhard', hdr, 1, 2);
    expect(near(a[0], cpu[0], 0.01)).tobe(true);
    tm.whitePoint = 16;
    await delay(300);
    const b = await readCenter();
    expect(b[0] < a[0]).tobe(true);                                     // higher white point → darker highlights
    tm.mode = 'ACES'; tm.whitePoint = 4;
})

Engine3D.pause();
setTimeout(end, 500)
