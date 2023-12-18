import { DynamicDrawStruct, Matrix3 } from "@orillusion/core";

export class Shape3DStruct extends DynamicDrawStruct {
    public shapeType: number = 0;
    public shapeIndex: number = 0;
    public keyPointStart: number = 0;
    public keyPointCount: number = 0;

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
}

export class Shape3D {
    protected readonly _sharedShapeStructs: Shape3DStruct[];
    protected _keyPointStart: number = 0;
    protected _keyPointCount: number = 0;
    protected _faceCount: number = 0;
    private _shapeIndex: number = 0;
    private _isClosed: boolean = true;
    protected _fill: boolean = true;
    protected _line: boolean = true;
    protected _lineWidth: number = 5;
    protected _isChange: boolean = true;
    public readonly shapeType: number = ShapeTypeEnum.None;
    public readonly instanceID: string;
    private static ShapeID: number = 10000;
    public name: string;

    constructor(data: Shape3DStruct[], shapeIndex: number) {
        this._sharedShapeStructs = data;
        this._shapeIndex = shapeIndex;
        this.instanceID = (Shape3D.ShapeID++).toString();
    }

    public get isChange() {
        return this._isChange;
    }

    public get structData() {
        if (this._isChange) {
            this._isChange = false;
            this.calcRequireSource();
            this.writeCommonData();
            this.writeShapeData();
        }
        return this._sharedShapeStructs[this._shapeIndex];
    }

    public get keyPointStart(): number {
        return this._keyPointStart;
    }
    public set keyPointStart(value: number) {
        if (value != this._keyPointStart) {
            this._isChange = true;
            this._keyPointStart = value;
        }
    }
    public get keyPointCount(): number {
        this._isChange && this.structData;
        return this._keyPointCount;
    }

    public get faceCount() {
        this._isChange && this.structData;
        return this._faceCount;
    }

    public get shapeIndex(): number {
        return this._shapeIndex;
    }
    public set shapeIndex(value: number) {
        if (value != this._shapeIndex) {
            this._isChange = true;
            this.clean();
            this._shapeIndex = value;
        }
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

    public clean() {
        let data = this._sharedShapeStructs[this._shapeIndex];
        for (let key in data) {
            data[key] = 0;
        }
    }

    private writeCommonData() {
        let data = this._sharedShapeStructs[this._shapeIndex];

        data.shapeType = this.shapeType;
        data.shapeIndex = this._shapeIndex;
        data.keyPointStart = this._keyPointStart;
        data.keyPointCount = this._keyPointCount;

        data.isClosed = this._isClosed ? 1 : 0;
        data.fill = this._fill ? 1 : 0;
        data.line = this._line ? 1 : 0;
        data.lineWidth = this._lineWidth;
    }

    protected writeShapeData(a: number = 0, b: number = 0, c: number = 0, d: number = 0, e: number = 0, f: number = 0, g: number = 0, h: number = 0) {
        let data = this._sharedShapeStructs[this._shapeIndex];
        data.xa = a;
        data.xb = b;
        data.xc = c;
        data.xd = d;

        data.xe = e;
        data.xf = f;
        data.xg = g;
        data.xh = h;
    }

    protected calcRequireSource() {
        console.warn('Need to calc key points, and faces need to require!');
    }

}