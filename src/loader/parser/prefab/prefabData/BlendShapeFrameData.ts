import { Vector3 } from "../../../../math/Vector3";
import { BytesArray } from "../../../../util/BytesArray";

export class BlendShapeFrameData {

    public weight: number;

    // public deltaVertices: Vector3[];
    // public deltaNormals: Vector3[];
    // public deltaTangents: Vector3[];

    public deltaVertices: Float32Array;
    public deltaNormals: Float32Array;
    public deltaTangents: Float32Array;

    formBytes(byteArray: BytesArray) {
        let bytes = byteArray.readBytesArray();
        this.weight = bytes.readFloat32();
        let len = 0;
        len = bytes.readInt32();
        this.deltaVertices = bytes.readFloat32Array(len * 3);
        len = bytes.readInt32();
        this.deltaNormals = bytes.readFloat32Array(len * 3);
        len = bytes.readInt32();
        this.deltaTangents = bytes.readFloat32Array(len * 3);
    }
}
