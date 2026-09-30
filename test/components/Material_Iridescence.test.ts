import { test, expect, end, waitUntil, delay, readRowRGBA16F } from '../util'
import { BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, IridescenceUtil, KHR_materials_iridescence, LitMaterial, MeshRenderer, Object3D, Scene3D, Vector3, View3D } from '@orillusion/core';

const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });
engine.setting.render.tonemap.mode = 'None';
const define = (m: LitMaterial, name: string) => (m.shader.getDefaultColorShader() as any).defineValue[name];

await test('IridescenceUtil: limits and behaviour of the thin-film Fresnel', async () => {
    const base: [number, number, number] = [0.5, 0.5, 0.5];
    // Zero thickness: the film degenerates (its IOR collapses onto the outside medium) → base Fresnel at normal incidence.
    const none = IridescenceUtil.evalIridescence(1, 1.3, 1, 0, base);
    for (const c of none) expect(c).toSubequal(0.5, 0.02);
    // factor 0 → untouched F0
    expect(IridescenceUtil.filmF0(base, 0.8, 0, 1.3, 400)).toEqual([0.5, 0.5, 0.5]);
    // A real film colours a grey base: channels diverge.
    const film = IridescenceUtil.evalIridescence(1, 1.3, 1, 400, base);
    expect(Math.max(...film) - Math.min(...film) > 0.05).tobe(true);
    expect(film.every(c => isFinite(c) && c >= 0)).tobe(true);
    // Hue depends on thickness and on view angle.
    const thin = IridescenceUtil.evalIridescence(1, 1.3, 1, 250, base);
    const grazing = IridescenceUtil.evalIridescence(1, 1.3, 0.4, 400, base);
    const diff = (a: number[], b: number[]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    expect(diff(film, thin) > 0.05).tobe(true);
    expect(diff(film, grazing) > 0.05).tobe(true);
    // Total internal reflection guard (film less dense than the outside at a grazing angle).
    expect(IridescenceUtil.evalIridescence(1.5, 1.0, 0.1, 400, base)).toEqual([1, 1, 1]);
})

await test('LitMaterial iridescence API, clone, and KHR_materials_iridescence.apply', async () => {
    const m = new LitMaterial();
    expect(m.iridescence).tobe(0); expect(m.iridescenceIOR).toSubequal(1.3, 1e-6); expect(m.iridescenceThickness).tobe(400);
    expect(!!define(m, 'USE_IRIDESCENCE')).tobe(false);
    m.iridescenceThickness = 550; m.iridescenceIOR = 1.8;
    expect(!!define(m, 'USE_IRIDESCENCE')).tobe(false);           // parameters alone do not enable it
    m.iridescence = 0.7;
    expect(define(m, 'USE_IRIDESCENCE')).tobe(true);
    expect(m.iridescenceThickness).tobe(550); expect(m.iridescenceIOR).toSubequal(1.8, 1e-6);   // survived the factor write
    m.iridescence = 5; expect(m.iridescence).tobe(1);              // clamped
    m.iridescenceIOR = 0.2; expect(m.iridescenceIOR).tobe(1);
    const c = m.clone() as LitMaterial;
    expect(c.iridescence).tobe(1); expect(c.iridescenceThickness).tobe(550); expect(define(c, 'USE_IRIDESCENCE')).tobe(true);
    m.iridescence = 0;
    expect(define(m, 'USE_IRIDESCENCE')).tobe(false);

    const g = new LitMaterial();
    KHR_materials_iridescence.apply({}, { extensions: { KHR_materials_iridescence: { iridescenceFactor: 0.8, iridescenceIor: 1.6, iridescenceThicknessMaximum: 620 } } }, g);
    expect(g.iridescence).toSubequal(0.8, 1e-6); expect(g.iridescenceIOR).toSubequal(1.6, 1e-6); expect(g.iridescenceThickness).tobe(620);
    const d = new LitMaterial();
    KHR_materials_iridescence.apply({}, { extensions: { KHR_materials_iridescence: { iridescenceFactor: 1 } } }, d);   // spec defaults
    expect(d.iridescenceIOR).toSubequal(1.3, 1e-6); expect(d.iridescenceThickness).tobe(400);
    const n = new LitMaterial();
    KHR_materials_iridescence.apply({}, {}, n);
    expect(!!define(n, 'USE_IRIDESCENCE')).tobe(false);
})

// ---- GPU: a grey metal wall seen and lit head-on, so the specular colour tracks F0 ----
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(60, engine.aspect, 0.1, 100);
view.camera.lookAt(new Vector3(0, 0, 5), new Vector3(0, 0, 0));
const lightObj = new Object3D();
lightObj.rotationY = 180;
lightObj.addComponent(DirectLight).intensity = 3;
view.scene.addChild(lightObj);
const wall = new Object3D();
const mr = wall.addComponent(MeshRenderer);
mr.geometry = new BoxGeometry(200, 200, 1);
const mat = new LitMaterial();
mat.baseColor = new Color(0.5, 0.5, 0.5, 1);
mat.metallic = 1; mat.roughness = 0.6;
mr.material = mat;
view.scene.addChild(wall);
engine.startRenderView(view);

const tonemapPost = (): any => (engine.getRenderJob(view) as any)?.graph?.getPass('PostPass')?.postList?.get('TonemapPost');
async function measure(factor: number, thickness: number, ior = 1.3): Promise<number[]> {
    mat.iridescenceIOR = ior; mat.iridescenceThickness = thickness; mat.iridescence = factor;
    await delay(450);
    const t: GPUTexture = tonemapPost().renderTexture.getGPUTexture();
    return (await readRowRGBA16F(engine.context3D.device, t, t.width >> 1, t.height >> 1, 1))[0].slice(0, 3);
}
const order = (c: number[]) => [0, 1, 2].sort((a, b) => c[b] - c[a]).join('');

let base: number[];
await test('shader compiles with and without USE_IRIDESCENCE; factor 0 is neutral grey', async () => {
    await waitUntil(() => tonemapPost()?.renderTexture, 15000);
    base = await measure(0, 400);
    console.log('[Iridescence] base', base.map(v => v.toFixed(4)).join(', '));
    expect(base[0] > 0.02).tobe(true);
    expect(Math.abs(base[0] - base[2]) / base[0] < 0.08).tobe(true);      // grey metal under white light
    const on = await measure(1, 400);
    expect(on.every(v => isFinite(v))).tobe(true);
})

await test('GPU hue follows the CPU thin-film model across thicknesses', async () => {
    let decisive = 0;
    const seen = new Set<string>();
    for (const thickness of [200, 300, 400, 500, 650, 800]) {
        const gpu = await measure(1, thickness);
        const cpu = IridescenceUtil.filmF0([0.5, 0.5, 0.5], 1, 1, 1.3, thickness);
        const sorted = [...cpu].sort((a, b) => b - a);
        // Only judge when the model clearly separates the strongest and weakest channel.
        const clear = (sorted[0] - sorted[2]) / Math.max(sorted[0], 1e-6) > 0.2;
        const gOrder = order(gpu), cOrder = order(cpu);
        console.log(`[Iridescence] ${thickness} nm gpu=(${gpu.map(v => v.toFixed(3))}) cpuF0=(${cpu.map(v => v.toFixed(3))}) ${gOrder}/${cOrder}${clear ? '' : ' (not decisive)'}`);
        if (!clear) continue;
        decisive++;
        // Strongest and weakest channel must agree.
        if (gOrder[0] !== cOrder[0] || gOrder[2] !== cOrder[2]) throw new Error(`hue mismatch at ${thickness} nm: gpu ${gOrder} vs cpu ${cOrder}`);
        seen.add(cOrder[0] + cOrder[2]);
    }
    expect(decisive >= 3).tobe(true);
    expect(seen.size >= 2).tobe(true);                                     // the sweep really went through different hues
})

await test('factor blends between base and film; film IOR changes the result', async () => {
    const full = await measure(1, 400), half = await measure(0.5, 400);
    for (let i = 0; i < 3; i++) {
        const lo = Math.min(base[i], full[i]) - 0.01, hi = Math.max(base[i], full[i]) + 0.01;
        if (half[i] < lo || half[i] > hi) throw new Error(`factor 0.5 not between base and full on channel ${i}: ${base[i]} ${half[i]} ${full[i]}`);
    }
    const dense = await measure(1, 400, 2.0);
    const d = Math.abs(dense[0] - full[0]) + Math.abs(dense[1] - full[1]) + Math.abs(dense[2] - full[2]);
    expect(d > 0.01).tobe(true);
    const back = await measure(0, 400);
    for (let i = 0; i < 3; i++) expect(back[i]).toSubequal(base[i], 0.005);   // switching it off restores the base exactly
})

Engine3D.pause();
setTimeout(end, 500)
