import { BoxGeometry, Camera3D, DirectLight, Engine3D, LitMaterial, KelvinUtil, MeshRenderer, Object3D, Scene3D, Vector3, Color, OrbitController, View3D, AtmosphericComponent } from '@orillusion/core';
import { PositionAudio, AudioListener } from  '@orillusion/media-extention'
import { GUIHelp } from '@orillusion/debug/GUIHelp';

export class Static_Audio {
    lightObj: Object3D;
    scene: Scene3D;
    camera: Object3D
    mats: any[];
    audio: PositionAudio
    private a = 40
    private b = 80
    private angle = 0
    constructor() {}

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.type = 'HARD';
        Engine3D.setting.shadow.shadowBound = 100;

        await Engine3D.init({
            renderLoop: this.loop.bind(this)
        });
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
            let [speaker, man, music] = await Promise.all([
                Engine3D.res.loadGltf('gltfs/speaker/scene.gltf'),
                Engine3D.res.loadGltf('gltfs/glb/CesiumMan.glb'),
                fetch('https://cdn.orillusion.com/audio.ogg').then(res=>res.arrayBuffer())
            ])
            speaker.localScale.set(4,4,4)
            speaker.rotationX = -120
            speaker.y = 0.5
            let group = new Object3D()
            group.addChild(speaker)
            group.y = 2
            this.scene.addChild(group)

            man.name = 'man'
            man.scaleX = 10;
            man.scaleY = 10;
            man.scaleZ = 10;
            man.rotationX = -90;
            man.rotationY = -90
            man.localPosition.set(0, 0.5, 30)
            this.scene.addChild(man)

            let listener = man.addComponent(AudioListener)
            let audio = group.addComponent(PositionAudio)
            audio.setLisenter(listener)
            await audio.loadBuffer(music)
            audio.refDistance = 10;
            audio.maxDistance = 100;
			audio.setDirectionalCone( 180, 230, 0.1 );
            audio.showHelper()

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
            GUIHelp.addButton('Toggle Helper', ()=>{
                audio.toggleHelper()
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
    loop(){
        let man = this.scene.getChildByName('man') as Object3D
        if(man){
            this.angle += 0.005
            man.x = this.a * Math.cos(this.angle)
            man.z = this.b * Math.sin(this.angle) + 30
            man.rotationY -= 0.005 * 180 / Math.PI
        }
    }
}