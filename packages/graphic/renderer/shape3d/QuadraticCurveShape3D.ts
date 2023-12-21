import { Vector2, } from "@orillusion/core";
import { ShapeTypeEnum } from "./Shape3D";
import { LineShape3D } from "./LineShape3D";
export class QuadraticCurveShape3D extends LineShape3D {
    public readonly shapeType: number = Number(ShapeTypeEnum.Line);
    protected _curveChange: boolean = true;
    private _start: Vector2 = new Vector2(0, 0);
    private _cp: Vector2 = new Vector2(50, 0);
    private _end: Vector2 = new Vector2(100, 100);
    private _segment: number = 2;
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

    public get cp(): Vector2 {
        return this._cp;
    }
    public set cp(value: Vector2) {
        this._cp.copyFrom(value);
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

    protected calcRequireSource(): void {
        this._curveChange && this.genCurvePoints();
        super.calcRequireSource();
    }

    private genCurvePoints(): Vector2[] {
        if (this._curveChange) {
            this._curveChange = false;

            this._points ||= [];
            let list = this._points;
            let max = this._segment;
            for (let i = 0; i <= max; i++) {
                list[i] = this.sampleValue(i / max, list[i]);
            }
            list.length = this._segment + 1;
            this._destPointCount = this._srcPointCount = list.length;

        }
        return this._points;
    }


    public sampleValue(t: number, ret?: Vector2) {
        ret ||= new Vector2();
        let p0 = this.mixVector2(this._start, this._cp, t, Vector2.HELP_0);
        let p1 = this.mixVector2(this._cp, this._end, t, Vector2.HELP_1);

        p0 = this.mixVector2(p0, p1, t, ret);

        return ret;
    }


}