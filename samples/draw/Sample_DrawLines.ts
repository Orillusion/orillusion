import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, View3D, PlaneGeometry, UnLitMaterial, Color, Vector3, ComponentBase, PointerEvent3D, Camera3D, BoundingBox, GeometryBase, VertexAttributeName } from '@orillusion/core';

// simple base demo
class Sample_Transform {
	private onDraw: boolean = false
	private lineWidth: number = 10
	private scene: Scene3D
	private camera: Camera3D
    private drawInterval: number = 30
    private precision: number = 100
    private lineColor: Color = new Color(1, 1, 1)
    private lastTime: number
    private points: Object3D[] = []

    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
		this.scene = scene;

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.orthoOffCenter(-window.innerWidth / 2, window.innerWidth / 2, -window.innerHeight / 2, window.innerHeight / 2, 0, 5000)
        this.camera = mainCamera

        // add basic plane
        let plane = new Object3D();
        let mr = plane.addComponent(MeshRenderer);
        mr.geometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1, Vector3.Z_AXIS);
        let mat = new UnLitMaterial()
        mat.baseColor = new Color(0.2, 0.2, 0.2)
        mr.material = mat;
        plane.z = 100;
        scene.addChild(plane);

        // create a view with target scene and camera
        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        // start render
        Engine3D.startRenderView(view);
		
		Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onMouseDown, this);
		Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onMouseMove, this);
		Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);

        // debug GUI
        GUIHelp.init();
		GUIHelp.add(this, 'lineWidth', 10, 50, 1);
        GUIHelp.add(this, 'precision', 4, 360, 1);
        GUIHelp.add(this, 'drawInterval', 15, 100, 1);
        GUIHelp.addColor(this, 'lineColor');
        GUIHelp.addButton('clearCanvas', () => {
            this.points.map((point) => {
                this.scene.removeChild(point)
            })
            this.points = []
        })
    }

	onMouseDown(e: PointerEvent3D) {
		this.lastTime = Date.now()
		this.onDraw = true;
		this.drawPoint(e.mouseX, e.mouseY);
    }
	
	onMouseMove(e: PointerEvent3D) {
		if (!this.onDraw) return;
        const now = Date.now();
        if (now - this.lastTime > this.drawInterval) {
            this.drawPoint(e.mouseX, e.mouseY);
            this.lastTime = now;
        }
	}
	
	onMouseUp(e: PointerEvent3D) {
		this.onDraw = false;
	}

	drawPoint(x: number, y: number) {
		let point = new Object3D();
        let mr = point.addComponent(MeshRenderer);
        mr.geometry = new CircleGeometry(this.lineWidth, this.precision)
        const mat = new UnLitMaterial();
        mat.baseColor = this.lineColor;
        mr.material = mat;
        point.z = 10
		const pos = this.camera.screenPointToWorld(x, y, 10);
		point.x = pos.x;
		point.y = pos.y;
        this.points.push(point);
		this.scene.addChild(point);
	}
}

class CircleGeometry extends GeometryBase {
    public radius: number
    public precision: number
    /**
     * Define the normal vector of a circle
     */
    public up: Vector3;

    constructor(radius: number, precision: number) {
        super();
        this.radius = radius
        this.precision = precision
        this.up = Vector3.Z_AXIS;
        this.buildGeometry(this.up);
    }

    private buildGeometry(axis: Vector3): void {
        let vertexCount = this.precision + 1;
        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);

        let indices_arr: any;
        let totalIndexCount = this.precision * 3
        if (totalIndexCount >= Uint16Array.length) {
            indices_arr = new Uint32Array(totalIndexCount);
        } else {
            indices_arr = new Uint16Array(totalIndexCount);
        }

        let numIndices = 0;
        let indexP: number = 0;
        let indexN: number = 0;
        position_arr[indexP++] = 0
        position_arr[indexP++] = 0
        position_arr[indexP++] = 0
        normal_arr[indexN++] = 0;
        normal_arr[indexN++] = 0;
        normal_arr[indexN++] = 1;
        for (let i = 0; i < this.precision; i++) {
            const angle = i / this.precision * Math.PI * 2
            position_arr[indexP++] = this.radius * Math.cos(angle)
            position_arr[indexP++] = -this.radius * Math.sin(angle)
            position_arr[indexP++] = 0

            normal_arr[indexN++] = 0;
            normal_arr[indexN++] = 0;
            normal_arr[indexN++] = 1;

            indices_arr[numIndices++] = 0;
            indices_arr[numIndices++] = i === this.precision - 1 ? 1 : i + 2;
            indices_arr[numIndices++] = i + 1;
        }

        this.setIndices(indices_arr);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);

        this.addSubGeometry({
            indexStart: 0,
            indexCount: indices_arr.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0
        });
    }
}

new Sample_Transform().run()