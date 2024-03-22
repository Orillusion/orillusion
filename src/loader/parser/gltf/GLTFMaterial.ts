import { Texture, Vector4 } from "../../..";

export class GLTFMaterial {
    name: string
    defines: string[];
    doubleSided: boolean;
    baseColorFactor: [1, 1, 1, 1];
    emissiveFactor: number;
    metallicFactor: number;
    roughnessFactor: number;
    alphaCutoff: number;
    enableBlend: boolean;
    baseColorTexture: Texture;
    metallicRoughnessTexture: Texture;
    normalTexture: Texture;
    occlusionTexture: Texture;
    emissiveTexture: Texture;
    extensions: any;
    baseMapOffsetSize: Vector4;
    normalMapOffsetSize: Vector4;
    emissiveMapOffsetSize: Vector4;
    roughnessMapOffsetSize: Vector4;
    metallicMapOffsetSize: Vector4;
    aoMapOffsetSize: Vector4;
}