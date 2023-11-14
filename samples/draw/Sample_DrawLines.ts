import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, View3D, PlaneGeometry, UnLitMaterial, Color, Vector3, ComponentBase, PointerEvent3D, Camera3D, BoundingBox, GeometryBase, VertexAttributeName } from '@orillusion/core';
import { GUIUtil } from '@samples/utils/GUIUtil';

// simple base demo
class Sample_Transform {
	private onDraw: boolean = false
	private lineWidth: number = 10
	private scene: Scene3D
	private camera: Camera3D

    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
		this.scene = scene;

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.orthoOffCenter(-window.innerWidth / 2, window.innerWidth / 2, -window.innerHeight / 2, window.innerHeight / 2, 0, 5000)
        this.camera = mainCamera;

        // create a basic plane
        let plane = new Object3D();
        let mr = plane.addComponent(MeshRenderer);
        mr.geometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1, Vector3.Z_AXIS);
        const mat = new UnLitMaterial()
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
    }

	onMouseDown(e: PointerEvent3D) {
		//Camera3D.screenPointToWorld
		this.onDraw = true;
		this.drawPoint(e.mouseX, e.mouseY);
    }
	
	onMouseMove(e: PointerEvent3D) {
		if (!this.onDraw) return;
		this.drawPoint(e.mouseX, e.mouseY);
	}
	
	onMouseUp(e: PointerEvent3D) {
		this.onDraw = false;
	}

	drawPoint(x: number, y: number) {
		let plane = new Object3D();
        let mr = plane.addComponent(MeshRenderer);
        mr.geometry = new CircleGeometry(this.lineWidth)
        console.log(mr.geometry)
        const mat = new UnLitMaterial()
        mat.baseColor = new Color(1, 1, 1)
        mr.material = mat;
        plane.z = 10;
		const point = this.camera.screenPointToWorld(x, y, 10)
		plane.x = point.x;
		plane.y = point.y;
		this.scene.addChild(plane);
	}
}

class CircleGeometry extends GeometryBase {
    public radius: number
    /**
     * Define the normal vector of a plane
     */
    public up: Vector3;

    constructor(radius: number) {
        super();
        // this.geometrySource = new SerializeGeometrySource().setPrimitive('primitive-plane');
        this.radius = radius
        this.up = Vector3.Z_AXIS;
        this.buildGeometry(this.up);
    }

    private buildGeometry(axis: Vector3): void {
        let vertexCount = 361;
        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);

        let indices_arr: any;
        let totalIndexCount = 360 * 3
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
        for (let i = 0; i < 360; i++) {
            const angle = i / 360 * Math.PI * 2
            position_arr[indexP++] = this.radius * Math.cos(angle)
            position_arr[indexP++] = -this.radius * Math.sin(angle)
            position_arr[indexP++] = 0

            normal_arr[indexN++] = 0;
            normal_arr[indexN++] = 0;
            normal_arr[indexN++] = 1;

            indices_arr[numIndices++] = 0;
            indices_arr[numIndices++] = i === 359 ? 1 : i + 2;
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