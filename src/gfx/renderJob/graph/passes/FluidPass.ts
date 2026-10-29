import { FluidAnisotropy_wgsl, FluidEllipsoid_wgsl } from '../../../../assets/shader/fluid/FluidAnisotropy_shader';
import {
    FluidBilateralBlur_wgsl, FluidComposite_wgsl, FluidDebugView_wgsl, FluidGaussianBlur_wgsl, FluidGeometricThickness_wgsl,
    FluidNarrowRangeFilter_wgsl, FluidParticle_wgsl, FluidSceneLinearDepth_wgsl,
} from '../../../../assets/shader/fluid/FluidParticle_shader';
import { DirectLight } from '../../../../components/lights/DirectLight';
import { FluidDebug, FluidDepthFilter, FluidRenderer, FluidThicknessMode } from '../../../../components/renderer/FluidRenderer';
import { Camera3D } from '../../../../core/Camera3D';
import { View3D } from '../../../../core/View3D';
import { Matrix4 } from '../../../../math/Matrix4';
import { Vector3 } from '../../../../math/Vector3';
import { RenderTexture } from '../../../../textures/RenderTexture';
import { Context3D } from '../../../graphics/webGpu/Context3D';
import { Preprocessor } from '../../../graphics/webGpu/shader/util/Preprocessor';
import { ComponentCollect } from '../../collect/ComponentCollect';
import { VisibleLayer } from '../../config/VisibleLayer';
import { GBufferFrame } from '../../frame/GBufferFrame';
import { RenderGraphBuilder, RenderGraphPass, RenderGraphPassContext } from '../RenderGraphPass';
import { COLOR_BUFFER } from './ColorPass';
import { MAIN_COLOR_RT } from './GBufferResourcePass';
import { MAIN_DEPTH_TEXTURE } from './PreDepthPass';

/** Must match COLOR_BUFFER's format. */
const COLOR_FORMAT: GPUTextureFormat = 'rgba16float';
/** Linear view-space depth of the fluid surface; 0 = no fluid, negative = fluid hidden by the scene. */
const DEPTH_FORMAT: GPUTextureFormat = 'r32float';
/** Accumulated thickness; additive blending needs a blendable format. */
const THICKNESS_FORMAT: GPUTextureFormat = 'r16float';

/** See FluidUniforms_wgsl for the layout. */
const UNIFORM_BYTES = 256;
const TMP_UNIFORM_F32 = new Float32Array(UNIFORM_BYTES / 4);
/** See FluidBlurParams_wgsl for the layout. */
const BLUR_UNIFORM_BYTES = 48;
/** Cap of the depth threshold scale at grazing angles. */
const MAX_GRAZING_SCALE = 8;
const TMP_BLUR_F32 = new Float32Array(BLUR_UNIFORM_BYTES / 4);
/** See FluidShadeUniforms_wgsl for the layout. */
const SHADE_UNIFORM_BYTES = 128;
const TMP_SHADE_F32 = new Float32Array(SHADE_UNIFORM_BYTES / 4);

/** Light direction used when the fluid has no dirLight and the scene has no DirectLight. */
const DEFAULT_LIGHT_DIR = new Vector3(-2, -1, 1).normalize();
const TMP_LIGHT_DIR = new Vector3();

const RT_USAGE = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;

/** See FluidAnisotropy_wgsl for the layout. */
const ANISO_UNIFORM_BYTES = 48;
const TMP_ANISO = new ArrayBuffer(ANISO_UNIFORM_BYTES);
const TMP_ANISO_U32 = new Uint32Array(TMP_ANISO);
const TMP_ANISO_F32 = new Float32Array(TMP_ANISO);
/** Hash buckets per scan block; must match SCAN_BLOCK in FluidAnisotropy_wgsl. */
const SCAN_BLOCK = 1024;
/** The block totals are scanned by one workgroup of 256 × 4. */
const MAX_HASH_TABLE = SCAN_BLOCK * SCAN_BLOCK;
/** Background clamp offset of the narrow-range filter, in particle radii. */
const NARROW_RANGE_MU = 3;

type Target = { texture: GPUTexture; view: GPUTextureView; width: number; height: number };

type SceneDepth = {
    texture: GPUTexture;
    /** Depth aspect only, so depth24plus-stencil8 also binds as texture_depth_2d. */
    sampleView: GPUTextureView;
    attachView: GPUTextureView;
};

/** GPU state owned per {@link FluidRenderer}. */
type FluidGpu = {
    uniform: GPUBuffer;
    shade: GPUBuffer;
    /** Upload target for CPU particle data. */
    particleBuffer: GPUBuffer | null;
    particleVersion: number;
    targets: Map<string, Target>;
    blurUniforms: Map<string, GPUBuffer>;
    aniso: AnisoGpu | null;
};

/** Neighbor-search and ellipsoid buffers of one {@link FluidRenderer}. */
type AnisoGpu = {
    params: GPUBuffer;
    capacity: number;
    tableSize: number;
    cellCount: GPUBuffer;
    cellStart: GPUBuffer;
    blockSums: GPUBuffer;
    particleCell: GPUBuffer;
    sortedPos: GPUBuffer;
    ellipsoids: GPUBuffer;
};

/**
 * Screen-space fluid pass. For every enabled {@link FluidRenderer} in
 * the view it:
 *   1. renders the particles as sphere impostors into a linear depth
 *      map and, with additive blending, into a thickness map;
 *   2. smooths depth with a separable bilateral blur and thickness with
 *      a separable gaussian blur;
 *   3. shades the surface (refraction of the scene behind, absorption,
 *      environment reflection, specular) into `_ColorBuffer`, writing
 *      its depth into the scene depth so transparents sort against it.
 *
 * {@link ForwardRendererJob} inserts it between the opaque/transmission
 * passes and the transparent passes when `setting.render.fluid` is true,
 * so the fluid is clipped by opaque geometry and transparent objects
 * draw over it.
 *
 * @group Graph
 */
export class FluidPass extends RenderGraphPass {
    public readonly name: string = 'FluidPass';

    private _device!: GPUDevice;
    private _useLogDepth: boolean = false;

    private _particleBGLayout!: GPUBindGroupLayout;
    private _depthPipeline!: GPURenderPipeline;
    private _thicknessPipeline!: GPURenderPipeline;
    private _blurBGLayout!: GPUBindGroupLayout;
    private _bilateralPipeline!: GPURenderPipeline;
    private _narrowRangePipeline!: GPURenderPipeline;
    /** Blur layout plus the scene's linear depth (binding 2). */
    private _narrowRangeBGLayout!: GPUBindGroupLayout;
    private _sceneLinearBGLayout!: GPUBindGroupLayout;
    private _sceneLinearPipeline!: GPURenderPipeline;
    private _narrowRange2DPipeline!: GPURenderPipeline;
    private _gaussianPipeline!: GPURenderPipeline;
    private _ellipsoidDepthPipeline!: GPURenderPipeline;
    private _ellipsoidThicknessPipeline!: GPURenderPipeline;
    private _backDepthPipeline!: GPURenderPipeline;
    private _ellipsoidBackDepthPipeline!: GPURenderPipeline;
    private _geometricBGLayout!: GPUBindGroupLayout;
    private _geometricPipeline!: GPURenderPipeline;
    private _anisoBGLayout!: GPUBindGroupLayout;
    private _anisoPipelines!: Record<'clearCells' | 'countCells' | 'scanBlocks' | 'scanBlockSums' | 'addBlockOffsets' | 'scatter' | 'computeEllipsoids', GPUComputePipeline>;
    private _debugBGLayout!: GPUBindGroupLayout;
    private _debugPipeline!: GPURenderPipeline;
    /** Fluid maps and shading parameters, shared by the color and depth-write stages. */
    private _surfaceBGLayout!: GPUBindGroupLayout;
    /** Scene inputs of the color stage: color copy, sampler, environment, depth. */
    private _sceneBGLayout!: GPUBindGroupLayout;
    private _compositeModule!: GPUShaderModule;
    private _colorPipeline!: GPURenderPipeline;
    /** Keyed by scene depth format (depth32float, or depth24plus-stencil8 with useStencil). */
    private _depthWritePipelines: Map<GPUTextureFormat, GPURenderPipeline> = new Map();
    private _linearSampler!: GPUSampler;
    private _emptyCubeView!: GPUTextureView;
    private _lights: DirectLight[] = [];

    private _gpu: WeakMap<FluidRenderer, FluidGpu> = new WeakMap();
    private _fluids: FluidRenderer[] = [];
    private _warned: WeakSet<object> = new WeakSet();

    private _sceneDepth: SceneDepth | null = null;
    /** 2 / proj[1][1] of the current camera: world size of the view height per unit of depth. */
    private _pixelWorldPerDepth: number = 1;
    /** Allocated in setup: matrices come from a pool created at engine init. */
    private _modelView!: Matrix4;

    public setup(b: RenderGraphBuilder): void {
        this._device = b.context3D.device as GPUDevice;
        const setting = b.context3D.engine?.setting?.render;
        this._useLogDepth = !!setting?.useLogDepth;
        this._modelView = new Matrix4();

        if (setting?.zPrePass) b.read(MAIN_DEPTH_TEXTURE);
        b.write(COLOR_BUFFER);
        b.useRenderTarget(MAIN_COLOR_RT);

        this._createPipelines();
    }

    public destroy(): void {
        this._fluids.length = 0;
        this._lights.length = 0;
        this._sceneDepth = null;
    }

    public execute(ctx: RenderGraphPassContext): void {
        const view = ctx.view;
        const camera = view.camera;
        const mask = (this.layerMask & (camera?.cullingMask ?? 0xFFFFFFFF)) >>> 0;
        ComponentCollect.collectByTypeLayered<FluidRenderer>(view, FluidRenderer, mask, this._fluids);
        if (this._fluids.length === 0) return;

        const engine = view.engine3D;
        const colorTex = ctx.get<RenderTexture>(COLOR_BUFFER);
        const sceneDepth = this._getSceneDepth(engine.context3D);
        if (!colorTex || !sceneDepth) return;
        const color = colorTex.getGPUTexture() as GPUTexture;
        const [screenW, screenH] = engine.context3D.presentationSize as [number, number];

        const gpu = engine.context3D.gpuContext;
        const command = gpu.beginCommandEncoder();
        for (const fluid of this._fluids) {
            if (!fluid.transform || !fluid.transform.enable) continue;
            const particles = this._getParticleBuffer(fluid);
            if (!particles || fluid.particleCount === 0) continue;
            this._renderFluid(command, view, fluid, camera, particles, sceneDepth, color, screenW, screenH);
        }
        gpu.endCommandEncoder(command);
    }

    private _renderFluid(
        command: GPUCommandEncoder, view: View3D, fluid: FluidRenderer, camera: Camera3D, particles: GPUBuffer,
        sceneDepth: SceneDepth, color: GPUTexture, screenW: number, screenH: number,
    ): void {
        const res = this._ensureGpu(fluid);
        const [dw, dh] = mapSize(fluid.depthMapSize, screenW, screenH);
        const [tw, th] = mapSize(fluid.thicknessMapSize, screenW, screenH);
        const depth = this._target(res, 'depth', dw, dh, DEPTH_FORMAT);
        const zBuffer = this._target(res, 'zBuffer', dw, dh, 'depth32float', GPUTextureUsage.RENDER_ATTACHMENT);
        const thickness = this._target(res, 'thickness', tw, th, THICKNESS_FORMAT);
        this._writeUniforms(res, fluid, camera, depth, thickness, screenW, screenH);

        const count = fluid.particleCount;
        // With anisotropy the particle stages draw ellipsoids from a per-frame neighbor search.
        const ellipsoids = fluid.useAnisotropy ? this._computeEllipsoids(command, res, fluid, particles) : null;
        const depthPipeline = ellipsoids ? this._ellipsoidDepthPipeline : this._depthPipeline;
        const thicknessPipeline = ellipsoids ? this._ellipsoidThicknessPipeline : this._thicknessPipeline;
        const backDepthPipeline = ellipsoids ? this._ellipsoidBackDepthPipeline : this._backDepthPipeline;
        const particleBG = this._device.createBindGroup({
            layout: this._particleBGLayout,
            entries: [
                { binding: 0, resource: { buffer: res.uniform } },
                { binding: 1, resource: { buffer: ellipsoids ?? particles } },
                { binding: 2, resource: sceneDepth.sampleView },
            ],
        });
        const useThickness = !fluid.useFixedThickness;
        {
            const enc = command.beginRenderPass({
                label: 'FluidPass:Depth',
                colorAttachments: [{ view: depth.view, loadOp: 'clear', clearValue: [0, 0, 0, 0], storeOp: 'store' }],
                depthStencilAttachment: { view: zBuffer.view, depthLoadOp: 'clear', depthClearValue: 1, depthStoreOp: 'discard' },
            });
            enc.setPipeline(depthPipeline);
            enc.setBindGroup(0, particleBG);
            enc.draw(6, count);
            enc.end();
        }
        if (useThickness && fluid.thicknessMode === FluidThicknessMode.Geometric) {
            // Far side of the volume, then thickness = far - near per pixel.
            const backDepth = this._target(res, 'backDepth', dw, dh, DEPTH_FORMAT);
            const backZ = this._target(res, 'backZBuffer', dw, dh, 'depth32float', GPUTextureUsage.RENDER_ATTACHMENT);
            {
                const enc = command.beginRenderPass({
                    label: 'FluidPass:BackDepth',
                    colorAttachments: [{ view: backDepth.view, loadOp: 'clear', clearValue: [0, 0, 0, 0], storeOp: 'store' }],
                    depthStencilAttachment: { view: backZ.view, depthLoadOp: 'clear', depthClearValue: 0, depthStoreOp: 'discard' },
                });
                enc.setPipeline(backDepthPipeline);
                enc.setBindGroup(0, particleBG);
                enc.draw(6, count);
                enc.end();
            }
            {
                const bg = this._device.createBindGroup({
                    layout: this._geometricBGLayout,
                    entries: [
                        { binding: 0, resource: { buffer: res.uniform } },
                        { binding: 1, resource: depth.view },
                        { binding: 2, resource: backDepth.view },
                    ],
                });
                const enc = command.beginRenderPass({
                    label: 'FluidPass:GeometricThickness',
                    colorAttachments: [{ view: thickness.view, loadOp: 'clear', clearValue: [0, 0, 0, 0], storeOp: 'store' }],
                });
                enc.setPipeline(this._geometricPipeline);
                enc.setBindGroup(0, bg);
                enc.draw(3);
                enc.end();
            }
        } else if (useThickness) {
            const enc = command.beginRenderPass({
                label: 'FluidPass:Thickness',
                colorAttachments: [{ view: thickness.view, loadOp: 'clear', clearValue: [0, 0, 0, 0], storeOp: 'store' }],
            });
            enc.setPipeline(thicknessPipeline);
            enc.setBindGroup(0, particleBG);
            enc.draw(6, count);
            enc.end();
        }

        let depthBlurred = depth;
        if (fluid.enableBlurDepth) {
            const div = Math.max(1, fluid.blurDepthSizeDivisor);
            const bw = Math.max(1, Math.floor(dw / div));
            const bh = Math.max(1, Math.floor(dh / div));
            // Blur radius in pixels = projectedConstant / viewZ, proportional to the projected particle size.
            const proj11 = camera.projectionMatrix.rawData[5];
            this._pixelWorldPerDepth = 2 / Math.abs(proj11);
            const projected = fluid.blurDepthFilterSize * fluid.particleSize * 0.05 * (bh / 2) * proj11;
            const radius = fluid.particleSize * 0.5;
            const depthThreshold = radius * fluid.blurDepthDepthScale;
            const narrow = fluid.depthFilter === FluidDepthFilter.NarrowRange;
            // The narrow-range filter checks the scene behind empty samples to tell walls from free edges.
            const sceneLinear = narrow ? this._renderSceneLinear(command, res, sceneDepth, dw, dh) : null;
            depthBlurred = this._blur(command, res, 'depthBlur', narrow ? this._narrowRangePipeline : this._bilateralPipeline,
                depth, bw, bh, DEPTH_FORMAT, fluid.blurDepthNumIterations,
                projected, fluid.blurDepthMaxFilterSize, depthThreshold, radius * NARROW_RANGE_MU,
                narrow ? this._narrowRange2DPipeline : null, sceneLinear);
        }
        let thicknessBlurred = thickness;
        if (useThickness && fluid.enableBlurThickness) {
            const div = Math.max(1, fluid.blurThicknessSizeDivisor);
            const bw = Math.max(1, Math.floor(tw / div));
            const bh = Math.max(1, Math.floor(th / div));
            thicknessBlurred = this._blur(command, res, 'thicknessBlur', this._gaussianPipeline, thickness, bw, bh, THICKNESS_FORMAT,
                fluid.blurThicknessNumIterations, Math.max(0, Math.round(fluid.blurThicknessFilterSize)), 0, 0, 0);
        }

        const colorView = color.createView();
        if (fluid.debug) {
            const mode = fluid.debugFeature;
            const debugDepth = mode === FluidDebug.DepthTexture ? depth : depthBlurred;
            const debugThickness = mode === FluidDebug.ThicknessTexture ? thickness : thicknessBlurred;
            this._renderDebug(command, res, debugDepth, debugThickness, colorView);
            return;
        }

        // Refraction samples a copy of the scene color, since the pass draws into the original.
        const sceneColor = this._target(res, 'sceneColor', color.width, color.height, COLOR_FORMAT,
            GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST);
        command.copyTextureToTexture({ texture: color }, { texture: sceneColor.texture }, [color.width, color.height, 1]);
        const envView = this._writeShadeUniforms(res, view, fluid, camera);
        this._renderComposite(command, res, depthBlurred, thicknessBlurred, sceneColor, envView, colorView, sceneDepth);
    }

    private _renderComposite(
        command: GPUCommandEncoder, res: FluidGpu, depth: Target, thickness: Target, sceneColor: Target,
        envView: GPUTextureView, colorView: GPUTextureView, sceneDepth: SceneDepth,
    ): void {
        const surfaceBG = this._device.createBindGroup({
            layout: this._surfaceBGLayout,
            entries: [
                { binding: 0, resource: { buffer: res.uniform } },
                { binding: 1, resource: depth.view },
                { binding: 2, resource: thickness.view },
                { binding: 3, resource: { buffer: res.shade } },
            ],
        });
        const sceneBG = this._device.createBindGroup({
            layout: this._sceneBGLayout,
            entries: [
                { binding: 0, resource: sceneColor.view },
                { binding: 1, resource: this._linearSampler },
                { binding: 2, resource: envView },
                { binding: 3, resource: sceneDepth.sampleView },
            ],
        });
        {
            // Samples the scene depth, so it cannot be the depth attachment here.
            const enc = command.beginRenderPass({
                label: 'FluidPass:Color',
                colorAttachments: [{ view: colorView, loadOp: 'load', storeOp: 'store' }],
            });
            enc.setPipeline(this._colorPipeline);
            enc.setBindGroup(0, surfaceBG);
            enc.setBindGroup(1, sceneBG);
            enc.draw(3);
            enc.end();
        }
        {
            const format = sceneDepth.texture.format;
            const depthAttachment: GPURenderPassDepthStencilAttachment = {
                view: sceneDepth.attachView, depthLoadOp: 'load', depthStoreOp: 'store',
            };
            if (format.includes('stencil')) {
                depthAttachment.stencilLoadOp = 'load';
                depthAttachment.stencilStoreOp = 'store';
            }
            const enc = command.beginRenderPass({
                label: 'FluidPass:DepthWrite',
                colorAttachments: [],
                depthStencilAttachment: depthAttachment,
            });
            enc.setPipeline(this._getDepthWritePipeline(format));
            enc.setBindGroup(0, surfaceBG);
            enc.draw(3);
            enc.end();
        }
    }

    /** Writes the composite parameters and returns the environment cube view to bind. */
    private _writeShadeUniforms(res: FluidGpu, view: View3D, fluid: FluidRenderer, camera: Camera3D): GPUTextureView {
        // Direction toward the light, in view space.
        const dir = TMP_LIGHT_DIR.copy(fluid.dirLight ?? this._sceneLightDirection(view) ?? DEFAULT_LIGHT_DIR);
        dir.normalize();
        const m = camera.viewMatrix.rawData;
        const lx = -(m[0] * dir.x + m[4] * dir.y + m[8] * dir.z);
        const ly = -(m[1] * dir.x + m[5] * dir.y + m[9] * dir.z);
        const lz = -(m[2] * dir.x + m[6] * dir.y + m[10] * dir.z);

        const env = fluid.environmentMap === undefined ? view.scene?.envMap : fluid.environmentMap;
        const envView = env && env.textureBindingLayout?.viewDimension === 'cube' ? env.getGPUView() as GPUTextureView : null;

        const f = TMP_SHADE_F32;
        f[0] = fluid.fluidColor.r; f[1] = fluid.fluidColor.g; f[2] = fluid.fluidColor.b;
        f[3] = fluid.thicknessMode === FluidThicknessMode.Geometric && !fluid.useFixedThickness ? 1 : 0;
        f[4] = lx; f[5] = ly; f[6] = lz; f[7] = fluid.specularPower;
        f[8] = fluid.density; f[9] = fluid.refractionStrength; f[10] = fluid.fresnelClamp; f[11] = fluid.minimumThickness;
        f[12] = fluid.useFixedThickness ? 1 : 0;
        f[13] = envView ? 1 : 0;
        f[14] = view.engine3D.setting.sky?.skyExposure ?? 1;
        // One particle's worth of thickness: its center contribution, or its diameter when geometric.
        const perParticle = fluid.thicknessMode === FluidThicknessMode.Geometric ? fluid.particleSize : fluid.particleThicknessAlpha;
        f[15] = fluid.useFixedThickness ? 0 : Math.max(0, fluid.edgeSoftness) * perParticle;
        f.set(camera.transform.worldMatrix.rawData, 16);
        this._device.queue.writeBuffer(res.shade, 0, f.buffer, f.byteOffset, SHADE_UNIFORM_BYTES);
        return envView ?? this._emptyCubeView;
    }

    private _sceneLightDirection(view: View3D): Vector3 | null {
        ComponentCollect.collectByTypeLayered<DirectLight>(view, DirectLight, VisibleLayer.All, this._lights);
        return this._lights.length > 0 ? this._lights[0].direction : null;
    }

    private _getDepthWritePipeline(depthFormat: GPUTextureFormat): GPURenderPipeline {
        let pipeline = this._depthWritePipelines.get(depthFormat);
        if (!pipeline) {
            pipeline = this._device.createRenderPipeline({
                label: 'FluidPass:DepthWritePipeline',
                layout: this._device.createPipelineLayout({ bindGroupLayouts: [this._surfaceBGLayout] }),
                vertex: { module: this._compositeModule, entryPoint: 'vs' },
                fragment: { module: this._compositeModule, entryPoint: 'fsDepth', targets: [] },
                primitive: { topology: 'triangle-list', cullMode: 'none' },
                depthStencil: { format: depthFormat, depthCompare: 'less', depthWriteEnabled: true },
            });
            this._depthWritePipelines.set(depthFormat, pipeline);
        }
        return pipeline;
    }

    /**
     * Separable blur: `iterations` × (horizontal into A, vertical into B),
     * starting from `src`, then `finalPipeline` (if any) from B into A.
     * Returns the last target written.
     */
    private _blur(
        command: GPUCommandEncoder, res: FluidGpu, key: string, pipeline: GPURenderPipeline, src: Target,
        width: number, height: number, format: GPUTextureFormat, iterations: number,
        p0: number, p1: number, p2: number, p3: number = 0, finalPipeline: GPURenderPipeline | null = null,
        extra: Target | null = null,
    ): Target {
        iterations = Math.max(0, Math.floor(iterations));
        if (iterations === 0) return src;
        const a = this._target(res, `${key}A`, width, height, format);
        const b = this._target(res, `${key}B`, width, height, format);
        const ux = this._blurUniform(res, `${key}X`, 1, 0, width, height, p0, p1, p2, p3);
        const uy = this._blurUniform(res, `${key}Y`, 0, 1, width, height, p0, p1, p2, p3);

        let input = src;
        for (let i = 0; i < iterations; i++) {
            this._blurPass(command, pipeline, ux, input, a, extra);
            this._blurPass(command, pipeline, uy, a, b, extra);
            input = b;
        }
        if (!finalPipeline) return b;
        this._blurPass(command, finalPipeline, ux, b, a, extra);
        return a;
    }

    /** Linear view depth of the opaque scene at the depth-map size. */
    private _renderSceneLinear(command: GPUCommandEncoder, res: FluidGpu, sceneDepth: SceneDepth, width: number, height: number): Target {
        const target = this._target(res, 'sceneLinear', width, height, DEPTH_FORMAT);
        const bg = this._device.createBindGroup({
            layout: this._sceneLinearBGLayout,
            entries: [
                { binding: 0, resource: { buffer: res.uniform } },
                { binding: 1, resource: sceneDepth.sampleView },
            ],
        });
        const enc = command.beginRenderPass({
            label: 'FluidPass:SceneLinearDepth',
            colorAttachments: [{ view: target.view, loadOp: 'clear', clearValue: [0, 0, 0, 0], storeOp: 'store' }],
        });
        enc.setPipeline(this._sceneLinearPipeline);
        enc.setBindGroup(0, bg);
        enc.draw(3);
        enc.end();
        return target;
    }

    /**
     * Neighbor search on a hashed grid and per-particle ellipsoids; returns the
     * ellipsoid buffer (4 × vec4f per particle, see FluidAnisotropy_wgsl).
     */
    private _computeEllipsoids(command: GPUCommandEncoder, res: FluidGpu, fluid: FluidRenderer, particles: GPUBuffer): GPUBuffer {
        const count = fluid.particleCount;
        const aniso = this._ensureAniso(res, count);
        const radius = Math.max(1e-6, fluid.anisotropyRadius ?? fluid.particleSize * 1.5);

        TMP_ANISO_U32[0] = count;
        TMP_ANISO_U32[1] = fluid.stride / 4;
        TMP_ANISO_U32[2] = fluid.positionOffset / 4;
        TMP_ANISO_U32[3] = aniso.tableSize;
        TMP_ANISO_F32[4] = radius;
        TMP_ANISO_F32[5] = radius;
        TMP_ANISO_F32[6] = fluid.particleSize * 0.5;
        TMP_ANISO_F32[7] = Math.max(1, fluid.anisotropyMaxRatio);
        TMP_ANISO_F32[8] = fluid.anisotropyMinNeighbors;
        TMP_ANISO_F32[9] = Math.min(1, Math.max(0, fluid.anisotropySmoothing));
        TMP_ANISO_F32[10] = 0;
        TMP_ANISO_F32[11] = 0;
        this._device.queue.writeBuffer(aniso.params, 0, TMP_ANISO, 0, ANISO_UNIFORM_BYTES);

        const bg = this._device.createBindGroup({
            layout: this._anisoBGLayout,
            entries: [
                { binding: 0, resource: { buffer: aniso.params } },
                { binding: 1, resource: { buffer: particles } },
                { binding: 2, resource: { buffer: aniso.cellCount } },
                { binding: 3, resource: { buffer: aniso.cellStart } },
                { binding: 4, resource: { buffer: aniso.blockSums } },
                { binding: 5, resource: { buffer: aniso.particleCell } },
                { binding: 6, resource: { buffer: aniso.sortedPos } },
                { binding: 7, resource: { buffer: aniso.ellipsoids } },
            ],
        });
        const p = this._anisoPipelines;
        const groups = (n: number, size: number) => Math.max(1, Math.ceil(n / size));
        const enc = command.beginComputePass({ label: 'FluidPass:Anisotropy' });
        enc.setBindGroup(0, bg);
        enc.setPipeline(p.clearCells);
        enc.dispatchWorkgroups(groups(aniso.tableSize, 256));
        enc.setPipeline(p.countCells);
        enc.dispatchWorkgroups(groups(count, 256));
        enc.setPipeline(p.scanBlocks);
        enc.dispatchWorkgroups(groups(aniso.tableSize, SCAN_BLOCK));
        enc.setPipeline(p.scanBlockSums);
        enc.dispatchWorkgroups(1);
        enc.setPipeline(p.addBlockOffsets);
        enc.dispatchWorkgroups(groups(aniso.tableSize, 256));
        enc.setPipeline(p.scatter);
        enc.dispatchWorkgroups(groups(count, 256));
        enc.setPipeline(p.computeEllipsoids);
        enc.dispatchWorkgroups(groups(count, 128));
        enc.end();
        return aniso.ellipsoids;
    }

    /** Neighbor-search buffers sized for `count` particles; regrown when the count exceeds them. */
    private _ensureAniso(res: FluidGpu, count: number): AnisoGpu {
        const capacity = Math.max(1, count);
        if (res.aniso && res.aniso.capacity >= capacity) return res.aniso;
        if (res.aniso) {
            const a = res.aniso;
            for (const b of [a.params, a.cellCount, a.cellStart, a.blockSums, a.particleCell, a.sortedPos, a.ellipsoids]) b.destroy();
        }
        // About two buckets per particle keeps collisions rare; power of two for the hash mask.
        const tableSize = Math.min(MAX_HASH_TABLE, Math.max(SCAN_BLOCK, 2 ** Math.ceil(Math.log2(capacity * 2))));
        const storage = GPUBufferUsage.STORAGE;
        const buffer = (label: string, size: number, usage: number = storage) =>
            this._device.createBuffer({ label: `FluidPass:${label}`, size, usage });
        res.aniso = {
            params: buffer('AnisoParams', ANISO_UNIFORM_BYTES, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
            capacity,
            tableSize,
            cellCount: buffer('CellCount', tableSize * 4),
            cellStart: buffer('CellStart', tableSize * 4),
            blockSums: buffer('BlockSums', SCAN_BLOCK * 4),
            particleCell: buffer('ParticleCell', capacity * 8),
            sortedPos: buffer('SortedPositions', capacity * 16),
            ellipsoids: buffer('Ellipsoids', capacity * 64),
        };
        return res.aniso;
    }

    private _blurPass(command: GPUCommandEncoder, pipeline: GPURenderPipeline, uniform: GPUBuffer, src: Target, dst: Target, extra: Target | null = null): void {
        const entries: GPUBindGroupEntry[] = [
            { binding: 0, resource: { buffer: uniform } },
            { binding: 1, resource: src.view },
        ];
        if (extra) entries.push({ binding: 2, resource: extra.view });
        const bg = this._device.createBindGroup({ layout: extra ? this._narrowRangeBGLayout : this._blurBGLayout, entries });
        const enc = command.beginRenderPass({
            label: 'FluidPass:Blur',
            colorAttachments: [{ view: dst.view, loadOp: 'clear', clearValue: [0, 0, 0, 0], storeOp: 'store' }],
        });
        enc.setPipeline(pipeline);
        enc.setBindGroup(0, bg);
        enc.draw(3);
        enc.end();
    }

    private _renderDebug(command: GPUCommandEncoder, res: FluidGpu, depth: Target, thickness: Target, colorView: GPUTextureView): void {
        const bg = this._device.createBindGroup({
            layout: this._debugBGLayout,
            entries: [
                { binding: 0, resource: { buffer: res.uniform } },
                { binding: 1, resource: depth.view },
                { binding: 2, resource: thickness.view },
            ],
        });
        const enc = command.beginRenderPass({
            label: 'FluidPass:Debug',
            colorAttachments: [{ view: colorView, loadOp: 'load', storeOp: 'store' }],
        });
        enc.setPipeline(this._debugPipeline);
        enc.setBindGroup(0, bg);
        enc.draw(3);
        enc.end();
    }

    /** Scene depth the opaque passes wrote: the z-prepass texture when enabled, else the G-buffer depth. */
    private _getSceneDepth(context3D: Context3D): SceneDepth | null {
        const frame = GBufferFrame.getGBufferFrame(GBufferFrame.colorPass_GBuffer, context3D);
        const tex = (frame.zPreTexture ?? frame.depthTexture) as RenderTexture;
        const gpuTex = tex?.getGPUTexture() as GPUTexture;
        if (!gpuTex) return null;
        if (this._sceneDepth?.texture !== gpuTex) {
            this._sceneDepth = {
                texture: gpuTex,
                sampleView: gpuTex.createView({ aspect: 'depth-only' }),
                attachView: gpuTex.createView(),
            };
        }
        return this._sceneDepth;
    }

    private _getParticleBuffer(fluid: FluidRenderer): GPUBuffer | null {
        const external = fluid.gpuBuffer;
        if (external) {
            const buffer = external.buffer;
            if (!(buffer.usage & GPUBufferUsage.STORAGE)) {
                this._warnOnce(external, 'FluidRenderer: the buffer passed to setDataBufferGPU needs GPUBufferUsage.STORAGE.');
                return null;
            }
            return buffer;
        }

        const data = fluid.cpuData;
        if (!data) return null;
        const res = this._ensureGpu(fluid);
        if (!res.particleBuffer || res.particleBuffer.size < data.byteLength) {
            res.particleBuffer?.destroy();
            res.particleBuffer = this._device.createBuffer({
                label: 'FluidPass:Particles',
                size: Math.max(16, Math.ceil(data.byteLength / 4) * 4),
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });
            res.particleVersion = -1;
        }
        if (res.particleVersion !== fluid.cpuVersion) {
            this._device.queue.writeBuffer(res.particleBuffer, 0, data.buffer, data.byteOffset, data.byteLength);
            res.particleVersion = fluid.cpuVersion;
        }
        return res.particleBuffer;
    }

    private _ensureGpu(fluid: FluidRenderer): FluidGpu {
        let res = this._gpu.get(fluid);
        if (!res) {
            res = {
                uniform: this._device.createBuffer({
                    label: 'FluidPass:Uniforms',
                    size: UNIFORM_BYTES,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                }),
                shade: this._device.createBuffer({
                    label: 'FluidPass:Shade',
                    size: SHADE_UNIFORM_BYTES,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                }),
                particleBuffer: null,
                particleVersion: -1,
                targets: new Map(),
                blurUniforms: new Map(),
                aniso: null,
            };
            this._gpu.set(fluid, res);
        }
        return res;
    }

    /** Named per-fluid render target, recreated when its size changes. */
    private _target(res: FluidGpu, key: string, width: number, height: number, format: GPUTextureFormat, usage: number = RT_USAGE): Target {
        let t = res.targets.get(key);
        if (t && t.width === width && t.height === height) return t;
        t?.texture.destroy();
        const texture = this._device.createTexture({ label: `FluidPass:${key}`, size: [width, height, 1], format, usage });
        t = { texture, view: texture.createView(), width, height };
        res.targets.set(key, t);
        return t;
    }

    private _blurUniform(res: FluidGpu, key: string, dirX: number, dirY: number, width: number, height: number, p0: number, p1: number, p2: number, p3: number): GPUBuffer {
        let buffer = res.blurUniforms.get(key);
        if (!buffer) {
            buffer = this._device.createBuffer({
                label: `FluidPass:${key}`,
                size: BLUR_UNIFORM_BYTES,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            res.blurUniforms.set(key, buffer);
        }
        const f = TMP_BLUR_F32;
        f[0] = dirX; f[1] = dirY;
        f[2] = width; f[3] = height;
        f[4] = p0; f[5] = p1; f[6] = p2; f[7] = p3;
        f[8] = this._pixelWorldPerDepth / height; f[9] = MAX_GRAZING_SCALE; f[10] = 0; f[11] = 0;
        this._device.queue.writeBuffer(buffer, 0, f.buffer, f.byteOffset, BLUR_UNIFORM_BYTES);
        return buffer;
    }

    private _writeUniforms(res: FluidGpu, fluid: FluidRenderer, camera: Camera3D, depth: Target, thickness: Target, screenW: number, screenH: number): void {
        const f = TMP_UNIFORM_F32;
        f.set(this._modelView.multiplyMatrices(camera.viewMatrix, fluid.transform.worldMatrix).rawData, 0);
        f.set(camera.projectionMatrix.rawData, 16);
        f.set(camera.projectionMatrixInv.rawData, 32);
        f[48] = fluid.particleSize * 0.5;
        f[49] = fluid.stride / 4;
        f[50] = fluid.positionOffset / 4;
        f[51] = fluid.particleThicknessAlpha;
        f[52] = camera.near;
        f[53] = camera.far;
        f[54] = fluid.debugFeature;
        f[55] = 0;
        f[56] = depth.width;
        f[57] = depth.height;
        f[58] = screenW;
        f[59] = screenH;
        f[60] = thickness.width;
        f[61] = thickness.height;
        f[62] = 0;
        f[63] = 0;
        this._device.queue.writeBuffer(res.uniform, 0, f.buffer, f.byteOffset, UNIFORM_BYTES);
    }

    private _warnOnce(key: object, message: string): void {
        if (this._warned.has(key)) return;
        this._warned.add(key);
        console.warn(message);
    }

    private _createPipelines(): void {
        const device = this._device;
        const defines = { USE_LOGDEPTH: this._useLogDepth };
        const fullscreen: GPUPrimitiveState = { topology: 'triangle-list', cullMode: 'none' };

        this._particleBGLayout = device.createBindGroupLayout({
            label: 'FluidPass:ParticleBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
            ],
        });
        const particleLayout = device.createPipelineLayout({ bindGroupLayouts: [this._particleBGLayout] });
        const particleModule = device.createShaderModule({
            label: 'FluidPass:ParticleShader',
            code: Preprocessor.parse(FluidParticle_wgsl, defines),
        });
        // The projection mirrors x, so quad winding is not stable; draw both faces.
        const particlePrimitive: GPUPrimitiveState = { topology: 'triangle-list', cullMode: 'none' };
        this._depthPipeline = device.createRenderPipeline({
            label: 'FluidPass:DepthPipeline',
            layout: particleLayout,
            vertex: { module: particleModule, entryPoint: 'vs' },
            fragment: { module: particleModule, entryPoint: 'fsDepth', targets: [{ format: DEPTH_FORMAT }] },
            primitive: particlePrimitive,
            depthStencil: { format: 'depth32float', depthCompare: 'less', depthWriteEnabled: true },
        });
        this._thicknessPipeline = device.createRenderPipeline({
            label: 'FluidPass:ThicknessPipeline',
            layout: particleLayout,
            vertex: { module: particleModule, entryPoint: 'vs' },
            fragment: {
                module: particleModule, entryPoint: 'fsThickness',
                targets: [{
                    format: THICKNESS_FORMAT,
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                    },
                }],
            },
            primitive: particlePrimitive,
        });

        const ellipsoidModule = device.createShaderModule({
            label: 'FluidPass:EllipsoidShader',
            code: Preprocessor.parse(FluidEllipsoid_wgsl, defines),
        });
        this._ellipsoidDepthPipeline = device.createRenderPipeline({
            label: 'FluidPass:EllipsoidDepthPipeline',
            layout: particleLayout,
            vertex: { module: ellipsoidModule, entryPoint: 'vs' },
            fragment: { module: ellipsoidModule, entryPoint: 'fsDepth', targets: [{ format: DEPTH_FORMAT }] },
            primitive: particlePrimitive,
            depthStencil: { format: 'depth32float', depthCompare: 'less', depthWriteEnabled: true },
        });
        this._ellipsoidThicknessPipeline = device.createRenderPipeline({
            label: 'FluidPass:EllipsoidThicknessPipeline',
            layout: particleLayout,
            vertex: { module: ellipsoidModule, entryPoint: 'vs' },
            fragment: {
                module: ellipsoidModule, entryPoint: 'fsThickness',
                targets: [{
                    format: THICKNESS_FORMAT,
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                    },
                }],
            },
            primitive: particlePrimitive,
        });

        // Far side of the fluid: keep the farthest fragment.
        const backDepthState: GPUDepthStencilState = { format: 'depth32float', depthCompare: 'greater', depthWriteEnabled: true };
        this._backDepthPipeline = device.createRenderPipeline({
            label: 'FluidPass:BackDepthPipeline',
            layout: particleLayout,
            vertex: { module: particleModule, entryPoint: 'vs' },
            fragment: { module: particleModule, entryPoint: 'fsBackDepth', targets: [{ format: DEPTH_FORMAT }] },
            primitive: particlePrimitive,
            depthStencil: backDepthState,
        });
        this._ellipsoidBackDepthPipeline = device.createRenderPipeline({
            label: 'FluidPass:EllipsoidBackDepthPipeline',
            layout: particleLayout,
            vertex: { module: ellipsoidModule, entryPoint: 'vs' },
            fragment: { module: ellipsoidModule, entryPoint: 'fsBackDepth', targets: [{ format: DEPTH_FORMAT }] },
            primitive: particlePrimitive,
            depthStencil: backDepthState,
        });
        this._geometricBGLayout = device.createBindGroupLayout({
            label: 'FluidPass:GeometricBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
            ],
        });
        const geometricModule = device.createShaderModule({ label: 'FluidPass:GeometricThickness', code: FluidGeometricThickness_wgsl });
        this._geometricPipeline = device.createRenderPipeline({
            label: 'FluidPass:GeometricThicknessPipeline',
            layout: device.createPipelineLayout({ bindGroupLayouts: [this._geometricBGLayout] }),
            vertex: { module: geometricModule, entryPoint: 'vs' },
            fragment: { module: geometricModule, entryPoint: 'fs', targets: [{ format: THICKNESS_FORMAT }] },
            primitive: { topology: 'triangle-list', cullMode: 'none' },
        });

        this._anisoBGLayout = device.createBindGroupLayout({
            label: 'FluidPass:AnisoBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                ...[1, 2, 3, 4, 5, 6, 7].map((binding) => ({ binding, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' as GPUBufferBindingType } })),
            ],
        });
        const anisoModule = device.createShaderModule({ label: 'FluidPass:Anisotropy', code: FluidAnisotropy_wgsl });
        const anisoLayout = device.createPipelineLayout({ bindGroupLayouts: [this._anisoBGLayout] });
        const compute = (entryPoint: string) => device.createComputePipeline({
            label: `FluidPass:${entryPoint}`,
            layout: anisoLayout,
            compute: { module: anisoModule, entryPoint },
        });
        this._anisoPipelines = {
            clearCells: compute('clearCells'),
            countCells: compute('countCells'),
            scanBlocks: compute('scanBlocks'),
            scanBlockSums: compute('scanBlockSums'),
            addBlockOffsets: compute('addBlockOffsets'),
            scatter: compute('scatter'),
            computeEllipsoids: compute('computeEllipsoids'),
        };

        this._blurBGLayout = device.createBindGroupLayout({
            label: 'FluidPass:BlurBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
            ],
        });
        const blurLayout = device.createPipelineLayout({ bindGroupLayouts: [this._blurBGLayout] });
        const bilateralModule = device.createShaderModule({ label: 'FluidPass:BilateralBlur', code: FluidBilateralBlur_wgsl });
        this._bilateralPipeline = device.createRenderPipeline({
            label: 'FluidPass:BilateralBlurPipeline',
            layout: blurLayout,
            vertex: { module: bilateralModule, entryPoint: 'vs' },
            fragment: { module: bilateralModule, entryPoint: 'fs', targets: [{ format: DEPTH_FORMAT }] },
            primitive: fullscreen,
        });
        this._narrowRangeBGLayout = device.createBindGroupLayout({
            label: 'FluidPass:NarrowRangeBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
            ],
        });
        const narrowRangeLayout = device.createPipelineLayout({ bindGroupLayouts: [this._narrowRangeBGLayout] });
        this._sceneLinearBGLayout = device.createBindGroupLayout({
            label: 'FluidPass:SceneLinearBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
            ],
        });
        const sceneLinearModule = device.createShaderModule({
            label: 'FluidPass:SceneLinearDepth',
            code: Preprocessor.parse(FluidSceneLinearDepth_wgsl, defines),
        });
        this._sceneLinearPipeline = device.createRenderPipeline({
            label: 'FluidPass:SceneLinearDepthPipeline',
            layout: device.createPipelineLayout({ bindGroupLayouts: [this._sceneLinearBGLayout] }),
            vertex: { module: sceneLinearModule, entryPoint: 'vs' },
            fragment: { module: sceneLinearModule, entryPoint: 'fs', targets: [{ format: DEPTH_FORMAT }] },
            primitive: fullscreen,
        });
        const narrowRangeModule = device.createShaderModule({ label: 'FluidPass:NarrowRangeFilter', code: FluidNarrowRangeFilter_wgsl });
        this._narrowRangePipeline = device.createRenderPipeline({
            label: 'FluidPass:NarrowRangePipeline',
            layout: narrowRangeLayout,
            vertex: { module: narrowRangeModule, entryPoint: 'vs' },
            fragment: { module: narrowRangeModule, entryPoint: 'fs', targets: [{ format: DEPTH_FORMAT }] },
            primitive: fullscreen,
        });
        this._narrowRange2DPipeline = device.createRenderPipeline({
            label: 'FluidPass:NarrowRange2DPipeline',
            layout: narrowRangeLayout,
            vertex: { module: narrowRangeModule, entryPoint: 'vs' },
            fragment: { module: narrowRangeModule, entryPoint: 'fs2D', targets: [{ format: DEPTH_FORMAT }] },
            primitive: fullscreen,
        });
        const gaussianModule = device.createShaderModule({ label: 'FluidPass:GaussianBlur', code: FluidGaussianBlur_wgsl });
        this._gaussianPipeline = device.createRenderPipeline({
            label: 'FluidPass:GaussianBlurPipeline',
            layout: blurLayout,
            vertex: { module: gaussianModule, entryPoint: 'vs' },
            fragment: { module: gaussianModule, entryPoint: 'fs', targets: [{ format: THICKNESS_FORMAT }] },
            primitive: fullscreen,
        });

        this._debugBGLayout = device.createBindGroupLayout({
            label: 'FluidPass:DebugBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
            ],
        });
        const debugModule = device.createShaderModule({
            label: 'FluidPass:DebugShader',
            code: Preprocessor.parse(FluidDebugView_wgsl, defines),
        });
        this._debugPipeline = device.createRenderPipeline({
            label: 'FluidPass:DebugPipeline',
            layout: device.createPipelineLayout({ bindGroupLayouts: [this._debugBGLayout] }),
            vertex: { module: debugModule, entryPoint: 'vs' },
            fragment: { module: debugModule, entryPoint: 'fs', targets: [{ format: COLOR_FORMAT }] },
            primitive: fullscreen,
        });

        this._surfaceBGLayout = device.createBindGroupLayout({
            label: 'FluidPass:SurfaceBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
                { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
            ],
        });
        this._sceneBGLayout = device.createBindGroupLayout({
            label: 'FluidPass:SceneBGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: 'cube' } },
                { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
            ],
        });
        this._compositeModule = device.createShaderModule({
            label: 'FluidPass:CompositeShader',
            code: Preprocessor.parse(FluidComposite_wgsl, defines),
        });
        this._colorPipeline = device.createRenderPipeline({
            label: 'FluidPass:ColorPipeline',
            layout: device.createPipelineLayout({ bindGroupLayouts: [this._surfaceBGLayout, this._sceneBGLayout] }),
            vertex: { module: this._compositeModule, entryPoint: 'vs' },
            fragment: { module: this._compositeModule, entryPoint: 'fsColor', targets: [{ format: COLOR_FORMAT }] },
            primitive: fullscreen,
        });
        this._linearSampler = device.createSampler({
            label: 'FluidPass:LinearSampler',
            magFilter: 'linear', minFilter: 'linear',
            addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', addressModeW: 'clamp-to-edge',
        });
        // Bound when the fluid has no environment map; the shader skips reflection then.
        this._emptyCubeView = device.createTexture({
            label: 'FluidPass:EmptyCube',
            size: [1, 1, 6],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING,
        }).createView({ dimension: 'cube' });
    }
}

/** Map size for an optional fixed width; height keeps the screen aspect. */
function mapSize(width: number | null, screenW: number, screenH: number): [number, number] {
    if (!width || width <= 0) return [Math.max(1, Math.floor(screenW)), Math.max(1, Math.floor(screenH))];
    const w = Math.max(1, Math.floor(width));
    return [w, Math.max(1, Math.floor(w * screenH / screenW))];
}
