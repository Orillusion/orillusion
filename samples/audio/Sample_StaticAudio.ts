import { BoxGeometry, Camera3D, DirectLight, Engine3D, LitMaterial, KelvinUtil, MeshRenderer, Object3D, Scene3D, Vector3, Color, OrbitController, View3D, AtmosphericComponent } from '@orillusion/core';
import { StaticAudio, AudioListener } from '@orillusion/media-extention'
import { GUIHelp } from '@orillusion/debug/GUIHelp';

export class Static_Audio {
    lightObj: Object3D;
    scene: Scene3D;
    camera: Object3D
    mats: any[];
    audio: StaticAudio
    constructor() {}

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.type = 'HARD';
        Engine3D.setting.shadow.shadowBound = 100;

        await Engine3D.init();
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        
        this.camera = new Object3D()
        this.camera.localPosition = new Vector3(0, 20, 50)
        let mainCamera = this.camera.addComponent(Camera3D)
        this.scene.addChild(this.camera)

        mainCamera.perspective(60, Engine3D.aspect, 0.1, 20000.0);
        let orbit = this.camera.addComponent(OrbitController)
        orbit.target = new Vector3(0, 4, 0)
        orbit.minDistance = 10
        orbit.maxDistance = 200

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
        await this.initScene();
    }

    async initScene() {
        {
            let group = new Object3D()
            let speaker = await Engine3D.res.loadGltf('gltfs/speaker/scene.gltf')
            speaker.localScale.set(4,4,4)
            speaker.rotationX = -120
            //speaker.y = 1.5
            group.addChild(speaker)
            group.y = 2
            this.scene.addChild(group)

            let listener = this.camera.addComponent(AudioListener)
            let audio = group.addComponent(StaticAudio)
            audio.setLisenter(listener)

            await audio.load('https://cdn.orillusion.com/audio.ogg')
            GUIHelp.init();
            GUIHelp.addButton('play', ()=>{
                audio.play()
            })
            GUIHelp.addButton('pause', ()=>{
                audio.pause()
            })
            GUIHelp.addButton('stop', ()=>{
                audio.stop()
            })
            GUIHelp.add({volume:1}, 'volume', 0, 1, 0.01).onChange( (v:number) =>{
                audio.setVolume(v)
            })
            GUIHelp.open()
        }
        {
            let wall = new Object3D()
            let mr = wall.addComponent(MeshRenderer)
            mr.geometry = new BoxGeometry(40, 30, 1)
            let mat = new LitMaterial()
            mat.baseColor = new Color(1,0,0)
            mr.material = mat
            this.scene.addChild(wall)
            wall.z = -5
        }
        {
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3000, 1, 3000);
            let mat = new LitMaterial();
            mr.material = mat;
            this.scene.addChild(floor);
        }

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 35;
            this.lightObj.rotationY = 110;
            this.lightObj.rotationZ = 0;
            let directLight = this.lightObj.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 30;
            this.scene.addChild(this.lightObj);
        }
    }
}