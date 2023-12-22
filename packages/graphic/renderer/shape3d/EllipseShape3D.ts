import { Shape3D, ShapeTypeEnum } from "./Shape3D";
export class EllipseShape3D extends Shape3D {
    private _rx: number = 20;
    private _ry: number = 10;
    private _segment: number = 4;//4~?
    public readonly shapeType: number = Number(ShapeTypeEnum.Ellipse);

    public set(rx: number, ry: number, lineWidth: number, fill: boolean, line: boolean, segment: number = 10) {
        this.rx = rx;
        this.ry = ry;
        this.lineWidth = lineWidth;
        this.line = line;
        this.fill = fill;
        this.segment = segment;
    }

    public get rx(): number {
        return this._rx;
    }
    public set rx(value: number) {
        if (this._rx != value) {
            this._rx = Math.max(0, value);
            this._isChange = true;
        }
    }

    public get ry(): number {
        return this._ry;
    }
    public set ry(value: number) {
        if (this._ry != value) {
            this._ry = Math.max(0, value);
            this._isChange = true;
        }
    }

    public get segment(): number {
        return this._segment;
    }
    public set segment(value: number) {
        if (this._segment != value) {
            this._segment = Math.round(Math.max(4, value));
            this._isChange = true;
        }
    }

    public calcRequireSource(): void {
        this._destPointCount = this._segment;
    }

    protected writeShapeData() {
        super.writeShapeData(this._rx, this._ry, this._segment);
    }
}