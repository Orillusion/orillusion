import { Engine3D } from "../../Engine3D";
import { ColliderComponent } from "../../components/ColliderComponent";
import { MeshRenderer } from "../../components/renderer/MeshRenderer";
import { BoxColliderShape } from "../../components/shape/BoxColliderShape";
import { HitInfo } from "../../components/shape/ColliderShape";
import { Object3D } from "../../core/entities/Object3D";
import { PointerEvent3D } from "../../event/eventConst/PointerEvent3D";
import { GPUCompareFunction } from "../../gfx/graphics/webGpu/WebGPUConst";
import { UnLitMaterial } from "../../materials/UnLitMaterial";
import { Color } from "../../math/Color";
import { Matrix4 } from "../../math/Matrix4";
import { Orientation3D } from "../../math/Orientation3D";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { CylinderGeometry } from "../../shape/CylinderGeometry";
import { PlaneGeometry } from "../../shape/PlaneGeometry";
import { TorusGeometry } from "../../shape/TorusGeometry";
import { TransformAxisEnum } from "./TransformAxisEnum";
import { TransformControllerBaseComponent } from "./TransformControllerBaseComponent";

export class RotationControlComponents extends TransformControllerBaseComponent {

    protected applyLocalTransform(currentAxis: TransformAxisEnum, offset: Vector3, distance: number) {
        if (this.currentAxis == TransformAxisEnum.X || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.XZ) {
            // this.target.rotationX += 1;
        }
        if (this.currentAxis == TransformAxisEnum.Y || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.YZ) {
            // this.target.rotationY += 1;

            Matrix4.help_matrix_0.copyFrom(this.mX.transform.worldMatrix);

            Matrix4.help_matrix_1.identity();
            Matrix4.help_matrix_1.createByRotation(1, Vector3.Y_AXIS);

            Matrix4.help_matrix_2.multiplyMatrices(Matrix4.help_matrix_1, Matrix4.help_matrix_0);
            Matrix4.help_matrix_2.invert();

            Matrix4.help_matrix_1.multiplyMatrices(Matrix4.help_matrix_2, Matrix4.help_matrix_0);
            let trs = Matrix4.help_matrix_1.decompose();

            this.mX.rotationX += trs[1].x;
            this.mY.rotationY += trs[1].y;
            this.mZ.rotationZ += trs[1].z;
        }
        if (this.currentAxis == TransformAxisEnum.Z || this.currentAxis == TransformAxisEnum.XZ || this.currentAxis == TransformAxisEnum.YZ) {
            // this.target.rotationZ += 1;
        }
    }

    protected getAngle(): number {
        const scene3D = this.object3D.transform.scene3D;
        const camera = scene3D.view.camera;
        const pos = this.mZ.transform.worldPosition;
        let ray = camera.screenPointToRay(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);

        if (this.currentAxis == TransformAxisEnum.X) {
            let screenPoint = camera.worldToScreenPoint(pos);
            Vector3.HELP_1.set(screenPoint.x, screenPoint.y, 0);
            Vector3.HELP_2.set(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY, 0);
            let vec3 = Vector3.HELP_2.subtract(Vector3.HELP_1);
            let angle = Vector3.getAngle(Vector3.X_AXIS, vec3);
            if (vec3.y > 0) {
                angle = 360 - angle;
            }
            if (camera.transform.worldPosition.x - pos.x > 0) {
                angle = 360 - angle;
            }
            return angle;
        }

        if (this.currentAxis == TransformAxisEnum.Y) {
            let screenPoint = camera.worldToScreenPoint(pos);
            Vector3.HELP_1.set(screenPoint.x, screenPoint.y, 0);
            Vector3.HELP_2.set(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY, 0);
            let vec3 = Vector3.HELP_2.subtract(Vector3.HELP_1);
            let angle = Vector3.getAngle(Vector3.X_AXIS, vec3);
            if (vec3.y > 0) {
                angle = 360 - angle;
            }
            if (camera.transform.worldPosition.y - pos.y > 0) {
                angle = 360 - angle;
            }
            return angle;
        }

        if (this.currentAxis == TransformAxisEnum.Z) {
            let screenPoint = camera.worldToScreenPoint(pos);
            Vector3.HELP_1.set(screenPoint.x, screenPoint.y, 0);
            Vector3.HELP_2.set(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY, 0);
            let vec3 = Vector3.HELP_2.subtract(Vector3.HELP_1);
            let angle = Vector3.getAngle(Vector3.X_AXIS, vec3);
            if (vec3.y > 0) {
                angle = 360 - angle;
            }
            if (camera.transform.worldPosition.z - pos.z > 0) {
                angle = 360 - angle;
            }
            return angle;
        }

        return 0;
    }

    protected mLastAngle = 0;
    protected applyGlobalTransform(currentAxis: TransformAxisEnum, offset: Vector3, distance: number) {
        if (this.currentAxis == TransformAxisEnum.X || this.currentAxis == TransformAxisEnum.Y || this.currentAxis == TransformAxisEnum.Z) {
            let angle = this.getAngle();
            Matrix4.help_matrix_0.identity();

            switch (this.currentAxis) {
                case TransformAxisEnum.X:
                    Matrix4.help_matrix_0.createByRotation((this.mLastAngle - angle), Vector3.X_AXIS);
                    break;
                case TransformAxisEnum.Y:
                    Matrix4.help_matrix_0.createByRotation((this.mLastAngle - angle), Vector3.Y_AXIS);
                    break;
                case TransformAxisEnum.Z:
                    Matrix4.help_matrix_0.createByRotation((this.mLastAngle - angle), Vector3.Z_AXIS);
                    break;
            }

            Matrix4.help_matrix_1.copyFrom(this.mX.transform.worldMatrix);
            Matrix4.help_matrix_1.append(Matrix4.help_matrix_0);

            if (this.mX.parent) {
                Matrix4.help_matrix_2.copyFrom(this.mX.parent.worldMatrix);
                Matrix4.help_matrix_2.invert();
                Matrix4.help_matrix_1.multiply(Matrix4.help_matrix_2);
            }

            let trs = Matrix4.help_matrix_1.decompose(Orientation3D.QUATERNION);
            let rot = trs[1];
            Quaternion.HELP_0.set(rot.x, rot.y, rot.z, rot.w);

            this.mLastAngle = angle;
            this.mX.transform.localRotQuat = Quaternion.HELP_0;
        }
    }

    public onMouseDown(e: PointerEvent3D): void {
        super.onMouseDown(e);
        if (this.currentAxis != TransformAxisEnum.NONE) {
            this.mAxis[TransformAxisEnum.X].getComponent(MeshRenderer).enable = false;
            this.mAxis[TransformAxisEnum.Y].getComponent(MeshRenderer).enable = false;
            this.mAxis[TransformAxisEnum.Z].getComponent(MeshRenderer).enable = false;
            this.mAxis[this.currentAxis].getComponent(MeshRenderer).enable = true;
            this.mLastAngle = this.getAngle();
        }
    }

    public onMouseUp(e: PointerEvent3D): void {
        super.onMouseUp(e);
        if (this.currentAxis == TransformAxisEnum.NONE) {
            this.mAxis[TransformAxisEnum.X].getComponent(MeshRenderer).enable = true;
            this.mAxis[TransformAxisEnum.Y].getComponent(MeshRenderer).enable = true;
            this.mAxis[TransformAxisEnum.Z].getComponent(MeshRenderer).enable = true;
        }
    }

    protected createCustomAxis(axis: TransformAxisEnum): Object3D {
        let axisObj = this.createAxis(axis);

        // let arrowsObj = this.createArrows(axis);
        // axisObj.addChild(arrowsObj);

        return axisObj;
    }

    protected createAxis(axis: TransformAxisEnum): Object3D {
        let r = 0, g = 0, b = 0;

        let obj = new Object3D();

        switch (axis) {
            case TransformAxisEnum.X:
                r = 1;
                obj.rotationZ = 90;
                break;
            case TransformAxisEnum.Y:
                g = 1;
                // obj.rotationY = 90;
                break;
            case TransformAxisEnum.Z:
                b = 1;
                obj.rotationX = 90;
                break;
        }

        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = new TorusGeometry(20, 0.4);
        mr.material = this.mAxisMaterial[axis];

        let collider = obj.addComponent(ColliderComponent);
        let colliderShape = new BoxColliderShape(); //  new TorusColliderShape(20, 0.2);
        colliderShape.setFromCenterAndSize(new Vector3(), new Vector3(40, 0.4, 40));
        collider.shape = colliderShape;
        return obj;
    }

    protected pickAxis(): { intersectPoint?: Vector3; distance: number; obj: Object3D; axis: TransformAxisEnum } {
        const scene3D = this.object3D.transform.scene3D;
        const camera = scene3D.view.camera;
        let ray = camera.screenPointToRay(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);

        let intersect: HitInfo;
        let lastResult: { intersectPoint?: Vector3; distance: number; obj: Object3D; axis: TransformAxisEnum };

        for (let i = 0; i <= TransformAxisEnum.MAX; i++) {
            let collider = this.mAxisCollider[i];
            if (!collider) {
                continue;
            }
            intersect = collider.rayPick(ray);
            if (intersect) {
                let distance = Vector3.distance(intersect.intersectPoint, collider.shape.center);
                if (distance > 20 + 0.8 || distance < 20 - 0.8) {
                    continue;
                }

                if (!lastResult || lastResult.distance > intersect.distance) {
                    lastResult = {
                        axis: i,
                        obj: collider.object3D,
                        distance: intersect.distance,
                        intersectPoint: intersect.intersectPoint,
                    }
                }
            }
        }
        return lastResult;
    }
}

