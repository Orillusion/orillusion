import { AttributeAnimCurve } from './AttributeAnimCurve';
/**
 * @internal
 * @group Animation
 */
export class ObjectAnimClip {
    public curve: { [attribute: string]: AttributeAnimCurve } = {};
}
/**
 * @group Animation
 */
export enum WrapMode {
    /**
     * Read loop mode from animation clips.
     */
    Default = 0,
    /**
     * When the time reaches the end of the animation clip, the clip will automatically stop playing and the time will be reset to the beginning of the clip.
     */
    Clamp = 1,
    /**
     * Stop the animation when the time reaches the end.
     */
    Once = 1,
    /**
     * When the time reaches the end, replay from the beginning.
     */
    Loop = 2,
    /**
     * Play the animation. When it reaches the endpoint, it will continue to play the last frame and never stop playing.
     */
    PingPong = 4,
    /**
     * Play the animation. When playing to the end, the animation is always in the sampling state of the last frame.
     */
    ClampForever = 8,
}
/**
 * All keyframe data for attribute animation
 * @internal
 * @group Animation
 */
export class PropertyAnimClip {
    public name: string;
    public objAnimClip: { [path: string]: ObjectAnimClip };

    public totalTime: number = 0;
    public time: number = 0;
    // private _startTime: number = 0;
    private _stopTime: number = 0;
    private _loopTime: any;
    private _wrapMode: WrapMode;
    private _sampleRate: any;

    public get wrapMode(): WrapMode {
        if (!this._wrapMode) this._wrapMode = WrapMode.Default;
        return this._wrapMode;
    }

    public set wrapMode(value: WrapMode) {
        this._wrapMode = value;
    }

    public parse(jsonData: any) {
        this.objAnimClip = {};

        let clip = jsonData['AnimationClip'];

        let { m_Name, m_AnimationClipSettings, m_WrapMode, m_SampleRate } = clip;

        this.name = m_Name;
        this._wrapMode = m_WrapMode;
        this._sampleRate = m_SampleRate;
        this._loopTime = m_AnimationClipSettings.m_LoopTime;
        // this._startTime = m_AnimationClipSettings.m_StartTime;
        // this._stopTime = m_AnimationClipSettings.m_StopTime;

        // this.totalTime = this._stopTime - this._startTime;

        for (const key in clip.m_EditorCurves) {
            if (Object.prototype.hasOwnProperty.call(clip.m_EditorCurves, key)) {
                const curve = clip.m_EditorCurves[key];
                let attribute = curve.attribute;

                let attributeAnimCurve = new AttributeAnimCurve();
                attributeAnimCurve.unSerialized(curve);
                this.totalTime = Math.max(this.totalTime, attributeAnimCurve.totalTime);
                let objClip = this.objAnimClip[curve.path];
                if (!objClip) {
                    objClip = new ObjectAnimClip();
                    this.objAnimClip[curve.path] = objClip;
                }
                objClip.curve[attribute] = attributeAnimCurve;
            }
        }
    }
}
