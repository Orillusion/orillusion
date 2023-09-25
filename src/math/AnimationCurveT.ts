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
                this._cacheValue.x = this.m_curves[0].getValue(time);
                this._cacheValue.y = this.m_curves[1].getValue(time);
                this._cacheValue.z = this.m_curves[2].getValue(time);
                this._cacheValue.w = this.m_curves[3].getValue(time);
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
