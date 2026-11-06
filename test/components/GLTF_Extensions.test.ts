import { test, expect, end, delay } from '../util'
import { CameraUtil, Engine3D, KHR_materials_specular, KHR_mesh_quantization, LitMaterial, MaterialVariants, MeshRenderer, Scene3D, Vector3, View3D } from '@orillusion/core';
import { buildVariantsDemoGLB } from '@samples/utils/GLBBuilder';

// LitMaterial needs an engine (default textures), so create it before any test.
const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });

await test('KHR_mesh_quantization.dequantize: normalization rules, idempotent', async () => {
    const a = { data: new Int8Array([-128, -127, 0, 127]) as any, normalize: true };
    KHR_mesh_quantization.dequantize(a);
    expect(a.data instanceof Float32Array).tobe(true);
    expect(Array.from(a.data as Float32Array)).toEqual([-1, -1, 0, 1]);              // −128 clamps to −1
    expect(a.normalize).tobe(false);
    const same = a.data;
    KHR_mesh_quantization.dequantize(a);
    expect(a.data === same).tobe(true);                                               // already float → untouched

    const b = { data: new Uint8Array([0, 255]) as any, normalize: true };
    KHR_mesh_quantization.dequantize(b);
    expect(Array.from(b.data as Float32Array)).toEqual([0, 1]);
    const c = { data: new Int16Array([-32768, 32767, 16384]) as any, normalize: true };
    KHR_mesh_quantization.dequantize(c);
    expect(c.data[0]).tobe(-1); expect(c.data[1]).tobe(1); expect(c.data[2]).toSubequal(0.5, 1e-4);
    const d = { data: new Uint16Array([65535, 0]) as any, normalize: true };
    KHR_mesh_quantization.dequantize(d);
    expect(Array.from(d.data as Float32Array)).toEqual([1, 0]);
    const e = { data: new Int16Array([-300, 7, 1200]) as any, normalize: false };     // non-normalized ints keep their value
    KHR_mesh_quantization.dequantize(e);
    expect(Array.from(e.data as Float32Array)).toEqual([-300, 7, 1200]);
    expect(KHR_mesh_quantization.isQuantizable('TEXCOORD_1') && KHR_mesh_quantization.isQuantizable('POSITION')).tobe(true);
    expect(KHR_mesh_quantization.isQuantizable('JOINTS_0')).tobe(false);
})

await test('KHR_materials_specular.apply: factors → specularColor uniform (rgb tint, a strength)', async () => {
    const m = new LitMaterial();
    KHR_materials_specular.apply({}, { extensions: { KHR_materials_specular: { specularFactor: 0.4, specularColorFactor: [0.9, 0.5, 0.1] } } }, m);
    const c = m.shader.getUniformColor('specularColor');
    expect(c.r).toSubequal(0.9, 1e-6); expect(c.b).toSubequal(0.1, 1e-6); expect(c.a).toSubequal(0.4, 1e-6);
    const d = new LitMaterial();
    KHR_materials_specular.apply({}, { extensions: { KHR_materials_specular: {} } }, d);      // spec defaults
    const dc = d.shader.getUniformColor('specularColor');
    expect(dc.r === 1 && dc.g === 1 && dc.b === 1 && dc.a === 1).tobe(true);
    const before = new LitMaterial().shader.getUniformColor('specularColor').a;
    const n = new LitMaterial();
    KHR_materials_specular.apply({}, {}, n);                                                   // no extension → untouched
    expect(n.shader.getUniformColor('specularColor').a).tobe(before);
})

// ---- load a generated GLB that uses all of it ------------------------------
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(60, engine.aspect, 0.1, 100);
view.camera.lookAt(new Vector3(0, 0, 12), new Vector3(0, 0, 0));
engine.startRenderView(view);

const info = buildVariantsDemoGLB(2, 16);
const root = await engine.res.loadGltf(URL.createObjectURL(info.blob));
view.scene.addChild(root);
const renderers = root.getComponentsInChild(MeshRenderer);
const sphere = renderers.find(r => r.object3D.name.includes('Sphere') || r.geometry.getAttribute('position').data.length === info.sphereVertices * 3);
const ribbon = renderers.find(r => r !== sphere);

await test('quantized sphere loads as float geometry with the right extents', async () => {
    expect(renderers.length).tobe(2);
    const pos = sphere.geometry.getAttribute('position').data, nor = sphere.geometry.getAttribute('normal').data, uv = sphere.geometry.getAttribute('uv').data;
    expect(pos instanceof Float32Array && nor instanceof Float32Array && uv instanceof Float32Array).tobe(true);
    expect(pos.length).tobe(info.sphereVertices * 3);
    let maxAbs = 0, maxLenErr = 0, uvMin = 1, uvMax = 0;
    for (let i = 0; i < pos.length; i += 3) {
        maxAbs = Math.max(maxAbs, Math.abs(pos[i]), Math.abs(pos[i + 1]), Math.abs(pos[i + 2]));
        maxLenErr = Math.max(maxLenErr, Math.abs(Math.hypot(pos[i], pos[i + 1], pos[i + 2]) - 1));   // unit sphere after ÷32767
        const nl = Math.hypot(nor[i], nor[i + 1], nor[i + 2]);
        if (Math.abs(nl - 1) > 0.02) throw new Error('normal not ~unit after int8 dequantization: ' + nl);
    }
    for (let i = 0; i < uv.length; i++) { uvMin = Math.min(uvMin, uv[i]); uvMax = Math.max(uvMax, uv[i]); }
    expect(maxAbs).toSubequal(1, 1e-4);
    expect(maxLenErr < 1e-3).tobe(true);
    expect(uvMin).tobe(0); expect(uvMax).toSubequal(1, 1e-6);
    // Node scale ×2 brings it to world radius 2.
    const b = sphere.object3D.bound;
    expect(b.extents.x).toSubequal(2, 0.01); expect(b.extents.y).toSubequal(2, 0.01);
})

await test('default material carries KHR_materials_specular', async () => {
    const c = (sphere.material as LitMaterial).shader.getUniformColor('specularColor');
    expect(c.g).toSubequal(0.5, 1e-6); expect(c.b).toSubequal(0.25, 1e-6); expect(c.a).toSubequal(0.5, 1e-6);
    expect((sphere.material as LitMaterial).baseColor.r).toSubequal(0.6, 1e-6);
})

await test('non-indexed mesh: fallback indices cover every vertex (no Uint8 wrap)', async () => {
    const idx = ribbon.geometry.getAttribute('indices').data;
    const vertexCount = ribbon.geometry.getAttribute('position').data.length / 3;
    expect(vertexCount).tobe(info.ribbonTriangles * 3);
    expect(idx.length).tobe(vertexCount);
    expect(idx.BYTES_PER_ELEMENT >= 2).tobe(true);
    let max = 0; const seen = new Set<number>();
    for (let i = 0; i < idx.length; i++) { max = Math.max(max, idx[i]); seen.add(idx[i]); }
    expect(max).tobe(vertexCount - 1);
    expect(seen.size).tobe(vertexCount);
})

await test('KHR_materials_variants: MaterialVariants on the root switches only mapped primitives', async () => {
    const v = root.getComponent(MaterialVariants);
    expect(v != null).tobe(true);
    expect(v.variantNames).toEqual(['Crimson', 'Ocean', 'Velvet']);
    expect(v.currentVariant).tobe(null);
    expect(v.bindings.length).tobe(1);                                   // the ribbon has no mappings
    const original = sphere.material, ribbonMat = ribbon.material;

    expect(v.selectVariant('Crimson')).tobe(true);
    expect(sphere.material !== original).tobe(true);
    expect((sphere.material as LitMaterial).baseColor.r).toSubequal(0.8, 1e-6);
    expect(v.currentVariant).tobe('Crimson'); expect(v.currentIndex).tobe(0);
    expect(ribbon.material === ribbonMat).tobe(true);

    expect(v.selectVariant(1)).tobe(true);                               // by index
    expect((sphere.material as LitMaterial).baseColor.b).toSubequal(0.8, 1e-6);

    expect(v.selectVariant('Velvet')).tobe(true);
    const velvet = sphere.material as LitMaterial;
    expect(velvet.sheenRoughness).toSubequal(0.45, 1e-6);               // sheen extension applied to the variant material
    expect((velvet.shader.getDefaultColorShader() as any).defineValue['USE_SHEEN']).tobe(true);

    expect(v.selectVariant('Nope')).tobe(false);                         // unknown → no change
    expect(v.selectVariant(7)).tobe(false);
    expect(sphere.material === velvet).tobe(true);

    expect(v.selectVariant(null)).tobe(true);
    expect(sphere.material === original).tobe(true);
    expect(v.currentVariant).tobe(null);
})

await test('renders every variant without GPU / shader errors', async () => {
    const v = root.getComponent(MaterialVariants);
    const errors: string[] = [];
    const onErr = (e: any) => errors.push(String(e?.error?.message ?? e));
    engine.context3D.device.addEventListener('uncapturederror', onErr);
    for (const name of [...v.variantNames, null]) {
        v.selectVariant(name);
        await delay(350);
    }
    engine.context3D.device.removeEventListener('uncapturederror', onErr);
    if (errors.length) throw new Error('GPU errors: ' + errors.slice(0, 2).join(' | '));
})

Engine3D.pause();
setTimeout(end, 500)
