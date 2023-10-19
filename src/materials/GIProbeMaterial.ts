import { PassType, Shader } from '..';
import { GIProbeShader } from '../assets/shader/materials/GIProbeShader';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { Engine3D } from '../Engine3D';
import { RenderShaderPass } from '../gfx/graphics/webGpu/shader/RenderShaderPass';
import { Vector4 } from '../math/Vector4';
import { Material } from './Material';

/**
 * @internal
 * @group Material
 */
export enum GIProbeMaterialType {
    CastGI = 0,
    ReceiveGI = 1,
    CastDepth = 2,
    Other = 3,
}

export class GIProbeMaterial extends Material {
    static count = 0;

    constructor(type: GIProbeMaterialType = GIProbeMaterialType.CastGI, index: number = 0) {
        super();
        ShaderLib.register("GIProbeShader", GIProbeShader);

        this.shader = new Shader();
        let colorShader = new RenderShaderPass('GIProbeShader', 'GIProbeShader');
        colorShader.passType = PassType.COLOR;
        this.shader.addRenderPass(colorShader);

        colorShader.setDefine('USE_BRDF', true);
        colorShader.setShaderEntry(`VertMain`, `FragMain`);
        colorShader.setUniformVector4('probeUniform', new Vector4(index, type, 0, 0));
        let shaderState = colorShader.shaderState;
        shaderState.acceptShadow = false;
        shaderState.castShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;

        this.shader.setTexture("baseMap", Engine3D.res.whiteTexture);
        this.shader.setTexture("normalMap", Engine3D.res.normalTexture);
        this.shader.setTexture("emissiveMap", Engine3D.res.blackTexture);
    }

}
