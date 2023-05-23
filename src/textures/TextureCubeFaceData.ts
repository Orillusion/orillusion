import { ErpImage2CubeMap } from "../gfx/generate/convert/ErpImage2CubeMap";
import { IBLEnvMapCreator } from "../gfx/generate/convert/IBLEnvMapCreator";
import { Texture } from "../gfx/graphics/webGpu/core/texture/Texture";

export class TextureCubeFaceData {
    public faceTextureRef: { [key: string]: { t: GPUTexture; v: GPUTextureView } };

    private _texture: Texture;
    constructor(texture: Texture) {
        this._texture = texture;
        this.faceTextureRef = {};

    }

    /**
     * fill this texture by a texture2D, which is a 360 panorama image
     * assign mipmap level
     * @param mip mipmap level
     * @param texture a panorama image
     * @returns
     */
    public uploadTexture(mip: number, texture: Texture): this {
        let gpuSource = this.getGpuSource(mip);
        ErpImage2CubeMap.makeTextureCube(texture, this._texture.width, gpuSource.v);
        return this;
    }


    /**
     * @private
     * @param texture texture reference
     * @returns this
     */
    public uploadErpTexture(texture: Texture): this {
        let gpuSource = this.getGpuSource(0);
        ErpImage2CubeMap.makeTextureCube(texture, this._texture.width, gpuSource.v);
        this.generateMipmap(texture);
        return this;
    }

    /**
     * get GPU texture raw data
     * @param mip mipmap level
     * @returns GPU texture raw data, including t: GPUTexture and v: GPUTextureView
     */
    public getGpuSource(mip: number): { t: GPUTexture; v: GPUTextureView } {
        let source: { t: GPUTexture; v: GPUTextureView } = this.faceTextureRef[mip];
        if (!source) {
            source = {
                t: this._texture.getGPUTexture(),
                v: this._texture.getGPUTexture().createView({
                    format: this._texture.format,
                    dimension: '2d-array',
                    baseMipLevel: mip,
                    mipLevelCount: 1,
                    arrayLayerCount: 6,
                }),
            };
            this.faceTextureRef[mip] = source;
        }
        return source;
    }

    /**
     * @private generateMipmap
     * @param texture texture reference
     */
    private generateMipmap(texture: Texture) {
        let mipmap: number = 1;
        while (mipmap < this._texture.mipmapCount) {
            this.generateMipmapAtLevel(mipmap, texture);
            mipmap++;
        }
    }

    /**
     * @private Generate a specified level of Mipmap
     * @param mipmap mipmap level
     * @param erpTexture ERP Texture Object
     * @param pow power
     */
    private generateMipmapAtLevel(mipmap: number, erpTexture: Texture, pow: number = 3.0): void {
        let mipFaceSize = this._texture.width / Math.pow(2, mipmap);
        let image = { width: mipFaceSize, height: mipFaceSize, erpTexture: erpTexture };
        let roughness = (mipmap + 1) / this._texture.mipmapCount;
        roughness = Math.pow(roughness, pow);
        let gpuSource = this.getGpuSource(mipmap);
        IBLEnvMapCreator.importantSample(image, mipFaceSize, roughness, gpuSource.v);
    }

}