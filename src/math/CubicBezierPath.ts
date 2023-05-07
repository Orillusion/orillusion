import { CubicBezierCurve } from './CubicBezierCurve';
import { MathUtil } from './MathUtil';
import { Vector3 } from './Vector3';

/**
 * cubicBezierType
 * @group Math
 */
export enum CubicBezierType {
    Open,
    Closed,
}

/**
 * @group Math
 */
export class CubicBezierPath {
    private type: CubicBezierType = CubicBezierType.Open;
    private numCurveSegments = 0;
    private numControlVertices = 0;
    private controlVertices: Vector3[] = [];

    // The term 'knot' is another name for a point right on the path (an interpolated point). With this constructor the
    // knots are supplied and interpolated. knots.length (the number of knots) must be >= 2. Interior Cvs are generated
    // transparently and automatically.
    constructor(controlVertices: Vector3[], t: CubicBezierType = CubicBezierType.Open) {
        this.setControlVertices(controlVertices, t);
    }

    public getPathType() {
        return this.type;
    }

    public isClosed() {
        return this.type == CubicBezierType.Closed ? true : false;
    }

    /**
     * @returns 
     */
    public isValid() {
        return this.numCurveSegments > 0 ? true : false;
    }

    public clear() {
        this.controlVertices.length = 0;
        this.type = CubicBezierType.Open;
        this.numCurveSegments = 0;
        this.numControlVertices = 0;
    }

    public computeApproxLength(): number {
        if (!this.isValid()) return 0.0;

        // For a closed path this still works if you consider the last point as separate from the first. That is, a closed
        // path is just like an open except the last interpolated point happens to match the first.
        let numInterpolatedPoints = this.numCurveSegments + 1;
        if (numInterpolatedPoints < 2) return 0.0;

        let totalDist = 0.0;
        let controlVertices = this.controlVertices;
        for (let n = 1; n < numInterpolatedPoints; n++) {
            let a = controlVertices[(n - 1) * 3];
            let b = controlVertices[n * 3];
            totalDist += a.subtract(b).lengthSquared;
        }

        if (totalDist == 0.0) return 0.0;

        return totalDist;
    }

    public computeApproxParamPerUnitLength(): number {
        let length = this.computeApproxLength();
        return this.numCurveSegments / length;
    }

    public computeApproxNormParamPerUnitLength(): number {
        let length = this.computeApproxLength();
        return 1.0 / length;
    }

    public interpolatePoints(knots: Vector3[], t: CubicBezierType) {
        let numKnots = knots.length;
        if (numKnots < 2) console.error('point count must great 1');

        this.clear();
        this.type = t;
        let controlVertices = this.controlVertices;
        switch (t) {
            case CubicBezierType.Open: {
                this.numCurveSegments = numKnots - 1;
                this.numControlVertices = 3 * numKnots - 2;
                controlVertices.length = this.numControlVertices;

                // Place the interpolated CVs.
                for (let n = 0; n < numKnots; n++) controlVertices[n * 3] = knots[n];

                // Place the first and last non-interpolated CVs.
                let initialPoint = knots[1].subtract(knots[0]).mul(0.25);

                // Interpolate 1/4 away along first segment.
                controlVertices[1] = knots[0].add(initialPoint);
                let finalPoint = knots[numKnots - 2].subtract(knots[numKnots - 1]).mul(0.25);

                // Interpolate 1/4 backward along last segment.
                controlVertices[this.numControlVertices - 2] = knots[numKnots - 1].add(finalPoint);

                // Now we'll do all the interior non-interpolated CVs.
                for (let k = 1; k < this.numCurveSegments; k++) {
                    let a = knots[k - 1].subtract(knots[k]);
                    let b = knots[k + 1].subtract(knots[k]);
                    let aLen = a.lengthSquared;
                    let bLen = b.lengthSquared;

                    if (aLen > 0.0 && bLen > 0.0) {
                        let abLen = (aLen + bLen) / 8.0;
                        let ab = b.div(bLen).subtract(a.div(aLen));
                        ab.normalize();
                        ab = ab.mul(abLen);

                        controlVertices[k * 3 - 1] = knots[k].subtract(ab);
                        controlVertices[k * 3 + 1] = knots[k].add(ab);
                    } else {
                        controlVertices[k * 3 - 1] = knots[k];
                        controlVertices[k * 3 + 1] = knots[k];
                    }
                }
                break;
            }

            case CubicBezierType.Closed: {
                this.numCurveSegments = numKnots;

                // We duplicate the first point at the end so we have contiguous memory to look of the curve value. That's
                // what the +1 is for.
                this.numControlVertices = 3 * numKnots + 1;
                controlVertices.length = this.numControlVertices;

                // First lets place the interpolated CVs and duplicate the first into the last CV slot.
                for (let n = 0; n < numKnots; n++) controlVertices[n * 3] = knots[n];

                controlVertices[this.numControlVertices - 1] = knots[0];

                // Now we'll do all the interior non-interpolated CVs. We go to k=NumCurveSegments which will compute the
                // two CVs around the zeroth knot (points[0]).
                for (let k = 1; k <= this.numCurveSegments; k++) {
                    let modkm1 = k - 1;
                    let modkp1 = (k + 1) % this.numCurveSegments;
                    let modk = k % this.numCurveSegments;

                    let a = knots[modkm1].subtract(knots[modk]);
                    let b = knots[modkp1].subtract(knots[modk]);
                    let aLen = a.lengthSquared;
                    let bLen = b.lengthSquared;
                    let mod3km1 = 3 * k - 1;

                    // Need the -1 so the end point is a duplicated start point.
                    let mod3kp1 = (3 * k + 1) % (this.numControlVertices - 1);
                    if (aLen > 0.0 && bLen > 0.0) {
                        let abLen = (aLen + bLen) / 8.0;
                        let ab = b.div(bLen).subtract(a.div(aLen));
                        ab.normalize();
                        ab = ab.mul(abLen);

                        controlVertices[mod3km1] = knots[modk].subtract(ab);
                        controlVertices[mod3kp1] = knots[modk].add(ab);
                    } else {
                        controlVertices[mod3km1] = knots[modk];
                        controlVertices[mod3kp1] = knots[modk];
                    }
                }
                break;
            }
        }
    }

    // For a closed path the last CV must match the first.
    public setControlVertices(cvs: Vector3[], t: CubicBezierType) {
        let numCVs = cvs.length;
        if (numCVs <= 0) return;
        if (t == CubicBezierType.Open && (numCVs < 4)) return
        if (t == CubicBezierType.Closed && (numCVs < 7)) return
        if (!((numCVs - 1) % 3 == 0)) return;
        this.clear();
        this.type = t;

        this.numControlVertices = numCVs;
        this.numCurveSegments = (numCVs - 1) / 3;
        this.controlVertices = cvs;
    }

    // t E [0, numSegments]. If the type is closed, the number of segments is one more than the equivalent open path.
    public getPoint(t: number): Vector3 {
        // Only closed paths accept t values out of range.
        if (this.type == CubicBezierType.Closed) {
            while (t < 0.0) t += this.numCurveSegments;

            while (t > this.numCurveSegments) t -= this.numCurveSegments;
        } else {
            t = MathUtil.clampf(t, 0.0, this.numCurveSegments);
        }

        if (!(t >= 0) && t <= this.numCurveSegments) return;

        // Segment 0 is for t E [0, 1). The last segment is for t E [NumCurveSegments-1, NumCurveSegments].
        // The following 'if' statement deals with the final inclusive bracket on the last segment. The cast must truncate.
        let segment = Math.floor(t);
        if (segment >= this.numCurveSegments) segment = this.numCurveSegments - 1;

        let curveCVs: Vector3[] = [];
        let controlVerts = this.controlVertices;
        curveCVs[0] = controlVerts[3 * segment + 0];
        curveCVs[1] = controlVerts[3 * segment + 1];
        curveCVs[2] = controlVerts[3 * segment + 2];
        curveCVs[3] = controlVerts[3 * segment + 3];

        let bc: CubicBezierCurve = new CubicBezierCurve(curveCVs);
        return bc.getPoint(t - segment);
    }

    // Does the same as GetPoint except that t is normalized to be E [0, 1] over all segments. The beginning of the curve
    // is at t = 0 and the end at t = 1. Closed paths allow a value bigger than 1 in which case they loop.
    public getPointNorm(t: number): Vector3 {
        return this.getPoint(t * this.numCurveSegments);
    }

    // Similar to GetPoint but returns the tangent at the specified point on the path. The tangent is not normalized.
    // The longer the tangent the 'more influence' it has pulling the path in that direction.
    public getTangent(t: number): Vector3 {
        // Only closed paths accept t values out of range.
        if (this.type == CubicBezierType.Closed) {
            while (t < 0.0) t += this.numCurveSegments;

            while (t > this.numCurveSegments) t -= this.numCurveSegments;
        } else {
            t = MathUtil.clampf(t, 0.0, this.numCurveSegments);
        }

        if (!(t >= 0) && t <= this.numCurveSegments) return;

        // Segment 0 is for t E [0, 1). The last segment is for t E [NumCurveSegments-1, NumCurveSegments].
        // The following 'if' statement deals with the final inclusive bracket on the last segment. The cast must truncate.
        let segment = Math.floor(t);
        if (segment >= this.numCurveSegments) segment = this.numCurveSegments - 1;

        let controlVerts = this.controlVertices;
        let curveCVs = [];
        curveCVs[0] = controlVerts[3 * segment + 0];
        curveCVs[1] = controlVerts[3 * segment + 1];
        curveCVs[2] = controlVerts[3 * segment + 2];
        curveCVs[3] = controlVerts[3 * segment + 3];

        let bc = new CubicBezierCurve(curveCVs);
        return bc.getTangent(t - segment);
    }

    public getTangentNorm(t: number): Vector3 {
        return this.getTangent(t * this.numCurveSegments);
    }

    // This function returns a single closest point. There may be more than one point on the path at the same distance.
    // Use ComputeApproxParamPerUnitLength to determine a good paramThreshold. eg. Say you want a 15cm threshold,
    // use: paramThreshold = ComputeApproxParamPerUnitLength() * 0.15f.
    public computeClosestParam(pos: Vector3, paramThreshold: number): number {
        let minDistSq = Number.MAX_SAFE_INTEGER;
        let closestParam = 0.0;
        let curveCVs: Vector3[] = [];
        let curve: CubicBezierCurve = new CubicBezierCurve(curveCVs);
        for (let startIndex = 0; startIndex < this.controlVertices.length - 1; startIndex += 3) {
            for (let i = 0; i < 4; i++) curveCVs[i] = this.controlVertices[startIndex + i];

            curve.setControlVertices(curveCVs);
            let curveClosestParam = curve.getClosestParam(pos, paramThreshold);

            let curvePos = curve.getPoint(curveClosestParam);
            let distSq = curvePos.subtract(pos).lengthSquared;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                let startParam = startIndex / 3.0;
                closestParam = startParam + curveClosestParam;
            }
        }

        return closestParam;
    }

    // Same as above but returns a t value E [0, 1]. You'll need to use a paramThreshold like
    // ComputeApproxParamPerUnitLength() * 0.15f if you want a 15cm tolerance.
    public computeClosestNormParam(pos: Vector3, paramThreshold: number) {
        return this.computeClosestParam(pos, paramThreshold * this.numCurveSegments);
    }
}
