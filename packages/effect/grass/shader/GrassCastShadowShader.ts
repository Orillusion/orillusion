export let GrassCastShadowShader = /* wgsl */`
    #include "WorldMatrixUniform"
    #include "GrassVertexAttributeShader"
    #include "FragmentVarying"
    #include "GlobalUniform"
    #include "Inline_vert"
    #include "MatrixShader"
    
    struct MaterialUniform {
        baseColor: vec4<f32>,
        grassBottomColor: vec4<f32>,
        grassTopColor: vec4<f32>,
        windBound: vec4<f32>,
        windDirection: vec2<f32>,
        windPower: f32,
        windSpeed: f32,
        translucent: f32,
        grassHeight: f32,
        curvature: f32,
        roughness: f32,
        soft: f32,
        specular: f32,
    };
      
    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    @group(1) @binding(auto)
    var baseMapSampler: sampler;
    @group(1) @binding(auto)
    var baseMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var windMapSampler: sampler;
    @group(1) @binding(auto)
    var windMap: texture_2d<f32>;

    const DEGREES_TO_RADIANS : f32 = 3.1415926 / 180.0 ;
    const PI : f32 = 3.1415926 ;

    @vertex
    fn VertMain( vertex:VertexAttributes ) -> VertexOutput {
        var vertexData = vertex ;
        vertex_inline(vertexData);
        vert(vertexData);
        return ORI_VertexOut ;
    }

    fn transformVertex(position:vec3<f32>,normal:vec3<f32>,vertex:VertexAttributes) -> TransformVertex {
        var transformVertex:TransformVertex;
        let windDirection = normalize( vec3<f32>(materialUniform.windDirection.x,0.0,materialUniform.windDirection.y)) ;
        let windPower = materialUniform.windPower ;
        let localMatrix = models.matrix[i32(vertex.vIndex)]  ;
        let grassPivot = localMatrix[3].xyz ;
        let bound = materialUniform.windBound ;

        let time = TIME.y * 0.001 ;
        let cycleTime = sin(time) ;

        //sampler wind noise texture by vertex shader 
        let size = textureDimensions(windMap);
        let cyclePos = ( abs(grassPivot.xz + windDirection.xz * time * 100.0 * materialUniform.windSpeed ) % vec2<f32>(size) ) ;
        var windNoise = textureLoad(windMap,vec2<i32>( cyclePos ),0);
    
        // weights0 x,y,z is grass blend dir , w is curvature random 
        let weights = vertex.weights0 ;
        var speed = windDirection.xz * ( windNoise.rg ) ; 
     
        var roat = localMatrix ;
        roat[3].x = 0.0 ;
        roat[3].y = 0.0 ;
        roat[3].z = 0.0 ;
        var finalMatrix:mat4x4<f32> = buildMatrix4x4() ;
        var uv = vertex.uv ;
        let weight = ( 1.0 - uv.y )  ;
        let limitAngle = 90.0 / 8.0 * DEGREES_TO_RADIANS + PI * 0.35 ;
        // if(uv.y < 1.0 ){
            for (var index:i32 = 1; index <= 5 ; index+=1) {
                let bios = f32(index) / 5.0 ;
                if(weight >= bios){
                    let rx = weights.x * weights.w + clamp(speed.y * windPower * pow(weight,materialUniform.curvature),-1.0,1.0)  ;
                    let rz = weights.z * weights.w + clamp(-speed.x * windPower * pow(weight,materialUniform.curvature),-1.0,1.0) ;

                    var rot = buildRotateXYZMat4(rx,0.0,rz,0.0,materialUniform.grassHeight*bios,0.0);
                    finalMatrix *= rot ;
                }
            }
        // }

        finalMatrix *= roat;
        //create grass pivot matrix 
        var translate = bulidTranslateMat4(grassPivot.x,grassPivot.y,grassPivot.z);
        transformVertex.position = ( translate * finalMatrix * vec4<f32>(position,1.0)).xyz;

        //generate vertex normal
        //build vertex normal matrix 
        let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
        ORI_NORMALMATRIX = transpose(inverse( nMat ));
        transformVertex.normal = ORI_NORMALMATRIX * normal;

        return transformVertex ;
    }

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        let input = inputData ;
        ORI_Vert(input) ;
        return ORI_VertexOut ;
    }
`

