export let ZPassShader_cs: string = /*wgsl*/ `
    @group(0) @binding(0) var<storage,read_write> visibleBuffer: array<f32>;
    @group(0) @binding(1) var zBufferTexture : texture_2d<f32>;

    @compute @workgroup_size(8, 8, 1)
    fn CsMain( @builtin(global_invocation_id) globalInvocation_id : vec3<u32> ) {
        var fragCoord = vec2<i32>( globalInvocation_id.xy );
        let md = textureLoad(zBufferTexture,fragCoord,0);

        let meshID = i32(floor( md.w + 0.1 ));
        if (meshID >= 0) {
            visibleBuffer[meshID] = 1.0 ;
        }
    }
`
