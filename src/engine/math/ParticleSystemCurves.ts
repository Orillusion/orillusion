// Some profile numbers from a run with 250,000 particles evaluating 3 velocity properties each on Intel i7-2600 CPU @ 3.4 GHz
// Scalar:									4.6  ms
// Optimized curve:							7.2  ms
// Random between 2 scalars:				9.5  ms
// Random between 2 curves:					9.5  ms
// Non-optimized curve:						10.0 ms
// Random between 2 non-optimized curves:	12.0 ms

import { AnimationCurve, FrameCache } from './AnimationCurve';
import { Color } from './Color';
import { Polynomial, PolynomialCurve } from './PolynomialCurve';
import { quadraticPolynomialRootsGeneric } from './Polynomials';
import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';

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
export function lerp(v0: number, v1: number, t: number) {
    //return v0 * t + v1 * (1-t) ;
    return v0 * (1 - t) + v1 * t;
}

/**
 * @internal
 */
export function lerpVector3(v0: Vector3, v1: Vector3, t: number) {
    let newV = new Vector3();
    let v0x: number = v0.x;
    let v0y: number = v0.y;
    let v0z: number = v0.z;
    let v0w: number = v0.w;
    let v1x: number = v1.x;
    let v1y: number = v1.y;
    let v1z: number = v1.z;
    let v1w: number = v1.w;

    newV.x = (v1x - v0x) * t + v0x;
    newV.y = (v1y - v0y) * t + v0y;
    newV.z = (v1z - v0z) * t + v0z;
    newV.w = (v1w - v0w) * t + v0w;
    return newV;
}

/**
 * @internal
 */
export function lerpColor(c0: Color, c1: Color, t) {
    let newColor = new Color();
    newColor.r = (1.0 - t) * c0.r + t * c1.r;
    newColor.g = (1.0 - t) * c0.g + t * c1.g;
    newColor.b = (1.0 - t) * c0.b + t * c1.b;
    newColor.a = (1.0 - t) * c0.a + t * c1.a;
    return newColor;
}

/**
 * @internal
 */
export function lerpByte(u0, u1, scale) {
    return (u0 + (((u1 - u0) * scale) >> 8)) & 0xff;
}

/**
 * @internal
 */
export function calculateMinMax(minmax: Vector2, value: number) {
    minmax.x = Math.min(minmax.x, value);
    minmax.y = Math.max(minmax.y, value);
}
