import { BitmapTexture2D, BlendMode, Engine3D } from "../../..";
import { LitMaterial } from "../../../materials/LitMaterial";
import { Material } from "../../../materials/Material";
import { Color } from "../../../math/Color";
import { BytesArray } from "../../../util/BytesArray";
import { ParserBase } from "../ParserBase";
import { ParserFormat } from "../ParserFormat";
import { PrefabParser } from "./PrefabParser";
import { MaterialUtilities } from "./mats/MaterialUtilities";
import { KV } from "./prefabData/KVData";
import { PrefabTextureData } from "./prefabData/PrefabTextureData";


export class PrefabMaterialParser extends ParserBase {
    static format: ParserFormat = ParserFormat.TEXT;

    public static parserMaterial(bytesStream: BytesArray, prefabParser: PrefabParser) {
        let matCount = bytesStream.readInt32();
        for (let i = 0; i < matCount; i++) {
            let matBytes = bytesStream.readBytesArray();

            let matName = matBytes.readUTF();
            let id = matBytes.readUTF();
            let renderType = matBytes.readUTF();
            let defines = matBytes.readStringArray();
            let uvTransform_1 = matBytes.readVector4();
            let uvTransform_2 = matBytes.readVector4();
            let shaderName = matBytes.readUTF();
            let properties: KV[] = [];
            let textures: PrefabTextureData[] = [];
            let propertyCount = matBytes.readInt32();
            for (let j = 0; j < propertyCount; j++) {
                let kv: KV = new KV();
                kv.formBytes(matBytes);
                properties.push(kv);
            }

            let textureCount = matBytes.readInt32();
            for (let j = 0; j < textureCount; j++) {
                let texBytes = matBytes.readBytesArray();
                let textureData = new PrefabTextureData();
                textureData.property = texBytes.readUTF();
                textureData.name = texBytes.readUTF();
                textureData.texture = Engine3D.res.getTexture(textureData.name) as BitmapTexture2D;
                textureData.texelSize = texBytes.readVector2();
                textureData.wrapModeU = texBytes.readUnit32();
                textureData.wrapModeV = texBytes.readUnit32();
                textureData.wrapModeW = texBytes.readUnit32();
                textureData.wrapMode = texBytes.readUnit32();
                textureData.anisoLevel = texBytes.readUnit32();
                textureData.dimension = texBytes.readUnit32();
                textureData.filterMode = texBytes.readUnit32();
                textures.push(textureData);
            }

            let mat = MaterialUtilities.GetMaterial(shaderName);
            mat.name = matName;
            // mat.uvTransform_1 = uvTransform_1;
            // mat.uvTransform_2 = uvTransform_2;
            // mat.roughness = 1;
            // mat.metallic = 1;
            // mat.alphaCutoff = 0.5;

            // mat.blendMode = renderType == "Opaque" ? BlendMode.NONE : BlendMode.ALPHA;

            for (let i = 0; i < defines.length; i++) {
                const define = defines[i];
                mat.shader.setDefine(define, true);
            }

            MaterialUtilities.applyMaterialTexture(mat, textures);
            MaterialUtilities.applyMaterialProperties(mat, properties);

            // for (let k = 0; k < properties.length; k++) {
            //     const kv = properties[k];

            //     // mat.setu(texInfo.property, texInfo.texture);
            //     // if (kv.key in Material_transformer.prototype) {
            //     //     Material_transformer.prototype[kv.key](kv, mat);
            //     // }
            // }

            Engine3D.res.addMat(id, mat);
        }
    }


    /**
     * Verify parsing validity
     * @param ret
     * @returns
     */
    public verification(): boolean {
        if (this.data) {
            return true;
        }
        throw new Error('verify failed.');
    }
}


class Texture_transformer {
    public _MainTex(tex: PrefabTextureData, material: Material) {
        material.shader.setDefine("USE_SRGB_ALBEDO", true);
        return {
            property: "baseMap",
            value: tex.texture
        };
    }

    public _MetallicGlossMap(tex: PrefabTextureData) {
        return {
            property: "maskMap",
            value: tex.texture
        };
    }

    public _BumpMap(tex: PrefabTextureData) {
        return {
            property: "normalMap",
            value: tex.texture
        };
    }

    public _OcclusionMap(tex: PrefabTextureData, mat: LitMaterial) {
        mat.shader.setDefine("USE_AOTEX", true);
        mat.ao = 1.0;
        return {
            property: "aoMap",
            value: tex.texture
        };
    }
}

class Material_transformer {
    _Color(kv: KV, material: LitMaterial) {
        material.baseColor = kv.getValue<Color>();
    }

    // _Glossiness(kv: KV, material: LitMaterial) {
    //     let str = kv.value.replaceAll("[", "");
    //     str = str.replaceAll("]", "");
    //     let alpha = 1.0 - parseFloat(str);
    //     let roughness = alpha * alpha * alpha * alpha;
    //     // material.roughness = roughness;
    // }
    //return 1 + Math.log2(maxSize) | 0;

    _GlossMapScale(kv: KV, material: LitMaterial) {
        material.roughness = kv.getValue<number>()[0];
    }

    _Metallic(kv: KV, material: LitMaterial) {
        if (!material.maskMap) {
            material.metallic = kv.getValue<number>()[0];
        } else {
            material.metallic = 1.0;
        }
    }

    _SmoothnessTextureChannel(kv: KV, material: LitMaterial) {
        let channel = kv.getValue<number>();
        let type = channel == 0 ? `USE_ROUGHNESS_A` : "USE_ALBEDO_A";
        let type2 = `USE_METALLIC_R`;
        material.shader.setDefine(type, true);
        material.shader.setDefine(type2, true);
    }
}

let TextureChannel = ["A", "R", "G", "B"]

