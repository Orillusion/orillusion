import { MathShader } from "../../../../assets/shader/math/MathShader";

/**
 * @internal
 */
export let compute_skeleton_transform = /* wgsl */ `
  ${MathShader}

  struct Arguments {
    numJoint: f32,
    numFrame: f32,
    retain0: f32,
    retain1: f32,
  };

  struct JointData {
    scale: vec4<f32>,
    rotation: vec4<f32>,
    translation: vec4<f32>,
  };

  @group(0) @binding(0) var<storage, read_write> args: Arguments;
  @group(0) @binding(1) var<storage, read_write> jointsKeyframe: array<JointData>;
  @group(0) @binding(2) var<storage, read_write> jointsWorldMatrix: array<mat4x4<f32>>;
  @group(0) @binding(3) var<storage, read_write> jointsParentIndex: array<f32>;

  @compute @workgroup_size(1)
  fn CsMain(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(local_invocation_index) local_index: u32) {
    let numJoint = i32(args.numJoint);
    let nFrameIndex = i32(workgroup_id.x);
    for (var nJointIndex = 0; nJointIndex < numJoint; nJointIndex++) {
      let dataIndex = nFrameIndex * numJoint + nJointIndex;
      let joint = jointsKeyframe[dataIndex];
      let jointLocalMatrix = MakeMatrix4x4(joint.scale.xyz, joint.rotation, joint.translation.xyz);

      let nParentIndex = i32(jointsParentIndex[nJointIndex]);
      if (nParentIndex < 0) {
        jointsWorldMatrix[dataIndex] = jointLocalMatrix;
      } else {
        jointsWorldMatrix[dataIndex] = jointsWorldMatrix[nFrameIndex * numJoint + nParentIndex] * jointLocalMatrix;
      }
    }
  }
`;
