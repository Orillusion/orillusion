import { Navi3DEdge } from "./Navi3DEdge";
import { Navi3DPoint } from "./Navi3DPoint";

export class Navi3DPointFat extends Navi3DPoint {

    private _ownerPoint: Navi3DPoint;
    private _ownerEdge: Navi3DEdge;

    public radius: number = 0;

    constructor(_point: Navi3DPoint, _edge: Navi3DEdge) {
        super(_point.id, 0, 0, 0);
        this._ownerEdge = _edge;
        this._ownerPoint = _point;
    }

    public get ownerPoint(): Navi3DPoint {
        return this._ownerPoint;
    }

    public get ownerEdge(): Navi3DEdge {
        return this._ownerEdge;
    }

    public scalePoint(value: number = 0.7): Navi3DPointFat {
        var point: Navi3DPointFat = new Navi3DPointFat(this._ownerPoint, this._ownerEdge);
        point.copyFrom(this);
        point.decrementBy(this._ownerPoint);
        point.scaleBy(value);
        point.radius = point.length;
        point.incrementBy(this._ownerPoint);
        return point;

    }

}