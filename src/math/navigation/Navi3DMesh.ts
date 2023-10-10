import { IQuadNode } from "../../core/tree/quad/IQuadNode";
import { QuadRoot } from "../../core/tree/quad/QuadRoot";
import { Vector3 } from "../Vector3";
import { DoubleArray } from "./DoubleArray";
import { Navi3DAstar } from "./Navi3DAstar";
import { Navi3DEdge } from "./Navi3DEdge";
import { Navi3DFunnel } from "./Navi3DFunnel";
import { Navi3DPoint } from "./Navi3DPoint";
import { Navi3DTriangle } from "./Navi3DTriangle";

export class Navi3DMesh {

    private _nav3dPoints: Array<Navi3DPoint>;
    private _nav3dEdges: Array<Navi3DEdge>;
    private _nav3dTriangles: Array<Navi3DTriangle>;
    private _path: Array<Vector3>;
    private _edgesDict: DoubleArray;

    private _nav3dAstar: Navi3DAstar;

    private _nav3dFunnel: Navi3DFunnel;

    private _terrainQuad: QuadRoot;

    private _triangleList: Array<Navi3DTriangle>;

    public get edges(): Array<Navi3DEdge> {
        return this._nav3dEdges;
    }

    public get points(): Array<Navi3DPoint> {
        return this._nav3dPoints;
    }

    public get path(): Array<Vector3> {
        return this._path;
    }

    public get triangles(): Array<Navi3DTriangle> {
        return this._nav3dTriangles;
    }

    constructor(pointList: Array<Vector3>, triangleIndexList: Array<Array<number>>) {
        this._nav3dPoints = new Array<Navi3DPoint>();
        this._nav3dEdges = new Array<Navi3DEdge>();
        this._nav3dTriangles = new Array<Navi3DTriangle>();
        this._edgesDict = new DoubleArray();

        this.initPoints(pointList);
        this.initEdgesAndTriangles(triangleIndexList);

        this.createConnections();


        this._nav3dAstar = new Navi3DAstar();
        this._nav3dFunnel = new Navi3DFunnel();


        this._terrainQuad = new QuadRoot(8, 128);
        this._terrainQuad.createQuadTree(this._nav3dTriangles);
    }

    public getTriangleAtPoint(point: Vector3, threshold: number = 5): IQuadNode {
        return this._terrainQuad.getTriangleAtPoint(point, threshold);
    }

    public findPath(startPt: Vector3, endPt: Vector3, aiRadius: number = 5): boolean {
        this._path = null;
        this._triangleList = null;

        var startNode: Navi3DTriangle = this.getTriangleAtPoint(startPt, 10) as any;
        var endNode: Navi3DTriangle = this.getTriangleAtPoint(endPt, 10) as any;

        var success: boolean = this._nav3dAstar.findPath(this, startNode, endNode);
        if (success) {
            this._triangleList = this._nav3dAstar.channel;
            success = this._nav3dFunnel.searchPath(startPt, endPt, this._triangleList, aiRadius);
            this._path = this._nav3dFunnel.path;
            return success;
        }
        return false;
    }

    private initPoints(pointList: Array<Vector3>): void {
        var point: Vector3;
        var nevPoint: Navi3DPoint;
        var count: number = pointList.length;
        for (var i: number = 0; i < count; i++) {
            point = pointList[i];
            nevPoint = new Navi3DPoint(i, point.x, point.y, point.z);
            this._nav3dPoints.push(nevPoint);
        }
    }

    private initEdgesAndTriangles(triangleIndexList: Array<Array<number>>): void {
        var indexOrderList: Array<number>;

        var edge0: Navi3DEdge;
        var edge1: Navi3DEdge;
        var edge2: Navi3DEdge;

        var triangle: Navi3DTriangle;

        var count: number = triangleIndexList.length;
        for (var i: number = 0; i < count; i++) {
            indexOrderList = triangleIndexList[i];
            edge0 = this.tryCreateEdge(indexOrderList[0], indexOrderList[1]);
            edge1 = this.tryCreateEdge(indexOrderList[1], indexOrderList[2]);
            edge2 = this.tryCreateEdge(indexOrderList[2], indexOrderList[0]);

            if (edge0 == null || edge1 == null || edge2 == null)
                continue;
            triangle = new Navi3DTriangle(i, edge0, edge1, edge2);
            this._nav3dTriangles.push(triangle);
        }
    }

    private tryCreateEdge(pointAId: number, pointBId: number): Navi3DEdge {
        if (pointAId == pointBId) {
            throw new Error("edge point index error!!!");
        }
        if (pointAId > pointBId) {
            var tempId: number = pointAId;
            pointAId = pointBId;
            pointBId = tempId;
        }
        var edge: Navi3DEdge = this._edgesDict.getValueByKey(pointAId + "_" + pointBId);
        if (edge == null) {
            edge = new Navi3DEdge(this._nav3dPoints[pointAId], this._nav3dPoints[pointBId]);
            this._nav3dEdges.push(edge);
            this._edgesDict.put(pointAId + "_" + pointBId, edge);

        }
        return edge;
    }

    private createConnections(): void {
        var triangleACount: number = this._nav3dTriangles.length;
        var triangleBCount: number = this._nav3dTriangles.length;
        var triangleA: Navi3DTriangle;
        var triangleB: Navi3DTriangle;
        var edge: Navi3DEdge;
        var publicEdge: Navi3DEdge;

        for (var i: number = 0; i < triangleACount; i++) {
            //边上面记录拥有这条边的三角形
            triangleA = this._nav3dTriangles[i];
            for (edge of triangleA.edges) {
                edge.addTriangleOwners(triangleA);
            }

            for (var j: number = 0; j < triangleBCount; j++) {
                //三角形相邻关系
                triangleB = this._nav3dTriangles[j];
                if (triangleA == triangleB)
                    continue;
                publicEdge = triangleA.loopPublicEdge(triangleB);
                if (publicEdge) {
                    triangleA.addNeibour(publicEdge, triangleB);
                    triangleB.addNeibour(publicEdge, triangleA);
                }
            }
        }

    }

}