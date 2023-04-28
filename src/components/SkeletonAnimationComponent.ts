import { Object3D } from "../core/entities/Object3D";
import { StorageGPUBuffer } from "../gfx/graphics/webGpu/core/buffer/StorageGPUBuffer";
import { Time } from "../util/Time";
import { ComponentBase } from "./ComponentBase";
import { Skeleton } from "./anim/skeletonAnim/Skeleton";
import { SkeletonAnimationClip } from "./anim/skeletonAnim/SkeletonAnimationClip";
import { SkeletonAnimationClipState } from "./anim/skeletonAnim/SkeletonAnimationClipState";
import { SkeletonPose } from "./anim/skeletonAnim/SkeletonPose";

/**
 * skeleton animation
 * @group Animation 
 */
export class SkeletonAnimationComponent extends ComponentBase {
  /**
   * Whether it is playing
   */
  public isPlaying: boolean = true;

  /**
   * Global animation time scaling
   */
  public timeScale: number = 1.0;

  protected _skeleton: Skeleton;
  protected _clips: SkeletonAnimationClip[] = [];
  protected _clipStates: Map<string, SkeletonAnimationClipState> = new Map<string, SkeletonAnimationClipState>();
  protected _mixSkeletonPose: SkeletonPose;
  protected _mixTempSkeletonPose: SkeletonPose;
  protected _currentClipState: SkeletonAnimationClipState;
  protected _bindList: Array<any> = [];
  protected _jointMatrixIndexTableBuffer: StorageGPUBuffer;
  protected _crossFadeState: SkeletonAnimationCrossFadeState;

  constructor() {
    super();
  }

  public start() {

  }

  /**
   * The name of the currently playing animation
   */
  public get currName(): string {
    if (this._currentClipState) {
      return this._currentClipState.name;
    }
    return '';
  }

  /**
   * Skeleton data
   */
  public set skeleton(value: Skeleton) {
    this._skeleton = value;
    this._mixSkeletonPose = new SkeletonPose(this._skeleton, true);
    this._mixTempSkeletonPose = new SkeletonPose(this._skeleton);
    const jointMatrixIndexTable = new Float32Array(this._mixSkeletonPose.jointMatrixIndexTable);
    this._jointMatrixIndexTableBuffer = new StorageGPUBuffer(this._skeleton.numJoint * 4, 0, jointMatrixIndexTable);
    this._jointMatrixIndexTableBuffer.visibility = GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE;
  }

  /**
   * Skeleton data
   */
  public get skeleton(): Skeleton {
    return this._skeleton;
  }

  /**
   * Current final skeleton posture data
   */
  public get finalSkeletonPose(): SkeletonPose {
    return this._mixSkeletonPose;
  }

  /**
   * Bone matrix index table data
   */
  public get jointMatrixIndexTableBuffer(): StorageGPUBuffer {
    return this._jointMatrixIndexTableBuffer;
  }

  /**
   * Get the bone index information by the bone name
   * @param skinJointsName bone name
   * @returns bone index
   */
  public getJointIndexTable(skinJointsName: Array<string>): Array<number> {
    let result = new Array<number>();
    for (let i = 0; i < skinJointsName.length; i++) {
      const name = skinJointsName[i];
      let joint = this._skeleton.getJointByName(name);
      result[i] = joint ? joint.index : -1;
    }
    return result;
  }

  /**
   * Add a skeleton animation clip
   * @param clip Skeletal animation clip
   */
  public addAnimationClip(clip: SkeletonAnimationClip) {
    if (!this._clipStates.has(clip.name)) {
      this._clips.push(clip);
      let clipState = new SkeletonAnimationClipState(clip);
      clipState.animation = this;
      this._clipStates.set(clip.name, clipState);
      if (!this._currentClipState) {
        this.setCurrentClipState(clipState)
      }
    }
  }

  /**
   * Gets the animation clip data object with the specified name
   * @param name Name of animation
   * @returns Animation clip data object
   */
  public getAnimationClip(name: string): SkeletonAnimationClip {
    var clipState = this.getAnimationClipState(name);
    if (clipState) {
      return clipState.clip;
    }
    return null
  }

  /**
   * Gets all animation clip data objects
   * @returns Animation clip data object
   */
  public getAnimationClips(): SkeletonAnimationClip[] {
    return this._clips;
  }

  /**
   * Gets the animation clip state object with the specified name
   * @param name Name of animation
   * @returns Animation clip state object
   */
  public getAnimationClipState(name: string): SkeletonAnimationClipState {
    if (this._clipStates.has(name)) {
      return this._clipStates.get(name);
    }
    return null
  }

  /**
   * Gets all animation clip state objects
   * @returns Animation clip state object
   */
  public getAnimationClipStates(): Map<string, SkeletonAnimationClipState> {
    return this._clipStates;
  }

  /**
   * stop playing
   */
  public pause() {
    this.isPlaying = false;
  }

  /**
   * Resume playback
   */
  public resume() {
    this.isPlaying = true;
  }

  /**
   * Play the specified animation
   * @param animName The data set name for the animation
   * @param speed Animation playback speed, default value is 1.0
   * @param reset When true, each play starts with the first frame
   * @returns
   */
  public play(animName: string, speed: number = 1, reset: boolean = false): boolean {
    if (this._currentClipState && this._currentClipState.name == animName) {
      if (reset) {
        this._currentClipState.reset();
      }
      return false;
    }

    let clipState = this.getAnimationClipState(animName);
    if (!clipState) {
      return false;
    }

    clipState.speed = speed;
    clipState.reset();

    this._clipStates.forEach((clipState, name) => {
      clipState.weight = 0;
    })

    this.setCurrentClipState(clipState)
    return true;
  }

  /**
   * Fades the current animation and fades into another animation state for a specified time.
   * @param animName The name of the animation to fade in.
   * @param crossTime The time of transition, in seconds.
   * @returns
   */
  public crossFade(animName: string, crossTime: number) {
    if (crossTime < 0.01) {
      this.play(animName);
      return;
    }

    if (this._currentClipState.name == animName) {
      return;
    }

    let clipState = this.getAnimationClipState(animName);
    if (!clipState) {
      return;
    }
    clipState.reset();

    if (this._crossFadeState) {
      if (this._crossFadeState.inClip) {
        this._crossFadeState.inClip.weight = 0
      }
      if (this._crossFadeState.outClip) {
        this._crossFadeState.outClip.weight = 0
      }
      this._crossFadeState.reset(clipState, this._currentClipState, crossTime);
    } else {
      this._crossFadeState = new SkeletonAnimationCrossFadeState(
        clipState,
        this._currentClipState,
        crossTime
      );
    }

    this._currentClipState = clipState;
  }

  /**
   * Set the animation loop
   * @param animName The data set name for the animation
   * @param isLoop   If true, loop the animation
   */
  public setAnimIsLoop(animName: string, isLoop: boolean) {
    if (this._clipStates.has(animName)) {
      this._clipStates.get(animName).loop = isLoop;
    }
  }

  /**
   * Add joint bindings to the object
   * @param jointName Name of joint
   * @param obj       Object of binding
   */
  public addJointBind(jointName: string, obj: Object3D) {
    this._bindList.push({
      jointName: jointName,
      obj: obj,
    });
  }

  /**
   * Removes the joint binding of the specified object
   * @param jointName Name of joint
   * @param obj Object of binding
   */
  public removeJointBind(obj: Object3D) {
    for (let index = 0; index < this._bindList.length; index++) {
      let item = this._bindList[index];
      if (item.obj == obj) {
        this._bindList.splice(index, 1);
        break;
      }
    }
  }

  /**
   * @internal
   */
  public onUpdate() {
    if (!this.isPlaying) {
      return;
    }

    let delta = (Time.delta * 0.001) * this.timeScale;

    if (this._crossFadeState) {
      this._crossFadeState.update(delta);
    }

    var totalWeight = 0;
    var mixClipState: SkeletonAnimationClipState[] = [];
    this._clipStates.forEach((clipState, name) => {
      if (clipState.weight > 0) {
        clipState.update(delta);
        totalWeight += clipState.weight;
        mixClipState.push(clipState);
      }
    })

    if (mixClipState.length > 0) {
      this._mixSkeletonPose.copyFrom(mixClipState[0].currSkeletonPose);
      for (var i = 1; i < mixClipState.length; ++i) {
        const clipState = mixClipState[i];
        this._mixTempSkeletonPose.lerp(this._mixSkeletonPose, clipState.currSkeletonPose, clipState.weight / totalWeight);
        this._mixSkeletonPose.copyFrom(this._mixTempSkeletonPose);
      }
    }
  }

  /**
   * Clones the current component to the specified object
   * @param obj target object
   */
  public cloneTo(obj: Object3D) {
    let animator = obj.addComponent(SkeletonAnimationComponent);
    animator.skeleton = this.skeleton;
    for (var i = 0; i < this._clips.length; ++i) {
      animator.addAnimationClip(this._clips[i])
    }
  }

  protected setCurrentClipState(clipState: SkeletonAnimationClipState) {
    if (this._currentClipState == clipState) {
      return
    }

    this._currentClipState = clipState;
    this._currentClipState.weight = 1.0;
  }
}

/**
 * @internal
 * @group Animation
 */
class SkeletonAnimationCrossFadeState {
  public inClip: SkeletonAnimationClipState;
  public outClip: SkeletonAnimationClipState;
  public currentTime: number;
  public crossFadeTime: number;

  constructor(inClip: SkeletonAnimationClipState, outClip: SkeletonAnimationClipState, time: number) {
    this.reset(inClip, outClip, time);
  }

  public reset(inClip: SkeletonAnimationClipState, outClip: SkeletonAnimationClipState, time: number) {
    this.inClip = inClip;
    this.outClip = outClip;
    this.currentTime = 0;
    this.crossFadeTime = time;
  }

  public update(delta: number) {
    if (!this.inClip || !this.outClip) {
      return;
    }
    this.currentTime += delta;
    this.inClip.weight = Math.min(Math.abs(this.currentTime % this.crossFadeTime) / this.crossFadeTime, 1.0);
    this.outClip.weight = 1.0 - this.inClip.weight;
    if (Math.abs(this.currentTime) >= this.crossFadeTime) {
      this.inClip.weight = 1.0;
      this.outClip.weight = 0.0;
      this.inClip = null;
      this.outClip = null;
    }
  }
}
