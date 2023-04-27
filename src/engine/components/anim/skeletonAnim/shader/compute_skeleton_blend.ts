import { MathShader } from "../../../../assets/shader/math/MathShader";

/**
 * @internal
 */
export let compute_skeleton_blend = /* wgsl */ `
  ${MathShader}

  struct Arguments {
    numJoint: f32,
    numState: f32,
    retain1: f32,
    retain2: f32,
    time: vec2<f32>,
    weight: vec2<f32>,
  };

  struct JointData {
    scale: vec4<f32>,
    rotation: vec4<f32>,
    translation: vec4<f32>,
  };

  @group(0) @binding(0) var<storage, read_write> args: Arguments;
  @group(0) @binding(1) var<storage, read_write> jointsFinalMatrix: array<mat4x4<f32>>;
  @group(0) @binding(2) var<storage, read_write> jointsWorldMatrix: array<mat4x4<f32>>;

  @compute @workgroup_size(1)
  fn CsMain(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(local_invocation_index) local_index: u32) {
    let numJoint = i32(args.numJoint);
    let numState = i32(args.numState);
    let nJointIndex = i32(workgroup_id.x);

    jointsFinalMatrix[nJointIndex] = mixMatrix4x4(jointsWorldMatrix[0 * numJoint + nJointIndex], jointsWorldMatrix[1 * numJoint + nJointIndex], args.time[0]) * args.weight[0];

    for (var i = 1; i < numState; i++) {
      jointsFinalMatrix[nJointIndex] += mixMatrix4x4(jointsWorldMatrix[(i * 2 + 0) * numJoint + nJointIndex], jointsWorldMatrix[(i * 2 + 1) * numJoint + nJointIndex], args.time[i]) * args.weight[i];
    }
  }
`;
