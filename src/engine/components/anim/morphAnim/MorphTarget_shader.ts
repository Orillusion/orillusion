export class MorphTarget_shader {
    public static getMorphTargetShaderBinding(group: number, beginBinding: number): string {
        return /* wgsl */ `
            fn blendMorphTargetPosition(vertexID:i32, posIn:vec3<f32>) -> vec3<f32>{
                let offset:i32 = vertexID * 3;
                var pos = posIn * morphTargetConfig.morphBaseInfluence;
                pos += vec3<f32>(morphTargetOpPositions[offset], morphTargetOpPositions[offset + 1], morphTargetOpPositions[offset + 2]);
                return pos;
            }

            #if USE_MORPHNORMALS
                fn blendMorphTargetNormal(vertexID:i32, normalIn:vec3<f32>) -> vec3<f32>{
                    let offset:i32 = vertexID * 3;
                    var normal = normalIn * morphTargetConfig.morphBaseInfluence;
                    normal += vec3<f32>(morphTargetOpNormals[offset], morphTargetOpNormals[offset + 1], morphTargetOpNormals[offset + 2]);
                    return normal;
                }
            #endif

            struct MorphTargetConfigData {
                morphBaseInfluence:f32,
                morphTargetCount:f32,
                totalVertexCount:f32,
                computeWorkGroupXY:f32,
            };
            
            @group(${group}) @binding(${beginBinding})
            var<uniform> morphTargetConfig: MorphTargetConfigData;
            
            @group(${group}) @binding(${beginBinding + 1})
            var<storage,read> morphTargetOpPositions: array<f32>;

            #if USE_MORPHNORMALS
                @group(${group}) @binding(${beginBinding + 2})
                var<storage,read> morphTargetOpNormals: array<f32>;
            #endif
`;
    }

    public static getMorphTargetAttr(beginLocation: number): string {
        let value = `@location(${beginLocation}) vIndex: f32,`;
        return value;
    }

    public static getMorphTargetCalcVertex(): string {
        return /* wgsl */ `
            vertexPosition = blendMorphTargetPosition(i32(vertex.vIndex), vertexPosition);

            #if USE_MORPHNORMALS
                vertexNormal = blendMorphTargetNormal(i32(vertex.vIndex), vertexNormal);
            #endif
        `;
    }

    public static CsMain: string = /* wgsl */ `
        struct MorphTargetConfigData {
            morphBaseInfluence:f32,
            morphTargetCount:f32,
            totalVertexCount:f32,
            computeWorkGroupXY:f32,
        };

        @group(0) @binding(0) var<uniform> morphTargetConfig: MorphTargetConfigData;
        @group(0) @binding(1) var<storage, read> morphTargetInfluence : array<f32>;
        @group(0) @binding(2) var<storage, read> morphTargetPositions : array<f32>;
        @group(0) @binding(3) var<storage, read_write> morphTargetOpPositions : array<f32>;
        
        #if USE_MORPHNORMALS
            @group(0) @binding(4) var<storage, read> morphTargetNormals : array<f32>;
            @group(0) @binding(5) var<storage, read_write> morphTargetOpNormals : array<f32>;
        #endif
        
        @compute @workgroup_size( 8 , 8 , 1 )
        fn CsMain(@builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
        {
            let vertexIndex:i32 = i32(globalInvocation_id.y) * i32(morphTargetConfig.computeWorkGroupXY) + i32(globalInvocation_id.x);
        
            let morphTargetCount:i32 = i32(morphTargetConfig.morphTargetCount);
            let totalVertexCount:i32 = i32(morphTargetConfig.totalVertexCount);
            var vertexPosition:vec3<f32> = vec3<f32>(0.0);
            var vertexNormal:vec3<f32> = vec3<f32>(0.0);
            if(vertexIndex < totalVertexCount)
            {
                for(var i:i32 = 0; i < morphTargetCount; i ++){
                    let offset:i32 = (i * totalVertexCount + vertexIndex) * 3;
                    let morphPosition = vec3<f32>(morphTargetPositions[offset], morphTargetPositions[offset + 1], morphTargetPositions[offset + 2]);
                    vertexPosition += morphTargetInfluence[i] * morphPosition;
                }

                var writeOffset = vertexIndex * 3;
                //op position
                morphTargetOpPositions[writeOffset] = vertexPosition.x;
                morphTargetOpPositions[writeOffset + 1] = vertexPosition.y;
                morphTargetOpPositions[writeOffset + 2] = vertexPosition.z;

                #if USE_MORPHNORMALS
                    for(var i:i32 = 0; i < morphTargetCount; i ++){
                        let offset:i32 = (i * totalVertexCount + vertexIndex) * 3;
                        let morphNormal = vec3<f32>(morphTargetNormals[offset], morphTargetNormals[offset + 1], morphTargetNormals[offset + 2]);
                        vertexNormal += morphTargetInfluence[i] * morphNormal;
                    }

                    //op normal
                    morphTargetOpNormals[writeOffset] = vertexNormal.x;
                    morphTargetOpNormals[writeOffset + 1] = vertexNormal.y;
                    morphTargetOpNormals[writeOffset + 2] = vertexNormal.z;
                #endif
            }
        }
`;
}
