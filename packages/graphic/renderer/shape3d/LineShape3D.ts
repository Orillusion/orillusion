import { Vector2, LineJoin } from "@orillusion/core";
import { Shape3D, ShapeTypeEnum } from "./Shape3D";
import earcut from 'earcut';

export class LineShape3D extends Shape3D {
    protected _corner: number = 8;
    protected _lineJoin: LineJoin = LineJoin.miter;
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
        this._faceCount = 0;
        if (this._line) {
            if (this._lineJoin == LineJoin.miter) {
                if (this._isClosed) {
                    this._faceCount = this._srcPointCount * 4;
                } else {
                    this._faceCount = (this._srcPointCount - 2) * 4 + 2;
                }
            } else if (this._lineJoin == LineJoin.bevel) {
                if (this._isClosed) {
                    this._faceCount = this._srcPointCount * 3;
                } else {
                    this._faceCount = (this._srcPointCount - 2) * 3 + 2;
                }
            } else {
                let cornerCount = Math.max(2, this._corner);
                if (this._isClosed) {
                    this._faceCount = this._srcPointCount * (2 + cornerCount);
                } else {
                    this._faceCount = (this._srcPointCount - 2) * (2 + cornerCount) + 2;
                }
            }
        }
        if (this._fill && this._points.length > 2) {
            let coords: number[] = [];
            for (let point of this._points) {
                coords.push(point.x, point.y);
            }
            this._indecies = earcut(coords);
            this._srcIndexCount = this._indecies?.length || 0;
            this._faceCount += (this._srcIndexCount) / 3;
        } else {
            this._indecies = null;
            this._srcIndexCount = 0;
        }
    }

    protected writeShapeData() {
        super.writeShapeData(this._lineJoin, this._corner);
    }

    protected mixVector2(src: Vector2, dest: Vector2, t: number, ret?: Vector2) {
        ret ||= new Vector2();
        ret.x = this.mixFloat(src.x, dest.x, t);
        ret.y = this.mixFloat(src.y, dest.y, t);
        return ret;
    }

    protected mixFloat(src: number, dest: number, t: number) {
        return src * (1 - t) + dest * t;
    }
}