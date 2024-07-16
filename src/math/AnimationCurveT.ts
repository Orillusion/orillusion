import { PingPong, RepeatSE, swap } from './MathUtil';
import { FrameCache } from './enum/FrameCache';
import { WrapTimeMode } from './enum/WrapTimeMode';
import { Keyframe } from './enum/Keyframe';
import { AnimationCurve, BytesArray, KeyframeT, Quaternion, Vector2, Vector3, Vector4 } from '..';

export type CurveValueT = number | Vector2 | Vector3 | Vector4 | Quaternion;
/**
 * Animation Cureve 
 * has frame list data 
 * @group Math
 */
export class AnimationCurveT {
    public path: string;
    public attribute: string;
    public propertys: string[];
    public preInfinity: number;
    public postInfinity: number;
    public rotationOrder: number;
    public m_curves: AnimationCurve[];
    private k: number = 0;

    private _cacheValue: any;
    private _kValue: CurveValueT;

    constructor(k: number = 1) {
        this.k = k;
        this.m_curves = [];
        this.check();
    }

    private check() {
        for (let i = 0; i < this.k; i++) {
            this.m_curves[i] ||= new AnimationCurve();
        }
        switch (this.k) {
            case 1:
                this._cacheValue = 0;
                break;
            case 2:
                this._cacheValue = new Vector2();
                break;
            case 3:
                this._cacheValue = new Vector3();
                break;
            case 4:
                this._cacheValue = new Vector4();
                break;
            default:
                break;
        }
    }

    /**
     * return this curve use total time
     */
    public get totalTime() {
        return this.m_curves[0].totalTime;
    }

    /**
     * add keyFrame to curve keyframe last and calcTotalTime
     * @param keyFrame {@link Keyframe}  sea: one key frame data
     */
    public addKeyFrame(keyFrame: KeyframeT) {
        for (let i = 0; i < this.k; i++) {
            this.m_curves[i].addKeyFrame(keyFrame.getK(i));
        }
    }

    /**
     * remove keyframe from this curve
     * @param keyFrame {@link Keyframe} 
     */
    public removeKeyFrame(keyFrame: KeyframeT) {
        for (let i = 0; i < this.k; i++) {
            this.m_curves[i].removeKeyFrame(keyFrame.getK(i));
        }
    }

    /**
     * get caculate frames value 
     * @param time 
     * @returns 
     */
    public getValue(time: number): CurveValueT {
        switch (this.k) {
            case 1:
                this._cacheValue = this.m_curves[0].getValue(time);
                break;
            case 2:
                this._cacheValue.x = this.m_curves[0].getValue(time);
                this._cacheValue.y = this.m_curves[1].getValue(time);
                break;
            case 3:
                this._cacheValue.x = this.m_curves[0].getValue(time);
                this._cacheValue.y = this.m_curves[1].getValue(time);
                this._cacheValue.z = this.m_curves[2].getValue(time);
                break;
            case 4:
                // this._cacheValue.x = this.m_curves[0].getValue(time);
                // this._cacheValue.y = this.m_curves[1].getValue(time);
                // this._cacheValue.z = this.m_curves[2].getValue(time);
                // this._cacheValue.w = this.m_curves[3].getValue(time);

                const extent = this.m_curves[0].getCurveFramesExtent(time);
                const lhsIndex = extent.lhsIndex;
                const rhsIndex = extent.rhsIndex;
                time = extent.time;

                let kL = this.m_curves[0].getKey(lhsIndex);
                let kR = this.m_curves[0].getKey(rhsIndex);
                time %= this.m_curves[0].totalTime;
                let t = (time - kL.time) / (kR.time - kL.time);

                Quaternion.HELP_0.set(
                    this.m_curves[0].getKey(lhsIndex).value,
                    this.m_curves[1].getKey(lhsIndex).value,
                    this.m_curves[2].getKey(lhsIndex).value,
                    this.m_curves[3].getKey(lhsIndex).value
                );

                Quaternion.HELP_1.set(
                    this.m_curves[0].getKey(rhsIndex).value,
                    this.m_curves[1].getKey(rhsIndex).value,
                    this.m_curves[2].getKey(rhsIndex).value,
                    this.m_curves[3].getKey(rhsIndex).value
                );

                Quaternion.HELP_2.slerp(Quaternion.HELP_0, Quaternion.HELP_1, t);
                this._cacheValue.x = Quaternion.HELP_2.x;
                this._cacheValue.y = Quaternion.HELP_2.y;
                this._cacheValue.z = Quaternion.HELP_2.z;
                this._cacheValue.w = Quaternion.HELP_2.w;
                break;
            default:
                break;
        }
        return this._cacheValue;
    }

    /**
     * get has Keyframe list count
     * @returns  int 
     */
    public getKeyCount(): number {
        return this.m_curves[0].getKeyCount();
    }

    /**
     * Get a Keyframe Data by Index
     * @param index must int 
     * @returns Keyframe {@link Keyframe}
     */
    public getKey(index: number): Keyframe[] {
        let list = [];
        for (let i = 0; i < this.k; i++) {
            list.push(this.m_curves[i].getKey(index));
        }
        return list;
    }

    public formBytes(bytes: BytesArray) {
        this.path = bytes.readUTF();
        this.k = bytes.readInt32();
        this.check();

        this.attribute = bytes.readUTF();

        this.propertys = this.attribute.split(".");
        this.preInfinity = bytes.readInt32();
        this.postInfinity = bytes.readInt32();
        this.rotationOrder = bytes.readInt32();
        let curvesCount = bytes.readInt32();
        for (let i = 0; i < curvesCount; i++) {
            let keyframe = new KeyframeT(0);
            keyframe.formBytes(bytes);
            this.addKeyFrame(keyframe);
        }
    }
}
