export let ClusterBoundsSource_cs: string = /* wgsl */`
  #include "GlobalUniform"

        struct ClusterBox{
            minPoint:vec4<f32>,
            maxPoint:vec4<f32>
        }

        struct ClustersUniform{
            clusterTileX:f32,
            clusterTileY:f32,
            clusterTileZ:f32,
            numLights:f32,
            maxNumLightsPerCluster:f32,
            near:f32,
            far:f32,
            screenWidth:f32,
            screenHeight:f32,
        }
     
        @group(0) @binding(1) var<uniform> clustersUniform : ClustersUniform;
        @group(0) @binding(2) var<storage,read_write> clusterBuffer : array<ClusterBox>;


        var<private> clusterTileX:f32 ;
        var<private> clusterTileY:f32 ;
        var<private> clusterTileZ:f32 ;
        fn convertNDCToView( v4:vec4<f32> ) -> vec4<f32> {
            var v = globalUniform.pvMatrixInv * v4 ;
            v = v / v.w ;
            return v ;
        }

        fn gridToIndex(i:vec3<u32>) -> u32{
            return i.z * u32(clusterTileX) * u32(clusterTileY) + i.y * u32(clusterTileX) + i.x ;
        }

        fn ScreenToView(screen : vec4<f32>) -> vec4<f32> {
            let texCoord = screen.xy / vec2<f32>(clustersUniform.screenWidth, clustersUniform.screenHeight);
            let clip = vec4<f32>(vec2<f32>(texCoord.x, 1.0 - texCoord.y) * 2.0 - vec2<f32>(1.0, 1.0), screen.z, screen.w);
            return convertNDCToView(clip);
          }

        fn LineIntersectionToZPlane( eye:vec3<f32> , ndcPoint :vec3<f32> , z:f32) -> vec3<f32>
        {
            var normal = vec3<f32>(0.0, 0.0, 1.0);
            var dir = ndcPoint - eye;
            var t = (z - dot(normal, eye)) / dot(normal, dir);
            var result = eye + t * dir;
            return result;
        }

        // @compute @workgroup_size(2,2,1)
        @compute @workgroup_size(16,12,1)
        fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(local_invocation_id) local_invocation_id : vec3<u32> ){
            // let i = local_invocation_id.x ;
            // let j = local_invocation_id.y ;

            let i = local_invocation_id.x ;
            let j = local_invocation_id.y ;
            let k = workgroup_id.x ;

            clusterTileX = clustersUniform.clusterTileX;
            clusterTileY = clustersUniform.clusterTileY;
            clusterTileZ = clustersUniform.clusterTileZ;

            let clusterGrid = vec3<u32>(i,j,k);
            let tileIndex = gridToIndex(clusterGrid);
            let eyePos = vec3<f32>(0.0, 0.0, 0.0);

            let tx = clusterTileX;
            let ty = clusterTileY;
            let tz = clusterTileZ ;
            let near = clustersUniform.near ;
            let far = clustersUniform.far ;

            let titleSize = vec2<f32>( clustersUniform.screenWidth / tx ,  clustersUniform.screenHeight / ty ) ;

            var maxPointSs = vec4<f32>(vec2<f32>(f32(i) + 1.0, f32(j) + 1.0) * titleSize, 0.0, 1.0);
	        var minPointSs = vec4<f32>(vec2<f32>(f32(i) , f32(j)) * titleSize, 0.0, 1.0);

            var maxPointVs = ScreenToView(maxPointSs).xyz;
	        var minPointVs = ScreenToView(minPointSs).xyz;
 
            var tileNear = clustersUniform.near * pow(clustersUniform.far / clustersUniform.near, f32(k) / clustersUniform.clusterTileZ);
	        var tileFar = clustersUniform.near * pow(clustersUniform.far / clustersUniform.near, (f32(k) + 1.0) / clustersUniform.clusterTileZ);

            var minPointNear = LineIntersectionToZPlane(eyePos, minPointVs, tileNear);
            var minPointFar = LineIntersectionToZPlane(eyePos, minPointVs, tileFar);
            var maxPointNear = LineIntersectionToZPlane(eyePos, maxPointVs, tileNear);
            var maxPointFar = LineIntersectionToZPlane(eyePos, maxPointVs, tileFar);

            var minPointAABB = min(min(minPointNear, minPointFar), min(maxPointNear, maxPointFar));
            var maxPointAABB = max(max(minPointNear, minPointFar), max(maxPointNear, maxPointFar));

            var clusterBox : ClusterBox ;
            clusterBox.minPoint = vec4<f32>(minPointAABB,f32(tileIndex)) ;
            clusterBox.maxPoint = vec4<f32>(maxPointAABB,f32(tileIndex)) ;
            clusterBuffer[tileIndex] = clusterBox;
        }
`