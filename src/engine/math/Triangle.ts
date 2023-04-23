import { Line } from './Line';
import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';

/**
 * @internal
 * @group Math
 */
export class Triangle {
    public static ID: number = -1;
    public v1: Vector3;
    public v2: Vector3;
    public v3: Vector3;

    public u1: Vector2;
    public u2: Vector2;
    public u3: Vector2;

    public n1: Vector3;
    public n2: Vector3;
    public n3: Vector3;

    public t0: number;
    public t: number;
    public u: number;
    public v: number;

    public min = new Vector3();
    public max = new Vector3();
    public id: number = 0;

    constructor(v1?: Vector3, v2?: Vector3, v3?: Vector3) {
        this.id = Triangle.ID++ + 200;
        v1 && v2 && v3 && this.set(v1, v2, v3);
    }

    public set(v1: Vector3, v2: Vector3, v3: Vector3): this {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;

        let min = this.min;
        let max = this.max;

        min.x = Math.min(this.v1.x, this.v2.x, this.v3.x);
        min.y = Math.min(this.v1.y, this.v2.y, this.v3.y);
        min.z = Math.min(this.v1.z, this.v2.z, this.v3.z);

        max.x = Math.max(this.v1.x, this.v2.x, this.v3.x);
        max.y = Math.max(this.v1.y, this.v2.y, this.v3.y);
        max.z = Math.max(this.v1.z, this.v2.z, this.v3.z);
        return this;
    }

    public getNormal(): Vector3 {
        let v1 = this.v1;
        let v2 = this.v2;
        let v3 = this.v3;

        let edge1 = new Vector3(v2.x - v1.x, v2.y - v1.y, v2.z - v1.z);
        let edge2 = new Vector3(v3.x - v1.x, v3.y - v1.y, v3.z - v1.z);

        let normal = edge2.cross(edge1);
        normal.normalize();
        return normal;
    }

    public turnBack() {
        let tmp = this.v3;
        this.v3 = this.v1;
        this.v1 = tmp;
    }

    public getLines(): Line[] {
        let v1 = this.v1;
        let v2 = this.v2;
        let v3 = this.v3;
        let l = [new Line(v1, v2), new Line(v2, v3), new Line(v3, v1)];
        return l;
    }

    public equals(t: Triangle): boolean {
        let lines1: Line[] = this.getLines();
        let lines2: Line[] = t.getLines();

        let cnt = 0;
        for (let i = 0; i < lines1.length; i++) {
            for (let j = 0; j < lines2.length; j++) {
                if (lines1[i].equals(lines2[j])) cnt++;
            }
        }
        if (cnt == 3) return true;
        else return false;
    }

    /**
     * name
     */
    public getCenter(): Vector3 {
        let min = this.min;
        let max = this.max;
        let center = new Vector3();
        center.x = (min.x + max.x) * 0.5;
        center.y = (min.y + max.y) * 0.5;
        center.z = (min.z + max.z) * 0.5;
        return center;
    }

    /**
     * @function
     * @returns {Boolean} return intersection.
     */
    public intersects(other: Triangle): boolean {
        var aMax = this.max;
        var aMin = this.min;
        var bMax = other.max;
        var bMin = other.min;

        return aMin.x <= bMax.x && aMax.x >= bMin.x && aMin.y <= bMax.y && aMax.y >= bMin.y && aMin.z <= bMax.z && aMax.z >= bMin.z;
    }

    public sign2D(p1: Vector3, p2: Vector3, p3: Vector3) {
        return (p1.x - p3.x) * (p2.z - p3.z) - (p2.x - p3.x) * (p1.z - p3.z);
    }

    public pointInTriangle2D(pt: Vector3) {
        let v1: Vector3 = this.v1;
        let v2: Vector3 = this.v2;
        let v3: Vector3 = this.v3;
        let d1, d2, d3;
        let has_neg, has_pos;

        d1 = this.sign2D(pt, v1, v2);
        d2 = this.sign2D(pt, v2, v3);
        d3 = this.sign2D(pt, v3, v1);

        has_neg = d1 < 0 || d2 < 0 || d3 < 0;
        has_pos = d1 > 0 || d2 > 0 || d3 > 0;

        return !(has_neg && has_pos);
    }

    public toArray() {
        return [this.v1.x, this.v1.y, this.v1.z, this.v2.x, this.v2.y, this.v2.z, this.v3.x, this.v3.y, this.v3.z];
    }
}
