import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { BoxGeometry, DEGREES_TO_RADIANS, Engine3D, LitMaterial, Matrix4, MeshFilter, MeshRenderer, Object3D, PrefabAvatarData, Quaternion, RenderNode, RendererBase, Skeleton, SkeletonPose, SkinnedMeshRenderer2, StorageGPUBuffer, Time, Vector2, Vector3, Vector4, View3D, makeMatrix44 } from "../..";
import { PropertyAnimationClip } from "../../math/AnimationCurveClip";
import { RegisterComponent } from "../../util/SerializeDecoration";
import { ComponentBase } from "../ComponentBase";

@RegisterComponent(AnimatorComponent, 'AnimatorComponent')
export class AnimatorComponent extends ComponentBase {
    public jointMatrixIndexTableBuffer: StorageGPUBuffer;
    public playBlendShapeLoop: boolean = false;
    protected inverseBindMatrices: Float32Array[];
    protected _avatar: PrefabAvatarData;
    protected _rendererList: SkinnedMeshRenderer2[];
    protected propertyCache: Map<RenderNode, { [name: string]: any }>

    protected _clips: PropertyAnimationClip[];
    protected _clipsMap: Map<string, PropertyAnimationClip>;
    protected _currentSkeletonClip: PropertyAnimationClip;
    protected _currentBlendAnimClip: PropertyAnimationClip;

    private _skeletonTime: number = 0;
    private _blendShapeTime: number = 0;
    private _skeletonSpeed: number = 1;
    private _blendShapeSpeed: number = 1;
    private _skeletonStart: boolean = true;
    private _blendShapeStart: boolean = true;
    root: Object3D;
    private _avatarName: string;

    public init(param?: any): void {
        this.propertyCache = new Map<RenderNode, { [name: string]: any }>();
        this._clipsMap = new Map<string, PropertyAnimationClip>();
        this._clips = [];
    }

    public start(): void {
        this._rendererList = this.object3D.getComponentsInChild(SkinnedMeshRenderer2);
    }

    private debug() {
    }

    playAnim(anim: string, time: number = 0, speed: number = 1) {
        if (this._clipsMap.has(anim)) {
            this._currentSkeletonClip = this._clipsMap.get(anim);
            this._skeletonTime = time;
            this._skeletonSpeed = speed;
            this._skeletonStart = true;
        } else {
            console.warn(`not has anim ${anim}`);
        }
    }

    playBlendShape(shapeName: string, time: number = 0, speed: number = 1) {
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
        // this.playAnim(clips[0].clipName);
    }

    public get clips(): PropertyAnimationClip[] {
        return this._clips;
    }

    public cloneTo(obj: Object3D): void {
        let animatorComponent = obj.addComponent(AnimatorComponent);
        animatorComponent.avatar = this._avatarName;
        animatorComponent.clips = this._clips;
    }

    private updateTime() {
        if (this._skeletonStart) {
            this._skeletonTime += Time.delta * 0.001 * this._skeletonSpeed;
            if (this._currentSkeletonClip && this._currentSkeletonClip.loopTime) {
                this._skeletonTime = this._skeletonTime % this._currentSkeletonClip.stopTime;
            }
        }

        if (this._blendShapeStart) {
            this._blendShapeTime += Time.delta * 0.001 * this._blendShapeSpeed;
            if (this._currentBlendAnimClip) {
                if (this._currentBlendAnimClip.loopTime && this.playBlendShapeLoop) {
                    this._blendShapeTime = this._blendShapeTime % this._currentBlendAnimClip.stopTime;
                } else {
                    this._blendShapeTime = Math.min(this._blendShapeTime, this._currentBlendAnimClip.stopTime) - 0.0001;
                }
            }
        }
    }

    public onUpdate(view?: View3D) {
        let worldMatrix = this.transform.worldMatrix;
        // this.root.x = -worldMatrix.position.x ;
        // this.root.y = -worldMatrix.position.y ;
        // this.root.z = -worldMatrix.position.z ;

        this.updateTime();
        this.updateSkeletonAnim();
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

                if (this._currentSkeletonClip.useSkeletonPos) {
                    let pos = this.getPosition(joint.bonePath, this._skeletonTime);
                    obj.transform.localPosition = pos;
                }

                let rot = this.getRotation(joint.bonePath, this._skeletonTime);
                obj.transform.localRotation = rot;

                if (this._currentSkeletonClip.useSkeletonScale) {
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
                    for (const renderer of this._rendererList) {
                        if (renderer.blendShape) {
                            let property: any = this.propertyCache.get(renderer);
                            if (property && key in property) {
                                property[key](value);
                            } else {
                                property = renderer;
                                for (const att of attributes) {
                                    if (!property[att])
                                        break;
                                    property = property[att];
                                }
                                if (!property || property == renderer) break;

                                if (!this.propertyCache.get(renderer))
                                    this.propertyCache.set(renderer, {})
                                this.propertyCache.get(renderer)[key] = property;
                                property(value);
                            }
                        }
                    }
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
                        if (!property[att])
                            break;
                        property = property[att];
                    }
                    if (!property || property == renderer) break;

                    if (!this.propertyCache.get(renderer))
                        this.propertyCache.set(renderer, {})
                    this.propertyCache.get(renderer)[key] = property;
                    property(value);
                }
            }
        }
    }

    private getPosition(boneName: string, time: number) {
        if (this._currentSkeletonClip.positionCurves.has(boneName)) {
            let t = this._currentSkeletonClip.positionCurves.get(boneName).getValue(time) as Vector3;
            return t;
        }
        return this.skeltonTPoseObject3D[boneName].localPosition;
    }

    private getRotation(boneName: string, time: number) {
        if (this._currentSkeletonClip.rotationCurves.has(boneName)) {
            let v4 = this._currentSkeletonClip.rotationCurves.get(boneName).getValue(time) as Vector4;
            Quaternion.HELP_2.set(v4.x, v4.y, v4.z, v4.w);
            Matrix4.getEuler(Vector3.HELP_6, Quaternion.HELP_2, true, 'ZYX');
            return Vector3.HELP_6;
        }
        return this.skeltonTPoseObject3D[boneName].localRotation;
    }

    private getScale(boneName: string, time: number) {
        if (this._currentSkeletonClip.scaleCurves.has(boneName)) {
            let x = this._currentSkeletonClip.scaleCurves.get(boneName).getValue(time) as Vector3;
            return x;
        }
        return this.skeltonTPoseObject3D[boneName].localScale;
    }

    private getFloat(propertyName: string, time: number) {
        let x = this._currentSkeletonClip.floatCurves.get(propertyName).getValue(time) as number;
        return x;
    }
}