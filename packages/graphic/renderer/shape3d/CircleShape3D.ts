import { Shape3D, Shape3DStruct, ShapeTypeEnum } from "./Shape3D";
export class CircleShape3D extends Shape3D {
    private _radius: number = 10;
    private _segment: number = 10;

    public readonly shapeType: number = Number(ShapeTypeEnum.Circle);

    public set(radius: number, lineWidth: number, fill: boolean, line: boolean, segment: number = 10) {
        this.radius = radius;
        this.lineWidth = lineWidth;
        this.line = line;
        this.fill = fill;
        this.segment = segment;
    }

    public get segment(): number {
        return this._segment;
    }
    public set segment(value: number) {
        if (this._segment != value) {
            this._segment = Math.round(Math.max(3, value));
            this._isChange = true;
        }
    }
    public get radius(): number {
        return this._radius;
    }
    public set radius(value: number) {
        if (this._radius != value) {
            this._radius = Math.max(0, value);
            this._isChange = true;
        }
    }

    protected calcRequireSource(): void {
        this._destPointCount = this._segment;
        this._faceCount = 0;
        if (this._line) {
            this._faceCount += 2 * this._segment;
        }
        if (this._fill) {
            this._faceCount += this._segment;
        }
    }

    protected writeShapeData() {
        super.writeShapeData(this._radius, this._segment);
    }
}