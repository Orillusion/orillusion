import { AnimationCurve, FrameCache } from './AnimationCurve';
import { cubicPolynomialRootsGeneric } from './Polynomials';
import { Vector2 } from './Vector2';

/**
 * @internal
 * @group Math
 */
export class Polynomial {
    public coeff: number[] = [];
    public static EvalSegment(t: number, coeff: number[]) {
        return t * (t * (t * coeff[0] + coeff[1]) + coeff[2]) + coeff[3];
    }
}

/**
 * @internal
 * @group Math
 */
export class PolynomialCurve {
    private static kMaxNumSegments = 8;
    public segments: Polynomial[] = [];
    public integrationCache: number[] = [];
    public doubleIntegrationCache: number[] = [];
    public times: number[] = [];
    public segmentCount: number;

    constructor() {
        this.segments[PolynomialCurve.kMaxNumSegments] = new Polynomial();
        this.integrationCache[PolynomialCurve.kMaxNumSegments] = 0;
        this.doubleIntegrationCache[PolynomialCurve.kMaxNumSegments] = 0;
        this.times[PolynomialCurve.kMaxNumSegments] = 0;
    }

    public calculateMinMax(minmax: Vector2, value) {
        minmax.x = Math.min(minmax.x, value);
        minmax.y = Math.max(minmax.y, value);
    }

    public findMinMaxDoubleIntegrated(): Vector2 {
        let result = Vector2.ZERO.clone();
        let numSteps = 20;
        let delta = 1.0 / numSteps;
        let acc = delta;
        for (let i = 0; i < numSteps; i++) {
            this.calculateMinMax(result, this.evaluateDoubleIntegrated(acc));
            acc += delta;
        }
        return result;
    }

    // Find the maximum of the integrated curve (x: min, y: max)
    public findMinMaxIntegrated(): Vector2 {
        let result = Vector2.ZERO.clone();
        let prevTimeValue = 0.0;

        let start: [] = [];
        let end: [] = [];
        for (let i = 0; i < this.segmentCount; i++) {
            // Differentiate coefficients
            let a = 4.0 * this.segments[i].coeff[0];
            let b = 3.0 * this.segments[i].coeff[1];
            let c = 2.0 * this.segments[i].coeff[2];
            let d = 1.0 * this.segments[i].coeff[3];

            let roots: number[] = [];
            let numRoots = cubicPolynomialRootsGeneric(roots, a, b, c, d);
            for (let r = 0; r < numRoots; r++) {
                let root = roots[r] + start[i];
                if (root >= start[i] && root < end[i]) {
                    this.calculateMinMax(result, this.evaluateIntegrated(root));
                }
            }

            // TODO: Don't use eval integrated, use eval segment (and integrate in loop)
            this.calculateMinMax(result, this.evaluateIntegrated(end[i]));
            prevTimeValue = this.times[i];
        }
        return result;
    }

    public generateIntegrationCache(curve: PolynomialCurve) {
        curve.integrationCache[0] = 0.0;
        let prevTimeValue0 = curve.times[0];
        let prevTimeValue1 = 0.0;
        for (let i = 1; i < curve.segmentCount; i++) {
            let coeff = curve.segments[i - 1].coeff;
            integrateSegment(coeff);
            let time = prevTimeValue0 - prevTimeValue1;
            curve.integrationCache[i] = curve.integrationCache[i - 1] + Polynomial.EvalSegment(time, coeff) * time;
            prevTimeValue1 = prevTimeValue0;
            prevTimeValue0 = curve.times[i];
        }
    }

    public generateDoubleIntegrationCache(curve: PolynomialCurve) {
        let sum = 0.0;
        let prevTimeValue = 0.0;
        for (let i = 0; i < curve.segmentCount; i++) {
            curve.doubleIntegrationCache[i] = sum;
            let time = curve.times[i] - prevTimeValue;
            time = Math.max(time, 0.0);
            sum += Polynomial.EvalSegment(time, curve.segments[i].coeff) * time * time + curve.integrationCache[i] * time;
            prevTimeValue = curve.times[i];
        }
    }

    // Integrates a velocity curve to be a position curve.
    // You have to call EvaluateIntegrated to evaluate the curve
    public integrate() {
        this.generateIntegrationCache(this);
        for (let i = 0; i < this.segmentCount; i++) {
            integrateSegment(this.segments[i].coeff);
        }
    }

    // Integrates a velocity curve to be a position curve.
    // You have to call EvaluateDoubleIntegrated to evaluate the curve
    public doubleIntegrate() {
        this.generateIntegrationCache(this);
        for (let i = 0; i < this.segmentCount; i++) {
            doubleIntegrateSegment(this.segments[i].coeff);
        }
        this.generateDoubleIntegrationCache(this);
    }

    // Evaluates if it is possible to represent animation curve as PolynomialCurve
    static isValidCurve(editorCurve: AnimationCurve): boolean {
        let keyCount = editorCurve.getKeyCount();
        let segmentCount = keyCount - 1;
        if (editorCurve.getKey(0).time != 0.0) {
            segmentCount++;
        }
        if (editorCurve.getKey(keyCount - 1).time != 1.0) {
            segmentCount++;
        }
        return segmentCount <= PolynomialCurve.kMaxNumSegments;
    }

    public evaluateDoubleIntegrated(t) {
        let prevTimeValue = 0.0;
        for (let i = 0; i < this.segmentCount; i++) {
            if (t <= this.times[i]) {
                let time = t - prevTimeValue;
                return this.doubleIntegrationCache[i] + this.integrationCache[i] * time + Polynomial.EvalSegment(time, this.segments[i].coeff) * time * time;
            }
            prevTimeValue = this.times[i];
        }
        return 1.0;
    }

    // Evaluate integrated Polynomial curve.
    // Example: position = EvaluateIntegrated (normalizedTime) * startEnergy
    // Use Integrate function to for example turn a velocity curve into a position curve.
    // Expects that t is in the 0...1 range.
    public evaluateIntegrated(t) {
        let prevTimeValue = 0.0;
        for (let i = 0; i < this.segmentCount; i++) {
            if (t <= this.times[i]) {
                let time = t - prevTimeValue;
                return this.integrationCache[i] + Polynomial.EvalSegment(time, this.segments[i].coeff) * time;
            }
            prevTimeValue = this.times[i];
        }
        return 1.0;
    }

    // Evaluate the curve
    // extects that t is in the 0...1 range
    public evaluate(t): number {
        let prevTimeValue = 0.0;
        for (let i = 0; i < this.segmentCount; i++) {
            if (t <= this.times[i]) {
                return Polynomial.EvalSegment(t - prevTimeValue, this.segments[i].coeff);

            }
            prevTimeValue = this.times[i];
        }
        return 1.0;
    }

    public buildCurve(editorCurve: AnimationCurve, scale: number) {
        let keyCount = editorCurve.getKeyCount();
        this.segmentCount = 1;

        let kMaxTime = 1.01;
        this.segments.length = 0;
        this.integrationCache.length = 0;
        this.doubleIntegrationCache.length = 0;
        this.times.length = 0;
        this.times[0] = kMaxTime;

        // Handle corner case 1 & 0 keyframes
        if (keyCount == 0) {
        } else if (keyCount == 1) {
            this.segments[0] = new Polynomial();
            this.segments[0].coeff[3] = editorCurve.getKey(0).value * scale;
        } else {
            this.segmentCount = keyCount - 1;
            let segmentOffset = 0;

            // Add extra key to start if it doesn't match up
            if (editorCurve.getKey(0).time != 0.0) {
                this.segments[0].coeff[3] = editorCurve.getKey(0).value;
                this.times[0] = editorCurve.getKey(0).time;
                segmentOffset = 1;
            }

            for (let i = 0; i < this.segmentCount; i++) {
                let cache: FrameCache;
                editorCurve.calculateCacheData(cache, i, i + 1, 0.0);
                this.segments[i + segmentOffset].coeff = cache.coeff.concat();
                this.times[i + segmentOffset] = editorCurve.getKey(i + 1).time;
            }
            this.segmentCount += segmentOffset;

            // Add extra key to start if it doesn't match up
            if (editorCurve.getKey(keyCount - 1).time != 1.0) {
                this.segments[this.segmentCount].coeff[3] = editorCurve.getKey(keyCount - 1).value;
                this.segmentCount++;
            }

            // Fixup last key time value
            this.times[this.segmentCount - 1] = kMaxTime;

            for (let i = 0; i < this.segmentCount; i++) {
                this.segments[i].coeff[0] *= scale;
                this.segments[i].coeff[1] *= scale;
                this.segments[i].coeff[2] *= scale;
                this.segments[i].coeff[3] *= scale;
            }
        }
        return true;
    }
}

/**
 * @internal
 */
export function doubleIntegrateSegment(coeff) {
    coeff[0] /= 20.0;
    coeff[1] /= 12.0;
    coeff[2] /= 6.0;
    coeff[3] /= 2.0;
}

/**
 * @internal
 */
export function integrateSegment(coeff) {
    coeff[0] /= 4.0;
    coeff[1] /= 3.0;
    coeff[2] /= 2.0;
    coeff[3] /= 1.0;
}
