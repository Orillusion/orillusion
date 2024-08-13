import { Vector2 } from "@orillusion/core";
import { Curve2D, CurveType } from "./Curve2D";

export class QuadraticBezierCurve2D extends Curve2D {
    public v0: Vector2;
    public v1: Vector2;
    public v2: Vector2;

    constructor(v0: Vector2, v1: Vector2, v2: Vector2) {
        super();
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        this.curveType = CurveType.QuadraticBezierCurve;
    }

    public get points(): Vector2[] {
        return [this.v0, this.v1, this.v2];
    }

    public getPoint(t: number, result: Vector2 = new Vector2()): Vector2 {
        result.set(
            this.quadraticBezier(t, this.v0.x, this.v1.x, this.v2.x),
            this.quadraticBezier(t, this.v0.y, this.v1.y, this.v2.y)
        );
        return result;
    }

    public copyFrom(other: QuadraticBezierCurve2D) {
        this.v0.copyFrom(other.v0);
        this.v1.copyFrom(other.v1);
        this.v2.copyFrom(other.v2);
    }

    protected quadraticBezierP0(t: number, p: number) {
        const k = 1 - t;
        return k * k * p;
    }

    protected quadraticBezierP1(t: number, p: number) {
        return 2 * (1 - t) * t * p;
    }

    protected quadraticBezierP2(t: number, p: number) {
        return t * t * p;
    }

    protected quadraticBezier(t: number, p0: number, p1: number, p2: number): number {
        return this.quadraticBezierP0(t, p0) + this.quadraticBezierP1(t, p1) + this.quadraticBezierP2(t, p2);
    }
}
