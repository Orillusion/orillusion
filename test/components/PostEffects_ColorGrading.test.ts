import { test, expect, end, waitUntil, delay, readRowRGBA16F } from '../util'
import { BoxGeometry, CameraUtil, Color, ColorGradingPost, ColorGradingSetting, ColorGradingUtil, Engine3D, MeshRenderer, Object3D, PostProcessingComponent, Scene3D, UnLitMaterial, Vector3, View3D } from '@orillusion/core';

type RGB = [number, number, number];

await test('ColorGradingUtil: neutral is identity; each control does what it says', async () => {
    const n = ColorGradingUtil.neutral();
    const c: RGB = [0.6, 0.3, 0.15];
    const id = ColorGradingUtil.apply(c, n);
    for (let i = 0; i < 3; i++) expect(id[i]).toSubequal(c[i], 1e-9);
    expect(ColorGradingUtil.apply(c, { ...n, exposure: 1 })[0]).toSubequal(1.2, 1e-9);
    const grey = ColorGradingUtil.apply(c, { ...n, saturation: 0 });
    const luma = 0.2126 * 0.6 + 0.7152 * 0.3 + 0.0722 * 0.15;
    for (const v of grey) expect(v).toSubequal(luma, 1e-9);
    const warm = ColorGradingUtil.apply([0.5, 0.5, 0.5], { ...n, temperature: 1 });
    expect(warm[0] > warm[1] && warm[1] > warm[2]).tobe(true);
    const magenta = ColorGradingUtil.apply([0.5, 0.5, 0.5], { ...n, tint: 1 });
    expect(magenta[1] < magenta[0] && magenta[1] < magenta[2]).tobe(true);
    // Contrast pivots on gamma-space 0.5: that value stays put, darker gets darker, brighter gets brighter.
    const pivot = Math.pow(0.5, 2.2);
    const hc = { ...n, contrast: 1.5 };
    expect(ColorGradingUtil.apply([pivot, pivot, pivot], hc)[0]).toSubequal(pivot, 1e-9);
    expect(ColorGradingUtil.apply([0.05, 0.05, 0.05], hc)[0] < 0.05).tobe(true);
    expect(ColorGradingUtil.apply([0.8, 0.8, 0.8], hc)[0] > 0.8).tobe(true);
    // ASC CDL: out = (in·slope + offset)^power
    const cdl = ColorGradingUtil.apply([0.5, 0.5, 0.5], { ...n, slope: [2, 1, 1], offset: [0, 0.1, 0], power: [1, 1, 2] });
    expect(cdl[0]).toSubequal(1.0, 1e-9); expect(cdl[1]).toSubequal(0.6, 1e-9); expect(cdl[2]).toSubequal(0.25, 1e-9);
})

await test('ColorGradingUtil: strip LUT layout and trilinear lookup', async () => {
    const lut = ColorGradingUtil.createLUTData(16);
    expect(lut.width).tobe(256); expect(lut.height).tobe(16);
    // Pixel for r=15 (x within slice), g=0 (top row), b=1 (second slice) → x = 16 + 15.
    const i = (0 * lut.width + 1 * 16 + 15) * 4;
    expect([lut.data[i], lut.data[i + 1], lut.data[i + 2], lut.data[i + 3]]).toEqual([255, 0, 17, 255]);
    for (const c of [[0.2, 0.7, 0.4], [1, 0, 0.5], [0.03, 0.96, 0.51]] as RGB[]) {
        const o = ColorGradingUtil.sampleLUT(lut, c);
        for (let k = 0; k < 3; k++) expect(o[k]).toSubequal(c[k], 0.004);      // neutral LUT ≈ identity (8-bit)
    }
    const rot = ColorGradingUtil.createLUTData(16, (r, g, b) => [g, b, r]);
    const o = ColorGradingUtil.sampleLUT(rot, [0.2, 0.6, 0.9]);
    expect(o[0]).toSubequal(0.6, 0.004); expect(o[1]).toSubequal(0.9, 0.004); expect(o[2]).toSubequal(0.2, 0.004);
})

// ---- GPU: a flat wall, tonemap off, so the input to the grade is known exactly ----
const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });
engine.setting.render.tonemap.mode = 'None';
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(60, engine.aspect, 0.1, 100);
view.camera.lookAt(new Vector3(0, 0, 5), new Vector3(0, 0, 0));
const wall = new Object3D();
const mr = wall.addComponent(MeshRenderer);
mr.geometry = new BoxGeometry(200, 200, 1);
const mat = new UnLitMaterial();
mat.baseColor = new Color(0.62, 0.34, 0.16, 1);
mr.material = mat;
view.scene.addChild(wall);
engine.startRenderView(view);
const post = view.scene.addComponent(PostProcessingComponent);
const grade = post.addPost(ColorGradingPost);

const posts = (): Map<string, any> => (engine.getRenderJob(view) as any).graph.getPass('PostPass').postList;
const center = async (name: string): Promise<RGB> => {
    const t: GPUTexture = posts().get(name).renderTexture.getGPUTexture();
    return (await readRowRGBA16F(engine.context3D.device, t, t.width >> 1, t.height >> 1, 1))[0].slice(0, 3) as RGB;
};
const current = (): ColorGradingSetting => engine.setting.render.postProcessing.colorGrading;
const reset = () => Object.assign(current(), ColorGradingUtil.neutral());
const close = (a: RGB, b: RGB, eps: number, label: string) => {
    for (let i = 0; i < 3; i++) if (Math.abs(a[i] - b[i]) > eps) throw new Error(`${label}: channel ${i} gpu ${a[i].toFixed(4)} vs cpu ${b[i].toFixed(4)}`);
};

let input: RGB;
await test('attached after the tonemap; neutral settings pass the image through', async () => {
    await waitUntil(() => posts().get('TonemapPost')?.renderTexture && grade.renderTexture, 15000);
    expect(engine.setting.render.postProcessing.colorGrading.enable).tobe(true);
    expect(grade.isFinalPass).tobe(true);
    reset();
    await delay(400);
    input = await center('TonemapPost');
    console.log('[ColorGrading] input', input.map(v => v.toFixed(4)).join(', '));
    expect(input[0] > input[1] && input[1] > input[2] && input[2] > 0.005 && input[0] < 1).tobe(true);
    close(await center('ColorGradingPost'), input, 0.003, 'neutral');
})

const cases: [string, Partial<ColorGradingSetting>][] = [
    ['exposure +0.5 EV', { exposure: 0.5 }],
    ['temperature / tint', { temperature: 0.6, tint: -0.4 }],
    ['contrast 1.4', { contrast: 1.4 }],
    ['saturation 0', { saturation: 0 }],
    ['saturation 1.6', { saturation: 1.6 }],
    ['ASC CDL', { slope: [1.2, 0.9, 1.1], offset: [0.02, 0, -0.01], power: [0.9, 1.1, 1.3] }],
    ['everything together', { exposure: -0.3, temperature: -0.5, tint: 0.3, contrast: 1.2, saturation: 1.3, slope: [1.1, 1, 0.9], offset: [0, 0.01, 0.02], power: [1.1, 0.95, 1] }],
];
for (const [label, patch] of cases) {
    await test(`GPU matches ColorGradingUtil: ${label}`, async () => {
        reset();
        Object.assign(current(), patch);
        await delay(350);
        const gpu = await center('ColorGradingPost');
        const cpu = ColorGradingUtil.apply(input, current());
        console.log(`[ColorGrading] ${label} gpu=(${gpu.map(v => v.toFixed(4))}) cpu=(${cpu.map(v => v.toFixed(4))})`);
        close(gpu, cpu, 0.006, label);
    })
}

await test('LUT: neutral is a no-op, a channel-rotating LUT matches the CPU lookup, intensity blends, null removes it', async () => {
    reset();
    const neutral = grade.setLUTFromFunction(16, (r, g, b) => [r, g, b]);
    expect(grade.lutSize).tobe(16);
    await delay(400);
    close(await center('ColorGradingPost'), ColorGradingUtil.applyWithLUT(input, current(), neutral), 0.006, 'neutral LUT vs cpu');
    close(await center('ColorGradingPost'), input, 0.012, 'neutral LUT vs input');       // 8-bit, 16³ LUT: small quantization only

    // (r,g,b) → (g,b,r) catches any mix-up of the red / green / blue axes or a vertical flip.
    const rot = grade.setLUTFromFunction(16, (r, g, b) => [g, b, r]);
    await delay(400);
    const full = await center('ColorGradingPost');
    const cpuFull = ColorGradingUtil.applyWithLUT(input, current(), rot);
    console.log(`[ColorGrading] LUT rotate gpu=(${full.map(v => v.toFixed(4))}) cpu=(${cpuFull.map(v => v.toFixed(4))})`);
    close(full, cpuFull, 0.012, 'rotating LUT');
    expect(full[0] < full[2]).tobe(true);                                               // red ← green(0.34-ish), blue ← red(0.62-ish)

    grade.lutIntensity = 0.5;
    await delay(350);
    close(await center('ColorGradingPost'), ColorGradingUtil.applyWithLUT(input, current(), rot), 0.012, 'LUT at 50 %');

    grade.lutIntensity = 1;
    grade.lut = null;
    expect(grade.lutSize).tobe(0);
    await delay(350);
    close(await center('ColorGradingPost'), input, 0.003, 'LUT removed');
})

await test('removePost detaches and clears the enable flag', async () => {
    post.removePost(ColorGradingPost);
    await delay(200);
    expect(engine.setting.render.postProcessing.colorGrading.enable).tobe(false);
    expect(posts().has('ColorGradingPost')).tobe(false);
})

Engine3D.pause();
setTimeout(end, 500)
