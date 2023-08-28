import { Material } from "..";
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

        this.setDefault();

        this.baseMap = Engine3D.res.whiteTexture;
        this.normalMap = Engine3D.res.normalTexture;
        this.emissiveMap = Engine3D.res.blackTexture;
    }

    public clone(): Material {
        let litMaterial = new LitMaterial();

        let colorPass = litMaterial.defaultPass;
        colorPass.setUniform(`shadowBias`, this.defaultPass.getUniform(`shadowBias`));
        colorPass.setUniform(`transformUV1`, this.defaultPass.getUniform(`transformUV1`));
        colorPass.setUniform(`transformUV2`, this.defaultPass.getUniform(`transformUV2`));
        colorPass.setUniform(`baseColor`, this.defaultPass.getUniform(`baseColor`));
        colorPass.setUniform(`emissiveColor`, this.defaultPass.getUniform(`emissiveColor`));
        colorPass.setUniform(`materialF0`, this.defaultPass.getUniform(`materialF0`));
        colorPass.setUniform(`envIntensity`, this.defaultPass.getUniform(`envIntensity`));
        colorPass.setUniform(`normalScale`, this.defaultPass.getUniform(`normalScale`));
        colorPass.setUniform(`roughness`, this.defaultPass.getUniform(`roughness`));
        colorPass.setUniform(`metallic`, this.defaultPass.getUniform(`metallic`));
        colorPass.setUniform(`ao`, this.defaultPass.getUniform(`ao`));
        colorPass.setUniform(`roughness_min`, this.defaultPass.getUniform(`roughness_min`));
        colorPass.setUniform(`roughness_max`, this.defaultPass.getUniform(`roughness_max`));
        colorPass.setUniform(`metallic_min`, this.defaultPass.getUniform(`metallic_min`));
        colorPass.setUniform(`metallic_max`, this.defaultPass.getUniform(`metallic_max`));
        colorPass.setUniform(`emissiveIntensity`, this.defaultPass.getUniform(`emissiveIntensity`));
        colorPass.setUniform(`alphaCutoff`, this.defaultPass.getUniform(`alphaCutoff`));
        colorPass.setUniform(`ior`, this.defaultPass.getUniform(`ior`));
        colorPass.setUniform(`clearcoatFactor`, this.defaultPass.getUniform(`clearcoatFactor`));
        colorPass.setUniform(`clearcoatRoughnessFactor`, this.defaultPass.getUniform(`clearcoatRoughnessFactor`));
        colorPass.setUniform(`clearcoatColor`, this.defaultPass.getUniform(`clearcoatColor`));
        colorPass.setUniform(`clearcoatWeight`, this.defaultPass.getUniform(`clearcoatWeight`));

        colorPass.setTexture(`baseMap`, this.defaultPass.getTexture(`baseMap`));
        colorPass.setTexture(`normalMap`, this.defaultPass.getTexture(`normalMap`));
        colorPass.setTexture(`emissiveMap`, this.defaultPass.getTexture(`emissiveMap`));
        colorPass.setTexture(`aoMap`, this.defaultPass.getTexture(`aoMap`));
        colorPass.setTexture(`maskMap`, this.defaultPass.getTexture(`maskMap`));
        return litMaterial;
    }
}