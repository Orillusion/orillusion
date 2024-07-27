/**
 * @internal
 */
export let Picker_cs: string = /*wgsl*/ `

    #include "GlobalUniform"
    #include "GBufferStand"

    struct PickResult{
        pick_meshID:f32,
        pick_meshID2:f32,
        pick_UV:vec2<f32>,

        pick_Position:vec4<f32>,
        pick_Normal:vec4<f32>,
        pick_Tangent:vec4<f32>,

        v4:vec4<f32>,
        v5:vec4<f32>,
        v6:vec4<f32>,
        v7:vec4<f32>
    }

    @group(0) @binding(2) var<storage,read_write> outBuffer: PickResult;
    const PI = 3.1415926 ;

    @compute @workgroup_size( 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
    var result:PickResult ;
    let texSize = textureDimensions(gBufferTexture).xy;
    let screenPoint = vec2<f32>(globalUniform.mouseX/globalUniform.windowWidth,globalUniform.mouseY/globalUniform.windowHeight);

    let mouseUV = screenPoint * vec2<f32>(texSize.xy);
    let fragCoord =  vec2<i32>(i32(mouseUV.x), i32(mouseUV.y));
    var gBuffer = getGBuffer( fragCoord ) ;
    let pick_meshID = getIDFromGBuffer_i32(gBuffer);
    outBuffer.pick_meshID = f32(pick_meshID) ;
    outBuffer.pick_meshID2 = f32(pick_meshID) ;
    outBuffer.pick_Tangent = vec4<f32>(2.0,2.0,2.0,2.0) ;
    outBuffer.pick_UV = vec2<f32>(globalUniform.mouseX,globalUniform.mouseY) ;
    let wPosition = getWorldPositionFromGBuffer(gBuffer,screenPoint);
    let wNormal = getWorldNormalFromGBuffer(gBuffer);
    outBuffer.pick_Position = vec4<f32>(wPosition, 1.0) ;
    outBuffer.pick_Normal = vec4<f32>(wNormal, 1.0) ;
    }
`
