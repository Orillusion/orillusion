import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { CameraUtil, Engine3D, HoverCameraController, Object3D, Scene3D, webGPUContext, AtmosphericComponent, View3D } from '@orillusion/core';
import { FlowImgSimulator } from "./flowImg/FlowImgSimulator";

export class Demo_FlowImg {
    constructor() { }

    async run() {
        await Engine3D.init({});
        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        await this.initScene(scene);

        let camera = CameraUtil.createCamera3DObject(scene);
        
        camera.perspective(60, webGPUContext.aspect, 0.01, 10000.0);
        let ctl = camera.object3D.addComponent(HoverCameraController);
        ctl.distance = 3;

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        GUIHelp.init();

        var obj = new Object3D();
        let image = await this.imageloader('png/logo.png');
        let simulator = obj.addComponent(FlowImgSimulator);
        simulator.setImageData(image);
        scene.addChild(obj);

        let input = document.createElement('input')
        input.type = 'file'
        input.accept = '.png,.webp'
        input.style.position = 'fixed'
        document.body.appendChild(input)
        input.onchange= async (e)=>{
            let url = URL.createObjectURL(e.target.files[0])
            let image = await this.imageloader(url)
            simulator.setImageData(image);
            simulator.reset()
        }
        GUIHelp.addButton('Change Image (PNG with transparent)', ()=>{
            input.click()
        })
        GUIHelp.endFolder();
        setTimeout(()=>{
            for(let f in GUIHelp.folders){
                if(f == 'FlowImgSimulator'){
                    GUIHelp.folders[f].open()
                }    
                else
                    GUIHelp.gui.removeFolder(GUIHelp.folders[f])
            }
        })
    }

    async initComputeBuffer() { }

    async imageloader(url: string) {
        const res = await fetch(url)
        const img = await res.blob()
        const bitmap = await createImageBitmap(img)
        const r = 1 //bitmap.width / bitmap.height

        const canvas = document.createElement('canvas');
        canvas.hidden = true;
        document.body.appendChild(canvas);

        // const canvas = document.querySelector('#canvas') as HTMLCanvasElement
        const width = canvas.width = 512
        const height = canvas.height = canvas.width / r
        const context = canvas.getContext('2d')
        if (!context)
            throw new Error('no canvas')
        context.drawImage(bitmap, 0, 0, width, height)
        const pixelData = context.getImageData(0, 0, width, height)
        // console.log(pixelData)
        const positions = [], colors = []
        for (let i = 0; i < pixelData.data.length; i += 4) {
            const alpha = pixelData.data[i + 3]
            if (alpha > 0) {
                const r = pixelData.data[i + 0]
                const g = pixelData.data[i + 1]
                const b = pixelData.data[i + 2]
                colors.push(r, g, b, 1)
                const y = Math.floor(i / width / 4)
                const x = (Math.floor(i / 4) - y * width)
                positions.push(x / width, y / width, 0, 1)
            }
        }
        return { positions, colors }
    }
}
