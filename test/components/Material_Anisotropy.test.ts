import { test, expect, end, waitUntil, delay, readRegionRGBA16F } from '../util'
import { AnisotropyUtil, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, KHR_materials_anisotropy, LitMaterial, MeshRenderer, Object3D, Scene3D, SphereGeometry, Vector3, View3D } from '@orillusion/core';

const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });
engine.setting.render.tonemap.mode = 'None';
const define = (m: LitMaterial, name: string) => (m.shader.getDefaultColorShader() as any).defineValue[name];

await test('AnisotropyUtil: ratio is 1 without anisotropy, and redistributes the lobe with it', async () => {
    const N = [0, 0, 1], T = [1, 0, 0], B = [0, 1, 0], V = [0, 0, 1];
    const tilt = (ax: 'x' | 'y', deg: number) => { const r = (deg * Math.PI) / 180; return ax === 'x' ? [Math.sin(r), 0, Math.cos(r)] : [0, Math.sin(r), Math.cos(r)]; };
    for (const L of [tilt('x', 0), tilt('x', 25), tilt('y', 40)]) expect(AnisotropyUtil.specularRatio(N, V, L, T, B, 0.4, 0)).toSubequal(1, 1e-9);
    expect(AnisotropyUtil.alphaT(0.4, 0)).toSubequal(0.16, 1e-12);
    expect(AnisotropyUtil.alphaT(0.4, 1)).toSubequal(1, 1e-12);
    // Strong anisotropy: the peak (H = N) gets dimmer, a half-vector tilted ALONG the grain gets brighter,
    // one tilted ACROSS the grain (toward B) falls off like the narrow isotropic lobe or faster.
    const peak = AnisotropyUtil.specularRatio(N, V, tilt('x', 0), T, B, 0.3, 1);
    const along = AnisotropyUtil.specularRatio(N, V, tilt('x', 50), T, B, 0.3, 1);
    const across = AnisotropyUtil.specularRatio(N, V, tilt('y', 50), T, B, 0.3, 1);
    console.log(`[Anisotropy] ratio peak ${peak.toFixed(3)} along ${along.toFixed(3)} across ${across.toFixed(3)}`);
    expect(peak < 1).tobe(true);
    expect(along > 1).tobe(true);
    expect(along > across * 3).tobe(true);
})

await test('LitMaterial anisotropy API, clone, and KHR_materials_anisotropy.apply', async () => {
    const m = new LitMaterial();
    expect(m.anisotropy).tobe(0); expect(m.anisotropyRotation).tobe(0);
    expect(!!define(m, 'USE_ANISOTROPY')).tobe(false);
    m.anisotropyRotation = 1.2;
    expect(!!define(m, 'USE_ANISOTROPY')).tobe(false);
    m.anisotropy = 0.8;
    expect(define(m, 'USE_ANISOTROPY')).tobe(true);
    expect(m.anisotropyRotation).toSubequal(1.2, 1e-6);
    m.anisotropy = 3; expect(m.anisotropy).tobe(1);
    const c = m.clone() as LitMaterial;
    expect(c.anisotropy).tobe(1); expect(c.anisotropyRotation).toSubequal(1.2, 1e-6); expect(define(c, 'USE_ANISOTROPY')).tobe(true);
    m.anisotropy = 0;
    expect(define(m, 'USE_ANISOTROPY')).tobe(false);
    const g = new LitMaterial();
    KHR_materials_anisotropy.apply({}, { extensions: { KHR_materials_anisotropy: { anisotropyStrength: 0.6, anisotropyRotation: 0.5 } } }, g);
    expect(g.anisotropy).toSubequal(0.6, 1e-6); expect(g.anisotropyRotation).toSubequal(0.5, 1e-6);
    const n = new LitMaterial();
    KHR_materials_anisotropy.apply({}, {}, n);
    expect(!!define(n, 'USE_ANISOTROPY')).tobe(false);
})

// ---- GPU: highlight shape on a metal sphere lit from the camera -------------
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(40, engine.aspect, 0.1, 100);
view.camera.lookAt(new Vector3(0, 0, 7), new Vector3(0, 0, 0));
const lightObj = new Object3D();
lightObj.rotationY = 180;
lightObj.addComponent(DirectLight).intensity = 3;
view.scene.addChild(lightObj);
const ball = new Object3D();
const mr = ball.addComponent(MeshRenderer);
mr.geometry = new SphereGeometry(2, 96, 96);
const mat = new LitMaterial();
mat.baseColor = new Color(0.7, 0.7, 0.7, 1);
mat.metallic = 1; mat.roughness = 0.4;
mat.setUniformFloat('envIntensity', 0);
mr.material = mat;
view.scene.addChild(ball);
// Dark backdrop so the sphere silhouette does not confuse the measurement.
const back = new Object3D();
const bmr = back.addComponent(MeshRenderer);
bmr.geometry = new BoxGeometry(100, 100, 0.1);
const bmat = new LitMaterial(); bmat.baseColor = new Color(0, 0, 0, 1); bmat.roughness = 1; bmat.metallic = 0; bmat.setUniformFloat('envIntensity', 0);
bmr.material = bmat;
back.z = -4;
view.scene.addChild(back);
engine.startRenderView(view);

const tonemapPost = (): any => (engine.getRenderJob(view) as any)?.graph?.getPass('PostPass')?.postList?.get('TonemapPost');
/** Width and height (px) of the region brighter than half the peak, measured through the brightest pixel. */
async function highlight(strength: number, rotation: number): Promise<{ w: number; h: number; peak: number }> {
    mat.anisotropyRotation = rotation; mat.anisotropy = strength;
    await delay(500);
    const t: GPUTexture = tonemapPost().renderTexture.getGPUTexture();
    const img = await readRegionRGBA16F(engine.context3D.device, t, 0, 0, t.width, t.height);
    let peak = -1, px = 0, py = 0;
    for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) { const v = img[y][x][1]; if (v > peak) { peak = v; px = x; py = y; } }
    const half = peak * 0.5;
    let w = 0, h = 0;
    for (let x = 0; x < t.width; x++) if (img[py][x][1] > half) w++;
    for (let y = 0; y < t.height; y++) if (img[y][px][1] > half) h++;
    return { w, h, peak };
}

let iso: { w: number; h: number; peak: number };
await test('isotropic highlight is round; shader compiles with and without USE_ANISOTROPY', async () => {
    await waitUntil(() => tonemapPost()?.renderTexture, 15000);
    iso = await highlight(0, 0);
    console.log(`[Anisotropy] isotropic ${iso.w}x${iso.h} peak ${iso.peak.toFixed(3)}`);
    expect(iso.peak > 0.05).tobe(true);
    expect(iso.w > 6 && iso.h > 6).tobe(true);
    expect(Math.abs(iso.w - iso.h) / Math.max(iso.w, iso.h) < 0.25).tobe(true);
    const on = await highlight(0.9, 0);
    expect(isFinite(on.peak) && on.peak > 0).tobe(true);
})

await test('anisotropy stretches the highlight along one axis; rotating the grain by 90° swaps the axis', async () => {
    const a = await highlight(0.9, 0);
    const b = await highlight(0.9, Math.PI / 2);
    console.log(`[Anisotropy] rot 0: ${a.w}x${a.h} peak ${a.peak.toFixed(3)} | rot 90: ${b.w}x${b.h} peak ${b.peak.toFixed(3)}`);
    const ra = a.w / a.h, rb = b.w / b.h;
    // One orientation is clearly wider than tall, the other clearly taller than wide.
    expect(Math.max(ra, 1 / ra) > 1.6).tobe(true);
    expect(Math.max(rb, 1 / rb) > 1.6).tobe(true);
    expect((ra > 1) !== (rb > 1)).tobe(true);
    // Energy is spread out: the peak drops compared with the isotropic lobe.
    expect(a.peak < iso.peak).tobe(true);
})

await test('strength 0 restores the isotropic image', async () => {
    const back0 = await highlight(0, 1.0);        // rotation alone must have no effect
    expect(Math.abs(back0.w - iso.w) <= 2 && Math.abs(back0.h - iso.h) <= 2).tobe(true);
    expect(back0.peak).toSubequal(iso.peak, 0.01);
})

Engine3D.pause();
setTimeout(end, 500)
