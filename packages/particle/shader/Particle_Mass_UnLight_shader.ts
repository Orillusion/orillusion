/**
 * @internal
 */
export let Particle_Mass_UnLight_vs_shader = /* wgsl */ `
struct ConstUniform {
    projMat: mat4x4<f32>,
    viewMat: mat4x4<f32>,
    shadowMatrix: mat4x4<f32>,
    cameraMat: mat4x4<f32>
};

struct Particle_local {
    position:vec4<f32>,
    velocity:vec4<f32>,
    force:vec4<f32>,
    density:f32,
    pressure:f32,
  
    data1:f32,
    data2:f32
  };
  
  struct Particles {
      particles : array<Particle_local>
  };
  
  struct Particle_global {
      instance_index : f32,
      maxParticles : f32,
      time : f32,
      timeDelta : f32,
  
      gravity : vec3<f32>,
      spaceDamping : f32,
  
      cameraPos : vec4<f32>
  };

  struct Uniforms {
    matrix : array<mat4x4<f32>>
};

struct VertexOutput {
    @location(0) fragUV: vec2<f32>,
    @location(1) wPos: vec3<f32>,
    @location(2) wNormal: vec3<f32>,
    @builtin(position) member: vec4<f32>
};

@group(0) @binding(0)
var<uniform> global: ConstUniform;

@group(0) @binding(1)
var<storage, read> models : Uniforms;

@group(3) @binding(2)
var<storage, read> storage_particles : Particles;
@group(3) @binding(3)
var<storage, read> particle_Glo : Particle_global;

var<private> RADIANS_TO_DEGREES: f32  = 57.29578049044297 ;
var<private> DEGREES_TO_RADIANS: f32  = 0.0174532922222222 ;
fn inverse( m:mat3x3<f32>) -> mat3x3<f32>{
    var a00 = m[0][0];
    var a01 = m[0][1];
    var a02 = m[0][2];
    var a10 = m[1][0];
    var a11 = m[1][1];
    var a12 = m[1][2];
    var a20 = m[2][0];
    var a21 = m[2][1];
    var a22 = m[2][2];

    var b01 = a22 * a11 - a12 * a21;
    var b11 = -a22 * a10 + a12 * a20;
    var b21 = a21 * a10 - a11 * a20;

    var det = a00 * b01 + a01 * b11 + a02 * b21;

    return mat3x3<f32>(
        vec3<f32>(b01/ det, (-a22 * a01 + a02 * a21)/ det, (a12 * a01 - a02 * a11)/ det),
        vec3<f32>(b11/ det, (a22 * a00 - a02 * a20)/ det, (-a12 * a00 + a02 * a10)/ det),
        vec3<f32>(b21/ det, (-a21 * a00 + a01 * a20)/ det, (a11 * a00 - a01 * a10)/ det)
    );
  }
@vertex
fn main(
    @builtin(instance_index) index : u32,
    @location(0) Vertex_Position: vec3<f32>, 
    @location(1) Vertex_Normal: vec3<f32>, 
    @location(2) Vertex_Uv: vec2<f32>) -> VertexOutput {
    var particleData = storage_particles.particles[index];
    var worldMatrix = models.matrix[u32(particle_Glo.instance_index)];
    var particlePos = particleData.position.xyz + Vertex_Position.xyz ;

    var vWorldPos = (worldMatrix * vec4<f32>(particlePos, 1.0));
    var normalMatrix = transpose(inverse( mat3x3<f32>(worldMatrix[0].xyz,worldMatrix[1].xyz,worldMatrix[2].xyz) ));
    var vWorldNormal = normalize(normalMatrix * Vertex_Normal);
    var position = ((global.projMat * global.viewMat) * vWorldPos);

    return VertexOutput(Vertex_Uv ,vWorldPos.xyz,vWorldNormal, position );
}
`;
/**
 * @internal
 */
export let Particle_Mass_UnLight_fs_shader = /* wgsl */ `
struct FragmentOutput {
    @location(0) o_Target: vec4<f32>
};

struct ConstUniform {
    projMat: mat4x4<f32>,
    viewMat: mat4x4<f32>,
    shadowMatrix: mat4x4<f32>,
    cameraWorldMatrix: mat4x4<f32>,
    frame: f32,
    time: f32,
    delta: f32,
    shadowBias: f32
};

struct MatData{
    emissive:vec4<f32>,
    emissiveIns:f32
}

@group(0) @binding(0)
var<uniform> globalData: ConstUniform;

@group(1) @binding(0)
var baseMapSampler: sampler;

@group(1) @binding(1)
var baseMap: texture_2d<f32>;

@group(2) @binding(0)
var<uniform> matData : MatData ;

@fragment
fn main( @location(0) fragUV: vec2<f32> , @location(1) wPos: vec3<f32> , @location(2) wNormal: vec3<f32> ) -> FragmentOutput {
    var baseColor: vec4<f32> = textureSample(baseMap, baseMapSampler, fragUV.xy);
    var color:vec3<f32> = baseColor.xyz + matData.emissive.xyz;
    
    var dis = min(distance(wPos,globalUniform.cameraWorldMatrix[3].xyz),300.0) / 300.0  ;
    dis = pow(dis,1.0);

    var V = normalize(wPos - globalUniform.cameraWorldMatrix[3].xyz );
    var N = normalize(wNormal);
    var VoN = max(dot(-V,N),0.0);

    var fog = vec4<f32>(0.3,0.2,0.45,1.0) ;
    var finalColor = vec4<f32>(color * VoN,baseColor.w);
    finalColor = mix( finalColor , fog , dis) ;
    return FragmentOutput(finalColor);
}
`;
