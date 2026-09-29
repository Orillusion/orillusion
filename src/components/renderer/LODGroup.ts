import { Camera3D } from '../../core/Camera3D';
import { CameraType } from '../../core/CameraType';
import { Object3D } from '../../core/entities/Object3D';
import { View3D } from '../../core/View3D';
import { DEGREES_TO_RADIANS } from '../../math/MathUtil';
import { Vector3 } from '../../math/Vector3';
import { RegisterComponent } from '../../util/SerializeDecoration';
import { ComponentBase } from '../ComponentBase';

/**
 * How `LODGroup` measures "how big this object is on screen".
 * @group Components
 */
export enum LODMode {
    /**
     * Unity-style: the ratio of the group's bounding-sphere diameter to the
     * viewport height (0..1). Resolution- and FOV-aware, so a level switches
     * at the same *apparent* size regardless of camera lens or distance.
     * Level thresholds are that ratio (e.g. 0.5, 0.15, 0.03).
     */
    ScreenSize = 0,
    /**
     * three.js-style: plain world-space distance from the camera to the
     * group's bound center. Level thresholds are distances (e.g. 20, 60, 150).
     */
    Distance = 1,
}

/**
 * One level of detail: the objects to show and the threshold at which it
 * stops being used.
 * @group Components
 */
export interface LODLevel {
    /**
     * Objects that make up this level. They are toggled via `transform.enable`
     * (which also covers their children), so a level can be a whole glTF
     * sub-tree, not just a single MeshRenderer.
     */
    objects: Object3D[];
    /**
     * `LODMode.ScreenSize`: the *minimum* screen-relative height this level
     * stays visible for. `LODMode.Distance`: the *maximum* distance.
     */
    threshold: number;
}

/**
 * Level-of-detail switcher. Registers N sets of objects with a threshold each
 * and, every frame, enables exactly one set (or none, when the object is too
 * small / far and `cullBeyondLast` is on) based on the view's camera.
 *
 * Levels are kept sorted from most to least detailed no matter the order
 * they were added in, so `addLevel` can be called in any order.
 *
 * ```ts
 * const lod = obj.addComponent(LODGroup);
 * lod.addLevel([highMesh], 0.4);   // shown while ≥40 % of viewport height
 * lod.addLevel([midMesh],  0.12);  // 12 %–40 %
 * lod.addLevel([lowMesh],  0.03);  // 3 %–12 %, below that: culled
 * ```
 * @group Components
 */
@RegisterComponent(LODGroup, 'LODGroup')
export class LODGroup extends ComponentBase {
    /** `currentLevel` value while every level is hidden. */
    public static readonly CULLED = -1;

    private _mode: LODMode = LODMode.ScreenSize;

    /**
     * Global scale on the metric. In `ScreenSize` mode >1 keeps detailed
     * levels visible longer (like Unity's `QualitySettings.lodBias`); in
     * `Distance` mode the measured distance is divided by it, so the same
     * direction applies.
     */
    public bias: number = 1;

    /**
     * Fraction of the threshold used as a dead-band so a group parked right
     * on a boundary does not flicker between two levels. A level is only
     * dropped for a coarser one when the metric is past the threshold, and
     * only re-promoted when it is past `threshold * (1 + hysteresis)`.
     */
    public hysteresis: number = 0.1;

    /** Hide every level once the last threshold is crossed. */
    public cullBeyondLast: boolean = true;

    /**
     * Debug/authoring override: `null` = automatic, otherwise the level index
     * to force (clamped). `LODGroup.CULLED` forces everything hidden.
     */
    public forceLevel: number | null = null;

    /**
     * Optional camera override; defaults to the camera of the view that
     * updates this component.
     */
    public camera: Camera3D | null = null;

    /**
     * Bounding-sphere radius (world units) used for `ScreenSize`. `null`
     * (default) derives it from the world bounds of every level's objects the
     * first time it is needed; call `recalculateBounds()` after changing
     * geometry or scale.
     */
    public radius: number | null = null;

    private _levels: LODLevel[] = [];
    private _currentLevel: number = LODGroup.CULLED;
    private _lastMetric: number = 0;
    private _hasApplied: boolean = false;
    private _autoRadius: number = -1;
    private _onLevelChange: ((level: number, previous: number) => void) | null = null;
    private static readonly _tmpCenter: Vector3 = new Vector3();

    /**
     * Metric used to pick a level. Thresholds are in the metric's unit, so
     * after switching modes hand in matching values via `setThresholds`.
     * The level order (finest first) is kept across the switch on purpose:
     * re-sorting by the *old* thresholds would reverse it, and the new
     * thresholds are assigned by that order.
     */
    public get mode(): LODMode {
        return this._mode;
    }

    public set mode(value: LODMode) {
        if (this._mode === value) return;
        this._mode = value;
        this._hasApplied = false;
    }

    /** Levels, most detailed first. Treat as read-only; use `addLevel` / `removeLevel`. */
    public get levels(): ReadonlyArray<LODLevel> {
        return this._levels;
    }

    /** Index into `levels` of the level currently shown, or `LODGroup.CULLED`. */
    public get currentLevel(): number {
        return this._currentLevel;
    }

    /** Metric (screen-relative height or distance) measured on the last update. */
    public get lastMetric(): number {
        return this._lastMetric;
    }

    /** Called after the shown level changes. */
    public set onLevelChange(cb: ((level: number, previous: number) => void) | null) {
        this._onLevelChange = cb;
    }

    /**
     * Register a level. Objects are hidden immediately; the right one is
     * enabled on the next update. Returns the level's index after sorting.
     */
    public addLevel(objects: Object3D | Object3D[], threshold: number): number {
        const list = Array.isArray(objects) ? objects.slice() : [objects];
        const level: LODLevel = { objects: list, threshold };
        this._levels.push(level);
        this._sortLevels();
        for (const o of list) o.transform.enable = false;
        this._autoRadius = -1;
        this._hasApplied = false;
        return this._levels.indexOf(level);
    }

    /** Remove a level (its objects are re-enabled and no longer managed). */
    public removeLevel(index: number): void {
        const level = this._levels[index];
        if (!level) return;
        this._levels.splice(index, 1);
        for (const o of level.objects) o.transform.enable = true;
        this._autoRadius = -1;
        this._hasApplied = false;
    }

    /**
     * Change one level's threshold at runtime. Levels are re-sorted, so the
     * index of *other* levels may move; to rewrite several thresholds use
     * `setThresholds`, which assigns them all before sorting.
     */
    public setThreshold(index: number, threshold: number): void {
        const level = this._levels[index];
        if (!level) return;
        level.threshold = threshold;
        this._sortLevels();
        this._hasApplied = false;
    }

    /**
     * Rewrite every threshold in the current (finest-first) level order, then
     * re-sort once. The usual companion of a `mode` switch.
     */
    public setThresholds(thresholds: number[]): void {
        const n = Math.min(thresholds.length, this._levels.length);
        for (let i = 0; i < n; i++) this._levels[i].threshold = thresholds[i];
        this._sortLevels();
        this._hasApplied = false;
    }

    /** Forget the cached auto radius; recomputed on next update. */
    public recalculateBounds(): void {
        this._autoRadius = -1;
    }

    /**
     * Compute the metric this group would use for `camera` right now,
     * without changing any state. Useful for tooling and tests.
     */
    public measure(camera: Camera3D): number {
        const center = this._worldCenter(LODGroup._tmpCenter);
        const dist = Vector3.distance(center, camera.transform.worldPosition);
        if (this.mode === LODMode.Distance) {
            return dist / Math.max(this.bias, 1e-6);
        }
        const r = this._effectiveRadius();
        let h: number;
        if (camera.type === CameraType.ortho && camera.frustumSize > 0) {
            h = (2 * r) / camera.frustumSize;
        } else {
            const halfFovTan = Math.tan(camera.fov * 0.5 * DEGREES_TO_RADIANS);
            h = r / (Math.max(dist, 1e-6) * halfFovTan);
        }
        return h * this.bias;
    }

    /**
     * Pick the level for a metric value, applying hysteresis relative to
     * `from` (the level currently shown). Pure function of the inputs.
     */
    public selectLevel(metric: number, from: number = this._currentLevel): number {
        const n = this._levels.length;
        if (n === 0) return LODGroup.CULLED;
        if (this.forceLevel != null) {
            return this.forceLevel === LODGroup.CULLED ? LODGroup.CULLED : Math.min(Math.max(this.forceLevel, 0), n - 1);
        }
        // "Passes" = the metric says this level (or a finer one) is allowed.
        const passes = (i: number, promote: boolean): boolean => {
            let t = this._levels[i].threshold;
            if (this.mode === LODMode.ScreenSize) {
                if (promote) t *= 1 + this.hysteresis;
                return metric >= t;
            } else {
                if (promote) t /= 1 + this.hysteresis;
                return metric <= t;
            }
        };
        let level = LODGroup.CULLED;
        for (let i = 0; i < n; i++) {
            // Promoting to a finer level than the current one needs the extra margin.
            const promote = from === LODGroup.CULLED ? false : i < from;
            if (passes(i, promote)) { level = i; break; }
        }
        if (level === LODGroup.CULLED && !this.cullBeyondLast) level = n - 1;
        return level;
    }

    public onUpdate(view?: View3D): void {
        const cam = this.camera ?? view?.camera ?? this.transform.view3D?.camera;
        if (!cam || this._levels.length === 0) return;
        this._lastMetric = this.measure(cam);
        this._apply(this.selectLevel(this._lastMetric, this._currentLevel));
    }

    public onEnable(): void {
        // Re-apply on (re)enable so a group that was disabled with a stale
        // level does not show two levels at once.
        this._hasApplied = false;
    }

    public destroy(force?: boolean): void {
        for (const level of this._levels) for (const o of level.objects) o.transform.enable = true;
        this._levels.length = 0;
        this._onLevelChange = null;
        super.destroy(force);
    }

    public cloneTo(obj: Object3D): void {
        const c = obj.addComponent(LODGroup);
        c.mode = this.mode;
        c.bias = this.bias;
        c.hysteresis = this.hysteresis;
        c.cullBeyondLast = this.cullBeyondLast;
        c.forceLevel = this.forceLevel;
        c.radius = this.radius;
        // Level objects are children of the owner in the common case; map
        // them by index into the clone's children, fall back to the originals.
        for (const level of this._levels) {
            const mapped = level.objects.map(o => {
                const i = this.object3D.entityChildren.indexOf(o);
                return i >= 0 ? ((obj.entityChildren[i] as Object3D) ?? o) : o;
            });
            c.addLevel(mapped, level.threshold);
        }
    }

    private _apply(level: number): void {
        if (this._hasApplied && level === this._currentLevel) return;
        const previous = this._currentLevel;
        for (let i = 0; i < this._levels.length; i++) {
            const show = i === level;
            for (const o of this._levels[i].objects) {
                if (o.transform.enable !== show) o.transform.enable = show;
            }
        }
        this._currentLevel = level;
        this._hasApplied = true;
        if (previous !== level) this._onLevelChange?.(level, previous);
    }

    private _sortLevels(): void {
        // Finest first: ScreenSize = larger threshold first; Distance = smaller first.
        if (this._mode === LODMode.Distance) this._levels.sort((a, b) => a.threshold - b.threshold);
        else this._levels.sort((a, b) => b.threshold - a.threshold);
    }

    private _worldCenter(out: Vector3): Vector3 {
        return out.copy(this.transform.worldPosition);
    }

    private _effectiveRadius(): number {
        if (this.radius != null && this.radius > 0) return this.radius;
        if (this._autoRadius < 0) this._autoRadius = this._computeAutoRadius();
        return this._autoRadius;
    }

    /**
     * Largest distance from the owner's world position to any corner of any
     * level object's world AABB. `Entity.bound` is transform-driven, not
     * visibility-driven, so hidden levels still report correct bounds.
     */
    private _computeAutoRadius(): number {
        const origin = this.transform.worldPosition;
        let r = 0;
        for (const level of this._levels) {
            for (const o of level.objects) {
                r = Math.max(r, LODGroup._maxCornerDistance(o, origin));
            }
        }
        return r > 0 ? r : 0.5;
    }

    private static _maxCornerDistance(o: Object3D, origin: Vector3): number {
        let r = 0;
        const b = o.bound;
        if (b && b.extents && (b.extents.x > 0 || b.extents.y > 0 || b.extents.z > 0)) {
            const c = b.center, e = b.extents;
            const dx = Math.max(Math.abs(c.x - e.x - origin.x), Math.abs(c.x + e.x - origin.x));
            const dy = Math.max(Math.abs(c.y - e.y - origin.y), Math.abs(c.y + e.y - origin.y));
            const dz = Math.max(Math.abs(c.z - e.z - origin.z), Math.abs(c.z + e.z - origin.z));
            r = Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        for (const child of o.entityChildren) {
            r = Math.max(r, LODGroup._maxCornerDistance(child as Object3D, origin));
        }
        return r;
    }
}
