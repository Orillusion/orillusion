import { MathUtil } from './MathUtil';
import { Vector2 } from './Vector2';
/**
 * 2D Bezier Curve 
 * @group Math
 */
export class Bezier2D {

    private _points: Vector2[];

    private _cacheValue: Vector2;

    /**
     * instance bezier class
     */
    constructor(vec2Ds: Vector2[] = []) {
        this.points = vec2Ds;
        this._cacheValue = new Vector2();
    }

    /**
     * get all bezier 2d points
     */
    public get points(): Vector2[] {
        return this._points;
    }

    /**
     * set bezier 2d point[x,y] list must great 4
     */
    public set points(value: Vector2[]) {
        this._points = value;
    }

    /**
     * get point2d at curve
     * @param v 0.0 ~ 1.0 
     * @returns return point2D at curve 
     */
    public getValue(v: number): Vector2 {
        if (v < 0) v = 0;
        if (v > 1) v = 1;

        let len = this.points.length - 1;
        let ci = Math.floor(len * v);
        let ni = ci + 1;
        let w = MathUtil.fract((len + 1) * v);
        if (ni >= len) {
            ni = ci;
            w = 0;
        }

        this._cacheValue.x = this.points[ci].x + (this.points[ni].x - this.points[ci].x) * w;
        this._cacheValue.y = this.points[ci].y + (this.points[ni].y - this.points[ci].y) * w;
        return this._cacheValue;
    }

    /**
     * caclute bezier curve points at line [ 0.0 , 1.0 ]
     * @param anchorpoints bezier anchor
     * @param pointsAmount point count 
     * @returns get a bezier curve [Bezier2D]
     */
    public static createBezierPoints(anchorpoints: Vector2[], pointsAmount: number): Bezier2D {
        var bezier2d: Bezier2D = new Bezier2D();
        for (var i = 0; i < pointsAmount; i++) {
            var point = Bezier2D.multiPointBezier(anchorpoints, i / pointsAmount);
            bezier2d.points.push(point);
        }
        return bezier2d;
    }

    private static multiPointBezier(points: Vector2[], t: number) {
        var len = points.length;
        var x = 0,
            y = 0;
        var erxiangshi = function (start: number, end: number) {
            var cs = 1,
                bcs = 1;
            while (end > 0) {
                cs *= start;
                bcs *= end;
                start--;
                end--;
            }
            return cs / bcs;
        };
        for (var i = 0; i < len; i++) {
            var point = points[i];
            x += point.x * Math.pow(1 - t, len - 1 - i) * Math.pow(t, i) * erxiangshi(len - 1, i);
            y += point.y * Math.pow(1 - t, len - 1 - i) * Math.pow(t, i) * erxiangshi(len - 1, i);
        }
        return new Vector2(x, y);
    }
}
