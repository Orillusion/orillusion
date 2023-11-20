import { CSM } from "../../../../core/csm/CSM";

export let GlobalUniform: string = /*wgsl*/ `

  struct GlobalUniform {
    projMat: mat4x4<f32>,
    viewMat: mat4x4<f32>,
    cameraWorldMatrix: mat4x4<f32>,
    pvMatrixInv : mat4x4<f32>,
    shadowMatrix: array<mat4x4<f32>, 8u>,
    csmShadowBias: vec4<f32>,
    csmMatrix: array<mat4x4<f32>,${CSM.Cascades}>,
    
    shadowLights:mat4x4<f32>,

    CameraPos: vec3<f32>,
    frame: f32,

    time: f32,
    delta: f32,
    shadowBias: f32,
    skyExposure: f32,

    renderPassState:f32,
    quadScale: f32,
    hdrExposure: f32,
    renderState_left: i32,

    renderState_right: i32,
    renderState_split: f32,
    mouseX: f32,
    mouseY: f32,

    windowWidth: f32,
    windowHeight: f32,
    near: f32,
    far: f32,

    pointShadowBias: f32,
    shadowMapSize: f32,
    shadowSoft: f32,
    enableCSM:f32,

    csmMargin:f32,
    nDirShadowStart: i32,
    nDirShadowEnd: i32,
    nPointShadowStart: i32,

    nPointShadowEnd: i32,
    empty1: i32,
    empty2: i32,
    empty3: i32,

  };

  @group(0) @binding(0)
  var<uniform> globalUniform: GlobalUniform;
`

