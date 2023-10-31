import { ComponentBase, Vector4, MeshRenderer, Time, Material } from "@orillusion/core";

export class UVMoveComponent extends ComponentBase {

    private _material: Material;
    private readonly _speed: Vector4 = new Vector4(0.1, 0.1, 1, 1);

    public get speed(): Vector4 {
        return this._speed;
    }

    public set speed(value: Vector4) {
        this._speed.copyFrom(value);
    }

    start(): void {
        let mr = this.object3D.getComponent(MeshRenderer);
        if (mr) {
            this._material = mr.material;
        }
    }

    onUpdate(): void {
        if (this._material) {
            let value = this._material.getUniformV4(`transformUV1`);
            value.x += Time.delta * this._speed.x * 0.001;
            value.y += Time.delta * this._speed.y * 0.001;
            value.z = this._speed.z;
            value.w = this._speed.w;
            this._material.setUniformVector4(`transformUV1`, value);
        }
    }
}