import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    BoxGeometry, CameraUtil, Color, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D,
    RectLight, Scene3D, SphereGeometry, TorusGeometry, UnLitMaterial, Vector3, View3D,
} from '@orillusion/core';

/**
 * RectLight demo: a dark studio lit only by three rectangular panels.
 *
 * - a warm key panel on the left, a cool one on the right and a magenta
 *   strip that swings over the stage;
 * - the floor is glossy, so each panel shows up as a stretched rectangular
 *   reflection, while the back wall and the matte spheres show the soft,
 *   size-dependent diffuse falloff;
 * - the sphere row sweeps roughness from mirror-like to matte.
 *
 * The light itself is invisible; each panel here also carries a thin unlit
 * box so you can see where the emitter is.
 */
class Sample_RectLight {
    private scene: Scene3D;
    private panels: { obj: Object3D; light: RectLight; face: Object3D; mat: UnLitMaterial }[] = [];
    private readonly state = { swing: true, swingSpeed: 0.6 };

    async run() {
        const engine = await Engine3D.init({ renderLoop: () => this.update() });
        this.scene = new Scene3D();

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(50, engine.aspect, 0.1, 500);
        camera.object3D.addComponent(HoverCameraController).setCamera(20, -18, 30, new Vector3(0, 3, 0));

        this.buildStage();
        this.addPanel('key (warm)', new Color(1.0, 0.72, 0.45), 6, new Vector3(-9, 5, 3), new Vector3(0, 2, 0), 5, 4);
        this.addPanel('fill (cool)', new Color(0.45, 0.7, 1.0), 5, new Vector3(9, 4, 4), new Vector3(0, 2, 0), 3, 6);
        this.addPanel('strip (magenta)', new Color(1.0, 0.25, 0.8), 8, new Vector3(0, 8, -2), new Vector3(0, 0, -2), 10, 1);

        const view = new View3D();
        view.scene = this.scene;
        view.camera = camera;
        engine.startRenderView(view);
        this.initGUI();
    }

    private mesh(geo: any, mat: any, x: number, y: number, z: number): Object3D {
        const o = new Object3D();
        const mr = o.addComponent(MeshRenderer);
        mr.geometry = geo; mr.material = mat;
        o.x = x; o.y = y; o.z = z;
        this.scene.addChild(o);
        return o;
    }

    private lit(r: number, g: number, b: number, roughness: number, metallic = 0): LitMaterial {
        const m = new LitMaterial();
        m.baseColor = new Color(r, g, b, 1);
        m.roughness = roughness; m.metallic = metallic;
        return m;
    }

    private buildStage() {
        this.mesh(new BoxGeometry(60, 0.4, 60), this.lit(0.35, 0.35, 0.37, 0.35), 0, -0.2, 0);      // glossy floor
        this.mesh(new BoxGeometry(60, 24, 0.4), this.lit(0.7, 0.7, 0.7, 1.0), 0, 12, -12);           // matte back wall
        const ball = new SphereGeometry(1.2, 48, 48);
        for (let i = 0; i < 6; i++) {
            this.mesh(ball, this.lit(0.85, 0.85, 0.85, 0.1 + i * 0.18, 1), (i - 2.5) * 3, 1.2, 1);  // metal, roughness sweep
            this.mesh(ball, this.lit(0.8, 0.8, 0.8, 0.2 + i * 0.16, 0), (i - 2.5) * 3, 1.2, -3);    // dielectric
        }
        const torus = this.mesh(new TorusGeometry(2, 0.6, 48, 64), this.lit(0.9, 0.75, 0.4, 0.4, 1), 0, 3.4, -7);
        torus.rotationX = 70;
    }

    private addPanel(name: string, color: Color, intensity: number, pos: Vector3, target: Vector3, width: number, height: number) {
        const obj = new Object3D();
        obj.name = name;
        const light = obj.addComponent(RectLight);
        light.lightColor = color;
        light.intensity = intensity;
        light.width = width; light.height = height;
        light.range = 45;
        this.scene.addChild(obj);
        obj.transform.lookAt(pos, target);

        // Visible emitter: a thin unlit box in the light's own plane.
        const face = new Object3D();
        const mr = face.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(1, 1, 0.05);
        const mat = new UnLitMaterial();
        mr.material = mat;
        mr.castShadow = false;
        obj.addChild(face);
        const panel = { obj, light, face, mat };
        this.panels.push(panel);
        this.syncFace(panel);
    }

    private syncFace(p: { light: RectLight; face: Object3D; mat: UnLitMaterial }) {
        p.face.localScale = new Vector3(p.light.width, p.light.height, 1);
        const c = p.light.lightColor, k = Math.min(p.light.intensity, 12) / 4;
        p.mat.baseColor = new Color(c.r * k, c.g * k, c.b * k, 1);
    }

    private time = 0;
    private update() {
        const strip = this.panels[2];
        if (!strip || !this.state.swing) return;
        this.time += 0.016 * this.state.swingSpeed;
        const x = Math.sin(this.time) * 7;
        strip.obj.transform.lookAt(new Vector3(x, 8, -2 + Math.cos(this.time * 0.7) * 3), new Vector3(x * 0.3, 0, -2));
    }

    private initGUI() {
        GUIHelp.init();
        for (const p of this.panels) {
            const f = GUIHelp.addFolder(p.obj.name);
            const proxy = {
                enable: true, intensity: p.light.intensity, width: p.light.width, height: p.light.height, range: p.light.range,
                color: [p.light.lightColor.r * 255, p.light.lightColor.g * 255, p.light.lightColor.b * 255],
            };
            f.add(proxy, 'enable').onChange((v: boolean) => { p.light.enable = v; p.face.transform.enable = v; });
            f.add(proxy, 'intensity', 0, 20, 0.1).onChange((v: number) => { p.light.intensity = v; this.syncFace(p); });
            f.add(proxy, 'width', 0.2, 16, 0.1).onChange((v: number) => { p.light.width = v; this.syncFace(p); });
            f.add(proxy, 'height', 0.2, 16, 0.1).onChange((v: number) => { p.light.height = v; this.syncFace(p); });
            f.add(proxy, 'range', 5, 80, 1).onChange((v: number) => { p.light.range = v; });
            f.addColor(proxy, 'color').onChange((v: number[]) => { p.light.lightColor = new Color(v[0] / 255, v[1] / 255, v[2] / 255, 1); this.syncFace(p); });
            f.open();
        }
        const s = GUIHelp.addFolder('strip animation');
        s.add(this.state, 'swing');
        s.add(this.state, 'swingSpeed', 0, 3, 0.05);
        s.open();
    }
}

new Sample_RectLight().run();
