class texture {
    mouthRollLower: number;
    browOuterUp_L: number;
    mouthSmile_L: number;
    jawRight: number;
    eyeLookOut_L: number;
    mouthFunnel: number;
    mouthUpperUp_R: number;
    browDown_L: number;
    jawLeft: number;
    mouthLowerDown_L: number;
    noseSneer_R: number;
    jawForward: number;
    mouthLowerDown_R: number;
    browInnerUp: number;
    mouthRollUpper: number;
    mouthStretch_R: number;
    mouthPucker: number;
    eyeBlink_L: number;
    mouthUpperUp_L: number;
    mouthShrugUpper: number;
    eyeLookIn_R: number;
    noseSneer_L: number;
    mouthFrown_L: number;
    cheekSquint_L: number;
    eyeLookDown_L: number;
    mouthDimple_L: number;
    mouthFrown_R: number;
    eyeLookIn_L: number;
    eyeLookOut_R: number;
    mouthLeft: number;
    mouthStretch_L: number;
    mouthPress_L: number;
    mouthDimple_R: number;
    eyeWide_R: number;
    browDown_R: number;
    eyeLookUp_R: number;
    eyeBlink_R: number;
    cheekSquint_R: number;
    mouthRight: number;
    eyeLookDown_R: number;
    eyeLookUp_L: number;
    eyeSquint_L: number;
    jawOpen: number;
    browOuterUp_R: number;
    mouthClose: number;
    mouthShrugLower: number;
    eyeWide_L: number;
    tongueOut: number;
    eyeSquint_R: number;
    cheekPuff: number;
    mouthPress_R: number;
    mouthSmile_R: number;
}

type float3 = [number, number, number];
type float4 = [number, number, number, number];
type float4x4 = [float4, float4, float4, float4];
type transform = { leftEyeTransform: float4x4, lookAtPoint: float3, rightEyeTransform: float4x4, transform: float4x4 };

export class MorphTargetFrame {
    texture: texture;
    transform: transform;
}
