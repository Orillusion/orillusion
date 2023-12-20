import { Vector2, LineJoin } from "@orillusion/core";
import { Shape3D, ShapeTypeEnum } from "./Shape3D";
export class LineShape3D extends Shape3D {
    private _corner: number = 10;
    private _lineJoin: LineJoin = LineJoin.miter;
    public readonly shapeType: number = Number(ShapeTypeEnum.Line);

    public set(points: Vector2[], lineWidth: number, fill: boolean, line: boolean, corner: number = 10) {
        this.points = points;
        this.lineWidth = lineWidth;
        this.line = line;
        this.fill = fill;
        this.corner = corner;
    }

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

    protected calcRequireSource(): void {
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
        if (this._fill) {
            this._faceCount += this._corner;
        }
    }

    protected writeShapeData() {
        super.writeShapeData(this._lineJoin, this._corner);
    }
}