import { ShaderUtil } from "..";
import { Engine3D } from "../Engine3D";
import { GPUCompareFunction, GPUCullMode } from "../gfx/graphics/webGpu/WebGPUConst";
import { Texture } from "../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShader } from "../gfx/graphics/webGpu/shader/RenderShader";
import { RendererType } from "../gfx/renderJob/passRenderer/state/RendererType";
import { Vector3 } from "../math/Vector3";
import { Material } from "./Material";

/**
 * @internal
 * @group Material
 */
export class SkyMaterial extends Material {

    constructor() {
        super();

        let colorPass = new RenderShader('sky_vs_frag_wgsl', 'sky_fs_frag_wgsl');
        this.defaultPass = colorPass;
        colorPass.setUniformVector3(`eyesPos`, new Vector3());
        colorPass.setUniformFloat(`exposure`, 1.0);
        colorPass.setUniformFloat(`roughness`, 0.0);

        let shaderState = colorPass.shaderState;
        shaderState.frontFace = `cw`;
        shaderState.cullMode = GPUCullMode.back;
        shaderState.depthWriteEnabled = false;
        shaderState.depthCompare = GPUCompareFunction.less;

    }

    /**
     *  Set base map(main map)
     */
    public set baseMap(texture: Texture) {
        this.defaultPass.setTexture(`baseMap`, texture);
        const key = 'IS_HDR_SKY';
        if (this.defaultPass.defineValue[key] != texture?.isHDRTexture) {
            this.defaultPass.setDefine(key, texture?.isHDRTexture ? true : false);
        }
    }

    /**
     * Get base map(main map)
    //  */
    public get baseMap(): Texture {
        return this.defaultPass.getTexture(`baseMap`);
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
        return this.defaultPass.uniforms[`roughness`].value;
    }
    public set roughness(value: number) {
        if (`roughness` in this.defaultPass.uniforms) this.defaultPass.uniforms[`roughness`].value = value;
    }
}
