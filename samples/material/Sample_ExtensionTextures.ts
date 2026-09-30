import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BitmapTexture2D, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LitMaterial, MeshRenderer, Object3D, Scene3D, SphereGeometry, Texture, TorusGeometry, View3D,
} from '@orillusion/core';
import { buildExtensionTexturesGLB, encodeHalfPNG } from '@samples/utils/GLBBuilder';

/**
 * Per-texel control of the KHR material extensions.
 *
 * Every texture here is painted in code with Canvas2D so the demo ships no
 * files:
 * - **sheen**: a woven stripe pattern in `sheenColorMap`, and a roughness map
 *   that makes the stripes alternately tight and broad;
 * - **iridescence**: a swirl in `iridescenceThicknessMap` (soap-film colour
 *   bands) and an `iridescenceMap` that fades the film out toward one pole;
 * - **specular**: a checker in `specularMap` (glossy / dead squares) and a
 *   warm/cool tint in `specularColorMap`;
 * - **anisotropy**: a radial-brush direction map — the classic vinyl-record /
 *   turned-metal highlight — with the strength fading out at the rim.
 *
 * The flat quad in front is loaded from an in-memory GLB whose material lists
 * all seven textures, proving the glTF path binds them too. The GUI toggles
 * each map so you can compare with the factor-only look.
 */
class Sample_ExtensionTextures {
    private scene: Scene3D;
    private mats: Record<string, LitMaterial> = {};
    private maps: Record<string, Texture> = {};
    private owners: Record<string, LitMaterial[]> = {};

    async run() {
        const engine = await Engine3D.init({ setting: { shadow: { enable: true, shadowBound: 60 } } });
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent).sunY = 0.62;

        const camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(45, engine.aspect, 0.1, 1000);
        camera.object3D.addComponent(HoverCameraController).setCamera(15, -12, 24);

        const lightObj = new Object3D();
        lightObj.rotationX = 40; lightObj.rotationY = 150;
        const light = lightObj.addComponent(DirectLight);
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5600);
        light.intensity = 3.5;
        light.castShadow = true;
        this.scene.addChild(lightObj);

        await this.build(engine);

        const view = new View3D();
        view.scene = this.scene;
        view.camera = camera;
        engine.startRenderView(view);
        this.initGUI();
    }

    /** Paint a texture with Canvas2D; `draw` gets a context of `size`×`size`. */
    private paint(size: number, draw: (ctx: OffscreenCanvasRenderingContext2D, s: number) => void, srgb = false): Texture {
        const canvas = new OffscreenCanvas(size, size);
        draw(canvas.getContext('2d')!, size);
        const tex = new BitmapTexture2D(true, undefined, srgb ? 'srgb' : 'linear');
        tex.source = canvas.transferToImageBitmap();
        return tex;
    }

    private add(geo: any, mat: LitMaterial, x: number, y: number, z = 0): Object3D {
        const o = new Object3D();
        const mr = o.addComponent(MeshRenderer);
        mr.geometry = geo; mr.material = mat; mr.castShadow = true;
        o.x = x; o.y = y; o.z = z;
        this.scene.addChild(o);
        return o;
    }

    private async build(engine: Engine3D) {
        const ball = new SphereGeometry(2.2, 64, 64);

        // ---- sheen: woven stripes ----
        this.maps.sheenColorMap = this.paint(256, (c, s) => {
            c.fillStyle = '#100'; c.fillRect(0, 0, s, s);
            c.fillStyle = '#ffd9b0';
            for (let i = 0; i < s; i += 32) { c.fillRect(i, 0, 12, s); c.fillRect(0, i, s, 12); }
        }, true);
        this.maps.sheenRoughnessMap = this.paint(256, (c, s) => {
            for (let i = 0; i < s; i += 32) { c.fillStyle = `rgba(0,0,0,${(i / s) * 0.9 + 0.1})`; c.fillRect(i, 0, 32, s); }
        });
        const velvet = new LitMaterial();
        velvet.baseColor = new Color(0.25, 0.03, 0.05); velvet.roughness = 0.9;
        velvet.sheenColor = new Color(1, 0.85, 0.7); velvet.sheenRoughness = 0.8;
        velvet.sheenColorMap = this.maps.sheenColorMap; velvet.sheenRoughnessMap = this.maps.sheenRoughnessMap;
        this.mats.sheen = velvet; this.owners.sheenColorMap = [velvet]; this.owners.sheenRoughnessMap = [velvet];
        this.add(ball, velvet, -7.5, 2.4);

        // ---- iridescence: swirl thickness + fade ----
        this.maps.iridescenceThicknessMap = this.paint(256, (c, s) => {
            const img = c.createImageData(s, s);
            for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                const u = x / s - 0.5, v = y / s - 0.5;
                const a = Math.atan2(v, u), r = Math.hypot(u, v);
                const t = 0.5 + 0.5 * Math.sin(a * 3 + r * 25);
                const o = (y * s + x) * 4;
                img.data[o] = 0; img.data[o + 1] = t * 255; img.data[o + 2] = 0; img.data[o + 3] = 255;
            }
            c.putImageData(img, 0, 0);
        });
        this.maps.iridescenceMap = this.paint(256, (c, s) => {
            const g = c.createLinearGradient(0, 0, 0, s); g.addColorStop(0, '#f00'); g.addColorStop(0.7, '#f00'); g.addColorStop(1, '#000');
            c.fillStyle = g; c.fillRect(0, 0, s, s);
        });
        const film = new LitMaterial();
        film.baseColor = new Color(0.2, 0.2, 0.22); film.metallic = 1; film.roughness = 0.2;
        film.iridescence = 1; film.iridescenceThicknessMinimum = 150; film.iridescenceThickness = 700;
        film.iridescenceMap = this.maps.iridescenceMap; film.iridescenceThicknessMap = this.maps.iridescenceThicknessMap;
        this.mats.iridescence = film; this.owners.iridescenceMap = [film]; this.owners.iridescenceThicknessMap = [film];
        this.add(ball, film, -2.5, 2.4);

        // ---- specular: checker strength + warm/cool tint ----
        this.maps.specularMap = this.paint(256, (c, s) => {
            const img = c.createImageData(s, s);
            for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                const on = ((x >> 5) + (y >> 5)) % 2 === 0;
                const o = (y * s + x) * 4;
                img.data[o] = img.data[o + 1] = img.data[o + 2] = 0; img.data[o + 3] = on ? 255 : 20;
            }
            c.putImageData(img, 0, 0);
        });
        this.maps.specularColorMap = this.paint(256, (c, s) => {
            const g = c.createLinearGradient(0, 0, s, 0); g.addColorStop(0, '#ff9040'); g.addColorStop(1, '#40a0ff');
            c.fillStyle = g; c.fillRect(0, 0, s, s);
        }, true);
        const gloss = new LitMaterial();
        gloss.baseColor = new Color(0.06, 0.06, 0.07); gloss.roughness = 0.12; gloss.metallic = 0;
        gloss.setUniformFloat('ior', 2.4);
        gloss.specularMap = this.maps.specularMap; gloss.specularColorMap = this.maps.specularColorMap;
        this.mats.specular = gloss; this.owners.specularMap = [gloss]; this.owners.specularColorMap = [gloss];
        this.add(ball, gloss, 2.5, 2.4);

        // ---- anisotropy: radial brush ----
        this.maps.anisotropyMap = this.paint(256, (c, s) => {
            const img = c.createImageData(s, s);
            for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                const u = x / s - 0.5, v = 0.5 - y / s;
                const r = Math.hypot(u, v) || 1e-4;
                // tangent of the circle around the centre = brushed rings
                const dx = -v / r, dy = u / r;
                const o = (y * s + x) * 4;
                img.data[o] = (dx * 0.5 + 0.5) * 255; img.data[o + 1] = (dy * 0.5 + 0.5) * 255;
                img.data[o + 2] = Math.max(0, 1 - r * 1.6) * 255; img.data[o + 3] = 255;
            }
            c.putImageData(img, 0, 0);
        });
        const brushed = new LitMaterial();
        brushed.baseColor = new Color(0.8, 0.78, 0.72); brushed.metallic = 1; brushed.roughness = 0.35;
        brushed.anisotropy = 1; brushed.anisotropyMap = this.maps.anisotropyMap;
        this.mats.anisotropy = brushed; this.owners.anisotropyMap = [brushed];
        this.add(new TorusGeometry(1.6, 0.7, 48, 96), brushed, 7.5, 2.4).rotationX = 90;

        // ---- glTF quad with all seven textures embedded ----
        const png = await encodeHalfPNG(64, '#202020', '#ffffff');
        const root = await engine.res.loadGltf(URL.createObjectURL(buildExtensionTexturesGLB(png, 5)));
        root.y = 7.5; root.z = -3; root.rotationX = 15;
        this.scene.addChild(root);
        this.mats.gltf = root.getComponentsInChild(MeshRenderer)[0].material as LitMaterial;

        this.add(new BoxGeometry(40, 0.2, 40), (() => { const m = new LitMaterial(); m.baseColor = new Color(0.45, 0.45, 0.47); m.roughness = 0.9; return m; })(), 0, -0.1);
    }

    private initGUI() {
        GUIHelp.init();
        const f = GUIHelp.addFolder('extension textures');
        const state: Record<string, boolean> = {};
        for (const name of ['sheenColorMap', 'sheenRoughnessMap', 'iridescenceMap', 'iridescenceThicknessMap', 'specularMap', 'specularColorMap', 'anisotropyMap']) {
            state[name] = true;
            f.add(state, name).onChange((v: boolean) => {
                for (const m of this.owners[name]) (m as any)[name] = v ? this.maps[name] : null;
            });
        }
        f.open();
    }
}

new Sample_ExtensionTextures().run();
