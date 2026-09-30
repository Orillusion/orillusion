import { test, expect, end, waitUntil, delay, readRegionRGBA16F } from '../util'
import { BoxGeometry, CameraUtil, Color, Engine3D, LightType, LitMaterial, MeshRenderer, Object3D, RectLight, RectLightDesc, RectLightUtil, Scene3D, Vector3, View3D } from '@orillusion/core';

const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });
engine.setting.render.tonemap.mode = 'None';

const panel = (center: number[], normal: number[], up: number[], width: number, height: number): RectLightDesc =>
    ({ center, normal, up, width, height, color: [1, 1, 1], intensity: 1, range: 1e6 });

/**
 * Independent reference: brute-force quadrature of (1/π)∫ cosθ_surface · cosθ_light / r² dA
 * over the panel, with the below-horizon part clamped away. Shares no code with the analytic path.
 */
function numericFormFactor(P: number[], N: number[], l: RectLightDesc, n = 400): number {
    const f = RectLightUtil.frame(l);
    let sum = 0;
    const dA = (l.width / n) * (l.height / n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const sx = ((i + 0.5) / n - 0.5) * l.width, sy = ((j + 0.5) / n - 0.5) * l.height;
        const q = [0, 1, 2].map((k) => l.center[k] + f.right[k] * sx + f.up[k] * sy);
        const d = [q[0] - P[0], q[1] - P[1], q[2] - P[2]];
        const r2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2], r = Math.sqrt(r2);
        const cosS = (d[0] * N[0] + d[1] * N[1] + d[2] * N[2]) / r;
        const cosL = -(d[0] * f.normal[0] + d[1] * f.normal[1] + d[2] * f.normal[2]) / r;
        if (cosS > 0 && cosL > 0) sum += (cosS * cosL / r2) * dA;
    }
    return sum / Math.PI;
}

await test('form factor matches brute-force integration when the panel is fully above the horizon', async () => {
    const P = [0, 0, 0], N = [0, 1, 0];
    const cases: RectLightDesc[] = [
        panel([0, 3, 0], [0, -1, 0], [0, 0, 1], 2, 1),                 // overhead, facing down
        panel([1.5, 2, -1], [0, -1, 0], [1, 0, 0], 3, 2),              // offset
        panel([0, 4, 4], [0, -0.7071, -0.7071], [0, 0.7071, -0.7071], 4, 2),   // tilted softbox
        panel([0, 2.5, 3], [0, 0, -1], [0, 1, 0], 2, 3),               // vertical window, bottom edge at y=1
        panel([0, 0.6, 0], [0, -1, 0], [0, 0, 1], 6, 6),               // big and close
    ];
    for (const l of cases) {
        const a = RectLightUtil.formFactor(P, N, l), b = numericFormFactor(P, N, l);
        console.log(`[RectLight] unclipped FF analytic ${a.toFixed(5)} numeric ${b.toFixed(5)}`);
        expect(a).toSubequal(b, 2e-3);
    }
    // An effectively infinite ceiling fills the hemisphere.
    expect(RectLightUtil.formFactor(P, N, panel([0, 1, 0], [0, -1, 0], [0, 0, 1], 4000, 4000)) > 0.995).tobe(true);
})

await test('horizon-crossing panels stay close to the reference; hidden and back-facing ones are dark', async () => {
    const P = [0, 0, 0], N = [0, 1, 0];
    const crossing: RectLightDesc[] = [
        panel([0, 0, 3], [0, 0, -1], [0, 1, 0], 2, 4),                 // window half below the floor plane
        panel([0, 0.5, 2], [0, 0, -1], [0, 1, 0], 3, 3),               // a third below
        panel([0, -0.5, 2], [0, 0, -1], [0, 1, 0], 3, 3),              // mostly below
    ];
    for (const l of crossing) {
        const a = RectLightUtil.formFactor(P, N, l), b = numericFormFactor(P, N, l);
        console.log(`[RectLight] clipped FF analytic ${a.toFixed(5)} numeric ${b.toFixed(5)}`);
        expect(Math.abs(a - b) < 0.02 + 0.25 * b).tobe(true);
    }
    // Entirely below the horizon.
    expect(RectLightUtil.formFactor(P, N, panel([0, -3, 3], [0, 0, -1], [0, 1, 0], 2, 2)) < 1e-3).tobe(true);
    // Surface is behind the emitting face.
    expect(RectLightUtil.formFactor(P, N, panel([0, 3, 0], [0, 1, 0], [0, 0, 1], 2, 1))).tobe(0);
    // Distance window.
    expect(RectLightUtil.falloff(0, 10)).tobe(1);
    expect(RectLightUtil.falloff(10, 10)).tobe(0);
    expect(RectLightUtil.falloff(5, 10) > 0.8).tobe(true);
})

await test('representative point: mirror hit inside the panel, clamped to the edge outside it', async () => {
    const l = panel([0, 5, -5], [0, -0.7071, 0.7071], [0, 0.7071, 0.7071], 2, 2);
    const V = [0, 0.7071, 0.7071];
    const hit = RectLightUtil.representativePoint([0, 0, 0], [0, 1, 0], V, l);
    expect(hit[0]).toSubequal(0, 1e-3); expect(hit[1]).toSubequal(5, 1e-3); expect(hit[2]).toSubequal(-5, 1e-3);
    // Shift the shading point sideways by 3: the reflection now misses, so the point clamps to the x = +1 edge.
    const off = RectLightUtil.representativePoint([3, 0, 0], [0, 1, 0], V, l);
    expect(Math.abs(off[0])).toSubequal(1, 1e-3);
    // Mirror-like surface looking straight at a large panel reflects about radiance × F0.
    const big = { ...panel([0, 2, 0], [0, -1, 0], [0, 0, 1], 3, 3), intensity: 2 };
    const c = RectLightUtil.shade([0, 0, 0], [0, 1, 0], [0, 1, 0], [1, 1, 1], 1, 0.05, [1, 1, 1], big);
    console.log(`[RectLight] mirror reflection of radiance 2: ${c[0].toFixed(3)}`);
    expect(c[0] > 1 && c[0] < 3.5).tobe(true);
})

// ---- GPU ---------------------------------------------------------------------
const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(40, engine.aspect, 0.1, 200);
view.camera.lookAt(new Vector3(0, 10, 10), new Vector3(0, 0, 0));
const floor = new Object3D();
const fmr = floor.addComponent(MeshRenderer);
fmr.geometry = new BoxGeometry(60, 0.2, 60);
const mat = new LitMaterial();
mat.baseColor = new Color(0.8, 0.6, 0.4, 1);
mat.roughness = 0.8; mat.metallic = 0;
mat.setUniformFloat('envIntensity', 0);
fmr.material = mat;
floor.y = -0.1;
view.scene.addChild(floor);
const lightObj = new Object3D();
const light = lightObj.addComponent(RectLight);
view.scene.addChild(lightObj);
engine.startRenderView(view);

const tonemapPost = (): any => (engine.getRenderJob(view) as any)?.graph?.getPass('PostPass')?.postList?.get('TonemapPost');
async function centerPixel(): Promise<number[]> {
    await delay(400);
    const t: GPUTexture = tonemapPost().renderTexture.getGPUTexture();
    const x = (t.width >> 1) - 1, y = (t.height >> 1) - 1;
    const img = await readRegionRGBA16F(engine.context3D.device, t, x, y, 2, 2);
    return [0, 1, 2].map((c) => (img[0][0][c] + img[0][1][c] + img[1][0][c] + img[1][1][c]) / 4);
}
const desc = (): RectLightDesc => {
    const d = light.lightData;
    return {
        center: [d.lightPosition.x, d.lightPosition.y, d.lightPosition.z], normal: [d.direction.x, d.direction.y, d.direction.z],
        up: [d.lightTangent.x, d.lightTangent.y, d.lightTangent.z], width: light.width, height: light.height,
        color: [light.lightColor.r, light.lightColor.g, light.lightColor.b], intensity: light.intensity, range: light.range,
    };
};
const V = [0, Math.SQRT1_2, Math.SQRT1_2];
let ambient: number[];

await test('RectLight API and LightData packing', async () => {
    await waitUntil(() => tonemapPost()?.renderTexture, 15000);
    expect(light.lightData.lightType).tobe(LightType.RectLight);
    expect(light.width).tobe(2); expect(light.height).tobe(1);
    light.width = 4; light.height = 3;
    expect(light.lightData.innerAngle).tobe(2); expect(light.lightData.outerAngle).tobe(1.5);
    light.castShadow = true;
    expect(light.castShadow).tobe(false);
    // rotationX = 90 turns the emitting face straight down.
    lightObj.y = 4; lightObj.rotationX = 90;
    await delay(200);
    console.log(`[RectLight] dir ${light.lightData.direction.toString()} up ${light.lightData.lightTangent.toString()}`);
    expect(light.lightData.direction.y).toSubequal(-1, 1e-4);
    light.intensity = 0;
    ambient = await centerPixel();
    console.log(`[RectLight] ambient ${ambient.map((v) => v.toFixed(4))}`);
    expect(ambient[0] < 0.05).tobe(true);
})

// Shader-side roughness: the default mask map's roughness channel is 0.5, and initFragData scales by 1.85.
async function compare(label: string, albedo: number[], metallic: number, roughness: number, tol: number) {
    const gpu = (await centerPixel()).map((v, i) => v - ambient[i]);
    const F0 = albedo.map((a) => 0.04 * (1 - metallic) + a * metallic);
    const cpu = RectLightUtil.shade([0, 0, 0], [0, 1, 0], V, albedo, metallic, Math.min(Math.max(roughness * 0.5, 0.0001), 1) * 1.85, F0, desc());
    const msg = `${label}: gpu ${gpu.map((v) => v.toFixed(4))} cpu ${cpu.map((v) => v.toFixed(4))}`;
    console.log('[RectLight] ' + msg);
    for (let i = 0; i < 3; i++) if (!(Math.abs(gpu[i] - cpu[i]) < 0.004 + tol * cpu[i])) throw new Error('GPU/CPU mismatch — ' + msg);
    expect(true).tobe(true);
    return gpu;
}

await test('GPU diffuse matches the CPU mirror for several panel placements', async () => {
    const albedo = [0.8, 0.6, 0.4];
    light.intensity = 3; light.range = 40;
    const overhead = await compare('overhead 4x3 @4', albedo, 0, 0.8, 0.04);
    expect(overhead[0] > 0.1).tobe(true);
    // Bigger panel → more light (radiance units).
    light.width = 8; light.height = 6;
    const bigger = await compare('overhead 8x6 @4', albedo, 0, 0.8, 0.04);
    expect(bigger[0] > overhead[0] * 1.5).tobe(true);
    // Off to the side and tilted toward the origin.
    light.width = 4; light.height = 2;
    lightObj.x = 5; lightObj.y = 3; lightObj.z = -2;
    lightObj.transform.lookAt(new Vector3(5, 3, -2), new Vector3(0, 0, 0));
    await delay(100);
    await compare('tilted side', albedo, 0, 0.8, 0.04);
    // Coloured.
    light.lightColor = new Color(1, 0.2, 0.1, 1);
    const red = await compare('coloured', albedo, 0, 0.8, 0.04);
    expect(red[0] > red[2] * 4).tobe(true);
    light.lightColor = new Color(1, 1, 1, 1);
})

await test('single sided, range window and disable all remove the light', async () => {
    // Face away from the floor.
    lightObj.x = 0; lightObj.y = 4; lightObj.z = 0;
    lightObj.transform.lookAt(new Vector3(0, 4, 0), new Vector3(0, 0, 0));
    await delay(100);
    const lit = (await centerPixel())[0] - ambient[0];
    lightObj.transform.lookAt(new Vector3(0, 4, 0), new Vector3(0, 8, 0.001));
    await delay(100);
    const away = (await centerPixel())[0] - ambient[0];
    console.log(`[RectLight] facing ${lit.toFixed(4)} away ${away.toFixed(4)}`);
    expect(lit > 0.05).tobe(true);
    expect(Math.abs(away) < 0.004).tobe(true);
    lightObj.transform.lookAt(new Vector3(0, 4, 0), new Vector3(0, 0, 0));
    light.range = 3.9;
    await delay(100);
    expect(Math.abs((await centerPixel())[0] - ambient[0]) < 0.004).tobe(true);
    light.range = 40;
    light.enable = false;
    await delay(100);
    expect(Math.abs((await centerPixel())[0] - ambient[0]) < 0.004).tobe(true);
    light.enable = true;
    await delay(100);
    expect((await centerPixel())[0] - ambient[0]).toSubequal(lit, 0.01);
})

await test('GPU glossy reflection of the panel matches the CPU mirror', async () => {
    mat.baseColor = new Color(0.9, 0.9, 0.9, 1);
    mat.metallic = 1; mat.roughness = 0.2;
    light.width = 4; light.height = 4; light.intensity = 3;
    // Put the panel on the mirror direction of the camera.
    lightObj.x = 0; lightObj.y = 6; lightObj.z = -6;
    lightObj.transform.lookAt(new Vector3(0, 6, -6), new Vector3(0, 0, 0));
    await delay(100);
    // The metal reflects a little environment even with the light off: re-measure the floor.
    light.intensity = 0;
    ambient = await centerPixel();
    light.intensity = 3;
    const on = await compare('glossy on-axis', [0.9, 0.9, 0.9], 1, 0.2, 0.05);
    expect(on[0] > 0.3).tobe(true);
    // Slide the panel far off the reflection ray: the highlight leaves the centre pixel.
    lightObj.x = 14;
    lightObj.transform.lookAt(new Vector3(14, 6, -6), new Vector3(0, 0, 0));
    await delay(100);
    const offAxis = await compare('glossy off-axis', [0.9, 0.9, 0.9], 1, 0.2, 0.08);
    expect(offAxis[0] < on[0] * 0.2).tobe(true);
})

Engine3D.pause();
setTimeout(end, 500)
