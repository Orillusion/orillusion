import { Quaternion } from "../../../../math/Quaternion";
import { Vector3 } from "../../../../math/Vector3";
import { BytesArray } from "../../../../util/BytesArray";

export class PrefabBoneData {
    public boneName: string;
    public bonePath: string;
    public parentBoneName: string;
    public boneID: number;
    public parentBoneID: number;
    public instanceID: string;
    public parentInstanceID: string;
    public t: Vector3;
    public q: Quaternion;
    public s: Vector3;

    public formBytes(bytes: BytesArray) {
        this.boneName = bytes.readUTF();
        this.bonePath = bytes.readUTF();
        this.parentBoneName = bytes.readUTF();

        this.boneID = bytes.readInt32();
        this.parentBoneID = bytes.readInt32();

        this.instanceID = bytes.readUTF();
        this.parentInstanceID = bytes.readUTF();

        this.t = bytes.readVector3();
        this.q = bytes.readQuaternion();
        this.s = bytes.readVector3();
    }
}