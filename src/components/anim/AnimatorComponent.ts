import { FloatArray } from "../matrix/WasmMatrix";
import { Engine3D, Matrix4, MeshRenderer, Object3D, PrefabAvatarData, Quaternion, RenderNode, RendererMask, RendererMaskUtil, Retargeter, RetargeterConfig, SkinnedMeshRenderer2, StorageGPUBuffer, Time, Vector3, Vector4, View3D } from "../..";
import { PropertyAnimationClip } from "../../math/AnimationCurveClip";
import { RegisterComponent } from "../../util/SerializeDecoration";
import { ComponentBase } from "../ComponentBase";
import { AnimationLayer, LayerBlendMode } from "./graph/AnimationLayer";

/**
 * Skeletal + blend-shape animation driver. Samples property-animation
 * clips to pose an avatar's joints, supports clip cross-fading, stacked
 * override/additive layers, a pluggable state machine, IK solvers and
 * cross-rig retargeting, and dispatches blend-shape (morph) influences.
 * @group Animation
 */
@RegisterComponent(AnimatorComponent, 'AnimatorComponent')
export class AnimatorComponent extends ComponentBase {
    /** Global playback speed multiplier applied to all clips and layers. */
    public timeScale: number = 1.0;
    /** GPU buffer mapping joints to their world-matrix indices. */
    public jointMatrixIndexTableBuffer: StorageGPUBuffer;
    /**
     * CPU copy of `jointMatrixIndexTableBuffer`: for each bone ID, the
     * global matrix index (`Matrix4.index`) of that bone's world matrix.
     * Used by CPU skinning (`MeshDeformer`).
     */
    public jointMatrixIndexTable: number[];
    /** Whether the blend-shape (morph) animation loops. */
    public playBlendShapeLoop: boolean = false;
    protected inverseBindMatrices: FloatArray[];
    protected _avatar: PrefabAvatarData;
    protected _rendererList: SkinnedMeshRenderer2[];
    // Cache of resolved blend-shape setters: per renderer, a map keyed by
    // morph-target name to a closure that writes the influence value.
    // Compiled lazily on first dispatch (the renderer list isn't known until
    // start), then reused every frame to avoid string-property reflection.
    protected propertyCache: Map<RenderNode, Map<string, (value: number) => void>>

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

    /** Stacked override / additive layers (excluding the implicit base layer 0). */
    private _layers: AnimationLayer[] = [];

    /** Optional state machine. evaluate() runs every frame before sampling. */
    private _stateMachine: { evaluate(animator: AnimatorComponent, dt: number): void } | null = null;

    /** IK solvers, run after layer mix. */
    private _ikSolvers: Array<{ solve(animator: AnimatorComponent): void }> = [];

    private _retargeter: Retargeter;

    /** Collect skinned/morph renderers in the hierarchy and prepare caches. */
    public init(param?: any): void {
        this.propertyCache = new Map<RenderNode, Map<string, (value: number) => void>>();
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

    /** Re-parent the skeleton root once the (possibly cloned) hierarchy is wired. */
    public start(): void {
        // Re-parent the skeleton's root joint now that we are attached to
        // a scene. Why this is needed: in the clone path, buildSkeletonPose
        // runs while `Object3D.instantiate()` is still constructing the
        // cloned subtree — `this.object3D.parent` is null at that moment
        // (the parent link is set by the OUTER instantiate call AFTER
        // `cloneTo` returns). The fallback in buildSkeletonPose can't
        // attach to scene3D either (the cloned subtree isn't in the scene
        // yet), so the root joint is born orphaned and the skinned mesh
        // ignores the cloned root's world transform — Sample_Skeleton2
        // sees three soldiers stacked at the origin instead of at
        // x=-10/-100/100. By start() time the cloned hierarchy is fully
        // wired, so gltfParent resolves and the joint inherits the
        // correct world transform.
        if (this.root && !this.root.parent) {
            const gltfParent = this.object3D.parent
                ? (this.object3D.parent.object3D as Object3D)
                : null;
            if (gltfParent) {
                gltfParent.addChild(this.root);
            } else if (this.object3D.transform.scene3D) {
                this.object3D.transform.scene3D.addChild(this.root);
            }
        }
    }

    private debug() {
    }

    /**
     * Play a skeleton animation clip immediately.
     * @param anim clip name
     * @param time start time in seconds
     * @param speed playback speed multiplier
     */
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

    /**
     * Cross-fade from the current clip to another over `crossTime` seconds.
     * @param anim destination clip name
     * @param crossTime fade duration in seconds
     */
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

    /**
     * Play a blend-shape (morph) animation clip.
     * @param shapeName blend-shape clip name
     * @param time start time in seconds
     * @param speed playback speed multiplier
     */
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

    /**
     * Drive another animator's skeleton from this one via retargeting.
     * Pass `null` to stop retargeting.
     * @param target the animator to drive, or null to clear
     * @param cfg optional retargeting configuration
     */
    public retargetTo(target: AnimatorComponent, cfg?: RetargeterConfig ) {
        if (target) {
            // Silence the target's own animator so the retargeter is the
            // sole driver of the bones. `clipState.weight = 0` alone is
            // not enough — `AnimatorComponent.updateSkeletonAnim` writes
            // bone localPosition/Rotation from the current clip's curves
            // unconditionally each frame, ignoring weight. Null out the
            // current clip so the per-frame write is skipped entirely.
            for (const cs of target.clipsState) cs.weight = 0;
            (target as any)._currentSkeletonClip = null;

            // Both rigs use the `mixamorig:` prefix → exact-name match resolves
            // every bone. No name map needed.
            this._retargeter = new Retargeter(this, target, cfg ?? {});
        } else {
            this._retargeter = null;
        }
    }

    /** Assign the avatar (skeleton) by registered resource name and build its pose. */
    public set avatar(name: string) {
        this._avatarName = name;
        this.inverseBindMatrices = [];

        const ctx = this.transform?.view3D?.engine3D?.context3D;
        this._avatar = Engine3D.resFor(ctx).getObj(name) as PrefabAvatarData;

        let jointMapping = this.buildSkeletonPose();
        this.jointMatrixIndexTable = jointMapping;
        const jointMatrixIndexTable = new Float32Array(jointMapping);
        this.jointMatrixIndexTableBuffer = new StorageGPUBuffer(this._avatar.count, 0, jointMatrixIndexTable);
    }

    /** Number of joints in the current avatar. */
    public get numJoint(): number {
        return this._avatar.count;
    }

    /**
     * Map a list of skin joint names to their avatar bone IDs (-1 if absent).
     * @param skinJointsName joint names in skin order
     */
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
        // Reset map at start of each call so a stale entry from a
        // prior build doesn't leak into the new pose.
        this.skeltonPoseObject3D = {};
        this.skeltonTPoseObject3D = {};
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
                // Live-parent the root joint under the gltf ancestor that
                // hosted the skeleton in the original gltf document. This
                // is the node that AnimatorComponent itself was attached to
                // by the loader — so its parent (`gltfParent`) is exactly
                // the node that `skin.skeleton` points at in glTF terms.
                //
                // Why live-parent (vs the older snapshot-bake to scene3D
                // root):
                //   - The set#2 root joint stops being a scene orphan;
                //     it joins the gltf hierarchy at the same point as
                //     the original (set#1) skeleton root.
                //   - User transforms applied to the loader root after
                //     load (e.g. translating `kiraRoot`) propagate
                //     through `gltfParent.worldMatrix` into every joint
                //     world matrix — so the skinned mesh follows the
                //     same world transform as the rest of the gltf scene
                //     graph. With the previous scene-orphan design the
                //     mesh node would inherit user transforms but the
                //     bones would not, decoupling skin from skeleton.
                //   - Bind-pose math: jointWorld at bind = gltfParent.world
                //     * joint.local (matching the gltf-authored bind
                //     world matrix used to compute invBindMatrices), so
                //     jointWorld * invBind = identity at bind without any
                //     bake step.
                //
                // Combined with the shader's `ORI_MATRIX_M = skeletonNormal`
                // (overwrite, not multiply), the skinning matrix produces
                // final world-space output per glTF 2.0 spec — the mesh
                // node's own transform is correctly ignored when skinning,
                // so meshes whose mesh node has a non-identity worldMatrix
                // (Kira_Hair_A.0020 at Y=-0.404) are no longer
                // double-transformed.
                // Try to parent immediately. In the glTF-loader path,
                // `this.object3D` is already wired into the loader's tree
                // when buildSkeletonPose runs, so gltfParent resolves and
                // we attach right away (preserving existing behavior).
                //
                // In the clone path, however, `Object3D.instantiate()`
                // attaches `tmp` to its outer parent ONLY AFTER calling
                // each component's `cloneTo(tmp)`. So at this moment
                // `this.object3D.parent` is null and scene3D is null
                // too (the cloned subtree is still detached). The root
                // joint would end up unparented, which decouples it
                // from the cloned hierarchy's world transform — visible
                // in Sample_Skeleton2 as cloned soldiers ignoring
                // `soldier2.x = -100`.
                //
                // When that happens, leave `this.root` orphaned and let
                // `start()` re-parent it once the cloned subtree has been
                // added to the scene (Object3D parent chain is then
                // wired and gltfParent resolves correctly).
                const gltfParent = this.object3D.parent
                    ? (this.object3D.parent.object3D as Object3D)
                    : null;
                if (gltfParent) {
                    gltfParent.addChild(obj);
                } else if (this.object3D.transform.scene3D) {
                    this.object3D.transform.scene3D.addChild(obj);
                }
                this.root = obj;
            }

            list.push(obj.transform.worldMatrix.index);
            let local = new Matrix4();
            local.copy(obj.transform.worldMatrix);
            local.invert();
            this.inverseBindMatrices.push(local.rawData);
        }

        // Force-update every joint's worldMatrix into the global matrix
        // table. buildSkeletonPose runs during glTF parsing (before the
        // gltf root is added to a Scene3D), so the orphan joint
        // Object3Ds are never visited by the scene's transform update.
        // Without this loop, models.matrix[joint.worldMatrix.index]
        // stays uninitialized (zero/identity) and skinned-mesh shaders
        // produce a degenerate `invBind * v_local` for unanimated rigs
        // — the visible "mesh detached from bones at bind pose" symptom
        // for glbs with no animation data (Kira).
        for (const joint of this._avatar.boneData) {
            const obj = this.skeltonPoseObject3D[joint.boneName];
            if (obj) obj.transform.updateWorldMatrix(true);
        }

        return list;
    }

    /** Assign the animation clips, building per-clip state and auto-playing the first. */
    public set clips(clips: PropertyAnimationClip[]) {
        this._clips = clips;
        for (const clip of clips) {
            this._clipsMap.set(clip.clipName, clip);
        }
        this._clipsState = [];
        for (const clip of clips) {
            this._clipsState.push(new PropertyAnimationClipState(clip));
        }
        // Auto-play the first clip only when there is one. Skinned-but-not-
        // animated rigs (e.g. Kira) feed in an empty array and rely on
        // external IK to pose the skeleton — auto-playAnim with no clips
        // would throw on `clips[0].clipName`.
        if (!this._currentSkeletonClip && clips.length > 0) {
            this.playAnim(clips[0].clipName);
        }
    }

    /** The animation clips assigned to this animator. */
    public get clips(): PropertyAnimationClip[] {
        return this._clips;
    }

    /** Per-clip playback state (weights, etc.). */
    public get clipsState(): PropertyAnimationClipState[] {
        return this._clipsState;
    }

    /** Clone this animator (avatar + clips) onto another object. */
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

    /** Per-frame update: advance time, sample clips, apply layers, IK and morphs. */
    public onUpdate(view?: View3D) {
        const delta = Time.delta * 0.001;

        // State machine drives clip selection before sampling.
        if (this._stateMachine) this._stateMachine.evaluate(this, delta);

        this.updateTime();

        // Apply retarget
        if (this._retargeter) {
            this._retargeter.apply();
        }

        // Base pose: layer 0 = the existing weighted-clip mix.
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

        // Stacked layers (override / additive) on top of the base pose.
        if (this._layers.length > 0) {
            this.updateLayers(delta);
        }

        // IK runs after layers — chains see the final pre-IK pose.
        for (const solver of this._ikSolvers) solver.solve(this);

        this.updateMorphAnim();
    }

    private updateSkeletonAnim() {
        if (this._currentSkeletonClip) {
            let joints = this._avatar.boneData;
            let i = 0;
            let len = joints.length;
            // Whether ANY layer might write on top of us this frame. When
            // layers are stacked we MUST overwrite position+scale every frame
            // (with a rest-pose fallback when the clip lacks those curves)
            // so additive layers don't accumulate against last frame's
            // additive contribution. With no layers, we keep the
            // "skip-if-clip-doesn't-have-curves" optimization.
            const hasLayers = this._layers.length > 0;
            for (i = 0; i < len; i++) {
                const joint = joints[i];
                let obj = this.skeltonPoseObject3D[joint.boneName];

                if (this._currentSkeletonClip.clip.useSkeletonPos || hasLayers) {
                    let pos = this.getPosition(joint.bonePath, this._skeletonTime);
                    obj.transform.localPosition = pos;
                }

                let rot = this.getRotation(joint.bonePath, this._skeletonTime);
                obj.transform.localRotQuat = rot as Quaternion;

                if (this._currentSkeletonClip.clip.useSkeletonScale || hasLayers) {
                    let scale = this.getScale(joint.bonePath, this._skeletonTime);
                    obj.transform.localScale = scale;
                }
            }
        } else if (this._avatar) {
            // No active clip — push bind-pose joint matrices to the global
            // matrix table every frame so models.matrix[joint.index] stays
            // current. Skin-only glbs (Kira) have no clips to drive joint
            // transforms, and the orphan joint Object3Ds aren't visited by
            // the scene's per-frame transform refresh, so without this the
            // GPU sees stale matrices and skinning produces detached
            // limbs / collapsed meshes.
            const joints = this._avatar.boneData;
            for (let i = 0; i < joints.length; i++) {
                const obj = this.skeltonPoseObject3D[joints[i].boneName];
                if (obj) obj.transform.updateWorldMatrix(true);
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

    /**
     * Apply a blend-shape influence to all renderers, caching the resolved
     * setter per renderer to avoid per-frame property reflection.
     * @param attributes property path to the setter
     * @param key morph target name (cache key)
     * @param value influence value in [0,1]
     */
    public updateBlendShape(attributes: string[], key: string, value: number) {
        for (const renderer of this._rendererList) {
            if (!renderer.blendShape) continue;

            let bucket = this.propertyCache.get(renderer);
            if (!bucket) {
                bucket = new Map<string, (value: number) => void>();
                this.propertyCache.set(renderer, bucket);
            }

            let setter = bucket.get(key);
            if (setter) {
                setter(value);
                continue;
            }

            // Resolve the property path once and cache the resulting function
            // as a setter closure. Subsequent frames go through the bucket
            // lookup above without any string reflection.
            let target: any = renderer;
            let resolved = true;
            for (const att of attributes) {
                if (!target[att]) {
                    resolved = false;
                    break;
                }
                target = target[att];
            }
            if (!resolved || target === renderer || typeof target !== 'function') continue;

            const fn = target as (value: number) => void;
            bucket.set(key, fn);
            fn(value);
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
            // See note in updateSkeletonAnim: when layers are present, we
            // must always overwrite position+scale (using rest pose as
            // fallback) so additive layers don't accumulate against the
            // previous frame's contribution.
            const hasLayers = this._layers.length > 0;
            const anyClipHasPos = hasLayers || mixClip.some(c => c.clip.useSkeletonPos);
            const anyClipHasScale = hasLayers || mixClip.some(c => c.clip.useSkeletonScale);
            for (let i = 0; i < len; i++) {
                const joint = joints[i];
                let obj = this.skeltonPoseObject3D[joint.boneName];

                if (anyClipHasPos) {
                    this._bonePos.copy(this.getPosition(joint.bonePath, this._skeletonTime, mixClip[0].clip));
                    for (let i = 1; i < mixClip.length; i++) {
                        const clipState = mixClip[i];
                        let pos = this.getPosition(joint.bonePath, this._skeletonTime, clipState.clip);
                        Vector3.HELP_0.lerp(this._bonePos, pos, clipState.weight / totalWeight);
                        this._bonePos.copy(Vector3.HELP_0);
                    }
                    obj.transform.localPosition = this._bonePos;
                }

                this._boneRot.copy(this.getRotation(joint.bonePath, this._skeletonTime, mixClip[0].clip));
                for (let i = 1; i < mixClip.length; i++) {
                    const clipState = mixClip[i];
                    let rot = this.getRotation(joint.bonePath, this._skeletonTime, clipState.clip);
                    Quaternion.HELP_2.slerp(this._boneRot, rot, clipState.weight / totalWeight);
                    this._boneRot.copy(Quaternion.HELP_2);
                }
                obj.transform.localRotQuat = this._boneRot;

                if (anyClipHasScale) {
                    this._boneScale.copy(this.getScale(joint.bonePath, this._skeletonTime, mixClip[0].clip));
                    for (let i = 1; i < mixClip.length; i++) {
                        const clipState = mixClip[i];
                        let scale = this.getScale(joint.bonePath, this._skeletonTime, clipState.clip);
                        Vector3.HELP_0.lerp(this._boneScale, scale, clipState.weight / totalWeight);
                        this._boneScale.copy(Vector3.HELP_0);
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

    /** Group the morph renderers by morph-target key. */
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

    // ------------------------------------------------------------------
    //  Layer / Mask API (P1)
    // ------------------------------------------------------------------

    /** Get a stacked animation layer by name, or null if absent. */
    public getLayer(name: string): AnimationLayer | null {
        return this._layers.find(l => l.name === name) || null;
    }
    /** All stacked layers (excluding the implicit base layer). */
    public get layers(): ReadonlyArray<AnimationLayer> { return this._layers; }

    /** Add a stacked animation layer (ignored if a layer with that name exists). */
    public addLayer(layer: AnimationLayer): AnimationLayer {
        if (this._layers.find(l => l.name === layer.name)) {
            console.warn(`AnimatorComponent: layer '${layer.name}' already exists`);
            return this.getLayer(layer.name)!;
        }
        this._layers.push(layer);
        return layer;
    }

    /** Remove a stacked animation layer by name. */
    public removeLayer(name: string): void {
        const idx = this._layers.findIndex(l => l.name === name);
        if (idx >= 0) this._layers.splice(idx, 1);
    }

    /** Set the blend weight of a named layer. */
    public setLayerWeight(name: string, weight: number): void {
        const l = this.getLayer(name);
        if (l) l.weight = weight;
    }

    /**
     * Set (and start) the clip playing on a named layer.
     * @param name layer name
     * @param clipName clip to play on the layer
     * @param time start time in seconds
     * @param timeScale layer-local time scale
     */
    public setLayerClip(name: string, clipName: string, time: number = 0, timeScale: number = 1.0): void {
        const l = this.getLayer(name);
        if (!l) return;
        l.clipName = clipName;
        l.time = time;
        l.timeScale = timeScale;
        l.playing = true;
    }

    private _layerRot: Quaternion = new Quaternion();
    private _layerDeltaQuat: Quaternion = new Quaternion();
    private _layerInvBaseQuat: Quaternion = new Quaternion();
    private _layerSlerpedQuat: Quaternion = new Quaternion();
    private _layerIdentityQuat: Quaternion = new Quaternion(0, 0, 0, 1);
    private _layerOutQuat: Quaternion = new Quaternion();

    /**
     * After the base pose has been written to the joint Object3Ds, apply each
     * stacked layer in turn. Override layers lerp toward the layer pose;
     * Additive layers use `makeClipAdditive` math:
     *   delta = sample(layer.time) - sample(firstKeyTime)
     *   result = base + delta * weight
     *
     * For "static pose" clips (Mixamo's sneak_pose / sad_pose: only 2 keys,
     * span < 0.5s), the first key is the T-pose and the last key is the
     * pose. We pin `layer.time` to the LAST keyframe so the additive offset
     * is the full target pose, stable, with no high-frequency oscillation
     * from layer.time wrapping between the two keyframes.
     */
    private updateLayers(delta: number) {
        for (const layer of this._layers) {
            if (layer.weight <= 0) continue;
            if (!layer.clipName) continue;
            const clip = this._clipsMap?.get(layer.clipName);
            if (!clip) continue;

            // First-time resolve: scan the clip's curves for the actual
            // keyframe time range so we know whether to treat it as a static
            // pose or an animated overlay.
            if (!layer._resolved){
                 this._resolveLayer(layer, clip);
            }

            if (layer._isStaticPose) {
                // Pin to the last keyframe so the sample is stable (= target
                // pose). Don't advance time; don't wrap.
                layer.time = layer._lastKeyTime;
            } else if (layer.playing) {
                layer.time += delta * layer.timeScale * this.timeScale;
                const span = layer._lastKeyTime - layer._firstKeyTime;
                if (clip.loopTime || (span > 0 && layer.time > layer._lastKeyTime)) {
                    if (span > 0) {
                        layer.time = layer._firstKeyTime + ((layer.time - layer._firstKeyTime) % span);
                    } 
                }
            }

            const joints = this._avatar.boneData;
            for (let i = 0; i < joints.length; i++) {
                const joint = joints[i];
                if (layer.mask && !layer.mask.has(joint.boneName)) continue;

                const obj = this.skeltonPoseObject3D[joint.boneName];
                if (!obj) continue;

                const hasPos = clip.useSkeletonPos && clip.positionCurves.has(joint.bonePath);
                const hasRot = clip.rotationCurves.has(joint.bonePath);
                const hasScale = clip.useSkeletonScale && clip.scaleCurves.has(joint.bonePath);
                if (!hasPos && !hasRot && !hasScale) continue;

                // For additive blending, `makeClipAdditive` bakes
                // a per-clip delta = (clip - clip.first) at clip-load time.
                // We do the same math at sample time so sneak_pose's first
                // keyframe (a T-pose-ish stand) acts as the zero reference,
                // and the second keyframe (the actual sneak pose) is the
                // full delta. With layer.time pinned to lastKey for static
                // poses, the delta is constant and the layer adds a stable
                // pose offset on top of the base animation.
                const isAdditive = layer.blendMode === LayerBlendMode.Additive;
                const refTime = isAdditive ? layer._firstKeyTime : 0;

                if (layer.blendMode === LayerBlendMode.Override) {
                    if (hasPos) {
                        const p = clip.positionCurves.get(joint.bonePath).getValue(layer.time) as Vector3;
                        Vector3.HELP_0.lerp(obj.localPosition, p, layer.weight);
                        obj.localPosition = Vector3.HELP_0;
                    }
                    if (hasRot) {
                        const v4 = clip.rotationCurves.get(joint.bonePath).getValue(layer.time) as Vector4;
                        this._layerRot.set(v4.x, v4.y, v4.z, v4.w);
                        Quaternion.HELP_2.slerp(obj.localQuaternion, this._layerRot, layer.weight);
                        obj.localQuaternion = Quaternion.HELP_2;
                    }
                    if (hasScale) {
                        const s = clip.scaleCurves.get(joint.bonePath).getValue(layer.time) as Vector3;
                        Vector3.HELP_0.lerp(obj.localScale, s, layer.weight);
                        obj.localScale = Vector3.HELP_0;
                    }
                } else {
                    // Additive: delta from clip's first frame.
                    if (hasPos) {
                        const curve = clip.positionCurves.get(joint.bonePath);
                        const p = curve.getValue(layer.time) as Vector3;
                        // Sample the reference frame, then re-sample current:
                        // getValue returns a SHARED cache vector, so we must
                        // copy out p's components before re-sampling.
                        const px = p.x, py = p.y, pz = p.z;
                        const r = curve.getValue(refTime) as Vector3;
                        const dx = px - r.x, dy = py - r.y, dz = pz - r.z;
                        Vector3.HELP_0.set(
                            obj.localPosition.x + dx * layer.weight,
                            obj.localPosition.y + dy * layer.weight,
                            obj.localPosition.z + dz * layer.weight,
                        );
                        obj.localPosition = Vector3.HELP_0;
                    }
                    if (hasRot) {
                        const curve = clip.rotationCurves.get(joint.bonePath);
                        const v4 = curve.getValue(layer.time) as Vector4;
                        // Capture layer-time values immediately — `getValue`
                        // returns a SHARED `_cacheValue` instance, the next
                        // call (refTime below) would otherwise overwrite v4.
                        this._layerRot.set(v4.x, v4.y, v4.z, v4.w);
                        // Reference rotation = clip at first keyframe.
                        const r4 = curve.getValue(refTime) as Vector4;
                        // delta represents "rotation from clip start to
                        // current time" in the BONE-LOCAL frame, so we
                        // build it as inv(refRot) * layerRot — the same
                        // ordering `makeClipAdditive` bakes into its delta keys.
                        this._layerInvBaseQuat.set(-r4.x, -r4.y, -r4.z, r4.w);
                        this._layerDeltaQuat.multiply(this._layerInvBaseQuat, this._layerRot);
                        // identity → delta scaled by weight
                        this._layerSlerpedQuat.slerp(this._layerIdentityQuat, this._layerDeltaQuat, layer.weight);
                        // result = base * scaled-delta — right-multiply so
                        // delta is applied in the bone's local frame
                        // `work = base * delta; dst = slerp(base, work, t)`
                        // ≡ `dst = base * slerp(identity, delta, t)`.
                        // The previous left-multiply (`delta * base`)
                        // applied delta in the PARENT frame, flipping the
                        // perceived rotation direction (e.g. Xbot's
                        // sneak_pose tilted backward instead of forward).
                        this._layerOutQuat.multiply(obj.localQuaternion, this._layerSlerpedQuat);
                        obj.localQuaternion = this._layerOutQuat;
                    }
                }
            }
        }
    }

    /**
     * Look at the clip's curves and decide whether it is a "static pose"
     * (sneak_pose, sad_pose: typically 2 keyframes, < 0.5s span — a baked
     * T-pose → target-pose pair) or a true animated overlay (agree,
     * headShake: tens of keyframes spanning multiple seconds).
     *
     * For static poses we pin layer.time to the last keyframe so the
     * additive sample is stable; for animated overlays we let layer.time
     * advance and wrap normally.
     */
    private _resolveLayer(layer: AnimationLayer, clip: PropertyAnimationClip): void {
        let firstKey = Infinity, lastKey = -Infinity, maxKeys = 0;
        const inspect = (c: any) => {
            if (!c || !c.m_curves || c.m_curves.length === 0) return;
            const ax = c.m_curves[0].curve;
            if (!ax || ax.length === 0) return;
            maxKeys = Math.max(maxKeys, ax.length);
            firstKey = Math.min(firstKey, ax[0].time);
            lastKey = Math.max(lastKey, ax[ax.length - 1].time);
        };
        clip.positionCurves.forEach(inspect);
        clip.rotationCurves.forEach(inspect);
        clip.scaleCurves.forEach(inspect);
        if (firstKey === Infinity) firstKey = 0;
        if (lastKey === -Infinity) lastKey = 0;
        layer._firstKeyTime = firstKey;
        layer._lastKeyTime = lastKey;
        // Heuristic: 2 keyframes AND short span → it's a Mixamo-style pose
        // baked from T-pose to target. Anything longer is an animated clip
        // and should advance time + wrap normally.
        layer._isStaticPose = maxKeys <= 2 && (lastKey - firstKey) < 0.5;
        layer._resolved = true;
    }

    // ------------------------------------------------------------------
    //  StateMachine plug-in (P1)
    // ------------------------------------------------------------------

    /** Attach (or clear) a state machine evaluated each frame before sampling. */
    public setStateMachine(fsm: { evaluate(animator: AnimatorComponent, dt: number): void } | null) {
        this._stateMachine = fsm;
    }
    /** The currently attached state machine, or null. */
    public getStateMachine(): { evaluate(animator: AnimatorComponent, dt: number): void } | null {
        return this._stateMachine;
    }

    // ------------------------------------------------------------------
    //  IK API (P1)
    // ------------------------------------------------------------------

    /** Register an IK solver, run after layer mixing each frame. */
    public addIK(solver: { solve(animator: AnimatorComponent): void }) {
        this._ikSolvers.push(solver);
    }
    /** Unregister a previously added IK solver. */
    public removeIK(solver: { solve(animator: AnimatorComponent): void }) {
        const i = this._ikSolvers.indexOf(solver);
        if (i >= 0) this._ikSolvers.splice(i, 1);
    }

    /** Live joint Object3D by bone name. Used by IK solvers + retargeting. */
    public getJointObject(boneName: string): Object3D | null {
        return this.skeltonPoseObject3D ? (this.skeltonPoseObject3D[boneName] || null) : null;
    }
    /** Rest-pose (T-pose) joint Object3D by bone path. */
    public getRestJointObject(bonePath: string): Object3D | null {
        return this.skeltonTPoseObject3D ? (this.skeltonTPoseObject3D[bonePath] || null) : null;
    }
    /** The current avatar (skeleton) data, or null. */
    public getAvatar(): PrefabAvatarData | null { return this._avatar || null; }
}

/**
 * Per-clip playback state tracked by {@link AnimatorComponent}: holds the
 * clip plus its current blend weight in the mix.
 * @group Animation
 */
export class PropertyAnimationClipState {
    /** The animation clip this state wraps. */
    public clip: PropertyAnimationClip;
    /** Current blend weight of the clip in the mix. */
    public weight: number = 0.0;

    /** Total duration of the clip in seconds. */
    public get totalTime(): number {
        return this.clip.stopTime - this.clip.startTime;
    }

    constructor(clip: PropertyAnimationClip) {
        this.clip = clip;
    }
}

/**
 * @internal
 * Tracks an in-progress cross-fade between two clips, ramping their
 * weights over the fade duration.
 */
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
