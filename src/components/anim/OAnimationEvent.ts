import { CEvent } from "../../event/CEvent";
import { SkeletonAnimationComponent } from "../SkeletonAnimationComponent";

/**
 * Skeleton animation event
 * @group Animation 
 */
export class OAnimationEvent extends CEvent {
    /**
     * owner skeleton animation component
     */
    public skeletonAnimation: SkeletonAnimationComponent;

    constructor(name: string, time: number) {
        super();
        this.type = name;
        this.time = time;
    }
}
