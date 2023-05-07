export let FrustumCulling_cs: string = /*wgsl*/ `
struct ConstUniform {
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
}

struct RenderBound{
    index:f32,
}

struct Uniforms {
    matrix : array<mat4x4<f32>>
};

@group(0) @binding(0) var<storage, read> models : Uniforms;
@group(0) @binding(1) var<uniform> standUniform: ConstUniform;
@group(0) @binding(2) var<storage, read> planes: array<vec4<f32>,7>;
@group(0) @binding(3) var<storage, read> cullingList: array<RenderBound>;
@group(0) @binding(4) var<storage,read_write> outBuffer: array<f32>;


var<private> boundPoints : array<vec4<f32>,8> ;   

fn IsInClipSpace( coord : vec4<f32> ) -> bool {
    return -coord.w <= coord.x && coord.x <= coord.w
        && -coord.w <= coord.y && coord.y <= coord.w
        && -coord.w <= coord.z && coord.z <= coord.w;
}

fn IsOutsideThePlane( plane: vec4<f32>, pointPosition : vec3<f32> ) -> bool{
    if(dot(plane.xyz, pointPosition) + plane.w > 0.0){
        return true;
    }
    return false;
}

fn containsBox( size:vec3<f32> , center:vec3<f32> ) -> f32 {
    var c = 0.0 ;
    var d = 0.0 ;

    var r = max(size.x, size.y);
    var sr = max(r , size.z);
    var scx = center.x;
    var scy = center.y;
    var scz = center.z;

    for(var p:i32 = 0; p < 6 ; p = p + 1 ){
        var plane = planes[p];
        d = plane.x * scx + plane.y * scy + plane.z * scz + plane.w;
        if (d <= -sr) {
        return 0.0;
        }
        if (d > sr) {
        c+=1.0;
        }
    }

    if( c >= 6.0 ){
        return 2.0 ;
    }else{
        return 1.0 ;
    }
}

@compute @workgroup_size( 128 )
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
    let id = globalInvocation_id.x ;
    if(id + 1u > u32(planes[6].x) ){
        outBuffer[id] = f32(0.0); 
        return ;
    }

    let renderBound = cullingList[id];
    let boundID = i32(renderBound.index) ;
    var plane = planes[0];

    let worldMatrix = models.matrix[boundID];
    let projMat = standUniform.projMat ;

    let const_boundMin : vec3<f32> = vec3<f32>(-0.5,-0.5,-0.5) ;   
    let const_boundMax : vec3<f32> = vec3<f32>(0.5,0.5,0.5) ;   

    let boundMin = worldMatrix * vec4<f32>(const_boundMin, 1.0);
    let boundMax = worldMatrix * vec4<f32>(const_boundMax, 1.0);

    let size = abs( boundMax.xyz - boundMin.xyz ) * 0.65 ;
    let center = worldMatrix[3].xyz ;

    var isIn :f32 = 0.0 ;

    isIn = containsBox(size,center);

    outBuffer[id] = f32(isIn); 
}
`


