import { PingPong, RepeatSE } from './MathUtil';
import { FrameCache } from './enum/FrameCache';
import { WrapTimeMode } from './enum/WrapTimeMode';
import { Keyframe } from './enum/Keyframe';
import { AnimationCurve, AnimationCurveT, BytesArray, KeyframeT } from '..';

/**
 * Animation Cureve 
 * has frame list data 
 * @group Math
 */
export class PropertyAnimationClip {
    public clipName: string;
    public loopTime: boolean;
    public startTime: number;
    public stopTime: number;
    public sampleRate: number;
    public useSkeletonPos: boolean;
    public useSkeletonScale: boolean;
    public positionCurves: Map<string, AnimationCurveT> = new Map<string, AnimationCurveT>();
    public rotationCurves: Map<string, AnimationCurveT> = new Map<string, AnimationCurveT>();
    public scaleCurves: Map<string, AnimationCurveT> = new Map<string, AnimationCurveT>();
    public floatCurves: Map<string, AnimationCurveT> = new Map<string, AnimationCurveT>();

    public formBytes(bytes: BytesArray) {
        this.clipName = bytes.readUTF();
        this.loopTime = bytes.readInt32() ? false : true;
        this.startTime = bytes.readFloat32();
        this.stopTime = bytes.readFloat32();
        this.sampleRate = bytes.readInt32();
        this.useSkeletonPos = bytes.readInt32() > 0;
        this.useSkeletonScale = bytes.readInt32() > 0;
        if (this.useSkeletonPos) {
            let positionCurvesCount = bytes.readInt32();
            for (let i = 0; i < positionCurvesCount; i++) {
                let curveData = new AnimationCurveT();
                curveData.formBytes(bytes);
                this.positionCurves.set(curveData.path, curveData);
            }
        }

        let rotationCurvesCount = bytes.readInt32();
        for (let i = 0; i < rotationCurvesCount; i++) {
            let curveData = new AnimationCurveT();
            curveData.formBytes(bytes);
            this.rotationCurves.set(curveData.path, curveData);
        }

        if (this.useSkeletonScale) {
            let scaleCurvesCount = bytes.readInt32();
            for (let i = 0; i < scaleCurvesCount; i++) {
                let curveData = new AnimationCurveT();
                curveData.formBytes(bytes);
                this.scaleCurves.set(curveData.path, curveData);
            }
        }

        let floatCurvesCount = bytes.readInt32();
        for (let i = 0; i < floatCurvesCount; i++) {
            let curveData = new AnimationCurveT();
            curveData.formBytes(bytes);
            this.floatCurves.set(curveData.attribute, curveData);
        }
    }
}
