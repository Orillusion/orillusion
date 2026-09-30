import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LensPost, LitMaterial, MeshRenderer, Object3D, PostProcessingComponent, Scene3D, SphereGeometry, View3D,
} from '@orillusion/core';

/**
 * LensPost demo — vignette, chromatic aberration and film grain.
 *
 * A grid of high-contrast white/black pillars makes the colour fringing easy
 * to see toward the screen edges; the flat sky shows the vignette falloff and
 * the grain. Every parameter is on the GUI, plus an on/off toggle that
 * attaches / detaches the post.
 */
class Sample_Lens {
    private scene: Scene3D;
    private post: PostProcessingComponent;
    private lens: LensPost;

    async run() {
        const engine = await Engine3D.init({ setting: { shadow: { enable: true, shadowBound: 120 } } });
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent).sunY = 0.65;

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, engine.aspect, 0.1, 2000);
        camera.object3D.addComponent(HoverCameraController).setCamera(30, -18, 70);

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
        this.lens = this.post.addPost(LensPost);
        this.lens.vignetteIntensity = 0.55;
        this.lens.chromaticAberration = 0.3;
        this.lens.grainIntensity = 0.15;
        this.initGUI();
    }

    private build() {
        const white = new LitMaterial(); white.baseColor = new Color(0.95, 0.95, 0.95); white.roughness = 0.7; white.metallic = 0;
        const black = new LitMaterial(); black.baseColor = new Color(0.02, 0.02, 0.02); black.roughness = 0.7; black.metallic = 0;
        const accent = new LitMaterial(); accent.baseColor = new Color(0.9, 0.2, 0.1); accent.roughness = 0.4; accent.metallic = 0;
        const pillar = new BoxGeometry(3, 1, 3);
        for (let x = -7; x <= 7; x++) {
            for (let z = -7; z <= 7; z++) {
                const h = 4 + ((x * 7 + z * 13) & 7) * 2.2;
                const o = new Object3D();
                const mr = o.addComponent(MeshRenderer);
                mr.geometry = pillar;
                mr.material = (x + z) & 1 ? white : black;
                mr.castShadow = true;
                o.x = x * 8; o.z = z * 8; o.y = h / 2; o.scaleY = h;
                this.scene.addChild(o);
            }
        }
        const ball = new Object3D();
        const bm = ball.addComponent(MeshRenderer);
        bm.geometry = new SphereGeometry(6, 48, 48); bm.material = accent; bm.castShadow = true;
        ball.y = 26;
        this.scene.addChild(ball);

        const floor = new Object3D();
        const fm = floor.addComponent(MeshRenderer);
        fm.geometry = new BoxGeometry(400, 1, 400);
        const mat = new LitMaterial(); mat.baseColor = new Color(0.5, 0.5, 0.5); mat.roughness = 0.9; mat.metallic = 0;
        fm.material = mat; fm.castShadow = false;
        floor.y = -0.5;
        this.scene.addChild(floor);
    }

    private initGUI() {
        GUIHelp.init();
        const f = GUIHelp.addFolder('LensPost');
        const state = { enable: true };
        f.add(state, 'enable').onChange((v: boolean) => {
            if (v) this.lens = this.post.addPost(LensPost);
            else this.post.removePost(LensPost);
        });
        const l = this.lens;
        f.add(l, 'vignetteIntensity', 0, 1.5, 0.01);
        f.add(l, 'vignetteSmoothness', 0, 1, 0.01);
        f.add(l, 'vignetteRoundness', 0, 1, 0.01);
        f.add(l, 'chromaticAberration', 0, 3, 0.01);
        f.add(l, 'grainIntensity', 0, 1, 0.01);
        f.add(l, 'grainStatic');
        f.open();
    }
}

new Sample_Lens().run();
