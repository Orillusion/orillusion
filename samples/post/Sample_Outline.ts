import { DirectLight, Engine3D, View3D, LitMaterial, HoverCameraController, KelvinUtil, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry, PostProcessingComponent, CameraUtil, webGPUContext, OutlinePost, outlinePostManager, AtmosphericComponent, Color, FXAAPost } from '@orillusion/core'
import * as dat from '@orillusion/debug/dat.gui.module'

class Sample_Outline {
    lightObj: Object3D
    scene: Scene3D

    constructor() { }

    async run() {
        Engine3D.setting.shadow.enable = false
        await Engine3D.init({
            canvasConfig: {
                devicePixelRatio: 1
            }
        })

        this.scene = new Scene3D()
        this.scene.addComponent(AtmosphericComponent).sunY = 0.6

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera')
        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0)
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController)
        ctrl.setCamera(180, -45, 15)

        await this.initScene(this.scene)

        let view = new View3D()
        view.scene = this.scene
        view.camera = mainCamera
        Engine3D.startRenderView(view)

        let postProcessing = this.scene.addComponent(PostProcessingComponent)
        // let outlinePost = postProcessing.addPost(FXAAPost)
        let outlinePost = postProcessing.addPost(OutlinePost)

        const GUIHelp = new dat.GUI()
        GUIHelp.addFolder('Outline')
        GUIHelp.add(outlinePost, 'outlinePixel', 0, 5)
        GUIHelp.add(outlinePost, 'fadeOutlinePixel', 0, 5)
        GUIHelp.add(
            {
                Change: () => {
                    this.selectBall()
                }
            },
            'Change'
        )
        this.selectBall()
    }

    private selectBall(): void {
        outlinePostManager.setOutlineList([[this.nextSphere()], [this.nextSphere()], [this.nextSphere()]], [new Color(1, 0.2, 0, 1), new Color(0.2, 1, 0), new Color(0.2, 0, 1)])
    }

    async initScene(scene: Scene3D) {
        /******** light *******/
        {
            this.lightObj = new Object3D()
            this.lightObj.x = 0
            this.lightObj.y = 30
            this.lightObj.z = -40
            this.lightObj.rotationX = 45
            this.lightObj.rotationY = 0
            this.lightObj.rotationZ = 45
            let lc = this.lightObj.addComponent(DirectLight)
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355)
            lc.intensity = 10
            scene.addChild(this.lightObj)
        }
        this.createPlane(scene)

        return true
    }

    private sphereList: Object3D[] = []
    private sphereIndex = 0

    private nextSphere(): Object3D {
        this.sphereIndex++
        if (this.sphereIndex >= this.sphereList.length) {
            this.sphereIndex = 1
        }

        return this.sphereList[this.sphereIndex]
    }

    private createPlane(scene: Scene3D) {
        let mat = new LitMaterial()
        mat.roughness = 0.5;
        mat.metallic = 0.5;
        {
            let debugGeo = new PlaneGeometry(1000, 1000)
            let obj: Object3D = new Object3D()
            let mr = obj.addComponent(MeshRenderer)
            mr.material = mat
            mr.geometry = debugGeo
            scene.addChild(obj)
        }

        let sphereGeometry = new SphereGeometry(1, 50, 50)
        for (let i = 0; i < 10; i++) {
            let obj: Object3D = new Object3D()
            let mr = obj.addComponent(MeshRenderer)
            mr.material = mat
            mr.geometry = sphereGeometry
            obj.x = 2
            obj.y = 2

            let angle = (2 * Math.PI * i) / 10
            obj.x = Math.sin(angle) * 2
            obj.z = Math.cos(angle) * 2
            scene.addChild(obj)
            this.sphereList.push(obj)
        }
    }
}

new Sample_Outline().run()
