import { IQuadNode } from "../../core/tree/quad/IQuadNode";
import { QuadAABB } from "../../core/tree/quad/QuadAABB";
import { Plane3D } from "../Plane3D";
import { Vector3 } from "../Vector3";
import { DoubleArray } from "./DoubleArray";
import { Navi3DEdge } from "./Navi3DEdge";
import { Navi3DMaskType } from "./Navi3DMaskType";
import { Navi3DPoint } from "./Navi3DPoint";
import { Navi3DPoint2D } from "./Navi3DPoint2D";

export class Navi3DTriangle extends Vector3 implements IQuadNode {

    private _id: number = 0;
    private _plane: Plane3D;
    private _points: Array<Navi3DPoint> = new Array<Navi3DPoint>();

    private _edges: Array<Navi3DEdge> = new Array<Navi3DEdge>();

    private _neibourTriangles: DoubleArray = new DoubleArray();

    private _pointAgainstEdge: DoubleArray = new DoubleArray();

    private _edgeAgainstPoint: DoubleArray = new DoubleArray();

    private _mask: number = 0;

    private _aabbBox: QuadAABB;

    public f: number = 0;

    public gg: number = 0;

    public h: number = 0;

    public parent: Navi3DTriangle;

    public costMultiplier: number = 1.0;

    public openId: number = 0;

    public closeId: number = 0;

    public get aabb(): QuadAABB {
        return this._aabbBox;
    }

    public initAABB(): void {
        this._aabbBox = new QuadAABB();
        //添加节点
        this._aabbBox.addPoint(this._points[0]);
        this._aabbBox.addPoint(this._points[1]);
        this._aabbBox.addPoint(this._points[2]);
    }

    public calcGlobalQuadAABB(): void {
    }

    public get isTriangle(): boolean {
        return true;
    }

    constructor(Id: number, edgeA: Navi3DEdge, edgeB: Navi3DEdge, edgeC: Navi3DEdge) {
        super(0, 0, 0, 0);

        this._id = Id;
        this._mask = Navi3DMaskType.WalkAble;
        this._edges.push(edgeA, edgeB, edgeC);
        var edge: Navi3DEdge;
        for (edge of this._edges) {
            if (this._points.indexOf(edge.pointA) == -1) {
                this._points.push(edge.pointA);
            }
            if (this._points.indexOf(edge.pointB) == -1) {
                this._points.push(edge.pointB);
            }
        }

        this.x = (this._points[0].x + this._points[1].x + this._points[2].x) / 3;
        this.y = (this._points[0].y + this._points[1].y + this._points[2].y) / 3;
        this.z = (this._points[0].z + this._points[1].z + this._points[2].z) / 3;

        this._plane = new Plane3D();
        this._plane.fromPoints(this._points[0], this._points[1], this._points[2]);
        this._plane.normalize();

        this.genarateAgainstData();

        this.initAABB();
    }

    private genarateAgainstData(): void {
        var edge: Navi3DEdge;
        var point: Navi3DPoint;
        for (edge of this._edges) {
            for (point of this._points) {
                if (edge.pointA != point && edge.pointB != point) {
                    this._edgeAgainstPoint.put(edge, point);
                    this._pointAgainstEdge.put(point, edge);
                }
            }
        }
    }

    public get id(): number {
        return this._id;
    }

    public get plane(): Plane3D {
        return this._plane;
    }

    public get points(): Array<Navi3DPoint> {
        return this._points;
    }

    public addNeibour(edge: Navi3DEdge, triangle: Navi3DTriangle): void {
        if (this._edges.indexOf(edge) >= 0) {
            this._neibourTriangles.put(edge, triangle);
        }
        else {
            throw new Error("the edge is not in triangle!!!");
        }
    }

    public getNeibourTriangles(list: Array<Navi3DTriangle> = null, edgeMask: number = 1, triangleMask: number = 1): Array<Navi3DTriangle> {
        list = list || new Array<Navi3DTriangle>();
        list.length = 0;
        var neibour: Navi3DTriangle;
        var edge: Navi3DEdge;
        var keys: Array<any> = this._neibourTriangles.getKeys();
        var obj: any;
        for (obj of keys) {
            edge = <Navi3DEdge>obj;
            if (edge.testMask(edgeMask)) {
                neibour = this._neibourTriangles.getValueByKey(edge);
                if (neibour.testMask(triangleMask)) {
                    list.push(neibour);
                }
            }
        }
        return list;

    }

    public getEdges(list: Array<Navi3DEdge> = null, edgeMask: number = 1): Array<Navi3DEdge> {
        list = list || new Array<Navi3DEdge>();
        list.length = 0;
        var edge: Navi3DEdge;
        for (edge of this._edges) {
            if (edge.testMask(edgeMask)) {
                list.push(edge);
            }
        }
        return list;
    }

    public get walkAble(): boolean {
        return this.testMask(Navi3DMaskType.WalkAble);
    }

    public get edges(): Array<Navi3DEdge> {
        return this._edges;
    }

    public testMask(value: number): boolean {
        return (this._mask & value) == value;
    }

    public getEdgeAgainstPoint(edge: Navi3DEdge): Navi3DPoint {
        return this._edgeAgainstPoint.getValueByKey(edge);
    }

    public getPointAgainstEdge(point: Navi3DPoint): Navi3DEdge {
        return this._pointAgainstEdge.getValueByKey(point);
    }

    public getPublicEdge(triangle: Navi3DTriangle): Navi3DEdge {
        if (triangle && triangle != this) {
            var keys: Array<any> = this._neibourTriangles.getKeys();
            var obj: any;
            for (obj of keys) {
                if (this._neibourTriangles.getValueByKey(obj) == triangle)
                    return <Navi3DEdge>obj;
            }
        }
        return null;
    }

    public loopPublicEdge(triangle: Navi3DTriangle): Navi3DEdge {
        var edgeA: Navi3DEdge;
        var edgeB: Navi3DEdge;
        if (triangle && triangle != this) {
            for (edgeA of this._edges) {
                for (edgeB of triangle._edges) {
                    if (edgeA == edgeB)
                        return edgeA;
                }
            }
        }
        return null;
    }

    public randomPoint(): Vector3 {
        var pt0: Vector3 = this._points[2].subtract(this._points[0]);
        // if(Math.random() > 0.5)
        {
            pt0.scaleBy(Math.random());
        }
        pt0.incrementBy(this._points[0]);

        var pt1: Vector3 = this._points[1].subtract(pt0);

        // if(Math.random() > 0.5)
        {
            pt1.scaleBy(Math.random());
        }
        pt1.incrementBy(pt0);

        return pt1;
    }

}