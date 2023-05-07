import { CEventDispatcher } from '../../../event/CEventDispatcher';
import { Time } from '../../../util/Time';
import { SkeletonAnimationClip } from './SkeletonAnimationClip';
import { SkeletonPose } from './SkeletonPose';

/**
 * Skeletal data at specific time points, skeletal animation interpolation operations
 * @internal
 * @group Animation
 */
export class SkeletonAnimationClipState {
  public loop: boolean = true;
  public speed: number = 1.0;
  public t: number = 0.0;
  public time: number = 0.0;
  public weight: number = 0;
  public currFrame: number = 0;
  public lastFrame: number = -1;
  public nextFrame: number = 0;
  public clip: SkeletonAnimationClip;
  public animation: any;
  protected _isEnd: boolean = false;
  protected _currSkeletonPose: SkeletonPose;

  constructor(clip: SkeletonAnimationClip) {
    this.clip = clip;
    this._currSkeletonPose = new SkeletonPose(this.clip.skeleton);
  }

  public reset() {
    this.time = 0;
    this.weight = 0;
    this._isEnd = false;
  }

  /** 
  * Returns animation clip's name.
  */
  public get name(): string {
    return this.clip.name;
  }

  /** 
  * Returns current skeleton pose.
  */
  public get currSkeletonPose(): SkeletonPose {
    return this._currSkeletonPose;
  }

  /** 
  * update animation clip, it will change key frame to sample animation clip.
  * @param delta time from last frame to now
  */
  public update(delta: number) {
    this.time = (this.time + delta * this.speed) % this.clip.totalTime;
    let frameTime = (this.time / this.clip.frameRate);
    this.currFrame = Math.trunc(frameTime);
    this.t = frameTime - this.currFrame;

    if (this.currFrame < 0) {
      this.currFrame = this.clip.numFrame + this.currFrame;
    }

    if (this.time >= 0) {
      this.nextFrame = (this.currFrame + 1) % this.clip.numFrame;
    } else {

      this.nextFrame = this.currFrame - 1;
      if (this.nextFrame < 0) {
        this.nextFrame = this.clip.numFrame + this.nextFrame;
      }

      this.t = 1 - this.t;
    }

    if (this._isEnd) {
      this.currFrame = this.nextFrame = this.speed < 0 ? 0 : this.clip.numFrame - 1;
    } else if (this.currFrame != this.lastFrame) {
      let endFrame: number = this.speed < 0 ? 0 : this.clip.numFrame;
      if (this.currFrame == endFrame) {
        if (this.loop) {
          this.currFrame = 0;
          this.nextFrame = 1;
          this.time = this.t = 0;
        } else {
          this.currFrame = this.nextFrame = this.speed < 0 ? 0 : this.clip.numFrame - 1;
          this._isEnd = true;
        }
      }

      var events = this.clip.getEvents();
      if (events) {
        for (let event of events) {
          var triggerFrame = Math.floor(event.time / this.clip.frameRate);
          triggerFrame = Math.min(triggerFrame, this.clip.numFrame);
          triggerFrame = Math.max(triggerFrame, 0);
          if (triggerFrame == this.currFrame) {
            event.skeletonAnimation = this.animation;
            this.animation.eventDispatcher.dispatchEvent(event);
            break;
          }
        }
      }

      this.lastFrame = this.currFrame;
    }

    //   if (EngineSetting.AnimationSetting.useGPUComputeSkeltonAnimation) {
    //     let skeletonPoseA = this.clip.getSkeletonPose(this.currFrame);
    //     let skeletonPoseB = this.clip.getSkeletonPose(this.nextFrame);
    //     // SkeletonAnimationCompute.addLerpSkeletonPoseJob(skeletonPoseA, skeletonPoseB, this.t, this.mCurrSkeletonPose);
    //   } else {
    this.clip.getLerpSkeletonPose(this.currFrame, this.nextFrame, this.t, this._currSkeletonPose);
    //   }
  }
}
