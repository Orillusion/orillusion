import { Vector3 } from './Vector3';

/**
 * Cubic Bezier Curve
 * @group Math
 */
export class CubicBezierCurve {
    private controlVertices: Vector3[];

    /**
     * @constructor
     * @param cvs controller points
     */
    constructor(cvs: Vector3[]) {
        this.setControlVertices(cvs);
    }

    /**
     * update controller points
     * @param cvs controller points
     */
    public setControlVertices(cvs: Vector3[]) {
        // Cubic Bezier curves require 4 cvs.
        if (cvs.length == 4) {
            this.controlVertices = cvs.concat();
        }
    }

    /**
     * get position by calc from curve
     * @param t a position in range [0-1]
     * @returns Vector3
     */
    public getPoint(t: number): Vector3 {
        if (!(t >= 0.0 && t <= 1.0)) {
            return Vector3.ZERO;
        }
        let c = 1.0 - t;

        let bb0 = c * c * c;
        let bb1 = 3 * t * c * c;
        let bb2 = 3 * t * t * c;
        let bb3 = t * t * t;

        let point = this.controlVertices[0].mul(bb0).add(this.controlVertices[1].mul(bb1)).add(this.controlVertices[2].mul(bb2)).add(this.controlVertices[3].mul(bb3));

        return point;
    }

    /**
     * get tagent by calc from curve
     * @param t a position in range [0-1]
     * @returns tagent direction
     * See: http://bimixual.org/AnimationLibrary/beziertangents.html
     */
    public getTangent(t: number): Vector3 {
        if (!(t >= 0.0 && t <= 1.0)) {
            return Vector3.ZERO
        }
        let controlVerts = this.controlVertices;
        let q0 = controlVerts[0].add(controlVerts[1].add(controlVerts[0]).mul(t));
        let q1 = controlVerts[1].add(controlVerts[2].add(controlVerts[1]).mul(t));
        let q2 = controlVerts[2].add(controlVerts[3].add(controlVerts[2]).mul(t));

        let r0 = q0.add(q1.subtract(q0).mul(t));
        let r1 = q1.add(q2.subtract(q1).mul(t));
        let tangent = r1.subtract(r0);
        return tangent;
    }

    /**
     * get adjacent coordinates
     * @param pos position
     * @param paramThreshold threshold value
     * @returns a position in range [0-1]
     */
    public getClosestParam(pos: Vector3, paramThreshold: number = 0.000001): number {
        return this.getClosestParamRec(pos, 0.0, 1.0, paramThreshold);
    }

    /**
     * get adjacent coordinates by given range
     * @param pos position
     * @param beginT range from
     * @param endT range end
     * @param thresholdT threshold value
     * @returns 
     */
    public getClosestParamRec(pos: Vector3, beginT: number, endT: number, thresholdT: number): number {
        let mid = (beginT + endT) / 2.0;

        if (endT - beginT < thresholdT) {
            return mid
        }

        let paramA = (beginT + mid) / 2.0;
        let paramB = (mid + endT) / 2.0;

        let posA = this.getPoint(paramA);
        let posB = this.getPoint(paramB);
        let distASq = posA.subtract(pos).lengthSquared;
        let distBSq = posB.subtract(pos).lengthSquared;

        if (distASq < distBSq) {
            endT = mid;
        }
        else {
            beginT = mid;
        }

        return this.getClosestParamRec(pos, beginT, endT, thresholdT);
    }
}
