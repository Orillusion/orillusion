import { Color, Vector4 } from "@orillusion/core";
import { DynamicDrawStruct } from "../graphic3d/DynamicDrawStruct";

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
    Path2D = 4,
    Path3D = 5,
}

export enum CircleArcType {
    Sector = 0,
    Moon = 1
}


/**
 * Used to describe the key points for drawing a path, where xy refers to the data in the xz direction. H is the data in the y direction
 * If you want to give this Shape transform attribute, you can control the transformation of the binded Object3D to achieve the goal
 * @export
 * @class Point3D
 */
export class Point3D {

    public static HELP_0: Point3D = new Point3D();
    public static HELP_1: Point3D = new Point3D();
    public static HELP_2: Point3D = new Point3D();

    constructor(x: number = 0, y: number = 0, h: number = 0, invalid?: boolean) {
        this.set(x, y, h, invalid);
    }

    public set(x: number, y: number, h: number = 0, invalid?: boolean) {
        this.x = x;
        this.y = y;
        this.h = h;
        this.invalid = invalid;
    }

    public copyFrom(src: Point3D): this {
        this.x = src.x;
        this.y = src.y;
        this.h = src.h;
        this.invalid = src.invalid;
        return this;
    }

    public x: number;
    public y: number;
    public h: number;
    public invalid: boolean;
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
    protected _points3D: Point3D[];
    protected _indecies: number[];
    protected _isClosed: boolean = true;
    protected _fill: boolean = true;
    protected _line: boolean = true;
    protected _lineWidth: number = 5;
    protected _isChange: boolean = true;
    private _lineTextureID: number = 0;
    private _fillTextureID: number = 0;
    private _lineColor: Color = new Color(1, 0, 1, 1);
    private _fillColor: Color = new Color(0, 1, 0, 1);
    private _fillRotation: number = 0;
    private _fillUVRect: Vector4 = new Vector4(0, 0, 1, 1);
    private _lineUVRect: Vector4 = new Vector4(0, 0, 1, 1);
    private _uvSpeed: Vector4 = new Vector4();
    public readonly shapeIndex: number = 0;
    public readonly shapeType: number = ShapeTypeEnum.None;
    public readonly computeEveryFrame?: boolean;

    constructor(structs: Shape3DStruct, sharedPoints: Float32Array, sharedIndecies: Uint32Array, matrixIndex: number) {
        this._shapeStruct = structs;
        this._sharedSrcPoints = sharedPoints;
        this._sharedSrcIndecies = sharedIndecies;
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

    public get fillRotation(): number {
        return this._fillRotation;
    }
    public set fillRotation(value: number) {
        if (this._fillRotation != value) {
            this._fillRotation = value;
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

    public get points3D(): Point3D[] {
        return this._points3D;
    }
    public set points3D(value: Point3D[]) {
        this._points3D = value;
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


    /**
    * x: u offset of line.
    * y: v offset of line.
    * z: u scale of line.
    * w: v scale of line.
    *
    * @type {Vector4}
    * @memberof Shape3D
    */
    public get lineUVRect(): Vector4 {
        return this._lineUVRect;
    }
    public set lineUVRect(value: Vector4) {
        this._lineUVRect.copyFrom(value);
        this._isChange = true;
    }

    /**
     * x: u offset of filled area.
     * y: v offset of filled area.
     * z: u scale of filled area.
     * w: v scale of filled area.
     *
     * @type {Vector4}
     * @memberof Shape3D
     */
    public get fillUVRect(): Vector4 {
        return this._fillUVRect;
    }
    public set fillUVRect(value: Vector4) {
        this._fillUVRect.copyFrom(value);
        this._isChange = true;
    }

    /**
     * x: u speed of filled area.
     * y: v speed of filled area.
     * z: u speed of line.
     * w: v speed of line.
     *
     * @type {Vector4}
     * @memberof Shape3D
     */
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
            for (let point of this._points3D) {
                array[index + 0] = point.x;
                array[index + 1] = point.h;
                array[index + 2] = point.y;
                array[index + 3] = point.invalid ? 1 : 0;
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
                array[index + 3] = 0;
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