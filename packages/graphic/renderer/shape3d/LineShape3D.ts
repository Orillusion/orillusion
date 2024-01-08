import { Vector3, LineJoin, Vector2 } from "@orillusion/core";
import { Shape3D, ShapeTypeEnum } from "./Shape3D";
import earcut from 'earcut';

type vec2 = { x: number, y: number };

export class LineShape3D extends Shape3D {
    protected _corner: number = 8;
    protected _lineJoin: LineJoin = LineJoin.bevel;
    public readonly shapeType: number = Number(ShapeTypeEnum.Line);

    public get corner(): number {
        return this._corner;
    }
    public set corner(value: number) {
        if (this._corner != value) {
            this._corner = Math.round(Math.max(0, value));
            this._isChange = true;
        }
    }

    public get lineJoin(): LineJoin {
        return this._lineJoin;
    }
    public set lineJoin(value: LineJoin) {
        if (this._lineJoin != value) {
            this._lineJoin = value;
            this._isChange = true;
        }
    }

    public calcRequireSource(): void {
        this._destPointCount = this._srcPointCount;

        if (this._fill && this._points.length > 2) {
            let coords: number[] = [];
            for (let point of this._points) {
                coords.push(point.x, point.y);
            }
            this._indecies = earcut(coords);
            this._srcIndexCount = this._indecies?.length || 0;
        } else {
            this._indecies = null;
            this._srcIndexCount = 0;
        }
    }

    public sampleQuadraticCurve(start: vec2, cp: vec2, end: vec2, t: number, ret?: vec2) {
        ret ||= new Vector2();
        let p0 = this.mixVector2(start, cp, t, Vector2.HELP_0);
        let p1 = this.mixVector2(cp, end, t, Vector2.HELP_1);

        p0 = this.mixVector2(p0, p1, t, ret);

        return ret;
    }

    public sampleCurve(start: vec2, cp1: vec2, cp2: vec2, end: vec2, t: number, ret?: vec2) {
        ret ||= new Vector2();
        let p0 = this.mixVector2(start, cp1, t, Vector2.HELP_0);
        let p1 = this.mixVector2(cp1, cp2, t, Vector2.HELP_1);
        let p2 = this.mixVector2(cp2, end, t, Vector2.HELP_2);

        p0 = this.mixVector2(p0, p1, t, p0);
        p1 = this.mixVector2(p1, p2, t, p1);

        p0 = this.mixVector2(p0, p1, t, ret);

        return ret;
    }

    protected writeShapeData() {
        super.writeShapeData(this._lineJoin, this._corner);
    }

    protected mixVector2(src: vec2, dest: vec2, t: number, ret?: vec2) {
        ret ||= new Vector2();
        ret.x = this.mixFloat(src.x, dest.x, t);
        ret.y = this.mixFloat(src.y, dest.y, t);
        return ret;
    }

    protected mixFloat(src: number, dest: number, t: number) {
        return src * (1 - t) + dest * t;
    }
}