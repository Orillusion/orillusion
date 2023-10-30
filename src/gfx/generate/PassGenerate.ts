import { RenderNode } from '../../components/renderer/RenderNode';
import { RendererMaskUtil, RendererMask } from '../renderJob/passRenderer/state/RendererMask';
import { PassType } from '../renderJob/passRenderer/state/RendererType';
import { GLTFType } from '../../loader/parser/gltf/GLTFType';
import { Shader } from '../graphics/webGpu/shader/Shader';
import { SkyGBufferPass } from '../../materials/multiPass/SkyGBufferPass';
import { GBufferPass } from '../../materials/multiPass/GBufferPass';
import { VertexAttributeName } from '../../core/geometry/VertexAttributeName';
import { CastShadowMaterialPass } from '../../materials/multiPass/CastShadowMaterialPass';
import { CastPointShadowMaterialPass } from '../../materials/multiPass/CastPointShadowMaterialPass';
import { DepthMaterialPass } from '../../materials/multiPass/DepthMaterialPass';

/**
 * @internal
 * @group GFX
 */
export class PassGenerate {
    public static createGIPass(renderNode: RenderNode, shader: Shader) {
        if (RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.Sky)) {
            let pass0 = shader.passShader.get(PassType.GI);
            if (!pass0) {
                let colorPass = shader.getSubShaders(PassType.COLOR)[0];
                let pass = new SkyGBufferPass();
                pass.setTexture(`baseMap`, colorPass.getTexture('baseMap'));
                pass.cullMode = colorPass.cullMode;
                pass.frontFace = colorPass.frontFace;
                shader.addRenderPass(pass, 0);
                pass.preCompile(renderNode.geometry);
            }

        } else {
            this.castGBufferPass(renderNode, shader);
        }
    }

    public static castGBufferPass(renderNode: RenderNode, shader: Shader) {
        let colorPassList = shader.getDefaultShaders();
        for (let jj = 0; jj < colorPassList.length; jj++) {
            const colorPass = colorPassList[jj];

            let giPassList = shader.getSubShaders(PassType.GI);
            if (!giPassList || giPassList.length == 0 || giPassList.length < jj) {
                let pass = new GBufferPass();
                pass.setTexture('baseMap', colorPass.getTexture("baseMap"));
                pass.setTexture('normalMap', colorPass.getTexture("normalMap"));
                pass.setTexture('emissiveMap', colorPass.getTexture("emissiveMap"));

                pass.setUniform('baseColor', colorPass.getUniform("baseColor"));
                pass.setUniform('envIntensity', colorPass.getUniform("envIntensity"));
                pass.setUniform('emissiveColor', colorPass.getUniform("emissiveColor"));
                pass.setUniform('emissiveIntensity', colorPass.getUniform("emissiveIntensity"));
                pass.setUniform('alphaCutoff', colorPass.getUniform("alphaCutoff"));

                pass.cullMode = colorPass.cullMode;
                pass.frontFace = colorPass.frontFace;
                pass.preCompile(renderNode.geometry);
                shader.addRenderPass(pass);
            }
        }
    }

    public static createShadowPass(renderNode: RenderNode, shader: Shader) {
        let use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);
        let useTangent = renderNode.geometry.hasAttribute(VertexAttributeName.TANGENT);
        let useMorphTargets = renderNode.geometry.hasAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
        let useMorphNormals = renderNode.geometry.hasAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');

        let colorPassList = shader.getSubShaders(PassType.COLOR);
        for (let i = 0; i < colorPassList.length; i++) {
            const colorPass = colorPassList[i];
            let shadowPassList = shader.getSubShaders(PassType.SHADOW);
            if (!shadowPassList || shadowPassList.length < (i + 1)) {
                let shadowPass = new CastShadowMaterialPass();
                shadowPass.setTexture(`baseMap`, colorPass.getTexture(`baseMap`));
                shadowPass.setUniform(`alphaCutoff`, colorPass.getUniform(`alphaCutoff`));
                // shadowPass.setDefine("USE_ALPHACUT", colorPass.shaderState.alphaCutoff < 1.0);
                if (useTangent) {
                    shadowPass.setDefine(`USE_TANGENT`, useTangent);
                }
                if (use_skeleton) {
                    shadowPass.setDefine(`USE_SKELETON`, use_skeleton);
                }
                if (useMorphTargets) {
                    shadowPass.setDefine(`USE_MORPHTARGETS`, useMorphTargets);
                }
                if (useMorphNormals) {
                    shadowPass.setDefine(`USE_MORPHNORMALS`, useMorphNormals);
                }
                // shadowMaterialPass.shaderState.cullMode = material.getShader().cullMode;
                if (colorPass.cullMode == `none`) {
                    shadowPass.shaderState.cullMode = `none`;
                } else if (colorPass.cullMode == `back`) {
                    shadowPass.shaderState.cullMode = `front`;
                } else if (colorPass.cullMode == `front`) {
                    shadowPass.shaderState.cullMode = `back`;
                }
                shadowPass.preCompile(renderNode.geometry);
                shader.addRenderPass(shadowPass);
            }

            let castPointShadowPassList = shader.getSubShaders(PassType.POINT_SHADOW);
            if (!castPointShadowPassList || castPointShadowPassList.length < (i + 1)) {
                let castPointShadowPass = new CastPointShadowMaterialPass();
                castPointShadowPass.setTexture(`baseMap`, colorPass.getTexture(`baseMap`));
                castPointShadowPass.setUniform(`alphaCutoff`, colorPass.getUniform(`alphaCutoff`));
                castPointShadowPass.setDefine("USE_ALPHACUT", 1);
                // castPointShadowPass.doubleSide = false ;
                for (let j = 0; j < 1; j++) {
                    if (useTangent) {
                        castPointShadowPass.setDefine(`USE_TANGENT`, useTangent);
                    }
                    if (use_skeleton) {
                        castPointShadowPass.setDefine(`USE_SKELETON`, use_skeleton);
                    }
                    if (useMorphTargets) {
                        castPointShadowPass.setDefine(`USE_MORPHTARGETS`, useMorphTargets);
                    }
                    if (useMorphNormals) {
                        castPointShadowPass.setDefine(`USE_MORPHNORMALS`, useMorphNormals);
                    }
                    castPointShadowPass.shaderState.cullMode = `front`;
                    castPointShadowPass.preCompile(renderNode.geometry);
                }
                shader.addRenderPass(castPointShadowPass);
            }
        }
    }

    public static createDepthPass(renderNode: RenderNode, shader: Shader) {
        let colorListPass = shader.getSubShaders(PassType.COLOR);
        let useTangent = renderNode.geometry.hasAttribute('TANGENT');
        let useMorphTargets = renderNode.geometry.hasAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
        let useMorphNormals = renderNode.geometry.hasAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');
        let use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);

        for (let i = 0; i < colorListPass.length; i++) {
            const colorPass = colorListPass[i];
            let depthPassList = shader.getSubShaders(PassType.DEPTH);
            if (!depthPassList && colorPass.shaderState.useZ) {
                if (!depthPassList || depthPassList.length < i) {
                    let depthPass = new DepthMaterialPass();
                    depthPass.setTexture(`baseMap`, colorPass.getTexture(`baseMap`));
                    if (!useTangent) {
                        depthPass.setDefine(`USE_TANGENT`, useTangent);
                    }
                    if (use_skeleton) {
                        depthPass.setDefine(`USE_SKELETON`, use_skeleton);
                    }
                    if (useMorphTargets) {
                        depthPass.setDefine(`USE_MORPHTARGETS`, useMorphTargets);
                    }
                    if (useMorphNormals) {
                        depthPass.setDefine(`USE_MORPHNORMALS`, useMorphNormals);
                    }
                    depthPass.cullMode = colorPass.cullMode;
                    depthPass.frontFace = colorPass.frontFace;
                    depthPass.preCompile(renderNode.geometry);
                    shader.addRenderPass(depthPass);
                }
            }
        }
    }
}
