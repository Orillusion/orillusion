import { Matrix4 } from "../../../..";
import { BlendShapeData } from "./BlendShapeData";

export class PrefabMeshData {
    public name: string;
    public meshName: string;
    public meshID: string;
    public vertexCount: number;
    public vertexStrip: number;
    public vertexBuffer: Float32Array;
    public indices: Uint16Array | Uint32Array;

    public attributes: { attribute: string, dim: number, pos: number }[];

    public bones: string[];
    public bindPose: Matrix4[];
    public blendShapeData: BlendShapeData;
}