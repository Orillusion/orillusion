import { DepthOfFieldPost, DirectLight, Engine3D, PostProcessingComponent, View3D, LitMaterial, HoverCameraController, KelvinUtil, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry, SSR_IS_Kernel, CameraUtil, webGPUContext, AtmosphericComponent } from '@orillusion/core'
import * as dat from '@orillusion/debug/dat.gui.module'

class Sample_DepthOfView {
    lightObj: Object3D
    scene: Scene3D
    constructor() { }

    async run() {
        Engine3D.setting.shadow.enable = true
        Engine3D.setting.shadow.shadowBound = 100
        await Engine3D.init({
            canvasConfig: {
                devicePixelRatio: 1
            }
        })

        this.scene = new Scene3D()
        this.scene.addComponent(AtmosphericComponent).sunY = 0.6

        let camera = CameraUtil.createCamera3DObject(this.scene)
        camera.perspective(60, webGPUContext.aspect, 1, 5000.0)
        let ctrl = camera.object3D.addComponent(HoverCameraController)
        ctrl.setCamera(100, -15, 150)

        await this.initScene(this.scene)

        let view = new View3D()
        view.scene = this.scene
        view.camera = camera
        Engine3D.startRenderView(view)

        let postProcessing = this.scene.addComponent(PostProcessingComponent)
        let DOFPost = postProcessing.addPost(DepthOfFieldPost)
        DOFPost.near = 0
        DOFPost.far = 150
        DOFPost.pixelOffset = 2

        let GUIHelp = new dat.GUI()
        GUIHelp.addFolder('Depth of Field')
        GUIHelp.add(DOFPost, 'near', 0, 100, 1)
        GUIHelp.add(DOFPost, 'far', 150, 300, 1)

        console.log("run");

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
        }

        // load a test gltf model
        let minimalObj = await Engine3D.res.loadGltf('/PBR/ToyCar/ToyCar.gltf')
        minimalObj.scaleX = minimalObj.scaleY = minimalObj.scaleZ = 800
        scene.addChild(minimalObj)

        this.createPlane(scene)
        return true
    }

    private createPlane(scene: Scene3D) {
        let mat = new LitMaterial()
        {
            let debugGeo = new PlaneGeometry(2000, 2000)
            let obj: Object3D = new Object3D()
            let mr = obj.addComponent(MeshRenderer)
            mr.material = mat
            mr.geometry = debugGeo
            scene.addChild(obj)
        }

        {
            let sphereGeometry = new SphereGeometry(10, 50, 50)
            let obj: Object3D = new Object3D()
            let mr = obj.addComponent(MeshRenderer)
            mr.material = mat
            mr.geometry = sphereGeometry
            obj.x = 30
            obj.y = 10
            scene.addChild(obj)
        }

        {
            let seeds = SSR_IS_Kernel.createSeeds()
            let sphereGeometry = new SphereGeometry(2, 50, 50)
            for (let i = 0; i < seeds.length; i++) {
                let pt = seeds[i]
                let obj: Object3D = new Object3D()
                let mr = obj.addComponent(MeshRenderer)
                mr.material = mat
                mr.geometry = sphereGeometry

                obj.y = pt.z
                obj.x = pt.x
                obj.z = pt.y
                scene.addChild(obj)
            }
        }
    }
}

new Sample_DepthOfView().run()
