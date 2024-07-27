import { SkeletonAnimation_shader } from "../../anim/SkeletonAnimation_shader";
import { MorphTarget_shader } from "../../../../components/anim/morphAnim/MorphTarget_shader";

/**
 * @internal
 */
export let VertexAttributes_vert: string = /*wgsl*/ `
    var<private> PI: f32 = 3.14159265359;
    #if USE_METAHUMAN
        ${MorphTarget_shader.getMorphTargetShaderBinding(3, 0)}
        ${SkeletonAnimation_shader.groupBindingAndFunctions(3, 2)} 
    #else
        #if USE_MORPHTARGETS
            ${MorphTarget_shader.getMorphTargetShaderBinding(3, 0)}
        #endif

        #if USE_SKELETON
            ${SkeletonAnimation_shader.groupBindingAndFunctions(3, 0)} 
        #endif
    #endif

    struct VertexAttributes{
        @builtin(instance_index) index : u32,
        @location(auto) position: vec3<f32>,
        @location(auto) normal: vec3<f32>,
        @location(auto) uv: vec2<f32>,
        @location(auto) TEXCOORD_1: vec2<f32>,

        #if USE_METAHUMAN
            #if USE_TANGENT
                @location(auto) TANGENT: vec4<f32>,
                @location(auto) joints0: vec4<f32>,
                @location(auto) weights0: vec4<f32>,
                #if USE_JOINT_VEC8
                    @location(auto) joints1: vec4<f32>,
                    @location(auto) weights1: vec4<f32>,
                    @location(auto) vIndex: f32,
                #else
                    @location(auto) vIndex: f32,
                #endif
            #else
                @location(auto) joints0: vec4<f32>,
                @location(auto) weights0: vec4<f32>,
                #if USE_JOINT_VEC8
                    @location(auto) joints1: vec4<f32>,
                    @location(auto) weights1: vec4<f32>,
                    @location(auto) vIndex: f32,
                #else
                    @location(auto) vIndex: f32,
                #endif
            #endif
        #else
            #if USE_TANGENT
                @location(auto) TANGENT: vec4<f32>,
            #endif

            #if USE_SKELETON
                #if USE_TANGENT
                    @location(auto) joints0: vec4<f32>,
                    @location(auto) weights0: vec4<f32>,
                    #if USE_JOINT_VEC8
                        @location(auto) joints1: vec4<f32>,
                        @location(auto) weights1: vec4<f32>,
                    #endif
                #else
                    @location(auto) joints0: vec4<f32>,
                    @location(auto) weights0: vec4<f32>,
                    #if USE_JOINT_VEC8
                        @location(auto) joints1: vec4<f32>,
                        @location(auto) weights1: vec4<f32>,
                    #endif
                #endif
            #endif

            #if USE_MORPHTARGETS
                #if USE_TANGENT
                    @location(auto) vIndex: f32,
                #else
                    @location(auto) vIndex: f32,
                #endif
            #endif

        #endif
    }

    struct VertexOutput {
    @location(auto) index: f32,
    @location(auto) varying_UV0: vec2<f32>,
    @location(auto) varying_UV1: vec2<f32>,
    @location(auto) varying_ViewPos: vec4<f32>,
    @location(auto) varying_Clip: vec4<f32>,
    @location(auto) varying_WPos: vec4<f32>,
    @location(auto) varying_WNormal: vec3<f32>,
    @location(auto) varying_Color: vec4<f32>,

    #if USE_SHADOWMAPING
        @location(auto) varying_ShadowPos: vec4<f32>,
    #endif

    #if USE_TANGENT
        @location(auto) varying_Tangent: vec4<f32>,
    #endif
   

    @builtin(position) member: vec4<f32>
    };

    var<private> ORI_VertexOut: VertexOutput ;

    fn ORI_Vert(vertex:VertexAttributes){
    var vertexPosition = vertex.position;
    var vertexNormal = vertex.normal;

    #if USE_METAHUMAN
        ${MorphTarget_shader.getMorphTargetCalcVertex()}    
        #if USE_JOINT_VEC8
            let skeletonNormal = getSkeletonWorldMatrix_8(vertex.joints0, vertex.weights0, vertex.joints1, vertex.weights1);
            ORI_MATRIX_M *= skeletonNormal ;
        #else
            let skeletonNormal = getSkeletonWorldMatrix_4(vertex.joints0, vertex.weights0);
            ORI_MATRIX_M *= skeletonNormal ;
        #endif
    #else 
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
    #endif
    
    ORI_NORMALMATRIX = transpose(inverse( mat3x3<f32>(ORI_MATRIX_M[0].xyz,ORI_MATRIX_M[1].xyz,ORI_MATRIX_M[2].xyz) ));
   
    #if USE_TANGENT
        ORI_VertexOut.varying_Tangent = vec4f(normalize(ORI_NORMALMATRIX * vertex.TANGENT.xyz),vertex.TANGENT.w)  ;
    #endif

    var worldPos = (ORI_MATRIX_M * vec4<f32>(vertexPosition.xyz, 1.0));
    var viewPosition = ORI_MATRIX_V * worldPos;
    var clipPosition = ORI_MATRIX_P * viewPosition ;

    #if USE_LOGDEPTH
        clipPosition.z = log2Depth(clipPosition.w, globalUniform.near, globalUniform.far);
    #endif

    ORI_CameraWorldDir = normalize(ORI_CAMERAMATRIX[3].xyz - worldPos.xyz) ;

    ORI_VertexOut.index = f32(vertex.index) ;

    ORI_VertexOut.varying_UV0 = vertex.uv.xy ;

    ORI_VertexOut.varying_UV1 = vertex.TEXCOORD_1.xy;

    ORI_VertexOut.varying_ViewPos = viewPosition ;
    ORI_VertexOut.varying_Clip = clipPosition ;
    ORI_VertexOut.varying_WPos = worldPos ;
    ORI_VertexOut.varying_WPos.w = f32(vertex.index);
    ORI_VertexOut.varying_WNormal = normalize(ORI_NORMALMATRIX * vertexNormal.xyz) ;

    ORI_VertexOut.member = clipPosition ;
    }
`