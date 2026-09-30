import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, ColorGradingPost, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LitMaterial, MeshRenderer, Object3D, PostProcessingComponent, Scene3D, SphereGeometry, View3D,
} from '@orillusion/core';

/**
 * ColorGradingPost demo. A colour-chart wall (hue × lightness) and a row of
 * materials make every adjustment easy to read: exposure, temperature /
 * tint, contrast, saturation, ASC-CDL slope / offset / power, and a set of
 * LUT "looks" generated in code (teal-orange, sepia, bleach, invert).
 */
class Sample_ColorGrading {
    private scene: Scene3D;
    private grade: ColorGradingPost;

    async run() {
        const engine = await Engine3D.init({ setting: { shadow: { enable: true, shadowBound: 60 } } });
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent).sunY = 0.62;

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(45, engine.aspect, 0.1, 1000);
        camera.object3D.addComponent(HoverCameraController).setCamera(0, -8, 38);

        const lightObj = new Object3D();
        lightObj.rotationX = 40; lightObj.rotationY = 150;
        const light = lightObj.addComponent(DirectLight);
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5600);
        light.intensity = 3; light.castShadow = true;
        this.scene.addChild(lightObj);

        this.build();

        const view = new View3D();
        view.scene = this.scene;
        view.camera = camera;
        engine.startRenderView(view);

        const post = this.scene.addComponent(PostProcessingComponent);
        this.grade = post.addPost(ColorGradingPost);
        this.initGUI();
    }

    private hsl(h: number, s: number, l: number): Color {
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
        return new Color(f(0), f(8), f(4), 1);
    }

    private add(geo: any, mat: LitMaterial, x: number, y: number, z = 0) {
        const o = new Object3D();
        const mr = o.addComponent(MeshRenderer);
        mr.geometry = geo; mr.material = mat; mr.castShadow = true;
        o.x = x; o.y = y; o.z = z;
        this.scene.addChild(o);
    }

    private build() {
        const chip = new BoxGeometry(1.8, 1.8, 0.3);
        for (let hx = 0; hx < 12; hx++) {
            for (let ly = 0; ly < 5; ly++) {
                const m = new LitMaterial();
                m.baseColor = ly === 4 ? new Color(hx / 11, hx / 11, hx / 11, 1) : this.hsl(hx / 12, 0.85, 0.2 + ly * 0.18);
                m.roughness = 0.8; m.metallic = 0;
                this.add(chip, m, (hx - 5.5) * 2, 3 + ly * 2, -3);
            }
        }
        const sphere = new SphereGeometry(1.6, 40, 40);
        const mats: [number, number, number, number, number][] = [[0.9, 0.2, 0.15, 0.4, 0], [0.95, 0.75, 0.3, 0.3, 1], [0.2, 0.6, 0.3, 0.6, 0], [0.2, 0.4, 0.9, 0.2, 0], [0.9, 0.9, 0.9, 0.15, 1]];
        mats.forEach((c, i) => {
            const m = new LitMaterial();
            m.baseColor = new Color(c[0], c[1], c[2], 1); m.roughness = c[3]; m.metallic = c[4];
            this.add(sphere, m, (i - 2) * 4.2, 1.6, 3);
        });
        const floorMat = new LitMaterial();
        floorMat.baseColor = new Color(0.5, 0.5, 0.5); floorMat.roughness = 0.9; floorMat.metallic = 0;
        const floor = new Object3D();
        const fm = floor.addComponent(MeshRenderer);
        fm.geometry = new BoxGeometry(120, 1, 80); fm.material = floorMat; fm.castShadow = false;
        floor.y = -0.5;
        this.scene.addChild(floor);
    }

    private initGUI() {
        GUIHelp.init();
        const g = this.grade;
        const f = GUIHelp.addFolder('ColorGradingPost');
        f.add(g, 'exposure', -3, 3, 0.01);
        f.add(g, 'temperature', -1, 1, 0.01);
        f.add(g, 'tint', -1, 1, 0.01);
        f.add(g, 'contrast', 0, 2, 0.01);
        f.add(g, 'saturation', 0, 2, 0.01);
        const cdl = { slope: 1, offset: 0, power: 1 };
        f.add(cdl, 'slope', 0.2, 2, 0.01).onChange((v: number) => g.slope = [v, v, v]);
        f.add(cdl, 'offset', -0.3, 0.3, 0.005).onChange((v: number) => g.offset = [v, v, v]);
        f.add(cdl, 'power', 0.3, 3, 0.01).onChange((v: number) => g.power = [v, v, v]);

        const lum = (r: number, gg: number, b: number) => 0.2126 * r + 0.7152 * gg + 0.0722 * b;
        const looks: Record<string, ((r: number, g: number, b: number) => [number, number, number]) | null> = {
            none: null,
            'teal-orange': (r, gg, b) => { const l = lum(r, gg, b); return [r + 0.12 * (l - 0.4), gg + 0.02, b + 0.14 * (0.5 - l)]; },
            sepia: (r, gg, b) => { const l = lum(r, gg, b); return [l * 1.07 + 0.03, l * 0.92 + 0.02, l * 0.72]; },
            bleach: (r, gg, b) => { const l = lum(r, gg, b); const k = 0.6; const c = (v: number) => (v + (l - v) * k - 0.5) * 1.35 + 0.5; return [c(r), c(gg), c(b)]; },
            invert: (r, gg, b) => [1 - r, 1 - gg, 1 - b],
        };
        const state = { look: 'none' };
        f.add(state, 'look', Object.keys(looks)).onChange((v: string) => {
            const fn = looks[v];
            if (fn) g.setLUTFromFunction(32, fn); else g.lut = null;
        });
        f.add(g, 'lutIntensity', 0, 1, 0.01);
        f.open();
    }
}

new Sample_ColorGrading().run();
