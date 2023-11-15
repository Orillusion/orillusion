import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, View3D, PlaneGeometry, UnLitMaterial, Color, Vector3, ComponentBase, PointerEvent3D, Camera3D, BoundingBox, GeometryBase, VertexAttributeName, SphereGeometry, CylinderGeometry, MathUtil, Quaternion, BlendMode, GPUCullMode } from '@orillusion/core';

class Sample_MeshLines {
    private onDraw: boolean = false
    private lineWidth: number = 0.1
    private scene: Scene3D
    private camera: Camera3D
    private drawInterval: number = 30
    private precision: number = 32
    private depth: number = 0
    private lineColor: Color = new Color(1, 0, 0)
    private lastTime: number
    private path: Object3D[] = []
    private hoverCameraController: HoverCameraController;
    private lastX: number = null
    private lastY: number = null

    async run() {
        // add tips on bottom of screen
        let tips = document.createElement('p')
        tips.innerHTML = 'Press left mouse to rotate camera<br>Press right mouse to draw lines'
        tips.setAttribute('style', 'position:fixed;bottom:10px;left:0;right:0;text-align:center;color:white;font-size:20px;z-index:11;pointer-events:none')
        document.body.appendChild(tips)
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
        this.scene = scene;

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);

        // add a basic camera controller
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.hoverCameraController.setCamera(0, 0, 20)

        this.camera = mainCamera

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
        GUIHelp.init();
        GUIHelp.add(this, 'lineWidth', 0.1, 2, 0.1);
        GUIHelp.add(this, 'precision', 4, 64, 1);
        GUIHelp.add(this, 'depth', -1, 1, 0.01);
        GUIHelp.add(this, 'drawInterval', 15, 100, 1);
        GUIHelp.addColor(this, 'lineColor');
        GUIHelp.addButton('resetView', () => {
            this.hoverCameraController.setCamera(0, 0, 20)
        })
        GUIHelp.addButton('clearCanvas', () => {
            this.path.map((point) => this.scene.removeChild(point))
            this.path.length = 0
        })
        GUIHelp.open()
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
        const rot = MathUtil.fromToRotation(Vector3.Y_AXIS, vec.normalize())
        if (!Number.isNaN(rot.x) && !Number.isNaN(rot.y) && !Number.isNaN(rot.z)) {
            line.transform.localRotQuat = MathUtil.fromToRotation(Vector3.Y_AXIS, vec.normalize());
        }
        this.path.push(line);
        this.scene.addChild(line);
    }
}

new Sample_MeshLines().run()
