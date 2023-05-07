import { AnimationCurve, FrameCache } from './AnimationCurve';
import { lerp } from './MathUtil';
import { Polynomial, PolynomialCurve } from './PolynomialCurve';
import { quadraticPolynomialRootsGeneric } from './Polynomials';
import { Vector2 } from './Vector2';

/**
 * @internal
 */
export enum ParticleSystemCurveEvalMode {
    kEMScalar,
    kEMOptimized,
    kEMOptimizedMinMax,
    kEMSlow,
}

/**
 * @internal
 */
export enum MinMaxCurveState {
    kMMCScalar = 0,
    kMMCCurve = 1,
    kMMCTwoCurves = 2,
    kMMCTwoConstants = 3,
}

// export class MinMaxOptimizedPolyCurves
// {
// 	public Integrate(){};
// 	public DoubleIntegrate(){};
// 	public FindMinMaxIntegrated():Vector2{ return null };
// 	public FindMinMaxDoubleIntegrated():Vector2{ return null };

// 	public max:OptimizedPolynomialCurve;
// 	public min:OptimizedPolynomialCurve;
// }
/**
 * @internal
 * @group Math
 */
export class MinMaxAnimationCurves {
    // public SupportsProcedural ();
    public max: AnimationCurve;
    public min: AnimationCurve;
}

/**
 * @internal
 * @group Math
 */
export class MinMaxPolyCurves {
    public max: PolynomialCurve;
    public min: PolynomialCurve;

    public integrate() {
        this.max.integrate();
        this.min.integrate();
    }

    public doubleIntegrate() {
        this.max.doubleIntegrate();
        this.min.doubleIntegrate();
    }

    public findMinMaxIntegrated(): Vector2 {
        return null;
    }

    public findMinMaxDoubleIntegrated(): Vector2 {
        return null;
    }
}

/**
 * @internal
 * @group Math
 */
export class MinMaxCurve {
    public minMaxState: MinMaxCurveState; // see enum MinMaxCurveState
    public minCurve: AnimationCurve;
    public maxCurve: AnimationCurve;
    private _scalar = 1; // Since scalar is baked into the optimized curve we use the setter function to modify it.
    private _minScalar: number;
    constructor(scalarValue: number = 1) {
        this._scalar = scalarValue;
        this.minMaxState = MinMaxCurveState.kMMCScalar;
        this.minCurve = new AnimationCurve();
        this.maxCurve = new AnimationCurve();
    }

    public setScalar(value) {
        this._scalar = value;
    }

    public getScalar() {
        return this._scalar;
    }

    public static evaluateSlow(curve: MinMaxCurve, t, factor) {
        let v = curve.maxCurve.getValue(t) * curve.getScalar();
        if (curve.minMaxState == MinMaxCurveState.kMMCTwoCurves) {
            return lerp(curve.minCurve.getValue(t) * curve.getScalar(), v, factor);
        }
        else return v;
    }

    public static evaluate(curve: MinMaxCurve, t, randomValue = 1.0): number {
        if (curve.minMaxState == MinMaxCurveState.kMMCScalar) {
            return curve.getScalar();
        }

        let v = curve.maxCurve.getValue(t) * curve.getScalar();
        if (curve.minMaxState == MinMaxCurveState.kMMCCurve) {
            return lerp(curve.minCurve.getValue(t) * curve.getScalar(), v, randomValue);
        }
        if (curve.minMaxState == MinMaxCurveState.kMMCTwoConstants) {
            return lerp(curve._minScalar, curve._scalar, randomValue);
        }
        if (curve.minMaxState == MinMaxCurveState.kMMCTwoCurves) {
            return lerp(curve.minCurve.getValue(t) * curve.getScalar(), v, 1 * Math.random());
        }
        return this.evaluateSlow(curve, t, 1);
    }

    public unSerialized(data: any) {
        this.minMaxState = data['minMaxState'];
        this._scalar = data['scalar'];
        this._minScalar = data['minScalar'];
        this.maxCurve.unSerialized(data['maxCurve']);
        this.minCurve.unSerialized(data['minCurve']);
    }
}

/**
 * @internal
 * @group Math
 */
export class ValueSpread {
    public value = 0;
    public mode: number = 0;
    public spread: number = 0;
    public speed: MinMaxCurve = new MinMaxCurve();

    public unSerialized(data: any) {
        this.value = data['value'];
        this.mode = data['mode'];
        this.spread = data['spread'];
        this.speed.unSerialized(data['speed']);
    }
}

// export class DualMinMax3DPolyCurves
// {
// 	public optX:MinMaxOptimizedPolyCurves;
// 	public optY:MinMaxOptimizedPolyCurves;
// 	public optZ:MinMaxOptimizedPolyCurves;
// 	public x:MinMaxPolyCurves;
// 	public  y:MinMaxPolyCurves;
// 	public  z:MinMaxPolyCurves;
// };
/**
 * @internal
 */
export function curvesSupportProcedural(editorCurves: MinMaxAnimationCurves, minMaxState: number): boolean {
    let isValid = PolynomialCurve.isValidCurve(editorCurves.max);
    if (minMaxState != MinMaxCurveState.kMMCTwoCurves && minMaxState != MinMaxCurveState.kMMCTwoConstants) {
        return isValid;
    }
    else {
        return isValid && PolynomialCurve.isValidCurve(editorCurves.min);
    }
}

/**
 * @internal
 */
export function buildCurves(polyCurves: MinMaxPolyCurves, editorCurves: MinMaxAnimationCurves, scalar, minMaxState) {
    polyCurves.max.buildCurve(editorCurves.max, scalar);
    if (minMaxState != MinMaxCurveState.kMMCTwoCurves && minMaxState != MinMaxCurveState.kMMCTwoConstants) {
        polyCurves.min.buildCurve(editorCurves.max, scalar);
    }
    else {
        polyCurves.min.buildCurve(editorCurves.min, scalar);
    }
}

/**
 * @internal
 */
export function calculateCurveRangesValue(minMaxValue: Vector2, curve: AnimationCurve) {
    let keyCount = curve.getKeyCount();
    if (keyCount == 0) {
        return;
    }

    if (keyCount == 1) {
        calculateMinMax(minMaxValue, curve.getKey(0).value);
    } else {
        let segmentCount = keyCount - 1;
        calculateMinMax(minMaxValue, curve.getKey(0).value);
        for (let i = 0; i < segmentCount; i++) {
            let cache: FrameCache = new FrameCache();
            curve.calculateCacheData(cache, i, i + 1, 0.0);

            // Differentiate polynomial
            let a = 3.0 * cache.coeff[0];
            let b = 2.0 * cache.coeff[1];
            let c = 1.0 * cache.coeff[2];

            let start = curve.getKey(i).time;
            let end = curve.getKey(i + 1).time;

            let roots = [];
            let numRoots = quadraticPolynomialRootsGeneric(a, b, c, { r0: roots[0], r1: roots[1] });
            for (let r = 0; r < numRoots; r++) {
                if (roots[r] >= 0.0 && roots[r] + start < end) {
                    calculateMinMax(minMaxValue, Polynomial.EvalSegment(roots[r], cache.coeff));
                }
            }
            calculateMinMax(minMaxValue, Polynomial.EvalSegment(end - start, cache.coeff));
        }
    }
}





/**
 * @internal
 */
export function calculateMinMax(minmax: Vector2, value: number) {
    minmax.x = Math.min(minmax.x, value);
    minmax.y = Math.max(minmax.y, value);
}
