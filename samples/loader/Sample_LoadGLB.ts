import { AtmosphericComponent, BloomPost, Engine3D, GTAOPost, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, PostProcessingComponent, Scene3D, SkyRenderer, TAAPost } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { GUIUtil } from "@samples/utils/GUIUtil";

// Sample to load glb file
export class Sample_LoadGLB {
    scene: Scene3D;
    model: Object3D;

    async run() {
        GUIHelp.init();
        await Engine3D.init();
        Engine3D.setting.shadow.autoUpdate = true;

        let ex = createExampleScene();
        this.scene = ex.scene;
        this.scene.removeComponent(AtmosphericComponent);
        let sky = this.scene.getOrAddComponent(SkyRenderer);
        let skyMap = await Engine3D.res.loadLDRTextureCube('sky/LDR_sky.jpg')
        sky.map = skyMap;
        this.scene.envMap = skyMap;

        Engine3D.startRenderView(this.scene.view);
        GUIHelp.endFolder();
        await this.initScene();

        let post = this.scene.addComponent(PostProcessingComponent);
        let gtao = post.addPost(GTAOPost);
        // let taa = post.addPost(TAAPost);
        let hdr = post.addPost(BloomPost);

        GUIUtil.renderBloom(hdr);
        GUIUtil.renderDirLight(ex.light);
    }

    async initScene() {
        /******** floor *******/
        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.roughness = 0.85;
            mat.metallic = 0.1;
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(200, 200);
            mr.material = mat;
            this.scene.addChild(floor);
        }

        /******** load glb file *******/

        //model list
        let list = {
            "HIE-Hand-Armor": {
                url: `gltfs/glb/HIE-Hand-Armor.glb`,
                scale: 1,
                offset: [0, 0, 0],
                rotation: [0, 0, 0]
            },
            "PebsiCan": {
                url: `gltfs/glb/PebsiCan.glb`,
                scale: 1,
                offset: [0, 3, 0],
                rotation: [0, 0, 0]
            },
            "Liv-SpecOpsWolf": {
                url: `gltfs/glb/Liv-SpecOpsWolf.glb`,
                scale: 20,
                offset: [0, 0, 0],
                rotation: [0, 0, 0]
            },
            "FlamingoPool": {
                url: `gltfs/glb/FlamingoPool.glb`,
                scale: 0.5,
                offset: [0, 0, 0],
                rotation: [180, 0, 0]
            },
            "PotionBottle": {
                url: `gltfs/glb/PotionBottle.glb`,
                scale: 0.1,
                offset: [0, 0, 0],
                rotation: [0, 0, 0]
            },
            "wukong": {
                url: `gltfs/wukong/wukong.gltf`,
                scale: 10,
                offset: [0, 0, 0],
                rotation: [0, 0, 0]
            }
        };

        
        GUIHelp.add({ Model: `HIE-Hand-Armor` }, 'Model', Object.keys(list)).onChange(async (v) => {
            let { url, scale, offset, rotation } = list[v];
            this.loadGLB(url, offset, scale, rotation);
        });
        let { url, scale, offset, rotation } = list[`HIE-Hand-Armor`];
        this.loadGLB(url, offset, scale, rotation);
    }

    private async loadGLB(url: string, offset: number[], scale: number, rotation: number[]) {
        if (this.model) {
            this.scene.removeChild(this.model);
        }
        let model = this.model = (await Engine3D.res.loadGltf(url, { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        this.scene.addChild(model);
        model.x = offset[0];
        model.y = offset[1];
        model.z = offset[2];

        model.scaleX = scale;
        model.scaleY = scale;
        model.scaleZ = scale;

        model.rotationX = rotation[0];
        model.rotationY = rotation[1];
        model.rotationZ = rotation[2];
    }

    onLoadProgress(e) {
        console.log('[loading]', e);
    }

    onComplete(e) {
        console.log('[compelete]', e);
    }

}
