import { ShaderLib } from '../../assets/shader/ShaderLib';
import { Texture } from '../../gfx/graphics/webGpu/core/texture/Texture';
import { GPUCompareFunction, GPUCullMode } from '../../gfx/graphics/webGpu/WebGPUConst';
import { MaterialBase } from '../MaterialBase';
import { registerMaterial } from "../MaterialRegister";
import SkyGBuffer_fs from '../../assets/shader/core/pass/SkyGBuffer_fs.wgsl?raw';

/**
 * @internal
 * @group Material
 */
export class SkyGBufferPass extends MaterialBase {
    transparency: number;

    constructor() {
        super();
        this.isPassMaterial = true;
        //OutLineSubPass
        ShaderLib.register("SkyGBuffer_fs", SkyGBuffer_fs);

        let shader = this.setShader(`sky_vs_frag_wgsl`, `SkyGBuffer_fs`);
        shader.setUniformFloat(`exposure`, 1.0);
        shader.setUniformFloat(`roughness`, 0.0);

        let shaderState = this.shaderState;
        shaderState.frontFace = `ccw`;
        shaderState.cullMode = GPUCullMode.front;
        shaderState.depthWriteEnabled = false;
        shaderState.depthCompare = GPUCompareFunction.less;
    }

    public get exposure(): number {
        return this.renderShader.uniforms['exposure'].value;
    }

    public set exposure(value: number) {
        this.renderShader.setUniformFloat(`exposure`, value);
    }

    public get roughness(): number {
        return this.renderShader.uniforms['roughness'].value;
    }

    public set roughness(value: number) {
        this.renderShader.setUniformFloat(`roughness`, value);
    }

    public set shadowMap(texture: Texture) { }

    public set envMap(texture: Texture) {
        // super.envMap = texture;
    }

    public set emissiveIntensity(v: number) {
        this.renderShader.setUniformFloat(`emissiveIntensity`, v);
    }

    public get emissiveIntensity(): number {
        return this.renderShader.uniforms['emissiveIntensity'].value;
    }

    public set normalScale(v: number) {
        this.renderShader.setUniformFloat(`normalScale`, v);
    }

    public get normalScale(): number {
        return this.renderShader.uniforms['normalScale'].value;
    }

    public set alphaCutoff(v: number) {
        this.renderShader.setUniformFloat(`alphaCutoff`, v);
    }

    public get alphaCutoff(): number {
        return this.renderShader.uniforms['alphaCutoff'].value;
    }
}

registerMaterial('SkyGBufferPass', SkyGBufferPass);