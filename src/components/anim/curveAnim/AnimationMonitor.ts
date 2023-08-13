import { IObject3DForPropertyAnim, Object3D } from '../../../core/entities/Object3D';
import { repeat, clamp } from '../../../math/MathUtil';
import { Matrix4 } from '../../../math/Matrix4';
import { PropertyAnimClip, WrapMode } from './PropertyAnimClip';
import { PropertyAnimation } from './PropertyAnimation';
import { PropertyAnimTag, PropertyHelp } from './PropertyHelp';

/**
 * @internal
 * @group Animation
 */
export class AnimationMonitor {
    public static readonly Complete: number = 0;
    public static readonly Seek: number = 1;

    private _rootObject3D: Object3D;
    private _animation: PropertyAnimation;
    private _propertyCache: {
        [path: string]: { [attribute: string]: { value: any; property: string } };
    };
    private _currentClip: PropertyAnimClip;
    private _frame: number = 0;
    private _time: number = 0;
    private _isPlaying: boolean = true;
    public speed: number = 1;
    private _propertyTagDic: Map<Object3D, PropertyAnimTag>;

    constructor(animation: PropertyAnimation) {
        this._rootObject3D = animation.object3D;
        this._animation = animation;
        this._propertyTagDic = new Map<Object3D, PropertyAnimTag>();
        this.reset();
    }

    private reset(): void {
        this._propertyCache = {};
        this._propertyTagDic.clear();
    }

    public get time(): number {
        return this._time;
    }

    public get currentClip(): PropertyAnimClip {
        return this._currentClip;
    }

    public play(clip: PropertyAnimClip, reset: boolean = true) {
        this._isPlaying = true;
        if (reset) {
            this._time = 0;
        }
        if (clip != this._currentClip) {
            if (clip) {
                this.parseAnimClip(clip);
            }
        }
        this._currentClip = clip;
        this.validProperty();
    }

    private parseAnimClip(clip: PropertyAnimClip): this {
        this.reset();

        for (const objPath in clip.objAnimClip) {
            let objClip = clip.objAnimClip[objPath];
            let bindObject3D = this._rootObject3D;
            let attsCache = {};
            if (objPath == '') {
                bindObject3D = this._rootObject3D;
            } else {
                bindObject3D = this._rootObject3D.getObjectByName(objPath) as Object3D;
            }
            if (!bindObject3D)
                continue;

            let tag = new PropertyAnimTag();
            this._propertyTagDic.set(bindObject3D, tag);

            let curve = objClip.curve;
            for (const attribute in curve) {
                PropertyHelp.updatePropertyTag(tag, attribute);
                let binder = this._propertyCache[objPath] ||= {};

                let atts = PropertyHelp.Property[attribute].split('.');
                let atts_0 = atts[0];
                if (atts.length > 1) {
                    let value = attsCache[atts_0];
                    if (!value) {
                        value = attsCache[atts_0] = bindObject3D[atts_0];
                    }
                    binder[attribute] = { value: value, property: atts[1] };
                } else {
                    binder[attribute] = { value: bindObject3D, property: atts[0] };
                }
            }
        }
        return this;
    }

    public stop(): this {
        this._isPlaying = false;
        return this;
    }

    public toggle(): this {
        this._isPlaying = !this._isPlaying;
        return this;
    }

    public get isPlaying() {
        return this._isPlaying;
    }

    public update(time: number, delta: number) {
        time = time * 0.001;
        delta = delta * 0.001;
        if (!this._currentClip || this._frame == time) return;
        if (!this._isPlaying) return;

        this._frame = time;
        let lastTime = this._time;
        this._time = this.calcTime(lastTime + delta * this.speed);
        this.validProperty();
        if (this._currentClip.wrapMode != WrapMode.Loop && this._currentClip.wrapMode != WrapMode.Default) {
            let complete = this.speed > 0 ? this._time >= this._currentClip.totalTime : this._time <= 0;
            if (complete) {
                this._isPlaying = false;
                this._animation['statusCall'](AnimationMonitor.Complete, lastTime, this._time);
            }
        }
        this._animation['statusCall'](AnimationMonitor.Seek, lastTime, this._time);
    }

    public seek(time: number): this {
        this._time = this.calcTime(time);
        this._rootObject3D && this.validProperty();
        return this;
    }

    private calcTime(time: number): number {
        if (this._currentClip.wrapMode == WrapMode.Loop || this._currentClip.wrapMode == WrapMode.Default) {
            time = repeat(time, this._currentClip.totalTime);
        } else {
            time = clamp(time, 0, this._currentClip.totalTime);
        }
        return time;
    }

    private validProperty() {
        for (const objName in this._currentClip.objAnimClip) {
            let objClip = this._currentClip.objAnimClip[objName];
            let curve = objClip.curve;
            for (const attribute in curve) {
                const attributeAnim = curve[attribute];
                let target = this._propertyCache[objName][attribute];
                let ret = attributeAnim.getValue(this._time);
                if (attribute in PropertyHelp.Scale) {
                    ret *= PropertyHelp.Scale[attribute];
                }

                target.value[target.property] = ret;
            }
        }
        //
        this._propertyTagDic.forEach((v, k) => {
            this.applyProperty(v, k);
        })
    }

    private applyProperty(tag: PropertyAnimTag, obj3d: Object3D) {
        if (tag.quaternion) {
            Matrix4.getEuler(obj3d.transform.localRotation, obj3d.transform.localRotQuat, true, 'ZYX');
        }
        if (tag.transform) {
            obj3d.transform.localPosition = obj3d.transform.localPosition;
            obj3d.transform.localRotation = obj3d.transform.localRotation;
            obj3d.transform.localScale = obj3d.transform.localScale;
        }

        let animObj: IObject3DForPropertyAnim = obj3d as any as IObject3DForPropertyAnim;
        if (tag.materialColor) {
            animObj.notifyMaterialColorChange(0, 'baseColor');
        }
    }
}
