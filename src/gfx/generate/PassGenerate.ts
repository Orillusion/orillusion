import { RenderNode } from '../../components/renderer/RenderNode';
import { RendererMaskUtil, RendererMask } from '../renderJob/passRenderer/state/RendererMask';
import { PassType } from '../renderJob/passRenderer/state/PassType';
import { GLTFType } from '../../loader/parser/gltf/GLTFType';
import { Shader } from '../graphics/webGpu/shader/Shader';
import { SkyGBufferPass } from '../../materials/multiPass/SkyGBufferPass';
import { GBufferPass } from '../../materials/multiPass/GBufferPass';
import { CastShadowMaterialPass } from '../../materials/multiPass/CastShadowMaterialPass';
import { CastPointShadowMaterialPass } from '../../materials/multiPass/CastPointShadowMaterialPass';
import { DepthMaterialPass } from '../../materials/multiPass/DepthMaterialPass';
import { VelocityMaterialPass } from '../../materials/multiPass/VelocityMaterialPass';
import { OITAccumPass } from '../../materials/multiPass/OITAccumPass';
import { DDPDepthPass } from '../../materials/multiPass/DDPDepthPass';
import { DDPFrontPass } from '../../materials/multiPass/DDPFrontPass';
import { DDPBackPass } from '../../materials/multiPass/DDPBackPass';
import { RenderShaderPass } from '../..';
import { bindCtx, Context3D } from '../graphics/webGpu/Context3D';

/**
 * @internal
 */
export class PassGenerate {

    private static _ctxOf(renderNode: RenderNode): Context3D | null {
        return renderNode.transform?.view3D?.engine3D?.context3D ?? null;
    }

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
                const ctx = this._ctxOf(renderNode);
                if (ctx) bindCtx(pass, ctx);
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
                const ctx = this._ctxOf(renderNode);
                if (ctx) bindCtx(pass, ctx);
                pass.preCompile(renderNode.geometry);
                shader.addRenderPass(pass);
            }
        }
    }

    public static createShadowPass(renderNode: RenderNode, shader: Shader) {
        let use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);
        let useMorphTargets = renderNode.geometry.hasAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
        let useMorphNormals = renderNode.geometry.hasAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');

        let colorPassList = shader.getSubShaders(PassType.COLOR);
        for (let i = 0; i < colorPassList.length; i++) {
            const colorPass = colorPassList[i];
            let shadowPassList = shader.getSubShaders(PassType.SHADOW);
            if (!shadowPassList || shadowPassList.length < (i + 1)) {
                let shadowPass = new CastShadowMaterialPass();
                // shadowPass.doubleSide = colorPass.doubleSide;
                shadowPass.cullMode = colorPass.cullMode;
                shadowPass.setTexture(`baseMap`, colorPass.getTexture(`baseMap`));
                shadowPass.setUniform(`alphaCutoff`, colorPass.getUniform(`alphaCutoff`));
                // shadowPass.setDefine("USE_ALPHACUT", colorPass.shaderState.alphaCutoff < 1.0);
                // Shadow is a depth-only pass; tangents only feed fragment-side
                // normal mapping, so it never needs TANGENT. Set false
                // explicitly (rather than mirroring the color pass) so preDefine
                // can't re-derive it from geometry attributes. The color/shadow
                // attribute-layout divergence this used to cause is now absorbed
                // by the geometry's per-pass VertexState (canonical-by-name
                // offsets), so the two passes no longer have to agree.
                shadowPass.setDefine(`USE_TANGENT`, false);
                if (use_skeleton) {
                    shadowPass.setDefine(`USE_SKELETON`, use_skeleton);
                }
                if (useMorphTargets) {
                    shadowPass.setDefine(`USE_MORPHTARGETS`, useMorphTargets);
                }
                if (useMorphNormals) {
                    shadowPass.setDefine(`USE_MORPHNORMALS`, useMorphNormals);
                }
                // shadowPass.shaderState.cullMode = colorPass.cullMode;
                // if (colorPass.cullMode == `none`) {
                //     shadowPass.shaderState.cullMode = `none`;
                // } else if (colorPass.cullMode == `back`) {
                //     shadowPass.shaderState.cullMode = `front`;
                // } else if (colorPass.cullMode == `front`) {
                //     shadowPass.shaderState.cullMode = `back`;
                // }
                const ctxA = this._ctxOf(renderNode);
                if (ctxA) bindCtx(shadowPass, ctxA);
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
                    // Depth-only pass — never needs TANGENT (see createShadowPass).
                    castPointShadowPass.setDefine(`USE_TANGENT`, false);
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
                    const ctxB = this._ctxOf(renderNode);
                    if (ctxB) bindCtx(castPointShadowPass, ctxB);
                    castPointShadowPass.preCompile(renderNode.geometry);
                }
                shader.addRenderPass(castPointShadowPass);
            }
        }
    }

    public static createDepthPass(renderNode: RenderNode, shader: Shader) {
        let colorListPass = shader.getSubShaders(PassType.COLOR);
        let useMorphTargets = renderNode.geometry.hasAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
        let useMorphNormals = renderNode.geometry.hasAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');
        let use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);

        for (let i = 0; i < colorListPass.length; i++) {
            const colorPass = colorListPass[i];
            // `getSubShaders` returns `[] || []` — never null/undefined.
            // The previous guard `!depthPassList` was always false on a
            // fresh shader, so DepthMaterialPass was never registered
            // and the prepass had no pipeline to draw with.
            let depthPassList = shader.getSubShaders(PassType.DEPTH);
            if (depthPassList.length <= i && colorPass.shaderState.useZ) {
                let depthPass = new DepthMaterialPass();
                depthPass.setTexture(`baseMap`, colorPass.getTexture(`baseMap`));
                // Depth prepass — never needs TANGENT (see createShadowPass).
                depthPass.setDefine(`USE_TANGENT`, false);
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
                const ctx = this._ctxOf(renderNode);
                if (ctx) bindCtx(depthPass, ctx);
                depthPass.preCompile(renderNode.geometry);
                shader.addRenderPass(depthPass);
            }
        }
    }

    /**
     * Per-object motion vector pass (see VelocityMaterialPass). One per
     * COLOR sub-shader, mirroring createDepthPass; skinning / morph defines
     * are copied so deformed meshes at least get their rigid motion.
     */
    public static createVelocityPass(renderNode: RenderNode, shader: Shader) {
        const colorListPass = shader.getSubShaders(PassType.COLOR);
        const useMorphTargets = renderNode.geometry.hasAttribute(GLTFType.MORPH_POSITION_PREFIX + '0');
        const useMorphNormals = renderNode.geometry.hasAttribute(GLTFType.MORPH_NORMAL_PREFIX + '0');
        const use_skeleton = RendererMaskUtil.hasMask(renderNode.rendererMask, RendererMask.SkinnedMesh);
        for (let i = 0; i < colorListPass.length; i++) {
            const colorPass = colorListPass[i];
            const list = shader.getSubShaders(PassType.VELOCITY);
            if (list.length <= i && colorPass.shaderState.useZ) {
                const pass = new VelocityMaterialPass();
                pass.setDefine(`USE_TANGENT`, false);
                if (use_skeleton) pass.setDefine(`USE_SKELETON`, true);
                if (useMorphTargets) pass.setDefine(`USE_MORPHTARGETS`, true);
                if (useMorphNormals) pass.setDefine(`USE_MORPHNORMALS`, true);
                pass.cullMode = colorPass.cullMode;
                pass.frontFace = colorPass.frontFace;
                const ctx = this._ctxOf(renderNode);
                if (ctx) {
                    bindCtx(pass, ctx);
                    pass.bindSharedBuffers(ctx);
                }
                pass.preCompile(renderNode.geometry);
                shader.addRenderPass(pass);
            }
        }
    }

    /**
     * Build the WBOIT accumulation pass for materials whose
     * `oitMode === 'weighted'`. Mirrors the createReflectionPass
     * pattern but reuses the **full PBRLitShader** lighting pipeline
     * — every define / uniform / texture from the color pass is
     * cloned, then `USE_OIT_ACCUM` is set so the trailing block in
     * Common_frag's FragMain overrides the fragment outputs with the
     * WBOIT-weighted (accum, reveal) pair instead of the lit color.
     *
     * The full clone is necessary because PBR lighting depends on
     * baseMap, normalMap, maskMap, environment probe, shadow maps,
     * IBL, clearcoat textures, transmission state, etc. Selectively
     * copying a subset (as the previous standalone OITAccumShader
     * version did) produced unlit-looking transparents.
     *
     * No-op if an OIT pass already exists for this material.
     */
    public static createOITPass(renderNode: RenderNode, shader: Shader) {
        const colorPassList = shader.getDefaultShaders();
        if (!colorPassList) return;
        for (let jj = 0; jj < colorPassList.length; jj++) {
            const colorPass = colorPassList[jj];
            const existing = shader.getSubShaders(PassType.OIT_ACCUM);
            if (existing && existing.length > jj) continue;

            // Use the COLOR pass's own vs/fs so the OIT accumulation
            // pipeline runs the SAME fragment program. Without this,
            // OITAccumPass's PBRLitShader default would try to bind
            // PBR-only uniforms (clearcoat*, transmission*, *MapOffsetSize)
            // for materials whose color pass is e.g. UnLit, blowing up
            // in initDataUniform with "size" undefined.
            const pass = new OITAccumPass(colorPass.vsName, colorPass.fsName);

            // Clone shaderState — we want the same culling / front-face
            // / topology / lighting flags / receive-env etc as the
            // color pass. depthWriteEnabled stays as OITAccumPass set
            // it (false) and transparent stays true.
            for (const key in colorPass.shaderState) {
                if (key === 'depthWriteEnabled' || key === 'transparent' || key === 'blendMode') continue;
                (pass.shaderState as any)[key] = (colorPass.shaderState as any)[key];
            }

            // Clone uniforms / textures / defines wholesale. Defines
            // drive shader code paths (USE_TRANSMISSION, USE_CLEARCOAT,
            // USE_TANGENT, USE_ALPHACUT, USE_AOTEX, ...); uniforms +
            // textures feed the same lighting math the color pass
            // would have run.
            for (const uniformName in colorPass.uniforms) {
                pass.setUniform(uniformName, colorPass.getUniform(uniformName));
            }
            for (const textureName in colorPass.textures) {
                const tex = colorPass.getTexture(textureName);
                if (tex) pass.setTexture(textureName, tex);
            }
            for (const defineName in colorPass.defineValue) {
                pass.setDefine(defineName, colorPass.defineValue[defineName]);
            }
            // Last: flip USE_OIT_ACCUM. Goes after the bulk define
            // copy so any cloned `false` value can't override it.
            pass.setDefine('USE_OIT_ACCUM', true);

            const ctx = this._ctxOf(renderNode);
            if (ctx) bindCtx(pass, ctx);
            pass.preCompile(renderNode.geometry);
            shader.addRenderPass(pass);
        }
    }

    /**
     * Dual depth peeling pass generator. For each
     * material color pass, clones THREE derived passes — one per sub-
     * pass-type (DEPTH / FRONT / BACK) — each with the corresponding
     * `USE_OIT_DEPTH_PEEL_*` define set so the shader writes the right
     * attachments. The DualDepthPeelingRenderer cycles through the
     * three pass types per peel iteration.
     *
     * Per-target blend states (MAX-MAX for depth, over for front,
     * under for back) are wired in {@link RenderShaderPass.createPipeline}
     * via the per-pass-type branches that match `this.passType`.
     *
     * No-op if the depth-peel passes already exist for this material.
     *
     * @param renderNode the renderer that owns this material
     * @param shader the material's shader (passes will be added to
     *               its passShader map)
     */
    public static createDepthPeelPasses(renderNode: RenderNode, shader: Shader) {
        const colorPassList = shader.getDefaultShaders();
        if (!colorPassList) return;

        // For every color sub-shader (multi-material setups can have
        // more than one) generate the three depth-peel sub-passes.
        // Idempotent: skip whichever subset already exists.
        for (let jj = 0; jj < colorPassList.length; jj++) {
            const colorPass = colorPassList[jj];

            const existingDepth = shader.getSubShaders(PassType.OIT_DEPTH_PEEL_DEPTH);
            const existingFront = shader.getSubShaders(PassType.OIT_DEPTH_PEEL_FRONT);
            const existingBack = shader.getSubShaders(PassType.OIT_DEPTH_PEEL_BACK);

            const wantDepth = !existingDepth || existingDepth.length <= jj;
            const wantFront = !existingFront || existingFront.length <= jj;
            const wantBack = !existingBack || existingBack.length <= jj;

            if (wantDepth) {
                this._addDepthPeelClone(
                    renderNode,
                    shader,
                    colorPass,
                    new DDPDepthPass(colorPass.vsName, colorPass.fsName),
                    'USE_OIT_DEPTH_PEEL_DEPTH',
                );
            }
            if (wantFront) {
                this._addDepthPeelClone(
                    renderNode,
                    shader,
                    colorPass,
                    new DDPFrontPass(colorPass.vsName, colorPass.fsName),
                    'USE_OIT_DEPTH_PEEL_FRONT',
                );
            }
            if (wantBack) {
                this._addDepthPeelClone(
                    renderNode,
                    shader,
                    colorPass,
                    new DDPBackPass(colorPass.vsName, colorPass.fsName),
                    'USE_OIT_DEPTH_PEEL_BACK',
                );
            }
        }
    }

    /** Helper: clones a COLOR pass into a DDP sub-pass with the given
     *  `USE_OIT_DEPTH_PEEL_*` flag. Mirrors the clone strategy used by
     *  {@link createOITPass} — every define / uniform / texture from the
     *  color pass is copied so the sub-pass runs the SAME PBR / UnLit /
     *  Lambert lighting program. The matching peel define is set last
     *  so it overrides any cloned `false`. */
    private static _addDepthPeelClone(
        renderNode: RenderNode,
        shader: Shader,
        colorPass: RenderShaderPass,
        pass: RenderShaderPass,
        peelDefine: 'USE_OIT_DEPTH_PEEL_DEPTH' | 'USE_OIT_DEPTH_PEEL_FRONT' | 'USE_OIT_DEPTH_PEEL_BACK',
    ): void {
        // Clone non-blend shader state. depth/transparent/blendMode are
        // owned by the DDP* pass class so they survive the override path.
        for (const key in colorPass.shaderState) {
            if (key === 'depthWriteEnabled' || key === 'transparent' || key === 'blendMode') continue;
            (pass.shaderState as any)[key] = (colorPass.shaderState as any)[key];
        }

        for (const uniformName in colorPass.uniforms) {
            pass.setUniform(uniformName, colorPass.getUniform(uniformName));
        }
        for (const textureName in colorPass.textures) {
            const tex = colorPass.getTexture(textureName);
            if (tex) pass.setTexture(textureName, tex);
        }
        for (const defineName in colorPass.defineValue) {
            pass.setDefine(defineName, colorPass.defineValue[defineName]);
        }
        // Set the peel-specific define LAST so cloned `false`s from the
        // color pass cannot override it. Also flip the umbrella
        // `USE_OIT_DEPTH_PEEL` so shader code that just needs to know
        // "this is some depth-peel sub-pass" (e.g. FragmentOutput
        // single-attachment selection, gBuffer-write skipping in
        // BxDF_frag / UnLit_frag) can branch on a single flag.
        pass.setDefine(peelDefine, true);
        pass.setDefine('USE_OIT_DEPTH_PEEL', true);

        const ctx = this._ctxOf(renderNode);
        if (ctx) bindCtx(pass, ctx);
        pass.preCompile(renderNode.geometry);
        shader.addRenderPass(pass);
    }

    static createReflectionPass(renderNode: RenderNode, shader: Shader) {
        let colorPassList = shader.getDefaultShaders();
        for (let jj = 0; jj < colorPassList.length; jj++) {
            const colorPass = colorPassList[jj];

            let colorSubPassList = shader.getSubShaders(PassType.REFLECTION);
            if (!colorSubPassList || colorSubPassList.length == 0 || colorSubPassList.length < jj) {
                let pass = new RenderShaderPass(colorPass.vsName, colorPass.fsName);
                pass.vsEntryPoint = colorPass.vsEntryPoint;
                pass.fsEntryPoint = colorPass.fsEntryPoint;
                pass.passType = PassType.REFLECTION;

                for (const state in colorPass.shaderState) {
                    var v = colorPass.shaderState[state];
                    pass.shaderState[state] = v;
                }

                for (const textureName in colorPass.textures) {
                    var texture = colorPass.getTexture(textureName);
                    pass.setTexture(textureName, texture);
                }

                for (const uniformName in colorPass.uniforms) {
                    var value = colorPass.getUniform(uniformName);
                    pass.setUniform(uniformName, value);
                }

                for (const defineName in colorPass.defineValue) {
                    var value = colorPass.defineValue[defineName];
                    pass.setDefine(defineName, value);
                }

                pass.setDefine("USE_CASTREFLECTION", true);

                const ctx = this._ctxOf(renderNode);
                if (ctx) bindCtx(pass, ctx);
                pass.preCompile(renderNode.geometry);
                shader.addRenderPass(pass);
            }
        }
    }
}
