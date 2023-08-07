import { Color } from '../../math/Color';
import { BlendMode } from '../BlendMode';
import { Engine3D } from '../../Engine3D';
import { RenderShader } from '../../gfx/graphics/webGpu/shader/RenderShader';

/**
 * @internal
 * GBufferPass
 * @group Material
 */
export class GBufferPass extends RenderShader {
    transparency: number;

    constructor() {
        super(`gbuffer_vs`, `gbuffer_fs`);
        this.setShaderEntry(`VertMain`, `FragMain`)
        let shaderState = this.shaderState;
        // shaderState.cullMode = `none`;

        this.setUniformColor(`baseColor`, new Color());
        this.setUniformColor(`emissiveColor`, new Color());
        this.setUniformFloat(`emissiveIntensity`, 1);
        this.setUniformFloat(`normalScale`, 1);
        this.setUniformFloat(`alphaCutoff`, 1);
        this.blendMode = BlendMode.NONE;
        this.setTexture(`normalMap`, Engine3D.res.normalTexture);
    }
}