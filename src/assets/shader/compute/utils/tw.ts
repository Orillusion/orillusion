/**
 * @internal
 */
export let tw = /* wgsl */`

    @group(0) @binding(1) var inputTexture : texture_2d<f32>;
    @group(0) @binding(2) var outputTexture : texture_storage_2d<rgba16float, write>;

    // @group(0) @binding(3) var posTexture : texture_2d<f32>;
    // @group(0) @binding(4) var normalTexture : texture_2d<f32>;
    // @group(0) @binding(5) var colorTexture : texture_2d<f32>;

    var<private> fragCoord:vec2<u32>;
    // var<private> wPosition: vec4<f32>;
    // var<private> wNormal: vec4<f32>;
    // var<private> wColor: vec4<f32>;
    
    // var<private> finalMatrix: mat4x4<f32>;
    // var<private> ORI_NORMALMATRIX: mat3x3<f32>;

    
    @compute @workgroup_size( 16 , 16 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
        fragCoord = globalInvocation_id.xy;

        wColor = textureLoad(colorTexture, fragCoord , 0);
      

        finalMatrix = globalUniform.projMat * globalUniform.viewMat ;
        let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
        ORI_NORMALMATRIX = transpose(inverse( nMat ));

        wPosition = textureLoad(posTexture, fragCoord, 0);
        wNormal = textureLoad(normalTexture, fragCoord, 0);
        var VPPos = (finalMatrix * vec4f(wPosition.xyz,1.0)).xyz ;
        var VPNormal = normalize(ORI_NORMALMATRIX * wNormal.xyz) ;

        var LastPixel = textureLoad(inputTexture,fragCoord,0);

        var NewPixel:vec4f = wColor ;
        var NewRadius = max(1.,ceil(1.99-LastPixel.w*0.25));
        var RadiusCoeff = max(1.,2.25-LastPixel.w*0.25);
        if (NewRadius>0.5) {
            var NewWeight = 1.;
            for (var x=-NewRadius; x<NewRadius+0.5; x+=1.0) {
                for (var y=-NewRadius; y<NewRadius+0.5; y+=1.0) {
                    var SUV:vec2f = vec2f(fragCoord)+vec2f(x,y)*RadiusCoeff;
                    if (x*x+y*y<0.01) {
                        continue;
                    }

                    var SVPos:vec3f = textureLoad(posTexture, vec2<u32>(SUV), 0);
                    var SVNormal:vec3f = textureLoad(posTexture, vec2<u32>(SUV), 0).xyz * 2.0 - 1.0;
                    var SWeight = max(0.0001,float(dot(Normal,SVPos-VPPos)<0.01))*
                                    max(0.01,float(dot(Normal,normalize(SVNormal))>0.9));
                    NewPixel += texture(iChannel1,SUV*IRES) * SWeight;
                    NewWeight += SWeight;
                }
            }
            NewPixel /= NewWeight;
        }
    }

`