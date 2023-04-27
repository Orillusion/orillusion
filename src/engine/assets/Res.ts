
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

/**
 * Resource management classes for textures, materials, models, and preset bodies.
 * @group Assets
 */
export class Res {
    private _texturePool: Map<string, Texture>;
    private _materialPool: Map<string, MaterialBase>;
    private _prefabPool: Map<string, Object3D>;
    private _gltfPool: Map<string, GLTF_Info>;

    /**
     * @constructor
     */
    constructor() {
        this._texturePool = new Map<string, Texture>();
        this._materialPool = new Map<string, MaterialBase>();
        this._prefabPool = new Map<string, Object3D>();
        this._gltfPool = new Map<string, GLTF_Info>;
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
     * @param name mateiral name
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
     * @param flipY use filp y or not
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

    public async loadJSON(url: string, loaderFunctions?: LoaderFunctions) {
        return await new FileLoader()
            .loadJson(url, loaderFunctions)
            .then(async (ret) => {
                return ret;
            })
            .catch((e) => {
            });
    }
}
