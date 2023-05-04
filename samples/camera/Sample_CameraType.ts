import { Object3D, Camera3D, Scene3D, Engine3D, webGPUContext, HoverCameraController, View3D, AtmosphericComponent, Vector3, MeshRenderer, BoxGeometry, LitMaterial } from "@orillusion/core";

export class Sample_CameraType {

    cameraObj: Object3D;
    camera: Camera3D;
    scene: Scene3D;

    constructor() { }

    async run() {
        console.log('start demo');
        await Engine3D.init({});
        await this.initScene();
        await this.initCamera();
        await this.createBoxes();

        let cameraObj = new Object3D();
        let mainCamera = cameraObj.addComponent(Camera3D);
        this.scene.addChild(cameraObj);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, 0, 10);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);

        this.addGui();
    }

    async initScene() {
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
    }

    async initCamera() {
        this.cameraObj = new Object3D();
        this.camera = this.cameraObj.addComponent(Camera3D)
        this.camera.lookAt(new Vector3(0, 0, -350), new Vector3(0, 0, 0));
        this.camera.object3D.addComponent(HoverCameraController);
        this.scene.addChild(this.cameraObj);
        this.perspective();
    }

    async orthoOffCenter() {
        // this.camera.ortho(window.innerWidth, window.innerWidth, 1.0, 10000.0);
        this.camera.orthoOffCenter(-window.innerWidth / 4, window.innerWidth / 4, -window.innerHeight / 4, window.innerHeight / 4, 1, 10000.0);
    }

    async perspective() {
        this.camera.perspective(60, window.innerWidth / window.innerHeight, 1, 10000.0);
    }

    async createBox(name: string) {
        let obj: Object3D = new Object3D();
        obj.name = name;
        // add MeshRenderer
        let mr: MeshRenderer = obj.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(50, 50, 50);
        mr.material = new LitMaterial();
        return obj;
    }

    async createBoxes() {
        for (let i = -1; i < 2; ++i) {
            let obj = await this.createBox("cube_" + i);

            obj.x = 0;
            obj.y = i * -60;
            obj.z = i * -60;

            this.scene.addChild(obj);
        }
    }

    async addGui() {
        let select = document.createElement('select')
        select.innerHTML = `
        <option value="perspective">Perspective</option>
        <option value="ortho">Orthographic</option>
        `
        select.setAttribute('style', 'position:fixed;right:5px;top:5px')
        document.body.appendChild(select)

        select.addEventListener('change', () => {
            if (select.value === 'perspective')
                this.perspective()
            else
                this.orthoOffCenter()
        })
    }
}
