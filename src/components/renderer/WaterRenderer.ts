import { GeometryBase } from '../../core/geometry/GeometryBase';
import { View3D } from '../../core/View3D';
import { Context3D } from '../../gfx/graphics/webGpu/Context3D';
import { Texture } from '../../gfx/graphics/webGpu/core/texture/Texture';
import { RTResourceMap } from '../../gfx/renderJob/frame/RTResourceMap';
import { SCENE_LINEAR_DEPTH } from '../../gfx/renderJob/graph/passes/SceneLinearDepthPass';
import { RendererMask } from '../../gfx/renderJob/passRenderer/state/RendererMask';
import { WATER_MAX_WAVES, WaterMaterial } from '../../materials/WaterMaterial';
import { Matrix4 } from '../../math/Matrix4';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { PlaneGeometry } from '../../shape/PlaneGeometry';
import { Time } from '../../util/Time';
import { MeshRenderer } from './MeshRenderer';
import { WaterFootprint } from './WaterFootprint';
import { WATER_FFT_MAX_QUERIES, WaterFFT } from './WaterFFT';
import { waterFoamTexture } from './WaterFoamTexture';
import { WATER_MAX_RIPPLES_PER_FRAME, WaterRipples } from './WaterRipples';
import { WaterSpectrum } from './WaterSpectrum';

/**
 * One Gerstner wave of a {@link WaterRenderer}.
 * @group Components
 */
export type GerstnerWave = {
    /** Direction of travel in the xz plane. */
    direction: Vector2;
    /** Crest-to-crest distance in world units. */
    wavelength: number;
    /** 0 to 1; the sum over all waves should stay below 1 to avoid looping crests. */
    steepness: number;
};

const GRAVITY = 9.81;

/**
 * Water surface: a grid on the owner's xz plane displaced by Gerstner
 * waves and shaded by {@link WaterMaterial} (refraction, absorption,
 * reflection, sun highlight).
 *
 * Waves are up to eight Gerstner waves ({@link waves}) plus, for open
 * water, a wind-driven sea simulated with FFTs ({@link spectrum}).
 *
 * The surface is a rectangle ({@link width} by {@link length}) or any flat
 * mesh in the owner's xz plane ({@link surfaceGeometry}), e.g. a round
 * pond. The waves are evaluated in world space, so several water objects
 * line up; {@link getHeight} returns the same surface on the CPU. The owner
 * may be scaled and rotated about y; the surface stays horizontal and the
 * waves keep their world directions.
 *
 * @group Components
 */
export class WaterRenderer extends MeshRenderer {
    /** Up to {@link WATER_MAX_WAVES} waves; edit in place or reassign. */
    public waves: GerstnerWave[] = [
        { direction: new Vector2(1, 0.3), wavelength: 8, steepness: 0.18 },
        { direction: new Vector2(0.4, 1), wavelength: 5, steepness: 0.14 },
        { direction: new Vector2(-0.7, 0.6), wavelength: 3, steepness: 0.1 },
        { direction: new Vector2(0.2, -1), wavelength: 1.7, steepness: 0.06 },
    ];
    /** Wave animation speed; 0 freezes the surface. */
    public timeScale: number = 1;
    /** Sunlight caustics on everything under the surface (CausticsPass, `setting.render.water`). */
    public caustics: boolean = true;
    /** Strength of the caustics. */
    public causticsIntensity: number = 0.6;
    /**
     * Base wavelength in world units of the fine ripples on top of the waves.
     * Too small to displace the mesh, they bend the surface normal per pixel
     * and focus the sunlight into the caustics.
     */
    public detailScale: number = 1.8;
    /**
     * How much the fine ripples bend the surface normal (0 to 1): 1 is the
     * slope that focuses the caustics, which always use all of it; lower keeps
     * the view through calm water clearer.
     */
    public detailStrength: number = 0.35;
    /** Speed of the interactive ripples ({@link addRipple}) in world units per second. */
    public rippleSpeed: number = 1.2;
    /** Fraction of the ripples' motion lost per second. */
    public rippleDamping: number = 0.3;

    private _width: number = 10;
    private _length: number = 10;
    private _resolution: number = 128;
    private _time: number = 0;
    private _waterMaterial!: WaterMaterial;
    private _pyramid: Texture | null = null;
    private _sceneDepth: Texture | null | undefined = undefined;
    /** Last wave values sent to the material, to skip unchanged uploads. */
    private _sentWaves: number[] = [];
    private _invWorld!: Matrix4;
    private _surface: GeometryBase | null = null;
    private _footprint: WaterFootprint | null = null;
    private _rippleResolution: number = 256;
    private _rippleArea: number | null = null;
    private _waveFadeDistance: number = 80;
    private _ripples: WaterRipples | null = null;
    /** Ripples waiting for the simulation: local x, local z, strength, radius. */
    private _rippleQueue: number[] = [];
    private _simulationFrame: number = -1;
    private _spectrum: WaterSpectrum | null = null;
    private _foamTextureSet = false;
    /** World x, z pairs whose FFT height was asked for this frame. */
    private _heightQueries: number[] = [];
    private _fft: WaterFFT | null = null;
    private _ctx: Context3D | null = null;

    public init(param?: any): void {
        super.init(param);
        this._invWorld = new Matrix4();
        this._waterMaterial = new WaterMaterial();
        this._waterMaterial.waveFadeDistance = this._waveFadeDistance;
        this.material = this._waterMaterial;
        this._rebuildGeometry();
        // The default depth, shadow and reflection passes would draw the undisplaced grid:
        // a flat depth prepass would hide everything below the waves.
        this.addMask(RendererMask.IgnoreDepthPass);
        this.castShadow = false;
        this.castReflection = false;
        this._pushWaves();
    }

    /** Surface material, for shading parameters. */
    public get waterMaterial(): WaterMaterial {
        return this._waterMaterial;
    }

    /** Size of the default rectangle along local x; the owner's scale applies. */
    public get width(): number {
        return this._width;
    }
    public set width(value: number) {
        this._width = value;
        this._rebuildGeometry();
        if (!this._surface) this._resetRipples();
    }

    /** Size of the default rectangle along local z; the owner's scale applies. */
    public get length(): number {
        return this._length;
    }
    public set length(value: number) {
        this._length = value;
        this._rebuildGeometry();
        if (!this._surface) this._resetRipples();
    }

    /** Grid segments of the default rectangle along its longer side; the waves need a few vertices per shortest wavelength. */
    public get resolution(): number {
        return this._resolution;
    }
    public set resolution(value: number) {
        this._resolution = Math.max(1, Math.floor(value));
        this._rebuildGeometry();
    }

    /**
     * Custom surface mesh: flat, in the owner's local xz plane (its y is
     * ignored), indexed, and fine enough for the waves. The water,
     * underwater view and caustics all follow its outline. Null restores
     * the rectangle.
     */
    public get surfaceGeometry(): GeometryBase | null {
        return this._surface;
    }
    public set surfaceGeometry(value: GeometryBase | null) {
        this._footprint?.destroy();
        this._surface = value;
        this._footprint = value ? new WaterFootprint(value) : null;
        if (value) {
            this.geometry = value;
        } else {
            this._rebuildGeometry();
        }
        this._resetRipples();
    }

    /**
     * Distance from the camera, in wavelengths, at which each wave has faded
     * out of the surface (from half of it on), so waves too short for the mesh
     * or the screen there do not alias. The default suits an even mesh; lower
     * it for a mesh that coarsens with distance. 0 keeps every wave at any
     * distance. Visual only: {@link getHeight} keeps every wave.
     */
    public get waveFadeDistance(): number {
        return this._waveFadeDistance;
    }
    public set waveFadeDistance(value: number) {
        this._waveFadeDistance = Math.max(0, value);
        if (this._waterMaterial) this._waterMaterial.waveFadeDistance = this._waveFadeDistance;
    }

    /** Ripple grid cells along the longer side of the water; changing it clears the ripples. */
    public get rippleResolution(): number {
        return this._rippleResolution;
    }
    public set rippleResolution(value: number) {
        this._rippleResolution = Math.max(8, Math.floor(value));
        this._resetRipples();
    }

    /**
     * Side, in local units, of the square around the water's origin where
     * ripples are simulated, all of it taken as water; null covers the whole
     * surface. For water too large for one grid to resolve ripples, such as
     * an ocean. Changing it clears the ripples.
     */
    public get rippleArea(): number | null {
        return this._rippleArea;
    }
    public set rippleArea(value: number | null) {
        this._rippleArea = value && value > 0 ? value : null;
        this._resetRipples();
    }

    /** @internal Local xz bounds of the ripple grid: min x, min z, max x, max z. */
    public get rippleBounds(): [number, number, number, number] {
        const a = this._rippleArea;
        return a ? [-a / 2, -a / 2, a / 2, a / 2] : this.footprintBounds;
    }

    /**
     * Starts a ripple at world (x, z): the surface there is pushed down, as by
     * something striking it, and a ring spreads out, reflecting off the edge
     * of the water. Pointer
     * input and objects entering or moving through the water all start
     * ripples this way. Points off the water are ignored; at most
     * {@link WATER_MAX_RIPPLES_PER_FRAME} start per frame. Needs
     * `setting.render.water`.
     * @param strength depth of the crater at its center, in world units
     * @param radius radius of the pushed area, in world units
     */
    public addRipple(x: number, z: number, strength: number = 0.05, radius: number = 0.2): void {
        if (!this.containsXZ(x, z) || this._rippleQueue.length >= WATER_MAX_RIPPLES_PER_FRAME * 4) return;
        const m = this.invWorldMatrix.rawData;
        const y = this.baseHeight;
        const lx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const lz = m[2] * x + m[6] * y + m[10] * z + m[14];
        const [minX, minZ, maxX, maxZ] = this.rippleBounds;
        if (lx < minX || lx > maxX || lz < minZ || lz > maxZ) return;
        this._rippleQueue.push(lx, lz, strength, radius);
    }

    /**
     * FFT ocean waves added to the Gerstner waves, from wind over open water;
     * null for none. Needs `setting.render.water`.
     */
    public get spectrum(): WaterSpectrum | null {
        return this._spectrum;
    }
    public set spectrum(value: WaterSpectrum | null) {
        this._spectrum = value;
        if (!value) this._resetFFT();
    }

    /** @internal The FFT simulation of {@link spectrum}, once started. */
    public get fft(): WaterFFT | null {
        return this._fft;
    }

    /** @internal Starts reading back what the simulation computed for the CPU, once submitted. */
    public afterSimulationSubmit(): void {
        this._fft?.readBack();
    }

    /** @internal True when there are FFT waves or ripples to advance. */
    public get hasSimulation(): boolean {
        return !!this._fft || !!this._ripples;
    }

    /** @internal Advances the FFT waves and the ripples by dt seconds (once per frame however many views draw). */
    public stepSimulation(command: GPUCommandEncoder, dt: number): void {
        if (Time.frame === this._simulationFrame) return;
        this._simulationFrame = Time.frame;
        if (this._fft && this._spectrum) {
            this._fft.step(command, this._spectrum, this._time, dt * this.timeScale);
            this._fft.queryHeights(command, this._heightQueries);
            this._heightQueries.length = 0;
        }
        const ripples = this._ripples;
        if (!ripples) return;
        const w = this.transform.worldMatrix.rawData;
        const [minX, minZ, maxX, maxZ] = ripples.bounds;
        const cell: [number, number] = [
            (maxX - minX) / ripples.gridWidth * Math.hypot(w[0], w[1], w[2]),
            (maxZ - minZ) / ripples.gridHeight * Math.hypot(w[8], w[9], w[10]),
        ];
        // The mask covers the footprint's bounds; a ripple area is all water.
        const mask = this._footprint && this._ctx && !this._rippleArea ? this._footprint.getMaskView(this._ctx.device as GPUDevice) : null;
        ripples.step(command, dt * this.timeScale, cell, this.rippleSpeed, this.rippleDamping, mask);
    }

    /** @internal Current ripple heights (r, over {@link footprintBounds}), or null before the first ripple. */
    public get rippleView(): GPUTextureView | null {
        return this._ripples ? this._ripples.heightTexture.getGPUView() as GPUTextureView : null;
    }

    /** @internal True once a ripple has started the simulation. */
    public get hasRipples(): boolean {
        return !!this._ripples;
    }

    /** @internal Outline of a custom surface mesh; null for the rectangle. */
    public get footprint(): WaterFootprint | null {
        return this._footprint;
    }

    /** @internal Local xz bounds of the surface: min x, min z, max x, max z. */
    public get footprintBounds(): [number, number, number, number] {
        if (this._footprint) return this._footprint.bounds;
        return [-this._width / 2, -this._length / 2, this._width / 2, this._length / 2];
    }

    /** Wave phase time in seconds. */
    public get time(): number {
        return this._time;
    }
    public set time(value: number) {
        this._time = value;
    }

    public onUpdate(view?: View3D): void {
        this._time += Time.delta * 0.001 * this.timeScale;
        this._waterMaterial.waveTime = this._time;
        this._waterMaterial.baseHeight = this.baseHeight;
        this._waterMaterial.detailScale = Math.max(this.detailScale, 1e-3);
        this._waterMaterial.detailStrength = this.detailStrength;
        this._waterMaterial.fftCrest = this._spectrum ? this._significantHeight(this._spectrum) : 0;
        this._pushWaves();
        this._bindPyramid(view);
        this._updateRipples(view);
    }

    /** True when the point is inside the water's xz footprint and below the surface. */
    public isUnderwater(point: Vector3): boolean {
        if (!this.containsXZ(point.x, point.z)) return false;
        return point.y < this.getHeight(point.x, point.z);
    }

    /**
     * True when world (x, z) lies inside the water's footprint.
     * @param margin grows the footprint by this many world units on each side
     */
    public containsXZ(x: number, z: number, margin: number = 0): boolean {
        if (!this.transform || !this._invWorld) return false;
        const m = this.invWorldMatrix.rawData;
        const y = this.baseHeight;
        const lx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const lz = m[2] * x + m[6] * y + m[10] * z + m[14];
        // Margin in local units along x and z.
        const mx = margin * Math.hypot(m[0], m[4], m[8]);
        const mz = margin * Math.hypot(m[2], m[6], m[10]);
        const [minX, minZ, maxX, maxZ] = this.footprintBounds;
        if (lx < minX - mx || lx > maxX + mx || lz < minZ - mz || lz > maxZ + mz) return false;
        const f = this._footprint;
        if (!f) return true;
        return f.contains(lx, lz) || f.contains(lx - mx, lz) || f.contains(lx + mx, lz)
            || f.contains(lx, lz - mz) || f.contains(lx, lz + mz);
    }

    /** @internal World to local space, where the footprint is |x| <= width / 2, |z| <= length / 2. */
    public get invWorldMatrix(): Matrix4 {
        this._invWorld.rawData.set(this.transform.worldMatrix.rawData);
        return this._invWorld.invert();
    }

    /** @internal How high above {@link baseHeight} the waves can lift the surface. */
    public get waveReach(): number {
        let reach = 0;
        for (let i = 0; i < Math.min(this.waves.length, WATER_MAX_WAVES); i++) {
            const w = this.waves[i];
            if (w && w.wavelength > 0) reach += w.steepness * w.wavelength / (2 * Math.PI);
        }
        // The highest FFT crests rise about the significant wave height.
        return reach + (this._spectrum ? this._significantHeight(this._spectrum) : 0);
    }

    /** @internal World y of the undisplaced surface. */
    public get baseHeight(): number {
        return this.transform?.worldPosition.y ?? 0;
    }

    /** @internal Wave i as (direction.x, direction.z, steepness, wavelength), zeros when unused. */
    public waveVector(i: number): [number, number, number, number] {
        const w = i < WATER_MAX_WAVES ? this.waves[i] : undefined;
        return w ? [w.direction.x, w.direction.y, w.steepness, w.wavelength] : [0, 0, 0, 0];
    }

    /**
     * World-space height of the surface above (x, z) at the current time.
     * Gerstner waves also move points sideways, so the undisplaced position
     * whose displaced xz lands on (x, z) is found by fixed-point iteration.
     * The FFT waves ({@link spectrum}) are computed on the GPU: asking for a
     * point queues it, and their part of the height comes from the nearest
     * point asked for in an earlier frame, a frame or two old (none until
     * then). Ask every frame for points that move.
     */
    public getHeight(x: number, z: number): number {
        const baseY = this.baseHeight;
        let px = x;
        let pz = z;
        for (let i = 0; i < 4; i++) {
            const d = this._displacement(px, pz);
            px = x - d[0];
            pz = z - d[2];
        }
        let height = baseY + this._displacement(px, pz)[1];
        if (this._fft) {
            if (this._heightQueries.length < WATER_FFT_MAX_QUERIES * 2) this._heightQueries.push(x, z);
            height += this._fft.heightAt(x, z) ?? 0;
        }
        return height;
    }

    private _displacement(x: number, z: number): [number, number, number] {
        let dx = 0, dy = 0, dz = 0;
        for (let i = 0; i < Math.min(this.waves.length, WATER_MAX_WAVES); i++) {
            const w = this.waves[i];
            if (!w || w.wavelength <= 0) continue;
            const len = Math.hypot(w.direction.x, w.direction.y) || 1;
            const ux = w.direction.x / len, uz = w.direction.y / len;
            const k = (2 * Math.PI) / w.wavelength;
            const c = Math.sqrt(GRAVITY / k);
            const f = k * (ux * x + uz * z - c * this._time);
            const a = w.steepness / k;
            dx += ux * a * Math.cos(f);
            dy += a * Math.sin(f);
            dz += uz * a * Math.cos(f);
        }
        return [dx, dy, dz];
    }

    private _pushWaves(): void {
        for (let i = 0; i < WATER_MAX_WAVES; i++) {
            const v = this.waveVector(i);
            const o = i * 4;
            if (this._sentWaves[o] === v[0] && this._sentWaves[o + 1] === v[1]
                && this._sentWaves[o + 2] === v[2] && this._sentWaves[o + 3] === v[3]) continue;
            this._waterMaterial.setWave(i, v[0], v[1], v[2], v[3]);
            this._sentWaves.splice(o, 4, ...v);
        }
    }

    // The pyramid and the scene depth are created with the render graph and can be replaced (e.g. on resize).
    private _bindPyramid(view?: View3D): void {
        const ctx = view?.engine3D?.context3D;
        if (!ctx) return;
        const pyramid = RTResourceMap.getTexture(ctx, '_SceneColorPyramid') as Texture;
        if (pyramid && pyramid !== this._pyramid) {
            this._pyramid = pyramid;
            this._waterMaterial.sceneColorPyramid = pyramid;
        }
        // Present only with setting.render.water (SceneLinearDepthPass).
        const depth = (RTResourceMap.getTexture(ctx, SCENE_LINEAR_DEPTH) as Texture) ?? null;
        if (depth !== this._sceneDepth) {
            this._sceneDepth = depth;
            this._waterMaterial.sceneLinearDepth = depth;
        }
    }

    public destroy(force?: boolean): void {
        this._resetRipples();
        this._resetFFT();
        this._footprint?.destroy();
        this._footprint = null;
        super.destroy(force);
    }

    // The simulation starts with the first ripple and covers the current footprint bounds.
    private _updateRipples(view?: View3D): void {
        this._ctx = view?.engine3D?.context3D ?? this._ctx;
        // The built-in foam texture once the context is known, unless one was set.
        if (this._ctx && !this._foamTextureSet) {
            this._foamTextureSet = true;
            if (!this._waterMaterial.foamTexture) this._waterMaterial.foamTexture = waterFoamTexture(this._ctx);
        }
        if (this._spectrum && !this._fft && this._ctx) {
            this._fft = new WaterFFT(this._ctx);
            this._waterMaterial.fft = this._fft;
        }
        if (!this._ripples && this._rippleQueue.length > 0 && this._ctx) {
            this._ripples = new WaterRipples(this._ctx, [...this.rippleBounds], this._rippleResolution);
            this._waterMaterial.rippleMap = this._ripples.heightTexture;
        }
        if (!this._ripples) return;
        const q = this._rippleQueue;
        for (let i = 0; i < q.length; i += 4) this._ripples.add(q[i], q[i + 1], q[i + 2], q[i + 3]);
        q.length = 0;
        const m = this.invWorldMatrix.rawData;
        const y = this.baseHeight;
        this._waterMaterial.setRippleTransform(
            [m[0], m[8], m[4] * y + m[12]],
            [m[2], m[10], m[6] * y + m[14]],
            this._ripples.bounds);
    }

    // Significant wave height of a fetch-limited JONSWAP sea, 0.0016 U sqrt(F / g).
    private _significantHeight(spectrum: WaterSpectrum): number {
        return 0.0016 * spectrum.windSpeed * Math.sqrt(spectrum.fetch / GRAVITY) * spectrum.amplitude;
    }

    private _resetFFT(): void {
        if (!this._fft) return;
        this._fft.destroy();
        this._fft = null;
        this._waterMaterial.fft = null;
    }

    private _resetRipples(): void {
        if (!this._ripples) return;
        this._ripples.destroy();
        this._ripples = null;
        this._waterMaterial.rippleMap = null;
    }

    private _rebuildGeometry(): void {
        if (!this._waterMaterial || this._surface) return;
        const longer = Math.max(this._width, this._length);
        const segW = Math.max(1, Math.round(this._resolution * this._width / longer));
        const segL = Math.max(1, Math.round(this._resolution * this._length / longer));
        this.geometry = new PlaneGeometry(this._width, this._length, segW, segL);
    }
}
