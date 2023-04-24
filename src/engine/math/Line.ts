import { Color } from './Color';
import { Matrix4 } from './Matrix4';
import { Ray } from './Ray';
import { Vector3 } from './Vector3';
import { repeat } from './MathUtil';
/**
 * @internal
 */
export enum LineClassification {
    COLLINEAR,
    LINES_INTERSECT,
    SEGMENTS_INTERSECT,
    A_BISECTS_B,
    B_BISECTS_A,
    PARALELL,
}
/**
 * @internal
 */
export enum PointClassification {
    ON_LINE,
    LEFT_SIDE,
    RIGHT_SIDE,
}
/**
 * @internal
 * @group Math
 */
export class Line {
    static cacluteLine0: Line = new Line(null, null);
    static cacluteLine1: Line = new Line(null, null);

    public start: Vector3;
    public end: Vector3;
    public color: Color = new Color(1, 1, 1, 1);
    private _normal: Vector3;
    private _normalCalculated: boolean = false;

    constructor(start?: Vector3, end?: Vector3) {
        this.start = start;
        this.end = end;
    }

    public set(start: Vector3, end: Vector3) {
        this.start = start;
        this.end = end;
    }

    public getCenter(): Vector3 {
        let help = Vector3.HELP_0;
        this.start.subtract(this.end, help);
        help.scaleBy(0.5);
        help.add(this.end);
        return help;
    }

    public inverse() {
        let tmp = this.start;
        this.start = this.end;
        this.end = tmp;
    }

    public equals(l: Line): boolean {
        if ((this.start == l.start && this.end == l.end) || (this.start == l.end && this.end == l.start)) return true;
        return false;
    }

    /**
     */
    public toArray() {
        return [this.start.x, this.start.y, this.start.z, this.end.x, this.end.y, this.end.z];
    }

    /**
     * @param ps
     */
    public static getLines(ps: Vector3[]): Line[] {
        let arr: Line[] = [];
        for (let index = 0; index < ps.length; index++) {
            let i0 = index;
            let i1 = repeat(index + 1, ps.length);
            let p0 = ps[i0];
            let p1 = ps[i1];
            arr.push(new Line(p0, p1));
        }
        return arr;
    }

    /**
     * Determine the relationship between two straight lines
     * this line A = x0, y0 and B = x1, y1
     * other is A = x2, y2 and B = x3, y3
     * @param other compare other line
     * @param pIntersectPoint (out)Returns the intersection point of two line segments
     * @return
     */
    public intersection(other: Line, pIntersectPoint: Vector3 = null): LineClassification {
        var denom: number = (other.end.z - other.start.z) * (this.end.x - this.start.x) - (other.end.x - other.start.x) * (this.end.z - this.start.z);

        var u0: number = (other.end.x - other.start.x) * (this.start.z - other.start.z) - (other.end.z - other.start.z) * (this.start.x - other.start.x);

        var u1: number = (other.start.x - this.start.x) * (this.end.z - this.start.z) - (other.start.z - this.start.z) * (this.end.x - this.start.x);

        //if parallel
        if (denom == 0.0) {
            if (u0 == 0.0 && u1 == 0.0) return LineClassification.COLLINEAR;
            else return LineClassification.PARALELL;
        } else {
            u0 = u0 / denom;
            u1 = u1 / denom;

            var x: number = this.start.x + u0 * (this.end.x - this.start.x);
            var z: number = this.start.z + u0 * (this.end.z - this.start.z);

            if (pIntersectPoint != null) {
                pIntersectPoint.x = x;
                pIntersectPoint.y = 0;
                pIntersectPoint.z = z;
            }

            if (u0 >= 0.0 && u0 <= 1.0 && u1 >= 0.0 && u1 <= 1.0) {
                return LineClassification.SEGMENTS_INTERSECT;
            } else if (u1 >= 0.0 && u1 <= 1.0) {
                return LineClassification.A_BISECTS_B;
            } else if (u0 >= 0.0 && u0 <= 1.0) {
                return LineClassification.B_BISECTS_A;
            }

            return LineClassification.LINES_INTERSECT;
        }
    }

    /**
     * Straight direction
     * @return
     */
    public getDirection(): Vector3 {
        var pt: Vector3 = this.end.subtract(this.start);
        var direction: Vector3 = new Vector3(pt.x, pt.y);
        return direction.normalize();
    }

    copyFrom(line: Line) {
        if (!this.start) this.start = new Vector3();
        if (!this.end) this.end = new Vector3();
        this.start.copyFrom(line.start);
        this.end.copyFrom(line.end);
    }

    public static IsEqual(d1, d2) {
        if (Math.abs(d1 - d2) < 1e-7) return true;
        return false;
    }

    public static squreDistanceSegmentToSegment(lineA: Line, lineB: Line, mat?: Matrix4) {
        let a_po: Vector3 = lineA.start;
        let a_p1: Vector3 = lineA.end;

        let b_po: Vector3 = lineB.start;
        let b_p1: Vector3 = lineB.end;

        let x1 = a_po.x;
        let y1 = a_po.y;
        let z1 = a_po.z;

        let x2 = a_p1.x;
        let y2 = a_p1.y;
        let z2 = a_p1.z;

        let x3 = b_po.x;
        let y3 = b_po.y;
        let z3 = b_po.z;

        let x4 = b_p1.x;
        let y4 = b_p1.y;
        let z4 = b_p1.z;

        let ux = x2 - x1;
        let uy = y2 - y1;
        let uz = z2 - z1;

        let vx = x4 - x3;
        let vy = y4 - y3;
        let vz = z4 - z3;

        let wx = x1 - x3;
        let wy = y1 - y3;
        let wz = z1 - z3;

        let a = ux * ux + uy * uy + uz * uz;
        let b = ux * vx + uy * vy + uz * vz;
        let c = vx * vx + vy * vy + vz * vz;
        let d = ux * wx + uy * wy + uz * wz;
        let e = vx * wx + vy * wy + vz * wz;
        let dt = a * c - b * b;

        let sd = dt;
        let td = dt;

        let sn = 0.0;
        let tn = 0.0;

        if (this.IsEqual(dt, 0.0)) {
            sn = 0.0;
            sd = 1.0;

            tn = e;
            td = c;
        } else {
            sn = b * e - c * d;
            tn = a * e - b * d;
            if (sn < 0.0) {
                sn = 0.0;
                tn = e;
                td = c;
            } else if (sn > sd) {
                sn = sd;
                tn = e + b;
                td = c;
            }
        }
        if (tn < 0.0) {
            tn = 0.0;
            if (-d < 0.0)
                sn = 0.0;
            else if (-d > a)
                sn = sd;
            else {
                sn = -d;
                sd = a;
            }
        } else if (tn > td) {
            tn = td;
            if (-d + b < 0.0) sn = 0.0;
            else if (-d + b > a) sn = sd;
            else {
                sn = -d + b;
                sd = a;
            }
        }

        let sc = 0.0;
        let tc = 0.0;

        if (this.IsEqual(sn, 0.0)) sc = 0.0;
        else sc = sn / sd;

        if (this.IsEqual(tn, 0.0)) tc = 0.0;
        else tc = tn / td;

        let dx = wx + sc * ux - tc * vx;
        let dy = wy + sc * uy - tc * vy;
        let dz = wz + sc * uz - tc * vz;
        return dx * dx + dy * dy + dz * dz;
    }

    /**
     * isNearLine
     */
    public isNear(ray: Ray, maxDistance: number = 0, mat?: Matrix4): boolean {
        // //@task to-do
        let tmpP0 = Vector3.HELP_0;
        let tmpP1 = Vector3.HELP_1;
        tmpP0.copyFrom(ray.origin);
        tmpP1.copyFrom(ray.direction);

        tmpP1.scaleBy(9999);
        tmpP1.add(tmpP0, tmpP1);
        Line.cacluteLine0.set(tmpP0, tmpP1);
        Line.cacluteLine1.copyFrom(this);

        if (mat) {
            mat.perspectiveMultiplyPoint3(Line.cacluteLine1.start, Line.cacluteLine1.start);
            mat.perspectiveMultiplyPoint3(Line.cacluteLine1.end, Line.cacluteLine1.end);
        }

        let dis = Line.squreDistanceSegmentToSegment(Line.cacluteLine0, Line.cacluteLine1, mat);
        if (dis + 1e-4 <= maxDistance) {
            ray.length = dis;
            return true;
        }
        ray.length = -999999;
        return false;
    }
}
