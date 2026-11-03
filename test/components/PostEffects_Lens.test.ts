import { test, expect, end, waitUntil, delay, readRowRGBA16F } from '../util'
import { BoxGeometry, CameraUtil, Color, Engine3D, LensPost, LensUtil, MeshRenderer, Object3D, PostProcessingComponent, Scene3D, UnLitMaterial, Vector3, View3D } from '@orillusion/core';

await test('LensUtil: vignette and aberration math', async () => {
    expect(LensUtil.vignette(0.5, 0.5, 1.7, 0.6, 0.4, 1)).toSubequal(1, 1e-9);       // center untouched
    expect(LensUtil.vignette(0.1, 0.9, 1.7, 0, 0.4, 1)).tobe(1);                     // intensity 0 = off
    const corner = LensUtil.vignette(0, 0, 1, 0.5, 0.2, 0);                          // d=(−0.5,−0.5) → 1−0.5 = 0.5 ^ 1.01
    expect(corner).toSubequal(Math.pow(0.5, 1.01), 1e-9);
    // Roundness 1 on a wide screen darkens the left/right edge more than roundness 0.
    expect(LensUtil.vignette(0, 0.5, 2, 0.4, 0.4, 1) < LensUtil.vignette(0, 0.5, 2, 0.4, 0.4, 0)).tobe(true);
    expect(LensUtil.vignette(0, 0, 1, 5, 0.4, 1)).tobe(0);                           // clamps at 0
    expect(LensUtil.chromaticOffset(0.5, 0.5, 0.3)).toEqual([0, 0]);                 // no fringing on the axis
    const o = LensUtil.chromaticOffset(0.75, 0.5, 0.2);
    expect(o[0]).toSubequal(0.25 * 0.0625 * 0.4 * 0.2, 1e-12);
    expect(o[1]).tobe(0);
})

// ---- GPU -------------------------------------------------------------------
const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });
engine.setting.render.tonemap.mode = 'None';
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(60, engine.aspect, 0.1, 100);
view.camera.lookAt(new Vector3(0, 0, 5), new Vector3(0, 0, 0));

const makeWall = (w: number, x: number, z: number, color: Color) => {
    const o = new Object3D();
    const mr = o.addComponent(MeshRenderer);
    mr.geometry = new BoxGeometry(w, 200, 0.01);
    const m = new UnLitMaterial(); m.baseColor = color;
    mr.material = m;
    o.x = x; o.z = z;
    view.scene.addChild(o);
    return o;
};
// Full-screen mid-grey wall, plus a white wall in front covering uv.x > 0.75.
const halfW = 5 * Math.tan(Math.PI / 6) * engine.aspect;                 // world half-width of the view at z = 0
makeWall(400, 0, -0.5, new Color(0.5, 0.5, 0.5, 1));
const bright = makeWall(100, halfW * 0.5 + 50, 0, new Color(1, 1, 1, 1));
engine.startRenderView(view);
const post = view.scene.addComponent(PostProcessingComponent);
const lens = post.addPost(LensPost);

const tonemapRT = (): GPUTexture => (engine.getRenderJob(view) as any).graph.getPass('PostPass').postList.get('TonemapPost').renderTexture.getGPUTexture();
const px = async (u: number, v: number, w = 1) => {
    const t = tonemapRT();
    return readRowRGBA16F(engine.context3D.device, t, Math.min(t.width - w, Math.max(0, u * t.width)), Math.min(t.height - 1, v * t.height), w);
};
const off = () => { lens.vignetteIntensity = 0; lens.chromaticAberration = 0; lens.grainIntensity = 0; lens.grainStatic = true; };

let grey = 0;
await test('LensPost attaches, all-zero settings are a passthrough', async () => {
    await waitUntil(() => (engine.getRenderJob(view) as any)?.graph?.getPass('PostPass')?.postList?.get('TonemapPost')?.renderTexture && lens.renderTexture, 15000);
    expect(engine.setting.render.postProcessing.lens.enable).tobe(true);
    off();
    await delay(400);
    const c = (await px(0.3, 0.5))[0], corner = (await px(0.02, 0.04))[0];
    grey = c[0];
    console.log('[Lens] grey wall center', c.slice(0, 3).map(v => v.toFixed(4)).join(','), 'corner', corner.slice(0, 3).map(v => v.toFixed(4)).join(','));
    expect(grey > 0.05).tobe(true);
    expect(corner[0]).toSubequal(grey, 0.004);
})

await test('vignette: GPU falloff matches LensUtil at several screen points, and tints toward vignetteColor', async () => {
    off();
    lens.vignetteIntensity = 0.7; lens.vignetteSmoothness = 0.3; lens.vignetteRoundness = 1;
    await delay(400);
    const t = tonemapRT();
    const aspect = t.width / t.height;
    for (const [u, v] of [[0.3, 0.5], [0.1, 0.5], [0.3, 0.1], [0.05, 0.9], [0.5, 0.02]]) {
        const gpu = (await px(u, v))[0][0];
        // Sample at the pixel centre the readback actually used.
        const uu = (Math.floor(u * t.width) + 0.5) / t.width, vv = (Math.floor(v * t.height) + 0.5) / t.height;
        const cpu = grey * LensUtil.vignette(uu, vv, aspect, 0.7, 0.3, 1);
        console.log(`[Lens] vignette uv=(${u},${v}) gpu=${gpu.toFixed(4)} cpu=${cpu.toFixed(4)}`);
        if (Math.abs(gpu - cpu) > 0.006) throw new Error(`vignette mismatch at ${u},${v}: gpu ${gpu} cpu ${cpu}`);
    }
    lens.vignetteColor = new Color(0.3, 0, 0, 1);
    lens.vignetteIntensity = 5;                                          // fully vignetted everywhere but the very centre
    await delay(400);
    const tinted = (await px(0.05, 0.1))[0];
    expect(tinted[0]).toSubequal(0.3, 0.01);
    expect(tinted[1] < 0.01 && tinted[2] < 0.01).tobe(true);
    lens.vignetteColor = new Color(0, 0, 0, 1);
})

await test('chromatic aberration: R and B split at an off-axis edge, none on a flat region', async () => {
    off();
    await delay(400);
    const t = tonemapRT();
    // Locate the grey→white edge on the middle row (expected near u = 0.75).
    const row = await px(0.6, 0.5, Math.floor(t.width * 0.3));
    const edge = row.findIndex(p => p[0] > 0.75);
    const edgeU = (Math.floor(0.6 * t.width) + edge) / t.width;
    console.log('[Lens] edge at u =', edgeU.toFixed(4));
    expect(edgeU > 0.7 && edgeU < 0.8).tobe(true);
    const before = row[edge - 3];
    expect(Math.abs(before[0] - before[2]) < 0.004).tobe(true);         // neutral grey without the effect

    lens.chromaticAberration = 4;
    await delay(400);
    const shiftPx = LensUtil.chromaticOffset(edgeU, 0.5, 4)[0] * t.width;
    console.log('[Lens] expected red/blue shift', shiftPx.toFixed(2), 'px');
    expect(shiftPx > 4).tobe(true);
    const x = Math.floor(0.6 * t.width) + edge - 3;                      // 3 px on the grey side of the edge
    const p = (await readRowRGBA16F(engine.context3D.device, t, x, Math.floor(t.height * 0.5), 1))[0];
    console.log('[Lens] fringe pixel', p.slice(0, 3).map(v => v.toFixed(4)).join(','));
    expect(p[0] > 0.9).tobe(true);                                       // red pulled in from the white side
    expect(p[2] < grey + 0.01).tobe(true);                               // blue still grey
    expect(Math.abs(p[1] - grey) < 0.01).tobe(true);                     // green untouched
    const flat = (await px(0.2, 0.5))[0];
    expect(Math.abs(flat[0] - flat[2]) < 0.004).tobe(true);              // uniform region: no fringe
})

await test('grain: adds per-pixel variance, static flag freezes it, off restores a flat image', async () => {
    off();
    lens.grainIntensity = 0.5;
    await delay(400);
    const a = await px(0.2, 0.3, 16);
    const mean = a.reduce((s, p) => s + p[0], 0) / a.length;
    const varA = a.reduce((s, p) => s + (p[0] - mean) ** 2, 0) / a.length;
    console.log('[Lens] grain mean', mean.toFixed(4), 'std', Math.sqrt(varA).toFixed(4));
    expect(Math.sqrt(varA) > 0.02).tobe(true);
    expect(Math.abs(mean - grey) < 0.12).tobe(true);                     // zero-mean noise
    const b = await px(0.2, 0.3, 16);
    expect(a.map(p => p[0].toFixed(5)).join()).tobe(b.map(p => p[0].toFixed(5)).join());   // grainStatic → identical frames
    lens.grainStatic = false;
    await delay(300);
    const c = await px(0.2, 0.3, 16);
    expect(a.map(p => p[0].toFixed(5)).join() !== c.map(p => p[0].toFixed(5)).join()).tobe(true);  // animated
    off();
    await delay(400);
    const flat = await px(0.2, 0.3, 16);
    expect(flat.every(p => Math.abs(p[0] - grey) < 0.004)).tobe(true);
})

await test('removePost detaches and clears the enable flag', async () => {
    post.removePost(LensPost);
    await delay(200);
    expect(engine.setting.render.postProcessing.lens.enable).tobe(false);
    expect((engine.getRenderJob(view) as any).graph.getPass('PostPass').postList.has('LensPost')).tobe(false);
})

Engine3D.pause();
setTimeout(end, 500)
