import { BytesArray, ValueParser } from "../..";

/**
 * @group Math
 */
export class Keyframe {
    public serializedVersion: string = '2';
    public time: number;
    public value: number;
    public inSlope: number = 0;
    public outSlope: number = 0;
    public tangentMode: number = 0;

    public weightedMode: number = 0;
    public inWeight: number;
    public outWeight: number;

    constructor(time: number = 0, value: number = 0) {
        this.time = time;
        this.value = value;
    }

    public unSerialized(data: any) {
        this.serializedVersion = data['serializedVersion'];
        this.time = data['time'];
        this.value = data['value'];
        this.tangentMode = data['tangentMode'];
        this.inSlope = data['inSlope'] == 'Infinity' ? NaN : data['inSlope'];
        this.outSlope = data['outSlope'] == 'Infinity' ? NaN : data['outSlope'];
    }

    public unSerialized2(data: any) {
        this.serializedVersion = data['serializedVersion'];
        this.time = data['time'];
        this.value = data['value'];
        this.tangentMode = data['tangentMode'];
        this.inSlope = data['inTangent'] == 'Infinity' ? NaN : data['inTangent'];
        this.outSlope = data['outTangent'] == 'Infinity' ? NaN : data['outTangent'];
    }

}