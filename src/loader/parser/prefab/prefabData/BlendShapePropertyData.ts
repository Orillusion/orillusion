import { BytesArray } from "../../../..";
import { BlendShapeFrameData } from "./BlendShapeFrameData";

export class BlendShapePropertyData {
    public shapeName: string;
    public shapeIndex: number;
    public frameCount: number;
    // public blendShapeFrameDatas: BlendShapeFrameData[];
    public blendPositionList = new Float32Array();
    public blendNormalList = new Float32Array();
    public formBytes(byteArray: BytesArray) {
        let bytes = byteArray.readBytesArray();

        this.shapeName = bytes.readUTF();
        this.shapeIndex = bytes.readInt32();
        this.frameCount = bytes.readInt32();

        let len = bytes.readInt32();
        this.blendPositionList = bytes.readFloat32Array(len * 3);

        let len2 = bytes.readInt32();
        this.blendNormalList = bytes.readFloat32Array(len2 * 3);
    }
}