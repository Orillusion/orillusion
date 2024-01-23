import { CircleArcType, Shape3D, ShapeTypeEnum } from "./Shape3D";
/**
 * Define class for drawing Circle on the xz plane
 * You can use the API implemented in CanvasPath in Path2DShape3D to draw the xz plane path
 *
 * @export
 * @class CircleShape3D
 * @extends {Shape3D}
 */
export class CircleShape3D extends Shape3D {
    private _radius: number = 10;
    private _segment: number = 10;
    private _startAngle: number = 0;
    private _endAngle: number = 360;
    private _arcType: CircleArcType = CircleArcType.Sector;
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

    public get startAngle(): number {
        return this._startAngle;
    }
    public set startAngle(value: number) {
        if (value < 0 || value > 360) {
            value %= 360;
            if (value < 0) {
                value += 360;
            }
        }
        if (this._startAngle != value) {
            this._startAngle = value;
            this._isChange = true;
        }
    }
    public get endAngle(): number {
        return this._endAngle;
    }
    public set endAngle(value: number) {
        if (value < 0 || value > 360) {
            value %= 360;
            if (value < 0) {
                value += 360;
            }
        }
        if (this._endAngle != value) {
            this._isChange = true;
            this._endAngle = value;
        }
    }

    public get arcType(): CircleArcType {
        return this._arcType;
    }
    public set arcType(value: CircleArcType) {
        if (this._arcType != value) {
            this._arcType = value;
            this._isChange = true;
        }
    }

    public calcRequireSource(): void {
        this._destPointCount = this._segment + 1;
        this._srcPointCount = 0;
    }

    protected writeShapeData() {
        let end = this._endAngle;
        let start = this._startAngle;
        if (end < start) {
            end += 360;
        }
        super.writeShapeData(this._radius, this._segment, start, end, Number(this._arcType));
    }
}