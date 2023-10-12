import { Vector3 } from "../Vector3";
import { Navi3DEdge } from "./Navi3DEdge";
import { Navi3DPoint } from "./Navi3DPoint";

export class Navi3DRouter {

    public endPoint: Vector3;

    public curPoint: Vector3;

    public rayA: Vector3;

    public rayB: Vector3;

    public rayAPoint: Navi3DPoint;

    public rayBPoint: Navi3DPoint;

    public static RAY_1: Vector3 = new Vector3();

    public static RAY_2: Vector3 = new Vector3();

    public static TEST_RAY: Vector3 = new Vector3();

    public static TEST_RAY_1: Vector3 = new Vector3();

    public static TEST_RAY_2: Vector3 = new Vector3();

    private static CALC_CROSS_POINT: Vector3 = new Vector3();

    private static CALC_CROSS_TEST: Vector3 = new Vector3();

    public cornerPoint: Navi3DPoint;

    public cornerEdge: Navi3DEdge;

    public continuePass(fromPt: Vector3, endPt: Vector3, fromEdge: Navi3DEdge): void {
        this.resetData();
        this.curPoint = fromPt;
        this.endPoint = endPt;
        this.cornerEdge = fromEdge;
    }

    public passEdge(commonEdge: Navi3DEdge, nextCommonEdge: Navi3DEdge, targetPoint: Vector3, lastEdge: boolean): boolean {
        if (this.rayA == null || this.rayB == null) {
            this.rayA = Navi3DRouter.RAY_1;
            this.rayB = Navi3DRouter.RAY_2;
            this.rayAPoint = commonEdge.pointA;
            this.rayBPoint = commonEdge.pointB;

            this.rayA.setTo(this.rayAPoint.x - this.curPoint.x, 0, this.rayAPoint.z - this.curPoint.z);
            this.rayB.setTo(this.rayBPoint.x - this.curPoint.x, 0, this.rayBPoint.z - this.curPoint.z);
        }

        if (lastEdge) {
            return this.checkEndPoint(targetPoint);
        }

        Navi3DRouter.TEST_RAY.setTo(targetPoint.x - this.curPoint.x, 0, targetPoint.z - this.curPoint.z);

        if (this.isPointAtCenter(Navi3DRouter.TEST_RAY, this.rayA, this.rayB)) {
            if (!this.hasCrossPoint(nextCommonEdge.pointA, nextCommonEdge.pointB, this.rayAPoint, this.rayA)) {
                this.rayA.copyFrom(Navi3DRouter.TEST_RAY);
                if (targetPoint instanceof Navi3DPoint) {
                    this.rayAPoint = <Navi3DPoint>targetPoint;
                }
                else {
                    this.rayAPoint = null;
                }

            }
            else {
                this.rayB.copyFrom(Navi3DRouter.TEST_RAY);
                if (targetPoint instanceof Navi3DPoint) {
                    this.rayBPoint = <Navi3DPoint>targetPoint;
                }
                else {
                    this.rayBPoint = null;
                }
            }

            var anotherPoint: Navi3DPoint = nextCommonEdge.getAnotherPoint(<Navi3DPoint>targetPoint);
            Navi3DRouter.TEST_RAY.setTo(anotherPoint.x - this.curPoint.x, 0, anotherPoint.z - this.curPoint.z);
            if (anotherPoint == this.rayAPoint || anotherPoint == this.rayBPoint || this.isPointAtCenter(Navi3DRouter.TEST_RAY, this.rayA, this.rayB)) {
                this.cornerEdge = nextCommonEdge;
            }
        }
        else {
            var needReturn: boolean;
            Navi3DRouter.TEST_RAY_1.copyFrom(nextCommonEdge.pointA);
            Navi3DRouter.TEST_RAY_1.decrementBy(this.curPoint);
            Navi3DRouter.TEST_RAY_2.copyFrom(nextCommonEdge.pointB);
            Navi3DRouter.TEST_RAY_2.decrementBy(this.curPoint);
            Navi3DRouter.TEST_RAY_1.y = 0;
            Navi3DRouter.TEST_RAY_2.y = 0;
            if (this.isPointAtCenter(this.rayA, Navi3DRouter.TEST_RAY_1, Navi3DRouter.TEST_RAY_2)
                || this.isPointAtCenter(this.rayB, Navi3DRouter.TEST_RAY_1, Navi3DRouter.TEST_RAY_2)) {
                needReturn = false;
            }
            else {
                needReturn = true;
            }

            if (needReturn) {
                if (this.isPointAtCenter(this.rayA, Navi3DRouter.TEST_RAY, this.rayB)) {
                    this.cornerPoint = this.rayAPoint;
                }
                else {
                    this.cornerPoint = this.rayBPoint;
                }

                this.cornerEdge.crossPoint = this.cornerPoint;
                return false;
            }
        }
        return true;
    }

    private checkEndPoint(targetPoint: Vector3): boolean {

        Navi3DRouter.TEST_RAY.setTo(targetPoint.x - this.curPoint.x, 0, targetPoint.z - this.curPoint.z);
        if (this.isPointAtCenter(Navi3DRouter.TEST_RAY, this.rayA, this.rayB)) {
            //
        }
        else {
            if (this.isPointAtCenter(this.rayA, Navi3DRouter.TEST_RAY, this.rayB)) {
                this.cornerPoint = this.rayAPoint;
            }
            else {
                this.cornerPoint = this.rayBPoint;
            }
            this.cornerEdge.crossPoint = this.cornerPoint;
            return false;
        }
        return true;
    }

    public calcCrossEdge(_edge: Navi3DEdge, linePoint: Vector3, lineDirection: Vector3): Vector3 {
        return this.calcCrossPoint(_edge.fatPointA, _edge.fatPointB, linePoint, lineDirection);
    }

    public calcCrossPoint(segmentPt1: Vector3, segmentPt2: Vector3, linePoint: Vector3, lineDirection: Vector3): Vector3 {
        Navi3DRouter.CALC_CROSS_POINT.copyFrom(segmentPt2);
        Navi3DRouter.CALC_CROSS_POINT.decrementBy(segmentPt1);

        let distance = Navi3DRouter.CALC_CROSS_POINT.x * lineDirection.z - lineDirection.x * Navi3DRouter.CALC_CROSS_POINT.z;
        var scale: number = 0;
        if (distance != 0) {
            scale = ((segmentPt1.z - linePoint.z) * lineDirection.x - (segmentPt1.x - linePoint.x) * lineDirection.z) / distance;
        }

        if (scale > 1) {
            scale = 1;
        }
        else if (scale < 0) {
            scale = 0;
        }
        Navi3DRouter.CALC_CROSS_POINT.scaleBy(scale);
        Navi3DRouter.CALC_CROSS_POINT.incrementBy(segmentPt1);
        return Navi3DRouter.CALC_CROSS_POINT.clone();
    }

    public calcCrossPointOut(segmentPt1: Vector3, segmentPt2: Vector3, linePoint: Vector3, lineDirection: Vector3): Vector3 {
        Navi3DRouter.CALC_CROSS_POINT.copyFrom(segmentPt2);
        Navi3DRouter.CALC_CROSS_POINT.decrementBy(segmentPt1);

        var scale: number = ((segmentPt1.z - linePoint.z) * lineDirection.x - (segmentPt1.x - linePoint.x) * lineDirection.z) /
            (Navi3DRouter.CALC_CROSS_POINT.x * lineDirection.z - lineDirection.x * Navi3DRouter.CALC_CROSS_POINT.z);

        if (scale <= 1 && scale >= 0) {
            return null;
        }
        Navi3DRouter.CALC_CROSS_POINT.scaleBy(scale);
        Navi3DRouter.CALC_CROSS_POINT.incrementBy(segmentPt1);
        return Navi3DRouter.CALC_CROSS_POINT.clone();
    }

    public hasCrossPoint(segmentPt1: Vector3, segmentPt2: Vector3, linePoint: Vector3, lineDirection: Vector3): boolean {
        Navi3DRouter.CALC_CROSS_TEST.copyFrom(segmentPt2);
        Navi3DRouter.CALC_CROSS_TEST.decrementBy(segmentPt1);

        var scale: number = ((segmentPt1.z - linePoint.z) * lineDirection.x - (segmentPt1.x - linePoint.x) * lineDirection.z) /
            (Navi3DRouter.CALC_CROSS_TEST.x * lineDirection.z - lineDirection.x * Navi3DRouter.CALC_CROSS_TEST.z);
        return scale <= 1 && scale >= 0;
    }

    private isPointAtCenter(point: Vector3, vectorA: Vector3, vectorB: Vector3): boolean {
        var cp1: Vector3 = vectorA.crossProduct(point);
        if (cp1.length == 0 && point.length < vectorA.length) {
            return true;
        }

        var cp2: Vector3 = vectorB.crossProduct(point);
        if (cp2.length == 0 && point.length < vectorB.length) {
            return true;
        }

        cp1.normalize();
        cp2.normalize();
        cp1.incrementBy(cp2);

        return cp1.length < 0.01;
    }

    public resetData(): void {
        this.cornerEdge = null;
        this.cornerPoint = null;

        this.curPoint = null;
        this.rayA = this.rayB = null;
        this.rayAPoint = this.rayBPoint = null;

        Navi3DRouter.RAY_1.setTo(0, 0, 0);
        Navi3DRouter.RAY_2.setTo(0, 0, 0);
    }


}