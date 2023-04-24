import { Object3D } from '../../../core/entities/Object3D';
import { Time } from '../../../util/Time';
import { ComponentBase } from '../../ComponentBase';
import { AnimationMonitor } from './AnimationMonitor';
import { AnimatorEventKeyframe, PropertyAnimationEvent } from './PropertyAnimationEvent';
import { PropertyAnimClip } from './PropertyAnimClip';
/**
 * Attribute Animation Component
 * @group Animation
 */
export class PropertyAnimation extends ComponentBase {
    private _animator: AnimationMonitor;
    private _clips: PropertyAnimClip[] = [];
    /**
     * name of default animation clip
     */
    public defaultClip: string;
    /**
     * is it play auto
     */
    public autoPlay: boolean;

    private _seekEvent: PropertyAnimationEvent;
    private _completeEvent: PropertyAnimationEvent;
    private _keyFrameList: { [key: string]: AnimatorEventKeyframe[] };

    constructor() {
        super();
        this._seekEvent = new PropertyAnimationEvent(this, PropertyAnimationEvent.SEEK);
        this._completeEvent = new PropertyAnimationEvent(this, PropertyAnimationEvent.COMPLETE);
        this._keyFrameList = {};
    }

    /**
     * register a event to animator
     * @param frame source AnimatorEventKeyframe
     */
    public registerEventKeyFrame(frame: AnimatorEventKeyframe) {
        let list = this._keyFrameList[frame.clipName];
        if (list == null) {
            this._keyFrameList[frame.clipName] = list = [];
        }
        list.push(frame);
    }

    /**
     * @internal
     */
    init() {
        this._animator = new AnimationMonitor(this);

    }
    /**
     * @internal
     */
    onUpdate() {
        if (this.enable) {
            this._animator && this._animator.update(Time.time, Time.delta);
        }
    }

    /**
     * append a perperty animation clip
     * @param clip source PropertyAnimClip
     */
    public appendClip(clip: PropertyAnimClip) {
        this._clips.push(clip);
        this._animator.addClip(clip);
    }

    private statusCall(tag: number, last: number, now: number): void {
        if (tag == AnimationMonitor.Complete) {
            this.eventDispatcher.dispatchEvent(this._completeEvent);
        } else if (tag == AnimationMonitor.Seek) {
            if (last != now) {
                let frames = this._keyFrameList[this.currentClip.name];
                if (frames) {
                    for (let frame of frames) {
                        if (frame.time > last && frame.time <= now) {
                            this._seekEvent.data = this._seekEvent.frame = frame;
                            this.eventDispatcher.dispatchEvent(this._seekEvent);
                        }
                    }
                }
            }
        }
    }

    /**
     * set playing speed
     */
    public set speed(value: number) {
        this._animator.speed = value;
    }

    /**
     * get playing speed
     */
    public get speed(): number {
        return this._animator.speed;
    }

    /**
     * stop playing
     */
    public stop(): void {
        this._animator && this._animator.stop();
    }

    /**
     * stop or resume playing
     */
    public toggle(): void {
        this._animator && this._animator.toggle();
    }

    /**
     * get animation clip by clip name
     * @param clip name of PropertyAnimClip
     * @returns 
     */
    public getClip(clip: string): PropertyAnimClip {
        if (this._animator) {
            return this._animator.getClip(clip);
        }
        return null;
    }

    /**
     * get animation clip which is playing now
     */
    public get currentClip(): PropertyAnimClip {
        if (this._animator) {
            return this._animator.currentClip;
        }
        return null;
    }

    /**
     * get time of current animator
     */
    public get time(): number {
        return this._animator.time;
    }

    /**
     * seek the animation to assign time
     * @param time assign time
     */
    public seek(time: number) {
        if (this._animator) {
            this._animator.seek(time);
        }
    }

    /**
     * play animation by given name
     * @param clip animation name
     * @param reset if true, play the animation from time 0
     * @returns 
     */
    public play(clip: string, reset: boolean = true): PropertyAnimClip {
        if (this._animator) {
            return this._animator.play(clip, reset);
        }
        return null;
    }

    /**
     * @internal
     *
     */
    public start() {
        super.start();
        if (this.autoPlay) {
            this.play(this.defaultClip);
        }
    }

    /**
     * Create a new PropertyAnimation component, copy the properties of the current component, 
     * and add them to the target object.
     * @param obj target object3D
     */
    public cloneTo(obj: Object3D) {
        let animator = obj.addComponent(PropertyAnimation);
        animator.autoPlay = this.autoPlay;
        animator.defaultClip = this.defaultClip;
        for (let i: number = 0, count = this._clips.length; i < count; i++) {
            animator.appendClip(this._clips[i]);
        }
    }
}
