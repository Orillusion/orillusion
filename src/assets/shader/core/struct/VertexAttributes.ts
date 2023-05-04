import { SkeletonAnimation_shader } from "../../anim/SkeletonAnimation_shader";
import { MorphTarget_shader } from "../../../../components/anim/morphAnim/MorphTarget_shader";

export let VertexAttributes: string = /*wgsl*/ `
    #if USE_MORPHTARGETS
    ${MorphTarget_shader.getMorphTargetShaderBinding(3, 0)}
    #endif

    #if USE_SKELETON
    ${SkeletonAnimation_shader.groupBindingAndFunctions(3, 0)} 
    #endif

    struct VertexAttributes{
    @builtin(instance_index) index : u32,
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) TEXCOORD_1: vec2<f32>,

    #if USE_TANGENT
        @location(4) TANGENT: vec4<f32>,
        #if USE_SKELETON
            @location(5) joints0: vec4<f32>,
            @location(6) weights0: vec4<f32>,
            #if USE_JOINT_VEC8
            @location(7) joints1: vec4<f32>,
            @location(8) weights1: vec4<f32>,
        #endif
        #elseif USE_MORPHTARGETS
            ${MorphTarget_shader.getMorphTargetAttr(5)}
        #endif
    #elseif USE_SKELETON
        @location(4) joints0: vec4<f32>,
        @location(5) weights0: vec4<f32>,
        #if USE_JOINT_VEC8
        @location(6) joints1: vec4<f32>,
        @location(7) weights1: vec4<f32>,
        #endif
    #elseif USE_MORPHTARGETS
        ${MorphTarget_shader.getMorphTargetAttr(4)}
    #endif
    }

    struct VertexOutput {
    @location(0) varying_UV0: vec2<f32>,
    @location(1) varying_UV1: vec2<f32>,
    @location(2) varying_ViewPos: vec4<f32>,
    @location(3) varying_Clip: vec4<f32>,
    @location(4) varying_WPos: vec4<f32>,
    @location(5) varying_WNormal: vec3<f32>,
    @location(6) varying_Color: vec4<f32>,

    #if USE_SHADOWMAPING
        @location(7) varying_ShadowPos: vec4<f32>,
    #endif

    #if USE_TANGENT
        @location(8) varying_Tangent: vec4<f32>,
    #endif

    @builtin(position) member: vec4<f32>
    };

    var<private> ORI_VertexOut: VertexOutput ;

    fn ORI_Vert(vertex:VertexAttributes){
    var vertexPosition = vertex.position;
    var vertexNormal = vertex.normal;

    #if USE_MORPHTARGETS
    ${MorphTarget_shader.getMorphTargetCalcVertex()}    
    #endif

    #if USE_SKELETON
        #if USE_JOINT_VEC8
            let skeletonNormal = getSkeletonWorldMatrix_8(vertex.joints0, vertex.weights0, vertex.joints1, vertex.weights1);
            ORI_MATRIX_M *= skeletonNormal ;
        #else
            let skeletonNormal = getSkeletonWorldMatrix_4(vertex.joints0, vertex.weights0);
            ORI_MATRIX_M *= skeletonNormal ;
        #endif
    #endif

    #if USE_TANGENT
        ORI_VertexOut.varying_Tangent = vertex.TANGENT ;
    #endif

    ORI_NORMALMATRIX = transpose(inverse( mat3x3<f32>(ORI_MATRIX_M[0].xyz,ORI_MATRIX_M[1].xyz,ORI_MATRIX_M[2].xyz) ));

    var worldPos = (ORI_MATRIX_M * vec4<f32>(vertexPosition.xyz, 1.0));
    var viewPosition = ORI_MATRIX_V * worldPos;
    var clipPosition = ORI_MATRIX_P * viewPosition ;

    ORI_CameraWorldDir = normalize(ORI_CAMERAMATRIX[3].xyz - worldPos.xyz) ;

    ORI_VertexOut.varying_UV0 = vertex.uv.xy ;
    ORI_VertexOut.varying_UV1 = vertex.TEXCOORD_1.xy;
    ORI_VertexOut.varying_ViewPos = viewPosition / viewPosition.w;
    ORI_VertexOut.varying_Clip = clipPosition ;
    ORI_VertexOut.varying_WPos = worldPos ;
    ORI_VertexOut.varying_WPos.w = f32(vertex.index);
    ORI_VertexOut.varying_WNormal = normalize(ORI_NORMALMATRIX * vertexNormal.xyz) ;
    ORI_VertexOut.member = clipPosition ;
    }
`