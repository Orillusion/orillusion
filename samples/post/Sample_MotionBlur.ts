import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LitMaterial, MeshRenderer, MotionBlurPost, Object3D, PostProcessingComponent, Scene3D, Time, View3D,
} from '@orillusion/core';

/**
 * MotionBlurPost demo — the camera orbits a field of pillars on its own;
 * the faster it turns, the longer the streaks. Drag to look around (the
 * blur follows your own camera motion too), and use the GUI to change the
 * shutter, sample count and clamp, or to pause the orbit and see the image
 * snap back to sharp.
 */
class Sample_MotionBlur {
    private scene: Scene3D;
    private ctrl: HoverCameraController;
    private post: PostProcessingComponent;
    private blur: MotionBlurPost;
    private readonly state = { enable: true, orbitSpeed: 60, roll: 30 };

    async run() {
        const engine = await Engine3D.init({
            renderLoop: () => this.loop(),
            setting: { shadow: { enable: true, shadowBound: 140 } },
        });
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent).sunY = 0.65;

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, engine.aspect, 0.1, 2000);
        this.ctrl = camera.object3D.addComponent(HoverCameraController);
        this.ctrl.setCamera(this.state.roll, -14, 75);

        const lightObj = new Object3D();
        lightObj.rotationX = 50; lightObj.rotationY = 130;
        const light = lightObj.addComponent(DirectLight);
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5600);
        light.intensity = 3; light.castShadow = true;
        this.scene.addChild(lightObj);

        this.build();

        const view = new View3D();
        view.scene = this.scene;
        view.camera = camera;
        engine.startRenderView(view);

        this.post = this.scene.addComponent(PostProcessingComponent);
        this.blur = this.post.addPost(MotionBlurPost);
        this.blur.intensity = 1;
        this.initGUI();
    }

    private build() {
        const palette = [new Color(0.95, 0.95, 0.95), new Color(0.05, 0.05, 0.05), new Color(0.9, 0.25, 0.15), new Color(0.15, 0.4, 0.9), new Color(0.95, 0.8, 0.2)];
        const mats = palette.map(c => { const m = new LitMaterial(); m.baseColor = c; m.roughness = 0.7; m.metallic = 0; return m; });
        const pillar = new BoxGeometry(3, 1, 3);
        for (let x = -8; x <= 8; x++) {
            for (let z = -8; z <= 8; z++) {
                if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
                const h = 5 + ((x * 7 + z * 13) & 7) * 2.5;
                const o = new Object3D();
                const mr = o.addComponent(MeshRenderer);
                mr.geometry = pillar;
                mr.material = mats[Math.abs(x * 3 + z * 5) % mats.length];
                mr.castShadow = true;
                o.x = x * 8; o.z = z * 8; o.y = h / 2; o.scaleY = h;
                this.scene.addChild(o);
            }
        }
        const floor = new Object3D();
        const fm = floor.addComponent(MeshRenderer);
        fm.geometry = new BoxGeometry(400, 1, 400);
        const mat = new LitMaterial(); mat.baseColor = new Color(0.5, 0.5, 0.5); mat.roughness = 0.9; mat.metallic = 0;
        fm.material = mat; fm.castShadow = false;
        floor.y = -0.5;
        this.scene.addChild(floor);
    }

    private loop() {
        if (!this.ctrl) return;
        this.state.roll += this.state.orbitSpeed * Time.delta * 0.001;
        this.ctrl.roll = this.state.roll;
    }

    private initGUI() {
        GUIHelp.init();
        const f = GUIHelp.addFolder('MotionBlurPost');
        f.add(this.state, 'enable').onChange((v: boolean) => {
            if (v) this.blur = this.post.addPost(MotionBlurPost);
            else this.post.removePost(MotionBlurPost);
        });
        f.add(this.state, 'orbitSpeed', 0, 240, 1);
        const b = this.blur;
        f.add(b, 'intensity', 0, 2, 0.01);
        f.add(b, 'samples', 2, 32, 1);
        f.add(b, 'maxBlurPixels', 0, 200, 1);
        f.add(b, 'frameRateIndependent');
        f.open();
    }
}

new Sample_MotionBlur().run();
