import { ShaderLib } from '../../assets/shader/ShaderLib';
import { Texture } from '../../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../../math/Color';
import { defaultRes } from '../../textures/DefaultRes';
import { BlendMode } from '../BlendMode';
import { MaterialBase } from '../MaterialBase';
import { registerMaterial } from "../MaterialRegister";
import GBuffer_shader from '../../assets/shader/core/pass/GBuffer_shader.wgsl?raw';

/**
 * @internal
 * GBufferPass
 * @group Material
 */
export class GBufferPass extends MaterialBase {
    transparency: number;

    constructor() {
        super();
        this.isPassMaterial = true;
        //OutLineSubPass

        ShaderLib.register("gbuffer_vs", GBuffer_shader);
        ShaderLib.register("gbuffer_fs", GBuffer_shader);
        let shader = this.setShader(`gbuffer_vs`, `gbuffer_fs`);
        shader.setShaderEntry(`VertMain`, `FragMain`)

        let shaderState = this.shaderState;
        shaderState.cullMode = `none`;

        this.renderShader.setUniformColor(`baseColor`, new Color());
        this.renderShader.setUniformColor(`emissiveColor`, new Color());
        this.renderShader.setUniformFloat(`emissiveIntensity`, 1);
        this.renderShader.setUniformFloat(`normalScale`, 1);
        this.renderShader.setUniformFloat(`alphaCutoff`, 1);
        this.blendMode = BlendMode.NONE;

        this.renderShader.setTexture(`normalMap`, defaultRes.normalTexture);
    }

    public set shadowMap(texture: Texture) { }

    public set envMap(texture: Texture) {
        // super.envMap = texture;
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
registerMaterial('GBufferPass', GBufferPass);