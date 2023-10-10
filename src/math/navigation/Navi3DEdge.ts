import { Vector3 } from "../Vector3";
import { Navi3DMaskType } from "./Navi3DMaskType";
import { Navi3DPoint } from "./Navi3DPoint";
import { Navi3DPointFat } from "./Navi3DPointFat";
import { Navi3DTriangle } from "./Navi3DTriangle";

export class Navi3DEdge {

    private _edgeMask: number = 0;
    private _edgeSize: number = 0;
    private _pointA: Navi3DPoint;
    private _pointB: Navi3DPoint;
    private _triangleOwners: Array<Navi3DTriangle>;
    private _centerPoint: Vector3;

    private _edgeDirA2B: Vector3;

    public crossPoint: Vector3;

    public fatPointA: Navi3DPointFat;

    public fatPointB: Navi3DPointFat;

    private static CALC_FAT_VECTOR: Vector3 = new Vector3();

    constructor(point0: Navi3DPoint, point1: Navi3DPoint) {
        this._pointA = point0;
        this._pointB = point1;
        if (point0.id >= point1.id) {
            throw new Error("edge point order error!!!");
        }
        this._triangleOwners = new Array<Navi3DTriangle>();
        this._centerPoint = new Vector3();
        this._edgeMask = Navi3DMaskType.WalkAble;
        Navi3DPoint.CALC_VECTOR3D1.setTo(point0.x - point1.x, point0.y - point1.y, point0.z - point1.z);
        this._edgeSize = Navi3DPoint.CALC_VECTOR3D1.length;

        this._centerPoint.setTo((point0.x + point1.x) / 2, (point0.y + point1.y) / 2, (point0.z + point1.z) / 2);
    }

    public get size(): Number {
        return this._edgeSize;
    }

    public get triangleOwners(): Array<Navi3DTriangle> {
        return this._triangleOwners;
    }

    public get centerPoint(): Vector3 {
        return this._centerPoint;
    }

    public initFatPoints(radius: number): void {
        this._edgeDirA2B = this._pointB.subtract(this._pointA);
        this._edgeDirA2B.normalize();

        this.fatPointA = this.fatPointA || new Navi3DPointFat(this._pointA, this);
        this.fatPointB = this.fatPointB || new Navi3DPointFat(this._pointB, this);

        if (this.fatPointA.radius != radius) {
            Navi3DEdge.CALC_FAT_VECTOR.copyFrom(this._edgeDirA2B);
            Navi3DEdge.CALC_FAT_VECTOR.scaleBy(radius);
            Navi3DEdge.CALC_FAT_VECTOR.incrementBy(this._pointA);
            this.fatPointA.copyFrom(Navi3DEdge.CALC_FAT_VECTOR);
            this.fatPointA.radius = radius;
        }

        if (this.fatPointB.radius != radius) {
            Navi3DEdge.CALC_FAT_VECTOR.copyFrom(this._edgeDirA2B);
            Navi3DEdge.CALC_FAT_VECTOR.scaleBy(-radius);
            Navi3DEdge.CALC_FAT_VECTOR.incrementBy(this._pointB);
            this.fatPointB.copyFrom(Navi3DEdge.CALC_FAT_VECTOR);
            this.fatPointB.radius = radius;
        }

    }

    public getFatPoint(pt: Navi3DPoint): Navi3DPointFat {
        if (pt == this._pointA)
            return this.fatPointA;
        return this.fatPointB;
    }

    public getAnotherFatPoint(pt: Navi3DPoint): Navi3DPointFat {
        if (pt == this._pointA)
            return this.fatPointB;
        return this.fatPointA;
    }

    public getAnotherPoint(pt: Navi3DPoint): Navi3DPoint {
        if (pt == this._pointA)
            return this._pointB;
        return this._pointA;
    }

    public containsPoint(pt: Vector3): Navi3DPoint {
        if (Navi3DPoint.equalPoint(pt, this._pointA))
            return this._pointA;
        if (Navi3DPoint.equalPoint(pt, this._pointB))
            return this._pointB;
        return null;
    }

    public addTriangleOwners(triangle: Navi3DTriangle): void {
        if (triangle.edges.indexOf(this) == -1) {
            throw new Error("the edge is not belong triangle!!!");
        }
        if (this._triangleOwners.indexOf(triangle) == -1) {
            this._triangleOwners.push(triangle);
        }
    }

    public getPublicPoint(edge: Navi3DEdge): Navi3DPoint {
        if (this._pointA == edge._pointA || this._pointA == edge._pointB) {
            return this._pointA;
        }
        else if (this._pointB == edge._pointA || this._pointB == edge._pointB) {
            return this._pointB;
        }
        return null;
    }

    public getEqualPoint(p: Vector3): Navi3DPoint {
        if (Navi3DPoint.equalPoint(p, this._pointA))
            return this._pointA;
        if (Navi3DPoint.equalPoint(p, this._pointB))
            return this._pointB;
        return null;
    }

    public get pointA(): Navi3DPoint {
        return this._pointA;
    }

    public get pointB(): Navi3DPoint {
        return this._pointB;
    }

    public get walkAble(): boolean {
        return (this._edgeMask & Navi3DMaskType.WalkAble) == Navi3DMaskType.WalkAble;
    }

    public testMask(value: number): boolean {
        return (this._edgeMask & value) == value;
    }

}