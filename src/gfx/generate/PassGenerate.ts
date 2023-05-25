import { RenderNode } from '../../components/renderer/RenderNode';
import { MaterialBase } from '../../materials/MaterialBase';
import { CastPointShadowMaterialPass } from '../../materials/multiPass/CastPointShadowMaterialPass';
import { CastShadowMaterialPass } from '../../materials/multiPass/CastShadowMaterialPass';
import { DepthMaterialPass } from '../../materials/multiPass/DepthMaterialPass';
import { GBufferPass } from '../../materials/multiPass/GBufferPass';
import { SkyGBufferPass } from '../../materials/multiPass/SkyGBufferPass';
import { RendererMaskUtil, RendererMask } from '../renderJob/passRenderer/state/RendererMask';
import { RendererType } from '../renderJob/passRenderer/state/RendererType';
import { GLTFType } from '../../loader/parser/gltf/GLTFType';

/**
 * @internal
 * @group GFX
 */
export class PassGenerate {
    public static createGIPass(renderNode: RenderNode, material: MaterialBase) {
        if (RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.Sky)) {
            let pass = new SkyGBufferPass();
            pass.baseMap = material.baseMap;

            let baseMat = material;
            let shader = pass.getShader();
            shader.shaderState.cullMode = baseMat.getShader().cullMode;
            shader.shaderState.frontFace = baseMat.getShader().frontFace;

            material.addPass(RendererType.GI, pass, 0);
            pass.renderShader.preCompile(renderNode.geometry);
        } else {
            this.castGBufferPass(renderNode, material);
        }
    }

    public static castGBufferPass(renderNode: RenderNode, material: MaterialBase) {
        for (let i = 0; i < renderNode.materials.length; i++) {
            const mat = renderNode.materials[i];
            let pass = mat.renderShader.getPassShader(RendererType.GI);
            if (!pass) {
                pass = new GBufferPass();
                let renderShader = pass.renderShader;
                pass.baseColor = mat.baseColor;
                pass.baseMap = mat.baseMap;
                pass.normalMap = mat.normalMap;
                pass.envIntensity = mat.envIntensity;

                pass.emissiveMap = mat.emissiveMap;
                pass.emissiveColor = mat.emissiveColor;
                pass.emissiveIntensity = mat.emissiveIntensity;

                pass.alphaCutoff = mat.alphaCutoff;

                let baseMat = renderNode.materials[0];
                let shader = pass.getShader();
                shader.shaderState.cullMode = baseMat.getShader().cullMode;
                shader.shaderState.frontFace = baseMat.getShader().frontFace;
                renderShader.preCompile(renderNode.geometry);
                mat.renderShader.setPassShader(RendererType.GI, pass);
            }
            material.addPass(RendererType.GI, pass, i);
        }
    }

    public static createShadowPass(renderNode: RenderNode, material: MaterialBase) {
        let use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);
        let useTangent = renderNode.geometry.hasAttribute('TANGENT');
        let useMorphTargets = renderNode.geometry.hasAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
        let useMorphNormals = renderNode.geometry.hasAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');

        let shadowMaterialPass = material.renderShader.getPassShader(RendererType.SHADOW);
        if (!shadowMaterialPass) {
            shadowMaterialPass = new CastShadowMaterialPass();
            shadowMaterialPass.baseMap = renderNode.materials[0].baseMap;
            shadowMaterialPass.alphaCutoff = renderNode.materials[0].alphaCutoff;
            shadowMaterialPass.setDefine("USE_ALPHACUT", renderNode.materials[0].alphaCutoff < 1.0);
            for (let j = 0; j < 1; j++) {
                const renderShader = shadowMaterialPass.renderShader;
                if (useTangent) {
                    renderShader.setDefine(`USE_TANGENT`, useTangent);
                }
                if (use_skeleton) {
                    renderShader.setDefine(`USE_SKELETON`, use_skeleton);
                }
                if (useMorphTargets) {
                    renderShader.setDefine(`USE_MORPHTARGETS`, useMorphTargets);
                }
                if (useMorphNormals) {
                    renderShader.setDefine(`USE_MORPHNORMALS`, useMorphNormals);
                }
                // renderShader.shaderState.cullMode = material.getShader().cullMode;
                if (material.getShader().cullMode == `none`) {
                    renderShader.shaderState.cullMode = `none`;
                } else if (material.getShader().cullMode == `back`) {
                    renderShader.shaderState.cullMode = `front`;
                } else if (material.getShader().cullMode == `front`) {
                    renderShader.shaderState.cullMode = `back`;
                }
                renderShader.preCompile(renderNode.geometry);
            }
            material.renderShader.setPassShader(RendererType.SHADOW, shadowMaterialPass);
        }
        material.addPass(RendererType.SHADOW, shadowMaterialPass, 0);

        let castPointShadowMaterialPass = material.renderShader.getPassShader(RendererType.POINT_SHADOW);
        if (!castPointShadowMaterialPass) {
            castPointShadowMaterialPass = new CastPointShadowMaterialPass();
            castPointShadowMaterialPass.baseMap = renderNode.materials[0].baseMap;
            castPointShadowMaterialPass.alphaCutoff = renderNode.materials[0].alphaCutoff;
            castPointShadowMaterialPass.setDefine("USE_ALPHACUT", renderNode.materials[0].alphaCutoff < 1.0);
            // castPointShadowMaterialPass.doubleSide = false ;
            for (let j = 0; j < 1; j++) {
                const renderShader = castPointShadowMaterialPass.renderShader;
                if (useTangent) {
                    renderShader.setDefine(`USE_TANGENT`, useTangent);
                }
                if (use_skeleton) {
                    renderShader.setDefine(`USE_SKELETON`, use_skeleton);
                }
                if (useMorphTargets) {
                    renderShader.setDefine(`USE_MORPHTARGETS`, useMorphTargets);
                }
                if (useMorphNormals) {
                    renderShader.setDefine(`USE_MORPHNORMALS`, useMorphNormals);
                }
                // renderShader.shaderState.cullMode = baseMat.getShader().cullMode ;
                renderShader.shaderState.cullMode = `front`;
                renderShader.preCompile(renderNode.geometry);
            }
            material.renderShader.setPassShader(RendererType.POINT_SHADOW, castPointShadowMaterialPass);
        }
        material.addPass(RendererType.POINT_SHADOW, castPointShadowMaterialPass, 0);
    }

    public static createReflectionPass(renderNode: RenderNode, material: MaterialBase) {
        // let reflectionPass = material.renderShader.getPassShader(RendererType.REFLECTION);
        // if (!reflectionPass) {
        //     reflectionPass = new ColorLitMaterial();
        //     let baseMat = renderNode.materials[0];
        //     reflectionPass.baseMap = baseMat.baseMap;
        //     let useTangent = renderNode.geometry.hasVertexAttribute('TANGENT');
        //     let useMorphTargets = renderNode.geometry.hasVertexAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
        //     let useMorphNormals = renderNode.geometry.hasVertexAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');

        //     let use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);

        //     let shader = reflectionPass.getShader();
        //     shader.shaderState.cullMode = baseMat.getShader().cullMode;
        //     shader.shaderState.frontFace = baseMat.getShader().frontFace;

        //     for (let j = 0; j < 1; j++) {
        //         const renderShader = reflectionPass.getShader();

        //         if (!useTangent) {
        //             renderShader.setDefine(`USE_TANGENT`, useTangent);
        //         }
        //         if (use_skeleton) {
        //             renderShader.setDefine(`USE_SKELETON`, use_skeleton);
        //         }
        //         if (useMorphTargets) {
        //             renderShader.setDefine(`USE_MORPHTARGETS`, useMorphTargets);
        //         }
        //         if (useMorphNormals) {
        //             renderShader.setDefine(`USE_MORPHNORMALS`, useMorphNormals);
        //         }

        //         renderShader.preCompile(renderNode.geometry, reflectionPass);
        //     }

        //     material.renderShader.setPassShader(RendererType.REFLECTION, reflectionPass);
        // }
        // material.addPass(RendererType.REFLECTION, reflectionPass, 0);
    }

    public static createDepthPass(renderNode: RenderNode, material: MaterialBase) {
        let depthMaterialPass = material.renderShader.getPassShader(RendererType.DEPTH);
        if (!depthMaterialPass) {
            let depthMaterialPass = new DepthMaterialPass();
            let baseMat = renderNode.materials[0];
            depthMaterialPass.baseMap = baseMat.baseMap;
            let useTangent = renderNode.geometry.hasAttribute('TANGENT');
            let useMorphTargets = renderNode.geometry.hasAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
            let useMorphNormals = renderNode.geometry.hasAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');

            let use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);

            let shader = depthMaterialPass.getShader();
            shader.shaderState.cullMode = baseMat.getShader().cullMode;
            shader.shaderState.frontFace = baseMat.getShader().frontFace;

            for (let j = 0; j < 1; j++) {
                const renderShader = depthMaterialPass.getShader();

                if (!useTangent) {
                    renderShader.setDefine(`USE_TANGENT`, useTangent);
                }
                if (use_skeleton) {
                    renderShader.setDefine(`USE_SKELETON`, use_skeleton);
                }
                if (useMorphTargets) {
                    renderShader.setDefine(`USE_MORPHTARGETS`, useMorphTargets);
                }
                if (useMorphNormals) {
                    renderShader.setDefine(`USE_MORPHNORMALS`, useMorphNormals);
                }

                renderShader.preCompile(renderNode.geometry);
            }

            material.renderShader.setPassShader(RendererType.DEPTH, depthMaterialPass);
        }
        material.addPass(RendererType.DEPTH, depthMaterialPass, 0);
    }
}
