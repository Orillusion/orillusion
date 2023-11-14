import { Vector3 } from "../Vector3";
import { Navi3DConst } from "./Navi3DConst";

export class Navi3DPoint extends Vector3 {

    public static CALC_VECTOR3D1: Vector3 = new Vector3();

    public static CALC_VECTOR3D2: Vector3 = new Vector3();

    public static CALC_VECTOR3D3: Vector3 = new Vector3();

    public static CALC_VECTOR3D4: Vector3 = new Vector3();

    public static CALC_VECTOR3D5: Vector3 = new Vector3();

    private _pointId: number = 0;

    constructor(id: number, X: number, Y: number, Z: number) {
        super(X, Y, Z, 0);
        this._pointId = id;
    }

    public get id(): number {
        return this._pointId;
    }

    public static equalPoint(p1: Vector3, p2: Vector3): boolean {
        return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y) + (p1.z - p2.z) * (p1.z - p2.z) < Navi3DConst.POWER_EPSILON;
    }

    public static calcDistance(pt1: Vector3, pt2: Vector3): number {
        Navi3DPoint.CALC_VECTOR3D3.setTo(pt1.x - pt2.x, pt1.y - pt2.y, pt1.z - pt2.z);
        return Navi3DPoint.CALC_VECTOR3D3.length;
    }

}