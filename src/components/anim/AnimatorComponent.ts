import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { BoxGeometry, DEGREES_TO_RADIANS, Engine3D, LitMaterial, Matrix4, MeshFilter, MeshRenderer, Object3D, PrefabAvatarData, Quaternion, Skeleton, SkeletonPose, StorageGPUBuffer, Time, Vector2, Vector3, Vector4, View3D, makeMatrix44 } from "../..";
import { PropertyAnimationClip } from "../../math/AnimationCurveClip";
import { RegisterComponent } from "../../util/SerializeDecoration";
import { ComponentBase } from "../ComponentBase";
import { GUIUtil } from "@samples/utils/GUIUtil";

@RegisterComponent
export class AnimatorComponent extends ComponentBase {
    private _currentClip: PropertyAnimationClip;
    public jointMatrixIndexTableBuffer: StorageGPUBuffer;
    public inverseBindMatrices: Float32Array[];
    private _avatar: PrefabAvatarData;
    public init(param?: any): void {

    }

    public set avatar(name: string) {
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

    private debugObj: { [name: string]: Object3D } = {};
    private buildSkeletonPose(): number[] {
        let list = [];
        let matrixList: Matrix4[] = [];
        let totalTime = 18.06667;
        let totalFrame = 543;
        let frame = totalTime / totalFrame;
        let mesh = new BoxGeometry(0.1, 0.1, 0.1);
        let mat = new LitMaterial();

        GUIHelp.addFolder("anim");
        GUIHelp.add(this, "_auto")
        GUIHelp.add({ frame: 0 }, "frame", 0.0, totalFrame, 1).onChange((v) => {
            this._time = v * frame;
            // let joint = this._skeleton.joints[0];
            // let obj = this.debugObj[joint.name];
            // console.log(joint.name, obj.rotationX, obj.rotationY, obj.rotationZ);
        });


        for (const joint of this._avatar.boneData) {
            let obj = new Object3D();
            // let mr = obj.addComponent(MeshRenderer);
            // mr.geometry = mesh;
            // mr.material = mat;
            this.debugObj[joint.boneName] = obj;

            Matrix4.getEuler(Vector3.HELP_6, joint.q, true, 'ZYX');

            obj.localPosition = joint.t.clone();
            obj.localRotation = Vector3.HELP_6.clone();
            obj.localScale = Vector3.ONE; joint.s.clone();

            if (joint.parentBoneName && joint.parentBoneName != "") {
                this.debugObj[joint.parentBoneName].addChild(obj);
            } else {
                this.object3D.addChild(obj);
            }

            list.push(obj.transform.worldMatrix.index);


            // GUIUtil.renderVector3(this.debugObj[joint.boneName], false, joint.boneName);
            let local = new Matrix4();
            local.copyFrom(obj.transform.worldMatrix);
            // makeMatrix44(obj.localRotation, obj.localPosition, obj.localScale, local);
            local.invert();
            this.inverseBindMatrices.push(local.rawData);
        }




        GUIHelp.endFolder();

        return list;
    }

    public set clips(clips: PropertyAnimationClip[]) {
        console.log(clips);

        let clip = clips[0];
        this._currentClip = clip;

        let hips = clip.positionCurves.get("Hips");

        let value = hips.getValue(0.2);
        console.log("Hips -> " + value);
    }

    private _time: number = 0;
    private _auto: boolean = false;
    private updateTime() {
        if (this._auto)
            this._time += Time.delta * 0.001;
        if (this._time > 18) {
            this._time = 0;
        }
    }

    public onUpdate(view?: View3D) {
        this.updateTime();
        if (this._currentClip) {
            let joints = this._avatar.boneData;
            let i = 0;
            let len = joints.length;
            for (i = 0; i < len; i++) {
                const joint = joints[i];
                let pos = this.getPosition(joint.bonePath, this._time);
                let rot = this.getRotation(joint.bonePath, this._time);
                let scale = this.getScale(joint.bonePath, this._time);

                let obj = this.debugObj[joint.boneName];
                obj.transform.localPosition = pos;
                obj.transform.localRotation = rot;
                obj.transform.localScale = scale;
            }
        }
    }

    private getPosition(boneName: string, time: number) {
        let t = this._currentClip.positionCurves.get(boneName).getValue(time) as Vector3;
        return t;
    }

    private getRotation(boneName: string, time: number) {
        let v4 = this._currentClip.rotationCurves.get(boneName).getValue(time) as Vector4;
        Quaternion.HELP_2.set(v4.x, v4.y, v4.z, v4.w);
        Matrix4.getEuler(Vector3.HELP_6, Quaternion.HELP_2, true, 'ZYX');
        return Vector3.HELP_6;
    }

    private getScale(boneName: string, time: number) {
        let x = this._currentClip.scaleCurves.get(boneName).getValue(time) as Vector3;
        return x;
    }
}