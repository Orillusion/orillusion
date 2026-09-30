import { test, expect, end, waitUntil, delay, readRowRGBA16F } from '../util'
import {
    BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, GlobalBindGroup, LitMaterial, Matrix4, MeshRenderer, MotionBlurPost, MotionBlurUtil,
    Object3D, PassType, PostProcessingComponent, RTResourceMap, Scene3D, Time, Vector3, View3D,
} from '@orillusion/core';

const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 }, setting: { render: { objectMotionVectors: true } as any } });
engine.setting.render.tonemap.mode = 'None';

// Static camera looking down -z at z = 5; a bright box slides along x in front of a dark backdrop.
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(60, engine.aspect, 0.1, 100);
let camX = 0;
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
    return o;
};
wall(400, 0, -0.05, new Color(0.02, 0.02, 0.02, 1));
const box = wall(100, 50, 0, new Color(1, 1, 1, 1));          // covers world x > 0 while boxX = 0
let boxX = 0, boxStep = 0, camStep = 0, frame = 0;
engine.startRenderView(view);
const post = view.scene.addComponent(PostProcessingComponent);
const blur = post.addPost(MotionBlurPost);
blur.frameRateIndependent = false; blur.samples = 16; blur.intensity = 0;

// Triangle-wave motion, one step per rendered frame, applied before the engine ticks.
let lastFrame = -1;
const drive = () => {
    if (Time.frame !== lastFrame) {
        lastFrame = Time.frame;
        frame++;
        const dir = Math.floor(frame / 12) % 2 === 0 ? 1 : -1;
        if (boxStep) { boxX += dir * boxStep; box.x = 50 + boxX; }
        if (camStep) { camX += dir * camStep; place(); }
    }
    requestAnimationFrame(drive);
};
requestAnimationFrame(drive);

const ctx = engine.context3D;
const mvTex = () => RTResourceMap.getTexture(ctx, '_MotionVector');
const tonemapRT = (): GPUTexture => (engine.getRenderJob(view) as any).graph.getPass('PostPass').postList.get('TonemapPost').renderTexture.getGPUTexture();
/** Middle row of the motion-vector texture as [u, v, flag] per pixel. */
async function mvRow(): Promise<number[][]> {
    const t = mvTex().getGPUTexture();
    return readRowRGBA16F(ctx.device, t, 0, Math.floor(t.height / 2), t.width);
}
/** Expected uv delta for a world-x displacement of `dx` at z = 0 with the current camera. */
function uvPerWorldX(dx: number): number {
    const vp = new Matrix4().multiplyMatrices(view.camera.projectionMatrix, view.camera.viewMatrix);
    const a = MotionBlurUtil.projectToUV(new Vector3(camX + 1, 0, 0), vp)!, b = MotionBlurUtil.projectToUV(new Vector3(camX + 1 + dx, 0, 0), vp)!;
    return b[0] - a[0];
}
async function transitionWidth(): Promise<{ width: number; dark: number; bright: number }> {
    const t = tonemapRT();
    const row = await readRowRGBA16F(ctx.device, t, 0, Math.floor(t.height / 2), t.width);
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
/** Median |velocity.x| (uv units) over the columns covered by the box (right quarter) and the backdrop (left quarter). */
async function velocities(): Promise<{ box: number; back: number; boxFlag: number; backFlag: number }> {
    const row = await mvRow();
    const w = row.length;
    const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
    const boxCols = row.slice(Math.floor(w * 0.7), Math.floor(w * 0.95)), backCols = row.slice(Math.floor(w * 0.05), Math.floor(w * 0.3));
    return { box: med(boxCols.map(p => p[0])), back: med(backCols.map(p => p[0])), boxFlag: med(boxCols.map(p => p[2])), backFlag: med(backCols.map(p => p[2])) };
}

await test('setup: velocity passes generated, previous matrices snapshotted, motion blur reads the velocity texture', async () => {
    await waitUntil(() => (engine.getRenderJob(view) as any)?.graph?.getPass('PostPass')?.postList?.get('TonemapPost')?.renderTexture && blur.outTexture && mvTex(), 15000);
    await delay(300);
    const mr = box.getComponent(MeshRenderer);
    expect(mr.material.getPass(PassType.VELOCITY)?.length).tobe(1);
    const group = GlobalBindGroup.getModelMatrixBindGroup(ctx);
    expect(group.keepPrevious).tobe(true);
    expect(!!group.matrixBufferPrev).tobe(true);
    expect(blur.usesVelocityTexture).tobe(true);
    // Graph order: velocities need this frame's depth (after ColorPass) and must exist before the posts run.
    const dot = view.renderGraph!.dumpDot();
    const iColor = dot.indexOf('"ColorPass"'), iMV = dot.indexOf('"MotionVectorPass"'), iPost = dot.indexOf('"PostPass"');
    if (!(iColor >= 0 && iColor < iMV && iMV < iPost)) throw new Error(`graph order ColorPass ${iColor} MotionVectorPass ${iMV} PostPass ${iPost}`);
    // Everything static: zero velocity, but every pixel was written by an object (flag = 1).
    const v = await velocities();
    console.log(`[ObjectMV] static: box ${v.box.toExponential(2)} back ${v.back.toExponential(2)} flags ${v.boxFlag}/${v.backFlag}`);
    expect(Math.abs(v.box) < 1e-4 && Math.abs(v.back) < 1e-4).tobe(true);
    expect(v.boxFlag).tobe(1); expect(v.backFlag).tobe(1);
})

let boxUv = 0;
await test('moving object, static camera: the object carries its own screen velocity, the backdrop stays at zero', async () => {
    boxStep = 0.12;
    await delay(400);
    let best = { box: 0, back: 0, boxFlag: 0, backFlag: 0 };
    for (let i = 0; i < 6; i++) { const v = await velocities(); if (Math.abs(v.box) > Math.abs(best.box)) best = v; await delay(60); }
    boxUv = Math.abs(uvPerWorldX(boxStep));
    console.log(`[ObjectMV] moving box: |v| ${Math.abs(best.box).toExponential(3)} expected ${boxUv.toExponential(3)} back ${best.back.toExponential(2)}`);
    expect(boxUv > 0.005).tobe(true);
    expect(Math.abs(best.box)).toSubequal(boxUv, boxUv * 0.15);
    expect(Math.abs(best.back) < 1e-4).tobe(true);
})

await test('motion blur smears the moving object by about its per-frame displacement (camera-only blur could not)', async () => {
    const t = tonemapRT();
    const pxPerFrame = boxUv * t.width;
    blur.intensity = 1; blur.maxBlurPixels = 200;
    await delay(500);
    const w = await maxTransition();
    console.log(`[ObjectMV] blur: transition ${w} px, displacement ${pxPerFrame.toFixed(1)} px`);
    // Gather blur: only the moving object's own pixels spread, the static backdrop next to the
    // edge has zero velocity, so the edge smears by about half the displacement (a camera pan
    // moves both sides and smears the full amount).
    if (!(pxPerFrame > 5 && w >= pxPerFrame * 0.3 && w <= pxPerFrame * 1.0 + 2)) throw new Error(`blur transition ${w} px, expected ≈ ${(pxPerFrame / 2).toFixed(1)} (uses velocity tex ${blur.usesVelocityTexture})`);
    blur.intensity = 0;
    await delay(400);
    const off = await maxTransition();
    if (off > 2) throw new Error(`blur off: transition still ${off} px`);
    expect(true).tobe(true);
})

await test('moving camera, static scene: object path agrees with the camera-only reprojection', async () => {
    boxStep = 0; camStep = 0.1;
    await delay(400);
    let best = { box: 0, back: 0, boxFlag: 0, backFlag: 0 };
    for (let i = 0; i < 6; i++) { const v = await velocities(); if (Math.abs(v.back) > Math.abs(best.back)) best = v; await delay(60); }
    // A static point at z = 0 moves on screen by -camStep in world x relative to the camera.
    const expected = Math.abs(uvPerWorldX(camStep));
    console.log(`[ObjectMV] moving camera: box |v| ${Math.abs(best.box).toExponential(3)} back |v| ${Math.abs(best.back).toExponential(3)} expected ${expected.toExponential(3)}`);
    expect(Math.abs(best.back)).toSubequal(expected, expected * 0.15);
    expect(Math.abs(best.box)).toSubequal(expected, expected * 0.15);
    camStep = 0;
})

Engine3D.pause();
setTimeout(end, 500)
