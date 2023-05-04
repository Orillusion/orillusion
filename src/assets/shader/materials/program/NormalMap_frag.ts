export let NormalMap_frag: string = /*wgsl*/ `
    fn perturbNormal(  worldPos:vec3<f32>,  surf_norm:vec3<f32>,  mapN:vec3<f32> , normalScale:f32 , face:f32 ) -> vec3<f32> {
        var q0 = vec3<f32>( dpdx( worldPos.x ), dpdx( worldPos.y ), dpdx( worldPos.z ) );
        var q1 = vec3<f32>( dpdy( worldPos.x ), dpdy( worldPos.y ), dpdy( worldPos.z ) );
        var st0 = dpdx( ORI_VertexVarying.fragUV0.xy );
        var st1 = dpdy( ORI_VertexVarying.fragUV0.xy );
        var N = surf_norm;
        var q1perp = cross( q1, N );
        var q0perp = cross( N, q0 );
        var T = q1perp * st0.x + q0perp * st1.x;
        var B = q1perp * st0.y + q0perp * st1.y;

        var det = max( dot( T, T ), dot( B, B ) );
        var scale = 1.0 ;
        if( det != 0.0 ){
            scale = inverseSqrt( det ) ;
        }
        scale *= normalScale;
        return normalize( (T * ( -mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z ) * face ) ;
    }

    fn unpackNormalMap( normal : vec3<f32> ) -> vec3<f32>
    {
        var normalTex = vec3<f32>( normal.xyz * 2.0 - 1.0 ) ;
        return normalize(normalTex);
    }

    fn unPackNormal(normal : vec3<f32> , height:f32 ) -> vec3<f32>{
        var face = 1.0 ;
        if(ORI_VertexVarying.face){
            face = 1.0 ;
        }else{
            face = -1.0 ;
        }

        #if USE_RGNORMAL
            return unPackRGNormal(normal,height,face);
        #else
            var n = normal ;
            #if USE_NORMALFILPY
            n.y = 1.0 - n.y ; 
            #endif
            
            var mapNormal: vec3<f32> = unpackNormalMap(n) ;
            return perturbNormal(ORI_VertexVarying.vWorldPos.xyz , ORI_VertexVarying.vWorldNormal.xyz , mapNormal , height , face  ) ;
        #endif
    }

    fn unPackRGNormal(normal : vec3<f32> , height:f32 , face:f32) -> vec3<f32> {
        var d = normal.rg * 2.0 - 1.0 ;
        var l = 1.0 - saturate(dot(d,d));
        var s = sqrt(l);
        var rg = d * height ; 
        var mapNormal = vec3<f32>(rg,s);
        var outN = perturbNormal(ORI_VertexVarying.vWorldPos.xyz,ORI_VertexVarying.vWorldNormal,mapNormal,1.0,face) ;
        return outN ;
    }
`

