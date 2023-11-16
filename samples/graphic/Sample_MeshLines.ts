import { Engine3D, Scene3D, CameraUtil, HoverCameraController, Object3D, MeshRenderer, View3D, PlaneGeometry, UnLitMaterial, Color, Vector3, PointerEvent3D, Camera3D, SphereGeometry, CylinderGeometry, MathUtil, BlendMode, GPUCullMode } from '@orillusion/core';
import * as dat from "@orillusion/debug/dat.gui.module";
import { Stats } from '@orillusion/stats';

class Sample_MeshLines {
    private onDraw: boolean = false
    private scene: Scene3D
    private camera: Camera3D
    private lastTime: number
    private path: Object3D[] = []
    private hoverCameraController: HoverCameraController;
    private lastX: number = -1
    private lastY: number = -1
    private pointGeometry: SphereGeometry
    private lineGeometry: CylinderGeometry
    private material: UnLitMaterial

    public lineWidth: number = 0.1
    public drawInterval: number = 30
    public precision: number = 32
    public depth: number = 0
    public lineColor: Color = new Color(1, 0, 0)

    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
        scene.addComponent(Stats)
        this.scene = scene;

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);

        // add a basic camera controller
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.hoverCameraController.setCamera(0, 0, 20)

        this.camera = mainCamera

        this.pointGeometry = new SphereGeometry(0.5, 32, 32)
        this.lineGeometry = new CylinderGeometry(0.5, 0.5, 1, 32, 32)
        this.material = new UnLitMaterial()
        this.material.baseColor = this.lineColor

        // add basic plane
        let plane = new Object3D();
        let mr = plane.addComponent(MeshRenderer);
        mr.geometry = new PlaneGeometry(20, 20, 1, 1, Vector3.Z_AXIS);
        let mat = new UnLitMaterial()
        mat.baseColor = new Color(1, 1, 1, 0.4)
        mat.transparent = true
        mat.cullMode = GPUCullMode.none
        mat.blendMode = BlendMode.NORMAL
        mr.material = mat;
        scene.addChild(plane);

        // create a view with target scene and camera
        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        // start render
        Engine3D.startRenderView(view);

        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onMouseDown, this, null, 999);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onMouseMove, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);

        // debug GUI
        let gui = new dat.GUI();
        let f = gui.addFolder('Orillusion');
        f.add(this, 'lineWidth', 0.1, 2, 0.1);
        f.add(this, 'precision', 4, 64, 1).onChange((precision) => {
            this.lineGeometry = new CylinderGeometry(0.5, 0.5, 1, precision, precision)
            this.pointGeometry = new SphereGeometry(0.5, precision, precision)
        });
        f.add(this, 'depth', -1, 1, 0.01);
        f.add(this, 'drawInterval', 15, 100, 1);
        f.addColor({lineColor: Object.values(this.lineColor).map((v,i)=> i === 3 ? v : v*255)}, 'lineColor').onChange(v=>{
            this.lineColor = new Color(v[0]/255, v[1]/255, v[2]/255, v[3])
            this.material = new UnLitMaterial()
            this.material.baseColor = this.lineColor
        });
        f.add({'resetView': () => this.hoverCameraController.setCamera(0, 0, 20)}, 'resetView')
        f.add({'clearCanvas': () => {
            this.path.map((point) => {
                this.scene.removeChild(point)
            })
            this.path.length = 0
        }}, 'clearCanvas')
        f.open()

        // add tips
        gui.add({tips: 'Press to rotate camera'}, 'tips').name('Left Mouse')
        gui.add({tips: 'Press to draw lines'}, 'tips').name('Right Mouse')
    }

    onMouseDown(e: PointerEvent3D) {
        if(e.mouseCode === 2) {
            e.stopImmediatePropagation()
            this.lastTime = Date.now()
            this.onDraw = true;
            this.drawPoint(e.mouseX, e.mouseY);
            this.lastX = e.mouseX;
            this.lastY = e.mouseY;
        }
    }

    onMouseMove(e: PointerEvent3D) {
        if (!this.onDraw) return;
        e.stopImmediatePropagation()
        const now = Date.now();
        if (now - this.lastTime > this.drawInterval) {
            this.drawLine(e.mouseX, e.mouseY);
            this.drawPoint(e.mouseX, e.mouseY);
            this.lastTime = now;
            this.lastX = e.mouseX
            this.lastY = e.mouseY
        }
    }

    onMouseUp(e: PointerEvent3D) {
        this.onDraw = false;
        this.lastX = -1;
        this.lastY = -1;
    }

    drawPoint(x: number, y: number) {
        let point = new Object3D();
        let mr = point.addComponent(MeshRenderer);
        mr.geometry = this.pointGeometry;
        mr.material = this.material;
        point.scaleX = point.scaleY = point.scaleZ = this.lineWidth
        this.camera.worldToScreenPoint(this.hoverCameraController.target, Vector3.HELP_0)
        const pos = this.camera.screenPointToWorld(x, y, Vector3.HELP_0.z + this.depth / 100);
        point.x = pos.x;
        point.y = pos.y;
        point.z = pos.z;
        this.path.push(point);
        this.scene.addChild(point);
    }

    drawLine(x: number, y: number) {
        this.camera.worldToScreenPoint(this.hoverCameraController.target, Vector3.HELP_0)
        const start = this.camera.screenPointToWorld(this.lastX, this.lastY, Vector3.HELP_0.z + this.depth / 100);
        const end = this.camera.screenPointToWorld(x, y, Vector3.HELP_0.z);
        const distance = Math.sqrt(end.distanceToSquared(start))
        let line = new Object3D();
        let mr = line.addComponent(MeshRenderer);
        mr.geometry = this.lineGeometry;
        mr.material = this.material;
        line.scaleX = line.scaleZ = this.lineWidth;
        line.scaleY = distance;
        line.x = start.x + (end.x - start.x) / 2;
        line.y = start.y + (end.y - start.y) / 2;
        line.z = start.z + (end.z - start.z) / 2;

        // normalize the direction vector
        const dir = Vector3.HELP_1.set(end.x - start.x, end.y - start.y, end.z - start.z).normalize()
        const rot = MathUtil.fromToRotation(Vector3.Y_AXIS, dir)
        // make sure the rotation is valid
        if (!Number.isNaN(rot.x) && !Number.isNaN(rot.y) && !Number.isNaN(rot.z)) {
            line.transform.localRotQuat = rot;
        }
        this.path.push(line);
        this.scene.addChild(line);
    }
}

new Sample_MeshLines().run()
