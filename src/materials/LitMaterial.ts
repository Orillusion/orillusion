import { Context3D } from "../gfx/graphics/webGpu/Context3D";
import { Texture } from "../gfx/graphics/webGpu/core/texture/Texture";
import { RTResourceMap } from "../gfx/renderJob/frame/RTResourceMap";
import { StandShader } from "../loader/parser/prefab/mats/shader/StandShader";
import { BlendMode } from "./BlendMode";
import { Color } from "../math/Color";
import { Vector4 } from "../math/Vector4";
import { Engine3D } from "../Engine3D";
import { Material } from "./Material";

/** glTF-style alpha handling for a LitMaterial.
 *  - OPAQUE: opaque queue, no alpha handling (default).
 *  - MASK:   opaque queue, hard `discard` via alphaCutoff. When the
 *            engine has MSAA enabled (`engine.setting.render.msaa > 0`)
 *            the pipeline additionally enables alpha-to-coverage for
 *            smooth edges (foliage, fences).
 *  - BLEND:  transparent queue, hardware straight-alpha blending. */
export type AlphaMode = 'OPAQUE' | 'MASK' | 'BLEND' | 'HASH';

/**
 * Physically based lit material supporting albedo, normal, ARM, emissive and
 * other PBR texture/parameter inputs. Serves as the standard surface material.
 * @group Material
 */
export class LitMaterial extends Material {

    private _alphaMode: AlphaMode = 'OPAQUE';
    private _ctx: Context3D | undefined;

    constructor(ctx?: Context3D) {
        super();
        this._ctx = ctx;
        let shader = new StandShader(ctx);
        this.shader = shader;
    }

    /** Clone this material into a new LitMaterial, copying PBR uniforms and textures. */
    public clone(): Material {
        let litMaterial = new LitMaterial();

        let colorPass = litMaterial.shader.getDefaultColorShader();
        let sourceShader = this.shader.getDefaultColorShader();
        colorPass.defineValue = { ...sourceShader.defineValue }
        colorPass.setUniform(`shadowBias`, sourceShader.getUniform(`shadowBias`));

        colorPass.setUniform(`baseColor`, sourceShader.getUniform(`baseColor`));
        colorPass.setUniform(`specularColor`, sourceShader.getUniform(`specularColor`));
        colorPass.setUniform(`emissiveColor`, sourceShader.getUniform(`emissiveColor`));
        colorPass.setUniform(`materialF0`, sourceShader.getUniform(`materialF0`));
        colorPass.setUniform(`envIntensity`, sourceShader.getUniform(`envIntensity`));
        colorPass.setUniform(`normalScale`, sourceShader.getUniform(`normalScale`));
        colorPass.setUniform(`roughness`, sourceShader.getUniform(`roughness`));
        colorPass.setUniform(`metallic`, sourceShader.getUniform(`metallic`));
        colorPass.setUniform(`ao`, sourceShader.getUniform(`ao`));
        colorPass.setUniform(`roughness_min`, sourceShader.getUniform(`roughness_min`));
        colorPass.setUniform(`roughness_max`, sourceShader.getUniform(`roughness_max`));
        colorPass.setUniform(`metallic_min`, sourceShader.getUniform(`metallic_min`));
        colorPass.setUniform(`metallic_max`, sourceShader.getUniform(`metallic_max`));
        colorPass.setUniform(`emissiveIntensity`, sourceShader.getUniform(`emissiveIntensity`));
        colorPass.setUniform(`alphaCutoff`, sourceShader.getUniform(`alphaCutoff`));
        colorPass.setUniform(`ior`, sourceShader.getUniform(`ior`));
        colorPass.setUniform(`clearcoatFactor`, sourceShader.getUniform(`clearcoatFactor`));
        colorPass.setUniform(`clearcoatRoughnessFactor`, sourceShader.getUniform(`clearcoatRoughnessFactor`));
        colorPass.setUniform(`clearcoatColor`, sourceShader.getUniform(`clearcoatColor`));
        colorPass.setUniform(`clearcoatWeight`, sourceShader.getUniform(`clearcoatWeight`));
        colorPass.setUniform(`clearcoatIor`, sourceShader.getUniform(`clearcoatIor`));
        colorPass.setUniform(`sheenColor`, sourceShader.getUniform(`sheenColor`));
        colorPass.setUniform(`iridescence`, sourceShader.getUniform(`iridescence`));
        colorPass.setUniform(`anisotropy`, sourceShader.getUniform(`anisotropy`));

        colorPass.setTexture(`baseMap`, sourceShader.getTexture(`baseMap`));
        colorPass.setTexture(`normalMap`, sourceShader.getTexture(`normalMap`));
        colorPass.setTexture(`emissiveMap`, sourceShader.getTexture(`emissiveMap`));
        colorPass.setTexture(`aoMap`, sourceShader.getTexture(`aoMap`));
        colorPass.setTexture(`maskMap`, sourceShader.getTexture(`maskMap`));
        colorPass.setTexture(`empty`, sourceShader.getTexture(`empty`));
        for (const name of LitMaterial.EXTENSION_MAPS) {
            const t = sourceShader.getTexture(name);
            if (t) colorPass.setTexture(name, t);
        }

        colorPass.setUniform(`baseMapOffsetSize`, sourceShader.getUniform(`baseMapOffsetSize`));
        colorPass.setUniform(`normalMapOffsetSize`, sourceShader.getUniform(`normalMapOffsetSize`));
        colorPass.setUniform(`emissiveMapOffsetSize`, sourceShader.getUniform(`emissiveMapOffsetSize`));
        colorPass.setUniform(`roughnessMapOffsetSize`, sourceShader.getUniform(`roughnessMapOffsetSize`));
        colorPass.setUniform(`metallicMapOffsetSize`, sourceShader.getUniform(`metallicMapOffsetSize`));
        colorPass.setUniform(`aoMapOffsetSize`, sourceShader.getUniform(`aoMapOffsetSize`));
        return litMaterial;
    }

    /** Set the albedo/base color texture. */
    public set baseMap(texture: Texture) {
        this.shader.setTexture(`baseMap`, texture);
    }

    /** Get the albedo/base color texture. */
    public get baseMap() {
        return this.shader.getTexture(`baseMap`);
    }

    /** Set the mask texture. */
    public set maskMap(texture: Texture) {
        this.shader.setTexture(`maskMap`, texture);
    }

    /** Get the mask texture. */
    public get maskMap() {
        return this.shader.getTexture(`maskMap`);
    }


    /** Set the normal map texture. */
    public set normalMap(texture: Texture) {
        this.shader.setTexture(`normalMap`, texture);
    }

    /** Get the normal map texture. */
    public get normalMap() {
        return this.shader.getTexture(`normalMap`);
    }

    /** Set the emissive texture. */
    public set emissiveMap(texture: Texture) {
        this.shader.setTexture(`emissiveMap`, texture);
    }

    /** Get the emissive texture. */
    public get emissiveMap() {
        return this.shader.getTexture(`emissiveMap`);
    }

    /** Set the ambient occlusion texture. */
    public set aoMap(texture: Texture) {
        this.shader.setTexture(`aoMap`, texture);
    }

    /** Get the ambient occlusion texture. */
    public get aoMap() {
        return this.shader.getTexture(`aoMap`);
    }

    private _anisotropyParams(): Vector4 {
        const v = this.shader.getUniformVector4(`anisotropy`) as Vector4;
        return v ? new Vector4(v.x, v.y, v.z, v.w) : new Vector4(0, 0, 0, 0);
    }

    /**
     * Specular anisotropy strength (KHR_materials_anisotropy), 0…1: how far
     * highlights stretch across the grain direction. Above 0 enables the
     * effect; 0 disables it. The mesh needs UVs — the grain follows +U,
     * turned by `anisotropyRotation`.
     */
    public set anisotropy(value: number) {
        const v = this._anisotropyParams();
        v.x = Math.min(Math.max(value, 0), 1);
        this.shader.setUniformVector4(`anisotropy`, v);
        this.shader.setDefine(`USE_ANISOTROPY`, v.x > 0);
    }

    /** Get the anisotropy strength. */
    public get anisotropy(): number {
        return this._anisotropyParams().x;
    }

    /** Rotation of the grain direction around the normal, in radians, counter-clockwise from +U. */
    public set anisotropyRotation(value: number) {
        const v = this._anisotropyParams();
        v.y = value;
        this.shader.setUniformVector4(`anisotropy`, v);
    }

    /** Get the grain rotation in radians. */
    public get anisotropyRotation(): number {
        return this._anisotropyParams().y;
    }

    private _iridescenceParams(): Vector4 {
        const v = this.shader.getUniformVector4(`iridescence`) as Vector4;
        return v ? new Vector4(v.x, v.y, v.z, v.w) : new Vector4(0, 1.3, 400, 100);
    }

    /**
     * Thin-film iridescence strength (KHR_materials_iridescence), 0…1.
     * Any value above 0 enables the effect; 0 disables it.
     */
    public set iridescence(value: number) {
        const v = this._iridescenceParams();
        v.x = Math.min(Math.max(value, 0), 1);
        this.shader.setUniformVector4(`iridescence`, v);
        this.shader.setDefine(`USE_IRIDESCENCE`, v.x > 0);
    }

    /** Get the iridescence strength. */
    public get iridescence(): number {
        return this._iridescenceParams().x;
    }

    /** Index of refraction of the thin film (default 1.3). */
    public set iridescenceIOR(value: number) {
        const v = this._iridescenceParams();
        v.y = Math.max(value, 1.0);
        this.shader.setUniformVector4(`iridescence`, v);
    }

    /** Get the thin-film index of refraction. */
    public get iridescenceIOR(): number {
        return this._iridescenceParams().y;
    }

    /** Thin-film thickness in nanometres (typically 100…1000; default 400). */
    public set iridescenceThickness(value: number) {
        const v = this._iridescenceParams();
        v.z = Math.max(value, 0);
        this.shader.setUniformVector4(`iridescence`, v);
    }

    /** Get the thin-film thickness in nanometres. */
    public get iridescenceThickness(): number {
        return this._iridescenceParams().z;
    }

    /**
     * Sheen tint (KHR_materials_sheen), linear RGB. Setting any non-black
     * color enables the sheen lobe; black disables it again. The color's
     * alpha channel is ignored — use `sheenRoughness`.
     */
    public set sheenColor(value: Color) {
        const c = this.shader.getUniformColor(`sheenColor`);
        const roughness = c ? c.a : 0;
        this.shader.setUniformColor(`sheenColor`, new Color(value.r, value.g, value.b, roughness));
        this.shader.setDefine(`USE_SHEEN`, value.r > 0 || value.g > 0 || value.b > 0);
    }

    /** Get the sheen tint (alpha carries the sheen roughness). */
    public get sheenColor(): Color {
        return this.shader.getUniformColor(`sheenColor`);
    }

    /** Sheen roughness, 0 (tight rim) … 1 (broad velvet glow). */
    public set sheenRoughness(value: number) {
        const c = this.shader.getUniformColor(`sheenColor`) ?? new Color(0, 0, 0, 0);
        this.shader.setUniformColor(`sheenColor`, new Color(c.r, c.g, c.b, Math.min(Math.max(value, 0), 1)));
    }

    /** Get the sheen roughness. */
    public get sheenRoughness(): number {
        const c = this.shader.getUniformColor(`sheenColor`);
        return c ? c.a : 0;
    }

    /** Minimum thin-film thickness in nanometres, used with `iridescenceThicknessMap` (default 100). */
    public set iridescenceThicknessMinimum(value: number) {
        const v = this._iridescenceParams();
        v.w = Math.max(value, 0);
        this.shader.setUniformVector4(`iridescence`, v);
    }

    /** Get the minimum thin-film thickness in nanometres. */
    public get iridescenceThicknessMinimum(): number {
        return this._iridescenceParams().w;
    }

    /** Texture slots of the KHR material extensions, each paired with the define that turns sampling on. */
    private static readonly EXTENSION_MAPS = ['sheenColorMap', 'sheenRoughnessMap', 'iridescenceMap', 'iridescenceThicknessMap', 'specularMap', 'specularColorMap', 'anisotropyMap'] as const;
    private static readonly EXTENSION_MAP_DEFINES: Record<string, string> = {
        sheenColorMap: 'USE_SHEENMAP', sheenRoughnessMap: 'USE_SHEENROUGHNESSMAP',
        iridescenceMap: 'USE_IRIDESCENCEMAP', iridescenceThicknessMap: 'USE_IRIDESCENCE_THICKNESSMAP',
        specularMap: 'USE_SPECULARMAP', specularColorMap: 'USE_SPECULARCOLORMAP', anisotropyMap: 'USE_ANISOTROPYMAP',
    };

    private _setExtensionMap(name: string, texture: Texture) {
        // Shader.setTexture ignores null but would still flip its own
        // USE_<NAME> define; only the sampling define below matters.
        if (texture) this.shader.setTexture(name, texture);
        this.shader.setDefine(LitMaterial.EXTENSION_MAP_DEFINES[name], !!texture);
    }

    private _getExtensionMap(name: string): Texture {
        const on = (this.shader.getDefaultColorShader() as any).defineValue[LitMaterial.EXTENSION_MAP_DEFINES[name]];
        return on ? this.shader.getTexture(name) : null;
    }

    /** KHR_materials_sheen `sheenColorTexture` (sRGB): rgb multiplies `sheenColor`. Only sampled while the sheen lobe is on. */
    public set sheenColorMap(texture: Texture) { this._setExtensionMap('sheenColorMap', texture); }
    public get sheenColorMap(): Texture { return this._getExtensionMap('sheenColorMap'); }

    /** KHR_materials_sheen `sheenRoughnessTexture`: alpha multiplies `sheenRoughness`. */
    public set sheenRoughnessMap(texture: Texture) { this._setExtensionMap('sheenRoughnessMap', texture); }
    public get sheenRoughnessMap(): Texture { return this._getExtensionMap('sheenRoughnessMap'); }

    /** KHR_materials_iridescence `iridescenceTexture`: red multiplies `iridescence`. Only sampled while iridescence is on. */
    public set iridescenceMap(texture: Texture) { this._setExtensionMap('iridescenceMap', texture); }
    public get iridescenceMap(): Texture { return this._getExtensionMap('iridescenceMap'); }

    /** KHR_materials_iridescence `iridescenceThicknessTexture`: green lerps the film thickness from `iridescenceThicknessMinimum` to `iridescenceThickness`. */
    public set iridescenceThicknessMap(texture: Texture) { this._setExtensionMap('iridescenceThicknessMap', texture); }
    public get iridescenceThicknessMap(): Texture { return this._getExtensionMap('iridescenceThicknessMap'); }

    /** KHR_materials_specular `specularTexture`: alpha multiplies the specular strength (`specularColor.a`). */
    public set specularMap(texture: Texture) { this._setExtensionMap('specularMap', texture); }
    public get specularMap(): Texture { return this._getExtensionMap('specularMap'); }

    /** KHR_materials_specular `specularColorTexture` (sRGB): rgb multiplies the F0 tint (`specularColor.rgb`). */
    public set specularColorMap(texture: Texture) { this._setExtensionMap('specularColorMap', texture); }
    public get specularColorMap(): Texture { return this._getExtensionMap('specularColorMap'); }

    /** KHR_materials_anisotropy `anisotropyTexture`: rg = tangent-space direction (0.5 = none), b multiplies `anisotropy`. Only sampled while anisotropy is on. */
    public set anisotropyMap(texture: Texture) { this._setExtensionMap('anisotropyMap', texture); }
    public get anisotropyMap(): Texture { return this._getExtensionMap('anisotropyMap'); }

    /** Set the clearcoat roughness texture and enable the clearcoat shader path. */
    public set clearCoatRoughnessMap(texture: Texture) {
        this.shader.setTexture(`clearCoatRoughnessMap`, texture);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
        this.shader.setDefine(`USE_CLEARCOAT_ROUGHNESS`, true);
    }

    /** Get the clearcoat roughness texture. */
    public get clearCoatRoughnessMap() {
        return this.shader.getTexture(`clearCoatRoughnessMap`);
    }

    /** Set the clearcoat tint color and enable the clearcoat shader path. */
    public set clearcoatColor(value: Color) {
        this.shader.setUniformColor(`clearcoatColor`, value);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
    }

    /** Get the clearcoat tint color. */
    public get clearcoatColor() {
        return this.shader.getUniformColor(`clearcoatColor`);
    }

    /** Set the clearcoat weight and enable the clearcoat shader path. */
    public set clearcoatWeight(value: number) {
        this.shader.setUniformFloat(`clearcoatWeight`, value);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
    }

    /** Get the clearcoat weight. */
    public get clearcoatWeight() {
        return this.shader.getUniformFloat(`clearcoatWeight`);
    }

    /** Set the clearcoat factor and enable the clearcoat shader path. */
    public set clearcoatFactor(value: number) {
        this.shader.setUniformFloat(`clearcoatFactor`, value);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
    }

    /** Get the clearcoat factor. */
    public get clearcoatFactor() {
        return this.shader.getUniformFloat(`clearcoatFactor`);
    }


    /** Set the clearcoat roughness factor and enable the clearcoat shader path. */
    public set clearcoatRoughnessFactor(value: number) {
        this.shader.setUniformFloat(`clearcoatRoughnessFactor`, value);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
    }

    /** Get the clearcoat roughness factor. */
    public get clearcoatRoughnessFactor() {
        return this.shader.getUniformFloat(`clearcoatRoughnessFactor`);
    }

    /** Set the index of refraction. */
    public set ior(value: number) {
        this.shader.setUniformFloat(`ior`, value);
    }

    /** Get the index of refraction. */
    public get ior() {
        return this.shader.getUniformFloat(`ior`);
    }


    /** Set the alpha cutoff threshold and enable the alpha-cut shader path. */
    public set alphaCutoff(value: number) {
        this.shader.setUniform(`alphaCutoff`, value);
        this.shader.setDefine('USE_ALPHACUT', true);
    }

    /** Get the alpha cutoff threshold. */
    public get alphaCutoff() {
        return this.shader.getUniform(`alphaCutoff`);
    }

    /** Transmission (KHR_materials_transmission). Setting a non-zero
     *  value turns on the USE_TRANSMISSION shader path — the fragment
     *  samples the SceneColorPyramid at the fragment's screen position
     *  and mixes it into the opaque output.
     *
     *  Transmission materials stay on the OPAQUE queue (renderOrder
     *  < 3000) — the alpha channel is folded into the transmitted
     *  color in the shader. That's the standard PBR-pipeline
     *  contract for refractive surfaces. */
    /** glTF KHR_materials_transmission `transmissionTexture` — R channel
     *  is multiplied with `transmissionFactor` per fragment, so the same
     *  material can have opaque + glassy regions (e.g. a frosted window
     *  with painted bezels). Setting it implies USE_TRANSMISSION. */
    public set transmissionMap(texture: Texture) {
        this.shader.setTexture(`transmissionMap`, texture);
        this.shader.setDefine(`USE_TRANSMISSIONMAP`, true);
        this.shader.setDefine(`USE_TRANSMISSION`, true);
    }

    /** Get the transmission texture. */
    public get transmissionMap(): Texture {
        return this.shader.getTexture(`transmissionMap`);
    }

    /** Set the transmission factor, toggling the transmission shader path and resolving the scene color pyramid. */
    public set transmissionFactor(value: number) {
        this.shader.setUniformFloat(`transmissionFactor`, value);
        this.shader.setDefine(`USE_TRANSMISSION`, value > 0.0);
        if (value > 0.0) {
            // Resolve the SceneColorPyramid. The most common construction
            // path is `new LitMaterial()` with no ctx argument, so fall
            // back to the single-engine default Context3D — without this
            // the lookup uses `null` and we'd forever bind the white
            // placeholder, leaving transmission samples flat-white and
            // refraction invisible. (`Engine3D._defaultContext()` only
            // works in single-engine setups; multi-engine apps must pass
            // ctx explicitly to the LitMaterial constructor.)
            let ctx = this._ctx;
            if (!ctx) {
                try { ctx = Engine3D._defaultContext(); } catch { ctx = undefined; }
            }
            const pyramid = ctx ? RTResourceMap.getTexture(ctx, '_SceneColorPyramid') : null;
            if (pyramid) {
                this.shader.setTexture('sceneColorPyramid', pyramid);
            } else {
                this.shader.setTexture('sceneColorPyramid', Engine3D.resFor(ctx).whiteTexture);
            }
        }
    }

    /** Get the transmission factor. */
    public get transmissionFactor(): number {
        return this.shader.getUniformFloat(`transmissionFactor`);
    }

    /** Set the volume thickness factor used for transmission attenuation. */
    public set thicknessFactor(value: number) {
        this.shader.setUniformFloat(`thicknessFactor`, value);
    }

    /** Get the volume thickness factor. */
    public get thicknessFactor(): number {
        return this.shader.getUniformFloat(`thicknessFactor`);
    }

    /** glTF KHR_materials_volume `thicknessTexture` — G channel scales
     *  `thicknessFactor` per fragment, so a single material can vary
     *  from thin (bright, near source color) to thick (heavily
     *  attenuated) across its surface. Setting it enables the
     *  USE_THICKNESSMAP shader path. */
    public set thicknessMap(texture: Texture) {
        this.shader.setTexture(`thicknessMap`, texture);
        this.shader.setDefine(`USE_THICKNESSMAP`, true);
    }

    /** Get the thickness texture. */
    public get thicknessMap(): Texture {
        return this.shader.getTexture(`thicknessMap`);
    }

    /** Distance (in world units) after which the transmitted radiance
     *  has been attenuated to `1/e` of its initial intensity. Use
     *  `Number.POSITIVE_INFINITY` to disable attenuation. */
    public set attenuationDistance(value: number) {
        // WebGPU has no "infinity" in std140 float — map to a very
        // large number (2e19) and keep the Infinity sentinel in JS
        // for external round-tripping. The shader side compares
        // against 1e18 as "effectively infinite".
        const clamped = isFinite(value) ? value : 1.0e20;
        this.shader.setUniformFloat(`attenuationDistance`, clamped);
    }

    /** Get the attenuation distance, returning Infinity when attenuation is effectively disabled. */
    public get attenuationDistance(): number {
        const v = this.shader.getUniformFloat(`attenuationDistance`);
        return v >= 1.0e18 ? Number.POSITIVE_INFINITY : v;
    }

    /** Set the attenuation (transmission absorption) color. */
    public set attenuationColor(value: Color) {
        this.shader.setUniformColor(`attenuationColor`, value);
    }

    /** Get the attenuation (transmission absorption) color. */
    public get attenuationColor(): Color {
        return this.shader.getUniformColor(`attenuationColor`);
    }

    /** When set to true, the transmission shader path attenuates this
     *  fragment's output alpha by transmission as well as RGB so an
     *  `alpha:true` swapchain composites whatever's behind the canvas
     *  (HTML page background, video element, ...) through the glass.
     *  Off by default — opaque-queue draws keep alpha=1 so demos that
     *  share an opaque canvas with other geometry don't inherit
     *  unwanted blending. */
    public set transmissionAlphaMode(value: boolean) {
        this.shader.setUniformFloat(`transmissionAlphaMode`, value ? 1.0 : 0.0);
    }

    /** Whether transmission also attenuates the output alpha for see-through compositing. */
    public get transmissionAlphaMode(): boolean {
        return this.shader.getUniformFloat(`transmissionAlphaMode`) > 0.5;
    }

    /** glTF-aligned alpha handling. See {@link AlphaMode}. */
    public get alphaMode(): AlphaMode {
        return this._alphaMode;
    }

    /** Set the glTF-aligned alpha mode, configuring blend/discard state and render queue accordingly. */
    public set alphaMode(mode: AlphaMode) {
        // Idempotent guard — see LambertMaterial.alphaMode for rationale.
        if (this._alphaMode === mode) return;
        this._alphaMode = mode;
        const colorPass = this.shader.getDefaultColorShader();
        const state = colorPass.shaderState;
        switch (mode) {
            case 'OPAQUE':
                state.transparent = false;
                state.alphaToCoverageEnabled = false;
                state.blendMode = BlendMode.NONE;
                state.depthWriteEnabled = true;
                colorPass.setDefine('USE_ALPHACUT', false);
                colorPass.setDefine('USE_ALPHAHASH', false);
                colorPass.renderOrder = 0;
                break;
            case 'MASK':
                state.transparent = false;
                state.alphaToCoverageEnabled = true;
                state.blendMode = BlendMode.NONE;
                state.depthWriteEnabled = true;
                colorPass.setDefine('USE_ALPHACUT', true);
                colorPass.setDefine('USE_ALPHAHASH', false);
                colorPass.renderOrder = 0;
                break;
            case 'HASH':
                // Stochastic transparency: routes through the opaque
                // queue (writes depth, no blending), but a per-fragment
                // hash discard converges to true alpha when combined
                // with TAA's sub-pixel camera jitter. Without TAA the
                // image looks dithered.
                state.transparent = false;
                state.alphaToCoverageEnabled = false;
                state.blendMode = BlendMode.NONE;
                state.depthWriteEnabled = true;
                colorPass.setDefine('USE_ALPHACUT', false);
                colorPass.setDefine('USE_ALPHAHASH', true);
                colorPass.renderOrder = 0;
                break;
            case 'BLEND':
                state.transparent = true;
                state.alphaToCoverageEnabled = false;
                state.blendMode = BlendMode.NORMAL;
                state.depthWriteEnabled = false;
                colorPass.setDefine('USE_ALPHACUT', false);
                colorPass.setDefine('USE_ALPHAHASH', false);
                // EntityCollect.addRenderNode classifies into transparentList
                // by `renderOrder >= 3000`. The blendMode setter only bumps
                // it for ADD/SOFT_ADD/MUL/SCREEN — `BlendMode.NORMAL` (which
                // 'BLEND' picks) is excluded there because NORMAL is also
                // used by opaque-with-discard sprites. alphaMode='BLEND'
                // is the unambiguous "real transparent" signal, so opt the
                // pass into the transparent queue here. Without this,
                // transparent fragments get rendered in the opaque pass —
                // which "works" only when other opaque geometry already
                // wrote depth at those pixels (ground, walls, etc.); over
                // sky pixels (cleared depth = 1.0, sky doesn't write
                // depth), the late-drawn sky's `less_equal` test passes
                // and overwrites the transparent's color.
                colorPass.renderOrder = 3000;
                break;
        }
        // Live BLEND ↔ HASH toggles flip pass.renderOrder, which
        // changes which EntityCollect bucket this renderer should be
        // in. Notify so attached renderers re-classify on the next
        // frame; without this they stay in the original queue.
        this._notifyRenderClassificationDirty();
    }

    /**
     * set base color (tint color)
     */
    public set baseColor(color: Color) {
        this.shader.setUniformColor(`baseColor`, color);
    }

    /**
     * get base color (tint color)
     */
    public get baseColor() {
        return this.shader.getUniformColor("baseColor");
    }

    /** Get the surface roughness. */
    public get roughness(): number {
        return this.shader.getUniformFloat("roughness");
    }

    /** Set the surface roughness. */
    public set roughness(value: number) {
        this.shader.setUniformFloat("roughness", value);
    }

    /** Get the metallic factor. */
    public get metallic(): number {
        return this.shader.getUniformFloat("metallic");
    }

    /** Set the metallic factor. */
    public set metallic(value: number) {
        this.shader.setUniformFloat("metallic", value);
    }

    /** Get the emissive color. */
    public get emissiveColor(): Color {
        return this.shader.getUniformColor("emissiveColor");
    }

    /** Set the emissive color. */
    public set emissiveColor(value: Color) {
        this.shader.setUniformColor("emissiveColor", value);
    }

    /** Get the emissive intensity. */
    public get emissiveIntensity(): number {
        return this.shader.getUniformFloat("emissiveIntensity");
    }

    /** Set the emissive intensity. */
    public set emissiveIntensity(value: number) {
        this.shader.setUniformFloat("emissiveIntensity", value);
    }

    /** Get the ambient occlusion factor. */
    public get ao(): number {
        return this.shader.getUniform(`ao`);
    }

    /** Set the ambient occlusion factor. */
    public set ao(value: number) {
        this.shader.setUniform(`ao`, value);
    }
}