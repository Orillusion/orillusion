import { test, expect, end, waitUntil, delay } from '../util'
import { BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, KHR_materials_sheen, LitMaterial, MeshRenderer, Object3D, Scene3D, Vector3, View3D } from '@orillusion/core';

const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });
engine.setting.render.tonemap.mode = 'None';       // read scene-linear values back unchanged

const define = (m: LitMaterial, name: string) => (m.shader.getDefaultColorShader() as any).defineValue[name];

await test('LitMaterial sheen API: defaults, define toggling, roughness packing, clone', async () => {
    const m = new LitMaterial();
    expect(m.sheenRoughness).tobe(0);
    expect(m.sheenColor.r + m.sheenColor.g + m.sheenColor.b).tobe(0);
    expect(!!define(m, 'USE_SHEEN')).tobe(false);

    m.sheenRoughness = 0.6;
    expect(!!define(m, 'USE_SHEEN')).tobe(false);              // roughness alone does not enable the lobe
    m.sheenColor = new Color(0.9, 0.5, 0.2, 1);
    expect(define(m, 'USE_SHEEN')).tobe(true);
    expect(m.sheenColor.r).toSubequal(0.9, 1e-6);
    expect(m.sheenRoughness).toSubequal(0.6, 1e-6);            // survived the color write (packed in alpha)
    m.sheenRoughness = 7;
    expect(m.sheenRoughness).tobe(1);                          // clamped
    m.sheenRoughness = 0.6;

    const c = m.clone() as LitMaterial;
    expect(c.sheenColor.g).toSubequal(0.5, 1e-6);
    expect(c.sheenRoughness).toSubequal(0.6, 1e-6);
    expect(define(c, 'USE_SHEEN')).tobe(true);

    m.sheenColor = new Color(0, 0, 0);
    expect(define(m, 'USE_SHEEN')).tobe(false);                // black switches it off again
})

await test('KHR_materials_sheen.apply reads factors, ignores materials without the extension', async () => {
    const a = new LitMaterial();
    KHR_materials_sheen.apply({}, { extensions: { KHR_materials_sheen: { sheenColorFactor: [0.2, 0.4, 0.6], sheenRoughnessFactor: 0.3 } } }, a);
    expect(a.sheenColor.b).toSubequal(0.6, 1e-6);
    expect(a.sheenRoughness).toSubequal(0.3, 1e-6);
    expect(define(a, 'USE_SHEEN')).tobe(true);
    const b = new LitMaterial();
    KHR_materials_sheen.apply({}, { extensions: { KHR_materials_clearcoat: {} } }, b);
    KHR_materials_sheen.apply({}, {}, b);
    expect(!!define(b, 'USE_SHEEN')).tobe(false);
})

// ---- GPU -------------------------------------------------------------------
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(60, engine.aspect, 0.1, 100);
view.camera.lookAt(new Vector3(0, 0, 5), new Vector3(0, 0, 0));
// Light hits the wall at 60° from its normal; the camera looks straight down the normal.
const lightObj = new Object3D();
lightObj.rotationY = 180 - 60;
const light = lightObj.addComponent(DirectLight);
light.intensity = 3;
view.scene.addChild(lightObj);
const wall = new Object3D();
const mr = wall.addComponent(MeshRenderer);
mr.geometry = new BoxGeometry(200, 200, 1);
const mat = new LitMaterial();
mat.baseColor = new Color(0.2, 0.1, 0.05, 1);
mat.roughness = 0.9; mat.metallic = 0;
mr.material = mat;
view.scene.addChild(wall);
engine.startRenderView(view);

function halfToFloat(h: number): number {
    const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
    if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
    if (e === 31) return f ? NaN : s * Infinity;
    return s * Math.pow(2, e - 15) * (1 + f / 1024);
}
const tonemapPost = (): any => (engine.getRenderJob(view) as any)?.graph?.getPass('PostPass')?.postList?.get('TonemapPost');
async function readCenter(): Promise<[number, number, number]> {
    const tex: GPUTexture = tonemapPost().renderTexture.getGPUTexture();
    const device = engine.context3D.device;
    const buf = device.createBuffer({ size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const enc = device.createCommandEncoder();
    enc.copyTextureToBuffer({ texture: tex, origin: { x: tex.width >> 1, y: tex.height >> 1 } }, { buffer: buf, bytesPerRow: 256 }, { width: 1, height: 1 });
    device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const u16 = new Uint16Array(buf.getMappedRange().slice(0, 8));
    buf.unmap(); buf.destroy();
    return [halfToFloat(u16[0]), halfToFloat(u16[1]), halfToFloat(u16[2])];
}
async function measure(sheen: Color, roughness: number) {
    mat.sheenRoughness = roughness;
    mat.sheenColor = sheen;
    await delay(500);                                         // define flip → pipeline rebuild → a few frames
    return readCenter();
}

let base: [number, number, number];
await test('shader compiles with and without USE_SHEEN and the wall is lit', async () => {
    await waitUntil(() => tonemapPost()?.renderTexture, 15000);
    base = await measure(new Color(0, 0, 0), 0.8);
    console.log('[Sheen] base', base.map(v => v.toFixed(4)).join(', '));
    expect(base[0] > 0.01 && base[0] > base[1] && base[1] > base[2]).tobe(true);
    const lit = await measure(new Color(1, 1, 1), 0.8);
    console.log('[Sheen] white sheen r=0.8', lit.map(v => v.toFixed(4)).join(', '));
    expect(lit.every(v => isFinite(v))).tobe(true);
})

await test('output = base·(1 − 0.157·max(sheen)) + sheen·S  (linear in sheen color)', async () => {
    const full = await measure(new Color(1, 1, 1), 0.8);
    const half = await measure(new Color(0.5, 0.5, 0.5), 0.8);
    for (let i = 0; i < 3; i++) {
        const S_full = full[i] - base[i] * (1 - 0.157);
        const S_half = (half[i] - base[i] * (1 - 0.157 * 0.5)) / 0.5;
        console.log(`[Sheen] ch${i} S(full)=${S_full.toFixed(4)} S(half)=${S_half.toFixed(4)}`);
        expect(S_full > 0.005).tobe(true);                    // the lobe really adds light at 60° incidence
        if (Math.abs(S_full - S_half) > 0.01 + 0.05 * Math.abs(S_full)) throw new Error(`not linear in sheen color: ${S_full} vs ${S_half}`);
    }
})

await test('sheen tint colors the lobe; roughness changes its strength', async () => {
    const red = await measure(new Color(1, 0, 0), 0.8);
    const dR = red[0] - base[0] * (1 - 0.157), dB = red[2] - base[2] * (1 - 0.157);
    expect(dR > 0.005).tobe(true);
    expect(Math.abs(dB) < 0.003).tobe(true);                  // no blue added by a red sheen
    const rough = await measure(new Color(1, 1, 1), 1.0);
    const tight = await measure(new Color(1, 1, 1), 0.3);
    console.log('[Sheen] r=1.0', rough[0].toFixed(4), 'r=0.3', tight[0].toFixed(4));
    expect(Math.abs(rough[0] - tight[0]) > 0.003).tobe(true);
})

Engine3D.pause();
setTimeout(end, 500)
