import { Plane3D } from "../Plane3D";
import { PlaneClassification } from "../PlaneClassification";
import { Vector3 } from "../Vector3";
import { Navi3DConst } from "./Navi3DConst";
import { Navi3DEdge } from "./Navi3DEdge";
import { Navi3DPoint } from "./Navi3DPoint";
import { Navi3DPointFat } from "./Navi3DPointFat";
import { Navi3DRouter } from "./Navi3DRouter";
import { Navi3DTriangle } from "./Navi3DTriangle";

export class Navi3DFunnel {

    private _aiRadius: number = 0;

    private _router: Navi3DRouter;

    private _result: Array<Vector3>;

    private _tempPublicEdgeList: Array<Navi3DEdge> = new Array<Navi3DEdge>();

    private _tempSamePlaneList: Array<boolean> = new Array<boolean>();

    private static CROSS_TEST_DIRECTION: Vector3 = new Vector3();

    constructor() {
        this._router = new Navi3DRouter();
    }

    public searchPath(startPt: Vector3, endPt: Vector3, triangleList: Array<Navi3DTriangle>, radius: number = 0): boolean {
        if (radius <= 0)
            radius = 1;
        this._aiRadius = radius * 1.5;
        //
        //起点终点判断
        if (!this.searchEnable(startPt, endPt, triangleList))
            return false;

        this.search(startPt, endPt, triangleList);
        return true;
    }

    public get path(): Array<Vector3> {
        return this._result;
    }

    private searchEnable(startPt: Vector3, endPt: Vector3, triangleList: Array<Navi3DTriangle>): boolean {
        if (startPt == null || endPt == null || triangleList == null)
            return false;

        if (triangleList[0].plane.classifyPoint(startPt, Navi3DConst.EPSILON) != PlaneClassification.INTERSECT) {
            return false;
        }
        if (triangleList[triangleList.length - 1].plane.classifyPoint(endPt, Navi3DConst.EPSILON) != PlaneClassification.INTERSECT) {
            return false;
        }
        return true;
    }

    private search(startPt: Vector3, endPt: Vector3, triangleList: Array<Navi3DTriangle>): void {
        this._tempPublicEdgeList.length = 0;
        this._tempSamePlaneList.length = 0;
        var i: number = 0;
        var crossedEdgeCount: number = triangleList.length - 1;
        var tr: Navi3DTriangle;
        var curEdge: Navi3DEdge;
        var pt: Vector3;
        var plane: Plane3D;
        var crossPoint: Vector3;

        for (i = 0; i < crossedEdgeCount; i++) {
            curEdge = triangleList[i].getPublicEdge(triangleList[i + 1]);
            curEdge.crossPoint = null;
            curEdge.initFatPoints(this._aiRadius);
            this._tempPublicEdgeList.push(curEdge);
            tr = triangleList[i];
            plane = tr.plane;
            tr = triangleList[i + 1];
            pt = tr.getEdgeAgainstPoint(curEdge);

            this._tempSamePlaneList.push(plane.classifyPoint(pt, Navi3DConst.EPSILON) == PlaneClassification.INTERSECT);
        }

        this._router.continuePass(startPt, endPt, this._tempPublicEdgeList[0]);
        crossedEdgeCount = this._tempPublicEdgeList.length;


        var cornerPoint: Vector3;
        var cornerEdge: Navi3DEdge;
        var continuePass: boolean;
        var lastEdge: boolean;

        for (i = 0; i < crossedEdgeCount; i++) {
            curEdge = this._tempPublicEdgeList[i];
            tr = triangleList[i + 1];
            lastEdge = i == crossedEdgeCount - 1;
            if (lastEdge) {
                pt = endPt;
            }
            else {
                pt = tr.getEdgeAgainstPoint(curEdge);
            }

            continuePass = this._router.passEdge(curEdge, this._tempPublicEdgeList[i + 1], pt, lastEdge);
            if (!continuePass) {
                cornerPoint = this._router.cornerPoint;
                cornerEdge = this._router.cornerEdge;
                i = this._tempPublicEdgeList.indexOf(cornerEdge);
                this._router.continuePass(cornerPoint, endPt, this._tempPublicEdgeList[i + 1]);
            }
        }


        this.pushAllPathPoint2(startPt, endPt);
        if (this._result.length >= 3) {
            this.optimusTerminusFat();
            this.optimusByRadius();
        }

        //copy result
        let list: Vector3[] = [];
        for (let point of this._result) {
            list.push(new Vector3().copyFrom(point));
        }
        this._result = list;
    }

    private optimusTerminusFat(): void {
        var startFat: Navi3DPointFat;
        var endFat: Navi3DPointFat;
        var pt: any;

        pt = this._result[1];
        if (pt instanceof Navi3DPointFat) {
            startFat = <Navi3DPointFat>pt;
        }

        pt = this._result[this._result.length - 2];
        if (pt instanceof Navi3DPointFat) {
            endFat = <Navi3DPointFat>pt;
        }

        if (startFat) {
            this._result[1] = startFat.scalePoint();
        }
        if (endFat && startFat != endFat) {
            this._result[this._result.length - 2] = endFat.scalePoint();
        }

    }

    private pushAllPathPoint2(startPt: Vector3, endPt: Vector3): void {
        var crossedEdgeCount: number = this._tempPublicEdgeList.length;
        var curEdge: Navi3DEdge;
        var curEdgeJ: Navi3DEdge;

        this._result = new Array<Vector3>();
        this._result.push(startPt);


        var fromPoint: Vector3 = startPt;
        var toPoint: Vector3;
        var fatPoint: Navi3DPointFat;
        var crossPoint: Vector3;


        for (var i: number = 0; i < crossedEdgeCount; i++) {
            curEdge = this._tempPublicEdgeList[i];
            fatPoint = null;
            if (curEdge.crossPoint) {
                fatPoint = this.getFatPoint(curEdge, curEdge.crossPoint);
                if (fatPoint) {
                    this._result.push(fatPoint);
                }
                else {
                    this._result.push(curEdge.crossPoint);
                }
                fromPoint = curEdge.crossPoint;
            }
            else {
                curEdgeJ = null;
                toPoint = null;
                //找到下一个点
                for (var j: number = i + 1; j < crossedEdgeCount; j++) {
                    curEdgeJ = this._tempPublicEdgeList[j];
                    toPoint = curEdgeJ.crossPoint;
                    if (toPoint) {
                        break;
                    }
                }

                if (toPoint == null) {
                    toPoint = endPt;
                }
                fatPoint = this.getFatPoint(curEdge, toPoint);
                if (fatPoint) {
                    this._result.push(fatPoint);
                }
                else {
                    if (toPoint == fromPoint) {
                        crossPoint = toPoint.clone();
                    } else {
                        Navi3DFunnel.CROSS_TEST_DIRECTION.setTo(toPoint.x - fromPoint.x, 0, toPoint.z - fromPoint.z);
                        crossPoint = this._router.calcCrossEdge(curEdge, fromPoint, Navi3DFunnel.CROSS_TEST_DIRECTION);
                    }
                    this._result.push(crossPoint);
                }
            }
        }
        this._result.push(endPt);
    }

    private optimusByRadius(): void {
        var optimusResult: Array<Vector3> = new Array<Vector3>();
        optimusResult.length = this._result.length;

        var count: number = this._result.length - 2;
        var pt0: Vector3;
        var pt1: Vector3;
        var pt2: Vector3;

        var fatPt0: Navi3DPointFat;
        var fatPt1: Navi3DPointFat;
        var fatPt2: Navi3DPointFat;

        var edgePt0: Navi3DPoint;
        var edgePt1: Navi3DPoint;
        var edgePt2: Navi3DPoint;


        var centerEdge: Navi3DEdge;

        var checkEnable: boolean;
        var optimusPoint: Vector3;
        var i: number;


        for (i = 0; i < count; i++) {
            edgePt0 = edgePt1 = edgePt2 = null;
            fatPt0 = fatPt1 = fatPt2 = null;
            checkEnable = false;
            optimusPoint = null;

            pt0 = this._result[i];
            pt1 = this._result[i + 1];
            pt2 = this._result[i + 2];
            if (pt0 instanceof Navi3DPointFat) {
                fatPt0 = <Navi3DPointFat>pt0;
            }
            if (pt1 instanceof Navi3DPointFat) {
                fatPt1 = <Navi3DPointFat>pt1;
            }
            if (pt2 instanceof Navi3DPointFat) {
                fatPt2 = <Navi3DPointFat>pt2;
            }

            if (fatPt0) {
                edgePt0 = fatPt0.ownerPoint;
            }
            if (fatPt1) {
                edgePt1 = fatPt1.ownerPoint;
            }
            if (fatPt2) {
                edgePt2 = fatPt2.ownerPoint;
            }

            if (edgePt0 && edgePt1 && edgePt0 == edgePt1 && edgePt1 != edgePt2) {
                checkEnable = true;
            }

            if (edgePt2 && edgePt1 && edgePt2 == edgePt1 && edgePt0 != edgePt1) {
                checkEnable = true;
            }

            if (checkEnable) {
                Navi3DFunnel.CROSS_TEST_DIRECTION.copyFrom(pt0);
                Navi3DFunnel.CROSS_TEST_DIRECTION.decrementBy(pt2);
                centerEdge = fatPt1.ownerEdge;

                checkEnable = this._router.hasCrossPoint(centerEdge.pointA, centerEdge.pointB, pt2, Navi3DFunnel.CROSS_TEST_DIRECTION);
                if (checkEnable) {
                    optimusPoint = this._router.calcCrossPointOut(edgePt1, pt1, pt2, Navi3DFunnel.CROSS_TEST_DIRECTION);
                }
                if (optimusPoint) {
                    optimusResult[i + 1] = optimusPoint;
                }
            }
        }
    }

    private getFatPoint(edge: Navi3DEdge, target: Vector3): Navi3DPointFat {
        if (edge == null)
            return null;
        var fatPoint: Navi3DPointFat;
        if (target instanceof Navi3DPointFat) {
            fatPoint = <Navi3DPointFat>target;
        }
        var edgePoint: Navi3DPoint;
        if (fatPoint) {
            edgePoint = fatPoint.ownerPoint;
        }
        else {
            edgePoint = edge.getEqualPoint(target);
        }

        if (edgePoint == null)
            return null;
        fatPoint = edge.getFatPoint(edgePoint);
        return fatPoint;
    }


}