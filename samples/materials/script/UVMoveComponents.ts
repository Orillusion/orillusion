import { ComponentBase } from "../../../src/components/ComponentBase";
import { MeshRenderer } from "../../../src/components/renderer/MeshRenderer";
import { MaterialBase } from "../../../src/materials/MaterialBase";
import { Vector4 } from "../../../src/math/Vector4";
import { Time } from "../../../src/util/Time";

export class UVMoveComponents extends ComponentBase {

    private mat: MaterialBase;

    public speed: Vector4 = new Vector4(0.1, 0.1, 1, 1);

    start(): void {
        let mr = this.object3D.getComponent(MeshRenderer);
        if (mr) {
            this.mat = mr.material;
        }
    }

    public onUpdate(): void {
        if (this.mat) {
            let value = this.mat.uvTransform_1;
            value.x += Time.delta * this.speed.x * 0.001;
            value.y += Time.delta * this.speed.y * 0.001;
            value.z = this.speed.z;
            value.w = this.speed.w;
            this.mat.uvTransform_1 = value;;
        }
    }
}