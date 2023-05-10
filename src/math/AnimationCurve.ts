import { PingPong, RepeatSE } from './MathUtil';

/**
 * Time Warp Mode
 * @PingPong value min -> max -> min
 * @Repeat value = value % repeatSpace
 * @Clamp value = max(min( value ,  1 ) , 0 )
 */
export enum WrapTimeMode {
    PingPong = 0,
    Repeat = 1,
    Clamp = 2,
}

/**
 * @group Math
 */
export class Keyframe {
    public serializedVersion: string = '2';
    public time: number;
    public value: number;
    public inSlope: number = 0;
    public outSlope: number = 0;
    public tangentMode: number = 0;

    constructor(time: number = 0, value: number = 0) {
        this.time = time;
        this.value = value;
    }

    public unSerialized(data: any) {
        this.serializedVersion = data['serializedVersion'];
        this.time = data['time'];
        this.value = data['value'];
        this.tangentMode = data['tangentMode'];
        this.inSlope = data['inSlope'] == 'Infinity' ? NaN : data['inSlope'];
        this.outSlope = data['outSlope'] == 'Infinity' ? NaN : data['outSlope'];
    }

    public unSerialized2(data: any) {
        this.serializedVersion = data['serializedVersion'];
        this.time = data['time'];
        this.value = data['value'];
        this.tangentMode = data['tangentMode'];
        this.inSlope = data['inTangent'] == 'Infinity' ? NaN : data['inTangent'];
        this.outSlope = data['outTangent'] == 'Infinity' ? NaN : data['outTangent'];
    }
}

/**
 * @internal
 * @group Math
 */
export class FrameCache {
    public index: number; //= lhsIndex;
    public time: number; // = lhs.time + timeOffset;
    public timeEnd: number; // = rhs.time + timeOffset;
    public coeff: number[] = []; //= lhsIndex;
}

/**
 * Animation Cureve 
 * has frame list data 
 * @group Math
 */
export class AnimationCurve {
    private _totalTime: number = 1;

    private _cache: FrameCache = new FrameCache();

    private _cacheOut: { lhsIndex: number; rhsIndex: number } = {
        lhsIndex: 0,
        rhsIndex: 0,
    };

    private _InvalidateCache: boolean = false;

    public curve: Keyframe[] = [];

    public serializedVersion: number;

    public preWarpMode: number;

    public postWarpMode: number;

    public rotationOrder: number;

    constructor(frames?: Keyframe[], preWarpMode: WrapTimeMode = WrapTimeMode.Repeat, postWarpMode: WrapTimeMode = WrapTimeMode.Repeat) {
        if (frames) for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            this.addKeyFrame(frame);
        }
        this.preWarpMode = preWarpMode;
        this.postWarpMode = postWarpMode;
    }

    /**
     * return this curve use total time
     */
    public get totalTime() {
        return this._totalTime;
    }

    /**
     * get curve first keframe time
     */
    public get first(): Keyframe {
        return this.curve[0];
    }

    /**
     * get curve last keyframe time
     */
    public get last(): Keyframe {
        return this.curve[this.curve.length - 1];
    }

    /**
     * add keyFrame to curve keyframe last and calcTotalTime
     * @param keyFrame {@link Keyframe}  sea: one key frame data
     */
    public addKeyFrame(keyFrame: Keyframe) {
        if (this.curve.indexOf(keyFrame) == -1) {
            this.curve.push(keyFrame);
        }
        this.calcTotalTime();
    }

    /**
     * remove keyframe from this curve
     * @param keyFrame {@link Keyframe} 
     */
    public removeKeyFrame(keyFrame: Keyframe) {
        let index = this.curve.indexOf(keyFrame);
        if (index != -1) {
            this.curve.splice(index, 1);
        }

        this.calcTotalTime();
    }

    /**
     * calculate keyframe list in to timeline
     * @param cache {@link FrameCache} 
     * @param lhsIndex left frame index 
     * @param rhsIndex right frame index
     * @param timeOffset offset time default 0.0
     */
    public calculateCacheData(cache: FrameCache, lhsIndex: number, rhsIndex: number, timeOffset: number = 0) {
        let m_Curve = this.curve;
        let lhs = m_Curve[lhsIndex];
        let rhs = m_Curve[rhsIndex];
        //	DebugAssertIf (timeOffset < -0.001F || timeOffset - 0.001F > rhs.time - lhs.time);
        cache.index = lhsIndex;
        cache.time = lhs.time + timeOffset;
        cache.timeEnd = rhs.time + timeOffset;
        cache.index = lhsIndex;

        let dx, length;
        let dy;
        let m1, m2, d1, d2;

        dx = rhs.time - lhs.time;
        dx = Math.max(dx, 0.0001);
        dy = rhs.value - lhs.value;
        length = 1.0 / (dx * dx);

        m1 = lhs.outSlope;
        m2 = rhs.inSlope;
        d1 = m1 * dx;
        d2 = m2 * dx;

        cache.coeff[0] = ((d1 + d2 - dy - dy) * length) / dx;
        cache.coeff[1] = (dy + dy + dy - d1 - d1 - d2) * length;
        cache.coeff[2] = m1;
        cache.coeff[3] = lhs.value;
        this.setupStepped(cache.coeff, lhs, rhs);
    }

    /**
     * get caculate frames value 
     * @param time 
     * @returns 
     */
    public getValue(time: number): number {
        time = this.wrapTime(time);

        this.findCurve(time, this._cacheOut);

        this.calculateCacheData(this._cache, this._cacheOut.lhsIndex, this._cacheOut.rhsIndex, 0);

        return this.evaluateCache(this._cache, time);
    }

    /**
     * get has Keyframe list count
     * @returns  int 
     */
    public getKeyCount(): number {
        return this.curve.length;
    }

    /**
     * Get a Keyframe Data by Index
     * @param index must int 
     * @returns Keyframe {@link Keyframe}
     */
    public getKey(index: number): Keyframe {
        return this.curve[index];
    }

    public unSerialized(data: any): this {
        this.preWarpMode = data['m_PreInfinity'];
        this.postWarpMode = data['m_PostInfinity'];
        this.rotationOrder = data['m_RotationOrder'];

        let len = data['m_Curve'].length;
        for (let i = 0; i < len; i++) {
            this.curve[i] = new Keyframe();
            this.curve[i].unSerialized(data['m_Curve'][i.toString()]);
        }
        this.calcTotalTime();
        return this;
    }

    public unSerialized2(data: Object): this {
        this.preWarpMode = data['preWrapMode'];
        this.postWarpMode = data['postWrapMode'];

        let keyFrames = data['keyFrames'] || data['keys'];
        let len = keyFrames.length;
        for (let i = 0; i < len; i++) {
            this.curve[i] = new Keyframe();
            this.curve[i].unSerialized2(keyFrames[i.toString()]);
        }
        this.calcTotalTime();
        return this;
    }

    private wrapTime(curveT: number) {
        let m_Curve = this.curve;
        let begTime = m_Curve[0].time;
        let endTime = m_Curve[m_Curve.length - 1].time;

        if (curveT < begTime) {
            if (this.preWarpMode == WrapTimeMode.Clamp) curveT = begTime;
            else if (this.preWarpMode == WrapTimeMode.PingPong) curveT = PingPong(curveT, begTime, endTime);
            else curveT = RepeatSE(curveT, begTime, endTime);
        } else if (curveT > endTime) {
            if (this.postWarpMode == WrapTimeMode.Clamp) curveT = endTime;
            else if (this.postWarpMode == WrapTimeMode.PingPong) curveT = PingPong(curveT, begTime, endTime);
            else curveT = RepeatSE(curveT, begTime, endTime);
        }
        return curveT;
    }

    private evaluateCache(cache: FrameCache, curveT: number): number {
        let t = curveT - cache.time;
        let output = t * (t * (t * cache.coeff[0] + cache.coeff[1]) + cache.coeff[2]) + cache.coeff[3];
        return output;
    }

    private findCurve(time: number, out: { lhsIndex: number; rhsIndex: number }) {
        let frames = this.curve;
        for (let i = 1; i < frames.length; i++) {
            let left = frames[i - 1];
            let right = frames[i];
            if (left.time <= time && right.time > time) {
                out.lhsIndex = i - 1;
                out.rhsIndex = i;
            }
        }
    }

    private setupStepped(coeff: number[], lhs: Keyframe, rhs: Keyframe) {
        if (isNaN(lhs.outSlope) || isNaN(rhs.inSlope)) {
            coeff[0] = 0.0;
            coeff[1] = 0.0;
            coeff[2] = 0.0;
            coeff[3] = lhs.value;
        }
    }

    private invalidateCache() {
        this._InvalidateCache = true;
    }

    private calcTotalTime() {
        let maxTime = 0;
        for (let curve of this.curve) {
            maxTime = Math.max(maxTime, curve.time);
        }
        this._totalTime = maxTime;
    }

    public static scaleCurveValue(curve: AnimationCurve, scale: number) {
        if (!curve._InvalidateCache) {
            for (let i = 0; i < curve.curve.length; i++) {
                let c = curve.curve[i];
                c.value *= scale;
                c.inSlope *= scale;
                c.outSlope *= scale;
            }
        }
        curve.invalidateCache();
    }
}
