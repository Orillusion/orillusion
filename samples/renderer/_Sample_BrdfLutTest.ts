import { Object3D, Scene3D, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, HoverCameraController, View3D, LitMaterial, BlendMode, MeshRenderer, BoxGeometry, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_BrdfLutTest {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    // probeSampler: ProbesAtlasTextureSampler;

    constructor() { }

    async run() {
        //
        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let cameraObj = new Object3D();
        let mainCamera = cameraObj.addComponent(Camera3D);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 1000.0);

        let hoverCameraController = cameraObj.addComponent(HoverCameraController);
        this.scene.addChild(cameraObj);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        // renderJob.addPost(new SSAOPost());

        // 

        Engine3D.startRenderView(view);
    }

    private lightBall: Object3D;

    /**
     * @ch asdasda
     * @en asdasdas
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        {
            let texture = Engine3D.res.getTexture(`BRDFLUT`);
            let floorMat = new LitMaterial();
            floorMat.baseMap = Engine3D.res.grayTexture;
            floorMat.normalMap = Engine3D.res.normalTexture;
            floorMat.aoMap = Engine3D.res.whiteTexture;
            floorMat.maskMap = Engine3D.res.whiteTexture;
            floorMat.emissiveMap = Engine3D.res.blackTexture;
            floorMat.blendMode = BlendMode.NONE;
            floorMat.roughness = 0.85;
            floorMat.metallic = 0.01;
            floorMat.envIntensity = 0.01;
            floorMat.debug();

            let brdflutObj = new Object3D();
            let mr = brdflutObj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(100, 100, 100);
            mr.material = floorMat;
            this.scene.addChild(brdflutObj);
        }

        // {
        //   let binLoader = new FileLoader(); //OVERVIEW_BIGCITY car_test DragonAttenuation
        //   // let parser = await binLoader.load('gltfs/City-Maker/City-Maker.gltf', GLTFParser);
        //   // let parser = await binLoader.load('PBR/ClearCoatTest/ClearCoatTest.gltf', GLTFParser);
        //   // let parser = await binLoader.load('gltfs/car_test/car_test.gltf', GLTFParser);
        //   let parser = await binLoader.load('gltfs/Demonstration/Demonstration.gltf', GLTFParser);
        //   // let parser = await binLoader.load('PBR/DragonAttenuation/DragonAttenuation.gltf', GLTFParser);
        //   let data = parser.data as Object3D;
        //   data.scaleX = 1;
        //   data.scaleY = 1;
        //   data.scaleZ = 1;
        //   data.z = 22;
        //   data.x = 12;
        //   data.y = 8;
        //   scene.addChild(data);
        // }

        /******** load hdr sky *******/
        //T_Panorama05_HDRI.HDR
        // let envMap = await Engine3D.res.loadHDRTextureCube('hdri/1428_v5_low.hdr');
        let envMap = await Engine3D.res.loadHDRTextureCube('hdri/T_Panorama05_HDRI.HDR');
        scene.envMap = envMap;
        /******** load hdr sky *******/

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 46;
            this.lightObj.rotationY = 62;
            this.lightObj.rotationZ = 160;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 1.7;
            scene.addChild(this.lightObj);
        }
        {
            // let axis = new AxisObject();
            // this.scene.addChild(axis);
        }
        return true;
    }


    loop() { }
}
