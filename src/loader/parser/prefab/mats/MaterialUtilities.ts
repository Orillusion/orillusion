import { Color, Vector2, Vector3, Vector4 } from "../../../..";
import { Material } from "../../../../materials/Material";
import { GetShader } from "../../../../util/SerializeDecoration";
import { KV } from "../prefabData/KVData";
import { PrefabTextureData } from "../prefabData/PrefabTextureData";
import { ValueEnumType } from "../prefabData/ValueType";

export class MaterialUtilities {

    public static GetMaterial(shaderName: string) {
        let name = shaderName;
        // let name = "UnLitShader";
        let list = name.split("/");
        name = list[list.length - 1];

        list = name.split(".");
        name = list[list.length - 1];

        let shader = GetShader(name);
        if (shader) {
            let material = new Material();
            material.shader = new shader();
            return material;
        } else {
            throw new Error("not found shader, shader name is " + name);
        }
    }

    public static applyMaterialTexture(mat: Material, textures: PrefabTextureData[]) {
        for (let ii = 0; ii < textures.length; ii++) {
            const texInfo = textures[ii];
            if (texInfo.property in mat) {
                mat[texInfo.property] = texInfo.texture;
            } else if (texInfo.property in mat.shader) {
                mat.shader[texInfo.property] = texInfo.texture;
            } else {
                mat.setTexture(texInfo.property, texInfo.texture);
            }
        }
    }

    public static applyMaterialProperties(mat: Material, properties: KV[]) {
        for (let ii = 0; ii < properties.length; ii++) {
            const propertyInfo = properties[ii];
            const key = propertyInfo.key;
            // let transformInfo = mat.shader[propertyInfo.key];
            // if (transformInfo != null) {
            switch (propertyInfo.type) {
                case ValueEnumType.color:
                case ValueEnumType.color32:
                    {
                        let value = propertyInfo.getValue<Color>();
                        if (key in mat) {
                            mat[key] = value;
                        } else if (key in mat.shader) {
                            mat.shader[key] = value;
                        } else {
                            mat.setUniformColor(key, value);
                        }
                    }
                    break;
                case ValueEnumType.single:
                case ValueEnumType.float:
                case ValueEnumType.int:
                case ValueEnumType.int16:
                case ValueEnumType.int32:
                case ValueEnumType.uint:
                case ValueEnumType.uint32:
                case ValueEnumType.uint64:
                    {
                        let value = propertyInfo.getValue<number>();
                        if (key in mat) {
                            mat[key] = value;
                        } else if (key in mat.shader) {
                            mat.shader[key] = value;
                        } else {
                            mat.setUniformFloat(key, value);
                        }
                    }
                    break;
                case ValueEnumType.singleArray:
                    {
                        let value = propertyInfo.getValue<number[]>()[0];
                        if (key in mat) {
                            mat[key] = value;
                        } else if (key in mat.shader) {
                            mat.shader[key] = value;
                        } else {
                            mat.setUniformFloat(key, value);
                        }
                    }
                    break;
                case ValueEnumType.vector2:
                case ValueEnumType.vector2Int:
                    {
                        let value = propertyInfo.getValue<Vector2>();
                        if (key in mat) {
                            mat[key] = value;
                        } else if (key in mat.shader) {
                            mat.shader[key] = value;
                        } else {
                            mat.setUniformVector2(key, value);
                        }
                    }
                    break;
                case ValueEnumType.vector3:
                    {
                        let value = propertyInfo.getValue<Vector3>();
                        if (key in mat) {
                            mat[key] = value;
                        } else if (key in mat.shader) {
                            mat.shader[key] = value;
                        } else {
                            mat.setUniformVector3(key, value);
                        }
                    }
                    break;
                case ValueEnumType.vector4:
                    {
                        let value = propertyInfo.getValue<Vector4>();
                        if (key in mat) {
                            mat[key] = value;
                        } else if (key in mat.shader) {
                            mat.shader[key] = value;
                        } else {
                            mat.setUniformVector4(key, value);
                        }
                    }
                    break;
                default:
                    break;
                // }
            }
        }
    }

}