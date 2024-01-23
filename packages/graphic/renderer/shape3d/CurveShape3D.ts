import { Vector2 } from "@orillusion/core";
import { Point3D, ShapeTypeEnum } from "./Shape3D";
import { LineShape3D } from "./LineShape3D";

/**
 * Define class for drawing Curve on the xz plane
 * You can use the API implemented in CanvasPath in Path2DShape3D to draw the xz plane path
 *
 * @export
 * @class CurveShape3D
 * @extends {Shape3D}
 */
export class CurveShape3D extends LineShape3D {
    public readonly shapeType: number = Number(ShapeTypeEnum.Path2D);
    protected _curveChange: boolean = true;
    private _start: Vector2 = new Vector2(0, 0);
    private _cp1: Vector2 = new Vector2(50, 0);
    private _cp2: Vector2 = new Vector2(50, 100);
    private _end: Vector2 = new Vector2(100, 100);
    private _segment: number = 4;
    private readonly MaxRoundCorner: number = 6;

    public get start(): Vector2 {
        return this._start;
    }
    public set start(value: Vector2) {
        this._start.copyFrom(value);
        this.setCurveChanged();
    }

    public get end(): Vector2 {
        return this._end;
    }
    public set end(value: Vector2) {
        this._end.copyFrom(value);
        this.setCurveChanged();
    }

    public get cp1(): Vector2 {
        return this._cp1;
    }
    public set cp1(value: Vector2) {
        this._cp1.copyFrom(value);
        this.setCurveChanged();
    }
    public get cp2(): Vector2 {
        return this._cp2;
    }
    public set cp2(value: Vector2) {
        this._cp2.copyFrom(value);
        this.setCurveChanged();
    }

    public get segment(): number {
        return this._segment;
    }
    public set segment(value: number) {
        value = Math.max(2, value);
        if (this._segment != value) {
            this._segment = value;
            this.setCurveChanged();
        }
    }

    public set corner(value: number) {
        value = Math.min(this.MaxRoundCorner, value);
        super.corner = value;
    }

    public get corner() {
        return this._corner;
    }

    private setCurveChanged() {
        this._curveChange = true;
        this._isChange = true;
    }

    public calcRequireSource(): void {
        this._curveChange && this.genCurvePoints();
        super.calcRequireSource();
    }

    private genCurvePoints(): Point3D[] {
        if (this._curveChange) {
            this._curveChange = false;

            this._points3D ||= [];
            let list = this._points3D;
            let max = this._segment;
            for (let i = 0; i <= max; i++) {
                let vec2 = this.sampleCurve(this._start, this._cp1, this._cp2, this._end, i / max, list[i]);
                list[i] = new Point3D(vec2.x, vec2.y);
            }
            list.length = this._segment + 1;
            this._destPointCount = this._srcPointCount = list.length;
        }
        return this._points3D;
    }

}