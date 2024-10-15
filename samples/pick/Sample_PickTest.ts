import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { MaterialStateComponent } from "@samples/pick/MaterialStateComponent";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Scene3D, Engine3D, MeshRenderer, ColliderComponent, PointerEvent3D, SphereGeometry, Object3D, LitMaterial, Color, FXAAPost, PostProcessingComponent, BloomPost, AtmosphericComponent, View3D, CameraUtil, HoverCameraController, BoxGeometry, PlaneGeometry, Vector3, BillboardComponent, BoundingBox, BoundUtil, UnLitMaterial, BlendMode, Vector2, Quaternion, Orientation3D, AxisObject } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { ExtrudeGeometry, Shape2D } from "@orillusion/geometry";

class Sample_PickTest {
    pointGeometry: SphereGeometry;
    scene: Scene3D;
    hoverCameraController: HoverCameraController;

    async run() {
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;

        await Engine3D.init({});

        GUIHelp.init();

        let scene = new Scene3D();
        this.scene = scene;

        scene.addComponent(Stats);

        scene.addComponent(AtmosphericComponent).sunY = 0.6;

        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);

        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(0, 0, 5);
        this.hoverCameraController = hoverCameraController;

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;
        Engine3D.startRenderView(view);

        scene.addChild(new AxisObject(1.0, 0.01));

        GUIHelp.addButton('PrintCameraRotation', () => {
            const camera = this.scene.view.camera;
            console.warn('CameraRotation:', camera.object3D.rotationX, camera.object3D.rotationY, camera.object3D.rotationZ);
            console.warn('camera.object3D.localPosition:', camera.object3D.localPosition);
        });

        GUIHelp.addButton('Reset', () => {
            this.clear();
        });

        await this.initScene(scene);
    }

    private pickPlane: Object3D;
    private async initScene(scene: Scene3D) {
        this.pointGeometry = new SphereGeometry(0.02, 16, 16);

        const pickFire = scene.view.pickFire;
        // pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onMousePick, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_CLICK, this.onMouseClick, this);

        let boxObj = new Object3D();
        let mr = boxObj.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(1.5, 1, 1);
        mr.material = new LitMaterial();
        scene.addChild(boxObj);

        let pickPlane = new Object3D();
        mr = pickPlane.addComponent(MeshRenderer);
        mr.enable = false;
        mr.geometry = new PlaneGeometry(4, 4, 1, 1, Vector3.Z_AXIS);
        mr.material = new LitMaterial();
        mr.material.doubleSide = true;
        pickPlane.addComponent(BillboardComponent);
        pickPlane.addComponent(ColliderComponent);
        scene.addChild(pickPlane);
        this.pickPlane = pickPlane;

        let depth = 0;

        GUIHelp.addButton('Begin', () => {
            this.clear();

            const boundingBox = BoundUtil.transformBound(boxObj.transform.worldMatrix, boxObj.bound as BoundingBox, null);

            const closestPoint = this.getClosestPoint(scene.view.camera.transform.worldPosition, boundingBox);

            // this.addPointToScene(this.scene, closestPoint, new Color(1.0, 1.0, 0.0));
            
            const centerRay = this.scene.view.camera.screenPointToRay(Engine3D.width * 0.5, Engine3D.height * 0.5);
            closestPoint.addScaledVector(centerRay.direction, -0.1);
            
            const farthestPoint = this.getFarthestPoint(scene.view.camera.transform.worldPosition, boundingBox);

            // this.addPointToScene(this.scene, farthestPoint, Color.COLOR_RED);

            farthestPoint.addScaledVector(centerRay.direction, 0.1);

            const fc = new Vector3().subVectors(farthestPoint, closestPoint);

            depth = fc.dotProduct(centerRay.direction) / centerRay.direction.length;

            // mr.enable = true;

            this.pickPoints = [];
            pickPlane.localPosition = closestPoint;
            this.hoverCameraController.enable = false;

            this.pickPlane.getComponent(BillboardComponent).enable = true;
        })

        function getCenterPoint(points: Vector3[]): Vector3 {
            let centerPoint = new Vector3();
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                centerPoint.add(p, centerPoint);
            }
            centerPoint.divideScalar(points.length);
            return centerPoint;
        }

        GUIHelp.addButton('Stop', () => {
            mr.enable = false;
            this.hoverCameraController.enable = true;

            if (this.pickPoints.length <= 0) {
                return;
            }

            let center3DPoint = getCenterPoint(this.worldPoints);
            this.addPointToScene(this.scene, center3DPoint, Color.COLOR_WHITE);

            let pathPoints: Vector3[] = [];
            for (let i = 0; i < this.pickPoints.length; i++) {
                const point2D = new Vector3().subVectors(this.pickPoints[i], this.pickPlane.transform.worldPosition);
                pathPoints.push(point2D);
            }

            let centerPoint = getCenterPoint(pathPoints);

            for (let i = 0; i < pathPoints.length; i++) {
                pathPoints[i].subVectors(pathPoints[i], centerPoint);
            }

            this.pickPlane.getComponent(BillboardComponent).enable = false;

            let shape = new Shape2D();
            for (let i = 0; i < pathPoints.length; i++) {
                const p = pathPoints[i];
                if (i === 0) {
                    shape.moveTo(p.x, p.y);
                } else {
                    shape.lineTo(p.x, p.y);
                }
            }

            {
                let obj = new Object3D();
                obj.localPosition = center3DPoint;
                obj.localRotation = this.pickPlane.localRotation;
                this.removeObj.push(obj);

                let mr = obj.addComponent(MeshRenderer);
                mr.geometry = new ExtrudeGeometry([shape], {
                    depth: -depth,
                    bevelEnabled: false,
                    steps: 1
                });
                let mat = new UnLitMaterial();
                mat.doubleSide = true;
                mat.transparent = true;
                mat.blendMode = BlendMode.ALPHA;
                mat.baseColor = new Color(1.0, 1.0, 0.0, 0.8);
                mr.material = mat;
                this.scene.addChild(obj);
            }

            this.pickPoints.length = 0;
            this.worldPoints.length = 0;
        })
    }

    private pickPoints: Vector3[] = [];
    private worldPoints: Vector3[] = [];
    private onMousePick(e: PointerEvent3D) {
        const position = e.data.worldPos as Vector3;

        const worldMatrix = this.pickPlane.transform.worldMatrix;
        worldMatrix.invert();
        const newPoint = worldMatrix.transformPoint(position);

        this.addPointToScene(this.pickPlane, newPoint, Color.COLOR_RED);

        this.pickPoints.push(newPoint);
        this.worldPoints.push(position);
    }

    private onMouseClick(e: PointerEvent3D) {
        console.log('onMouseClick:', e, Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
        const camera = this.scene.view.camera;
        const screenPoint = camera.worldToScreenPoint(this.pickPlane.transform.worldPosition);
        const position = camera.screenPointToWorld(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY, screenPoint.z);

        const worldMatrix = this.pickPlane.transform.worldMatrix;
        worldMatrix.invert();
        const newPoint = worldMatrix.transformPoint(position);

        this.addPointToScene(this.pickPlane, newPoint, Color.COLOR_GREEN);

        this.pickPoints.push(newPoint);
        this.worldPoints.push(position);
    }

    private removeObj: Object3D[] = [];
    private addPointToScene(parent: Object3D, position: Vector3, color: Color): Object3D {
        let obj = new Object3D();
        obj.localPosition = position;
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = this.pointGeometry;
        let mat = new UnLitMaterial();
        mat.baseColor = color;
        mr.material = mat;
        parent.addChild(obj);
        this.removeObj.push(obj);
        return obj;
    }

    private getClosestPoint(cameraPosition: Vector3, boundingBox: BoundingBox): Vector3 {
        const closestPoint: Vector3 = new Vector3();

        closestPoint.x =
            cameraPosition.x < boundingBox.min.x ? boundingBox.min.x :
                cameraPosition.x > boundingBox.max.x ? boundingBox.max.x :
                    cameraPosition.x;

        closestPoint.y =
            cameraPosition.y < boundingBox.min.y ? boundingBox.min.y :
                cameraPosition.y > boundingBox.max.y ? boundingBox.max.y :
                    cameraPosition.y;

        closestPoint.z =
            cameraPosition.z < boundingBox.min.z ? boundingBox.min.z :
                cameraPosition.z > boundingBox.max.z ? boundingBox.max.z :
                    cameraPosition.z;

        return closestPoint;
    }

    private getFarthestPoint(cameraPosition: Vector3, boundingBox: BoundingBox): Vector3 {
        const farthestPoint: Vector3 = new Vector3();

        farthestPoint.x =
            cameraPosition.x > boundingBox.min.x ? boundingBox.min.x :
                cameraPosition.x < boundingBox.max.x ? boundingBox.max.x :
                    cameraPosition.x;

        farthestPoint.y =
            cameraPosition.y > boundingBox.min.y ? boundingBox.min.y :
                cameraPosition.y < boundingBox.max.y ? boundingBox.max.y :
                    cameraPosition.y;

        farthestPoint.z =
            cameraPosition.z > boundingBox.min.z ? boundingBox.min.z :
                cameraPosition.z < boundingBox.max.z ? boundingBox.max.z :
                    cameraPosition.z;

        return farthestPoint;
    }

    private clear() {
        for (let obj of this.removeObj) {
            obj.removeFromParent();
        }
        this.removeObj = [];
    }
}

new Sample_PickTest().run();
