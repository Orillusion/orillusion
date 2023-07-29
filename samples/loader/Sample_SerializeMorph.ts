import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createSceneParam, createExampleScene } from "@samples/utils/ExampleScene";
import { Scene3D, Engine3D, SkyRenderer, Object3D, MorphTargetBlender, Vector3 } from "../../src";


export class Sample_SerializeMorph {
  scene: Scene3D;

  constructor() { }

  async run() {
    await Engine3D.init({});

    Engine3D.setting.shadow.shadowBound = 50;
    Engine3D.setting.shadow.shadowBias = 0.0001;

    GUIHelp.init();
    let param = createSceneParam();
    param.camera.distance = 60;
    param.camera.roll = 0;
    param.camera.pitch = 0;
    param.scene.atmosphericSky = null;
    param.light.intensity = 20;
    let exampleScene = createExampleScene(param);
    this.scene = exampleScene.scene;
    let sky = this.scene.getOrAddComponent(SkyRenderer);
    sky.map = await Engine3D.res.loadLDRTextureCube("sky/sky.jpg");
    this.scene.envMap = sky.map;

    Engine3D.startRenderView(exampleScene.view);

    await this.initMorphModel();
    // this.scene.addComponent(EditorDigitalHead);
  }

  private influenceData: { [key: string]: number } = {};

  private player: Object3D;
  private face: Object3D;
  private playerScale: number = 100;
  blender: MorphTargetBlender;

  private async initMorphModel() {
    this.player = await Engine3D.res.loadGltf("nanhai/nanhai.glb");
    this.player.localScale = new Vector3(
      this.playerScale,
      this.playerScale,
      this.playerScale
    );
    this.face = this.player.entityChildren[0] as Object3D;

    this.scene.addChild(this.player);
    this.player.y = -50;
    GUIHelp.add(this.face, "y", -2, 1, 0.01);

    this.blender = this.player.addComponent(MorphTargetBlender);
    let targetRenderers = this.blender.cloneMorphRenderers();
    GUIHelp.addFolder("morph controller");
    for (let key in targetRenderers) {
      this.influenceData[key] = 0.0;
      GUIHelp.add(this.influenceData, key, 0, 1, 0.01).onChange((v) => {
        this.influenceData[key] = v;
        let list = this.blender.getMorphRenderersByKey(key);
        for (let renderer of list) {
          renderer.setMorphInfluence(key, v);
        }
      });
    }

    GUIHelp.endFolder();
  }
}

