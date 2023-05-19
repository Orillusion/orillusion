
import { Object3D } from '../core/entities/Object3D';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { FileLoader } from '../loader/FileLoader';
import { LoaderFunctions } from '../loader/LoaderFunctions';
import { GLBParser } from '../loader/parser/gltf/GLBParser';
import { GLTFParser } from '../loader/parser/gltf/GLTFParser';
import { OBJParser } from '../loader/parser/OBJParser';
import { MaterialBase } from '../materials/MaterialBase';
import { BitmapTexture2D } from '../textures/BitmapTexture2D';
import { BitmapTextureCube } from '../textures/BitmapTextureCube';
import { HDRTextureCube } from '../textures/HDRTextureCube';
import { B3DMParser } from '../loader/parser/B3DMParser';
import { I3DMParser } from "../loader/parser/I3DMParser";
import { GLTF_Info } from '../loader/parser/gltf/GLTFInfo';
import { HDRTexture } from '../textures/HDRTexture';
import { LDRTextureCube } from '../textures/LDRTextureCube';
import { BRDFLUTGenerate } from '../gfx/generate/BrdfLUTGenerate';
import { Uint8ArrayTexture } from '../textures/Uint8ArrayTexture';
import { GUISprite } from '../components/gui/core/GUISprite';
import { GUITexture } from '../components/gui/core/GUITexture';
import { GUIAtlasTexture } from '../components/gui/core/GUIAtlasTexture';
import { FontParser, FontInfo } from '../loader/parser/FontParser';
import { fonts } from './Fonts';
import { AtlasParser } from '../loader/parser/AtlasParser';
import { Reference } from '../util/Reference';

/**
 * Resource management classes for textures, materials, models, and preset bodies.
 * @group Assets
 */
export class Res {
    private _texturePool: Map<string, Texture>;
    private _materialPool: Map<string, MaterialBase>;
    private _prefabPool: Map<string, Object3D>;
    // private _prefabLoaderPool: Map<string, PrefabLoader>;
    private _gltfPool: Map<string, GLTF_Info>;
    private _atlasList: Map<string, GUIAtlasTexture>;


    /**
     * @constructor
     */
    constructor() {
        this._texturePool = new Map<string, Texture>();
        this._materialPool = new Map<string, MaterialBase>();
        this._prefabPool = new Map<string, Object3D>();
        // this._prefabLoaderPool = new Map<string, PrefabLoader>;
        this._gltfPool = new Map<string, GLTF_Info>;
        this._atlasList = new Map<string, GUIAtlasTexture>();

        this.initDefault();
    }

    public getGltf(url: string): GLTF_Info {
        return this._gltfPool.get(url);
    }

    /**
     * add a texture with reference of url
     * @param url file path
     * @param texture source texture
     */
    public addTexture(url: string, texture: Texture) {
        this._texturePool.set(url, texture);
    }

    /**
     * get texture by url
     * @param url file path
     * @returns
     */
    public getTexture(url: string): Texture {
        return this._texturePool.get(url);
    }

    /**
     * add a material with reference of name
     * @param name material name
     * @param mat  target material
     */
    public addMat(name: string, mat: MaterialBase) {
        return this._materialPool.set(name, mat);
    }

    /**
     * get material by name
     * @param name material name
     * @returns
     */
    public getMat(name: string) {
        return this._materialPool.get(name);
    }

    /**
     * add prefab with reference name
     * @param name prefab name
     * @param rootScene root object of prefab
     */
    public addPrefab(name: string, rootScene: Object3D) {
        this._prefabPool.set(name, rootScene);
    }

    /**
     * get prefab by name
     * @param name prefab name
     * @returns
     */
    public getPrefab(name: string) {
        return this._prefabPool.get(name).instantiate();
    }


    public addAtlas(name: string, atlas: GUIAtlasTexture) {
        atlas.name = name;
        this._atlasList.set(name, atlas);
    }

    public getAtlas(name: string) {
        return this._atlasList.get(name);
    }

    public getGUISprite(id: string): GUISprite {
        for (let item of this._atlasList.values()) {
            let sprite = item.getSprite(id);
            if (sprite)
                return sprite;
        }
        return null;
    }

    /**
     * load a gltf file
     * @param url the url of file
     * @param loaderFunctions callback
     * @returns
     */
    public async loadGltf(url: string, loaderFunctions?: LoaderFunctions): Promise<Object3D> {
        if (this._prefabPool.has(url)) {
            return this._prefabPool.get(url) as Object3D;
        }

        let parser;
        let ext = url.substring(url.lastIndexOf('.')).toLowerCase();
        let loader = new FileLoader();
        if (ext == '.gltf') {
            parser = await loader.load(url, GLTFParser, loaderFunctions);

        } else {
            parser = await loader.load(url, GLBParser, loaderFunctions);
        }
        let obj = parser.data as Object3D;
        this._prefabPool.set(url, obj);
        this._gltfPool.set(url, parser.gltf);
        return obj;
        // return null;
    }

    /**
     * load obj file
     * @param url obj file path
     * @param loaderFunctions callback
     * @returns
     */
    public async loadObj(url: string, loaderFunctions?: LoaderFunctions): Promise<Object3D> {
        if (this._prefabPool.has(url)) {
            return this._prefabPool.get(url) as Object3D;
        }

        let parser;
        let ext = url.substring(url.lastIndexOf('.')).toLowerCase();
        let loader = new FileLoader();
        if (ext == ".obj") {
            parser = await loader.load(url, OBJParser, loaderFunctions);
        }
        let obj = parser.data as Object3D;
        this._prefabPool.set(url, obj);
        return obj;
        // return null;
    }

    /**
     * load b3dm file by url
     * @param url path of file
     * @param loaderFunctions callback
     * @returns
     */
    public async loadB3DM(url: string, loaderFunctions?: LoaderFunctions, userData?: any): Promise<Object3D> {
        if (this._prefabPool.has(url)) {
            return this._prefabPool.get(url) as Object3D;
        }
        let loader = new FileLoader();
        let parser = await loader.load(url, B3DMParser, loaderFunctions, userData);
        let obj = parser.data;
        this._prefabPool.set(url, obj);
        return obj;
    }

    /**
     * load i3dm file by url
     * @param url path of i3dm file
     * @param loaderFunctions callback
     * @returns
     */
    public async loadI3DM(url: string, loaderFunctions?: LoaderFunctions, userData?: any): Promise<Object3D> {
        if (this._prefabPool.has(url)) {
            return this._prefabPool.get(url) as Object3D;
        }
        let loader = new FileLoader();
        let parser = await loader.load(url, I3DMParser, loaderFunctions, userData);
        let obj = parser.data;
        this._prefabPool.set(url, obj);
        return obj;
    }

    /**
     * load texture by url
     * @param url texture path
     * @param loaderFunctions callback
     * @param flipY use flip y or not
     * @returns
     */
    public async loadTexture(url: string, loaderFunctions?: LoaderFunctions, flipY?: boolean) {
        if (this._texturePool.has(url)) {
            return this._texturePool.get(url);
        }
        let texture = new BitmapTexture2D();
        texture.flipY = flipY;
        await texture.load(url, loaderFunctions);
        this._texturePool.set(url, texture);
        return texture;
    }

    /**
     * load a hdr texture
     * @param url texture url
     * @param loaderFunctions callback
     * @returns
     */
    public async loadHDRTexture(url: string, loaderFunctions?: LoaderFunctions) {
        if (this._texturePool.has(url)) {
            return this._texturePool.get(url);
        }

        let hdrTexture = new HDRTexture();
        hdrTexture = await hdrTexture.load(url, loaderFunctions);
        this._texturePool.set(url, hdrTexture);
        return hdrTexture;
    }


    /**
     * load hdr cube texture
     * @param url file url
     * @param loaderFunctions callback
     * @returns
     */
    public async loadHDRTextureCube(url: string, loaderFunctions?: LoaderFunctions) {
        if (this._texturePool.has(url)) {
            return this._texturePool.get(url);
        }
        let hdrTexture = new HDRTextureCube();
        hdrTexture = await hdrTexture.load(url, loaderFunctions);
        this._texturePool.set(url, hdrTexture);
        return hdrTexture;
    }

    /**
     * load ldr cube texture
     * @param url file path
     * @param loaderFunctions callback
     * @returns
     */
    public async loadLDRTextureCube(url: string, loaderFunctions?: LoaderFunctions) {
        if (this._texturePool.has(url)) {
            return this._texturePool.get(url);
        }
        let ldrTextureCube = new LDRTextureCube();
        ldrTextureCube = await ldrTextureCube.load(url, loaderFunctions);
        this._texturePool.set(url, ldrTextureCube);
        return ldrTextureCube;
    }

    /**
     * load texture data from array of web url.
     * make sure there are six images in a group,
     * and the order is: nx, px, py, ny, nz, pz
     * @param urls 
     */
    public async loadTextureCubeMaps(urls: string[]) {
        let url = urls[0];
        if (this._texturePool.has(url)) {
            return this._texturePool.get(url);
        }

        let textureCube = new BitmapTextureCube();
        await textureCube.load(urls);
        this._texturePool.set(urls[0], textureCube);
        return textureCube;
    }

    /**
     * load texture data from url.
     * the image is assembled from six images into cross shaped image.
     * @param url the path of image
     */
    public async loadTextureCubeStd(url: string, loaderFunctions?: LoaderFunctions) {
        if (this._texturePool.has(url)) {
            return this._texturePool.get(url);
        }

        let cubeMap = new BitmapTextureCube();
        await cubeMap.loadStd(url);
        return cubeMap;
    }

    /**
     * load json data from url.
     * @param url the path of image
     */
    public async loadJSON(url: string, loaderFunctions?: LoaderFunctions) {
        return await new FileLoader()
            .loadJson(url, loaderFunctions)
            .then(async (ret) => {
                return ret;
            })
            .catch((e) => {
                console.log(e);
            });
    }


    /**
     * load font file by url
     * @param url font file url
     * @param loaderFunctions callback
     * @returns
     */
    public async loadFont(url: string, loaderFunctions?: LoaderFunctions, userData?: any): Promise<FontInfo> {
        let loader = new FileLoader();
        let parser = await loader.load(url, FontParser, loaderFunctions, userData);
        let data = parser.data as FontInfo;
        fonts.addFontData(data.face, data.size, data)
        return parser.data;
    }

    /**
     * load a atlas file by url
     * @param url file path
     * @param loaderFunctions callback
     * @returns
     */
    public async loadAtlas(url: string, loaderFunctions?: LoaderFunctions): Promise<FontInfo> {
        let loader = new FileLoader();
        let parser = await loader.load(url, AtlasParser, loaderFunctions, url);
        return parser.data;
    }

    /**
     * normal texture
     */
    public normalTexture: Uint8ArrayTexture;
    public maskTexture: Uint8ArrayTexture;
    public whiteTexture: Uint8ArrayTexture;
    public blackTexture: Uint8ArrayTexture;
    public redTexture: Uint8ArrayTexture;
    public blueTexture: Uint8ArrayTexture;
    public greenTexture: Uint8ArrayTexture;
    public yellowTexture: Uint8ArrayTexture;
    public grayTexture: Uint8ArrayTexture;

    public defaultSky: HDRTextureCube;

    public defaultGUITexture: GUITexture;
    public defaultGUISprite: GUISprite;

    /**
     * create a texture
     * @param width width of texture
     * @param height height of texture
     * @param r component-red
     * @param g component-green
     * @param b component-blue
     * @param a component-alpha（0 for transparent，1 for opaque）
     * @param name name string
     * @returns
     */
    public createTexture(width: number, height: number, r: number, g: number, b: number, a: number, name?: string) {
        let w = 32;
        let h = 32;
        let textureData = new Uint8Array(w * h * 4);
        this.fillColor(textureData, width, height, r, g, b, a);
        let texture = new Uint8ArrayTexture();
        texture.name = name;
        texture.create(16, 16, textureData, true);
        if (name) {
            this.addTexture(name, texture);
        }
        return texture;
    }

    /**
     * fill slod color to this texture
     * @param array data of texture
     * @param w width of texture
     * @param h height of texture
     * @param r component-red
     * @param g component-green
     * @param b component-blue
     * @param a component-alpha（0 for transparent，1 for opaque）
     */
    public fillColor(array: any, w: number, h: number, r: number, g: number, b: number, a: number) {
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                let pixelIndex = j * w + i;
                array[pixelIndex * 4 + 0] = r;
                array[pixelIndex * 4 + 1] = g;
                array[pixelIndex * 4 + 2] = b;
                array[pixelIndex * 4 + 3] = a;
            }
        }
    }

    /**
     * Initialize a common texture object. Provide a universal solid color texture object.
     */
    private initDefault() {
        this.normalTexture = this.createTexture(32, 32, 255 * 0.5, 255 * 0.5, 255.0, 255.0, 'default-normalTexture');
        this.maskTexture = this.createTexture(32, 32, 255, 255 * 0.5, 0.0, 255.0, 'default-maskTexture');
        this.whiteTexture = this.createTexture(32, 32, 255, 255, 255, 255, 'default-whiteTexture');
        this.blackTexture = this.createTexture(32, 32, 0, 0, 0, 255.0, 'default-blackTexture');
        this.redTexture = this.createTexture(32, 32, 255, 0, 0, 255.0, 'default-redTexture');
        this.blueTexture = this.createTexture(32, 32, 0, 0, 255, 255.0, 'default-blueTexture');
        this.greenTexture = this.createTexture(32, 32, 0, 255, 0, 255, 'default-greenTexture');
        this.yellowTexture = this.createTexture(32, 32, 0, 255, 255, 255.0, 'default-yellowTexture');
        this.grayTexture = this.createTexture(32, 32, 128, 128, 128, 255.0, 'default-grayTexture');

        let brdf = new BRDFLUTGenerate();
        let brdf_texture = brdf.generateBRDFLUTTexture();
        let BRDFLUT = brdf_texture.name = 'BRDFLUT';
        this.addTexture(BRDFLUT, brdf_texture);

        this.defaultSky = new HDRTextureCube();
        this.defaultSky.createFromTexture(128, this.blackTexture);

        Reference.getInstance().attached(this.defaultSky, this);
        Reference.getInstance().attached(brdf_texture, this);

        Reference.getInstance().attached(this.normalTexture, this);
        Reference.getInstance().attached(this.maskTexture, this);
        Reference.getInstance().attached(this.whiteTexture, this);
        Reference.getInstance().attached(this.blackTexture, this);
        Reference.getInstance().attached(this.redTexture, this);
        Reference.getInstance().attached(this.blueTexture, this);
        Reference.getInstance().attached(this.greenTexture, this);
        Reference.getInstance().attached(this.yellowTexture, this);
        Reference.getInstance().attached(this.grayTexture, this);
        this.defaultGUITexture = new GUITexture(this.whiteTexture);
        this.defaultGUISprite = new GUISprite(this.defaultGUITexture);
        this.defaultGUISprite.trimSize.set(4, 4)
    }
}
