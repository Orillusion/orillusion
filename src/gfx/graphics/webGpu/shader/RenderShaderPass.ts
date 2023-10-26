import { ShaderLib } from "../../../../assets/shader/ShaderLib";
import { Color } from "../../../../math/Color";
import { VertexAttributeName } from "../../../../core/geometry/VertexAttributeName";
import { GPUContext } from "../../../renderJob/GPUContext";
import { BlendFactor, BlendMode } from "../../../../materials/BlendMode";
import { IESProfiles } from "../../../../components/lights/IESProfiles";
import { GeometryBase } from "../../../../core/geometry/GeometryBase";
import { Engine3D } from "../../../../Engine3D";
import { GlobalBindGroupLayout } from "../core/bindGroups/GlobalBindGroupLayout";
import { GPUBufferBase } from "../core/buffer/GPUBufferBase";
import { UniformNode } from "../core/uniforms/UniformNode";
import { Texture } from "../core/texture/Texture";
import { webGPUContext } from "../Context3D";
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
import { PassType } from "../../../renderJob/passRenderer/state/RendererType";
import { Vector4 } from "../../../../math/Vector4";
import { PipelinePool } from "../PipelinePool";

export class RenderShaderPass extends ShaderPassBase {

    public passType: PassType = PassType.COLOR;

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
     * Render pipeline
     */
    public pipeline: GPURenderPipeline;

    /**
     * BindGroup layout
     */
    public bindGroupLayouts: GPUBindGroupLayout[];



    public envMap: Texture;

    public prefilterMap: Texture;

    protected _sourceVS: string;
    protected _sourceFS: string;
    protected _destVS: string;
    protected _destFS: string;
    protected _vsShaderModule: GPUShaderModule;
    protected _fsShaderModule: GPUShaderModule;
    protected _textureGroup: number = -1;
    protected _textureChange: boolean = false;
    protected _groupsShaderReflectionVarInfos: ShaderReflectionVarInfo[][];
    outBufferMask: Vector4;

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
            if (this.textures[name]) {
                this.textures[name].unBindStateChange(this);
            }
            this._textureChange = true;
            this.textures[name] = texture;
            if (name == "envMap") {
                this.envMap = texture;
            } else if (name == "prefilterMap") {
                this.prefilterMap = texture;
            }
            texture.bindStateChange(() => {
                this._textureChange = true;
            }, this);
        }
    }

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
    public apply(geometry: GeometryBase, rendererPassState: RendererPassState, noticeFun?: Function) {
        this.materialDataUniformBuffer.apply();

        if (this._textureChange && this._textureGroup != -1) {
            this._textureChange = false;
            this.genGroups(this._textureGroup, this.shaderReflection.groups, true);
        }

        if (this._valueChange) {
            if (this._shaderChange) {
                this.preCompile(geometry);
                this._shaderChange = false;
            }
            this.shaderVariant = ShaderReflection.genRenderShaderVariant(this);
            this.reBuild(geometry, rendererPassState);
            this._valueChange = false;
            // this.genRenderPipeline(geometry, rendererPassState);
            if (noticeFun) {
                noticeFun();
            }
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

    protected checkBuffer(bufferName: string, buffer: GPUBufferBase) {
        return;
    }

    protected preCompileShader(stage: ShaderStage, code: string, format?: string) {
        let shader: string = code;
        if (shader.indexOf(`version `) != -1) {
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

    protected compileShader(stage: ShaderStage, code: string, renderPassState: RendererPassState) {
        let shader: string = code;

        shader = this.applyPostDefine(shader, renderPassState);
        let key = code;
        for (let k in this.defineValue) {
            key += `${k}=${this.defineValue[k]},`;
        }

        let shaderModule = ShaderUtil.renderShaderModulePool.get(key);
        if (!shaderModule) {
            shader = this.applyPostDefine(shader, renderPassState);

            shaderModule = webGPUContext.device.createShaderModule({
                label: stage == ShaderStage.vertex ? this.vsName : this.fsName,
                code: shader,
            });

            shaderModule.getCompilationInfo().then((e) => {
                if (e.messages.length > 0) {
                    console.log(shader);
                    console.log(e);
                }
            });
            ShaderUtil.renderShaderModulePool.set(key, shaderModule);
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
                            let textureName = info.varName.replace(`Sampler`, ``);
                            let texture = this.textures[textureName] ? this.textures[textureName] : Engine3D.res.redTexture;
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
                            let textureName = info.varName.replace(`Sampler`, ``);
                            let texture = this.textures[textureName] ? this.textures[textureName] : Engine3D.res.redTexture;
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
                            let texture = this.textures[info.varName] ? this.textures[info.varName] : Engine3D.res.redTexture;
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
                            let texture = this.textures[info.varName] ? this.textures[info.varName] : Engine3D.res.redTexture;
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
                            let texture = this.textures[info.varName] ? this.textures[info.varName] : Engine3D.res.redTexture;
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

    private _cacheEntries
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
                    if (refs.dataType == `sampler`) {
                        let textureName = refs.varName.replace(`Sampler`, ``);
                        let texture = this.textures[textureName];
                        if (!texture) {
                            texture = Engine3D.res.blackTexture;
                            this.setTexture(textureName, texture);
                        }
                        if (texture) {
                            let entry: GPUBindGroupEntry = {
                                binding: refs.binding,
                                resource: texture.gpuSampler
                            }
                            entries.push(entry);
                        } else {
                            console.error(`shader${this.vsName}-${this.fsName}`, `texture ${refs.varName} is missing! `);
                        }
                    } else if (refs.dataType == `sampler_comparison`) {
                        let textureName = refs.varName.replace(`Sampler`, ``);
                        let texture = this.textures[textureName];
                        if (texture) {
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
                            texture = Engine3D.res.whiteTexture;
                            this.setTexture(refs.varName, texture);
                        }
                        if (texture) {
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

            let gpubindGroup = webGPUContext.device.createBindGroup({
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

        let renderPipelineDescriptor: GPURenderPipelineDescriptor = {
            label: this.vsName + '|' + this.fsName,
            layout: layouts,
            primitive: {
                topology: shaderState.topology,
                cullMode: shaderState.cullMode,
                frontFace: shaderState.frontFace,
            },
            vertex: undefined,
        };

        if (this.vsEntryPoint != ``) {
            renderPipelineDescriptor[`vertex`] = {
                module: this._vsShaderModule,
                entryPoint: this.vsEntryPoint,
                buffers: bufferMesh.vertexBuffer.vertexBufferLayouts,
            }
        }

        if (this.fsEntryPoint != '') {
            renderPipelineDescriptor[`fragment`] = {
                module: this._fsShaderModule,
                entryPoint: this.fsEntryPoint,
                targets: targets
            }
        }

        if (shaderState.multisample > 0) {
            renderPipelineDescriptor[`multisample`] = {
                count: shaderState.multisample
            }
        }

        if (renderPassState.zPreTexture || renderPassState.depthTexture) {
            let blendEnable = shaderState.blendMode != BlendMode.NONE;
            if (Engine3D.setting.render.zPrePass && renderPassState.zPreTexture && shaderState.useZ) {
                renderPipelineDescriptor[`depthStencil`] = {
                    depthWriteEnabled: false,
                    depthCompare: GPUCompareFunction.less,
                    format: renderPassState.zPreTexture.format,
                };
            } else {
                renderPipelineDescriptor[`depthStencil`] = {
                    depthWriteEnabled: shaderState.depthWriteEnabled,
                    depthCompare: shaderState.depthCompare,
                    format: renderPassState.depthTexture.format,
                };

            }
        }

        let pipeline = PipelinePool.getSharePipeline(this.shaderVariant);
        if (pipeline) {
            this.pipeline = pipeline;
        } else {
            this.pipeline = GPUContext.createPipeline(renderPipelineDescriptor as GPURenderPipelineDescriptor);
            PipelinePool.setSharePipeline(this.shaderVariant, this.pipeline);
        }
    }

    private createGroupLayouts() {
        this._groupsShaderReflectionVarInfos = [];
        let shaderReflection = this.shaderReflection;
        this.bindGroupLayouts = [GlobalBindGroupLayout.getGlobalDataBindGroupLayout()];

        // Binding Group 1 is Global , skip
        for (let i = 1; i < shaderReflection.groups.length; i++) {
            let shaderRefs = shaderReflection.groups[i];
            if (shaderRefs) {
                let entries = this.getGroupLayout(i, shaderRefs);
                this._groupsShaderReflectionVarInfos[i] = shaderRefs;
                let layout = webGPUContext.device.createBindGroupLayout({
                    entries,
                    label: `vs${this.vsName} fs${this.fsName} ${shaderRefs.length}`
                });
                this.bindGroupLayouts[i] = layout;
            } else {
                console.error("can't set empty group!", i);
            }
        }

        let layouts = webGPUContext.device.createPipelineLayout({
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
        this.defineValue[`USE_CASTSHADOW`] = this.shaderState.castShadow;
        this.defineValue[`USE_SHADOWMAPING`] = this.shaderState.acceptShadow;
        this.defineValue[`USE_LIGHT`] = useLight;
        this.defineValue[`USE_VERTXCOLOR`] = useVertexColor;

        if (Engine3D.setting.pick.mode == `pixel`) {
            this.defineValue[`USE_WORLDPOS`] = true;
        }

        if (Engine3D.setting.gi.enable) {
            this.defineValue[`USEGI`] = true;
        } else {
            this.defineValue[`USEGI`] = false;
        }

        if (Engine3D.setting.render.debug) {
            this.defineValue[`USE_DEBUG`] = true;
            this.defineValue[`DEBUG_CLUSTER`] = true;
        }

        if (this.shaderState.useLight) {
            this.defineValue[`USE_LIGHT`] = true;
        } else {
            this.defineValue[`USE_LIGHT`] = false;
        }

        if (Engine3D.setting.render.useLogDepth) {
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

        this.defineValue[`USE_PCF_SHADOW`] = Engine3D.setting.shadow.type == `PCF`;
        this.defineValue[`USE_HARD_SHADOW`] = Engine3D.setting.shadow.type == `HARD`;
        this.defineValue[`USE_SOFT_SHADOW`] = Engine3D.setting.shadow.type == `SOFT`;
        this.defineValue[`USE_CSM`] = CSM.Cascades > 1;
        this.defineValue[`USE_IES_PROFILE`] = IESProfiles.use;

    }

    private genReflection() {
        this.shaderVariant = ShaderReflection.genRenderShaderVariant(this);
        let reflection = ShaderReflection.poolGetReflection(this.shaderVariant);
        if (!reflection) {
            //TODO: key check shader compile info
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
                    let table = Reference.getInstance().getReference(texture);
                    if (table) {
                        let list = [];
                        table.forEach((v, k) => {
                            if (`name` in v) {
                                list.push(v[`name`]);
                            } else {
                                list.push(`NaN`);
                            }
                        });
                    }
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
        this.materialDataUniformBuffer.destroy(force);;
        this.materialDataUniformBuffer = null;
    }

    /**
     * Destroy a RenderShader object
     * @param instanceID instance ID of the RenderShader
     */
    public static destroyShader(instanceID: string) {
        if (ShaderUtil.renderShader.has(instanceID)) {
            let shader = ShaderUtil.renderShader.get(instanceID);
            shader.destroy();
            ShaderUtil.renderShader.delete(instanceID)
        }
    }

    /**
     * Get the RenderShader object by specifying the RenderShader instance ID
     * @param instanceID instance ID of the RenderShader
     * @returns RenderShader object
     */
    public static getShader(instanceID: string) {
        return ShaderUtil.renderShader.get(instanceID);
    }

    /**
     * Create a RenderShader with vertex shaders and fragment shaders
     * @param vs Vertex shader name
     * @param fs Fragment shader name
     * @returns Returns the instance ID of the RenderShader
     */
    public static createShader(vs: string, fs: string): string {
        let shader = new RenderShaderPass(vs, fs);
        ShaderUtil.renderShader.set(shader.instanceID, shader);
        return shader.instanceID;
    }

}


