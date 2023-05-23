import { Engine3D } from '../Engine3D';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { GPUCompareFunction, GPUCullMode } from '../gfx/graphics/webGpu/WebGPUConst';
import { Vector3 } from '../math/Vector3';
import { MaterialBase } from './MaterialBase';
import { registerMaterial } from "./MaterialRegister";

/**
 * @internal
 * @group Material
 */
export class SkyMaterial extends MaterialBase {
    transparency: number;
    // roughness: number;
    metallic: number;

    constructor() {
        super();

        this.setShader('sky_vs_frag_wgsl', 'sky_fs_frag_wgsl');
        this.getShader().setUniformVector3(`eyesPos`, new Vector3());
        this.getShader().setUniformFloat(`exposure`, 1.0);
        this.getShader().setUniformFloat(`roughness`, 0.0);

        let shaderState = this.getShader().shaderState;
        shaderState.frontFace = `cw`;
        shaderState.cullMode = GPUCullMode.back;
        shaderState.depthWriteEnabled = false;
        shaderState.depthCompare = GPUCompareFunction.less;
    }

    /**
     *  Set base map(main map)
     */
    public set baseMap(texture: Texture) {
        super.baseMap = texture;
        const key = 'IS_HDR_SKY';
        if (this.renderShader.defineValue[key] != texture?.isHDRTexture) {
            this.renderShader.setDefine(key, texture?.isHDRTexture ? true : false);
        }
    }

    /**
     * Get base map(main map)
     */
    public get baseMap(): Texture {
        return super.baseMap;
    }

    public set envMap(texture: Texture) {
        //not need env texture
    }

    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }

    public get exposure() {
        return Engine3D.setting.sky.skyExposure;
    }
    public set exposure(value: number) {
        Engine3D.setting.sky.skyExposure = value;
    }

    public get roughness() {
        return this.renderShader.uniforms[`roughness`].value;
    }
    public set roughness(value: number) {
        if (`roughness` in this.renderShader.uniforms) this.renderShader.uniforms[`roughness`].value = value;
    }
}

registerMaterial('SkyMaterial', SkyMaterial);