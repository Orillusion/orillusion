import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, CylinderGeometry, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LitMaterial, MeshRenderer, MotionBlurPost, Object3D, PostProcessingComponent, Scene3D, SphereGeometry, Time, View3D,
} from '@orillusion/core';

/**
 * Per-object motion blur (`engine.setting.render.objectMotionVectors`).
 *
 * The camera stands still; the scene moves: a three-blade propeller spins,
 * a pendulum swings, a line of spheres shuttles back and forth, and a cube
 * tumbles. With object motion vectors on, each of them streaks according
 * to its own speed while the static ground and pillars stay sharp — the
 * camera-only blur (the default) would leave all of them perfectly sharp
 * as long as you do not move the camera. The GUI toggles the blur, drives
 * the speeds and the shutter.
 */
class Sample_ObjectMotionBlur {
    private scene: Scene3D;
    private blur: MotionBlurPost;
    private propeller: Object3D;
    private pendulum: Object3D;
    private shuttle: Object3D[] = [];
    private tumbler: Object3D;
    private readonly state = { blur: true, propellerRpm: 90, pendulum: true, shuttleSpeed: 1, tumble: true };
    private t = 0;

    async run() {
        const engine = await Engine3D.init({
            renderLoop: () => this.loop(),
            setting: { shadow: { enable: true, shadowBound: 80 }, render: { objectMotionVectors: true } as any },
        });
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent).sunY = 0.65;

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(50, engine.aspect, 0.1, 500);
        camera.object3D.addComponent(HoverCameraController).setCamera(20, -12, 40);

        const lightObj = new Object3D();
        lightObj.rotationX = 45; lightObj.rotationY = 140;
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
        this.blur = post.addPost(MotionBlurPost);
        this.blur.intensity = 1; this.blur.samples = 16; this.blur.maxBlurPixels = 96;
        this.initGUI();
    }

    private lit(r: number, g: number, b: number, roughness = 0.6, metallic = 0): LitMaterial {
        const m = new LitMaterial(); m.baseColor = new Color(r, g, b); m.roughness = roughness; m.metallic = metallic; return m;
    }

    private mesh(parent: Object3D | Scene3D, geo: any, mat: LitMaterial, x = 0, y = 0, z = 0): Object3D {
        const o = new Object3D();
        const mr = o.addComponent(MeshRenderer);
        mr.geometry = geo; mr.material = mat; mr.castShadow = true;
        o.x = x; o.y = y; o.z = z;
        parent.addChild(o);
        return o;
    }

    private build() {
        this.mesh(this.scene, new BoxGeometry(80, 0.4, 80), this.lit(0.5, 0.5, 0.52, 0.9), 0, -0.2, 0);
        // Static pillars: a sharp reference right next to the moving things.
        const pillar = new BoxGeometry(1, 8, 1);
        for (let i = -3; i <= 3; i++) this.mesh(this.scene, pillar, this.lit(0.85, 0.85, 0.85, 0.7), i * 6, 4, -12);

        // Propeller: hub + three blades, rotating around z.
        this.propeller = new Object3D();
        this.propeller.x = -10; this.propeller.y = 8;
        this.scene.addChild(this.propeller);
        this.mesh(this.propeller, new CylinderGeometry(0.8, 0.8, 1.2, 24), this.lit(0.2, 0.2, 0.22, 0.4, 1)).rotationX = 90;
        const blade = new BoxGeometry(0.4, 7, 1.2);
        const bladeMats = [this.lit(0.9, 0.2, 0.15), this.lit(0.95, 0.8, 0.2), this.lit(0.2, 0.5, 0.95)];
        for (let i = 0; i < 3; i++) {
            const arm = new Object3D();
            arm.rotationZ = i * 120;
            this.propeller.addChild(arm);
            this.mesh(arm, blade, bladeMats[i], 0, 3.8, 0);
        }
        this.mesh(this.scene, new BoxGeometry(0.6, 8, 0.6), this.lit(0.3, 0.3, 0.3), -10, 4, -1);

        // Pendulum: pivot at the top, bob at the end of a rod.
        this.pendulum = new Object3D();
        this.pendulum.x = 0; this.pendulum.y = 12;
        this.scene.addChild(this.pendulum);
        this.mesh(this.pendulum, new CylinderGeometry(0.12, 0.12, 9, 12), this.lit(0.6, 0.6, 0.6, 0.4, 1), 0, -4.5, 0);
        this.mesh(this.pendulum, new SphereGeometry(1.4, 32, 32), this.lit(0.95, 0.55, 0.15, 0.3, 1), 0, -9.5, 0);
        this.mesh(this.scene, new BoxGeometry(6, 0.4, 0.4), this.lit(0.3, 0.3, 0.3), 0, 12.2, 0);

        // Shuttle: five spheres sliding along x, each with a different phase.
        const ball = new SphereGeometry(0.9, 32, 32);
        for (let i = 0; i < 5; i++) this.shuttle.push(this.mesh(this.scene, ball, this.lit(0.2 + i * 0.15, 0.8, 0.3), 0, 1.2, 4 + i * 2.2));

        // Tumbling cube.
        this.tumbler = this.mesh(this.scene, new BoxGeometry(3, 3, 3), this.lit(0.85, 0.3, 0.6, 0.5), 11, 4, 0);
    }

    private loop() {
        const dt = Math.min(Time.delta, 50) / 1000;
        this.t += dt;
        this.propeller.rotationZ += this.state.propellerRpm * 6 * dt;          // rpm → deg/s
        if (this.state.pendulum) this.pendulum.rotationZ = Math.sin(this.t * 2.2) * 50;
        for (let i = 0; i < this.shuttle.length; i++) {
            this.shuttle[i].x = Math.sin((this.t * this.state.shuttleSpeed + i * 0.6) * 1.8) * 12;
        }
        if (this.state.tumble) { this.tumbler.rotationX += 140 * dt; this.tumbler.rotationY += 90 * dt; }
    }

    private initGUI() {
        GUIHelp.init();
        const f = GUIHelp.addFolder('object motion blur');
        f.add(this.state, 'blur').onChange((v: boolean) => { this.blur.intensity = v ? 1 : 0; });
        f.add(this.blur, 'intensity', 0, 3, 0.05);
        f.add(this.blur, 'samples', 2, 32, 1);
        f.add(this.blur, 'maxBlurPixels', 4, 256, 1);
        f.add(this.state, 'propellerRpm', 0, 300, 1);
        f.add(this.state, 'pendulum');
        f.add(this.state, 'shuttleSpeed', 0, 3, 0.05);
        f.add(this.state, 'tumble');
        f.open();
    }
}

new Sample_ObjectMotionBlur().run();
