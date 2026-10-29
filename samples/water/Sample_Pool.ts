import {
    AtmosphericComponent, BitmapTexture2D, BoxGeometry, CameraUtil, Color, Context3D, DirectLight, Engine3D,
    HoverCameraController, KelvinUtil, LitMaterial, Object3D, PlaneGeometry, Scene3D, Vector2, Vector3, View3D,
    WaterRenderer,
} from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { addPointerRipples, addWaterGUI, floatingModel, mesh, solid } from "./WaterSampleUtil";

const POOL_WIDTH = 20;
const POOL_LENGTH = 14;
const POOL_DEPTH = 2;

/**
 * Swimming pool: nearly still water over a tiled floor, with refraction,
 * absorption, sky reflection and caustics. A rubber duck floats on the
 * surface using WaterRenderer.getHeight.
 *
 * Ripples all go through WaterRenderer.addRipple: click the water for a
 * splash or the duck to push it under, hold Shift and move the mouse to
 * drag a trail.
 */
export class Sample_Pool {
    async run() {
        const engine = await Engine3D.init({ setting: { render: { water: true } } });

        const scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);

        const camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, engine.aspect, 0.1, 1000);
        camera.object3D.addComponent(HoverCameraController).setCamera(144.6, -26.6, 10.9, new Vector3(0, -1, 0));

        const view = new View3D();
        view.scene = scene;
        view.camera = camera;
        engine.startRenderView(view);

        const light = new Object3D();
        light.rotationX = 50;
        light.rotationY = 30;
        const dl = light.addComponent(DirectLight);
        dl.lightColor = KelvinUtil.color_temperature_to_rgb(5500);
        dl.intensity = 3;
        dl.castShadow = true;
        dl.enableCSM = true;
        scene.addChild(light);

        createPool(scene, engine.context3D);

        const waterObj = new Object3D();
        const water = waterObj.addComponent(WaterRenderer);
        // Slightly larger than the pool: the waves also move the surface sideways, and the
        // walls hide the overlap instead of a gap opening along them.
        water.width = POOL_WIDTH + 0.6;
        water.length = POOL_LENGTH + 0.6;
        // Still water: short, low waves, about 1.5 cm high at most.
        water.waves = [
            { direction: new Vector2(1, 0.3), wavelength: 4, steepness: 0.025 },
            { direction: new Vector2(0.4, 1), wavelength: 2.6, steepness: 0.02 },
            { direction: new Vector2(-0.7, 0.6), wavelength: 1.7, steepness: 0.015 },
            { direction: new Vector2(0.2, -1), wavelength: 1.1, steepness: 0.012 },
        ];
        water.resolution = 200;
        water.waterMaterial.waterDepth = POOL_DEPTH;
        // Faint ripples on the surface; the view of the floor stays clear.
        water.detailStrength = 0.2;
        // From underwater, most of the surface shows the world above.
        water.waterMaterial.underwaterClarity = 0.8;
        scene.addChild(waterObj);

        const duck = floatingModel(scene, water, await engine.res.loadGltf('PBR/Duck/Duck.gltf'), 1.2, -3, 2);
        addPointerRipples(engine, camera, water, [duck]);

        GUIHelp.init();
        addWaterGUI(water);
    }
}

/** Tiled pool around (0, -POOL_DEPTH .. 0, 0) with a white coping and a plain ground. */
function createPool(scene: Scene3D, ctx: Context3D) {
    const t = 0.6;
    const wallTop = 0.4;
    // Ground around the pool opening (four strips, leaving the pool open).
    const groundMat = solid(new Color(0.55, 0.53, 0.5), 0.9);
    const G = 80, hw = POOL_WIDTH / 2 + 1.5 * t, hl = POOL_LENGTH / 2 + 1.5 * t;
    const side = (G / 2 - hl);
    scene.addChild(mesh(new PlaneGeometry(G, side), groundMat, 0, wallTop, -(hl + side / 2)));
    scene.addChild(mesh(new PlaneGeometry(G, side), groundMat, 0, wallTop, hl + side / 2));
    scene.addChild(mesh(new PlaneGeometry(G / 2 - hw, 2 * hl), groundMat, -(hw + (G / 2 - hw) / 2), wallTop, 0));
    scene.addChild(mesh(new PlaneGeometry(G / 2 - hw, 2 * hl), groundMat, hw + (G / 2 - hw) / 2, wallTop, 0));
    const tiles = new LitMaterial();
    tiles.baseMap = paintTiles(ctx);
    tiles.roughness = 0.7;
    tiles.metallic = 0;
    scene.addChild(mesh(new BoxGeometry(POOL_WIDTH, t, POOL_LENGTH), tiles, 0, -POOL_DEPTH - t / 2, 0));
    const wall = solid(new Color(0.55, 0.82, 0.88), 0.4);
    const h = POOL_DEPTH + wallTop;
    const cy = -POOL_DEPTH + h / 2;
    scene.addChild(mesh(new BoxGeometry(POOL_WIDTH + 2 * t, h, t), wall, 0, cy, -POOL_LENGTH / 2 - t / 2));
    scene.addChild(mesh(new BoxGeometry(POOL_WIDTH + 2 * t, h, t), wall, 0, cy, POOL_LENGTH / 2 + t / 2));
    scene.addChild(mesh(new BoxGeometry(t, h, POOL_LENGTH), wall, -POOL_WIDTH / 2 - t / 2, cy, 0));
    scene.addChild(mesh(new BoxGeometry(t, h, POOL_LENGTH), wall, POOL_WIDTH / 2 + t / 2, cy, 0));
    const coping = solid(new Color(0.95, 0.95, 0.92), 0.6);
    for (const [w, l, x, z] of [
        [POOL_WIDTH + 4 * t, t, 0, -POOL_LENGTH / 2 - t], [POOL_WIDTH + 4 * t, t, 0, POOL_LENGTH / 2 + t],
        [t, POOL_LENGTH, -POOL_WIDTH / 2 - t, 0], [t, POOL_LENGTH, POOL_WIDTH / 2 + t, 0],
    ]) {
        scene.addChild(mesh(new BoxGeometry(w, 0.15, l), coping, x, wallTop + 0.075, z));
    }
}


/** Light aqua mosaic with grout and dark lane lines along x. */
function paintTiles(ctx: Context3D): BitmapTexture2D {
    const tile = 0.5;
    const tx = Math.round(POOL_WIDTH / tile), tz = Math.round(POOL_LENGTH / tile);
    const px = Math.floor(2048 / Math.max(tx, tz));
    const canvas = document.createElement('canvas');
    canvas.width = tx * px;
    canvas.height = tz * px;
    const g = canvas.getContext('2d')!;
    g.fillStyle = 'rgb(225, 242, 246)';
    g.fillRect(0, 0, canvas.width, canvas.height);
    const grout = Math.max(1, Math.round(px * 0.08));
    for (let i = 0; i < tx; i++) {
        for (let j = 0; j < tz; j++) {
            const k = 0.94 + Math.random() * 0.1;
            g.fillStyle = `rgb(${Math.round(110 * k)}, ${Math.round(200 * k)}, ${Math.round(218 * k)})`;
            g.fillRect(i * px + grout, j * px + grout, px - 2 * grout, px - 2 * grout);
        }
    }
    g.fillStyle = 'rgb(18, 42, 105)';
    for (let l = 1; l <= 3; l++) {
        const zc = Math.round((l * tz) / 4) * px;
        g.fillRect(2 * px, zc - px / 2, canvas.width - 4 * px, px);
    }
    const tex = new BitmapTexture2D(true, ctx, 'srgb');
    tex.source = canvas;
    return tex;
}
