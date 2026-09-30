import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LitMaterial, MeshRenderer, Object3D, Scene3D, SphereGeometry, View3D,
} from '@orillusion/core';

/**
 * KHR_materials_anisotropy demo (brushed-metal highlights).
 *
 * Top row: anisotropy strength 0 → 1 on the same metal — the round highlight
 * stretches into a streak across the grain. Bottom row: full strength with
 * the grain rotated 0° → 150°, which turns the streak. The GUI drives the
 * large sphere on the right.
 */
class Sample_Anisotropy {
    private scene: Scene3D;
    private hero: LitMaterial;

    async run() {
        const engine = await Engine3D.init({ setting: { shadow: { enable: true, shadowBound: 60 } } });
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent).sunY = 0.6;

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(45, engine.aspect, 0.1, 1000);
        camera.object3D.addComponent(HoverCameraController).setCamera(10, -10, 46);

        const lightObj = new Object3D();
        lightObj.rotationX = 35; lightObj.rotationY = 160;
        const light = lightObj.addComponent(DirectLight);
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5600);
        light.intensity = 3.5;
        light.castShadow = true;
        this.scene.addChild(lightObj);

        this.build();

        const view = new View3D();
        view.scene = this.scene;
        view.camera = camera;
        engine.startRenderView(view);
        this.initGUI();
    }

    private metal(strength: number, rotation: number): LitMaterial {
        const m = new LitMaterial();
        m.baseColor = new Color(0.72, 0.72, 0.75);
        m.metallic = 1.0;
        m.roughness = 0.35;
        m.anisotropyRotation = rotation;
        m.anisotropy = strength;
        return m;
    }

    private add(geo: any, mat: LitMaterial, x: number, y: number): Object3D {
        const o = new Object3D();
        const mr = o.addComponent(MeshRenderer);
        mr.geometry = geo; mr.material = mat; mr.castShadow = true;
        o.x = x; o.y = y;
        this.scene.addChild(o);
        return o;
    }

    private build() {
        const sphere = new SphereGeometry(2, 64, 64);
        for (let i = 0; i < 6; i++) {
            this.add(sphere, this.metal(i / 5, 0), (i - 2.5) * 5, 8.5);
            this.add(sphere, this.metal(1, (i * 30 * Math.PI) / 180), (i - 2.5) * 5, 3);
        }
        this.hero = this.metal(0.9, 0);
        this.add(new SphereGeometry(4, 96, 96), this.hero, 23, 6);

        const floorMat = new LitMaterial();
        floorMat.baseColor = new Color(0.5, 0.5, 0.52); floorMat.roughness = 0.9; floorMat.metallic = 0;
        const floor = this.add(new BoxGeometry(140, 1, 80), floorMat, 5, -0.5);
        floor.getComponent(MeshRenderer).castShadow = false;
    }

    private initGUI() {
        GUIHelp.init();
        const f = GUIHelp.addFolder('Anisotropy (big sphere)');
        const s = { strength: 0.9, rotationDeg: 0, roughness: 0.35 };
        f.add(s, 'strength', 0, 1, 0.01).onChange((v: number) => this.hero.anisotropy = v);
        f.add(s, 'rotationDeg', 0, 180, 1).onChange((v: number) => this.hero.anisotropyRotation = (v * Math.PI) / 180);
        f.add(s, 'roughness', 0.05, 1, 0.01).onChange((v: number) => this.hero.roughness = v);
        f.open();
    }
}

new Sample_Anisotropy().run();
