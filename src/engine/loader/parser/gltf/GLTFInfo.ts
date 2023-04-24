/**
 * @internal
 * @group Loader
 */
export class GLTF_Info {
    public asset: {
        generator: string;
        version: string;
        minVersion: string;
    };

    public accessors: GLTF_Accessors[];

    public buffers: {
        isParsed: boolean;
        dbuffer: any;
        byteLength: number;
        uri: string;
    }[];

    public bufferViews: {
        isParsed: boolean;
        buffer: number;
        byteOffset: number;
        dbufferView: any;
        byteStride: number;
        byteLength: number;
    }[];

    public materials: {
        name: string;
        alphaModel: string;
        alphaCutoff: number;
    }[];

    public meshes: GLTF_Mesh[];

    public nodes: GLTF_Node[];

    public scene: number = 0;

    public scenes: GLTF_Scene;

    public textures: {
        isParsed: boolean;
        sampler: number;
        source: number;
        name: string;
        dtexture: any;
    }[];
    cameras: any;
    skins: any;
    resources: { [uri: string]: any };
    images: {
        uri: string;
        name: string;
        isParsed: any;
        dsampler: any;
        dimage: any;
        mimeType: string;
        bufferView: number;
    }[];
    samplers: {
        minFilter: number;
        magFilter: number;
        wrapS: number;
        wrapT: number;
    }[];
    animations: any;

    extensions: {
        KHR_lights_punctual: {
            lights: GLTF_Light[];
        };
    };
}

/**
 * @internal
 * @group Loader
 */
export class GLTF_Scene {
    public nodes: number[];
}

/**
 * @internal
 * @group Loader
 */
export class GLTF_Light {
    name: string;
    type: string;
    color: number[];
    intensity: number;
    range: number;
    spot: {
        outerConeAngle: number;
    };

    isParsed: boolean;
}

/**
 * @internal
 * @group Loader
 */
export class GLTF_Node {
    public name: string;
    public rotation: number[];
    public scale: number[];
    public translation: number[];
    public children: number[];
    public matrix: number[];
    mesh: number = -1;
    isParsed: any;
    dnode: any;
    camera: any;
    skin: any;
    nodeId: any;
    primitives: any;
    extensions: any;
    light: GLTF_Light;
}

/**
 * @internal
 * @group Loader
 */
export class GLTF_Primitives {
    public attributes: {
        POSITION: number;
        NORMAL: number;
        TANGENT: number;
        TEXCOORD_0: number;
        TEXCOORD_1: number;
    };

    public indices: number;
    public material: number;
    public mode: any;
    public name: any;
    public targets: any;
    public extensions: any;
    public morphTargetsRelative: boolean;
}

/**
 * @internal
 * @group Loader
 */
export class GLTF_Mesh {
    public name: string;
    public primitives: GLTF_Primitives[];
    isParsed: any;
    dprimitives: any;
    weights: any;
    extras: any;
}

/**
 * @internal
 * @group Loader
 */
export class GLTF_Accessors {
    public bufferView: number;
    public componentType: number;
    public count: number;
    public type: string;
    public max: number[];
    public min: number[];
    isParsed: any;
    daccessor: any;
    normalized: any;
    sparse: any;
    byteOffset: number;
    computeResult: { typedArray: any; arrayType: any; numComponents: number };
}
