import { FloatArray } from "@orillusion/wasm-matrix/WasmMatrix";
import { Engine3D, Matrix4, MeshRenderer, Object3D, PrefabAvatarData, Quaternion, RenderNode, RendererMask, RendererMaskUtil, SkinnedMeshRenderer2, StorageGPUBuffer, Time, Vector3, Vector4, View3D } from "../..";
import { PropertyAnimationClip } from "../../math/AnimationCurveClip";
import { RegisterComponent } from "../../util/SerializeDecoration";
import { ComponentBase } from "../ComponentBase";

@RegisterComponent(AnimatorComponent, 'AnimatorComponent')
export class AnimatorComponent extends ComponentBase {
    public timeScale: number = 1.0;
    public jointMatrixIndexTableBuffer: StorageGPUBuffer;
    public playBlendShapeLoop: boolean = false;
    protected inverseBindMatrices: FloatArray[];
    protected _avatar: PrefabAvatarData;
    protected _rendererList: SkinnedMeshRenderer2[];
    protected propertyCache: Map<RenderNode, { [name: string]: any }>

    protected _clips: PropertyAnimationClip[];
    protected _clipsState: PropertyAnimationClipState[];
    protected _clipsMap: Map<string, PropertyAnimationClip>;
    protected _currentSkeletonClip: PropertyAnimationClipState;
    protected _currentBlendAnimClip: PropertyAnimationClip;

    private _skeletonTime: number = 0;
    private _blendShapeTime: number = 0;
    private _skeletonSpeed: number = 1;
    private _blendShapeSpeed: number = 1;
    private _skeletonStart: boolean = true;
    private _blendShapeStart: boolean = true;
    root: Object3D;
    private _avatarName: string;

    private _bonePos: Vector3 = new Vector3();
    private _boneScale: Vector3 = new Vector3();
    private _boneRot: Quaternion = new Quaternion();
    private _crossFadeState: SkeletonAnimCrossFadeState;

    public init(param?: any): void {
        this.propertyCache = new Map<RenderNode, { [name: string]: any }>();
        this._clipsMap = new Map<string, PropertyAnimationClip>();
        this._clips = [];
        this._clipsState = [];

        this._rendererList = this.object3D.getComponentsInChild(SkinnedMeshRenderer2);
        let mrs = this.object3D.getComponentsInChild(MeshRenderer);
        for (let mr of mrs) {
            let o = mr as any;
            o.blendShape = mr.morphData;
            this._rendererList.push(o);
        }
        for (const renderer of this._rendererList) {
            let hasMorphTarget = RendererMaskUtil.hasMask(renderer.rendererMask, RendererMask.MorphTarget);
            if (hasMorphTarget) {
                renderer.selfCloneMaterials('MORPH_TARGET_UUID');
            }
        }
    }

    public start(): void {
        // this._rendererList = this.object3D.getComponentsInChild(SkinnedMeshRenderer2);
    }

    private debug() {
    }

    public playAnim(anim: string, time: number = 0, speed: number = 1) {
        let clipState = this.getAnimationClipState(anim);
        if (clipState) {
            if (this._currentSkeletonClip) {
                this._currentSkeletonClip.weight = 0;
            }
            this._currentSkeletonClip = clipState;
            this._currentSkeletonClip.weight = 1.0;
            this._skeletonTime = time;
            this._skeletonSpeed = speed;
            this._skeletonStart = true;
        } else {
            console.warn(`not has anim ${anim}`);
        }
    }

    public crossFade(anim: string, crossTime: number) {
        let clipState = this.getAnimationClipState(anim);
        if (!clipState) {
            console.warn(`not has anim ${anim}`);
            return;
        }

        if (crossTime < 0.01 || !this._currentSkeletonClip) {
            this.playAnim(anim);
            return;
        }

        if (this._currentSkeletonClip && this._currentSkeletonClip.clip.clipName === anim) {
            return;
        }

        let inClip = clipState;
        let outClip = this._currentSkeletonClip;

        if (this._crossFadeState) {
            if (this._crossFadeState.inClip) {
              this._crossFadeState.inClip.weight = 0
            }
            if (this._crossFadeState.outClip) {
              this._crossFadeState.outClip.weight = 0
            }
            this._crossFadeState.reset(inClip, outClip, crossTime);
        } else {
            this._crossFadeState = new SkeletonAnimCrossFadeState(inClip, outClip, crossTime);
        }

        this._currentSkeletonClip = inClip;
    }

    public playBlendShape(shapeName: string, time: number = 0, speed: number = 1) {
        if (this._clipsMap.has(shapeName)) {
            this._currentBlendAnimClip = this._clipsMap.get(shapeName);
            this._blendShapeTime = time;
            this._blendShapeSpeed = speed;
            this._blendShapeStart = true;
        } else {
            console.warn(`not has blendShape ${shapeName}`);
        }
    }

    public set avatar(name: string) {
        this._avatarName = name;
        this.inverseBindMatrices = [];

        this._avatar = Engine3D.res.getObj(name) as PrefabAvatarData;

        let jointMapping = this.buildSkeletonPose();
        const jointMatrixIndexTable = new Float32Array(jointMapping);
        this.jointMatrixIndexTableBuffer = new StorageGPUBuffer(this._avatar.count, 0, jointMatrixIndexTable);
    }

    public get numJoint(): number {
        return this._avatar.count;   
    }

    public getJointIndexTable(skinJointsName: Array<string>) {
        let result = new Array<number>();
        for (let i = 0; i < skinJointsName.length; i++) {
            let joint = this._avatar.boneMap.get(skinJointsName[i]);
            result[i] = joint ? joint.boneID : -1;
        }
        return result;
    }

    private skeltonPoseObject3D: { [name: string]: Object3D } = {};
    private skeltonTPoseObject3D: { [name: string]: Object3D } = {};
    private buildSkeletonPose(): number[] {
        let list = [];
        for (const joint of this._avatar.boneData) {
            let obj = new Object3D();

            Matrix4.getEuler(Vector3.HELP_6, joint.q, true, 'ZYX');
            obj.localPosition = joint.t.clone();
            obj.localRotation = Vector3.HELP_6.clone();
            obj.localScale = Vector3.ONE; joint.s.clone();

            this.skeltonPoseObject3D[joint.boneName] = obj;
            this.skeltonTPoseObject3D[joint.bonePath] = obj.clone();

            if (joint.parentBoneName && joint.parentBoneName != "") {
                this.skeltonPoseObject3D[joint.parentBoneName].addChild(obj);
            } else {
                // this.object3D.addChild(obj);
                if (this.object3D.transform.scene3D) {
                    this.object3D.transform.scene3D.addChild(obj);
                }
                this.root = obj;
            }

            list.push(obj.transform.worldMatrix.index);
            let local = new Matrix4();
            local.copyFrom(obj.transform.worldMatrix);
            local.invert();
            this.inverseBindMatrices.push(local.rawData);
        }

        // GUIHelp.endFolder();

        return list;
    }

    public set clips(clips: PropertyAnimationClip[]) {
        this._clips = clips;
        for (const clip of clips) {
            this._clipsMap.set(clip.clipName, clip);
        }
        this._clipsState = [];
        for (const clip of clips) {
            this._clipsState.push(new PropertyAnimationClipState(clip));
        }
        if (!this._currentSkeletonClip) {
            this.playAnim(clips[0].clipName);
        }
    }

    public get clips(): PropertyAnimationClip[] {
        return this._clips;
    }

    public get clipsState(): PropertyAnimationClipState[] {
        return this._clipsState;
    }

    public cloneTo(obj: Object3D): void {
        let animatorComponent = obj.addComponent(AnimatorComponent);
        animatorComponent.avatar = this._avatarName;
        animatorComponent.clips = this._clips;
    }

    private updateTime() {
        const delta = Time.delta * 0.001;

        if (this._skeletonStart) {
            this._skeletonTime += delta * this._skeletonSpeed * this.timeScale;
            if (this._currentSkeletonClip && this._currentSkeletonClip.clip.loopTime) {
                this._skeletonTime = this._skeletonTime % this._currentSkeletonClip.clip.stopTime;
            }
        }

        if (this._blendShapeStart) {
            this._blendShapeTime += delta * this._blendShapeSpeed;
            if (this._currentBlendAnimClip) {
                if (this._currentBlendAnimClip.loopTime && this.playBlendShapeLoop) {
                    this._blendShapeTime = this._blendShapeTime % this._currentBlendAnimClip.stopTime;
                } else {
                    this._blendShapeTime = Math.min(this._blendShapeTime, this._currentBlendAnimClip.stopTime) - 0.0001;
                }
            }
        }

        if (this._crossFadeState) {
            this._crossFadeState.update(delta);
        }
    }

    public onUpdate(view?: View3D) {
        // let worldMatrix = this.transform.worldMatrix;
        // this.root.x = -worldMatrix.position.x ;
        // this.root.y = -worldMatrix.position.y ;
        // this.root.z = -worldMatrix.position.z ;

        this.updateTime();

        let mixClip: PropertyAnimationClipState[] = [];
        for (let clipState of this._clipsState) {
            if (clipState.weight > 0) {
                mixClip.push(clipState);
            }
        }

        if (mixClip.length > 0) {
            this.updateSkeletonAnimMix(mixClip);
        } else {
            this.updateSkeletonAnim();
        }
        
        this.updateMorphAnim();
    }

    private updateSkeletonAnim() {
        if (this._currentSkeletonClip) {
            let joints = this._avatar.boneData;
            let i = 0;
            let len = joints.length;
            for (i = 0; i < len; i++) {
                const joint = joints[i];
                let obj = this.skeltonPoseObject3D[joint.boneName];

                if (this._currentSkeletonClip.clip.useSkeletonPos) {
                    let pos = this.getPosition(joint.bonePath, this._skeletonTime);
                    obj.transform.localPosition = pos;
                }

                let rot = this.getRotation(joint.bonePath, this._skeletonTime);
                obj.transform.localRotQuat = rot as Quaternion;

                if (this._currentSkeletonClip.clip.useSkeletonScale) {
                    let scale = this.getScale(joint.bonePath, this._skeletonTime);
                    obj.transform.localScale = scale;
                }
            }
        }
    }

    private updateMorphAnim() {
        if (this._currentBlendAnimClip && this._currentBlendAnimClip.floatCurves) {
            if (this._currentBlendAnimClip.floatCurves.size > 0 && this._rendererList) {
                for (const iterator of this._currentBlendAnimClip.floatCurves) {
                    let key = iterator[0];
                    let curve = iterator[1];
                    let attributes = curve.propertys;

                    let x = this._currentBlendAnimClip.floatCurves.get(key).getValue(this._blendShapeTime) as number;
                    let value = x / 100;
                    this.updateBlendShape(attributes, key, value);
                }
            }
        }
    }

    public updateBlendShape(attributes: string[], key: string, value: number) {
        for (const renderer of this._rendererList) {
            if (renderer.blendShape) {
                let property: any = this.propertyCache.get(renderer);
                if (property && key in property) {
                    property[key](value);
                } else {
                    property = renderer;
                    for (const att of attributes) {
                        if (!property[att]) {
                            property = null;
                            break;
                        }
                        property = property[att];
                    }
                    if (!property || property == renderer)
                        continue;

                    if (!this.propertyCache.get(renderer))
                        this.propertyCache.set(renderer, {})
                    this.propertyCache.get(renderer)[key] = property;
                    property(value);
                }
            }
        }
    }

    private updateSkeletonAnimMix(mixClip: PropertyAnimationClipState[]) {
        let totalWeight = 0;
        for (let clip of mixClip) {
            totalWeight += clip.weight;
        }

        if (mixClip.length > 0) {
            let joints = this._avatar.boneData;
            let len = joints.length;
            for (let i = 0; i < len; i++) {
                const joint = joints[i];
                let obj = this.skeltonPoseObject3D[joint.boneName];

                if (mixClip[0].clip.useSkeletonPos) {
                    this._bonePos.copyFrom(this.getPosition(joint.bonePath, this._skeletonTime, mixClip[0].clip));
                    for (let i = 1; i < mixClip.length; i++) {
                        const clipState = mixClip[i];
                        if (clipState.clip.useSkeletonPos) {
                            let pos = this.getPosition(joint.bonePath, this._skeletonTime, clipState.clip);
                            Vector3.HELP_0.lerp(this._bonePos, pos, clipState.weight / totalWeight);
                            this._bonePos.copyFrom(Vector3.HELP_0);
                        }
                    }
                    obj.transform.localPosition = this._bonePos;
                }

                this._boneRot.copyFrom(this.getRotation(joint.bonePath, this._skeletonTime, mixClip[0].clip));
                for (let i = 1; i < mixClip.length; i++) {
                    const clipState = mixClip[i];
                    let rot = this.getRotation(joint.bonePath, this._skeletonTime, clipState.clip);
                    Quaternion.HELP_2.slerp(this._boneRot, rot, clipState.weight / totalWeight);
                    this._boneRot.copyFrom(Quaternion.HELP_2);
                }
                obj.transform.localRotQuat = this._boneRot;

                if (mixClip[0].clip.useSkeletonScale) {
                    this._boneScale.copyFrom(this.getScale(joint.bonePath, this._skeletonTime, mixClip[0].clip));
                    for (let i = 1; i < mixClip.length; i++) {
                        const clipState = mixClip[i];
                        if (clipState.clip.useSkeletonScale) {
                            let scale = this.getScale(joint.bonePath, this._skeletonTime, clipState.clip);
                            Vector3.HELP_0.lerp(this._boneScale, scale, clipState.weight / totalWeight);
                            this._boneScale.copyFrom(Vector3.HELP_0);
                        }
                    }
                    obj.transform.localScale = this._boneScale;
                }
            }
        }
    }

    private getPosition(boneName: string, time: number, clip: PropertyAnimationClip = this._currentSkeletonClip.clip) {
        if (clip.positionCurves.has(boneName)) {
            let t = clip.positionCurves.get(boneName).getValue(time) as Vector3;
            return t;
        }
        return this.skeltonTPoseObject3D[boneName].localPosition;
    }

    private getRotation(boneName: string, time: number, clip: PropertyAnimationClip = this._currentSkeletonClip.clip) {
        if (clip.rotationCurves.has(boneName)) {
            let v4 = clip.rotationCurves.get(boneName).getValue(time) as Vector4;
            Quaternion.HELP_0.set(v4.x, v4.y, v4.z, v4.w);
            return Quaternion.HELP_0;
        }
        return this.skeltonTPoseObject3D[boneName].localQuaternion;
    }

    private getScale(boneName: string, time: number, clip: PropertyAnimationClip = this._currentSkeletonClip.clip) {
        if (clip.scaleCurves.has(boneName)) {
            let x = clip.scaleCurves.get(boneName).getValue(time) as Vector3;
            return x;
        }
        return this.skeltonTPoseObject3D[boneName].localScale;
    }

    /**
     * Gets the animation clip data object with the specified name
     * @param name Name of animation
     * @returns Animation clip data object
     */
    public getAnimationClipState(name: string): PropertyAnimationClipState {
        for (let clipState of this._clipsState) {
            if (clipState.clip.clipName === name) {
                return clipState;
            }
        }
        return null;
    }

    public cloneMorphRenderers(): { [key: string]: SkinnedMeshRenderer2[] } {
        let dst: { [key: string]: SkinnedMeshRenderer2[] } = {};
        for (const renderer of this._rendererList) {
            for (const key in renderer.geometry.morphTargetDictionary) {
                let renderList = dst[key] || [];
                renderList.push(renderer);
                dst[key] = renderList;
            }
        }
        return dst;
    }
}

export class PropertyAnimationClipState {
    public clip: PropertyAnimationClip;
    public weight: number = 0.0;

    public get totalTime(): number {
        return this.clip.stopTime - this.clip.startTime;
    }

    constructor(clip: PropertyAnimationClip) {
        this.clip = clip;
    }
}

class SkeletonAnimCrossFadeState {
    public inClip: PropertyAnimationClipState;
    public outClip: PropertyAnimationClipState;
    public currentTime: number;
    public crossFadeTime: number;
    constructor(inClip: PropertyAnimationClipState, outClip: PropertyAnimationClipState, time: number) {
        this.reset(inClip, outClip, time);
    }
    public reset(inClip: PropertyAnimationClipState, outClip: PropertyAnimationClipState, time: number) {
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
