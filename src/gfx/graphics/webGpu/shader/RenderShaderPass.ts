import { ShaderLib } from "../../../../assets/shader/ShaderLib";
import { Color } from "../../../../math/Color";
import { VertexAttributeName } from "../../../../core/geometry/VertexAttributeName";
import { BlendFactor, BlendMode } from "../../../../materials/BlendMode";
import { IESProfilesPool } from "../../../../components/lights/IESProfiles";
import { GeometryBase } from "../../../../core/geometry/GeometryBase";
import { Engine3D } from "../../../../Engine3D";
import { GlobalBindGroupLayout } from "../core/bindGroups/GlobalBindGroupLayout";
import { GPUBufferBase } from "../core/buffer/GPUBufferBase";
import { UniformNode } from "../core/uniforms/UniformNode";
import { Texture } from "../core/texture/Texture";
import { bindCtx, Context3D } from "../Context3D";
import { ShaderConverter } from "./converter/ShaderConverter";
import { ShaderPassBase } from "./ShaderPassBase";
import { ShaderStage } from "./ShaderStage";
import { Preprocessor } from "./util/Preprocessor";
import { ShaderReflection, ShaderReflectionVarInfo } from "./value/ShaderReflectionInfo";
import { ShaderState } from "./value/ShaderState";
import { RendererPassState } from "../../../renderJob/passRenderer/state/RendererPassState";
import { GPUBufferType } from "../core/buffer/GPUBufferType";
import { MaterialDataUniformGPUBuffer } from "../core/buffer/MaterialDataUniformGPUBuffer";
import { ShaderUtil } from "./util/ShaderUtil";
import { Reference } from "../../../../util/Reference";
import { CSM } from "../../../../core/csm/CSM";
import { GPUCompareFunction, GPUCullMode } from "../WebGPUConst";
import { UniformValue } from "./value/UniformValue";
import { PassType } from "../../../renderJob/passRenderer/state/PassType";
import { Vector4 } from "../../../../math/Vector4";
import { Vector2 } from "../../../../math/Vector2";
import { Vector3 } from "../../../../math/Vector3";
import { PipelinePool } from "../PipelinePool";

/**
 * A single render pass of a shader: pairs a vertex and fragment shader,
 * owns the shader state, textures, uniforms, bind group layouts and the
 * GPURenderPipeline built from them. Each pass is bound to a single
 * Context3D and rebuilds its pipeline lazily when its state changes.
 * @group GFX
 */
export class RenderShaderPass extends ShaderPassBase {

    /**
     * The type of pass (color, shadow, OIT accumulation, depth peel, …).
     */
    public passType: PassType = PassType.COLOR;

    /**
     * Whether this pass participates in the reverse-Z depth pipeline.
     */
    public useRz: boolean = false;

    /**
     * Vertex shader name
     */
    public vsName: string;

    /**
     * Fragment shader name
     */
    public fsName: string;

    /**
     * State of the shader
     */
    public shaderState: ShaderState;

    /**
     * The collection of textures used in shading
     */
    public textures: { [name: string]: Texture };

    /**
     * Render pipeline. Plan B: one pipeline per RenderShaderPass, bound to
     * a single Context3D. Attempts to use this pass with a second engine
     * throw via bindCtx.
     */
    public pipeline: GPURenderPipeline = null;

    /**
     * BindGroup layouts (single-field, bound to one Context3D)
     */
    public bindGroupLayouts: GPUBindGroupLayout[] = [];



    /**
     * Environment cube map used for image-based lighting.
     */
    public envMap: Texture;

    /**
     * Pre-filtered environment map used for specular IBL.
     */
    public prefilterMap: Texture;
    /**
     * Reflection cube map used for environment reflections.
     */
    public reflectionMap: Texture;

    protected _sourceVS: string;
    protected _sourceFS: string;
    protected _destVS: string;
    protected _destFS: string;
    protected _vsShaderModule: GPUShaderModule;
    protected _fsShaderModule: GPUShaderModule;
    protected _textureGroup: number = -1;
    protected _textureChange: boolean = false;
    protected _groupsShaderReflectionVarInfos: ShaderReflectionVarInfo[][];
    /**
     * Per-channel write mask applied to the pass's output buffer.
     */
    outBufferMask: Vector4;

    /**
     * @param vs Vertex shader name (must be registered in ShaderLib).
     * @param fs Fragment shader name (must be registered in ShaderLib).
     */
    constructor(vs: string, fs: string) {
        super();

        this.vsName = vs.toLowerCase();
        this.fsName = fs.toLowerCase();

        if (!(this.vsName in ShaderLib)) {
            console.error(`Shader Not Register, Please Register Shader!`, this.vsName);
        }

        if (!(this.fsName in ShaderLib)) {
            console.error(`Shader Not Register, Please Register Shader!`, this.fsName);
        }

        if (ShaderLib[this.vsName]) {
            this._sourceVS = ShaderLib[this.vsName];
        }

        if (ShaderLib[this.fsName]) {
            this._sourceFS = ShaderLib[this.fsName];
        }

        this.textures = {};
        this.bindGroups = [];
        this.shaderState = new ShaderState();

        this.materialDataUniformBuffer = new MaterialDataUniformGPUBuffer();
        this.materialDataUniformBuffer.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
        this._bufferDic.set(`global`, this.materialDataUniformBuffer);
        this._bufferDic.set(`materialUniform`, this.materialDataUniformBuffer);
    }

    /**
     * Blend mode
     */
    public get renderOrder(): number {
        return this.shaderState.renderOrder;
    }

    public set renderOrder(value: number) {
        if (this.shaderState.renderOrder != value) {
            this._valueChange = true;
        }
        this.shaderState.renderOrder = value;
    }

    /**
        * Cull mode
        */
    public get doubleSide(): boolean {
        return this.shaderState.cullMode == GPUCullMode.none;
    }

    public set doubleSide(value: boolean) {
        let b = value ? GPUCullMode.none : this.cullMode;
        if (this.shaderState.cullMode != b) {
            this._valueChange = true;
        }
        this.shaderState.cullMode = b;
    }

    /**
     * depthWriteEnabled mode
     */
    public get depthWriteEnabled(): boolean {
        return this.shaderState.depthWriteEnabled;
    }

    public set depthWriteEnabled(value: boolean) {
        if (this.shaderState.depthWriteEnabled != value) {
            this._valueChange = true;
        }
        this.shaderState.depthWriteEnabled = value;
    }

    /**
     * get render face cull mode
     */
    public get cullMode(): GPUCullMode {
        return this.shaderState.cullMode;
    }

    /**
     * set render face cull mode
     */
    public set cullMode(value: GPUCullMode) {
        if (this.shaderState.cullMode != value) {
            this._valueChange = true;
        }
        this.shaderState.cullMode = value;
    }

    /**
     * get front face mode
     * @GPUFrontFace
     */
    public get frontFace(): GPUFrontFace {
        return this.shaderState.frontFace;
    }

    /**
     * set front face mode
     * @GPUFrontFace value
     */
    public set frontFace(value: GPUFrontFace) {
        if (this.shaderState.frontFace != value) {
            this._valueChange = true;
        }
        this.shaderState.frontFace = value;
    }

    /**
     * Depth bias
     */
    public get depthBias(): number {
        return this.shaderState.depthBias;
    }

    public set depthBias(value: number) {
        if (this.shaderState.depthBias != value) {
            this._valueChange = true;
        }
        this.shaderState.depthBias = value;
    }

    /**
     * Primitive topology
     */
    public get topology(): GPUPrimitiveTopology {
        return this.shaderState.topology;
    }

    public set topology(value: GPUPrimitiveTopology) {
        if (this.shaderState.topology != value) {
            this._valueChange = true;
        }
        this.shaderState.topology = value;
    }

    /**
     * Blend mode
     */
    public get blendMode(): BlendMode {
        return this.shaderState.blendMode;
    }

    public set blendMode(value: BlendMode) {
        if (this.shaderState.blendMode != value) {
            this._valueChange = true;
            if (value != BlendMode.NORMAL && value != BlendMode.NONE) {
                this.renderOrder = 3000;
            }
        }
        this.shaderState.blendMode = value;
    }

    /**
     * Depth compare function
     */
    public get depthCompare(): GPUCompareFunction {
        return this.shaderState.depthCompare;
    }

    public set depthCompare(value: GPUCompareFunction) {
        if (this.shaderState.depthCompare != value) {
            this._valueChange = true;
        }
        this.shaderState.depthCompare = value;
    }

    /**
     * Stencil front face state
     */
    public get stencilFront(): GPUStencilFaceState {
        return this.shaderState.stencilFront;
    }

    public set stencilFront(value: GPUStencilFaceState) {
        this.shaderState.stencilFront = value;
        this._valueChange = true;
    }

    /**
     * Stencil back face state
     */
    public get stencilBack(): GPUStencilFaceState {
        return this.shaderState.stencilBack;
    }

    public set stencilBack(value: GPUStencilFaceState) {
        this.shaderState.stencilBack = value;
        this._valueChange = true;
    }

    /**
     * Stencil read mask
     */
    public get stencilReadMask(): number {
        return this.shaderState.stencilReadMask;
    }

    public set stencilReadMask(value: number) {
        if (this.shaderState.stencilReadMask != value) {
            this._valueChange = true;
        }
        this.shaderState.stencilReadMask = value;
    }

    /**
     * Stencil write mask
     */
    public get stencilWriteMask(): number {
        return this.shaderState.stencilWriteMask;
    }

    public set stencilWriteMask(value: number) {
        if (this.shaderState.stencilWriteMask != value) {
            this._valueChange = true;
        }
        this.shaderState.stencilWriteMask = value;
    }

    /**
     * Stencil reference value (used with setStencilReference)
     */
    public get stencilRef(): number {
        return this.shaderState.stencilRef;
    }

    public set stencilRef(value: number) {
        this.shaderState.stencilRef = value;
    }

    /**
     * Sets the entry point names for the RenderShader vertex phase and fragment phase
     * @param vsEntryPoint 
     * @param fsEntryPoint 
     */
    public setShaderEntry(vsEntryPoint: string = '', fsEntryPoint: string = '') {
        this.vsEntryPoint = vsEntryPoint;
        this.fsEntryPoint = fsEntryPoint;
    }

    /**
     * 
     * @param String name 
     * @param UniformValue value 
     */
    public setUniform(name: string, value: UniformValue) {
        super.setUniform(name, value);
        this.materialDataUniformBuffer.onChange();
    }

    /**
     * Set the texture used in the Render Shader code
     * @param name Name in the shader code
     * @param texture Texture object
     */
    public setTexture(name: string, texture: Texture) {
        if (texture && this.textures[name] != texture) {
            const prev = this.textures[name];
            if (prev) {
                prev.unBindStateChange(this);
                Reference.getInstance().detached(prev, this);
            }
            this._textureChange = true;
            this.textures[name] = texture;
            // Track every texture in the Reference graph so destroy()'s
            // detach is balanced by an attach. Previously only envMap
            // was attached here; baseMap/normalMap/maskMap/emissiveMap
            // (and the special prefilterMap/reflectionMap routing) only
            // accumulated a Reference inside getGroupLayout — and that
            // runs at pipeline-build time. A template Object3D loaded
            // from glTF whose pipeline never built (e.g. the `player`
            // in Sample_AddRemove, used solely as a clone source) never
            // attached its baseMap. Then destroying the FIRST clone
            // (whose pipeline did build, attaching baseMap once) sent
            // refcount to zero and force-destroyed the SHARED gltf
            // texture — the second clone got a baseMap whose
            // _gpuTexture was null and createBindGroup rejected the
            // (now-undefined) GPUTextureView at the entries' resource
            // slot.
            Reference.getInstance().attached(texture, this);
            if (name == "envMap") {
                this.envMap = texture;
            } else if (name == "prefilterMap") {
                this.prefilterMap = texture;
            } else if (name == "reflectionMap") {
                this.reflectionMap = texture;
            }
            texture.bindStateChange(() => {
                this._textureChange = true;
            }, this);
        }
    }

    /**
     * Base color tint, backed by the `baseColor` uniform.
     */
    public get baseColor(): Color {
        return this.getUniform(`baseColor`);
    }

    public set baseColor(value: Color) {
        this.setUniform(`baseColor`, value);
    }

    /**
     * Get the texture used in the Render Shader code
     * @param name Name in the shader code
     * @returns Texture object
     */
    public getTexture(name: string) {
        return this.textures[name];
    }

    /**
     * Declare that the material slot `name` should be sourced from a
     * Frame Graph resource handle rather than a pre-bound Texture.
     * Resolution is deferred until `resolveBindings(view)` runs — the
     * graph's resource pool may not have produced the GPUTexture yet
     * when the declaration happens.
     *
     * A frame-graph-aware feature can hand its material a named handle
     * at setup time, and the `RenderNode.nodeUpdate` path keeps working
     * in parallel. No behavior change when `declareBinding` is never
     * called.
     *
     * @param name   Shader-side texture binding name (e.g. `shadowMap`).
     * @param handleName  Frame Graph handle name (e.g. `_MainShadowMap`).
     */
    public declareBinding(name: string, handleName: string): void {
        if (!this._graphBindings) this._graphBindings = new Map();
        this._graphBindings.set(name, handleName);
    }

    /**
     * Return the declared handle name for a material slot, or null
     * if the slot is not backed by a Frame Graph handle.
     */
    public getDeclaredBinding(name: string): string | null {
        return this._graphBindings?.get(name) ?? null;
    }

    /**
     * Walk declared bindings and push the current frame's resolved
     * textures into the material via `setTexture`. Safe to call
     * every frame — `setTexture` is a no-op when the resolved
     * texture is identity-equal to the previously bound one.
     *
     * No-op unless `view.renderGraph` is present (legacy path) and
     * the pool actually holds the declared resource.
     */
    public resolveBindings(view: { renderGraph?: { pool: { has(n: string): boolean; get<T>(n: string): T } } }): void {
        if (!this._graphBindings) return;
        const graph = view.renderGraph;
        if (!graph) return;
        const pool = graph.pool;
        for (const [slot, handleName] of this._graphBindings) {
            if (!pool.has(handleName)) continue;
            const resource = pool.get<Texture>(handleName);
            if (resource) this.setTexture(slot, resource);
        }
    }

    /** Map of `materialSlotName → frameGraphHandleName`. Created lazily
     *  the first time `declareBinding` is called; remains undefined
     *  for materials that do not use Frame Graph handles. */
    private _graphBindings?: Map<string, string>;

    /**
     * Create a rendering pipeline
     * @param geometry
     * @param renderPassState
     */
    public genRenderPipeline(geometry: GeometryBase, renderPassState: RendererPassState) {
        let layouts = this.createGroupLayouts();
        this.createPipeline(geometry, renderPassState, layouts);
    }

    /**
     * Recompile the shader and create the rendering pipeline
     * @param geometry 
     * @param rendererPassState 
     */
    public reBuild(geometry: GeometryBase, rendererPassState: RendererPassState) {
        this.compileShader(ShaderStage.vertex, this._destVS, rendererPassState);
        this.compileShader(ShaderStage.fragment, this._destFS, rendererPassState);
        // Orphan renderers (ViewQuad used by post passes) never reach
        // RenderNode.initPipeline, so vertexBufferLayouts is empty when
        // createPipeline reads it — the resulting pipeline is missing
        // every attribute slot beyond 0 and WebGPU rejects it. generate()
        // is idempotent, so the normal scene-graph path is unaffected.
        geometry.generate(this.shaderReflection);
        this.genRenderPipeline(geometry, rendererPassState);
        // this.apply(geometry,rendererPassState);
    }

    /**
     * Apply render shader state value 
     * @param geometry 
     * @param materialPass 
     * @param rendererPassState 
     * @param noticeFun 
     */
    public apply(ctx: Context3D, geometry: GeometryBase, rendererPassState: RendererPassState, noticeFun?: Function) {
        bindCtx(this, ctx);
        // First apply path of a derived pass (OIT_ACCUM, SHADOW, …) hits
        // materialDataUniformBuffer with an EMPTY uniformNodes list —
        // initDataUniform only runs inside reBuild's createGroupLayouts.
        // The early-return in MaterialDataUniformGPUBuffer.apply meant
        // the GPU buffer was never written for the derived pass, so the
        // shader read all-zero `materialUniform.baseColor` (including
        // baseColor.a = 0, which collapsed the OIT alpha to 0 and
        // produced an empty accumulation buffer). Apply BEFORE and
        // AFTER reBuild so the freshly-populated uniformNodes do their
        // first GPU upload on the same frame the pass is built.
        const wasFirstBuild = !this.pipeline;
        this.materialDataUniformBuffer.apply(ctx);

        // Plan B: rebuild only when shader state changes or first time.
        if (this._valueChange || !this.pipeline) {
            if (this._shaderChange) {
                this.preCompile(geometry);
                this._shaderChange = false;
            }
            this.shaderVariant = ShaderReflection.genRenderShaderVariant(this);
            this.reBuild(geometry, rendererPassState);
            this._valueChange = false;
            if (noticeFun) {
                noticeFun();
            }
        }
        if (wasFirstBuild) {
            this.materialDataUniformBuffer.onChange();
            this.materialDataUniformBuffer.apply(ctx);
        }

        if (this._textureChange && this._textureGroup != -1) {
            this._textureChange = false;
            this.genGroups(this._textureGroup, this.shaderReflection.groups, true);
        }
    }

    /**
     * Precompile the shader code
     * @param geometry 
     */
    public preCompile(geometry: GeometryBase) {
        this.preDefine(geometry);
        this.preCompileShader(ShaderStage.vertex, this._sourceVS.concat());
        this.preCompileShader(ShaderStage.fragment, this._sourceFS.concat());
        this.genReflection();
    }

    /**
     * Apply defines syntax values
     * @param shader 
     * @param renderPassState 
     * @returns 
     */
    public applyPostDefine(shader: string, renderPassState: RendererPassState) {
        //*********************************/
        //******************/

        if (renderPassState.renderTargetTextures.length > 1) {
            this.defineValue[`USE_WORLDPOS`] = true;
            this.defineValue[`USEGBUFFER`] = true;
        } else {
            this.defineValue[`USE_WORLDPOS`] = false;
            this.defineValue[`USEGBUFFER`] = false;
        }

        if (this._boundCtx!.engine!.setting.render.useCompressGBuffer) {
            this.defineValue[`USE_COMPRESSGBUFFER`] = true;
        } else {
            this.defineValue[`USE_COMPRESSGBUFFER`] = false;
        }

        //*********************************/
        //*********************************/
        return Preprocessor.parse(shader, this.defineValue);
    }

    /**
     * Set GPUBindGroup to the specified index slot
     * @param groupIndex 
     * @param group 
     */
    public setBindGroup(groupIndex: number, group: GPUBindGroup) {
        this.bindGroups[groupIndex] = group;
    }

    /**
     * Hook for subclasses to validate a bound buffer; no-op by default.
     * @param _bufferName Name of the buffer binding.
     * @param _buffer The buffer instance.
     */
    protected checkBuffer(_bufferName: string, _buffer: GPUBufferBase) {
        return;
    }

    /**
     * Pre-process shader source: convert GLSL to WGSL when needed and
     * substitute const placeholders, storing the result as the stage's
     * destination source.
     * @param stage Vertex or fragment stage.
     * @param code Raw shader source code.
     */
    protected preCompileShader(stage: ShaderStage, code: string) {
        let shader: string = code;
        // Detect a GLSL `#version XXX core` directive. The previous
        // check was a naive `indexOf('version ')` substring scan,
        // which happily matched the English word "version" sitting in
        // a WGSL comment and incorrectly routed the shader through
        // the GLSL→WGSL converter (which then crashed on #include).
        // Anchor on `#version` followed by a digit at start-of-line
        // so we only catch the actual GLSL directive.
        if (/^\s*#version\s+\d/m.test(shader)) {
            var wgsl = ShaderConverter.convertGLSL(shader);
            shader = wgsl.sourceCode;
        }

        for (const key in this.constValues) {
            if (Object.prototype.hasOwnProperty.call(this.constValues, key)) {
                const value = this.constValues[key];
                shader = shader.replaceAll(`&${key}`, value.toString());
            }
        }

        switch (stage) {
            case ShaderStage.vertex:
                this._destVS = shader;
                break;
            case ShaderStage.fragment:
                this._destFS = shader;
                break;
        }
    }

    /**
     * Apply post-defines and compile the shader stage into a (cached)
     * GPUShaderModule, storing it on the matching stage field.
     * @param stage Vertex or fragment stage.
     * @param code Pre-processed shader source code.
     * @param renderPassState Render pass state driving the post-defines.
     */
    protected compileShader(stage: ShaderStage, code: string, renderPassState: RendererPassState) {
        let shader: string = code;

        shader = this.applyPostDefine(shader, renderPassState);
        let key = code;
        for (let k in this.defineValue) {
            key += `${k}=${this.defineValue[k]},`;
        }

        const shaderModulePool = ShaderUtil.renderShaderModulePool(this._boundCtx!);
        let shaderModule = shaderModulePool.get(key);
        if (!shaderModule) {
            shader = this.applyPostDefine(shader, renderPassState);

            const device = this._boundCtx!.device;
            shaderModule = device.createShaderModule({
                label: stage == ShaderStage.vertex ? this.vsName : this.fsName,
                code: shader,
            });

            shaderModule.getCompilationInfo().then((e) => {
                if (e.messages.length > 0) {
                    console.error(shader);
                    console.error(e);
                }
            });
            shaderModulePool.set(key, shaderModule);
        }

        switch (stage) {
            case ShaderStage.vertex:
                this._vsShaderModule = shaderModule;
                this._destVS = shader;
                break;
            case ShaderStage.fragment:
                this._fsShaderModule = shaderModule;
                this._destFS = shader;
                break;
        }

        // this._sourceVS = "" ;
        // this._sourceFS = "" ;
    }

    /**
     * Build the bind group layout entries for a single group from its
     * reflection info, resolving uniforms, storage buffers, samplers and
     * textures (falling back to default textures when unset).
     * @param index Bind group index.
     * @param infos Reflection variable infos for the group.
     * @returns The layout entries for the group.
     */
    protected getGroupLayout(index: number, infos: ShaderReflectionVarInfo[]): GPUBindGroupLayoutEntry[] {
        let entries: GPUBindGroupLayoutEntry[] = [];
        for (let i = 0; i < infos.length; i++) {
            const info = infos[i];
            if (!info) {
                continue;
            }
            if (info.varType == `uniform`) {
                if (!this._bufferDic.has(info.varName)) {
                    console.error(`not set ${info.varName} buffer`);
                }
                let visibility = this._bufferDic.get(info.varName).visibility;
                let entry: GPUBindGroupLayoutEntry = {
                    binding: info.binding,
                    visibility: visibility,
                    buffer: {
                        type: 'uniform',
                    },
                }
                entries.push(entry);
            } else if (info.varType == `storage-read`) {
                if (!this._bufferDic.has(info.varName)) {
                    console.error(`not set ${info.varName} buffer`);
                }
                let visibility = this._bufferDic.get(info.varName).visibility;
                let entry: GPUBindGroupLayoutEntry = {
                    binding: info.binding,
                    visibility: visibility,
                    buffer: {
                        type: 'read-only-storage',
                    },
                }
                entries.push(entry);
            } else if (info.varType == `var`) {
                switch (info.dataType) {
                    case `sampler`:
                        {
                            // Strip trailing 'Sampler' (and an optional 'Raw'/'Cmp' suffix
                            // that lets a second sampler binding share the same texture —
                            // e.g. shadowMapSamplerRaw reuses texture 'shadowMap' via its
                            // non-comparison sampler for PCSS blocker search).
                            let textureName = info.varName.replace(/Sampler(Raw|Cmp)?$/, ``);
                            let texture = this.textures[textureName] ? this.textures[textureName] : Engine3D.resFor(this._boundCtx).redTexture;
                            let entry: GPUBindGroupLayoutEntry = {
                                binding: info.binding,
                                visibility: texture.visibility,
                                sampler: texture.samplerBindingLayout,
                            }
                            entries.push(entry);
                            this._textureGroup = index;
                        }
                        break;
                    case `sampler_comparison`:
                        {
                            let textureName = info.varName.replace(/Sampler(Raw|Cmp)?$/, ``);
                            let texture = this.textures[textureName] ? this.textures[textureName] : Engine3D.resFor(this._boundCtx).redTexture;
                            let entry: GPUBindGroupLayoutEntry = {
                                binding: info.binding,
                                visibility: texture.visibility,
                                sampler: texture.sampler_comparisonBindingLayout
                            }
                            entries.push(entry);
                            this._textureGroup = index;
                        }
                        break;
                    case `texture_2d<f32>`:
                    case `texture_2d_array<f32>`:
                    case `texture_cube<f32>`:
                    case `texture_depth_2d`:
                    case `texture_depth_2d_array`:
                    case `texture_depth_cube`:
                    case `texture_depth_cube_array`:
                        {
                            let texture = this.textures[info.varName] ? this.textures[info.varName] : Engine3D.resFor(this._boundCtx).redTexture;
                            let entry: GPUBindGroupLayoutEntry = {
                                binding: info.binding,
                                visibility: texture.visibility,
                                texture: texture.textureBindingLayout,
                            }
                            entries.push(entry);
                            this._textureGroup = index;
                            Reference.getInstance().attached(texture, this);
                        }
                        break;
                    case `texture_external`:
                        {
                            let texture = this.textures[info.varName] ? this.textures[info.varName] : Engine3D.resFor(this._boundCtx).redTexture;
                            let entry: GPUBindGroupLayoutEntry = {
                                binding: info.binding,
                                visibility: texture.visibility,
                                externalTexture: {}
                            }
                            entries.push(entry);
                            this._textureGroup = index;
                            Reference.getInstance().attached(texture, this);
                        }
                        break;
                    default:
                        {
                            let texture = this.textures[info.varName] ? this.textures[info.varName] : Engine3D.resFor(this._boundCtx).redTexture;
                            let entry: GPUBindGroupLayoutEntry = {
                                binding: info.binding,
                                visibility: texture.visibility,
                                texture: texture.textureBindingLayout,
                            }
                            entries.push(entry);
                            this._textureGroup = index;
                            Reference.getInstance().attached(texture, this);
                        }
                        break;
                }
            } else {
                debugger
                console.error("bind group can't empty");
            }
        }
        return entries;
    }

    /**
     * Create the GPUBindGroup for a group from its reflection info,
     * binding the resolved buffers, samplers and texture views.
     * @param groupIndex Bind group index to (re)build.
     * @param infos Per-group reflection variable infos.
     * @param force Rebuild even if the bind group already exists.
     */
    protected genGroups(groupIndex: number, infos: ShaderReflectionVarInfo[][], force: boolean = false) {
        if (!this.bindGroups[groupIndex] || force) {
            const shaderRefs: ShaderReflectionVarInfo[] = infos[groupIndex];
            let entries = [];
            for (let j = 0; j < shaderRefs.length; j++) {
                const refs = shaderRefs[j];
                if (!refs) continue;
                if (refs.varType == `uniform`) {
                    let buffer = this._bufferDic.get(refs.varName);
                    if (buffer) {
                        if (buffer.bufferType == GPUBufferType.MaterialDataUniformGPUBuffer) {
                            let uniforms: UniformNode[] = [];
                            for (let i = 0; i < refs.dataFields.length; i++) {
                                const field = refs.dataFields[i];
                                if (!this.uniforms[field.name]) {
                                    console.error(`shader-${this.vsName}:${this.fsName} ${field.name}is empty`);
                                }
                                uniforms.push(this.uniforms[field.name]);
                            }
                            this.materialDataUniformBuffer.initDataUniform(uniforms);
                        }

                        if (!buffer._boundCtx && this._boundCtx) bindCtx(buffer, this._boundCtx);
                        let entry: GPUBindGroupEntry = {
                            binding: refs.binding,
                            resource: {
                                buffer: buffer.buffer,
                                offset: 0,//buffer.memory.shareFloat32Array.byteOffset,
                                size: buffer.memory.shareDataBuffer.byteLength,
                            },
                        }
                        entries.push(entry);

                        this.checkBuffer(refs.varName, buffer);

                    } else {
                        console.error(`shader${this.vsName}-${this.fsName}`, `buffer ${refs.varName} is missing!`);
                    }
                } else if (refs.varType == `storage-read`) {
                    let buffer = this._bufferDic.get(refs.varName);
                    if (buffer) {
                        if (!buffer._boundCtx && this._boundCtx) bindCtx(buffer, this._boundCtx);
                        let entry: GPUBindGroupEntry = {
                            binding: refs.binding,
                            resource: {
                                buffer: buffer.buffer,
                                offset: 0,//buffer.memory.shareFloat32Array.byteOffset,
                                size: buffer.memory.shareDataBuffer.byteLength,
                            },
                        }
                        entries.push(entry);
                        this.checkBuffer(refs.varName, buffer);
                    } else {
                        console.error(`buffer ${refs.varName} is missing!`);
                    }
                } else if (refs.varType == `var`) {
                    // Lazily bind any texture reaching the bind group to this
                    // pass's Context3D. Samples commonly `new BitmapTexture2D()`
                    // without threading the engine's ctx; first real GPU use
                    // (this path) is where the binding is resolvable.
                    const bindIfNeeded = (t: Texture) => {
                        if (t && !t._boundCtx && this._boundCtx) bindCtx(t, this._boundCtx);
                    };
                    if (refs.dataType == `sampler`) {
                        // Support <Texture>SamplerRaw / <Texture>SamplerCmp aliases —
                        // both resolve to the texture named <Texture>, but with the
                        // non-comparison sampler (Raw = no suffix too).
                        let textureName = refs.varName.replace(/Sampler(Raw|Cmp)?$/, ``);
                        let texture = this.textures[textureName];
                        if (!texture) {
                            texture = Engine3D.resFor(this._boundCtx).blackTexture;
                            this.setTexture(textureName, texture);
                        }
                        if (texture) {
                            bindIfNeeded(texture);
                            let entry: GPUBindGroupEntry = {
                                binding: refs.binding,
                                resource: texture.gpuSampler
                            }
                            entries.push(entry);
                        } else {
                            console.error(`shader${this.vsName}-${this.fsName}`, `texture ${refs.varName} is missing! `);
                        }
                    } else if (refs.dataType == `sampler_comparison`) {
                        let textureName = refs.varName.replace(/Sampler(Raw|Cmp)?$/, ``);
                        let texture = this.textures[textureName];
                        if (texture) {
                            bindIfNeeded(texture);
                            let entry: GPUBindGroupEntry = {
                                binding: refs.binding,
                                resource: texture.gpuSampler_comparison
                            }
                            entries.push(entry);
                        } else {
                            console.error(`shader${this.vsName}-${this.fsName}`, `texture ${refs.varName} is missing! `);
                        }
                    } else {
                        let texture = this.textures[refs.varName];
                        if (!texture) {
                            texture = Engine3D.resFor(this._boundCtx).whiteTexture;
                            this.setTexture(refs.varName, texture);
                        }
                        if (texture) {
                            bindIfNeeded(texture);
                            let entry: GPUBindGroupEntry = {
                                binding: refs.binding,
                                resource: texture.getGPUView(),
                            }
                            entries.push(entry);
                        } else {
                            console.error(`shader${this.vsName}-${this.fsName}`, `texture ${refs.varName} is missing! `);
                        }
                    }
                }
            }

            const device = this._boundCtx!.device;
            let gpubindGroup = device.createBindGroup({
                layout: this.bindGroupLayouts[groupIndex],
                entries: entries
            });
            this.bindGroups[groupIndex] = gpubindGroup;
        }
    }

    private createPipeline(geometry: GeometryBase, renderPassState: RendererPassState, layouts: GPUPipelineLayout) {
        let bufferMesh = geometry;
        let shaderState = this.shaderState;

        //create color state
        let targets: GPUColorTargetState[] = [];
        for (const tex of renderPassState.renderTargetTextures) {
            targets.push({
                format: tex.format,
            });
        }

        //set color state
        for (let i = 0; i < targets.length; i++) {
            const rtTexState = targets[i];
            if (shaderState.writeMasks && shaderState.writeMasks.length > 0) {
                rtTexState.writeMask = shaderState.writeMasks[i];
            }
        }

        if (renderPassState.outColor != -1) {
            let target = targets[renderPassState.outColor];
            if (shaderState.blendMode != BlendMode.NONE) {
                target.blend = BlendFactor.getBlend(shaderState.blendMode);
            } else {
                delete target[`blend`];
            }
        }

        // P2: per-attachment blend states for the WBOIT accumulation
        // pass. Target 0 (accum) uses additive blending in both color
        // and alpha so contributions from any number of fragments can
        // be summed in arbitrary order. Target 1 (reveal) uses
        // multiplicative blending of (1 - src) so the alpha channel
        // tracks the visibility product. The two formulas come from
        // McGuire & Bavoil 2013 §4.
        if (this.passType === PassType.OIT_ACCUM && targets.length >= 2) {
            targets[0].blend = {
                color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
            };
            targets[1].blend = {
                color: { srcFactor: 'zero', dstFactor: 'one-minus-src', operation: 'add' },
                alpha: { srcFactor: 'zero', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            };
        }

        // Dual Depth Peeling per-target blend wiring.
        //
        // OIT_DEPTH_PEEL_DEPTH writes (-d, d) to RG32F and uses MAX
        // blending per-channel so multiple fragments at the same pixel
        // converge to (-min, max). The B/A channels are unused — kept
        // at MAX as well for symmetry, they stay at the cleared
        // -MAX_DEPTH value because shader writes 0 there.
        //
        // OIT_DEPTH_PEEL_FRONT and _BACK use overwrite blending
        // (one/zero). Their accumulation is done in the shader via
        // texelFetch of the previous-iteration MRT plus an arithmetic
        // composite, then the result overwrites the current MRT. This
        // keeps blend wiring simple and lets the shader express the
        // exact `(1-prevA) * α * rgb` over operator without relying on
        // hardware blend factor combinations.
        if (this.passType === PassType.OIT_DEPTH_PEEL_DEPTH && targets.length >= 1) {
            targets[0].blend = {
                color: { srcFactor: 'one', dstFactor: 'one', operation: 'max' },
                alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'max' },
            };
        }
        if (this.passType === PassType.OIT_DEPTH_PEEL_FRONT && targets.length >= 1) {
            targets[0].blend = {
                color: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                alpha: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
            };
        }
        if (this.passType === PassType.OIT_DEPTH_PEEL_BACK && targets.length >= 1) {
            // Back uses under-blend for back-to-front associative
            // accumulation: dst = src.a*src.rgb + (1-src.a)*dst, with
            // the shader emitting un-premultiplied (rgb, α). The
            // standard under-blend wiring is src=ONE_MINUS_DST_ALPHA,
            // dst=ONE.
            targets[0].blend = {
                color: { srcFactor: 'one-minus-dst-alpha', dstFactor: 'one', operation: 'add' },
                alpha: { srcFactor: 'one-minus-dst-alpha', dstFactor: 'one', operation: 'add' },
            };
        }

        let renderPipelineDescriptor: GPURenderPipelineDescriptor = {
            label: this.vsName + '|' + this.fsName,
            layout: layouts,
            primitive: {
                topology: shaderState.topology,
                cullMode: shaderState.cullMode,
                frontFace: shaderState.frontFace,
                unclippedDepth: shaderState.unclippedDepth,
            },
            vertex: undefined,
        };

        if (this.vsEntryPoint != ``) {
            renderPipelineDescriptor[`vertex`] = {
                module: this._vsShaderModule,
                entryPoint: this.vsEntryPoint,
                buffers: bufferMesh.vertexBuffer.getPipelineLayout(this.shaderReflection),
            }
        }

        if (this.fsEntryPoint != '') {
            renderPipelineDescriptor[`fragment`] = {
                module: this._fsShaderModule,
                entryPoint: this.fsEntryPoint,
                targets: targets
            }
        }

        // Prefer the render pass's sample count (driven by GBufferFrame /
        // engine.setting.render.msaa) over the material-side default, so
        // pipelines compile with the right MSAA count for whichever pass
        // they are being built for. `alphaToCoverageEnabled` requires
        // sampleCount > 1 per WebGPU spec, so it is gated implicitly.
        const msaaCount = renderPassState.multisample > 0 ? renderPassState.multisample : shaderState.multisample;
        if (msaaCount > 0) {
            renderPipelineDescriptor[`multisample`] = {
                count: msaaCount,
                alphaToCoverageEnabled: (shaderState.alphaToCoverageEnabled === true && msaaCount > 1) ? true : false,
            }
        }

        if (renderPassState.zPreTexture || renderPassState.depthTexture) {
            if (this._boundCtx!.engine!.setting.render.zPrePass && renderPassState.zPreTexture && shaderState.useZ) {
                // zPrePass color-pass:
                //   - `less_equal` tolerates 1-ULP NDC z drift between
                //     ZPassShader_vs (depth-only pipeline) and Common_vert
                //     (lit pipeline). The hardware can rearrange the
                //     `projMat * viewMat * worldPos` math differently in
                //     each pipeline so bit-exact equality isn't reliable.
                //   - `depthWriteEnabled` MUST mirror the material's own
                //     setting. Opaque materials (depthWrite=true) get to
                //     refine the prepass depth in place — combined with
                //     `less_equal`, post-color depth matches the no-prepass
                //     path. **Transparent materials (BLEND, depthWrite=
                //     false)** must NOT write depth here; they only
                //     depth-test against the opaque depth produced by the
                //     prepass + opaque color. Forcing depthWriteEnabled=
                //     true at this branch was a real bug: BLEND spheres
                //     ended up writing depth, the first-drawn sphere's
                //     depth blocked all subsequent layers under less_equal,
                //     and only insertion order that happened to coincide
                //     with back-to-front sort survived the issue. The
                //     symptom showed up at 180° camera (where insertion
                //     order is front-to-back) as single-layer rendering
                //     in sorted/weighted/hash modes.
                //   - **Early-Z is still active for opaques.** The depth
                //     test runs before the fragment shader; overdrawn
                //     opaques are rejected before the lit shader runs.
                //   - Only the default `less`/`less_equal` compares get
                //     the 1-ULP relaxation. A material that explicitly
                //     sets another compare (`always`, `greater`, …) —
                //     e.g. Graphic3D overlays toggling depth-test off —
                //     must keep it; forcing `less_equal` here silently
                //     disabled `material.depthCompare` for every
                //     zPrePass-on scene.
                renderPipelineDescriptor[`depthStencil`] = {
                    depthWriteEnabled: shaderState.depthWriteEnabled,
                    depthCompare: shaderState.depthCompare == GPUCompareFunction.less
                        ? GPUCompareFunction.less_equal
                        : shaderState.depthCompare,
                    format: renderPassState.zPreTexture.format,
                };
            } else {
                let depthStencilState: any = {
                    depthWriteEnabled: shaderState.depthWriteEnabled,
                    depthCompare: shaderState.depthCompare,
                    format: renderPassState.depthTexture.format,
                    depthBias: shaderState.depthBias,
                    depthBiasSlopeScale: shaderState.depthBiasSlopeScale,
                    depthBiasClamp: shaderState.depthBiasClamp,
                };
                if ((renderPassState.depthTexture.format as string).includes('stencil')) {
                    depthStencilState.stencilFront = shaderState.stencilFront;
                    depthStencilState.stencilBack = shaderState.stencilBack;
                    depthStencilState.stencilReadMask = shaderState.stencilReadMask;
                    depthStencilState.stencilWriteMask = shaderState.stencilWriteMask;
                }
                renderPipelineDescriptor[`depthStencil`] = depthStencilState;
            }
        }

        const ctx = this._boundCtx!;
        // Pipeline cache key must include the renderPass's color/depth
        // attachment formats — `shaderVariant` alone only describes the
        // shader source/defines/state. Two passes with the same shader but
        // different render targets (e.g. main GBuffer vs overlay BGRA8Unorm
        // canvas) produce incompatible pipelines, so they must cache
        // separately.
        const pipelineKey = `${this.shaderVariant}|${RenderShaderPass._attachmentKey(renderPassState)}|a2c${shaderState.alphaToCoverageEnabled ? 1 : 0}|ucd${shaderState.unclippedDepth ? 1 : 0}`;
        let pipeline = PipelinePool.getSharePipeline(ctx, pipelineKey);
        if (pipeline) {
            this.pipeline = pipeline;
        } else {
            this.pipeline = ctx.gpuContext.createPipeline(renderPipelineDescriptor as GPURenderPipelineDescriptor);
            PipelinePool.setSharePipeline(ctx, pipelineKey, this.pipeline);
        }
    }

    private static _attachmentKey(rps: RendererPassState): string {
        let k = '[';
        const targets = rps.renderTargets;
        if (targets && targets.length > 0) {
            for (const t of targets) k += (t?.format ?? '_') + ',';
        } else if (rps.renderTargetTextures && rps.renderTargetTextures.length > 0) {
            for (const t of rps.renderTargetTextures) k += (t?.format ?? '_') + ',';
        } else {
            k += '_';
        }
        k += ']:' + (rps.depthTexture?.format ?? '_');
        if (rps.multisample) k += ':ms' + rps.multisample;
        return k;
    }

    private createGroupLayouts() {
        this._groupsShaderReflectionVarInfos = [];
        let shaderReflection = this.shaderReflection;
        const device = this._boundCtx!.device;
        this.bindGroupLayouts = [GlobalBindGroupLayout.getGlobalDataBindGroupLayout(this._boundCtx!)];

        // Binding Group 1 is Global , skip
        for (let i = 1; i < shaderReflection.groups.length; i++) {
            let shaderRefs = shaderReflection.groups[i];
            if (shaderRefs) {
                let entries = this.getGroupLayout(i, shaderRefs);
                this._groupsShaderReflectionVarInfos[i] = shaderRefs;
                let layout = device.createBindGroupLayout({
                    entries,
                    label: `vs${this.vsName} fs${this.fsName} ${shaderRefs.length}`
                });
                this.bindGroupLayouts[i] = layout;
            } else {
                console.error("can't set empty group!", i);
            }
        }

        let layouts = device.createPipelineLayout({
            bindGroupLayouts: this.bindGroupLayouts,
        });

        // Binding Group 1 is Global
        if (this._groupsShaderReflectionVarInfos[0]) {
            // this.genGroups(0, this.groupsShaderReflectionVarInfos);
        }
        if (this._groupsShaderReflectionVarInfos[1]) {
            this.genGroups(1, this._groupsShaderReflectionVarInfos);
        }
        if (this._groupsShaderReflectionVarInfos[2]) {
            this.genGroups(2, this._groupsShaderReflectionVarInfos);
        }
        if (this._groupsShaderReflectionVarInfos[3]) {
            this.genGroups(3, this._groupsShaderReflectionVarInfos);
        }

        return layouts;
    }

    private preDefine(geometry: GeometryBase) {
        // this.vertexAttributes = "" ;
        // check geometry vertex attributes
        let useSecondUV = geometry.hasAttribute(VertexAttributeName.TEXCOORD_1);

        let isSkeleton = geometry.hasAttribute(VertexAttributeName.joints0);

        let hasMorphTarget = geometry.hasAttribute(VertexAttributeName.a_morphPositions_0);

        let useTangent = geometry.hasAttribute(VertexAttributeName.TANGENT);

        let useVertexColor = geometry.hasAttribute(VertexAttributeName.color);

        let useGI = this.shaderState.acceptGI;

        let useLight = this.shaderState.useLight;

        if (useSecondUV) {
            this.defineValue[`USE_SECONDUV`] = true;
        }

        if (isSkeleton && hasMorphTarget) {
            this.defineValue[`USE_METAHUMAN`] = true;
        } else {
            this.defineValue[`USE_SKELETON`] = isSkeleton;
            this.defineValue[`USE_MORPHTARGETS`] = hasMorphTarget;
        }

        if (!('USE_TANGENT' in this.defineValue)) {
            this.defineValue[`USE_TANGENT`] = useTangent;
        }

        this.defineValue[`USE_GI`] = useGI;
        // this.defineValue[`USE_CASTSHADOW`] = this.shaderState.castShadow;
        this.defineValue[`USE_SHADOWMAPING`] = this.shaderState.acceptShadow;
        this.defineValue[`USE_LIGHT`] = useLight;
        this.defineValue[`USE_VERTXCOLOR`] = useVertexColor;

        const setting = this._boundCtx!.engine!.setting;
        if (setting.pick.mode == `pixel`) {
            this.defineValue[`USE_WORLDPOS`] = true;
        }

        if (setting.gi.enable) {
            this.defineValue[`USEGI`] = true;
        } else {
            this.defineValue[`USEGI`] = false;
        }

        if (setting.render.debug) {
            this.defineValue[`USE_DEBUG`] = true;
            this.defineValue[`DEBUG_CLUSTER`] = true;
        }

        if (this.shaderState.useLight) {
            this.defineValue[`USE_LIGHT`] = true;
        } else {
            this.defineValue[`USE_LIGHT`] = false;
        }

        if (setting.render.useLogDepth) {
            this.defineValue[`USE_LOGDEPTH`] = true;
            this.shaderState.useFragDepth = true;
        } else {
            this.defineValue[`USE_LOGDEPTH`] = false;
        }

        if (this.shaderState.useFragDepth) {
            this.defineValue[`USE_OUTDEPTH`] = true;
        } else {
            this.defineValue[`USE_OUTDEPTH`] = false;
        }

        this.defineValue[`USE_PCF_SHADOW`] = setting.shadow.type == `PCF`;
        this.defineValue[`USE_HARD_SHADOW`] = setting.shadow.type == `HARD`;
        this.defineValue[`USE_SOFT_SHADOW`] = setting.shadow.type == `SOFT`;
        this.defineValue[`USE_CSM`] = CSM.Cascades > 1;
        this.defineValue[`USE_IES_PROFILE`] = IESProfilesPool.for(this._boundCtx!).use;

        this.defineValue[`USE_RTE`] = setting.useRTE;
    }

    private genReflection() {
        this.shaderVariant = ShaderReflection.genRenderShaderVariant(this);
        let reflection = ShaderReflection.poolGetReflection(this.shaderVariant);
        if (!reflection) {
            // Start from a fresh reflection. The current one may be the
            // pooled reflection of the previous variant (taken from the pool
            // below), so it must not be cleared or refilled in place: other
            // passes of that variant would then build their bind group
            // layouts from this variant's bindings. Re-parsing into the old
            // groups[]/variables{} would also mix stale entries with the
            // new ones (e.g. USE_VIDEO_TEXTURE flipping after the video
            // texture loads changes the type at a binding slot).
            this.shaderReflection = new ShaderReflection();

            let vsPreShader = Preprocessor.parse(this._destVS, this.defineValue);
            vsPreShader = Preprocessor.parse(vsPreShader, this.defineValue);
            ShaderReflection.getShaderReflection2(vsPreShader, this);

            let fsPreShader = Preprocessor.parse(this._destFS, this.defineValue);
            fsPreShader = Preprocessor.parse(fsPreShader, this.defineValue);
            ShaderReflection.getShaderReflection2(fsPreShader, this);

            ShaderReflection.final(this);
        } else {
            this.shaderReflection = reflection;
        }

        this.shaderState.splitTexture = this.shaderReflection.useSplit;
    }

    /**
     * Deep-copy this pass into a fresh instance with its own GPU lifecycle.
     *
     * Why this exists: `Material.clone()` → `Shader.clone()` used to share
     * the same RenderShaderPass instance between source and clones. When
     * the clone's material was destroyed (Sample_AddRemove's add → remove
     * → add path), it tore down `materialDataUniformBuffer` /
     * `bindGroupLayouts` / `pipeline` on the SHARED pass — the source
     * material and any future clones then tried to render through dead
     * GPU resources and `createBindGroup` failed validation.
     *
     * The clone re-runs the (sub)class constructor via `this.constructor`
     * so subclass-specific setup (CastShadowMaterialPass uniforms,
     * OITAccumPass entry points, …) is preserved, then overlays the
     * source's user-modified state. Texture / external-buffer references
     * are shared (their lifetime is owner-managed); UniformNode values
     * are copied so vector mutations on one material don't leak into
     * the other; `materialDataUniformBuffer` and the pipeline objects
     * stay fresh from the constructor so the next apply() rebuilds
     * cleanly under the cloned material's own ownership.
     */
    public clone(): RenderShaderPass {
        const Ctor = this.constructor as new (vs?: string, fs?: string) => RenderShaderPass;
        const dst = new Ctor(this.vsName, this.fsName);

        dst.passType = this.passType;
        dst.useRz = this.useRz;
        dst.vsEntryPoint = this.vsEntryPoint;
        dst.fsEntryPoint = this.fsEntryPoint;

        Object.assign(dst.shaderState, this.shaderState);
        dst.defineValue = { ...this.defineValue };
        dst.constValues = { ...this.constValues };

        for (const k in this.textures) {
            if (this.textures[k]) dst.setTexture(k, this.textures[k]);
        }

        // Re-set uniforms by value so the clone owns its own UniformNodes
        // (and on first reBuild, allocates fresh memoryInfos against the
        // clone's own materialDataUniformBuffer). Vector/Color values are
        // copied — UniformNode setters mutate in-place, so sharing the
        // same instance would let writes on one material bleed to the
        // other.
        for (const k in this.uniforms) {
            const node = this.uniforms[k];
            if (!node) continue;
            const v = node.data;
            if (v instanceof Vector2) dst.setUniformVector2(k, new Vector2(v.x, v.y));
            else if (v instanceof Vector3) dst.setUniformVector3(k, new Vector3(v.x, v.y, v.z));
            else if (v instanceof Vector4) dst.setUniformVector4(k, new Vector4(v.x, v.y, v.z, v.w));
            else if (v instanceof Color) dst.setUniformColor(k, new Color(v.r, v.g, v.b, v.a));
            else if (v instanceof Float32Array) dst.setUniformArray(k, new Float32Array(v));
            else if (typeof v === 'number') dst.setUniformFloat(k, v);
            else dst.setUniform(k, v);
        }

        // Copy external buffer bindings (storage/uniform that the renderer
        // wires from elsewhere — e.g. SkinnedMeshRenderer's joint buffers).
        // Skip the two owned slots; the constructor already pointed them at
        // the clone's fresh materialDataUniformBuffer.
        for (const [name, buf] of (this as any)._bufferDic as Map<string, GPUBufferBase>) {
            if (name === 'global' || name === 'materialUniform') continue;
            (dst as any)._bufferDic.set(name, buf);
        }

        // pipeline / bindGroupLayouts / bindGroups / shaderReflection /
        // shader modules / _destVS / _destFS all stay at their fresh-
        // constructor defaults (null/empty); the next apply() will
        // preCompile + reBuild against the clone's own state.
        (dst as any)._shaderChange = true;
        (dst as any)._valueChange = true;
        return dst;
    }

    /**
     * Destroy and release render shader related resources
     */
    public destroy(force?: boolean) {
        for (const key in this.textures) {
            if (Object.prototype.hasOwnProperty.call(this.textures, key)) {
                const texture = this.textures[key];
                Reference.getInstance().detached(texture, this);
                if (force && !Reference.getInstance().hasReference(texture)) {
                    texture.destroy(force);
                } else {
                    texture.destroy(false);
                }
            }
        }

        this.bindGroups.length = 0;
        this.shaderState = null;
        this.textures = null;
        this.pipeline = null;
        this.bindGroupLayouts = null;
        this._sourceVS = null;
        this._sourceFS = null;
        this._destVS = null;
        this._destFS = null;
        this._vsShaderModule = null;
        this._fsShaderModule = null;
        this.materialDataUniformBuffer.destroy();;
        this.materialDataUniformBuffer = null;
    }

    /**
     * Destroy a RenderShader object
     * @param ctx Context3D owning the shader cache
     * @param instanceID instance ID of the RenderShader
     */
    public static destroyShader(ctx: Context3D, instanceID: string) {
        const registry = ShaderUtil.renderShader(ctx);
        if (registry.has(instanceID)) {
            let shader = registry.get(instanceID);
            shader.destroy();
            registry.delete(instanceID);
        }
    }

    /**
     * Get the RenderShader object by specifying the RenderShader instance ID
     * @param ctx Context3D owning the shader cache
     * @param instanceID instance ID of the RenderShader
     * @returns RenderShader object
     */
    public static getShader(ctx: Context3D, instanceID: string) {
        return ShaderUtil.renderShader(ctx).get(instanceID);
    }

    /**
     * Create a RenderShader with vertex shaders and fragment shaders
     * @param ctx Context3D owning the shader cache
     * @param vs Vertex shader name
     * @param fs Fragment shader name
     * @returns Returns the instance ID of the RenderShader
     */
    public static createShader(ctx: Context3D, vs: string, fs: string): string {
        let shader = new RenderShaderPass(vs, fs);
        ShaderUtil.renderShader(ctx).set(shader.instanceID, shader);
        return shader.instanceID;
    }

}


