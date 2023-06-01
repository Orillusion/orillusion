/**
 * @internal
 */
export let ParticleDataStructShader = /* wgsl */ `
    struct GlobalData {
        instance_index: u32,
        maxParticles: u32,
        time: f32,
        timeDelta: f32,

        duration: f32,
        isLoop: f32,
        simulatorSpace: u32,
        retain1: f32,

        emitterPos: vec4<f32>,

        gravity: vec3<f32>,
        spaceDamping: f32,

        enable_dirBySpeed: f32,
        enable_dirBySpeed1: f32,
        enable_dirBySpeed2: f32,
        enable_dirBySpeed3: f32,

        overLife_scale: array<vec4<f32>,2>,
        overLife_colors: array<vec4<f32>,2>,
        overLife_rotations: array<vec4<f32>,2>,
        cameraPos: vec4<f32>,

        textureSheet_ClipCol: u32,
        textureSheet_TotalClip: u32,
        textureSheet_PlayRate: f32,
        textureSheet_TextureWidth: u32,
        textureSheet_TextureHeight: u32,
        textureSheet_retain0: f32,
        textureSheet_retain1: f32,
        textureSheet_retain2: f32,
    };

    struct ParticleData {
        particleLifeDuration:f32,
        start_time:f32,
        life_time:f32,
        hide:f32,

        vPos:vec4<f32>,
        vRot:vec4<f32>,
        vScale:vec4<f32>,
        vColor:vec4<f32>,
        vSpeed:vec4<f32>,
        
        vForce_Pos:vec4<f32>,
        vForce_Rot:vec4<f32>,
        vForce_Scale:vec4<f32>,

        start_pos:vec4<f32>,
        start_size:vec4<f32>,
        start_rotation:vec4<f32>,

        start_velocity:vec4<f32>,
        start_acceleration:vec4<f32>,

        start_rotVelocity:vec4<f32>,
        start_rotAcceleration:vec4<f32>,

        start_scaleVelocity:vec4<f32>,
        start_scaleAcceleration:vec4<f32>,

        start_color:vec4<f32>,

        start_angularVelocity: vec4<f32>,

        textureSheet_Frame: u32,
        retain0: f32,
        retain1: f32,
        retain2: f32,
    };
`;
