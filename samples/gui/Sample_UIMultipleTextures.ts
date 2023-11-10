import { Engine3D, Scene3D, Object3D, Camera3D, View3D, UIImage, HoverCameraController, AtmosphericComponent, BitmapTexture2D, makeAloneSprite, WorldPanel, GPUCullMode, UIPanel, Color } from '@orillusion/core'

class Sample_UIMultipleTextures {
    async run() {
        // initializa engine
        await Engine3D.init()
        // create new scene as root node
        let scene3D: Scene3D = new Scene3D()
        scene3D.addComponent(AtmosphericComponent)
        // create    camera
        let cameraObj: Object3D = new Object3D()
        let camera = cameraObj.addComponent(Camera3D)
        // adjust camera view
        camera.perspective(60, Engine3D.aspect, 1, 5000.0)
        // set camera controller
        let controller = cameraObj.addComponent(HoverCameraController)
        controller.setCamera(15, 10, 80)
        // add camera node
        scene3D.addChild(cameraObj)
        let view = new View3D()
        view.scene = scene3D
        view.camera = camera
        Engine3D.startRenderView(view)
        // create panel root
        let panelRoot: Object3D = new Object3D()
        let panel: UIPanel = panelRoot.addComponent(WorldPanel)
        panel.cullMode = GPUCullMode.none;
        panelRoot.localScale.set(0.1, 0.1, 0.1)
        let canvas = view.enableUICanvas()
        canvas.addChild(panelRoot)

        for (let i = 0; i < 10; i++) {
            let bitmapTexture2D = new BitmapTexture2D()
            bitmapTexture2D.flipY = true
            await bitmapTexture2D.load('textures/digit/digit_' + i + '.png')

            // create image node
            let imageQuad = new Object3D()
            panelRoot.addChild(imageQuad)
            // create image component
            let image: UIImage = imageQuad.addComponent(UIImage)
            // set image size
            image.uiTransform.resize(10, 10)
            image.uiTransform.setXY((i - 5) * 8, 0);
            image.color = Color.random();
            // set image source
            image.sprite = makeAloneSprite('webgpu' + i, bitmapTexture2D)
        }

    }
}

new Sample_UIMultipleTextures().run()
