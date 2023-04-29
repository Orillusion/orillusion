export class SkeletonAnimation_shader {
    public static groupBindingAndFunctions(beginGroup: number, beginBinding: number) {
        return /* wgsl */ `
            struct JointsMatrix {
                matrix : array<mat4x4<f32>>
            };

            @group(${beginGroup}) @binding(${beginBinding})
            var<storage, read> jointsMatrixIndexTable: array<f32>;

            @group(${beginGroup}) @binding(${beginBinding+1})
            var<storage, read> jointsInverseMatrix: JointsMatrix;

            @group(${beginGroup}) @binding(${beginBinding+2})
            var<storage, read> jointsIndexMapingTable: array<f32>;

            const MAX_JOINT_NUM = 8;
            fn getSkeletonWorldMatrix(joints: array<f32, MAX_JOINT_NUM>, weights: array<f32, MAX_JOINT_NUM>, num: u32) -> mat4x4<f32> {
                var result: mat4x4<f32>;
                for(var i: u32 = 0; i < num; i = i + 1) {
                    let jointId = i32(joints[i]);
                    let jointIndex = u32(jointsIndexMapingTable[jointId]);
                    let jointMatrixIndex = u32(jointsMatrixIndexTable[jointIndex]);
                    let joint = models.matrix[jointMatrixIndex] * jointsInverseMatrix.matrix[jointId] * weights[i];
                    result += joint;
                }
                return result;
            }

            fn getSkeletonWorldMatrix_4(joints: vec4<f32>, weights: vec4<f32>) -> mat4x4<f32> {
                return getSkeletonWorldMatrix(array<f32, MAX_JOINT_NUM>(
                    joints.x, joints.y, joints.z, joints.w,
                    0, 0, 0, 0,
                ), array<f32, MAX_JOINT_NUM>(
                    weights.x, weights.y, weights.z, weights.w,
                    0, 0, 0, 0,
                ), 4);
            }
    
            fn getSkeletonWorldMatrix_8(joints0: vec4<f32>, weights0: vec4<f32>, joints1: vec4<f32>, weights1: vec4<f32>) -> mat4x4<f32> {
                return getSkeletonWorldMatrix(array<f32, MAX_JOINT_NUM>(
                    joints0.x, joints0.y, joints0.z, joints0.w,
                    joints1.x, joints1.y, joints1.z, joints1.w,
                ), array<f32, MAX_JOINT_NUM>(
                    weights0.x, weights0.y, weights0.z, weights0.w,
                    weights1.x, weights1.y, weights1.z, weights1.w,
                ), 8);
            }
        `;
    }
}
