import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LitMaterial, MeshRenderer, Object3D, Scene3D, SphereGeometry, TorusGeometry, View3D,
} from '@orillusion/core';

/**
 * KHR_materials_sheen demo.
 *
 * Top row: the same dark-red base with sheen roughness 0.1 → 1.0 (tight rim
 * → broad velvet glow). Middle row: one roughness, five sheen tints over a
 * near-black base — the look of satin / velvet / microfibre. Bottom row:
 * the same five base materials WITHOUT sheen, for an A/B comparison.
 * The GUI drives the big torus on the right.
 */
class Sample_Sheen {
    private scene: Scene3D;
    private hero: LitMaterial;

    async run() {
        const engine = await Engine3D.init({ setting: { shadow: { enable: true, shadowBound: 60 } } });
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent).sunY = 0.6;

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(45, engine.aspect, 0.1, 1000);
        camera.object3D.addComponent(HoverCameraController).setCamera(15, -15, 46);

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

    private cloth(base: Color, sheen: Color | null, sheenRoughness: number): LitMaterial {
        const m = new LitMaterial();
        m.baseColor = base;
        m.roughness = 0.9;
        m.metallic = 0.0;
        if (sheen) {
            m.sheenRoughness = sheenRoughness;
            m.sheenColor = sheen;
        }
        return m;
    }

    private add(geo: any, mat: LitMaterial, x: number, y: number, z = 0): Object3D {
        const o = new Object3D();
        const mr = o.addComponent(MeshRenderer);
        mr.geometry = geo; mr.material = mat; mr.castShadow = true;
        o.x = x; o.y = y; o.z = z;
        this.scene.addChild(o);
        return o;
    }

    private build() {
        const sphere = new SphereGeometry(2, 48, 48);
        const darkRed = new Color(0.25, 0.02, 0.03);

        // Row 1: roughness sweep.
        for (let i = 0; i < 6; i++) {
            const r = 0.1 + i * 0.18;
            this.add(sphere, this.cloth(darkRed, new Color(1, 0.75, 0.75), r), (i - 2.5) * 5, 13);
        }
        // Row 2 / 3: tints with and without sheen.
        const tints = [new Color(1, 1, 1), new Color(1, 0.4, 0.4), new Color(1, 0.8, 0.3), new Color(0.4, 0.9, 0.6), new Color(0.4, 0.6, 1)];
        const bases = [new Color(0.03, 0.03, 0.03), new Color(0.2, 0.02, 0.02), new Color(0.2, 0.12, 0.02), new Color(0.02, 0.12, 0.05), new Color(0.02, 0.05, 0.2)];
        for (let i = 0; i < 5; i++) {
            this.add(sphere, this.cloth(bases[i], tints[i], 0.5), (i - 2) * 5, 7.5);
            this.add(sphere, this.cloth(bases[i], null, 0), (i - 2) * 5, 2);
        }
        // Hero object driven by the GUI.
        this.hero = this.cloth(new Color(0.08, 0.02, 0.2), new Color(0.8, 0.6, 1.0), 0.4);
        const torus = this.add(new TorusGeometry(4, 1.6, 96, 128), this.hero, 22, 7);
        torus.rotationX = 70;

        const floorMat = new LitMaterial();
        floorMat.baseColor = new Color(0.5, 0.5, 0.52); floorMat.roughness = 0.9; floorMat.metallic = 0;
        const floor = this.add(new BoxGeometry(120, 1, 80), floorMat, 5, -0.5);
        floor.getComponent(MeshRenderer).castShadow = false;
    }

    private initGUI() {
        GUIHelp.init();
        const f = GUIHelp.addFolder('Sheen (torus)');
        const s = { enable: true, r: 0.8, g: 0.6, b: 1.0, roughness: 0.4 };
        const apply = () => {
            this.hero.sheenRoughness = s.roughness;
            this.hero.sheenColor = s.enable ? new Color(s.r, s.g, s.b) : new Color(0, 0, 0);
        };
        f.add(s, 'enable').onChange(apply);
        f.add(s, 'r', 0, 1, 0.01).onChange(apply);
        f.add(s, 'g', 0, 1, 0.01).onChange(apply);
        f.add(s, 'b', 0, 1, 0.01).onChange(apply);
        f.add(s, 'roughness', 0, 1, 0.01).onChange(apply);
        f.open();
    }
}

new Sample_Sheen().run();
