import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { ColliderComponent } from "../../src/components/ColliderComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { BoxColliderShape } from "../../src/components/shape/BoxColliderShape";
import { SphereColliderShape } from "../../src/components/shape/SphereColliderShape";
import { Camera3D } from "../../src/core/Camera3D";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { PointerEvent3D } from "../../src/event/eventConst/PointerEvent3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { Color } from "../../src/math/Color";
import { Vector3 } from "../../src/math/Vector3";
import { BoxGeometry } from "../../src/shape/BoxGeometry";
import { SphereGeometry } from "../../src/shape/SphereGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";

export class Sample_PickBoxCollider {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;

    constructor() { }

    async run() {
        //
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `bound`;

        await Engine3D.init({});


        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 1, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(0, 0, 100)
        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;



        Engine3D.startRenderView(view);
        this.initPickObject(this.scene);
    }

    private initPickObject(scene: Scene3D): void {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 115;
            this.lightObj.rotationY = 200;
            this.lightObj.rotationZ = 160;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 1.7;
            lc.radius = 100;
            scene.addChild(this.lightObj);
        }

        let size: number = 9;
        let boxShape = new BoxColliderShape().setFromCenterAndSize(new Vector3(0, 0, 0), new Vector3(size, size, size));
        let sphereShape = new SphereColliderShape(size / 2)
        let boxGeometry = new BoxGeometry(size, size, size)
        let sphereGeometry = new SphereGeometry(size / 2, 20, 20);
        for (let i = 0; i < 10; i++) {
            let obj = new Object3D();
            obj.name = 'sphere ' + i;
            scene.addChild(obj);
            obj.x = (i - 5) * 15;
            let renderer = obj.addComponent(MeshRenderer);
            renderer.geometry = i % 2 ? boxGeometry : sphereGeometry;
            renderer.material = new LitMaterial();

            //加一个碰撞盒子。
            let collider = obj.addComponent(ColliderComponent);
            collider.shape = i % 2 ? boxShape : sphereShape;
            //监听鼠标事件。
            obj.addEventListener(PointerEvent3D.PICK_CLICK, this.onPick, this);
        }
    }

    private onPick(e: PointerEvent3D) {
        console.log(e)
        let obj = e.currentTarget.current as Object3D;
        let mr = obj.getComponent(MeshRenderer)
        mr.material.baseColor = new Color(Math.random(), Math.random(), Math.random())
    }

    renderUpdate() { }
}
