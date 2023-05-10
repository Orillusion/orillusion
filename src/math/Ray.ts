import { IBound } from "../core/bound/IBound";
import { Triangle } from "./Triangle";
import { dot, sqrMagnitude } from "./MathUtil";
import { Matrix4 } from "./Matrix4";
import { Vector3 } from "./Vector3";

/**
 * Ray
 * @group Math
 */
export class Ray {

    /**
     * Ray starting point
     */
    public origin: Vector3 = new Vector3();

    /**
     * length
     */
    public length: number = Number.MAX_VALUE;

    private static _rayl = 10e8;
    private static _smallnum = 0.00000001;
    private _vector: Vector3 = new Vector3();
    private _dir: Vector3 = new Vector3();


    /**
     * Build a new ray object
     * @param origin Ray starting point
     * @param dir Ray direction
     */
    constructor(origin?: Vector3, dir?: Vector3) {
        this.origin.copyFrom(origin || new Vector3());
        this._dir.copyFrom(dir || new Vector3());
        this._dir.normalize();
    }

    /**
     * Ray direction
     */
    public get direction(): Vector3 {
        return this._dir;
    }

    public set direction(dir: Vector3) {
        this._dir.copyFrom(dir);
        this._dir.normalize();
    }

    /**
     * Clone a new Ray object
     * @returns 
     */
    public clone(): Ray {
        return new Ray(this.origin, this.direction);
    }

    /**
     * Determine whether it intersects a bounding box
     * @param box bounding box
     * @returns whether intersect
     */
    // public intersectsBox(box: IBound): boolean {
    //     return this.intersectBox(box, this._vector) !== null;
    // }

    public intersectBox(box: IBound, target?: Vector3): Vector3 {
        if (!target) {
            target = new Vector3();
        }
        let direction = this.direction;
        let origin = this.origin;
        let tMin: number;
        let tMax: number;
        let tYMin: number;
        let tYMax: number;
        let tZMin: number;
        let tZMax: number;
        const invDirX = 1 / direction.x;
        const invDirY = 1 / direction.y;
        const invDirZ = 1 / direction.z;
        const min = box.min;
        const max = box.max;
        tMin = ((invDirX >= 0 ? min.x : max.x) - origin.x) * invDirX;
        tMax = ((invDirX >= 0 ? max.x : min.x) - origin.x) * invDirX;
        tYMin = ((invDirY >= 0 ? min.y : max.y) - origin.y) * invDirY;
        tYMax = ((invDirY >= 0 ? max.y : min.y) - origin.y) * invDirY;
        if (tMin > tYMax || tYMin > tMax) {
            return null
        }
        if (tYMin > tMin) {
            tMin = tYMin;
        }
        if (tYMax < tMax) {
            tMax = tYMax;
        }
        tZMin = ((invDirZ >= 0 ? min.z : max.z) - origin.z) * invDirZ;
        tZMax = ((invDirZ >= 0 ? max.z : min.z) - origin.z) * invDirZ;
        if (tMin > tZMax || tZMin > tMax) {
            return null
        }
        if (tZMin > tMin) {
            tMin = tZMin;
        }
        if (tZMax < tMax) {
            tMax = tZMax;
        }
        if (tMax < 0) {
            return null;
        }
        return this.pointAt(tMin >= 0 ? tMin : tMax, target);
    }

    /**
     * Calculate a point on the ray
     * @param t Length scalar
     * @param target output target
     * @returns result
     */
    public pointAt(t: number, target: Vector3) {
        if (!target) {
            target = new Vector3();
        }
        target.copy(this.direction);
        target.multiplyScalar(t);
        target.add(this.origin, target);
        return target;
    }

    /**
     * Sets the ray to be a copy of the original ray
     * @param src Ray object source
     * @returns New ray object
     */
    public copy(src: Ray): this {
        this.origin.copy(src.origin);
        this.direction.copy(src.direction);
        this._dir.copy(src._dir);
        this.length = src.length;
        return this;
    }

    /**
     * Fast to the approximate ray direction
     * @param dir direction
     */
    public setApproxDirection(dir: Vector3) {
        this._dir = dir.normalize();
    }

    /**
     * Set ray origin
     * @param origin ray origin
     */
    public setOrigin(origin: Vector3) {
        this.origin.copyFrom(origin);
    }

    /**
     * Get ray origin
     */
    public getOrigin(): Vector3 {
        return this.origin;
    }

    /**
     * Gets the point at the specified position on the ray
     * @param t Length position
     * @returns Returns a point at the specified location
     */
    public getPoint(t: number): Vector3 {
        this._dir.scaleBy(t);
        return this.origin.add(this._dir); // + t * m_Direction;
    }

    /**
     * Calculate the distance from a point
     * @param P Specify Point
     * @returns result
     */
    public sqrDistToPoint(P: Vector3): number {
        let v = this._dir;
        let w = P.subtract(this.origin);

        let c1 = dot(w, v);
        let c2 = dot(v, v);
        let b = c1 / c2;

        let Pb = this.getPoint(b);
        return sqrMagnitude(P.subtract(Pb));
    }

    /**
     * Applied matrix transformation
     * @param mat4 matrix
     */
    public applyMatrix(mat4: Matrix4) {
        this.origin = mat4.transformPoint(this.origin);
        this._dir = mat4.transformVector(this._dir);
    }

    private _v0 = new Vector3();
    private _v1 = new Vector3();
    private _v2 = new Vector3();

    /**
     * Calculates whether a specified point is inside a triangle
     * @param P point
     * @param A Triangle vertex 1
     * @param B Triangle vertex 2
     * @param C Triangle vertex 3
     * @returns whether it is inside a triangle
     */
    public pointInTriangle(P: Vector3, A: Vector3, B: Vector3, C: Vector3): boolean {
        let v0 = this._v0;
        let v1 = this._v1;
        let v2 = this._v2;

        C.subtract(A, v0);
        B.subtract(A, v1);
        P.subtract(A, v2);

        // Compute dot products
        let dot00 = Vector3.dot(v0, v0);
        let dot01 = Vector3.dot(v0, v1);
        let dot02 = Vector3.dot(v0, v2);
        let dot11 = Vector3.dot(v1, v1);
        let dot12 = Vector3.dot(v1, v2);

        // Compute barycentric coordinates
        let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        // Check if point is in triangle
        return u >= 0 && v >= 0 && u + v < 1;
    }

    // Determine whether a ray intersect with a triangle
    // Parameters
    // orig: origin of the ray
    // dir: direction of the ray
    // v0, v1, v2: vertices of triangle
    // t(out): weight of the intersection for the ray
    // u(out), v(out): barycentric coordinate of intersection
    private _E1: Vector3 = new Vector3();
    private _E2: Vector3 = new Vector3();
    private _P: Vector3 = new Vector3();
    private _T: Vector3 = new Vector3();
    private _Q: Vector3 = new Vector3();

    /**
     * Determine whether a ray intersects a triangle
     * @param orig Ray starting point
     * @param dir Ray direction
     * @param face triangle
     * @returns point of intersection
     */
    public intersectTriangle(orig: Vector3, dir: Vector3, face: Triangle): Vector3 {
        let v0: Vector3 = face.v1;
        let v1: Vector3 = face.v2;
        let v2: Vector3 = face.v3;

        // E1s
        v1.subtract(v0, this._E1);

        // E2
        v2.subtract(v0, this._E2);

        // P
        dir.cross(this._E2, this._P);

        // determinant
        let det = this._E1.dotProduct(this._P);

        // keep det > 0, modify T accordingly
        if (det > 0) {
            orig.subtract(v0, this._T);
        } else {
            v0.subtract(orig, this._T);
            det = -det;
        }

        // If determinant is near zero, ray lies in plane of triangle
        if (det < 0.0001) return null;

        // Calculate u and make sure u <= 1
        face.u = this._T.dotProduct(this._P);
        if (face.u < 0.0 || face.u > det) return null;

        // Q
        this._T.cross(this._E1, this._Q);

        // Calculate v and make sure u + v <= 1
        face.v = dir.dotProduct(this._Q);
        if (face.v < 0.0 || face.u + face.v > det) return null;

        let hit = new Vector3();
        // Calculate t, scale parameters, ray intersects triangle
        face.t0 = face.t = this._E2.dotProduct(this._Q);

        let fInvDet = 1.0 / det;
        face.t *= fInvDet;
        face.u *= fInvDet;
        face.v *= fInvDet;

        hit.x = orig.x + face.t * dir.x;
        hit.y = orig.y + face.t * dir.y;
        hit.z = orig.z + face.t * dir.z;

        return hit;
    }

    /**
     * Determine whether a ray intersects the sphere
     * @param o Ray starting point
     * @param dir Ray direction
     * @param center Sphere center
     * @param radius radius of sphericity
     * @returns point of intersection
     */
    public intersectSphere(o: Vector3, dir: Vector3, center: Vector3, radius: number): Vector3 {
        let oc = o.subtract(center);
        let a = Vector3.dot(dir, dir);
        let b = 2 * Vector3.dot(oc, dir);
        let c = Vector3.dot(oc, oc) - radius * radius;
        let dt = b * b - 4 * a * c;

        let hit: Vector3 = Vector3.HELP_3;
        if (dt < 0) {
            return null;
        } else {
            let t0 = (-b - Math.sqrt(dt)) / (a * 2);
            if (t0 < 0) {
                return null;
            }

            hit.x = o.x + t0 * dir.x;
            hit.y = o.y + t0 * dir.y;
            hit.z = o.z + t0 * dir.z;
            //let v = { hit.x - o.x, hit.y - o.y, hit.z - o.z };
            return hit;
        }
    }

    /**
     * A test of the intersection between a ray and 
     * a given line segment within a given tolerance (threshold)
     * @param sega The first point of a line segment used to test the intersection
     * @param segb The second point of a line segment used to test the intersection
     * @param threshold Margin, if the ray does not intersect the line segment but is close to the given threshold, the intersection is successful
     * @return If there is an intersection, then the distance from the ray origin to the intersection, if there is no intersection, is -1
     */
    public intersectionSegment(sega: Vector3, segb: Vector3, threshold: number): { out: Vector3; length: number; } {
        const o = this.origin;
        const u = Vector3.HELP_0;
        const rsegb = Vector3.HELP_1;
        const v = Vector3.HELP_2;
        const w = Vector3.HELP_3;

        segb.subtract(sega, u);
        this._dir.scaleToRef(Ray._rayl, v);
        o.add(v, rsegb);

        sega.subtract(o, w);

        var a = Vector3.dot(u, u); // always >= 0
        var b = Vector3.dot(u, v);
        var c = Vector3.dot(v, v); // always >= 0
        var d = Vector3.dot(u, w);
        var e = Vector3.dot(v, w);
        var det = a * c - b * b; // always >= 0
        var sc: number,
            sN: number,
            sD = det; // sc = sN / sD, default sD = D >= 0
        var tc: number,
            tN: number,
            tD = det; // tc = tN / tD, default tD = D >= 0

        // compute the line parameters of the two closest points
        if (det < Ray._smallnum) {
            // the lines are almost parallel
            sN = 0.0; // force using point P0 on segment S1
            sD = 1.0; // to prevent possible division by 0.0 later
            tN = e;
            tD = c;
        } else {
            // get the closest points on the infinite lines
            sN = b * e - c * d;
            tN = a * e - b * d;
            if (sN < 0.0) {
                // sc < 0 => the s=0 edge is visible
                sN = 0.0;
                tN = e;
                tD = c;
            } else if (sN > sD) {
                // sc > 1 => the s=1 edge is visible
                sN = sD;
                tN = e + b;
                tD = c;
            }
        }

        if (tN < 0.0) {
            // tc < 0 => the t=0 edge is visible
            tN = 0.0;
            // recompute sc for this edge
            if (-d < 0.0) {
                sN = 0.0;
            } else if (-d > a) {
                sN = sD;
            } else {
                sN = -d;
                sD = a;
            }
        } else if (tN > tD) {
            // tc > 1 => the t=1 edge is visible
            tN = tD;
            // recompute sc for this edge
            if (-d + b < 0.0) {
                sN = 0;
            } else if (-d + b > a) {
                sN = sD;
            } else {
                sN = -d + b;
                sD = a;
            }
        }
        // finally do the division to get sc and tc
        sc = Math.abs(sN) < Ray._smallnum ? 0.0 : sN / sD;
        tc = Math.abs(tN) < Ray._smallnum ? 0.0 : tN / tD;

        // get the difference of the two closest points
        const qtc = Vector3.HELP_4;
        v.scaleToRef(tc, qtc);
        const qsc = Vector3.HELP_5;
        u.scaleToRef(sc, qsc);
        qsc.add(w, qsc);
        const dP = Vector3.HELP_6;
        qsc.subtract(qtc, dP); // = S1(sc) - S2(tc)

        var isIntersected = tc > 0 && tc <= this._dir.length && dP.lengthSquared < threshold * threshold; // return intersection result

        if (isIntersected) {
            let dd0 = new Vector3();
            dd0.copyFrom(segb.subtract(sega));
            dd0.scaleBy(sc);
            dd0.add(sega, dd0);
            // let out = new Vector3(dx,dy,dz);
            return { out: dd0, length: qsc.length };
        }
        return { out: null, length: -1 };
    }

    private get_vec(p: Vector3, q: Vector3) {
        let rc = Vector3.HELP_1;
        rc.x = p.x - q.x;
        rc.y = p.y - q.y;
        rc.z = p.z - q.z;
        return rc;
    }
}
