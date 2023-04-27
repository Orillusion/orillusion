import { Engine3D } from '../Engine3D';
import { BRDFLUTGenerate } from '../gfx/generate/BrdfLUTGenerate';
import { Uint8ArrayTexture } from './Uint8ArrayTexture';
import { Texture } from "../gfx/graphics/webGpu/core/texture/Texture";
import { HDRTextureCube } from './HDRTextureCube';

/**
 * default internal texture 
 * @internal
 * @group Texture
 */
class _DefaultRes {
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
    public defaultTextureKVMap: { [name: string]: Texture } = {};
    public defaultTextureVKMap: Map<Texture, string> = new Map<Texture, string>();
    public defaultSky: HDRTextureCube;
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
            this.recordTexture(name, texture);
        }
        return texture;
    }

    public recordTexture(name: string, texture: Texture) {
        this.defaultTextureKVMap[name] = texture;
        this.defaultTextureVKMap.set(texture, name);
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
    public async initCommon() {
        defaultRes.normalTexture = defaultRes.createTexture(32, 32, 255 * 0.5, 255 * 0.5, 255.0, 255.0, 'default-normalTexture');
        defaultRes.maskTexture = defaultRes.createTexture(32, 32, 255, 255 * 0.5, 0.0, 255.0, 'default-maskTexture');
        defaultRes.whiteTexture = defaultRes.createTexture(32, 32, 255, 255, 255, 255, 'default-whiteTexture');
        defaultRes.blackTexture = defaultRes.createTexture(32, 32, 0, 0, 0, 255.0, 'default-blackTexture');
        defaultRes.redTexture = defaultRes.createTexture(32, 32, 255, 0, 0, 255.0, 'default-redTexture');
        defaultRes.blueTexture = defaultRes.createTexture(32, 32, 0, 0, 255, 255.0, 'default-blueTexture');
        defaultRes.greenTexture = defaultRes.createTexture(32, 32, 0, 255, 0, 255, 'default-greenTexture');
        defaultRes.yellowTexture = defaultRes.createTexture(32, 32, 0, 255, 255, 255.0, 'default-yellowTexture');
        defaultRes.grayTexture = defaultRes.createTexture(32, 32, 128, 128, 128, 255.0, 'default-grayTexture');

        let brdf = new BRDFLUTGenerate();
        let texture = brdf.generateBRDFLUTTexture();
        let BRDFLUT = texture.name = 'BRDFLUT';
        Engine3D.res.addTexture(BRDFLUT, texture);
        this.recordTexture(BRDFLUT, texture);

        defaultRes.defaultSky = new HDRTextureCube();
        defaultRes.defaultSky.createFromTexture(128, defaultRes.blackTexture);
    }
}

/**
 * @internal
 * default internal texture
 * @group Texture
 */
export let defaultRes = new _DefaultRes();
