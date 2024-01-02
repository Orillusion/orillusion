import { DynamicDrawStruct, Matrix3, LineJoin, Vector2, Color, Vector4 } from "@orillusion/core";

export class Shape3DStruct extends DynamicDrawStruct {
    public shapeType: number = 0;
    public shapeOrder: number = 0;
    public destPointStart: number = 0;
    public destPointCount: number = 0;

    public srcPointStart: number = 0;
    public srcPointCount: number = 0;
    public srcIndexStart: number = 0;
    public srcIndexCount: number = 0;

    public isClosed: number = 0;
    public fill: number = 0;
    public line: number = 0;
    public lineWidth: number = 10;

    public xa: number = 5;
    public xb: number = 4;
    public xc: number = 4;
    public xd: number = 2;

    public xe: number = 5;
    public xf: number = 4;
    public xg: number = 4;
    public xh: number = 2;
}

export enum ShapeTypeEnum {
    None = 0,
    Circle = 1,
    RoundRect = 2,
    Ellipse = 3,
    Line = 4,
}

export enum CircleArcType {
    Sector = 0,
    Moon = 1
}

export class Shape3D {
    protected readonly _shapeStruct: Shape3DStruct;
    protected readonly _sharedSrcIndecies: Uint32Array;
    protected readonly _sharedSrcPoints: Float32Array;
    protected _destPointStart: number = 0;
    protected _destPointCount: number = 0;
    protected _srcPointStart: number = 0;
    protected _srcPointCount: number = 0;
    protected _srcIndexStart: number = 0;
    protected _srcIndexCount: number = 0;
    private _shapeOrder: number = 0;
    protected _points: Vector2[];
    protected _indecies: number[];
    public readonly shapeIndex: number = 0;
    protected _isClosed: boolean = true;
    protected _fill: boolean = true;
    protected _line: boolean = true;
    protected _lineWidth: number = 5;
    protected _isChange: boolean = true;
    private _lineTextureID: number = 0;
    private _fillTextureID: number = 0;
    private _lineColor: Color = new Color(1, 0, 1, 1);
    private _fillColor: Color = new Color(0, 1, 0, 1);
    private _lineUVSpeed: Vector2 = new Vector2();
    private _fillUVSpeed: Vector2 = new Vector2();
    private _fillUVRect: Vector4 = new Vector4(0, 0, 1, 1);
    private _lineUVRect: Vector4 = new Vector4(0, 0, 1, 1);
    private _uvSpeed: Vector4 = new Vector4();

    public readonly shapeType: number = ShapeTypeEnum.None;

    constructor(structs: Shape3DStruct, srcPoints: Float32Array, srcIndecies: Uint32Array, matrixIndex: number) {
        this._shapeStruct = structs;
        this._sharedSrcPoints = srcPoints;
        this._sharedSrcIndecies = srcIndecies;
        this.shapeIndex = matrixIndex;
    }

    public get isChange() {
        return this._isChange;
    }

    public writeData() {
        this.writeCommonData();
        this.writeShapeData();
        this._isChange = false;
    }

    public set lineColor(value: Color) {
        this._lineColor.copyFrom(value);
        this._isChange = true;
    }

    public get lineColor() {
        return this._lineColor;
    }

    public set fillColor(value: Color) {
        this._fillColor.copyFrom(value);
        this._isChange = true;
    }

    public get fillColor() {
        return this._fillColor;
    }

    public get lineTextureID(): number {
        return this._lineTextureID;
    }
    public set lineTextureID(value: number) {
        if (this._lineTextureID != value) {
            this._lineTextureID = value;
            this._isChange = true;
        }
    }
    public get fillTextureID(): number {
        return this._fillTextureID;
    }
    public set fillTextureID(value: number) {
        if (this._fillTextureID != value) {
            this._fillTextureID = value;
            this._isChange = true;
        }
    }

    public get shapeOrder(): number {
        return this._shapeOrder;
    }
    public set shapeOrder(value: number) {
        value = Math.max(0, value);
        if (value != this._shapeOrder) {
            this._isChange = true;
            this._shapeOrder = value;
        }
    }

    public get srcPointStart(): number {
        return this._srcPointStart;
    }
    public set srcPointStart(value: number) {
        if (value != this._srcPointStart) {
            this._isChange = true;
            this._srcPointStart = value;
        }
    }

    public get srcPointCount(): number {
        return this._srcPointCount;
    }

    public get srcIndexStart(): number {
        return this._srcIndexStart;
    }
    public set srcIndexStart(value: number) {
        if (value != this._srcIndexStart) {
            this._isChange = true;
            this._srcIndexStart = value;
        }
    }

    public get srcIndexCount(): number {
        return this._srcIndexCount;
    }

    public get destPointStart(): number {
        return this._destPointStart;
    }
    public set destPointStart(value: number) {
        if (value != this._destPointStart) {
            this._isChange = true;
            this._destPointStart = value;
        }
    }
    public get destPointCount(): number {
        return this._destPointCount;
    }

    public get points(): Vector2[] {
        return this._points;
    }
    public set points(value: Vector2[]) {
        this._points = value;
        this._srcPointCount = value?.length || 0;
        this._isChange = true;
    }

    public get isClosed(): boolean {
        return this._isClosed;
    }
    public set isClosed(value: boolean) {
        if (value != this._isClosed) {
            this._isChange = true;
            this._isClosed = value;
        }
    }

    public get fill(): boolean {
        return this._fill;
    }
    public set fill(value: boolean) {
        if (this._fill != value) {
            this._fill = value;
            this._isChange = true;
        }
    }
    public get line(): boolean {
        return this._line;
    }
    public set line(value: boolean) {
        if (this._line != value) {
            this._line = value;
            this._isChange = true;
        }
    }

    public get lineWidth(): number {
        return this._lineWidth;
    }

    public set lineWidth(value: number) {
        if (this._lineWidth != value) {
            this._lineWidth = Math.max(0, value);
            this._isChange = true;
        }
    }

    public get lineUVSpeed(): Vector2 {
        return this._lineUVSpeed;
    }
    public set lineUVSpeed(value: Vector2) {
        this._lineUVSpeed.copyFrom(value);
        this._isChange = true;
    }
    public get lineUVRect(): Vector4 {
        return this._lineUVRect;
    }
    public set lineUVRect(value: Vector4) {
        this._lineUVRect.copyFrom(value);
        this._isChange = true;
    }
    public get fillUVSpeed(): Vector2 {
        return this._fillUVSpeed;
    }
    public set fillUVSpeed(value: Vector2) {
        this._fillUVSpeed.copyFrom(value);
        this._isChange = true;
    }
    public get fillUVRect(): Vector4 {
        return this._fillUVRect;
    }
    public set fillUVRect(value: Vector4) {
        this._fillUVRect.copyFrom(value);
        this._isChange = true;
    }

    public get uvSpeed(): Vector4 {
        return this._uvSpeed;
    }
    public set uvSpeed(value: Vector4) {
        this._uvSpeed.copyFrom(value);
        this._isChange = true;
    }

    public clean() {
        let data = this._shapeStruct;
        for (let key in data) {
            data[key] = 0;
        }
    }

    private writeCommonData() {
        let data = this._shapeStruct;

        data.shapeType = this.shapeType;
        data.shapeOrder = this._shapeOrder;
        data.destPointStart = this._destPointStart;
        data.destPointCount = this._destPointCount;

        data.srcPointStart = this._srcPointStart;
        data.srcPointCount = this._srcPointCount;
        data.srcIndexStart = this._srcIndexStart;
        data.srcIndexCount = this._srcIndexCount;

        data.isClosed = this._isClosed ? 1 : 0;
        data.fill = this._fill ? 1 : 0;
        data.line = this._line ? 1 : 0;
        data.lineWidth = this._lineWidth;

        //write source points
        if (this._srcPointCount) {
            let index = this._srcPointStart * 4;
            let array = this._sharedSrcPoints;
            for (let point of this._points) {
                array[index + 0] = point.x;
                array[index + 1] = point.y;
                index += 4;
            }
        }

        //write source indecies
        if (this._srcIndexCount && this._indecies) {
            let index = this._srcIndexStart * 4;
            let triangleCount = this._srcIndexCount / 3;
            let array = this._sharedSrcIndecies;
            for (let i = 0; i < triangleCount; i++) {
                array[index + 0] = this._indecies[i * 3 + 0];
                array[index + 1] = this._indecies[i * 3 + 1];
                array[index + 2] = this._indecies[i * 3 + 2];
                index += 4;
            }
        }
    }

    protected writeShapeData(a: number = 0, b: number = 0, c: number = 0, d: number = 0, e: number = 0, f: number = 0, g: number = 0, h: number = 0) {
        let data = this._shapeStruct;
        data.xa = a;
        data.xb = b;
        data.xc = c;
        data.xd = d;

        data.xe = e;
        data.xf = f;
        data.xg = g;
        data.xh = h;
    }

    public calcRequireSource() {
        console.warn('Need to calc key points, and faces need to require!');
    }

}