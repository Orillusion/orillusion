import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, View3D, PlaneGeometry, UnLitMaterial, Color, Vector3, ComponentBase, PointerEvent3D, Camera3D, BoundingBox, GeometryBase, VertexAttributeName, SphereGeometry, CylinderGeometry, MathUtil, Quaternion } from '@orillusion/core';

// simple base demo
class Sample_Transform {
    private onDraw: boolean = false
    private lineWidth: number = 0.1
    private scene: Scene3D
    private camera: Camera3D
    private drawInterval: number = 30
    private precision: number = 100
    private depth: number = 0.9
    private lineColor: Color = new Color(1, 1, 1)
    private lastTime: number
    private path: Object3D[] = []
    private hoverCameraController: HoverCameraController;
    private lastX: number = null
    private lastY: number = null

    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
        this.scene = scene;

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        mainCamera.lookAt(new Vector3(0, 0, 10), new Vector3(0, 0, 0), Vector3.UP);

        // add a basic camera controller
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.hoverCameraController.setCamera(0, 0, 10)

        this.camera = mainCamera

        // add basic plane
        let plane = new Object3D();
        let mr = plane.addComponent(MeshRenderer);
        mr.geometry = new PlaneGeometry(20, 20, 1, 1, Vector3.Z_AXIS);
        let mat = new UnLitMaterial()
        mat.baseColor = new Color(0.2, 0.2, 0.2)
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
        GUIHelp.init();
        GUIHelp.add(this, 'lineWidth', 0.1, 2, 0.1);
        GUIHelp.add(this, 'precision', 4, 360, 1);
        GUIHelp.add(this, 'drawInterval', 15, 100, 1);
        GUIHelp.add(this, 'depth', 0, 0.9, 0.05);
        GUIHelp.addColor(this, 'lineColor');
        GUIHelp.addButton('resetView', () => {
            this.hoverCameraController.setCamera(0, 0, 10)
        })
        GUIHelp.addButton('clearCanvas', () => {
            this.path.map((point) => {
                this.scene.removeChild(point)
            })
            this.path = []
        })
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
        const now = Date.now();
        if (now - this.lastTime > this.drawInterval) {
            this.drawLine(e.mouseX, e.mouseY);
            this.lastTime = now;
            this.lastX = e.mouseX
            this.lastY = e.mouseY
        }
    }
    
    onMouseUp(e: PointerEvent3D) {
        this.onDraw = false;
        this.lastX = null;
        this.lastY = null;
    }

    drawPoint(x: number, y: number) {
        let point = new Object3D();
        let mr = point.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(this.lineWidth / 2, this.precision, this.precision)
        const mat = new UnLitMaterial();
        mat.baseColor = this.lineColor;
        mr.material = mat;
        const pos = this.camera.screenPointToWorld(x, y, this.depth);
        point.x = pos.x;
        point.y = pos.y;
        point.z = pos.z;
        this.path.push(point);
        this.scene.addChild(point);
    }

    drawLine(x: number, y: number) {
        const start = this.camera.screenPointToWorld(this.lastX, this.lastY, this.depth);
        const end = this.camera.screenPointToWorld(x, y, this.depth);
        const distance = Math.sqrt((start.x - end.x) * (start.x - end.x) + (start.y - end.y) * (start.y - end.y) + (start.z - end.z) * (start.z - end.z))
        let line = new Object3D();
        let mr = line.addComponent(MeshRenderer);
        mr.geometry = new CylinderGeometry(this.lineWidth / 2, this.lineWidth / 2, distance, this.precision, this.precision)
        const mat = new UnLitMaterial();
        mat.baseColor = this.lineColor;
        mr.material = mat;
        line.x = start.x + (end.x - start.x) / 2;
        line.y = start.y + (end.y - start.y) / 2;
        line.z = start.z + (end.z - start.z) / 2;
        
        const vec = new Vector3(end.x - start.x, end.y - start.y, end.z - start.z);

        // when calculate rotation matrix, we need to normalize vectors first
        const rot = MathUtil.fromToRotation(new Vector3(0, 1, 0), vec.normalize())
        if (!Number.isNaN(rot.x) && !Number.isNaN(rot.y) && !Number.isNaN(rot.z)) {
            line.transform.localRotQuat = MathUtil.fromToRotation(new Vector3(0, 1, 0), vec.normalize());
        }
        this.path.push(line);
        this.scene.addChild(line);
    }
}

new Sample_Transform().run()