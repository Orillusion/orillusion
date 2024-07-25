import { LineJoin } from "../graphic3d/Graphic3DFaceRenderer";
import { Point3D, Shape3D, ShapeTypeEnum } from "./Shape3D";
import { Earcut } from "./Earcut";

type vec3 = { x: number, y: number, h?: number };

/**
 * Define class for drawing line path on the xz plane, by inputs xz coords.
 * You can use the API implemented in CanvasPath in Path2DShape3D to draw the xz plane path
 *
 * @export
 * @class LineShape3D
 * @extends {Shape3D}
 */
export class LineShape3D extends Shape3D {
    protected _corner: number = 8;
    protected _lineJoin: LineJoin = LineJoin.bevel;
    public readonly shapeType: number = Number(ShapeTypeEnum.Path2D);

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

        if (this._fill && this._points3D.length > 2) {
            let coords: number[] = [];
            for (let point of this._points3D) {
                coords.push(point.x, point.y);
            }
            this._indecies = Earcut.triangulate(coords); // earcut(coords);
            this._srcIndexCount = this._indecies?.length || 0;
        } else {
            this._indecies = null;
            this._srcIndexCount = 0;
        }
    }

    public sampleQuadraticCurve(start: vec3, cp: vec3, end: vec3, t: number, ret?: vec3) {
        ret ||= new Point3D();
        let p0 = this.mixVector3(start, cp, t, Point3D.HELP_0);
        let p1 = this.mixVector3(cp, end, t, Point3D.HELP_1);

        p0 = this.mixVector3(p0, p1, t, ret);

        return ret;
    }

    public sampleCurve(start: vec3, cp1: vec3, cp2: vec3, end: vec3, t: number, ret?: vec3) {
        ret ||= new Point3D();
        let p0 = this.mixVector3(start, cp1, t, Point3D.HELP_0);
        let p1 = this.mixVector3(cp1, cp2, t, Point3D.HELP_1);
        let p2 = this.mixVector3(cp2, end, t, Point3D.HELP_2);

        p0 = this.mixVector3(p0, p1, t, p0);
        p1 = this.mixVector3(p1, p2, t, p1);

        p0 = this.mixVector3(p0, p1, t, ret);

        return ret;
    }

    protected writeShapeData() {
        super.writeShapeData(this._lineJoin, this._corner);
    }

    protected mixVector3(src: vec3, dest: vec3, t: number, ret?: vec3) {
        ret ||= new Point3D(0, 0, 0);
        ret.x = this.mixFloat(src.x, dest.x, t);
        ret.y = this.mixFloat(src.y, dest.y, t);
        ret.h = this.mixFloat(src.h, dest.h, t);
        return ret;
    }

    protected mixFloat(src: number, dest: number, t: number) {
        return src * (1 - t) + dest * t;
    }
}