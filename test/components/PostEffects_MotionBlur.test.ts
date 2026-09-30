import { test, expect, end, waitUntil, delay, readRowRGBA16F } from '../util'
import { BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, LitMaterial, Matrix4, MeshRenderer, MotionBlurPost, MotionBlurUtil, Object3D, PostProcessingComponent, Scene3D, Vector3, View3D } from '@orillusion/core';

// Matrix4 lives in the engine's WASM pool, so the engine must exist before any test builds one.
const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });

await test('MotionBlurUtil: shutter scale, projection, velocity', async () => {
    expect(MotionBlurUtil.shutterScale(0.5, 33.3, false)).tobe(0.5);
    expect(MotionBlurUtil.shutterScale(1, 1000 / 60, true)).toSubequal(1, 1e-9);
    expect(MotionBlurUtil.shutterScale(1, 1000 / 30, true)).toSubequal(0.5, 1e-9);     // slower frame → shorter shutter fraction
    expect(MotionBlurUtil.shutterScale(1, 5000, true)).toSubequal((1000 / 60) / 100, 1e-9); // dt clamped to 100 ms
    const I = new Matrix4().identity();
    const uv = MotionBlurUtil.projectToUV(new Vector3(0.5, 0.5, 0), I);
    expect(uv[0]).toSubequal(0.75, 1e-9); expect(uv[1]).toSubequal(0.25, 1e-9);        // +y is up → smaller v
    expect(MotionBlurUtil.velocityPixels(new Vector3(0.2, 0, 0), I, I, 800, 600)).toEqual([0, 0]);
})

engine.setting.render.tonemap.mode = 'None';
let camX = 0, step = 0;
// Triangle-wave dolly: constant speed, reversing every 12 frames.
let frame = 0;
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(60, engine.aspect, 0.1, 100);
const place = () => view.camera.lookAt(new Vector3(camX, 0, 5), new Vector3(camX, 0, 0));
place();

const lightObj = new Object3D();
lightObj.rotationY = 180;
lightObj.addComponent(DirectLight).intensity = 3;
view.scene.addChild(lightObj);
const wall = (w: number, x: number, z: number, c: Color) => {
    const o = new Object3D();
    const mr = o.addComponent(MeshRenderer);
    mr.geometry = new BoxGeometry(w, 200, 0.01);
    const m = new LitMaterial(); m.baseColor = c; m.roughness = 1; m.metallic = 0;
    mr.material = m;
    o.x = x; o.z = z;
    view.scene.addChild(o);
};
wall(400, 0, -0.05, new Color(0.02, 0.02, 0.02, 1));      // dark backdrop
wall(100, 50, 0, new Color(1, 1, 1, 1));                  // bright wall covering world x > 0

engine.startRenderView(view);
const post = view.scene.addComponent(PostProcessingComponent);
const blur = post.addPost(MotionBlurPost);
blur.frameRateIndependent = false;                       // deterministic: blur by the raw per-frame displacement
blur.samples = 16;

// Drive the camera from a lateUpdate-ish hook: before each frame renders.
const drive = () => {
    if (step !== 0) {
        frame++;
        const dir = Math.floor(frame / 12) % 2 === 0 ? 1 : -1;
        camX += dir * step;
        place();
    }
    requestAnimationFrame(drive);
};
requestAnimationFrame(drive);

const tonemapRT = (): GPUTexture => (engine.getRenderJob(view) as any).graph.getPass('PostPass').postList.get('TonemapPost').renderTexture.getGPUTexture();
/** Width (in pixels) of the dark→bright transition on the middle row: pixels strictly between the two plateaus. */
async function transitionWidth(): Promise<{ width: number; dark: number; bright: number }> {
    const t = tonemapRT();
    const row = await readRowRGBA16F(engine.context3D.device, t, 0, Math.floor(t.height / 2), t.width);
    const v = row.map(p => p[1]);
    const dark = Math.min(...v), bright = Math.max(...v);
    const lo = dark + (bright - dark) * 0.08, hi = bright - (bright - dark) * 0.08;
    return { width: v.filter(x => x > lo && x < hi).length, dark, bright };
}
async function maxTransition(n = 5): Promise<number> {
    let m = 0;
    for (let i = 0; i < n; i++) { m = Math.max(m, (await transitionWidth()).width); await delay(70); }
    return m;
}

await test('static camera: the image stays sharp with the post attached', async () => {
    await waitUntil(() => (engine.getRenderJob(view) as any)?.graph?.getPass('PostPass')?.postList?.get('TonemapPost')?.renderTexture && blur.outTexture, 15000);
    expect(engine.setting.render.postProcessing.motionBlur.enable).tobe(true);
    blur.intensity = 1;
    await delay(500);
    const s = await transitionWidth();
    console.log('[MotionBlur] static: transition', s.width, 'px, dark', s.dark.toFixed(3), 'bright', s.bright.toFixed(3));
    expect(s.bright > s.dark + 0.2).tobe(true);           // the edge is really there
    expect(s.width <= 2).tobe(true);
})

let pxPerFrame = 0;
await test('moving camera: the edge is smeared by about the per-frame displacement', async () => {
    const t = tonemapRT();
    step = 0.12;
    // World → pixels at z = 0: width / (2 · 5 · tan30° · aspect)
    pxPerFrame = step * t.width / (2 * 5 * Math.tan(Math.PI / 6) * (t.width / t.height));
    blur.intensity = 1; blur.maxBlurPixels = 200;
    await delay(600);
    const w = await maxTransition();
    console.log('[MotionBlur] moving: transition', w, 'px, expected ≈', pxPerFrame.toFixed(1));
    expect(pxPerFrame > 5).tobe(true);
    expect(w >= pxPerFrame * 0.5 && w <= pxPerFrame * 1.6 + 2).tobe(true);
})

await test('intensity scales the smear; 0 turns it off while the camera keeps moving', async () => {
    blur.intensity = 2;
    await delay(400);
    const twice = await maxTransition();
    blur.intensity = 0;
    await delay(400);
    const off = await maxTransition();
    console.log('[MotionBlur] intensity 2 →', twice, 'px; intensity 0 →', off, 'px');
    expect(twice > pxPerFrame * 1.2).tobe(true);
    expect(off <= 2).tobe(true);
})

await test('maxBlurPixels clamps the smear', async () => {
    blur.intensity = 2; blur.maxBlurPixels = 3;
    await delay(400);
    const clamped = await maxTransition();
    console.log('[MotionBlur] clamp 3 px →', clamped, 'px');
    expect(clamped <= 5).tobe(true);
    blur.maxBlurPixels = 64;
})

await test('stopping the camera restores a sharp image; removePost clears the flag', async () => {
    step = 0;
    blur.intensity = 1;
    await delay(500);
    expect((await transitionWidth()).width <= 2).tobe(true);
    post.removePost(MotionBlurPost);
    await delay(200);
    expect(engine.setting.render.postProcessing.motionBlur.enable).tobe(false);
})

Engine3D.pause();
setTimeout(end, 500)
