import { ColliderComponent } from "../../components/ColliderComponent";
import { MeshRenderer } from "../../components/renderer/MeshRenderer";
import { BoxColliderShape } from "../../components/shape/BoxColliderShape";
import { Object3D } from "../../core/entities/Object3D";
import { GPUCompareFunction } from "../../gfx/graphics/webGpu/WebGPUConst";
import { UnLitMaterial } from "../../materials/UnLitMaterial";
import { Color } from "../../math/Color";
import { Vector3 } from "../../math/Vector3";
import { BoxGeometry } from "../../shape/BoxGeometry";
import { TransformAxisEnum } from "./TransformAxisEnum";
import { TransformControllerBaseComponent } from "./TransformControllerBaseComponent";

export class ScaleControlComponents extends TransformControllerBaseComponent {

    public init(param?: any): void {
        super.init(param);

        let boxXYZMaterial = new UnLitMaterial();
        boxXYZMaterial.doubleSide = true;
        boxXYZMaterial.baseColor = new Color(0.9, 0.9, 0.9);
        boxXYZMaterial.depthCompare = GPUCompareFunction.always;
        this.mAxisColor[TransformAxisEnum.XYZ] = boxXYZMaterial.baseColor;
        this.mAxisMaterial[TransformAxisEnum.XYZ] = boxXYZMaterial;

        let boxXYZ = new Object3D();
        let mr = boxXYZ.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(2, 2, 2);
        mr.material = this.mAxisMaterial[TransformAxisEnum.XYZ];

        let collider = boxXYZ.addComponent(ColliderComponent);
        let boxShape = new BoxColliderShape();
        boxShape.setFromCenterAndSize(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
        collider.shape = boxShape;

        this.mContainer.addChild(this.mAxis[TransformAxisEnum.XYZ] = boxXYZ);

        this.mAxisCollider[TransformAxisEnum.XYZ] = boxXYZ.getComponent(ColliderComponent);
    }

    protected applyLocalTransform(currentAxis: TransformAxisEnum, offset: Vector3, distance: number) {
        switch (this.currentAxis) {
            case TransformAxisEnum.XYZ:
                {
                    let v = 0;
                    if (Math.abs(offset.x) > Math.abs(offset.y)) {
                        if (Math.abs(offset.x) > Math.abs(offset.z)) {
                            v = offset.x;
                        } else {
                            v = offset.z;
                        }
                    } else {
                        v = offset.y;
                    }
                    this.mX.scaleX += v;
                    this.mX.scaleY += v;
                    this.mX.scaleZ += v;
                }
                break;
            default:
                {
                    this.mX.transform.worldMatrix.transformVector(offset, offset);

                    if (this.currentAxis == TransformAxisEnum.X || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.XZ) {
                        this.mX.scaleX = Math.abs(this.mX.scaleX + offset.x);
                    }
                    if (this.currentAxis == TransformAxisEnum.Y || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.YZ) {
                        this.mX.scaleY = Math.abs(this.mX.scaleY + offset.y);
                    }
                    if (this.currentAxis == TransformAxisEnum.Z || this.currentAxis == TransformAxisEnum.XZ || this.currentAxis == TransformAxisEnum.YZ) {
                        this.mX.scaleZ = Math.abs(this.mX.scaleZ + offset.z);
                    }
                }
                break;
        }
    }

    protected applyGlobalTransform(currentAxis: TransformAxisEnum, offset: Vector3, distance: number) {
        let value = Vector3.HELP_0;
        value.set(0, 0, 0);

        if (this.currentAxis == TransformAxisEnum.X || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.XZ) {
            value.x = offset.x;
        }
        if (this.currentAxis == TransformAxisEnum.Y || this.currentAxis == TransformAxisEnum.XY || this.currentAxis == TransformAxisEnum.YZ) {
            value.y = offset.y;
        }
        if (this.currentAxis == TransformAxisEnum.Z || this.currentAxis == TransformAxisEnum.XZ || this.currentAxis == TransformAxisEnum.YZ) {
            value.z = offset.z;
        }

        this.mX.transform.worldMatrix.transformVector(value, Vector3.HELP_1);
        this.mX.scaleX += Vector3.HELP_1.x;
        this.mX.scaleY += Vector3.HELP_1.y;
        this.mX.scaleZ += Vector3.HELP_1.z;
    }

    protected createCustomAxis(axis: TransformAxisEnum): Object3D {
        let axisObj = super.createAxis(axis);

        let arrowsObj = this.createBox(axis);
        axisObj.addChild(arrowsObj);

        return axisObj;
    }

    protected createBox(axis: TransformAxisEnum): Object3D {
        let r = 0, g = 0, b = 0;

        let obj = new Object3D();

        switch (axis) {
            case TransformAxisEnum.X:
                r = 1;
                obj.rotationZ = -90;
                break;
            case TransformAxisEnum.Y:
                g = 1;
                // obj.rotationY = -90;
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
        mr.geometry = new BoxGeometry(2, 2, 2);
        mr.material = this.mAxisMaterial[axis];
        return obj;
    }
}