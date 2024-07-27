import { CSM } from "../../../../core/csm/CSM";

/**
 * @internal
 */
export let GlobalUniform: string = /*wgsl*/ `

  #include "MathShader"

  struct GlobalUniform {

    projMat: mat4x4<f32>,
    viewMat: mat4x4<f32>,
    cameraWorldMatrix: mat4x4<f32>,
    pvMatrixInv : mat4x4<f32>,
    viewToWorld : mat4x4<f32>,
    shadowMatrix: array<mat4x4<f32>, 8u>,

    csmShadowBias: vec4<f32>,

    csmMatrix: array<mat4x4<f32>,${CSM.Cascades}>,
    
    shadowLights:mat4x4<f32>,

    reflectionProbeSize:f32,
    reflectionProbeMaxCount:f32,
    reflectionMapWidth:f32,
    reflectionMapHeight:f32,

    reflectionCount:f32,
    test2:f32,
    test3:f32,
    test4:f32,

    CameraPos: vec3<f32>,
    frame: f32,
    SH:  array<vec4f, 9u> ,

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
    cameraForward:vec3f,

    frustumPlanes: array<vec4f, 6u>,

  };

  @group(0) @binding(0)
  var<uniform> globalUniform: GlobalUniform;

  fn getViewPosition(z:f32,uv:vec2f) -> vec3f {
    let pvMatrixInv = globalUniform.pvMatrixInv ;
    let clip = vec4<f32>((uv * 2.0 - 1.0) , z , 1.0);
    var viewPos = pvMatrixInv * clip ;
    return viewPos.xyz / viewPos.w ;
  }

  fn getWorldPosition(z:f32,uv:vec2f) -> vec3f {
    let viewToWorld = globalUniform.viewToWorld ;
    let clip = vec4<f32>((uv * 2.0 - 1.0) , z , 1.0);
    var worldPos = viewToWorld * clip ;
    worldPos = worldPos / worldPos.w ;
    return worldPos.xyz ;
  }

  var<private> NORMALMATRIX_INV : mat3x3<f32> ;
  var<private> NORMALMATRIX : mat3x3<f32> ;
  fn useNormalMatrix()  {
     let finalMatrix = globalUniform.projMat * globalUniform.viewMat ;
     let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
     NORMALMATRIX = transpose(inverse( nMat ));
  }

  fn useNormalMatrixInv()  {
    let finalMatrix = globalUniform.projMat * globalUniform.viewMat ;
    let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
    NORMALMATRIX_INV = transpose(( nMat ));
  }

  fn getWorldNormal(viewNormal:vec3f) -> vec3f {
    var worldNormal = NORMALMATRIX_INV * viewNormal ;
    return normalize(worldNormal.xyz);
  }

  fn getViewNormal(worldNormal:vec3f) -> vec3f {
    var viewNormal = globalUniform.viewMat * vec4f(worldNormal,0.0) ;
    return normalize(viewNormal.xyz);
  }
`

