import { ComponentBase, MathUtil, Time, Vector3, lerp, lerpVector3 } from "@orillusion/core";

export class PhysicTransformController extends ComponentBase {
    moveForward(v: number, fly: boolean = false) {
        let pos = this.transform.forward.clone().multiplyScalar(v);
        pos.y = fly ? pos.y : 0;
        this.transform.localPosition.add(pos, pos);
        pos = lerpVector3(this.transform.localPosition, pos, Time.delta * 0.001);
        this.transform.localPosition = pos;
    }
    moveBack(v: number, fly: boolean = false) {
        let pos = this.transform.back.clone().multiplyScalar(v);
        pos.y = fly ? pos.y : 0;
        this.transform.localPosition.add(pos, pos);
        pos = lerpVector3(this.transform.localPosition, pos, Time.delta * 0.001);
        this.transform.localPosition = pos;
    }
    moveLeft(v: number, fly: boolean = false) {
        let pos = this.transform.right.clone().multiplyScalar(v);
        pos.y = fly ? pos.y : 0;
        this.transform.localPosition.add(pos, pos);
        pos = lerpVector3(this.transform.localPosition, pos, Time.delta * 0.001);
        this.transform.localPosition = pos;
    }
    moveRight(v: number, fly: boolean = false) {
        let pos = this.transform.left.clone().multiplyScalar(v);
        pos.y = fly ? pos.y : 0;
        this.transform.localPosition.add(pos, pos);
        pos = lerpVector3(this.transform.localPosition, pos, Time.delta * 0.001);
        this.transform.localPosition = pos;
    }

    flyUp(v: number) {
        let pos = this.transform.up.clone().multiplyScalar(v);
        this.transform.localPosition.add(pos, pos);
        pos = lerpVector3(this.transform.localPosition, pos, Time.delta * 0.001);
        this.transform.localPosition = pos;
    }

    flyDown(v: number) {
        let pos = this.transform.down.clone().multiplyScalar(v);
        this.transform.localPosition.add(pos, pos);
        pos = lerpVector3(this.transform.localPosition, pos, Time.delta * 0.001);
        this.transform.localPosition = pos;
    }

    rotationXDetail(v: number) {
        let alpha = lerp(this.transform.rotationX, this.transform.rotationX + v, 1 / 10000 + Time.delta * 0.001);
        this.transform.rotationX = alpha;
    }

    rotationYDetail(v: number) {
        let alpha = lerp(this.transform.rotationY, this.transform.rotationY + v, 1 / 10000 + Time.delta * 0.001);
        this.transform.rotationY = alpha;
    }

}