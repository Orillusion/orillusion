import { CEvent } from '../../../event/CEvent';
import { PropertyAnimation } from './PropertyAnimation';
/**
 * @internal
 * @group Animation
 */
export class AnimatorEventKeyframe {
    public clipName: string;
    public data: any;
    public time: number;
}
/**
 * @internal
 * @group Animation
 */
export class PropertyAnimationEvent extends CEvent {
    public static SEEK: string = 'SEEK';
    public static COMPLETE: string = 'COMPLETE';

    public animation: PropertyAnimation;
    public frame: AnimatorEventKeyframe;

    constructor(animation: PropertyAnimation, name: string) {
        super(name);
        this.animation = animation;
    }
}
