import { Vector2 } from "@orillusion/core";

export enum CurveType {
    LineCurve,
    SplineCurve,
    EllipseCurve,
    QuadraticBezierCurve,
}

export class Curve2D {
    public curveType: CurveType;

    public get points(): Vector2[] {
        console.warn("points not implementation!");
        return [];
    }

    public getPoint(t: number, result: Vector2 = new Vector2()): Vector2 {
        console.warn("getPoint not implementation!");
        return result;
    }

    public getPoints(divisions = 5): Vector2[] {
        let points: Vector2[] = [];
        for (let d = 0; d <= divisions; d++) {
            points.push(this.getPoint(d / divisions));
        }
        return points;
    }
}
