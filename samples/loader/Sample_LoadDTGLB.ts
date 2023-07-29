import { Engine3D, GTAOPost, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, PostProcessingComponent, Scene3D } from "@orillusion/core";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { CreatorPlugin, EditorPluginManager, PropertyEditorPlugin, SceneEditorPlugin } from "@orillusion/editor";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { IEditorPlugin } from "@orillusion/editor/IEditorPlugin";

// Sample to load glb file
export class Sample_LoadDTGLB {
    scene: Scene3D;

    async run() {
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;

        GUIHelp.init();

        await Engine3D.init();
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.0001;
        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;
        Engine3D.startRenderView(exampleScene.view);

        GUIUtil.renderDirLight(exampleScene.light);
        await this.initScene();
    }

    async initScene() {
        {
            let post = this.scene.addComponent(PostProcessingComponent);
            post.addPost(GTAOPost);
        }
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
        let model = (await Engine3D.res.loadGltf('morph/nanhai_quanshen.glb', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        this.scene.addChild(model);
        model.scaleX = model.scaleY = model.scaleZ = 50;
        EditorPluginManager.instance.setUp<IEditorPlugin>([SceneEditorPlugin, PropertyEditorPlugin, CreatorPlugin]);

        let sceneEditorPlugin = EditorPluginManager.instance.getPlugin(SceneEditorPlugin);
        let creatorPlugin = EditorPluginManager.instance.getPlugin(CreatorPlugin);
        sceneEditorPlugin.setData(this.scene);
        creatorPlugin.setData(this.scene);

        EditorPluginManager.instance.start()
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

}
