import { ITexture } from "../../gfx/graphics/webGpu/core/texture/ITexture";
import { Texture } from "../../gfx/graphics/webGpu/core/texture/Texture";
import { GPUAddressMode } from "../../gfx/graphics/webGpu/WebGPUConst";
import { BitmapTexture2D } from "../../textures/BitmapTexture2D";
import { BitmapTexture2DArray } from "../../textures/BitmapTexture2DArray";

export class IESProfiles {
    public static use: boolean = false;
    public static iesTexture: BitmapTexture2DArray;
    public static ies_list: IESProfiles[] = [];
    private _iesTexture: Texture;
    public index: number = 0;
    constructor() {
    }

    /**
     * create ies image from ies file
     */
    private generateIES(file: any) {
        //TODO add create ies image from ies file
    }

    public set IESTexture(texture: Texture) {
        this._iesTexture = texture;
        texture.addressModeU = GPUAddressMode.repeat;
        texture.addressModeV = GPUAddressMode.repeat;
        texture.addressModeW = GPUAddressMode.repeat;
        if (IESProfiles.ies_list.indexOf(this) == -1) {
            this.index = IESProfiles.ies_list.length;
            IESProfiles.ies_list.push(this);
            if (!IESProfiles.iesTexture) {
                IESProfiles.create(texture.width, texture.height);
            }
            IESProfiles.iesTexture.addTexture(texture as BitmapTexture2D);
        }
    }

    public get IESTexture(): Texture {
        return this._iesTexture;
    }

    public static create(width: number, height: number) {
        let count = 48;
        this.iesTexture = new BitmapTexture2DArray(width, height, count);
    }
}