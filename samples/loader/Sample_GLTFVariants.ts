import { GUIHelp } from '@orillusion/debug/GUIHelp';
import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, DirectLight, Engine3D, HoverCameraController, KelvinUtil,
    LitMaterial, MaterialVariants, MeshRenderer, Object3D, Scene3D, View3D,
} from '@orillusion/core';
import { buildVariantsDemoGLB } from '@samples/utils/GLBBuilder';

/**
 * glTF extension coverage demo — everything on screen comes from a .glb that
 * is generated in memory (see `samples/utils/GLBBuilder.ts`):
 *
 *  - KHR_mesh_quantization: the sphere's positions are int16, normals int8
 *    and UVs uint16, expanded to float by the loader.
 *  - KHR_materials_variants: the dropdown switches the sphere between the
 *    authored material and three variants through `MaterialVariants`.
 *  - KHR_materials_specular on the default material, KHR_materials_sheen on
 *    the "Velvet" variant.
 *  - The yellow ribbon is a NON-indexed mesh with 100 triangles (the loader
 *    used to build its fallback index buffer as Uint8, wrapping at 255).
 */
class Sample_GLTFVariants {
    async run() {
        const engine = await Engine3D.init({ setting: { shadow: { enable: true, shadowBound: 30 } } });
        const scene = new Scene3D();
        scene.addComponent(AtmosphericComponent).sunY = 0.6;

        const camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(45, engine.aspect, 0.1, 500);
        camera.object3D.addComponent(HoverCameraController).setCamera(20, -12, 16);

        const lightObj = new Object3D();
        lightObj.rotationX = 40; lightObj.rotationY = 140;
        const light = lightObj.addComponent(DirectLight);
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5600);
        light.intensity = 3.5; light.castShadow = true;
        scene.addChild(lightObj);

        const floor = new Object3D();
        const fm = floor.addComponent(MeshRenderer);
        fm.geometry = new BoxGeometry(60, 1, 60);
        const mat = new LitMaterial(); mat.baseColor = new Color(0.5, 0.5, 0.52); mat.roughness = 0.9; mat.metallic = 0;
        fm.material = mat; fm.castShadow = false;
        floor.y = -4;
        scene.addChild(floor);

        const info = buildVariantsDemoGLB(2, 48);
        const url = URL.createObjectURL(info.blob);
        const root = await engine.res.loadGltf(url);
        scene.addChild(root);

        const view = new View3D();
        view.scene = scene;
        view.camera = camera;
        engine.startRenderView(view);

        const variants = root.getComponent(MaterialVariants);
        GUIHelp.init();
        const f = GUIHelp.addFolder('KHR_materials_variants');
        const state = { variant: '(default)', sphereVertices: info.sphereVertices, ribbonTriangles: info.ribbonTriangles };
        f.add(state, 'variant', ['(default)', ...variants.variantNames]).onChange((v: string) => {
            variants.selectVariant(v === '(default)' ? null : v);
        });
        f.add(state, 'sphereVertices');
        f.add(state, 'ribbonTriangles');
        f.open();
    }
}

new Sample_GLTFVariants().run();
