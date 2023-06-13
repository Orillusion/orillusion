import { GIProbeShader } from '../assets/shader/materials/GIProbeShader';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { Engine3D } from '../Engine3D';
import { Vector4 } from '../math/Vector4';
import { PhysicMaterial } from './PhysicMaterial';

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

export class GIProbeMaterial extends PhysicMaterial {
    static count = 0;

    constructor(type: GIProbeMaterialType = GIProbeMaterialType.CastGI, index: number = 0) {
        super();

        ShaderLib.register("GIProbeShader", GIProbeShader);
        this.setShader('GIProbeShader', 'GIProbeShader');

        let shader = this.getShader();
        shader.setDefine('USE_BRDF', true);
        shader.setShaderEntry(`VertMain`, `FragMain`);
        shader.setUniformVector4('probeUniform', new Vector4(index, type, 0, 0));
        let shaderState = shader.shaderState;
        shaderState.acceptShadow = false;
        shaderState.castShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;

        let bdrflutTex = Engine3D.res.getTexture(`BRDFLUT`);
        this.brdfLUT = bdrflutTex;

        this.baseMap = Engine3D.res.whiteTexture;
        this.normalMap = Engine3D.res.normalTexture;
        // this.aoMap = defaultTexture.whiteTexture;
        // this.maskMap = defaultTexture.maskTexture;
        // this.maskMap = defaultTexture.grayTexture;
        // shader.setDefine(`USE_ARMC`, false);
        this.emissiveMap = Engine3D.res.blackTexture;
    }

    debug() { }
}
