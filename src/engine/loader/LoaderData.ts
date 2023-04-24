import { Color } from '../math/Color';
import { Quaternion } from '../math/Quaternion';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

/**
 * @internal
 * @group Loader
 */
export class BufferInfo {
    public name: string;
    public start: number;
    public count: number;
}

/**
 * @internal
 * @group Loader
 */
export class TextureScaleInfo {
    public texSc: Vector2;
    public texOff: Vector2;
}

/**
 * @internal
 * @group Loader
 */
export class TextureInfo {
    public name: string;
    public fileName: string;
    public useMipmap: boolean;
    public wrapMode: number;
    public filterMode: number;
}

/**
 * @internal
 * @group Loader
 */
export class LightmapInfo {
    public mapNames: string[];
}

/**
 * @internal
 * @group Loader
 */
export class SubMeshInfo {
    public start: number;
    public count: number;
}

/**
 * @internal
 * @group Loader
 */
export class MeshInfo {
    public name: string;
    public att_p: number = -1;
    public p_s: number = -1;
    public att_n: number = -1;
    public n_s: number = -1;
    public att_t: number = -1;
    public t_s: number = -1;
    public att_u1: number = -1;
    public u1_s: number = -1;
    public att_u2: number = -1;
    public u2_s: number = -1;
    public att_c: number = -1;
    public c_s: number = -1;
    public dm: number = 0;
    public subms: SubMeshInfo[];
    public bv: BufferInfo[];
}

/**
 * @internal
 * @group Loader
 */
export class MaterialInfo {
    public name: string;
    public shader: string;
    public metalic: number;
    public roughnees: number;
    public bc: Color;
    public bTex: string;
    public bSc: TextureScaleInfo;
    public nTex: string;
    public nSc: TextureScaleInfo;
    public rTex: string;
    public rSc: TextureScaleInfo;
    public remaTex: string;
    public remaSc: TextureScaleInfo;
    public eTex: string;
    public eSc: TextureScaleInfo;
    public ec: Color;
    public aoTex: string;
    public aoSc: TextureScaleInfo;
    public aoIn: number;
    public lIndex: number;
    public lSc: Color;
    public blendMode: number;
    public cull: number;
    public alphaBlend: number;
    public recshadow: boolean;
    public castshadow: boolean;
}

/**
 * @internal
 * @group Loader
 */
export class Object3DInfo {
    public name: string;
    public p: Vector3;
    public r: Vector3;
    public s: Vector3;
    public q: Quaternion;
    public parent: string;
    public b_anis: string[];
    public b_mes: string[];
    public b_mats: string[];
    public b_texs: string[];
}
