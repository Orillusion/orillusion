import { ColliderComponent } from "../../components/ColliderComponent";
import { MeshRenderer } from "../../components/renderer/MeshRenderer";
import { BoxColliderShape } from "../../components/shape/BoxColliderShape";
import { Object3D } from "../../core/entities/Object3D";
import { GPUCompareFunction } from "../../gfx/graphics/webGpu/WebGPUConst";
import { UnLitMaterial } from "../../materials/UnLitMaterial";
import { Color } from "../../math/Color";
import { Matrix4 } from "../../math/Matrix4";
import { Orientation3D } from "../../math/Orientation3D";
import { Vector3 } from "../../math/Vector3";
import { CylinderGeometry } from "../../shape/CylinderGeometry";
import { PlaneGeometry } from "../../shape/PlaneGeometry";
import { TransformAxisEnum } from "./TransformAxisEnum";
import { TransformControllerBaseComponent } from "./TransformControllerBaseComponent";

export class TranslationControlComponents extends TransformControllerBaseComponent {

    public init(param?: any): void {
        super.init(param);

        let xyPlaneMaterial = new UnLitMaterial();
        xyPlaneMaterial.doubleSide = true;
        xyPlaneMaterial.baseColor = new Color(0, 0, 1);
        xyPlaneMaterial.depthCompare = GPUCompareFunction.always;
        this.mAxisColor[TransformAxisEnum.XY] = xyPlaneMaterial.baseColor;
        this.mAxisMaterial[TransformAxisEnum.XY] = xyPlaneMaterial;

        let xzPlaneMaterial = new UnLitMaterial();
        xzPlaneMaterial.doubleSide = true;
        xzPlaneMaterial.baseColor = new Color(0, 1, 0);
        xzPlaneMaterial.depthCompare = GPUCompareFunction.always;
        this.mAxisColor[TransformAxisEnum.XZ] = xzPlaneMaterial.baseColor;
        this.mAxisMaterial[TransformAxisEnum.XZ] = xzPlaneMaterial;

        let yzPlaneMaterial = new UnLitMaterial();
        yzPlaneMaterial.doubleSide = true;
        yzPlaneMaterial.baseColor = new Color(1, 0, 0);
        yzPlaneMaterial.depthCompare = GPUCompareFunction.always;
        this.mAxisColor[TransformAxisEnum.YZ] = yzPlaneMaterial.baseColor;
        this.mAxisMaterial[TransformAxisEnum.YZ] = yzPlaneMaterial;

        let planeXY = this.createPlane(TransformAxisEnum.XY);
        let planeXZ = this.createPlane(TransformAxisEnum.XZ);
        let planeYZ = this.createPlane(TransformAxisEnum.YZ);

        this.mContainer.addChild(this.mAxis[TransformAxisEnum.XY] = planeXY);
        this.mContainer.addChild(this.mAxis[TransformAxisEnum.XZ] = planeXZ);
        this.mContainer.addChild(this.mAxis[TransformAxisEnum.YZ] = planeYZ);

        this.mAxisCollider[TransformAxisEnum.XY] = planeXY.getComponent(ColliderComponent);
        this.mAxisCollider[TransformAxisEnum.XZ] = planeXZ.getComponent(ColliderComponent);
        this.mAxisCollider[TransformAxisEnum.YZ] = planeYZ.getComponent(ColliderComponent);
    }

    protected applyLocalTransform(currentAxis: TransformAxisEnum, offset: Vector3, distance: number) {
        Matrix4.help_matrix_0.copyFrom(this.mX.transform.worldMatrix).invert();
        Matrix4.help_matrix_0.transformVector(offset, Vector3.HELP_0);

        if (!(this.currentAxis == TransformAxisEnum.X || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.XZ)) {
            Vector3.HELP_0.x = 0;
        }
        if (!(this.currentAxis == TransformAxisEnum.Y || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.YZ)) {
            Vector3.HELP_0.y = 0;
        }
        if (!(this.currentAxis == TransformAxisEnum.Z || this.currentAxis == TransformAxisEnum.XZ || this.currentAxis == TransformAxisEnum.YZ)) {
            Vector3.HELP_0.z = 0;
        }

        this.mX.transform.worldMatrix.transformVector(Vector3.HELP_0, Vector3.HELP_1);

        this.mX.x += Vector3.HELP_1.x;
        this.mX.y += Vector3.HELP_1.y;
        this.mX.z += Vector3.HELP_1.z;

        // this.target.localPosition = this.mX.transform.worldPosition.clone();
    }

    protected applyGlobalTransform(currentAxis: TransformAxisEnum, offset: Vector3, distance: number) {
        Matrix4.help_matrix_0.identity();

        if (this.currentAxis == TransformAxisEnum.X || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.XZ) {
            Matrix4.help_matrix_0.appendTranslation(offset.x, 0, 0);
        }
        if (this.currentAxis == TransformAxisEnum.Y || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.YZ) {
            Matrix4.help_matrix_0.appendTranslation(0, offset.y, 0);
        }
        if (this.currentAxis == TransformAxisEnum.Z || this.currentAxis == TransformAxisEnum.XZ || this.currentAxis == TransformAxisEnum.YZ) {
            Matrix4.help_matrix_0.appendTranslation(0, 0, offset.z);
        }

        Matrix4.help_matrix_1.copyFrom(this.mX.transform.worldMatrix);
        Matrix4.help_matrix_1.append(Matrix4.help_matrix_0);

        if (this.mX.parent) {
            Matrix4.help_matrix_2.copyFrom(this.mX.parent.worldMatrix);
            Matrix4.help_matrix_2.invert();
            Matrix4.help_matrix_1.multiply(Matrix4.help_matrix_2);
        }

        let trs = Matrix4.help_matrix_1.decompose(Orientation3D.QUATERNION);

        this.mX.transform.localPosition = trs[0];

        console.log(this.target.localPosition);

        // this.target.localPosition = this.mX.transform.worldPosition.clone();
    }

    protected createCustomAxis(axis: TransformAxisEnum): Object3D {
        let axisObj = super.createAxis(axis);

        let arrowsObj = this.createArrows(axis);
        axisObj.addChild(arrowsObj);

        return axisObj;
    }

    protected createArrows(axis: TransformAxisEnum): Object3D {
        let r = 0, g = 0, b = 0;

        let obj = new Object3D();

        switch (axis) {
            case TransformAxisEnum.X:
                r = 1;
                obj.rotationZ = -90;
                break;
            case TransformAxisEnum.Y:
                g = 1;
                obj.rotationY = -90;
                break;
            case TransformAxisEnum.Z:
                b = 1;
                obj.rotationX = 90;
                break;
        }

        let w = 0.2 + r * 20;
        let h = 0.2 + g * 20;
        let d = 0.2 + b * 20;

        obj.x = w * 0.5;
        obj.y = h * 0.5;
        obj.z = d * 0.5;

        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = new CylinderGeometry(0, 1, 4);
        mr.material = this.mAxisMaterial[axis];
        return obj;
    }

    protected createPlane(axis: TransformAxisEnum): Object3D {
        let obj = new Object3D();

        let mr = obj.addComponent(MeshRenderer);
        mr.material = this.mAxisMaterial[axis];

        let collider = obj.addComponent(ColliderComponent);
        let boxShape = new BoxColliderShape();
        collider.shape = boxShape;

        switch (axis) {
            case TransformAxisEnum.XY:
                mr.geometry = new PlaneGeometry(4, 4, 1, 1, Vector3.Z_AXIS);
                obj.x = 8;
                obj.y = 8;
                boxShape.setFromCenterAndSize(new Vector3(0, 0, 0), new Vector3(4, 4, 0.1));
                break;
            case TransformAxisEnum.XZ:
                mr.geometry = new PlaneGeometry(4, 4, 1, 1, Vector3.Y_AXIS);
                obj.x = 8;
                obj.z = 8;
                boxShape.setFromCenterAndSize(new Vector3(0, 0, 0), new Vector3(4, 0.1, 4));
                break;
            case TransformAxisEnum.YZ:
                mr.geometry = new PlaneGeometry(4, 4, 1, 1, Vector3.X_AXIS);
                obj.y = 8;
                obj.z = 8;
                boxShape.setFromCenterAndSize(new Vector3(0, 0, 0), new Vector3(0.1, 4, 4));
                break;
        }

        return obj;
    }
}