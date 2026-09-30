import { test, expect, end, waitUntil, delay, readRegionRGBA16F } from '../util'
import {
    AtmosphericComponent, CameraUtil, Color, DirectLight, Engine3D, KHR_materials_anisotropy, KHR_materials_iridescence, KHR_materials_sheen,
    KHR_materials_specular, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, Scene3D, Time, Uint8ArrayTexture, Vector3, View3D,
} from '@orillusion/core';
import { buildExtensionTexturesGLB, encodeHalfPNG } from '@samples/utils/GLBBuilder';

const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });
engine.setting.render.tonemap.mode = 'None';
const define = (m: LitMaterial, name: string) => !!(m.shader.getDefaultColorShader() as any).defineValue[name];

/** 64×64 texture whose left half is `left` and right half `right` (RGBA 0..255). */
function halfTexture(left: number[], right: number[]): Uint8ArrayTexture {
    const w = 64, h = 64, data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = x < w / 2 ? left : right, o = (y * w + x) * 4;
        data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = c[3];
    }
    return new Uint8ArrayTexture().create(w, h, data, false, engine.context3D);
}

await test('LitMaterial texture slots flip their defines, survive clone, and the glTF appliers bind resolved textures', async () => {
    const tex = halfTexture([0, 0, 0, 255], [255, 255, 255, 255]);
    const m = new LitMaterial();
    const slots: [string, string][] = [
        ['sheenColorMap', 'USE_SHEENMAP'], ['sheenRoughnessMap', 'USE_SHEENROUGHNESSMAP'], ['iridescenceMap', 'USE_IRIDESCENCEMAP'],
        ['iridescenceThicknessMap', 'USE_IRIDESCENCE_THICKNESSMAP'], ['specularMap', 'USE_SPECULARMAP'], ['specularColorMap', 'USE_SPECULARCOLORMAP'],
        ['anisotropyMap', 'USE_ANISOTROPYMAP'],
    ];
    for (const [slot, def] of slots) {
        expect(define(m, def)).tobe(false);
        (m as any)[slot] = tex;
        expect(define(m, def)).tobe(true);
        expect((m as any)[slot] === tex).tobe(true);
    }
    const c = m.clone() as LitMaterial;
    for (const [slot, def] of slots) { expect(define(c, def)).tobe(true); expect((c as any)[slot] === tex).tobe(true); }
    (m as any).sheenColorMap = null;
    expect(define(m, 'USE_SHEENMAP')).tobe(false);
    expect(m.sheenColorMap).tobe(null);
    expect(m.iridescenceThicknessMinimum).tobe(100);
    m.iridescenceThicknessMinimum = 250;
    expect(m.iridescenceThicknessMinimum).tobe(250);

    // glTF: the async parser leaves *TextureResolved on the material json; appliers bind them.
    const g = new LitMaterial();
    KHR_materials_sheen.apply({}, { extensions: { KHR_materials_sheen: {} }, sheenColorTextureResolved: tex, sheenRoughnessTextureResolved: tex }, g);
    expect(g.sheenColorMap === tex && g.sheenRoughnessMap === tex).tobe(true);
    expect(g.sheenColor.r).tobe(1); expect(g.sheenRoughness).tobe(1);          // texture without factor → factor 1
    KHR_materials_iridescence.apply({}, { extensions: { KHR_materials_iridescence: { iridescenceFactor: 1, iridescenceThicknessMinimum: 150, iridescenceThicknessMaximum: 600 } }, iridescenceTextureResolved: tex, iridescenceThicknessTextureResolved: tex }, g);
    expect(g.iridescenceMap === tex && g.iridescenceThicknessMap === tex).tobe(true);
    expect(g.iridescenceThicknessMinimum).tobe(150); expect(g.iridescenceThickness).tobe(600);
    KHR_materials_specular.apply({}, { extensions: { KHR_materials_specular: {} }, specularTextureResolved: tex, specularColorTextureResolved: tex }, g);
    expect(g.specularMap === tex && g.specularColorMap === tex).tobe(true);
    KHR_materials_anisotropy.apply({}, { extensions: { KHR_materials_anisotropy: {} }, anisotropyTextureResolved: tex }, g);
    expect(g.anisotropyMap === tex).tobe(true);
    expect(g.anisotropy).tobe(1);
    const plain = new LitMaterial();
    KHR_materials_sheen.apply({}, { extensions: { KHR_materials_sheen: { sheenColorFactor: [1, 0, 0] } } }, plain);
    expect(define(plain, 'USE_SHEENMAP')).tobe(false);
})

await test('glTF: extension textures embedded in a GLB are resolved and bound', async () => {
    const png = await encodeHalfPNG(32, '#000', '#fff');
    const root = await engine.res.loadGltf(URL.createObjectURL(buildExtensionTexturesGLB(png)));
    const m = root.getComponentsInChild(MeshRenderer)[0].material as LitMaterial;
    for (const [slot, def] of [['sheenColorMap', 'USE_SHEENMAP'], ['sheenRoughnessMap', 'USE_SHEENROUGHNESSMAP'], ['iridescenceMap', 'USE_IRIDESCENCEMAP'],
        ['iridescenceThicknessMap', 'USE_IRIDESCENCE_THICKNESSMAP'], ['specularMap', 'USE_SPECULARMAP'], ['specularColorMap', 'USE_SPECULARCOLORMAP'], ['anisotropyMap', 'USE_ANISOTROPYMAP']]) {
        expect(!!(m as any)[slot]).tobe(true);
        expect(define(m, def)).tobe(true);
    }
    expect(m.sheenColorMap === m.specularColorMap).tobe(true);           // one image, one Texture
    expect(m.sheenRoughness).toSubequal(0.6, 1e-6);
    expect(m.iridescenceThicknessMinimum).tobe(200); expect(m.iridescenceThickness).tobe(600);
    expect(m.anisotropy).tobe(1);
    expect(define(m, 'USE_SHEEN') && define(m, 'USE_IRIDESCENCE') && define(m, 'USE_ANISOTROPY')).tobe(true);
})

// ---- GPU: a full-screen quad, texture halves vs. factor-only references ---------
const view = new View3D();
view.scene = new Scene3D();
view.scene.addComponent(AtmosphericComponent).sunY = 0.6;
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(40, engine.aspect, 0.1, 100);
view.camera.lookAt(new Vector3(0, 0, 5), new Vector3(0, 0, 0));
const lightObj = new Object3D();
lightObj.rotationY = 180;
lightObj.addComponent(DirectLight).intensity = 3;
view.scene.addChild(lightObj);
const quad = new Object3D();
const mr = quad.addComponent(MeshRenderer);
mr.geometry = new PlaneGeometry(8, 8, 1, 1, Vector3.Z_AXIS);
const mat = new LitMaterial();
mr.material = mat;
view.scene.addChild(quad);
engine.startRenderView(view);
const tonemapPost = (): any => (engine.getRenderJob(view) as any)?.graph?.getPass('PostPass')?.postList?.get('TonemapPost');

/** Mean RGB of the left and right thirds of the frame (centre rows). */
async function halves(): Promise<{ l: number[]; r: number[] }> {
    // Shader rebuilds can stall the frame loop; wait for real frames, not wall time.
    const f0 = Time.frame;
    if (!(await waitUntil(() => Time.frame >= f0 + 4, 20000))) throw new Error('engine frames stalled');
    await delay(100);
    const t: GPUTexture = tonemapPost().renderTexture.getGPUTexture();
    const y0 = (t.height >> 1) - 8;
    const img = await readRegionRGBA16F(engine.context3D.device, t, 0, y0, t.width, 16);
    const mean = (x0: number, x1: number) => {
        const s = [0, 0, 0]; let n = 0;
        for (const row of img) for (let x = x0; x < x1; x++) { s[0] += row[x][0]; s[1] += row[x][1]; s[2] += row[x][2]; n++; }
        return s.map((v) => v / n);
    };
    return { l: mean(Math.floor(t.width * 0.1), Math.floor(t.width * 0.4)), r: mean(Math.floor(t.width * 0.6), Math.floor(t.width * 0.9)) };
}
const close = (a: number[], b: number[], tol: number) => a.every((v, i) => Math.abs(v - b[i]) <= tol + 0.03 * Math.abs(b[i]));
const differ = (a: number[], b: number[], min: number) => a.some((v, i) => Math.abs(v - b[i]) > min);
const fmt = (v: number[]) => v.map((x) => x.toFixed(3)).join(',');

/**
 * Generic check: `off()` and `on()` configure the factor-only extremes; `withTex()` binds a
 * half-and-half texture that should reproduce `off` on one side and `on` on the other.
 */
async function checkHalves(label: string, off: () => void, on: () => void, withTex: () => void, clear: () => void, minDiff = 0.02) {
    // The sky reflection is not uniform across the quad, so each side is
    // always compared with the same side of the reference frames.
    off(); const A = await halves();
    on(); const B = await halves();
    withTex(); const C = await halves();
    clear();
    const msg = `${label}: off ${fmt(A.l)}/${fmt(A.r)} on ${fmt(B.l)}/${fmt(B.r)} | tex ${fmt(C.l)}/${fmt(C.r)}`;
    console.log('[ExtTex] ' + msg);
    if (gpuErrors.length) throw new Error(`GPU errors (${gpuErrors.length}): ${gpuErrors[0]} — ` + msg);
    if (!differ(A.l, B.l, minDiff) || !differ(A.r, B.r, minDiff)) throw new Error('effect not visible — ' + msg);
    const ok = (close(C.l, A.l, 0.01) && close(C.r, B.r, 0.01)) || (close(C.l, B.l, 0.01) && close(C.r, A.r, 0.01));
    if (!ok) throw new Error('texture halves do not match the factor-only references — ' + msg);
    expect(true).tobe(true);
}

// Removing a texture rebuilds the pipeline with a different bind group layout; any
// validation error there used to freeze the material silently, so watch for them.
const gpuErrors: string[] = [];
(engine.context3D.device as any).addEventListener('uncapturederror', (e: any) => gpuErrors.push(String(e.error.message).slice(0, 300).replace(/[=?&;]/g, ' ')));
function reset() {
    mat.baseColor = new Color(0.5, 0.5, 0.5, 1); mat.roughness = 0.5; mat.metallic = 0;
    mat.sheenColor = new Color(0, 0, 0, 1); mat.iridescence = 0; mat.anisotropy = 0;
    mat.setUniformColor('specularColor', new Color(1, 1, 1, 1));
    mat.sheenColorMap = null; mat.sheenRoughnessMap = null; mat.iridescenceMap = null; mat.iridescenceThicknessMap = null;
    mat.specularMap = null; mat.specularColorMap = null; mat.anisotropyMap = null;
}

await test('sheenColorMap and sheenRoughnessMap', async () => {
    await waitUntil(() => tonemapPost()?.renderTexture, 15000);
    reset();
    mat.baseColor = new Color(0.3, 0.05, 0.05, 1); mat.roughness = 0.9;
    const bw = halfTexture([0, 0, 0, 255], [255, 255, 255, 255]);
    await checkHalves('sheenColorMap',
        () => { mat.sheenRoughness = 0.5; mat.sheenColor = new Color(0.001, 0.001, 0.001); },   // lobe on, no tint
        () => { mat.sheenColor = new Color(1, 1, 1); },
        () => { mat.sheenColor = new Color(1, 1, 1); mat.sheenColorMap = bw; },
        () => { mat.sheenColorMap = null; });
    const aa = halfTexture([0, 0, 0, 25], [0, 0, 0, 255]);
    await checkHalves('sheenRoughnessMap',
        () => { mat.sheenColor = new Color(1, 1, 1); mat.sheenRoughness = 0.1; },
        () => { mat.sheenRoughness = 1; },
        () => { mat.sheenRoughness = 1; mat.sheenRoughnessMap = aa; },
        () => { mat.sheenRoughnessMap = null; }, 0.01);
})

await test('iridescenceMap and iridescenceThicknessMap', async () => {
    reset();
    mat.baseColor = new Color(0.9, 0.9, 0.9, 1); mat.metallic = 1; mat.roughness = 0.3;
    const rr = halfTexture([0, 0, 0, 255], [255, 0, 0, 255]);
    await checkHalves('iridescenceMap',
        () => { mat.iridescenceThickness = 400; mat.iridescence = 0.001; },
        () => { mat.iridescence = 1; },
        () => { mat.iridescence = 1; mat.iridescenceMap = rr; },
        () => { mat.iridescenceMap = null; });
    const gg = halfTexture([0, 0, 0, 255], [0, 255, 0, 255]);
    await checkHalves('iridescenceThicknessMap',
        () => { mat.iridescence = 1; mat.iridescenceThicknessMinimum = 150; mat.iridescenceThickness = 150; },   // = minimum
        () => { mat.iridescenceThickness = 700; },                                                            // = maximum
        () => { mat.iridescenceThickness = 700; mat.iridescenceThicknessMap = gg; },
        () => { mat.iridescenceThicknessMap = null; });
})

await test('specularMap (strength) and specularColorMap (tint)', async () => {
    reset();
    mat.baseColor = new Color(0.2, 0.2, 0.2, 1); mat.roughness = 0.15; mat.metallic = 0;
    mat.setUniformFloat('ior', 3);          // F0 = 0.25: a strong dielectric reflection so the strength is measurable
    const aa = halfTexture([0, 0, 0, 0], [0, 0, 0, 255]);
    await checkHalves('specularMap',
        () => { mat.setUniformColor('specularColor', new Color(1, 1, 1, 0)); },
        () => { mat.setUniformColor('specularColor', new Color(1, 1, 1, 1)); },
        () => { mat.setUniformColor('specularColor', new Color(1, 1, 1, 1)); mat.specularMap = aa; },
        () => { mat.specularMap = null; }, 0.01);
    const rw = halfTexture([255, 0, 0, 255], [255, 255, 255, 255]);
    await checkHalves('specularColorMap',
        () => { mat.setUniformColor('specularColor', new Color(1, 0, 0, 1)); },
        () => { mat.setUniformColor('specularColor', new Color(1, 1, 1, 1)); },
        () => { mat.setUniformColor('specularColor', new Color(1, 1, 1, 1)); mat.specularColorMap = rw; },
        () => { mat.specularColorMap = null; mat.setUniformFloat('ior', 1.5); });
})

await test('anisotropyMap (strength in blue, direction in red/green)', async () => {
    reset();
    mat.baseColor = new Color(0.8, 0.8, 0.8, 1); mat.metallic = 1; mat.roughness = 0.35;
    // Light from the side so the stretched lobe changes what the flat quad reflects.
    lightObj.rotationY = 140; lightObj.rotationX = 20;
    const bb = halfTexture([255, 128, 0, 255], [255, 128, 255, 255]);
    await checkHalves('anisotropyMap strength',
        () => { mat.anisotropyRotation = 0; mat.anisotropy = 0.001; },
        () => { mat.anisotropy = 1; },
        () => { mat.anisotropy = 1; mat.anisotropyMap = bb; },
        () => { mat.anisotropyMap = null; }, 0.01);
    // Direction: (1, 0.5) = +U grain, (0.5, 1) = +V grain, equal to rotating the factor by 90°.
    const dd = halfTexture([255, 128, 255, 255], [128, 255, 255, 255]);
    await checkHalves('anisotropyMap direction',
        () => { mat.anisotropy = 1; mat.anisotropyRotation = 0; },
        () => { mat.anisotropyRotation = Math.PI / 2; },
        () => { mat.anisotropyRotation = 0; mat.anisotropyMap = dd; },
        () => { mat.anisotropyMap = null; mat.anisotropyRotation = 0; }, 0.01);
    lightObj.rotationY = 180; lightObj.rotationX = 0;
})

Engine3D.pause();
setTimeout(end, 500)
