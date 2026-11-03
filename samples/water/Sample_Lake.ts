import {
    AtmosphericComponent, BitmapTexture2D, CameraUtil, Color, Context3D, DirectLight, Engine3D, HoverCameraController,
    KelvinUtil, LitMaterial, Object3D, Scene3D, Vector2, Vector3, View3D, WaterRenderer,
} from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { addPointerRipples, addWaterGUI, floatingBall, heightfieldGeometry, mesh, radialGeometry } from "./WaterSampleUtil";

const LAKE_RADIUS = 22;
const LAKE_DEPTH = 4;
const TERRAIN_SIZE = 160;

/** Distance from the center to the shoreline in the direction `angle`. */
function shore(angle: number): number {
    return LAKE_RADIUS * (1 + 0.22 * Math.sin(2 * angle + 0.6) + 0.12 * Math.sin(3 * angle + 1.9) + 0.07 * Math.sin(5 * angle + 0.3));
}

/** Ground height: a bowl down to LAKE_DEPTH inside the shoreline, rising into rolling grass outside. */
function groundHeight(x: number, z: number): number {
    const r = Math.hypot(x, z);
    const edge = shore(Math.atan2(z, x));
    const s = r / edge;
    if (s < 1) {
        // Bed with a few bumps, zero at the shoreline.
        const bed = 1 - s * s;
        return -LAKE_DEPTH * bed + 0.3 * Math.sin(x * 0.35) * Math.cos(z * 0.29) * bed;
    }
    const out = r - edge;
    const hills = 3 * (Math.sin(x * 0.045 + 1) * Math.cos(z * 0.06) + 1) * smoothstep(6, 30, out);
    return Math.min(out * 0.2, 1.5) + hills;
}

function smoothstep(a: number, b: number, x: number): number {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
}

/**
 * Lake: water with an irregular outline (WaterRenderer.surfaceGeometry) in a
 * bowl of terrain. The surface mesh follows the shoreline and reaches a metre
 * past it, under the ground; the underwater view, caustics and ripples all
 * follow the same outline.
 *
 * Click the water for a splash or the buoy to push it under, hold Shift and
 * move the mouse to drag a trail; the buoy can drift or be dropped (Buoy
 * folder).
 */
export class Sample_Lake {
    async run() {
        const engine = await Engine3D.init({ setting: { render: { water: true } } });

        const scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);

        const camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, engine.aspect, 0.1, 2000);
        camera.object3D.addComponent(HoverCameraController).setCamera(37.7, -30.3, 19.2, new Vector3(7.48, -0.5, 4.13));

        const view = new View3D();
        view.scene = scene;
        view.camera = camera;
        engine.startRenderView(view);

        const light = new Object3D();
        light.rotationX = 45;
        light.rotationY = 40;
        const dl = light.addComponent(DirectLight);
        dl.lightColor = KelvinUtil.color_temperature_to_rgb(5800);
        dl.intensity = 3;
        dl.castShadow = true;
        scene.addChild(light);

        const ground = new LitMaterial();
        ground.baseMap = paintGround(engine.context3D);
        ground.roughness = 0.9;
        ground.metallic = 0;
        scene.addChild(mesh(heightfieldGeometry(TERRAIN_SIZE, 256, groundHeight), ground, 0, 0, 0));

        const waterObj = new Object3D();
        const water = waterObj.addComponent(WaterRenderer);
        // The shoreline plus a metre, hidden under the rising ground.
        water.surfaceGeometry = radialGeometry((a) => shore(a) + 1, 56, 320);
        water.waves = [
            { direction: new Vector2(1, 0.4), wavelength: 7, steepness: 0.06 },
            { direction: new Vector2(0.6, 1), wavelength: 4.3, steepness: 0.05 },
            { direction: new Vector2(-0.5, 0.8), wavelength: 2.6, steepness: 0.04 },
            { direction: new Vector2(0.9, -0.6), wavelength: 1.8, steepness: 0.03 },
        ];
        // Green, murkier than a pool.
        const m = water.waterMaterial;
        m.absorptionColor = new Color(0.25, 0.55, 0.42);
        m.underwaterColor = new Color(0.05, 0.13, 0.1);
        m.density = 0.45;
        water.detailScale = 2.2;
        water.detailStrength = 0.5;
        water.rippleResolution = 384;
        scene.addChild(waterObj);

        const buoy = floatingBall(scene, water, 0.4, 4, 3, new Color(0.95, 0.75, 0.15));
        addPointerRipples(engine, camera, water, [buoy]);

        GUIHelp.init();
        addWaterGUI(water);
        GUIHelp.addFolder('Buoy');
        GUIHelp.add(buoy, 'drift');
        GUIHelp.addButton('drop', () => buoy.drop(4));
        GUIHelp.endFolder();
    }
}

/** Ground colors by height: mud and sand under the water, a sandy beach, then grass. */
function paintGround(ctx: Context3D): BitmapTexture2D {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d')!;
    const img = g.createImageData(size, size);
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
    const mud = [70, 64, 48], sand = [196, 182, 140], grass = [62, 120, 34], dryGrass = [104, 136, 48];
    for (let j = 0; j < size; j++) {
        for (let i = 0; i < size; i++) {
            const x = (i / size - 0.5) * TERRAIN_SIZE;
            const z = (j / size - 0.5) * TERRAIN_SIZE;
            const y = groundHeight(x, z);
            const noise = 0.92 + 0.16 * Math.random();
            let c: number[];
            if (y < 0.4) {
                c = mix(sand, mud, smoothstep(0.2, 3, -y));
            } else {
                c = mix(sand, mix(grass, dryGrass, smoothstep(2, 6, y)), smoothstep(0.4, 1.2, y));
            }
            const k = (j * size + i) * 4;
            img.data[k] = c[0] * noise;
            img.data[k + 1] = c[1] * noise;
            img.data[k + 2] = c[2] * noise;
            img.data[k + 3] = 255;
        }
    }
    g.putImageData(img, 0, 0);
    const tex = new BitmapTexture2D(true, ctx, 'srgb');
    tex.source = canvas;
    return tex;
}
