export class CopyBoneMatrix {
    public static cs: string = /* wgsl */ `
        @group(0) @binding(0) var<storage, read> matrixs: array<mat4x4<f32>>;
        @group(0) @binding(1) var<storage, read> jointsMatrixIndexTable: array<f32>;
        @group(0) @binding(2) var<storage, read_write> bonesTransformMatrix: array<mat4x4<f32>>;

        @compute @workgroup_size(16)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
            @builtin(num_workgroups) GroupSize: vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            bonesTransformMatrix[index] = matrixs[u32(jointsMatrixIndexTable[index])];
        }
    `;
}
