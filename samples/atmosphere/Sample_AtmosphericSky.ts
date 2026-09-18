import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Engine3D, GPUCullMode, MeshRenderer, Object3D, PlaneGeometry, Scene3D, Texture, UnLitMaterial, Vector3 } from "@orillusion/core";
import { AtmosphericComponent } from "@orillusion/atmosphere";

/**
 * Physically based atmospheric sky (@orillusion/atmosphere).
 *
 * Shows the Hillaire LUT chain the package bakes every time a sky parameter
 * changes — transmittance, multiple scattering, sky view, cloud noise and the
 * final ray-marched panorama — stacked as debug planes next to the skybox.
 */
class Sample_AtmosphericSky {
    async run() {
        // Every GPU resource below binds to this engine's Context3D, so the
        // sample stays valid with more than one Engine3D alive.
        const engine = await Engine3D.init({});

        // The shared example scene installs the *core* AtmosphericComponent by
        // default; turn it off so this package's component owns the sky.
        const param = createSceneParam();
        param.scene.atmosphericSky = null;
        const example = createExampleScene(engine, param);
        const scene: Scene3D = example.scene;
        const camera = example.camera;
        // `fov` is a plain field — the projection matrix is only rebuilt by
        // perspective()/updateProjection(), so assigning it alone does nothing
        // until the next canvas resize.
        camera.fov = 90;
        camera.updateProjection();

        engine.startRenderView(example.view);

        const sky = scene.addComponent(AtmosphericComponent);
        // Two-way bind the sun to the example scene's direct light, the way
        // createExampleScene wires up the core sky: dragging sunX/sunY in the
        // GUI rotates the light, and rotating the light moves the sun.
        sky.relativeTransform = example.light.transform;
        // The LUT chain is materialized on the first render; force it here so
        // the debug planes below can bind the textures synchronously.
        (sky as any)._ensureSky(engine.context3D);

        const debugPlanes: Object3D[] = [];
        let y = 100;
        const addDebugPlane = (texture: Texture, width: number, height: number) => {
            const material = new UnLitMaterial(engine.context3D);
            material.baseMap = texture;
            material.cullMode = GPUCullMode.none;
            // The LUTs are linear HDR (rgba16float). Skip UnLit's sRGB->linear
            // decode so the plane feeds the global ACES tonemap the same linear
            // values the skybox does — otherwise gammaToLiner blows out HDR>1.
            material.shader.getDefaultColorShader().setDefine('USE_SRGB_ALBEDO', true);

            const obj = new Object3D();
            const renderer = obj.addComponent(MeshRenderer);
            renderer.material = material;
            renderer.geometry = new PlaneGeometry(width, height, 1, 1, Vector3.Z_AXIS);
            obj.y = y;
            y -= height;
            scene.addChild(obj);
            debugPlanes.push(obj);
        };

        const atmosphere = sky.atmosphericScatteringSky;
        addDebugPlane(atmosphere.transmittanceLut, 50, 25);
        addDebugPlane(atmosphere.multipleScatteringLut, 25, 25);
        addDebugPlane(atmosphere.skyViewLut, 50, 25);
        addDebugPlane(atmosphere.cloudNoiseTexture, 25, 25);
        addDebugPlane(atmosphere.texture2D, 50, 25);

        // gui
        GUIHelp.init();
        GUIHelp.addFolder('AtmosphericSky');
        GUIHelp.add(sky, 'sunX', 0, 1, 0.01);
        GUIHelp.add(sky, 'sunY', 0.4, 1.6, 0.01);
        GUIHelp.add(sky, 'eyePos', 0, 7000, 1);
        GUIHelp.add(sky, 'sunRadius', 0, 1000, 0.01);
        GUIHelp.add(sky, 'sunRadiance', 0, 100, 0.01);
        GUIHelp.add(sky, 'sunBrightness', 0, 10, 0.01);
        GUIHelp.add(sky, 'hdrExposure', 0, 5, 0.01);
        GUIHelp.add(sky, 'displaySun');
        GUIHelp.add(sky, 'enableClouds');
        GUIHelp.add(sky, 'showV1');
        GUIHelp.add(sky, 'enable');
        const settings = { displayTextures: true };
        GUIHelp.add(settings, 'displayTextures').onChange((v: boolean) => {
            debugPlanes.forEach(obj => obj.transform.enable = v);
        });
        GUIHelp.open();
        GUIHelp.endFolder();

        GUIHelp.addFolder('Camera');
        GUIHelp.add(camera, 'fov', 1, 180, 1).onChange(() => camera.updateProjection());
        GUIHelp.open();
        GUIHelp.endFolder();
    }
}

new Sample_AtmosphericSky().run();
