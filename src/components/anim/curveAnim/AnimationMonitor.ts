import { Object3D } from '../../../core/entities/Object3D';
import { repeat, clamp } from '../../../math/MathUtil';
import { Matrix4 } from '../../../math/Matrix4';
import { PropertyAnimClip, WrapMode } from './PropertyAnimClip';
import { PropertyAnimation } from './PropertyAnimation';
import { PropertyHelp } from './PropertyHelp';

/**
 * @internal
 * @group Animation
 */
export class AnimationMonitor {
    public static readonly Complete: number = 0;
    public static readonly Seek: number = 1;

    private _propertyAnimClip: { [animName: string]: PropertyAnimClip };
    private _target: Object3D;
    private _animation: PropertyAnimation;
    private _propertyCache: {
        [path: string]: { [attribute: string]: { value: any; property: string } };
    };
    private _bindObjects: Object3D[] = [];
    private _currentClip: PropertyAnimClip;
    private _frame: number = 0;
    private _time: number = 0;
    private _isPlaying: boolean = true;
    public speed: number = 1;

    constructor(animation: PropertyAnimation) {
        this._target = animation.object3D;
        this._animation = animation;
        this._propertyAnimClip = {};
        this._propertyCache = {};
    }

    public get object3D() {
        return this._target;
    }

    public get time(): number {
        return this._time;
    }

    public get currentClip(): PropertyAnimClip {
        return this._currentClip;
    }

    public getClip(name: string): PropertyAnimClip {
        return this._propertyAnimClip[name];
    }

    public addClip(clip: PropertyAnimClip): this {
        this._propertyAnimClip[clip.name] = clip;

        for (const objPath in clip.objAnimClip) {
            let objClip = clip.objAnimClip[objPath];
            let bind = this._target;
            if (objPath == '') {
                bind = this._target;
            } else {
                // let objNames = objPath.split('/');
                // let objName = objNames[objNames.length - 1];
                bind = this._target.getObjectByName(objPath) as Object3D;
            }

            let curve = objClip.curve;
            for (const attribute in curve) {
                if (Object.prototype.hasOwnProperty.call(curve, attribute)) {
                    // const attributeAnim = curve[attribute];
                    // let att = PropertyHelp.property[attribute];
                    let atts = PropertyHelp.property[attribute].split('.');
                    if (bind) {
                        if (this._bindObjects.indexOf(bind) == -1) {
                            this._bindObjects.push(bind);
                        }
                        if (this._propertyCache[objPath] == null) {
                            this._propertyCache[objPath] = {};

                        }
                        this._propertyCache[objPath][attribute] = {
                            value: bind[atts[0]],
                            property: atts[1],
                        };
                        for (let i = 1; i < atts.length - 1; i++) {
                            this._propertyCache[objPath][attribute] = {
                                value: bind[atts[i]],
                                property: atts[i + 1],
                            };
                        }
                    }
                }
            }
        }
        return this;
    }

    public play(name: string, reset: boolean = true): PropertyAnimClip {
        let clip = this._propertyAnimClip[name];
        if (!clip) return null;

        this._isPlaying = true;

        if (reset || !this._currentClip || this._currentClip.name != name) {
            this._time = 0;
        }
        this._currentClip = clip;
        return this._currentClip;
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
        this.validProperty();
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
        if (this._target) {
            for (const objName in this._currentClip.objAnimClip) {
                let objClip = this._currentClip.objAnimClip[objName];
                let hasQuaternion = false;
                let curve = objClip.curve;
                for (const attribute in curve) {
                    if (Object.prototype.hasOwnProperty.call(curve, attribute)) {
                        const attributeAnim = curve[attribute];
                        // this.target[PropertyHelp.property[key]] = attributeAnim.getValue(this._time);
                        let value = this._propertyCache[objName][attribute];
                        let scale = PropertyHelp.property_scale[attribute];
                        hasQuaternion = hasQuaternion || PropertyHelp.property_quaternion[attribute];
                        let ret = attributeAnim.getValue(this._time) * scale + PropertyHelp.property_offset[attribute];
                        value.value[value.property] = ret;
                    }
                }

                if (hasQuaternion) {
                    let transform = this._target.transform;
                    Matrix4.getEuler(transform.localRotation, transform.localRotQuat, true, 'ZYX');
                }
            }
        }
        for (let i of this._bindObjects) {
            i.transform.notifyChange();
        }
    }
}
