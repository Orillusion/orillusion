import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LitMaterial, MeshRenderer, Object3D, Scene3D, SphereGeometry, TorusGeometry, View3D,
} from '@orillusion/core';

/**
 * KHR_materials_iridescence demo (thin-film interference).
 *
 * Top row: film thickness 100 → 800 nm over a dark metal — each thickness
 * resonates at different wavelengths, so the hue walks through the rainbow
 * and also shifts from the centre of each sphere to its rim (view angle).
 * Middle row: the same thickness with film IOR 1.1 → 2.0. Bottom row: the
 * base materials without the film. The GUI drives the torus.
 */
class Sample_Iridescence {
    private scene: Scene3D;
    private hero: LitMaterial;

    async run() {
        const engine = await Engine3D.init({ setting: { shadow: { enable: true, shadowBound: 60 } } });
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent).sunY = 0.6;

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(45, engine.aspect, 0.1, 1000);
        camera.object3D.addComponent(HoverCameraController).setCamera(15, -12, 50);

        const lightObj = new Object3D();
        lightObj.rotationX = 40; lightObj.rotationY = 140;
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

    private metal(film: { ior: number, thickness: number } | null): LitMaterial {
        const m = new LitMaterial();
        m.baseColor = new Color(0.25, 0.25, 0.27);
        m.metallic = 1.0;
        m.roughness = 0.25;
        if (film) {
            m.iridescenceIOR = film.ior;
            m.iridescenceThickness = film.thickness;
            m.iridescence = 1.0;
        }
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
        const sphere = new SphereGeometry(2, 48, 48);
        for (let i = 0; i < 8; i++) {
            this.add(sphere, this.metal({ ior: 1.3, thickness: 100 + i * 100 }), (i - 3.5) * 5, 13);
            this.add(sphere, this.metal({ ior: 1.1 + i * 0.13, thickness: 400 }), (i - 3.5) * 5, 7.5);
            this.add(sphere, this.metal(null), (i - 3.5) * 5, 2);
        }
        this.hero = this.metal({ ior: 1.3, thickness: 400 });
        const torus = this.add(new TorusGeometry(4, 1.6, 96, 128), this.hero, 28, 7);
        torus.rotationX = 70;

        const floorMat = new LitMaterial();
        floorMat.baseColor = new Color(0.5, 0.5, 0.52); floorMat.roughness = 0.9; floorMat.metallic = 0;
        const floor = this.add(new BoxGeometry(140, 1, 80), floorMat, 5, -0.5);
        floor.getComponent(MeshRenderer).castShadow = false;
    }

    private initGUI() {
        GUIHelp.init();
        const f = GUIHelp.addFolder('Iridescence (torus)');
        const s = { factor: 1, ior: 1.3, thickness: 400 };
        f.add(s, 'factor', 0, 1, 0.01).onChange((v: number) => this.hero.iridescence = v);
        f.add(s, 'ior', 1, 2.5, 0.01).onChange((v: number) => this.hero.iridescenceIOR = v);
        f.add(s, 'thickness', 50, 1200, 1).onChange((v: number) => this.hero.iridescenceThickness = v);
        f.open();
    }
}

new Sample_Iridescence().run();
