
export let Picker_cs: string = /*wgsl*/ `
    struct GlobalUniform {
        projMat: mat4x4<f32>,
        viewMat: mat4x4<f32>,
        cameraWorldMatrix: mat4x4<f32>,
        pvMatrixInv : mat4x4<f32>,
        shadowMatrix: array<mat4x4<f32>,8>,
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
    };

    struct PickResult{
        pick_meshID:f32,
        pick_meshID2:f32,
        pick_UV:vec2<f32>,
        pick_Position:vec4<f32>,
        pick_Normal:vec4<f32>,
        pick_Tangent:vec4<f32>,
    }

    @group(0) @binding(0) var<uniform> standUniform: GlobalUniform;
    @group(0) @binding(1) var<storage,read_write> outBuffer: PickResult;
    @group(0) @binding(2) var visibleMap : texture_2d<f32>;

    @compute @workgroup_size( 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
    var result:PickResult ;
    // result.pick_meshID
    let texSize = textureDimensions(visibleMap).xy;
    let screenPoint = vec2<f32>(standUniform.mouseX/standUniform.windowWidth,standUniform.mouseY/standUniform.windowHeight);

    let mouseUV = screenPoint * vec2<f32>(texSize.xy); 
    let info = textureLoad(visibleMap, vec2<i32>(mouseUV) , 0);

    outBuffer.pick_meshID = f32(info.w) ;
    outBuffer.pick_meshID2 = f32(info.w) ;
    outBuffer.pick_Tangent = vec4<f32>(2.0,2.0,2.0,2.0) ;
    outBuffer.pick_UV = vec2<f32>(standUniform.mouseX,standUniform.mouseY) ;
    outBuffer.pick_Position = vec4<f32>(info.xyzw) ;
    outBuffer.pick_Normal = vec4<f32>(info.xyzw) ;
    }
`
