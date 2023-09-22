import { CurveValueType, ValueParser } from "../../../loader/parser/prefab/prefabData/ValueParser";
import { ValueEnumType } from "../../../loader/parser/prefab/prefabData/ValueType";
import { BytesArray } from "../../../util/BytesArray";
import { Quaternion } from "../../Quaternion";
import { Vector2 } from "../../Vector2";
import { Vector3 } from "../../Vector3";
import { Vector4 } from "../../Vector4";
import { Keyframe } from "../Keyframe";

/**
 * @group Math
 */
export class KeyframeT {
    public serializedVersion: string = '2';
    public time: number;
    public tangentMode: number = 0;
    public weightedMode: number = 0;
    // public value: CurveValueType;
    // public inSlope: CurveValueType;
    // public outSlope: CurveValueType;
    // public inWeight: CurveValueType
    // public outWeight: CurveValueType

    public propertyKeyFrame: { [k: number]: Keyframe };

    constructor(time: number = 0) {
        this.time = time;
        this.propertyKeyFrame = {};
    }

    public getK(k: number) {
        return this.propertyKeyFrame[k];
    }

    private split(type: ValueEnumType, value: CurveValueType, property: string) {
        switch (type) {
            case ValueEnumType.single:
                {
                    let keyFrame = this.getKeyFrame(0);
                    keyFrame[property] = value;
                }
                break;
            case ValueEnumType.float:
                {
                    let keyFrame = this.getKeyFrame(0);
                    keyFrame[property] = value;
                }
                break;
            case ValueEnumType.vector2:
                {
                    let v = value as Vector2;
                    let x_kf = this.getKeyFrame(0);
                    x_kf[property] = v.x;
                    let y_kf = this.getKeyFrame(1);
                    y_kf[property] = v.y;
                }
                break;
            case ValueEnumType.vector3:
                {
                    let v = value as Vector3;
                    let x_kf = this.getKeyFrame(0);
                    x_kf[property] = v.x;
                    let y_kf = this.getKeyFrame(1);
                    y_kf[property] = v.y;
                    let z_kf = this.getKeyFrame(2);
                    z_kf[property] = v.z;
                }
                break;
            case ValueEnumType.vector4:
                {
                    let v = value as Vector4;
                    let x_kf = this.getKeyFrame(0);
                    x_kf[property] = v.x;
                    let y_kf = this.getKeyFrame(1);
                    y_kf[property] = v.y;
                    let z_kf = this.getKeyFrame(2);
                    z_kf[property] = v.y;
                    let w_kf = this.getKeyFrame(3);
                    w_kf[property] = v.y;
                }
                break;
            case ValueEnumType.quaternion:
                {
                    let v = value as Quaternion;
                    let x_kf = this.getKeyFrame(0);
                    x_kf[property] = v.x;
                    let y_kf = this.getKeyFrame(1);
                    y_kf[property] = v.y;
                    let z_kf = this.getKeyFrame(2);
                    z_kf[property] = v.z;
                    let w_kf = this.getKeyFrame(3);
                    w_kf[property] = v.w;
                }
                break;
        }
    }

    private getKeyFrame(k: number): Keyframe {
        let keyFrame = this.propertyKeyFrame[k];
        if (!keyFrame) {
            keyFrame = new Keyframe();
            keyFrame.time = this.time;
            keyFrame.tangentMode = this.tangentMode;
            keyFrame.weightedMode = this.weightedMode;
            this.propertyKeyFrame[k] = keyFrame;
        }

        return keyFrame;
    }

    public formBytes(bytes: BytesArray) {
        this.time = bytes.readFloat32();
        {
            let { t, v } = ValueParser.parser(bytes);
            this.split(t, v, "value");
        }
        {
            let { t, v } = ValueParser.parser(bytes);
            this.split(t, v, "inSlope");
        }
        {
            let { t, v } = ValueParser.parser(bytes);
            this.split(t, v, "outSlope");
        }
        this.tangentMode = bytes.readInt32();
        this.weightedMode = bytes.readInt32();
        {
            let { t, v } = ValueParser.parser(bytes);
            this.split(t, v, "inWeight");
        }
        {
            let { t, v } = ValueParser.parser(bytes);
            this.split(t, v, "outWeight");
        }
    }
}