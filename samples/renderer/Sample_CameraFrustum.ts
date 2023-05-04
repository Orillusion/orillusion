import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { FlyCameraController } from "../../src/components/controller/FlyCameraController";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { DEGREES_TO_RADIANS } from "../../src/math/MathUtil";
import { Vector3 } from "../../src/math/Vector3";
import { PlaneGeometry } from "../../src/shape/PlaneGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";

export class Sample_CameraFrustum {
    async run() {
        await Engine3D.init();


        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(scene);
        mainCamera.perspective(45, webGPUContext.aspect, 1, 2000.0);
        mainCamera.object3D.addComponent(FlyCameraController);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;
        await this.initScene(view);

        Engine3D.startRenderView(view);
    }

    private initScene(view: View3D) {

        this.addPlane(view.scene, 0, 0, 0);

        () => {
            let camera = Engine3D.renderJobs[0].view.camera;
            let y = Math.tan(camera.fov / 2 * DEGREES_TO_RADIANS);
            let x = y * camera.aspect;
            let worldMatrix = camera.transform._worldMatrix;

            let f0 = worldMatrix.transformVector(new Vector3(-x, -y, 1));
            let f1 = worldMatrix.transformVector(new Vector3(-x, y, 1));
            let f2 = worldMatrix.transformVector(new Vector3(x, -y, 1));
            let f3 = worldMatrix.transformVector(new Vector3(x, y, 1));

            let far = camera.far;
            let pos = camera.transform.worldPosition;
            let farLB = new Vector3().copyFrom(f0).multiplyScalar(far).add(pos);
            let farLT = new Vector3().copyFrom(f1).multiplyScalar(far).add(pos);
            let farRB = new Vector3().copyFrom(f2).multiplyScalar(far).add(pos);
            let farRT = new Vector3().copyFrom(f3).multiplyScalar(far).add(pos);
            this.addPlane(view.scene, farLB.x, farLB.y, farLB.z, 20);
            this.addPlane(view.scene, farLT.x, farLT.y, farLT.z, 20);
            this.addPlane(view.scene, farRB.x, farRB.y, farRB.z, 20);
            this.addPlane(view.scene, farRT.x, farRT.y, farRT.z, 20);

            Engine3D.getRenderJob(view).graphic3D.drawCameraFrustum(camera);
        }

        return view.scene;
    }

    private addPlane(scene: Scene3D, x: number, y: number, z: number, scale: number = 1.0) {
        let obj = new Object3D();
        obj.x = x;
        obj.y = y;
        obj.z = z;
        obj.scaleX = obj.scaleY = obj.scaleZ = scale;
        scene.addChild(obj);
        let mr = obj.addComponent(MeshRenderer);
        mr.material = new LitMaterial();
        mr.material.doubleSide = true;
        mr.geometry = new PlaneGeometry(10, 10, 1, 1, Vector3.Z_AXIS);
    }

}
