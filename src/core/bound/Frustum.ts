import { BoundingSphere } from './BoundingSphere';
import { Matrix4 } from '../../math/Matrix4';
import { Object3D } from '../entities/Object3D';
import { Vector3 } from '../../math/Vector3';
import { BoundingBox } from './BoundingBox';

/**
 * @internal
 * @group Core
 */
export class Frustum {
    public planes: Vector3[];
    public corners: Vector3[];
    public boundingBox: BoundingBox = new BoundingBox();

    constructor() {
        this.planes = [];
        this.corners = [];
        for (var i = 0; i < 6; i++) this.planes[i] = new Vector3();
        for (var i = 0; i < 2 * 2 * 2; i++) this.corners[i] = new Vector3();
    }

    public updateBoundBox(pvInv: Matrix4): this {
        this.boundingBox.makeEmpty();
        let min = this.boundingBox.min;
        let max = this.boundingBox.max;
        let i = 0;
        for (let x = 0; x < 2; ++x) {
            for (let y = 0; y < 2; ++y) {
                for (let z = 0; z < 2; ++z) {
                    let pt = this.corners[i];
                    i++;
                    pt.set(2.0 * x - 1.0, 2.0 * y - 1.0, z, 1.0);
                    pvInv.transformVector4(pt, pt);
                    pt.div(pt.w, pt);
                    min.x = Math.min(pt.x, min.x);
                    min.y = Math.min(pt.y, min.y);
                    min.z = Math.min(pt.z, min.z);

                    max.x = Math.max(pt.x, max.x);
                    max.y = Math.max(pt.y, max.y);
                    max.z = Math.max(pt.z, max.z);
                }
            }
        }
        this.boundingBox.setFromMinMax(min, max);
        return this;
    }

    setFrustumCorners(pvInv: Matrix4) {
        let i = 0;
        for (let x = 0; x < 2; ++x) {
            for (let y = 0; y < 2; ++y) {
                for (let z = 0; z < 2; ++z) {
                    let pt = this.corners[i];
                    pt.set(2.0 * x - 1.0, 2.0 * y - 1.0, z, 1.0);
                    pvInv.transformVector4(pt, pt);
                    pt.div(pt.w, pt);
                    i++;
                }
            }
        }
    }

    public update(vpMatrix: Matrix4) {
        var vpm = vpMatrix.rawData;

        this.planes[0].x = vpm[3] - vpm[0];
        this.planes[0].y = vpm[7] - vpm[4];
        this.planes[0].z = vpm[11] - vpm[8];
        this.planes[0].w = vpm[15] - vpm[12];
        var t = Math.sqrt(this.planes[0].x * this.planes[0].x + this.planes[0].y * this.planes[0].y + this.planes[0].z * this.planes[0].z);
        this.planes[0].x /= t;
        this.planes[0].y /= t;
        this.planes[0].z /= t;
        this.planes[0].w /= t;

        this.planes[1].x = vpm[3] + vpm[0];
        this.planes[1].y = vpm[7] + vpm[4];
        this.planes[1].z = vpm[11] + vpm[8];
        this.planes[1].w = vpm[15] + vpm[12];
        t = Math.sqrt(this.planes[1].x * this.planes[1].x + this.planes[1].y * this.planes[1].y + this.planes[1].z * this.planes[1].z);
        this.planes[1].x /= t;
        this.planes[1].y /= t;
        this.planes[1].z /= t;
        this.planes[1].w /= t;

        this.planes[2].x = vpm[3] + vpm[1];
        this.planes[2].y = vpm[7] + vpm[5];
        this.planes[2].z = vpm[11] + vpm[9];
        this.planes[2].w = vpm[15] + vpm[13];
        t = Math.sqrt(this.planes[2].x * this.planes[2].x + this.planes[2].y * this.planes[2].y + this.planes[2].z * this.planes[2].z);
        this.planes[2].x /= t;
        this.planes[2].y /= t;
        this.planes[2].z /= t;
        this.planes[2].w /= t;

        this.planes[3].x = vpm[3] - vpm[1];
        this.planes[3].y = vpm[7] - vpm[5];
        this.planes[3].z = vpm[11] - vpm[9];
        this.planes[3].w = vpm[15] - vpm[13];
        t = Math.sqrt(this.planes[3].x * this.planes[3].x + this.planes[3].y * this.planes[3].y + this.planes[3].z * this.planes[3].z);
        this.planes[3].x /= t;
        this.planes[3].y /= t;
        this.planes[3].z /= t;
        this.planes[3].w /= t;

        this.planes[4].x = vpm[3] - vpm[2];
        this.planes[4].y = vpm[7] - vpm[6];
        this.planes[4].z = vpm[11] - vpm[10];
        this.planes[4].w = vpm[15] - vpm[14];
        t = Math.sqrt(this.planes[4].x * this.planes[4].x + this.planes[4].y * this.planes[4].y + this.planes[4].z * this.planes[4].z);
        this.planes[4].x /= t;
        this.planes[4].y /= t;
        this.planes[4].z /= t;
        this.planes[4].w /= t;

        this.planes[5].x = vpm[3] + vpm[2];
        this.planes[5].y = vpm[7] + vpm[6];
        this.planes[5].z = vpm[11] + vpm[10];
        this.planes[5].w = vpm[15] + vpm[14];
        t = Math.sqrt(this.planes[5].x * this.planes[5].x + this.planes[5].y * this.planes[5].y + this.planes[5].z * this.planes[5].z);
        this.planes[5].x /= t;
        this.planes[5].y /= t;
        this.planes[5].z /= t;
        this.planes[5].w /= t;
    }

    public containsPoint(point: Vector3) {
        for (var p = 0; p < 6; p++) {
            if (this.planes[p].x * point.x + this.planes[p].y * point.y + this.planes[p].z * point.z + this.planes[p].w <= 0) return false;
        }
        return true;
    }

    public containsSphere(object3D: Object3D) {
        let sphere: BoundingSphere = object3D.bound as BoundingSphere;
        let c: number = 0;
        let d: number;

        let worldPos = object3D.transform.worldPosition;

        let sr = sphere.radius;
        let scx = sphere.center.x + worldPos.x;
        let scy = sphere.center.y + worldPos.y;
        let scz = sphere.center.z + worldPos.z;

        for (let plane of this.planes) {
            d = plane.x * scx + plane.y * scy + plane.z * scz + plane.w;
            if (d <= -sr) return 0;
            if (d > sr) c++;
        }

        return c === 6 ? 2 : 1;
    }

    public containsBox(box): number {
        let c = 0;
        let d;

        let r = Math.max(box.size.x, box.size.y, box.size.z);
        let sr = r * 2;
        let scx = box.center.x;
        let scy = box.center.y;
        let scz = box.center.z;

        for (let plane of this.planes) {
            d = plane.x * scx + plane.y * scy + plane.z * scz + plane.w;
            if (d <= -sr) return 0;
            if (d > sr) c++;
        }

        return c === 6 ? 2 : 1;
    }

    public containsBox2(box): number {
        let c = 0;
        let d;
        let r = 1.74 * Math.max(box.extents.x, box.extents.y, box.extents.z);//sqrt(3)
        for (let plane of this.planes) {
            d = plane.x * box.center.x + plane.y * box.center.y + plane.z * box.center.z + plane.w;
            if (d <= -r) return 0;
            if (d > r) c++;
        }
        return c === 6 ? 2 : 1;
    }
}
