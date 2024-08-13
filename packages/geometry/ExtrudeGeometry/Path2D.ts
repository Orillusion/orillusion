import { Vector2 } from "@orillusion/core";
import { CubicBezierCurve2D } from "./Curve/CubicBezierCurve2D";
import { Curve2D, CurveType } from "./Curve/Curve2D";
import { LineCurve2D } from "./Curve/LineCurve2D";
import { QuadraticBezierCurve2D } from "./Curve/QuadraticBezierCurve2D";

export class Path2D {

    public autoClose: boolean = false;

    protected curves: Array<Curve2D> = [];
    protected currentPoint: Vector2 = new Vector2();

    constructor(points?: Vector2[]) {
        if (points) {
            this.setFromPoints(points);
        }
    }

    public getPoints(divisions: number): Vector2[] {
        let last;
        const points: Vector2[] = [];

        for (let i = 0, curves = this.curves; i < curves.length; i++) {

            const curve = curves[i];
            const resolution = curve.curveType == CurveType.EllipseCurve ? divisions * 2
                : (curve.curveType == CurveType.LineCurve) ? 1
                    : curve.curveType == CurveType.SplineCurve ? divisions * curve.points.length
                        : divisions;

            const pts = curve.getPoints(resolution);

            for (let j = 0; j < pts.length; j++) {
                const point = pts[j];

                if (last && last.equals(point))
                    continue;

                points.push(point);
                last = point;
            }
        }

        if (this.autoClose && points.length > 1 && !points[points.length - 1].equals(points[0])) {
            points.push(points[0]);
        }

        return points;
    }

    public setFromPoints(points: Vector2[]) {
        this.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.lineTo(points[i].x, points[i].y);
        }
        return this;
    }

    public moveTo(x: number, y: number) {
        this.currentPoint.set(x, y);
        return this;
    }

    public lineTo(x: number, y: number) {
        this.curves.push(new LineCurve2D(this.currentPoint.clone(), new Vector2(x, y)));
        this.currentPoint.set(x, y);
        return this;
    }

    public quadraticCurveTo(cpX: number, cpY: number, x: number, y: number) {
        this.curves.push(new QuadraticBezierCurve2D(this.currentPoint.clone(), new Vector2(cpX, cpY), new Vector2(x, y)));
        this.currentPoint.set(x, y);
        return this;
    }

    public bezierCurveTo(cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, x: number, y: number) {
        this.curves.push(new CubicBezierCurve2D(this.currentPoint.clone(), new Vector2(cp1X, cp1Y), new Vector2(cp2X, cp2Y), new Vector2(x, y)));
        this.currentPoint.set(x, y);
        return this;
    }

    public isIntersect(path: Path2D): boolean {
        let pathA: Vector2[] = this.getPoints(1);
        let pathB: Vector2[] = path.getPoints(1);
        return this.pointInPolygon(pathB[0], pathA);
    }

    public pointInPolygon(point: Vector2, polygon: Vector2[]): boolean {
        let inside = false;
        const x = point.x, y = point.y;
        const vertices = polygon;
        let j = vertices.length - 1;
    
        for (let i = 0; i < vertices.length; i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
    
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
            j = i;
        }
    
        return inside;
    }
    
}
