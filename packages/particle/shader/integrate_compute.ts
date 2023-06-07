/**
 * @internal
 */
export let integrate_compute = /* wgsl */ `
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

  @compute @workgroup_size(256)
  fn CsMain(
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_index: u32 
  ) {
    var i = workgroup_id.x * 256u + local_index ;
    var particle_i:ParticleData = particlesData[i];
    var ii = particle_Glo.time ;

    let TIME_STEP = 0.0001 ;
    let WALL_DAMPING = particle_Glo.WALL_DAMPING;

    // integrate
    var acceleration:vec3<f32> = particle_i.force.xyz / particle_i.density;
    var new_velocity:vec3<f32> = particle_i.velocity.xyz + TIME_STEP * acceleration;
    var new_position:vec3<f32> = particle_i.position.xyz + TIME_STEP * new_velocity;


    var sizeX = 1.0 * 0.5 ;
    var sizeY = 1.0 ;
    var bounds_min = vec3<f32>(-sizeX,-sizeY,-sizeX);
    var bounds_max = vec3<f32>(sizeX,sizeY,sizeX);
    // boundary conditions
    if (new_position.x < bounds_min.x)
    {
        new_position.x = bounds_min.x + 0.001;
        new_velocity.x = new_velocity.x * (-1.0 * WALL_DAMPING);
    }
    else if (new_position.x > bounds_max.x)
    {
        new_position.x = bounds_max.x - 0.001;
        new_velocity.x = new_velocity.x * (-1.0 * WALL_DAMPING);
    }

     if (new_position.y < bounds_min.y)
    {
        new_position.y = bounds_min.y + 0.001 ;
        new_velocity.y = new_velocity.y * (-1.0 * WALL_DAMPING);
    }
    else if (new_position.y > bounds_max.y)
    {
        new_position.y = bounds_max.y - 0.001 ;
        new_velocity.y = new_velocity.y * (-1.0 * WALL_DAMPING);
    }

    if (new_position.z < bounds_min.z)
    {
        new_position.z = bounds_min.z + 0.001;
        new_velocity.z = new_velocity.z * (-1.0 * WALL_DAMPING);
    }
    else if (new_position.z > bounds_max.z)
    {
        new_position.z = bounds_max.z - 0.001 ;
        new_velocity.z = new_velocity.z * (-1.0 * WALL_DAMPING);
    }

    particlesData[i].velocity = vec4<f32>(new_velocity,1.0);
    particlesData[i].position = vec4<f32>(new_position.xyz, 1.0);
  }
`;
