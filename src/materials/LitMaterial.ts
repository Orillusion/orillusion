import { Engine3D } from "../Engine3D";
import { RenderShader } from "../gfx/graphics/webGpu/shader/RenderShader";
import { RendererType } from "../gfx/renderJob/passRenderer/state/RendererType";
import { PhysicMaterial } from "./PhysicMaterial";

export class LitMaterial extends PhysicMaterial {
    constructor() {
        super();

        let colorPass = new RenderShader('PBRLItShader', 'PBRLItShader');
        this.defaultPass = colorPass;

        colorPass.setShaderEntry(`VertMain`, `FragMain`)
        let shaderState = colorPass.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;

        let bdrflutTex = Engine3D.res.getTexture(`BRDFLUT`);
        this.brdfLUT = bdrflutTex;
        colorPass.setDefine('USE_BRDF', true);

        this.addPass(RendererType.COLOR, colorPass);
        this.setDefault();

        this.baseMap = Engine3D.res.whiteTexture;
        this.normalMap = Engine3D.res.normalTexture;
        this.emissiveMap = Engine3D.res.blackTexture;
    }
}