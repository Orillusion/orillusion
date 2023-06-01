/**
 * @internal
 */
export let compute_force_compute = /* wgsl */ `
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
    var i = i32(workgroup_id.x * 128u + local_index) ;
    var NUM_PARTICLES = i32(10000);

    let SMOOTHING_LENGTH:f32 = particle_Glo.SMOOTHING_LENGTH ;
    let PARTICLE_MASS:f32 = particle_Glo.PARTICLE_MASS ;
    let PI_FLOAT:f32 = particle_Glo.PI_FLOAT ;
    let PARTICLE_VISCOSITY = particle_Glo.PARTICLE_VISCOSITY ;

    let GRAVITY_FORCE = particle_Glo.gravity;

    var SMOOTHING_LENGTH_p6 = (PI_FLOAT * pow(SMOOTHING_LENGTH, 6.0));

    // compute all forces
    var pressure_force: vec3<f32> = vec3<f32>(0.0);
    var viscosity_force: vec3<f32> = vec3<f32>(0.0);

    var particle_i:ParticleData = particlesData[i];
    for (var j: i32 = 0; j < NUM_PARTICLES; j = j + 1) {
        if (i == j) {
            continue;
        }
        var particle_j:ParticleData = particlesData[j];
        var delta:vec3<f32> = particle_i.position.xyz - particle_j.position.xyz;
        var r:f32 = length(delta);
        if (r < SMOOTHING_LENGTH)
        {
            pressure_force = pressure_force - (PARTICLE_MASS * (particle_i.pressure + particle_j.pressure) / (2.0 * particle_j.density) * -45.0 / SMOOTHING_LENGTH_p6 * pow(SMOOTHING_LENGTH - r, 2.0) * normalize(delta));
            viscosity_force = viscosity_force + (PARTICLE_MASS * (particle_j.velocity.xyz - particle_i.velocity.xyz) / particle_j.density * 45.0 / SMOOTHING_LENGTH_p6 * (SMOOTHING_LENGTH - r));
        }
    }
    viscosity_force = viscosity_force * PARTICLE_VISCOSITY;
    var external_force:vec3<f32> = vec3<f32>(particle_i.density * GRAVITY_FORCE);

    particlesData[i].force = vec4<f32>(pressure_force + viscosity_force + external_force,1.0);
  }
`;
