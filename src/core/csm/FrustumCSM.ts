import { Color } from "../../math/Color";
import { Matrix4 } from "../../math/Matrix4";
import { Vector3 } from "../../math/Vector3";
import { ShadowSetting } from "../../setting/ShadowSetting";
import { CameraUtil } from "../../util/CameraUtil";
import { Camera3D } from "../Camera3D";
import { BoundingBox } from "../bound/BoundingBox";

class FrustumSection {
    public corners: Vector3[];
    public index: number;
    constructor(index: number) {
        this.index = index;
        this.corners = [];
        for (let i = 0; i < 4; i++) {
            this.corners.push(new Vector3());
        }
    }
}

class FrustumChild {
    public bound: BoundingBox;
    public twoSections: FrustumSection[];
    public name: string;
    public color: Color;
    public shadowCamera: Camera3D;
    public readonly index: number;


    constructor(near: FrustumSection, far: FrustumSection, index: number) {
        this.bound = new BoundingBox();
        this.shadowCamera = CameraUtil.createCamera3DObject(null, 'csmShadowCamera_' + index);
        this.shadowCamera.isShadowCamera = true;
        this.shadowCamera.orthoOffCenter(100, -100, 100, -100, 1, 10000);

        this.twoSections = [near, far];
        this.index = index;
        if (index == 0) {
            this.color = new Color(1, 0, 0, 1);
        } else if (index == 1) {
            this.color = new Color(0, 1, 0, 1);
        }
        else if (index == 2) {
            this.color = new Color(0, 0, 1, 1);
        }
        else if (index == 3) {
            this.color = new Color(0, 1, 1, 1);
        }
        this.name = 'child_' + index;
    }

    public updateBound(): this {
        this.bound.makeEmpty();

        let min = this.bound.min;
        let max = this.bound.max;
        for (let section of this.twoSections) {
            for (let pt of section.corners) {
                min.x = Math.min(pt.x, min.x);
                min.y = Math.min(pt.y, min.y);
                min.z = Math.min(pt.z, min.z);

                max.x = Math.max(pt.x, max.x);
                max.y = Math.max(pt.y, max.y);
                max.z = Math.max(pt.z, max.z);
            }
        }

        this.bound.setFromMinMax(min, max);
        return this;
    }
}

export class FrustumCSM {
    public sections: FrustumSection[];
    public children: FrustumChild[];
    public name: string;

    constructor(blockCount: number) {
        this.sections = [];
        let sectionCount = blockCount + 1;
        for (let i = 0; i < sectionCount; i++) {
            this.sections.push(new FrustumSection(i));
        }

        this.children = [];
        for (let i = 0; i < blockCount; i++) {
            this.children.push(new FrustumChild(this.sections[i], this.sections[i + 1], i));
        }
    }

    update(p: Matrix4, pvInv: Matrix4, near: number, far: number, shadowSetting: ShadowSetting): this {
        let blockCount = this.sections.length - 1;
        for (let z = 0; z <= blockCount; ++z) {
            let section = this.sections[z];
            let cornerIndex = 0;
            // let worldZ = this.squareSplit(near, far, z, this.sections.length);
            let worldZ = this.logSplit(near, far, z, this.sections.length);
            {
                let scale = (worldZ - near) / far;
                scale = scale ** shadowSetting.csmScatteringExp;
                worldZ = (far - near) * scale + near;
            }

            worldZ *= shadowSetting.csmAreaScale;

            let depth = (p.rawData[10] * worldZ + p.rawData[14]) / worldZ;
            for (let x = 0; x < 2; ++x) {
                for (let y = 0; y < 2; ++y) {
                    let pt = section.corners[cornerIndex];
                    cornerIndex++;
                    pt.set(2.0 * x - 1.0, 2.0 * y - 1.0, depth, 1.0);
                    pvInv.transformVector4(pt, pt);
                    pt.div(pt.w, pt);
                }
            }
        }

        for (let miniFrustum of this.children) {
            miniFrustum.updateBound();
        }
        return this;
    }

    private squareSplit(near: number, far: number, index: number, max: number): number {
        let ratio = index / (max - 1);
        return (ratio ** 4) * (far - near) + near;
    }

    private uniformSplit(near: number, far: number, index: number, max: number): number {
        let ratio = index / (max - 1);
        return ratio * (far - near) + near;
    }

    private logSplit(near: number, far: number, index: number, max: number): number {
        let ratio = near * (far / near) ** (index / (max - 1));
        return ratio;
    }

}