import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LitMaterial, MeshRenderer, Object3D, Scene3D, SphereGeometry, TonemapMode, TonemapUtil, View3D,
} from '@orillusion/core';

/**
 * Tone-mapping comparison.
 *
 * Six rows of emissive spheres (red, orange, green, cyan, blue, white), each
 * row ramping from 0.25× to 32× intensity, above a lit PBR strip. Switch the
 * curve in the GUI and watch the bright end of every row:
 *   None       clips hard to pure primaries
 *   ACES       saturated, hue-shifts toward white late
 *   Reinhard   soft roll-off, controlled by whitePoint
 *   Uncharted2 filmic shoulder, darker mids
 *   AgX        bright saturated colors desaturate smoothly toward white
 *   Neutral    colors under ~0.76 stay as authored, highlights compress
 * The GUI also prints what `TonemapUtil.apply` (the CPU mirror of the shader)
 * returns for a probe color, so the two can be compared by eye.
 */
class Sample_Tonemap {
    private engine: Engine3D;
    private scene: Scene3D;
    private readonly probe = { input: '(4.00, 1.00, 0.25)', output: '' };

    async run() {
        this.engine = await Engine3D.init({});
        this.scene = new Scene3D();
        const sky = this.scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.62;

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(50, this.engine.aspect, 0.1, 2000);
        camera.object3D.addComponent(HoverCameraController).setCamera(0, -12, 42);

        const lightObj = new Object3D();
        lightObj.rotationX = 45; lightObj.rotationY = 120;
        const light = lightObj.addComponent(DirectLight);
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5500);
        light.intensity = 3;
        this.scene.addChild(lightObj);

        this.buildRamp();

        const view = new View3D();
        view.scene = this.scene;
        view.camera = camera;
        this.engine.startRenderView(view);
        this.initGUI();
    }

    private buildRamp() {
        const hues: [number, number, number][] = [
            [1, 0.05, 0.05], [1, 0.45, 0.05], [0.1, 1, 0.1], [0.05, 0.9, 0.9], [0.1, 0.2, 1], [1, 1, 1],
        ];
        const steps = 8;                       // 0.25, 0.5, 1, 2, 4, 8, 16, 32
        const geo = new SphereGeometry(1.1, 32, 32);
        for (let row = 0; row < hues.length; row++) {
            for (let i = 0; i < steps; i++) {
                const intensity = 0.25 * Math.pow(2, i);
                const mat = new LitMaterial();
                mat.baseColor = new Color(0, 0, 0, 1);
                mat.emissiveColor = new Color(hues[row][0], hues[row][1], hues[row][2], 1);
                mat.emissiveIntensity = intensity;
                mat.roughness = 1;
                const o = new Object3D();
                const mr = o.addComponent(MeshRenderer);
                mr.geometry = geo;
                mr.material = mat;
                o.x = (i - (steps - 1) / 2) * 3;
                o.y = (hues.length - 1 - row) * 3 + 2;
                this.scene.addChild(o);
            }
        }
        // Lit strip: shows how each curve treats ordinary diffuse/specular shading.
        const colors = [new Color(0.8, 0.1, 0.1), new Color(0.9, 0.6, 0.1), new Color(0.1, 0.6, 0.2), new Color(0.1, 0.3, 0.8), new Color(0.8, 0.8, 0.8)];
        const box = new BoxGeometry(4.4, 1, 6);
        colors.forEach((c, i) => {
            const mat = new LitMaterial();
            mat.baseColor = c; mat.roughness = 0.35; mat.metallic = 0.1;
            const o = new Object3D();
            const mr = o.addComponent(MeshRenderer);
            mr.geometry = box; mr.material = mat;
            o.x = (i - 2) * 4.8; o.y = -0.5;
            this.scene.addChild(o);
        });
    }

    private initGUI() {
        GUIHelp.init();
        const tm = this.engine.setting.render.tonemap;
        const f = GUIHelp.addFolder('Tonemap');
        const refresh = () => {
            const o = TonemapUtil.apply(tm.mode, [4, 1, 0.25], tm.exposure, tm.whitePoint ?? 4);
            this.probe.output = `(${o.map(v => v.toFixed(3)).join(', ')})`;
        };
        f.add(tm, 'mode', TonemapUtil.MODES).onChange((v: TonemapMode) => { tm.mode = v; refresh(); });
        f.add(tm, 'exposure', 0.05, 8, 0.01).onChange(refresh);
        f.add(tm, 'whitePoint', 1, 16, 0.1).onChange(refresh);
        f.add(tm, 'enable');
        f.add(this.probe, 'input').listen();
        f.add(this.probe, 'output').listen();
        f.open();
        refresh();
    }
}

new Sample_Tonemap().run();
