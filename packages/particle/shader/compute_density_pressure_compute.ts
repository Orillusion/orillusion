import { FastMath_shader } from './FastMath';
/**
 * @internal
 */
export let compute_density_pressure_compute = /* wgsl */ `
  ${FastMath_shader}

  struct Particle_global {
    instance_index : f32,
    maxParticles : f32,
    time : f32,
    timeDelta : f32,
    gravity : vec3<f32>,
    spaceDamping : f32,
    cameraPos : vec4<f32>,

    SMOOTHING_LENGTH:f32,
    PARTICLE_MASS:f32,
    PI_FLOAT:f32,
    PARTICLE_STIFFNESS:f32,
    PARTICLE_RESTING_DENSITY:f32,
    PARTICLE_VISCOSITY:f32,
    TIME_STEP:f32,
    WALL_DAMPING:f32
  };

  struct ParticleData {
    position:vec4<f32>,
    velocity:vec4<f32>,
    force:vec4<f32>,
    density:f32,
    pressure:f32,
  
    data1:f32,
    data2:f32
  };

  @group(0) @binding(0) var<storage, read_write> particlesData : array<ParticleData>;
  @group(0) @binding(1) var<storage, read_write> particle_Glo : Particle_global;

  @compute @workgroup_size(128)
  fn CsMain(
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_index: u32 
  ) {
    var i = workgroup_id.x * 128u + local_index ;
    var time = particle_Glo.time ;
    var NUM_PARTICLES = i32(10000);

    let SMOOTHING_LENGTH:f32 = particle_Glo.SMOOTHING_LENGTH ;

    let PARTICLE_MASS:f32 = particle_Glo.PARTICLE_MASS ;
    let PI_FLOAT:f32 = particle_Glo.PI_FLOAT ;
    let PARTICLE_STIFFNESS:f32 = particle_Glo.PARTICLE_STIFFNESS ;
    let PARTICLE_RESTING_DENSITY:f32 = particle_Glo.PARTICLE_RESTING_DENSITY ;

    let SMOOTHING_LENGTH2:f32 = SMOOTHING_LENGTH * SMOOTHING_LENGTH ;
    let SMOOTHING_LENGTH_p9:f32 = 64.0 * PI_FLOAT * pow(SMOOTHING_LENGTH, 9.0) ;
    let PARTICLE_MASS3:f32 = PARTICLE_MASS * 315.0 ;

    var particle_i:ParticleData = particlesData[i];

    // compute density
    var density_sum: f32 = 0.0;
    for (var j: i32 = 0; j < NUM_PARTICLES; j = j + 1) {
      var delta: vec3<f32> = particle_i.position.xyz - particlesData[j].position.xyz;
      var r: f32 = length(delta);
      if (r < SMOOTHING_LENGTH) {
        density_sum = density_sum + (PARTICLE_MASS3 * pow(SMOOTHING_LENGTH2 - r * r, 3.0) / SMOOTHING_LENGTH_p9);
      }
    }
    particlesData[i].density = density_sum;
    particlesData[i].pressure = max(PARTICLE_STIFFNESS * (density_sum - PARTICLE_RESTING_DENSITY), 0.0);
    // particlesData[i].density = 0.1 ;
    // particlesData[i].pressure = 0.1 ;
  }
`;
