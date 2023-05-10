import { Vector3 } from './Vector3';
/**
 * 3D Bezier Curve
 * @group Math
 */
export class Bezier3D {
    private static tmp_points: Vector3[] = [];

    /**
     * get cubic curve point value from t at bezier data 
     * @param t interval value
     * @param p0 start point
     * @param c1 left control point
     * @param c2 right control point
     * @param p3 end point
     * @returns cubic curve point
     */
    public static calculateCubicBezierPoint(t: number, p0: Vector3, c1: Vector3, c2: Vector3, p3: Vector3): Vector3 {
        if (t > 1) t = 1;
        if (t < 0) t = 0;
        let u = 1 - t;
        let uu = u * u;
        let uuu = u * u * u;
        let tt = t * t;
        let ttt = t * t * t;
        let p = p0.mul(uuu);
        let tp1 = c1.mul(3);
        tp1 = tp1.mul(t);
        tp1 = tp1.mul(uu);

        let tp2 = c2.mul(3);
        tp2 = tp2.mul(tt);
        tp2 = tp2.mul(u);

        let tp3 = p3.mul(ttt);
        p = p.add(tp1);
        p = p.add(tp2);
        p = p.add(tp3);
        return p;
    }

    /**
     * get curve point from three point bezier curve 
     * @param t interval value
     * @param p0 start point
     * @param c1 contrl point 
     * @param p1 end point
     * @returns get bezier point at curve 
     */
    public static bezierPoint(t: number, p0: Vector3, c1: Vector3, p1: Vector3): Vector3 {
        if (t > 1) t = 1;
        if (t < 0) t = 0;
        let u = 1 - t;
        let uu = u * u;
        let tt = t * t;

        let pp0 = p0.mul(uu);

        let cc1 = c1.mul(2);
        cc1.scaleBy(u);
        cc1.scaleBy(t);

        let pp1 = p1.mul(tt);

        pp0 = pp0.add(cc1);
        pp0 = pp0.add(pp1);

        return pp0;
    }

    private static calculateCubicBezierPoints(t: number, ps: Vector3[], skip: number): Vector3 {
        if (t > 1) t = 1;
        if (t < 0) t = 0;
        let u = 1 - t;
        let uu = u * u;
        let uuu = u * u * u;
        let tt = t * t;
        let ttt = t * t * t;
        let p = ps[skip].mul(uuu);
        let tp1 = ps[skip + 1].mul(3);
        tp1 = tp1.mul(t);
        tp1 = tp1.mul(uu);

        let tp2 = ps[skip + 2].mul(3);
        tp2 = tp2.mul(tt);
        tp2 = tp2.mul(u);

        let tp3 = ps[skip + 3].mul(ttt);
        p = p.add(tp1);
        p = p.add(tp2);
        p = p.add(tp3);

        return p;
    }

    private static bezierPathValue(t: number, points: Vector3[]): Vector3 {
        if (t > 1) t = 1;
        if (t < 0) t = 0;
        let count = points.length;
        let tmp_points = this.tmp_points;
        tmp_points.length = 0;

        for (let i = 1; i < count; ++i) {
            for (let j = 0; j < count - i; ++j) {
                if (i == 1) {
                    let v = new Vector3();
                    v.x = points[j].x * (1 - t) + points[j + 1].x * t;
                    v.y = points[j].y * (1 - t) + points[j + 1].y * t;
                    v.z = points[j].z * (1 - t) + points[j + 1].z * t;
                    this.tmp_points.push(v);
                    continue;
                }
                let v2 = new Vector3();
                v2.x = tmp_points[j].x * (1 - t) + tmp_points[j + 1].x * t;
                v2.y = tmp_points[j].y * (1 - t) + tmp_points[j + 1].y * t;
                v2.z = tmp_points[j].z * (1 - t) + tmp_points[j + 1].z * t;
                tmp_points.push(v2);
            }
        }
        return tmp_points[0];
    }
}
