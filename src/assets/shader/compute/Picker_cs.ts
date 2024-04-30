
export let Picker_cs: string = /*wgsl*/ `

    #include "GlobalUniform"

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

    //@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;
    @group(0) @binding(1) var<storage,read_write> outBuffer: PickResult;
    @group(0) @binding(2) var positionMap : texture_2d<f32>;
    @group(0) @binding(3) var normalMap : texture_2d<f32>;

    @compute @workgroup_size( 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
    var result:PickResult ;
    // result.pick_meshID
    let texSize = textureDimensions(positionMap).xy;
    let screenPoint = vec2<f32>(globalUniform.mouseX/globalUniform.windowWidth,globalUniform.mouseY/globalUniform.windowHeight);

    let mouseUV = screenPoint * vec2<f32>(texSize.xy); 
    let pos = textureLoad(positionMap, vec2<i32>(mouseUV) , 0);
    let normal = textureLoad(normalMap, vec2<i32>(mouseUV) , 0);

    outBuffer.pick_meshID = f32(pos.w) ;
    outBuffer.pick_meshID2 = f32(pos.w) ;
    outBuffer.pick_Tangent = vec4<f32>(2.0,2.0,2.0,2.0) ;
    outBuffer.pick_UV = vec2<f32>(globalUniform.mouseX,globalUniform.mouseY) ;
    outBuffer.pick_Position = pos;
    outBuffer.pick_Normal = normal;
    }
`
