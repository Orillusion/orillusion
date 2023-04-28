import { StringUtil } from '../../../util/StringUtil';
import { FileLoader } from '../../FileLoader';
import { ParserBase } from '../ParserBase';
import { GLTF_Info } from './GLTFInfo';
import { GLTFSubParser } from './GLTFSubParser';

/**
 * GLTF file Parser
 * @internal
 * @group Loader
 */
export class GLTFParser extends ParserBase {
    static format: string = 'json';
    private _gltf: GLTF_Info;

    public async parserJson(obj: object) {
        this._gltf = new GLTF_Info();
        this._gltf = { ...this._gltf, ...obj };
        this._gltf.resources = {};
        // load bin & texture together
        await Promise.all([this.load_gltf_bin(), this.load_gltf_textures()])
        //step 0: load bin
        //step 1: parser mesh
        //await this.load_gltf_bin();
        //step 2: load texture
        //await this.load_gltf_textures();
        let subParser = new GLTFSubParser();
        let nodes = await subParser.parse(this.initUrl, this._gltf, this._gltf.scene);
        subParser.destory();
        subParser = null
        if (nodes) {
            this.data = nodes.rootNode;
            return nodes.rootNode;
        }
        this._gltf = null;
        return null;
    }

    /**
     * Verify parsing validity
     * @param ret
     * @returns
     */
    public verification(): boolean {
        if (this.data) {
            return true;
        }
        throw new Error('Method not implemented.');
    }



    private static _counter = 0;
    public static getMeshNameCounter() {
        return function getMeshNameCounter() {
            return `GLTF_NO_NAME_PRIMITIVE_${GLTFParser._counter++}`;
        };
    }

    public static getModelNameCounter() {
        let counter = 0;

        return function getModelNameCounter() {
            return `GLTF_NO_NAME_MESH_${counter++}`;
        };
    }

    public static getTexCoordDefine(texNum) {
        return `UV_NUM ${texNum}`;
    }

    public static getVertexColorDefine(num) {
        return `HAS_VERTEXCOLOR ${num}`;
    }

    public static getBaseColorTextureDefine() {
        return 'HAS_BASECOLORMAP';
    }

    public static getMetalRoughnessDefine() {
        return 'HAS_METALROUGHNESSMAP';
    }

    public static getNormalMapDefine() {
        return 'HAS_NORMALMAP';
    }

    public static getEmissiveMapDefine() {
        return 'HAS_EMISSIVEMAP';
    }

    public static getOcclusionMapDefine() {
        return 'HAS_OCCLUSIONMAP';
    }

    public static getMorphTargetsDefine(targetNum) {
        return `MORPH_TARGET_NUM ${targetNum}`;
    }

    public static getMorphtargetPositionDefine() {
        return 'HAS_MORPH_POSITION';
    }

    public static getMorphtargetNormalDefine() {
        return 'HAS_MORPH_NORMAL';
    }

    public static getMorphtargetTangentDefine() {
        return 'HAS_MORPH_TANGENT';
    }

    public static getJointsNumDefine(num) {
        return `JOINTS_NUM ${num}`;
    }

    public static getJointVec8Define() {
        return 'JOINT_VEC8';
    }

    public static getHasNormalDefine() {
        return 'HAS_NORMAL';
    }

    public static getHasTangentDefine() {
        return 'HAS_TANGENT';
    }

    public static getHasNormalMapDefine() {
        return 'HAS_NORMAL_MAP';
    }

    public static getAlphaMaskDefine() {
        return 'ALPHA_MASK';
    }

    public static getAlphaBlendDefine() {
        return 'ALPHA_BLEND';
    }

    public static readonly defaultMaterial = {
        name: 'GLTF_DEFAULT_MATERIAL',
        alphaCutoff: 0.33,
        alphaMode: 'MASK',
        pbrMetallicRoughness: {
            name: 'GLTF_DEFAULT_MATERIAL',
            defines: [],
            doubleSided: false,
            baseColorFactor: [1, 1, 1, 1],
            metallicFactor: 1,
            roughnessFactor: 1,
            emissiveFactor: [0, 0, 0],
        },
    };

    private async load_gltf_bin() {
        if (this._gltf.buffers && this._gltf.buffers.length > 0) {
            let binArray = []
            for (let i = 0; i < this._gltf.buffers.length; i++) {
                const element = this._gltf.buffers[i];
                if (element.uri.substring(0, 5) !== 'data:') {
                    let url = StringUtil.parseUrl(this.baseUrl, element.uri)
                    if (this.loaderFunctions?.onUrl)
                        url = await this.loaderFunctions.onUrl(url)
                    let promise = new FileLoader().loadBinData(url, this.loaderFunctions).then(loader => {
                        this._gltf.resources[element.uri] = loader;
                    })
                    binArray.push(promise);
                }
            }
            await Promise.all(binArray)
        }
    }

    private async load_gltf_textures() {
        let gltf = this._gltf;
        if (this._gltf.images) {
            let textureArray = []
            for (let i = 0; i < this._gltf.images.length; i++) {
                const element = this._gltf.images[i];
                if (element.uri) {
                    let url = StringUtil.parseUrl(this.baseUrl, element.uri)
                    if (this.loaderFunctions?.onUrl)
                        url = await this.loaderFunctions.onUrl(url)
                    let promise = new FileLoader().loadAsyncBitmapTexture(url, this.loaderFunctions).then(texture => {
                        texture.name = StringUtil.getURLName(element.uri);
                        this._gltf.resources[texture.name] = texture;
                    })
                    textureArray.push(promise)
                }
            }
            await Promise.all(textureArray)
        }
    }
}
