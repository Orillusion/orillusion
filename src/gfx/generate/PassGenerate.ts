import { RenderNode } from '../../components/renderer/RenderNode';
// import { CastPointShadowMaterialPass } from '../../materials/multiPass/CastPointShadowMaterialPass';
// import { CastShadowMaterialPass } from '../../materials/multiPass/CastShadowMaterialPass';
// import { DepthMaterialPass } from '../../materials/multiPass/DepthMaterialPass';
// import { GBufferPass } from '../../materials/multiPass/GBufferPass';
// import { SkyGBufferPass } from '../../materials/multiPass/SkyGBufferPass';
import { RendererMaskUtil, RendererMask } from '../renderJob/passRenderer/state/RendererMask';
import { RendererType } from '../renderJob/passRenderer/state/RendererType';
import { GLTFType } from '../../loader/parser/gltf/GLTFType';
import { CastPointShadowMaterialPass, CastShadowMaterialPass, GBufferPass, Material, RendererPassState, SkyGBufferPass } from '../..';

/**
 * @internal
 * @group GFX
 */
export class PassGenerate {
    public static createGIPass(renderNode: RenderNode, material: Material) {
        if (RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.Sky)) {
            let colorPass = material.renderPasses.get(RendererType.COLOR)[0];
            let pass = new SkyGBufferPass();
            pass.setTexture(`baseMap`, colorPass.getTexture('baseMap'));

            pass.cullMode = colorPass.cullMode;
            pass.frontFace = colorPass.frontFace;

            material.addPass(RendererType.GI, pass, 0);
            pass.preCompile(renderNode.geometry);
        } else {
            this.castGBufferPass(renderNode, material);
        }
    }

    public static castGBufferPass(renderNode: RenderNode, material: Material) {
        for (let i = 0; i < renderNode.materials.length; i++) {
            const mat = renderNode.materials[i];
            let colorPassList = material.getPass(RendererType.COLOR);
            for (let jj = 0; jj < colorPassList.length; jj++) {
                const colorPass = colorPassList[jj];

                let giPassList = mat.getPass(RendererType.GI);
                if (!giPassList || giPassList.length < jj) {
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
                    mat.addPass(RendererType.GI, pass);
                }
            }
        }
    }

    public static createShadowPass(renderNode: RenderNode, material: Material) {
        let use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);
        let useTangent = renderNode.geometry.hasAttribute('TANGENT');
        let useMorphTargets = renderNode.geometry.hasAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
        let useMorphNormals = renderNode.geometry.hasAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');

        let colorPassList = material.getPass(RendererType.COLOR);
        for (let i = 0; i < colorPassList.length; i++) {
            const colorPass = colorPassList[i];
            let shadowPassList = material.getPass(RendererType.SHADOW);
            if (!shadowPassList || shadowPassList.length < i) {
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
                material.addPass(RendererType.SHADOW, shadowPass);
            }

            let castPointShadowPassList = material.getPass(RendererType.POINT_SHADOW);
            if (!castPointShadowPassList) {
                let castPointShadowPass = new CastPointShadowMaterialPass();
                castPointShadowPass.setTexture(`baseMap`, colorPass.getTexture(`baseMap`));
                castPointShadowPass.setUniform(`alphaCutoff`, colorPass.getUniform(`alphaCutoff`));
                castPointShadowPass.setDefine("USE_ALPHACUT", colorPass.shaderState.alphaCutoff < 1.0);
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
                material.addPass(RendererType.POINT_SHADOW, castPointShadowPass);
            }
        }
    }

    public static createReflectionPass(renderNode: RenderNode, material: Material) {
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

    public static createDepthPass(renderNode: RenderNode, material: Material) {
        let colorPass = material.getPass(RendererType.COLOR)[0];
        let depthMaterialPass = material.getPass(RendererType.DEPTH)[0];
        if (!depthMaterialPass) {
            // let depthMaterialPass = new DepthMaterialPass();
            // let baseMat = renderNode.materials[0];
            // depthMaterialPass.setTexture(`baseMap`, colorPass.getTexture(`baseMap`));
            // let useTangent = renderNode.geometry.hasAttribute('TANGENT');
            // let useMorphTargets = renderNode.geometry.hasAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
            // let useMorphNormals = renderNode.geometry.hasAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');

            // let use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);

            // depthMaterialPass.cullMode = colorPass.cullMode;
            // depthMaterialPass.frontFace = colorPass.frontFace;

            // for (let j = 0; j < 1; j++) {

            //     if (!useTangent) {
            //         depthMaterialPass.setDefine(`USE_TANGENT`, useTangent);
            //     }
            //     if (use_skeleton) {
            //         depthMaterialPass.setDefine(`USE_SKELETON`, use_skeleton);
            //     }
            //     if (useMorphTargets) {
            //         depthMaterialPass.setDefine(`USE_MORPHTARGETS`, useMorphTargets);
            //     }
            //     if (useMorphNormals) {
            //         depthMaterialPass.setDefine(`USE_MORPHNORMALS`, useMorphNormals);
            //     }

            //     depthMaterialPass.preCompile(renderNode.geometry);
            // }

            // material.renderShader.setPassShader(RendererType.DEPTH, depthMaterialPass);
        }
        material.addPass(RendererType.DEPTH, depthMaterialPass, 0);
    }
}
