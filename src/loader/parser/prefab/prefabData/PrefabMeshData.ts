import { Matrix4 } from "../../../..";

export class PrefabMeshData {
    public name: string;
    public meshName: string;
    public meshID: string;
    public vertexCount: number;
    public vertexStrip: number;
    public vertexBuffer: Float32Array;
    public indices: Uint16Array | Uint32Array;

    public attributes: { attribute: string, dim: number, pos: number }[];
    public blendShapeCount: number;
    public blendShapeNames: string[];
    public blendShapeWeights: string[];


    public bones: string[];
    public bindPose: Matrix4[];
}