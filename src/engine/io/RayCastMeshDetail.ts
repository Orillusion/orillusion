import { Triangle } from '../math/Triangle';
import { dot } from '../math/MathUtil';
import { Ray } from '../math/Ray';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { PickResult } from './PickResult';
/**
 * @internal
 * @group IO
 */
export class RayCastMeshDetail {
    /**
     * define a tiny number
     */
    public static EPS: number = 1e-4;

    /**
     * define a maximum float
     */
    public static FLT_MAX: number = 3.402823466e38;

    /**
     * calculate the distance between a point and a plane(defined by point a, point b, point c)
     */
    public static distPtTri(p: Vector3, a: Vector3, b: Vector3, c: Vector3): number {
        let v0 = new Vector3();
        let v1 = new Vector3();
        let v2 = new Vector3();
        c.subtract(a, v0);
        b.subtract(a, v1);
        p.subtract(a, v2);

        let dot00 = dot(v0, v0);
        let dot01 = dot(v0, v1);
        let dot02 = dot(v0, v2);
        let dot11 = dot(v1, v1);
        let dot12 = dot(v1, v2);

        // Compute barycentric coordinates
        let invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
        let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        // If point lies inside the triangle, return interpolated y-coord.
        if (u >= -RayCastMeshDetail.EPS && v >= -RayCastMeshDetail.EPS && u + v <= 1 + RayCastMeshDetail.EPS) {
            let y = a[1] + v0[1] * u + v1[1] * v;
            return Math.abs(y - p[1]);
        }
        return RayCastMeshDetail.FLT_MAX;
    }

    private static _info: PickResult = new PickResult();
    // Determine whether a ray intersect with a triangle
    // Parameters
    // orig: origin of the ray
    // dir: direction of the ray
    // v0, v1, v2: vertices of triangle
    // t(out): weight of the intersection for the ray
    // u(out), v(out): barycentric coordinate of intersection
    public static IntersectTriangle(ray: Ray, face: Triangle, backfaceCulling: boolean): PickResult {
        let v0 = face.v1;
        let v1 = face.v2;
        let v2 = face.v3;

        // E1
        let E1 = v1.subtract(v0, Vector3.HELP_3);

        // E2
        let E2 = v2.subtract(v0, Vector3.HELP_4);

        // P
        let P = ray.direction.cross(E2, Vector3.HELP_5);

        // determinant
        let det = dot(E1, P);

        // keep det > 0, modify T accordingly
        let T: Vector3;
        if (det > 0) {
            if (backfaceCulling) {
                return null;
            }
            T = ray.origin.subtract(v0, Vector3.HELP_2);
        } else {
            T = v0.subtract(ray.origin, Vector3.HELP_2);
            det = -det;
        }

        // If determinant is near zero, ray lies in plane of triangle
        if (det < 0.0001) {
            this._info.isIn = false;
            this._info.t = 0;
            this._info.u = 0;
            this._info.v = 0;
            return this._info;
        }

        // Calculate u and make sure u <= 1
        let u = dot(T, P);
        if (u < 0.0 || u > det) {
            this._info.isIn = false;
            this._info.t = 0;
            this._info.u = 0;
            this._info.v = 0;
            return this._info;
        }

        // Q
        let Q = T.cross(E1, Vector3.HELP_1);

        // Calculate v and make sure u + v <= 1
        let v = dot(ray.direction, Q);
        if (v < 0.0 || u + v > det) {
            this._info.isIn = false;
            this._info.t = 0;
            this._info.u = 0;
            this._info.v = 0;
            return this._info;
        }

        // Calculate t, scale parameters, ray intersects triangle
        let t = dot(E2, Q);

        let fInvDet = 1.0 / det;
        t *= fInvDet;
        u *= fInvDet;
        v *= fInvDet;

        this._info.isIn = true;
        this._info.t = t;
        this._info.u = u;
        this._info.v = v;

        //(1 - u - v)V0 + uV1 + vV2
        let d = 1 - u - v;

        this._u0.copyFrom(face.u1);
        this._u0.scale(d);

        this._u1.copyFrom(face.u2);
        this._u1.scale(u);

        this._u2.copyFrom(face.u3);
        this._u2.scale(v);

        this._info.uv.copyFrom(this._u0);
        this._info.uv.add(this._u1, this._info.uv);
        this._info.uv.add(this._u2, this._info.uv);

        // this.info.uv.copyFrom(face.u1);
        this._info.localPosition.copyFrom(ray.direction).multiplyScalar(t);
        this._info.localPosition.add(ray.origin, this._info.localPosition);
        return this._info;
    }

    private static _u0: Vector2 = new Vector2();
    private static _u1: Vector2 = new Vector2();
    private static _u2: Vector2 = new Vector2();
}
