import { GPUBufferBase } from '../../gfx/graphics/webGpu/core/buffer/GPUBufferBase';
import { Texture } from '../../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../../math/Color';
import { Vector3 } from '../../math/Vector3';
import { ComponentBase } from '../ComponentBase';

/**
 * Byte layout of one particle inside a particle buffer.
 * @group Components
 */
export type FluidDataLayout = {
    /** Bytes between two consecutive particles. Default 16 (one vec4f). */
    stride?: number;
    /** Byte offset of the xyz position inside a particle. Default 0. */
    positionOffset?: number;
};

/**
 * Filter that smooths the fluid depth map.
 * @group Components
 */
export enum FluidDepthFilter {
    /** Separable bilateral filter: spatial gaussian weighted by depth similarity. */
    Bilateral = 0,
    /** Narrow-range filter: averages only samples within a depth range that follows the surface; keeps silhouettes and separate layers sharper at larger radii. */
    NarrowRange = 1,
}

/**
 * How the thickness used for light absorption is measured.
 * @group Components
 */
export enum FluidThicknessMode {
    /** Sum of every particle's contribution along the view ray ({@link FluidRenderer.particleThicknessAlpha} each). Follows the particle density, so uneven sampling shows as uneven absorption. */
    Accumulated = 0,
    /** Distance between the near and the far side of the fluid along the view ray, in world units; even inside a still body of fluid. Gaps between separate bodies along the ray count as fluid. */
    Geometric = 1,
}

/**
 * Intermediate image shown instead of the shaded fluid when
 * {@link FluidRenderer.debug} is on.
 * @group Components
 */
export enum FluidDebug {
    /** Linear view-space depth of the particle spheres. */
    DepthTexture = 0,
    /** Depth after the bilateral blur. */
    DepthBlurredTexture = 1,
    /** Accumulated particle thickness. */
    ThicknessTexture = 2,
    /** Thickness after the gaussian blur. */
    ThicknessBlurredTexture = 3,
    /** View-space normals reconstructed from the blurred depth. */
    Normals = 4,
}

/**
 * Renders a particle set as a continuous liquid surface (screen-space
 * fluid rendering). Particles are drawn as sphere impostors into a
 * depth buffer which is then smoothed and shaded in screen space.
 *
 * Requires `setting.render.fluid = true` so {@link ForwardRendererJob}
 * adds {@link FluidPass}. The fluid is drawn after opaque geometry and
 * before transparent geometry.
 *
 * Particle positions are in the local space of the owning Object3D
 * (world space when it sits at the origin unscaled); particleSize is
 * in world units. They come from either:
 * - {@link setDataBuffer}: a CPU `Float32Array`, uploaded when set.
 * - {@link setDataBufferGPU}: an existing storage buffer (e.g. written by
 *   a simulation compute shader), read directly without a copy.
 *
 * @group Components
 */
export class FluidRenderer extends ComponentBase {
    /** Particle diameter in world units. */
    public particleSize: number = 0.1;
    /** Thickness one particle adds at its center; the fluid gets more opaque as it grows. */
    public particleThicknessAlpha: number = 0.05;

    /** Width of the depth map in pixels; height follows the screen aspect. null = screen size. */
    public depthMapSize: number | null = null;
    /** Width of the thickness map in pixels; height follows the screen aspect. null = screen size. */
    public thicknessMapSize: number | null = null;

    /** Absorption color: light passing through the fluid is tinted toward it. */
    public fluidColor: Color = new Color(0.085, 0.6375, 0.765, 1);
    /** Absorption strength; higher makes the fluid more opaque. With {@link FluidThicknessMode.Geometric} it is per world unit of thickness. */
    public density: number = 2;
    /** Scale of the refraction offset: 1 follows the refracted ray to the scene behind, 0 disables refraction. */
    public refractionStrength: number = 1;
    /** Upper bound of the fresnel reflection weight (0 to 1). */
    public fresnelClamp: number = 1;
    /** Specular exponent; higher gives a smaller, sharper highlight. */
    public specularPower: number = 250;
    /** Pixels with less thickness show the background. With {@link useFixedThickness}, the thickness used everywhere. */
    public minimumThickness: number = 0;
    /**
     * Fade the fluid into the background where it is thinner than this many particles
     * (particleThicknessAlpha each when accumulated, particleSize each when geometric);
     * softens free edges. 0 disables.
     */
    public edgeSoftness: number = 0;

    private _thicknessMode: FluidThicknessMode = FluidThicknessMode.Accumulated;
    /** How thickness is measured for absorption. */
    public get thicknessMode(): FluidThicknessMode {
        return this._thicknessMode;
    }
    public set thicknessMode(value: FluidThicknessMode) {
        // GUI dropdowns hand back option values as strings.
        this._thicknessMode = Number(value);
    }
    /** Skip the thickness pass and use {@link minimumThickness} as a constant thickness. */
    public useFixedThickness: boolean = false;
    /** World-space direction the light travels, for the specular highlight. null uses the scene's first DirectLight, or (-2, -1, 1) without one. */
    public dirLight: Vector3 | null = null;
    /** Cube map reflected by the fluid. undefined uses the scene's envMap; null disables reflection. */
    public environmentMap: Texture | null | undefined = undefined;

    /**
     * Stretch each particle into an ellipsoid along its neighbor distribution, so flat
     * regions stay flat and thin sheets stay thin. Adds a neighbor search on the GPU each frame.
     */
    public useAnisotropy: boolean = false;
    /** Neighbor search radius in world units. null uses 1.5 × particleSize. */
    public anisotropyRadius: number | null = null;
    /** Largest ratio between the longest and shortest ellipsoid axis. */
    public anisotropyMaxRatio: number = 4;
    /** Particles with fewer neighbors stay spheres (spray, droplets). */
    public anisotropyMinNeighbors: number = 10;
    /** How far (0 to 1) each particle moves toward the weighted mean of its neighbors, which smooths the surface. */
    public anisotropySmoothing: number = 0.5;

    /** Smooth the depth map so the spheres merge into one surface. */
    public enableBlurDepth: boolean = true;
    private _depthFilter: FluidDepthFilter = FluidDepthFilter.Bilateral;
    /** Filter used to smooth the depth map. */
    public get depthFilter(): FluidDepthFilter {
        return this._depthFilter;
    }
    public set depthFilter(value: FluidDepthFilter) {
        // GUI dropdowns hand back option values as strings.
        this._depthFilter = Number(value);
    }
    /** Depth blur runs at the depth map size divided by this. */
    public blurDepthSizeDivisor: number = 1;
    /** Depth blur radius, relative to the projected particle size. */
    public blurDepthFilterSize: number = 7;
    /** Depth blur passes (each is one horizontal + one vertical pass). */
    public blurDepthNumIterations: number = 3;
    /** Upper bound of the depth blur radius in pixels. */
    public blurDepthMaxFilterSize: number = 100;
    /** Depth range, in particle radii, across which samples are still blended; larger merges more. */
    public blurDepthDepthScale: number = 10;

    /** Smooth the thickness map. */
    public enableBlurThickness: boolean = true;
    /** Thickness blur runs at the thickness map size divided by this. */
    public blurThicknessSizeDivisor: number = 1;
    /** Thickness blur radius in pixels. */
    public blurThicknessFilterSize: number = 5;
    /** Thickness blur passes (each is one horizontal + one vertical pass). */
    public blurThicknessNumIterations: number = 1;

    /** Show the image selected by {@link debugFeature} instead of the fluid. */
    public debug: boolean = false;

    private _debugFeature: FluidDebug = FluidDebug.DepthBlurredTexture;
    public get debugFeature(): FluidDebug {
        return this._debugFeature;
    }
    public set debugFeature(value: FluidDebug) {
        // GUI dropdowns hand back option values as strings.
        this._debugFeature = Number(value);
    }

    private _cpuData: Float32Array | null = null;
    private _cpuVersion: number = 0;
    private _gpuBuffer: GPUBufferBase | null = null;
    private _count: number = 0;
    private _stride: number = 16;
    private _positionOffset: number = 0;

    /**
     * Use CPU particle data. The array is uploaded on the next frame;
     * call again after modifying it in place to re-upload.
     * @param data particle data, laid out as described by `layout`
     * @param count number of particles; defaults to as many as `data` holds
     * @param layout particle byte layout
     */
    public setDataBuffer(data: Float32Array, count?: number, layout?: FluidDataLayout): void {
        this._setLayout(layout);
        this._cpuData = data;
        this._cpuVersion++;
        this._gpuBuffer = null;
        const capacity = Math.floor((data.byteLength - this._positionOffset - 12) / this._stride) + 1;
        this._count = Math.max(0, Math.min(count ?? capacity, capacity));
    }

    /**
     * Use a GPU buffer as particle data. The buffer needs `STORAGE`
     * usage and is read every frame, so updates made by compute shaders
     * show up without further calls.
     * @param buffer storage buffer holding the particles
     * @param count number of particles to draw
     * @param layout particle byte layout
     */
    public setDataBufferGPU(buffer: GPUBufferBase, count: number, layout?: FluidDataLayout): void {
        this._setLayout(layout);
        this._gpuBuffer = buffer;
        this._cpuData = null;
        this._count = Math.max(0, count | 0);
    }

    /** Number of particles drawn. Can be lowered to draw a prefix of the buffer. */
    public get particleCount(): number {
        return this._count;
    }
    public set particleCount(value: number) {
        this._count = Math.max(0, value | 0);
    }

    /** @internal */
    public get cpuData(): Float32Array | null {
        return this._cpuData;
    }

    /** @internal Incremented on every {@link setDataBuffer} call. */
    public get cpuVersion(): number {
        return this._cpuVersion;
    }

    /** @internal */
    public get gpuBuffer(): GPUBufferBase | null {
        return this._gpuBuffer;
    }

    /** @internal Particle stride in bytes. */
    public get stride(): number {
        return this._stride;
    }

    /** @internal Position offset in bytes. */
    public get positionOffset(): number {
        return this._positionOffset;
    }

    private _setLayout(layout?: FluidDataLayout): void {
        const stride = layout?.stride ?? 16;
        const offset = layout?.positionOffset ?? 0;
        if (stride % 4 !== 0 || offset % 4 !== 0 || offset + 12 > stride) {
            throw new Error(`FluidRenderer: invalid layout (stride=${stride}, positionOffset=${offset}); both must be multiples of 4 and the xyz position must fit inside the stride.`);
        }
        this._stride = stride;
        this._positionOffset = offset;
    }
}
