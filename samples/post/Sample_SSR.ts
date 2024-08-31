import { DirectLight, Engine3D, View3D, LitMaterial, HoverCameraController, KelvinUtil, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry, SSRPost, Time, CameraUtil, webGPUContext, PostProcessingComponent, BloomPost, AtmosphericComponent } from '@orillusion/core'
import { GUIHelp } from '@orillusion/debug/GUIHelp'
import { GUIUtil } from '@samples/utils/GUIUtil';

export class Sample_SSR {
    lightObj: Object3D
    scene: Scene3D

    async run() {
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.shadowSize = 2048
        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.05;
        GUIHelp.init();

        await Engine3D.init({
            canvasConfig: {
                devicePixelRatio: 1
            },
            renderLoop: () => this.loop()
        })

        this.scene = new Scene3D()
        this.scene.addComponent(AtmosphericComponent).sunY = 0.6

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera')
        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0)
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController)
        ctrl.setCamera(-75, -20, 40)
        await this.initScene(this.scene)

        let view = new View3D()
        view.scene = this.scene
        view.camera = mainCamera
        Engine3D.startRenderView(view)

        let postProcessing = this.scene.addComponent(PostProcessingComponent)
        postProcessing.addPost(SSRPost)
        postProcessing.addPost(BloomPost)
    }

    async initScene(scene: Scene3D) {
        /******** light *******/
        {
            this.lightObj = new Object3D()
            this.lightObj.rotationX = 15
            this.lightObj.rotationY = 110
            this.lightObj.rotationZ = 0
            let lc = this.lightObj.addComponent(DirectLight)
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355)
            lc.castShadow = true
            lc.intensity = 10
            scene.addChild(this.lightObj)
            GUIUtil.renderDirLight(lc);
        }

        // load test model
        let minimalObj = await Engine3D.res.loadGltf('/PBR/ToyCar/ToyCar.gltf')
        minimalObj.scaleX = minimalObj.scaleY = minimalObj.scaleZ = 1000;
        minimalObj.y = -1.1;
        scene.addChild(minimalObj)

        minimalObj.forChild((obj: Object3D) => {
            let mr = obj.getComponent(MeshRenderer)
            if (mr && mr.material) {
                if (mr.material.name == 'ToyCar') {
                    let mat = mr.material as LitMaterial;
                    mat.metallic = 0.9;
                    mat.roughness = 0.1;
                    mat.clearcoatFactor = 0.5;
                }
            }
        }
        );
        await this.createPlane(scene)
        return true
    }
    private sphere: Object3D

    private async createPlane(scene: Scene3D) {
        {
            let floorMaterial = new LitMaterial()
            floorMaterial.roughness = 0.1
            floorMaterial.metallic = 1.0

            let planeGeometry = new PlaneGeometry(200, 200)
            let floor: Object3D = new Object3D()
            let mr = floor.addComponent(MeshRenderer)
            mr.material = floorMaterial
            mr.geometry = planeGeometry
            scene.addChild(floor)

            GUIHelp.addFolder('floor')
            GUIHelp.add(floorMaterial, 'roughness', 0.01, 1, 0.01)
            GUIHelp.add(floorMaterial, 'metallic', 0, 1, 0.01)
            GUIHelp.endFolder()
        }

        {
            let mat = new LitMaterial()
            mat.roughness = 0.1
            mat.metallic = 0.9
            let sphereGeometry = new SphereGeometry(10, 50, 50)
            let obj: Object3D = new Object3D()
            let mr = obj.addComponent(MeshRenderer)
            mr.material = mat
            mr.geometry = sphereGeometry
            obj.x = 30
            obj.y = 10
            scene.addChild(obj)
            this.sphere = obj

            GUIHelp.addFolder('sphere')
            GUIHelp.add(mat, 'roughness', 0.01, 1, 0.01)
            GUIHelp.add(mat, 'metallic', 0, 1, 0.01)
            GUIHelp.endFolder()
        }

        {
            let sphereGeometry = new SphereGeometry(2, 50, 50)
            for (let i = 0; i < 10; i += 2) {
                for (let j = 0; j < 10; j += 2) {
                    let rmMaterial = new LitMaterial()
                    rmMaterial.roughness = j / 10
                    rmMaterial.metallic = i / 10

                    let obj: Object3D = new Object3D()
                    let mr = obj.addComponent(MeshRenderer)
                    mr.material = rmMaterial
                    mr.geometry = sphereGeometry

                    obj.y = j * 5 + 10
                    obj.x = 50
                    obj.z = i * 5 - 25
                    scene.addChild(obj)
                }
            }
        }
    }

    private loop(): void {
        if (this.sphere) {
            this.sphere.x = Math.sin(Time.time * 0.0001) * 30
            this.sphere.z = Math.cos(Time.time * 0.0001) * 30
        }
    }
}

