import { Vector2 } from "@orillusion/core";
import { Curve2D } from "./Curve2D";

export class CubicBezierCurve2D extends Curve2D {
    public v0: Vector2;
    public v1: Vector2;
    public v2: Vector2;
    public v3: Vector2;

    constructor(v0: Vector2, v1: Vector2, v2: Vector2, v3: Vector2) {
        super();
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }

    public get points(): Vector2[] {
        return [this.v0, this.v1, this.v2, this.v3];
    }

    public getPoint(t: number, result: Vector2 = new Vector2()): Vector2 {
        result.set(
            this.cubicBezier(t, this.v0.x, this.v1.x, this.v2.x, this.v3.x),
            this.cubicBezier(t, this.v0.y, this.v1.y, this.v2.y, this.v3.y)
        );
        return result;
    }

    public copyFrom(other: CubicBezierCurve2D) {
        this.v0.copyFrom(other.v0);
        this.v1.copyFrom(other.v1);
        this.v2.copyFrom(other.v2);
        this.v3.copyFrom(other.v3);
    }

    protected cubicBezierP0(t: number, p: number) {
        const k = 1 - t;
        return k * k * k * p;
    }

    protected cubicBezierP1(t: number, p: number) {
        const k = 1 - t;
        return 3 * k * k * t * p;
    }

    protected cubicBezierP2(t: number, p: number) {
        return 3 * (1 - t) * t * t * p;
    }

    protected cubicBezierP3(t: number, p: number) {
        return t * t * t * p;
    }

    protected cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
        return this.cubicBezierP0(t, p0) + this.cubicBezierP1(t, p1) + this.cubicBezierP2(t, p2) + this.cubicBezierP3(t, p3);
    }
}
