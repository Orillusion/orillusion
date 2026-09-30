import {
    AtmosphericComponent, BloomPost, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, LensPost, LitMaterial, MaterialVariants,
    MeshRenderer, Object3D, PointLight, PostProcessingComponent, Scene3D, SphereGeometry, SpotLight, TorusGeometry, UnLitMaterial, Vector3, View3D, BlendMode,
} from '@orillusion/core';
import { buildVariantsDemoGLB } from '@samples/utils/GLBBuilder';
import { Tolerance } from './VisualHarness';

export interface VisualSceneDef {
    name: string;
    /** Extra engine settings merged into Engine3D.init. */
    setting?: any;
    build(engine: Engine3D): Promise<View3D>;
    /** Frames to render before capturing (shadows / IBL / posts need a few). */
    frames?: number;
    tolerance?: Tolerance;
}

function baseScene(engine: Engine3D, camPos: Vector3, target: Vector3, sky = true): { scene: Scene3D; view: View3D } {
    const scene = new Scene3D();
    if (sky) scene.addComponent(AtmosphericComponent).sunY = 0.6;
    const camera = CameraUtil.createCamera3DObject(scene, 'camera');
    camera.perspective(50, 320 / 180, 0.1, 500);
    camera.lookAt(camPos, target);
    const view = new View3D();
    view.scene = scene;
    view.camera = camera;
    return { scene, view };
}

function sun(scene: Scene3D, rx = 45, ry = 135, intensity = 3, shadow = false): DirectLight {
    const o = new Object3D();
    o.rotationX = rx; o.rotationY = ry;
    const l = o.addComponent(DirectLight);
    l.intensity = intensity;
    l.castShadow = shadow;
    scene.addChild(o);
    return l;
}

function mesh(scene: Scene3D, geo: any, mat: any, x: number, y: number, z: number, shadow = true): Object3D {
    const o = new Object3D();
    const mr = o.addComponent(MeshRenderer);
    mr.geometry = geo; mr.material = mat; mr.castShadow = shadow;
    o.x = x; o.y = y; o.z = z;
    scene.addChild(o);
    return o;
}

function lit(r: number, g: number, b: number, roughness = 0.5, metallic = 0): LitMaterial {
    const m = new LitMaterial();
    m.baseColor = new Color(r, g, b, 1);
    m.roughness = roughness; m.metallic = metallic;
    return m;
}

export const VISUAL_SCENES: VisualSceneDef[] = [
    {
        // Metallic / roughness sweep under sky IBL + sun: the core PBR path.
        name: 'pbr-spheres',
        async build(engine) {
            const { scene, view } = baseScene(engine, new Vector3(0, 3, 16), new Vector3(0, 2, 0));
            sun(scene);
            const geo = new SphereGeometry(1, 32, 32);
            for (let i = 0; i < 5; i++) {
                mesh(scene, geo, lit(0.8, 0.25, 0.2, 0.1 + i * 0.2, 0), (i - 2) * 2.4, 3.4, 0);
                mesh(scene, geo, lit(0.85, 0.85, 0.9, 0.1 + i * 0.2, 1), (i - 2) * 2.4, 1, 0);
            }
            mesh(scene, new BoxGeometry(40, 0.2, 40), lit(0.5, 0.5, 0.5, 0.9), 0, -0.3, 0, false);
            return view;
        },
    },
    {
        // Directional shadows (CSM) over boxes of different heights.
        name: 'directional-shadow',
        setting: { shadow: { enable: true, shadowBound: 40, shadowSize: 1024 } },
        frames: 60,
        async build(engine) {
            const { scene, view } = baseScene(engine, new Vector3(10, 9, 14), new Vector3(0, 1, 0));
            sun(scene, 50, 120, 3.5, true);
            const box = new BoxGeometry(1.6, 1, 1.6);
            for (let x = -2; x <= 2; x++) {
                for (let z = -1; z <= 1; z++) {
                    const h = 1 + ((x * 3 + z * 5 + 20) % 4);
                    const o = mesh(scene, box, lit(0.75, 0.75, 0.7, 0.8), x * 3, h / 2, z * 3);
                    o.scaleY = h;
                }
            }
            mesh(scene, new BoxGeometry(60, 0.2, 60), lit(0.6, 0.6, 0.62, 0.95), 0, -0.1, 0, false);
            return view;
        },
    },
    {
        // Point + spot lights through the clustered path, no sun.
        name: 'point-spot-lights',
        async build(engine) {
            const { scene, view } = baseScene(engine, new Vector3(0, 8, 14), new Vector3(0, 0.5, 0), false);
            const colors: [number, number, number][] = [[1, 0.2, 0.2], [0.2, 1, 0.3], [0.3, 0.4, 1]];
            colors.forEach((c, i) => {
                const o = new Object3D();
                o.x = (i - 1) * 5; o.y = 2.5; o.z = 1;
                const p = o.addComponent(PointLight);
                p.lightColor = new Color(c[0], c[1], c[2]);
                p.intensity = 0.5; p.range = 12; p.radius = 0.01;
                scene.addChild(o);
            });
            const so = new Object3D();
            so.y = 7; so.z = -3; so.rotationX = 70;
            const s = so.addComponent(SpotLight);
            s.intensity = 4; s.range = 30; s.radius = 1; s.outerAngle = 50; s.innerAngle = 20;
            scene.addChild(so);
            // No sky here: switch the default environment term off so the image is
            // driven by the punctual lights alone.
            const noEnv = (m: LitMaterial) => { m.setUniformFloat('envIntensity', 0); return m; };
            const geo = new SphereGeometry(0.9, 24, 24);
            for (let i = 0; i < 5; i++) mesh(scene, geo, noEnv(lit(0.8, 0.8, 0.8, 0.5)), (i - 2) * 2.5, 0.9, 0, false);
            mesh(scene, new BoxGeometry(40, 0.2, 40), noEnv(lit(0.7, 0.7, 0.7, 0.9)), 0, -0.1, 0, false);
            return view;
        },
    },
    {
        // Alpha-blended quads over opaque geometry + an unlit emissive reference.
        name: 'transparency',
        async build(engine) {
            const { scene, view } = baseScene(engine, new Vector3(0, 2.5, 12), new Vector3(0, 2, 0));
            sun(scene);
            mesh(scene, new BoxGeometry(14, 5, 0.2), lit(0.9, 0.9, 0.85, 0.8), 0, 2.5, -2, false);
            const quad = new BoxGeometry(3, 3, 0.05);
            const tints: [number, number, number][] = [[1, 0.1, 0.1], [0.1, 1, 0.1], [0.1, 0.2, 1]];
            tints.forEach((c, i) => {
                const m = new LitMaterial();
                m.baseColor = new Color(c[0], c[1], c[2], 0.5);
                m.roughness = 0.4; m.metallic = 0;
                m.blendMode = BlendMode.ALPHA;
                m.transparent = true;
                mesh(scene, quad, m, (i - 1) * 2, 2.5, i * 0.6, false);
            });
            const u = new UnLitMaterial();
            u.baseColor = new Color(1, 0.8, 0.1, 1);
            mesh(scene, new SphereGeometry(0.6, 16, 16), u, 5.2, 4.2, 0, false);
            return view;
        },
    },
    {
        // Sheen / iridescence / clearcoat on top of the base BRDF.
        name: 'material-extensions',
        async build(engine) {
            const { scene, view } = baseScene(engine, new Vector3(0, 2.2, 11), new Vector3(0, 2, 0));
            sun(scene, 40, 150, 3.5);
            const geo = new SphereGeometry(1.2, 40, 40);
            const velvet = lit(0.2, 0.02, 0.03, 0.9);
            velvet.sheenRoughness = 0.5; velvet.sheenColor = new Color(1, 0.7, 0.7);
            const film = lit(0.25, 0.25, 0.27, 0.25, 1);
            film.iridescenceThickness = 400; film.iridescence = 1;
            const coat = lit(0.1, 0.3, 0.8, 0.6);
            coat.clearcoatFactor = 1; coat.clearcoatRoughnessFactor = 0.1;
            const plain = lit(0.7, 0.7, 0.7, 0.5);
            [velvet, film, coat, plain].forEach((m, i) => mesh(scene, geo, m, (i - 1.5) * 2.8, 2, 0, false));
            mesh(scene, new TorusGeometry(1.2, 0.35, 32, 48), velvet, 0, 4.6, -1.5, false).rotationX = 60;
            mesh(scene, new BoxGeometry(40, 0.2, 40), lit(0.5, 0.5, 0.52, 0.9), 0, 0.2, 0, false);
            return view;
        },
    },
    {
        // Anisotropic highlights: strength sweep on top, grain rotation below.
        name: 'anisotropy',
        async build(engine) {
            const { scene, view } = baseScene(engine, new Vector3(0, 2.6, 11), new Vector3(0, 2.6, 0));
            sun(scene, 30, 170, 3.5);
            const geo = new SphereGeometry(1.1, 48, 48);
            for (let i = 0; i < 4; i++) {
                const a = lit(0.72, 0.72, 0.75, 0.35, 1);
                a.anisotropy = i / 3;
                mesh(scene, geo, a, (i - 1.5) * 2.7, 4, 0, false);
                const b = lit(0.72, 0.72, 0.75, 0.35, 1);
                b.anisotropyRotation = (i * 45 * Math.PI) / 180; b.anisotropy = 1;
                mesh(scene, geo, b, (i - 1.5) * 2.7, 1.3, 0, false);
            }
            return view;
        },
    },
    {
        // Bloom + lens vignette / aberration (grain off) through the AgX curve.
        name: 'post-stack',
        setting: { render: { tonemap: { enable: true, exposure: 1, mode: 'AgX' } } },
        frames: 50,
        async build(engine) {
            const { scene, view } = baseScene(engine, new Vector3(0, 3, 13), new Vector3(0, 2.5, 0));
            sun(scene);
            const geo = new SphereGeometry(0.9, 24, 24);
            const hues: [number, number, number][] = [[1, 0.1, 0.1], [1, 0.6, 0.1], [0.2, 1, 0.3], [0.2, 0.5, 1], [1, 1, 1]];
            hues.forEach((c, i) => {
                const m = new LitMaterial();
                m.baseColor = new Color(0, 0, 0, 1);
                m.emissiveColor = new Color(c[0], c[1], c[2], 1);
                m.emissiveIntensity = 6;
                mesh(scene, geo, m, (i - 2) * 2.4, 3.5, 0, false);
            });
            mesh(scene, new BoxGeometry(16, 1.5, 3), lit(0.8, 0.8, 0.8, 0.6), 0, 0.75, 0, false);
            mesh(scene, new BoxGeometry(40, 0.2, 40), lit(0.4, 0.4, 0.42, 0.9), 0, -0.1, 0, false);
            const post = scene.addComponent(PostProcessingComponent);
            post.addPost(BloomPost);
            const lens = post.addPost(LensPost);
            lens.vignetteIntensity = 0.6; lens.chromaticAberration = 0.5; lens.grainIntensity = 0; lens.grainStatic = true;
            return view;
        },
    },
    {
        // glTF loader end to end: quantized mesh, variant material, non-indexed ribbon.
        name: 'gltf-variants',
        async build(engine) {
            const { scene, view } = baseScene(engine, new Vector3(3, 1.5, 11), new Vector3(0, -0.4, 0));
            sun(scene, 40, 140, 3.5);
            const info = buildVariantsDemoGLB(2, 32);
            const root = await engine.res.loadGltf(URL.createObjectURL(info.blob));
            scene.addChild(root);
            root.getComponent(MaterialVariants).selectVariant('Crimson');
            mesh(scene, new BoxGeometry(40, 0.2, 40), lit(0.5, 0.5, 0.52, 0.9), 0, -4, 0, false);
            return view;
        },
    },
];
