import { Skeleton } from './Skeleton';
import { SkeletonPose } from './SkeletonPose';
import { OAnimationEvent } from '../OAnimationEvent';

/**
 *
 * SkeletonAnimationClip contains all keyframe data of one skeleton animation
 * @internal
 * @group Animation
 */
export class SkeletonAnimationClip {
  public name: string = '';
  protected _skeleton: Skeleton;
  protected _skeletonPoses: Array<SkeletonPose>;
  protected _animationClipData: Float32Array;
  protected _events: Array<OAnimationEvent>;

  constructor(name: string, skeleton: Skeleton, numFrame: number, bufferData: Float32Array) {
    this.name = name;
    this._skeleton = skeleton;
    this._animationClipData = bufferData;
    if (numFrame > 0 && bufferData) {
      this._skeletonPoses = new Array<SkeletonPose>(numFrame);
      let skeletonPoseLength: number = 12 * skeleton.numJoint;
      for (let nFrame: number = 0; nFrame < numFrame; nFrame++) {
        let byteOffset: number = skeletonPoseLength * nFrame * 4;
        let poseData = new Float32Array(bufferData.buffer, byteOffset, skeletonPoseLength);
        let skeletonPose = new SkeletonPose(skeleton);
        skeletonPose.buildSkeletonPose(poseData);
        this._skeletonPoses[nFrame] = skeletonPose;
      }
    }
  }

  /*
  * Animation total time in seconds
  */
  public get totalTime(): number {
    return this._skeletonPoses[this._skeletonPoses.length - 1].time;
  }

  /*
  * Frame rate at which keyframes are sampled.
  */
  public get frameRate(): number {
    return this.totalTime / this._skeletonPoses.length;
  }

  /*
  * Returns owner skeleton
  */
  public get skeleton(): Skeleton {
    return this._skeleton;
  }

  /*
  * Returns key frame count 
  */
  public get numFrame(): number {
    return this._skeletonPoses.length - 1;
  }

  /*
  * Returns float32 array of this animation clip
  */
  public get animationClipData(): Float32Array {
    return this._animationClipData;
  }

  /*
  * Returns skeletonPose at target frame
  */
  public getSkeletonPose(frame: number): SkeletonPose {
    return this._skeletonPoses[frame];
  }

  /** 
  * Returns lerped skeletonPose between currFrame and nextFrame
  * @param currFrame selected frame No.1
  * @param nextFrame selected frame No.2
  * @param weight number
  * @param dst  result SkeletonPose
  */
  public getLerpSkeletonPose(currFrame: number, nextFrame: number, weight: number, dst: SkeletonPose): SkeletonPose {
    let skeletonPoseA = this.getSkeletonPose(currFrame);
    let skeletonPoseB = this.getSkeletonPose(nextFrame);
    dst.lerp(skeletonPoseA, skeletonPoseB, weight);
    return dst;
  }

  /** 
  * create one skeletonAnimationClip from startTime to endTime
  * @param name the name of new animation clip
  * @param startTime set time of animation clip start from
  * @param endTime set time of animation clip end of
  */
  public createSubClip(name: string, startTime: number, endTime: number): SkeletonAnimationClip {
    var result = new SkeletonAnimationClip(name, this._skeleton, 0, null);
    const startFrame = Math.max(Math.floor(startTime / this.frameRate), 0);
    const endFrame = Math.min(Math.floor(endTime / this.frameRate), this._skeletonPoses.length - 1);
    result._skeletonPoses = this._skeletonPoses.slice(startFrame, endFrame);
    const skeletonPoseByteLength = 12 * this._skeleton.numJoint * 4;
    this._animationClipData = new Float32Array(this._animationClipData, startFrame * skeletonPoseByteLength, (endFrame - startFrame) * skeletonPoseByteLength);
    return result;
  }

  /** 
  * register a event in this animation clip.
  * @param eventName event name
  * @param startTime number
  */
  public addEvent(eventName: string, triggerTime: number) {
    if (!this._events) {
      this._events = new Array<OAnimationEvent>();
    }
    this._events.push(new OAnimationEvent(eventName, triggerTime));
  }

  /** 
  * remove a event in this animation clip
  * @param eventName event name
  */
  public removeEvent(eventName: string) {
    if (this._events) {
      this._events = this._events.filter(items => items.type != eventName);
    }
  }

  /** 
  * Returns all AnimationEvent of this animationClip
  * @param eventName event name
  */
  public getEvents(): Array<OAnimationEvent> {
    return this._events;
  }
}
