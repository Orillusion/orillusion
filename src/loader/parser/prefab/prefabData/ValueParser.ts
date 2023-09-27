import { GeometryBase, Material, PropertyAnimationClip, Texture } from "../../../..";
import { Engine3D } from "../../../../Engine3D";
import { Joint } from "../../../../components/anim/skeletonAnim/Joint";
import { Skeleton } from "../../../../components/anim/skeletonAnim/Skeleton";
import { Color } from "../../../../math/Color";
import { Quaternion } from "../../../../math/Quaternion";
import { Vector2 } from "../../../../math/Vector2";
import { Vector3 } from "../../../../math/Vector3";
import { Vector4 } from "../../../../math/Vector4";
import { BytesArray } from "../../../../util/BytesArray";
import { ValueEnumType } from "./ValueType";

export type CurveValueType = string | number | Vector2 | Vector3 | Vector4 | Quaternion | Color | boolean | Texture | Material | string[] | number[] | Float32Array | GeometryBase | Skeleton | PropertyAnimationClip[];

export class ValueParser {
    public static parser(bytes: BytesArray): { t: ValueEnumType, v: CurveValueType } {
        let type = bytes.readInt32();
        switch (type) {
            case ValueEnumType.single:
                return { t: ValueEnumType.single, v: bytes.readFloat32() };
            case ValueEnumType.boolean:
                return { t: ValueEnumType.boolean, v: bytes.readBoolean() };
            case ValueEnumType.int:
                return { t: ValueEnumType.int, v: bytes.readInt32() };
            case ValueEnumType.int16:
                return { t: ValueEnumType.int16, v: bytes.readInt16() };
            case ValueEnumType.int32:
                return { t: ValueEnumType.int32, v: bytes.readInt32() };
            case ValueEnumType.float:
                return { t: ValueEnumType.float, v: bytes.readFloat32() };
            case ValueEnumType.long:
                return { t: ValueEnumType.long, v: bytes.readFloat64() };
            case ValueEnumType.uint:
                return { t: ValueEnumType.uint, v: bytes.readUnit32() };
            case ValueEnumType.uint32:
                return { t: ValueEnumType.uint32, v: bytes.readUnit32() };
            case ValueEnumType.uint64:
                return { t: ValueEnumType.uint64, v: bytes.readUnit32() };
            case ValueEnumType.double:
                return { t: ValueEnumType.double, v: bytes.readFloat64() };
            case ValueEnumType.string:
                return { t: ValueEnumType.string, v: bytes.readUTF() };
            case ValueEnumType.singleArray:
                return { t: ValueEnumType.singleArray, v: bytes.readFloatArray() };
            case ValueEnumType.stringArray:
                return { t: ValueEnumType.stringArray, v: bytes.readStringArray() };
            case ValueEnumType.floatArray:
                return { t: ValueEnumType.floatArray, v: bytes.readFloatArray() };
            case ValueEnumType.vector2:
                return { t: ValueEnumType.vector2, v: bytes.readVector2() };
            case ValueEnumType.vector3:
                return { t: ValueEnumType.vector3, v: bytes.readVector3() };
            case ValueEnumType.vector4:
                return { t: ValueEnumType.vector4, v: bytes.readVector4() };
            case ValueEnumType.color:
                return { t: ValueEnumType.color, v: bytes.readColor() };
            case ValueEnumType.color32:
                return { t: ValueEnumType.color32, v: bytes.readColor() };
            case ValueEnumType.animationCurve:
                return { t: ValueEnumType.animationCurve, v: null }
            case ValueEnumType.quaternion:
                return { t: ValueEnumType.quaternion, v: bytes.readQuaternion() };
            case ValueEnumType.matrix4x4:
                return { t: ValueEnumType.matrix4x4, v: null };
            case ValueEnumType.mesh:
                {
                    let id = bytes.readUTF();
                    let mesh = Engine3D.res.getGeometry(id);
                    return { t: ValueEnumType.mesh, v: mesh };
                }
            case ValueEnumType.texture:
                {
                    let id = bytes.readUTF();
                    let texture = Engine3D.res.getTexture(id);
                    return { t: ValueEnumType.texture, v: texture };
                }
            case ValueEnumType.material:
                {
                    let id = bytes.readUTF();
                    let mat = Engine3D.res.getMat(id);
                    return { t: ValueEnumType.material, v: mat };
                }
            case ValueEnumType.materials:
                {
                    let str = bytes.readStringArray();
                    let mats = [];
                    for (let i = 0; i < str.length; i++) {
                        const element = str[i];
                        let mat = Engine3D.res.getMat(element);
                        mats.push(mat);
                    }
                    return { t: ValueEnumType.materials, v: mats };
                }

            case ValueEnumType.skeleton:
                break;
            case ValueEnumType.animClip:
                {
                    let animClipDatas: PropertyAnimationClip[] = [];
                    let animClipCount = bytes.readInt32();
                    for (let i = 0; i < animClipCount; i++) {
                        let animationClipData = new PropertyAnimationClip();
                        animationClipData.formBytes(bytes);
                        animClipDatas.push(animationClipData);
                    }
                    return { t: ValueEnumType.animClip, v: animClipDatas };
                }
                case ValueEnumType.vector2Int:
                return { t: ValueEnumType.vector2Int, v: bytes.readVector2int() };
                    break;
                    case ValueEnumType.int32List:
                        return { t: ValueEnumType.int32List, v: bytes.readInt32List() };
                            break;
                            case ValueEnumType.colorList:
                                let len = bytes.readInt32();
                                let list = [] ;
                                for (let i = 0; i < len ; i++) {
                                    const element = ValueParser.parser(bytes).v as Color;
                                    list.push(element);
                                }
                        return { t: ValueEnumType.colorList, v: list };
                            break;
                            case ValueEnumType.color32List:
                                let len2 = bytes.readInt32();
                                let list2 = [] ;
                                for (let i = 0; i < len2 ; i++) {
                                    const element = ValueParser.parser(bytes).v as Color;
                                    list2.push(element);
                                }
                        return { t: ValueEnumType.color32List, v: list2 };
                            break;
        }
    }

}
