export class GLTFType {
    public static readonly GLTF_NODE_INDEX_PROPERTY: 'GLTF_NODE_INDEX';

    public static readonly BASE_COLOR_UNIFORM = 'u_baseColorFactor';

    public static readonly BASE_COLOR_TEXTURE_UNIFORM = 'u_baseColorSampler';

    public static readonly METALROUGHNESS_UNIFORM = 'u_metallicRoughnessValues';

    public static readonly METALROUGHNESS_TEXTURE_UNIFORM = 'u_metallicRoughnessSampler';

    public static readonly NORMAL_TEXTURE_UNIFORM = 'u_normalSampler';

    public static readonly NORMAL_SCALE_UNIFORM = 'u_normalScale';

    public static readonly EMISSIVE_TEXTURE_UNIFORM = 'u_emissiveSampler';

    public static readonly EMISSIVE_FACTOR_UNIFORM = 'u_emissiveFactor';

    public static readonly OCCLUSION_TEXTURE_UNIFORM = 'u_occlusionSampler';

    public static readonly OCCLUSION_FACTOR_UNIFORM = 'u_occlusionFactor';

    public static readonly MAX_MORPH_TARGETS = 8;

    public static readonly MORPH_POSITION_PREFIX = 'a_morphPositions_';

    public static readonly MORPH_NORMAL_PREFIX = 'a_morphNormals_';

    public static readonly MORPH_TANGENT_PREFIX = 'a_morphTangents_';

    public static readonly MORPH_WEIGHT_UNIFORM = 'u_morphWeights';

    public static readonly SCENE_ROOT_SKELETON = 'SCENE_ROOT';

    public static readonly IDENTITY_INVERSE_BIND_MATRICES = 'IDENTITY_IBM';

    public static readonly JOINT_MATRICES_UNIFORM = 'u_jointMatrix';

    public static readonly ALPHA_CUTOFF_UNIFORM = 'u_alphaCutoff';
}