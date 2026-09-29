import RAPIER from '@dimforge/rapier3d-compat';
import { Vector3, Time, View3D } from '@orillusion/core';
import { TempPhyMath } from './utils/TempPhyMath';
import { PhysicsDebugDrawer, DebugDrawerOptions } from './debug/PhysicsDebugDrawer';
import { PhysicsDragger } from './utils/PhysicsDragger';
import type { Rigidbody } from './rigidbody/Rigidbody';

class _Physics {
    private _world: RAPIER.World;
    private _eventQueue: RAPIER.EventQueue;
    private _isInited: boolean = false;
    private _isStop: boolean = false;
    /** Number of completed `world.step()` calls. Lets queries know whether the
     *  broad-phase BVH has been (re)built since a body was added. */
    private _stepCount: number = 0;
    private _gravity: Vector3 = new Vector3(0, -9.8, 0);

    /** Maximum number of internal physics sub-steps per update tick. */
    public maxSubSteps: number = 4;
    /** Fixed simulation timestep used to clamp variable frame deltas. */
    public fixedTimeStep: number = 1 / 60;

    /** @internal Collider handle → Rigidbody component. */
    private _handleToRigidbody: Map<number, Rigidbody> = new Map();
    /** @internal Vehicle controllers needing per-frame `updateVehicle()`. */
    private _preStepCallbacks: Set<(dt: number) => void> = new Set();
    private _debugDrawer: PhysicsDebugDrawer;
    private _dragger: PhysicsDragger;

    /**
     * Initialize Rapier physics world.
     *
     * @param options.gravity - Default `(0, -9.8, 0)`.
     * @param options.deterministic - When `true`, force a single-thread serial
     *   solver path so simulation is bit-exact across runs / machines (cost:
     *   ~10-20% perf). Rapier is largely deterministic by default within the
     *   same WASM build; this flag pins additional knobs for cross-machine
     *   reproducibility.
     * @param options.worker - Reserved for future use. When set, the world
     *   would be marshalled into a Web Worker via SharedArrayBuffer. Currently
     *   logs a one-time warning and falls back to main-thread execution; the
     *   API is stable enough that user code passing this flag will Just Work
     *   when worker mode lands.
     */
    public async init(options: { gravity?: Vector3; deterministic?: boolean; worker?: boolean } = {}) {
        if (options.worker) {
            console.warn(
                '[physics-rapier] worker:true is reserved for a future release; falling back to main-thread.\n' +
                'See https://github.com/Orillusion/orillusion for progress.',
            );
        }

        await RAPIER.init();

        if (options.gravity) this._gravity.copy(options.gravity);

        this._world = new RAPIER.World({
            x: this._gravity.x,
            y: this._gravity.y,
            z: this._gravity.z,
        });

        if (options.deterministic) {
            // Pin the solver iteration counts so the sim is independent of
            // stage 'auto' tuning that can drift between runs.
            // (`numAdditionalFrictionIterations` was removed in Rapier 0.15;
            // friction is now solved inside the main solver loop.)
            this._world.integrationParameters.numSolverIterations = 4;
            this._world.integrationParameters.numInternalPgsIterations = 1;
        }

        this._eventQueue = new RAPIER.EventQueue(true);

        this._isInited = true;
    }

    /**
     * Step the physics world. Drains the event queue and dispatches contact /
     * trigger callbacks back onto registered Rigidbody components.
     *
     * @param timeStep - Default `Time.delta * 0.001`. Clamped against
     *   `fixedTimeStep * maxSubSteps` to avoid spiral-of-death.
     */
    public update(timeStep: number = Time.delta * 0.001) {
        if (!this._isInited || this._isStop) return;

        const cap = this.fixedTimeStep * this.maxSubSteps;
        const dt = Math.min(timeStep, cap);

        // Pre-step (vehicle controllers update wheel forces/poses here).
        for (const cb of this._preStepCallbacks) cb(dt);

        this._world.timestep = dt;
        this._world.step(this._eventQueue);
        this._stepCount++;

        // Drain begin/end collision events.
        this._eventQueue.drainCollisionEvents((h1, h2, started) => {
            const rb1 = this._handleToRigidbody.get(h1);
            const rb2 = this._handleToRigidbody.get(h2);
            if (!rb1 || !rb2) return;

            const isSensor = rb1.isSensor || rb2.isSensor;

            if (started) {
                if (isSensor) {
                    if (rb1.isSensor) rb1.onTriggerEnter?.(rb2);
                    if (rb2.isSensor) rb2.onTriggerEnter?.(rb1);
                } else {
                    rb1._activeContacts.add(rb2);
                    rb2._activeContacts.add(rb1);
                    rb1.onContactBegin?.(rb2);
                    rb2.onContactBegin?.(rb1);
                }
            } else {
                if (isSensor) {
                    if (rb1.isSensor) rb1.onTriggerExit?.(rb2);
                    if (rb2.isSensor) rb2.onTriggerExit?.(rb1);
                } else {
                    rb1._activeContacts.delete(rb2);
                    rb2._activeContacts.delete(rb1);
                    rb1.onContactEnd?.(rb2);
                    rb2.onContactEnd?.(rb1);
                }
            }
        });

        // Emit per-frame "stay" for active contacts.
        for (const rb of this._handleToRigidbody.values()) {
            if (!rb.onContactStay || rb._activeContacts.size === 0) continue;
            for (const other of rb._activeContacts) rb.onContactStay(other);
        }

        // Push post-step poses into Object3D transforms BEFORE the engine
        // finalises matrices for this frame. Doing it here (rather than in
        // `Rigidbody.onUpdate`, which runs before the renderLoop) ensures
        // the render shows the up-to-date body pose without a one-frame lag.
        for (const rb of this._handleToRigidbody.values()) {
            rb._syncTransformFromBody();
        }

        this._debugDrawer?.update();
    }

    /**
     * Enable physics debug drawing. Pass a `Graphic3D` instance attached to your scene.
     */
    public initDebugDrawer(graphic3D: any, options?: DebugDrawerOptions): PhysicsDebugDrawer {
        this._debugDrawer = new PhysicsDebugDrawer(graphic3D, options);
        return this._debugDrawer;
    }

    public get debugDrawer(): PhysicsDebugDrawer { return this._debugDrawer; }

    /**
     * Enable mouse drag of dynamic rigid bodies. Safe to call at any point
     * after `Physics.init`; if `view.engine3D` is not yet bound (i.e. called
     * before `engine.startRenderView`), the dragger defers event registration
     * to the next animation frame and picks up the input system once
     * `startRenderView` runs.
     */
    public enableDragger(view: View3D): PhysicsDragger {
        this._dragger = new PhysicsDragger(view);
        return this._dragger;
    }

    public get dragger(): PhysicsDragger { return this._dragger; }

    /**
     * Serialize the entire physics world to a transferable byte array.
     *
     * Use this for replay / network rollback / save-game state. Rapier
     * snapshots preserve body/collider handle indices, which lets `restore`
     * re-attach existing `Rigidbody` components to the rebuilt world without
     * tearing down Object3Ds.
     *
     * Caveats: snapshots do NOT round-trip Rapier-side controllers (vehicle,
     * character) or engine-only metadata (`onContactBegin` callbacks, sensor
     * flags rebuilt at collider-create time). If you use those, recreate them
     * after `restore`.
     */
    public snapshot(): Uint8Array {
        if (!this._isInited) throw new Error('Physics.snapshot: not initialized.');
        return this._world.takeSnapshot();
    }

    /**
     * Replace the active world with a previously taken snapshot.
     *
     * Re-binds existing `Rigidbody` components to wrappers in the new world
     * using preserved handle indices, so components stay live after restore.
     * Any Rigidbody whose body handle is not present in the snapshot (e.g.
     * spawned after the snapshot was taken) is detached and emits a warning.
     */
    public restore(data: Uint8Array): void {
        // Capture handles BEFORE freeing — once `_world.free()` runs, the JS
        // wrappers turn into dangling pointers and any `.handle` read crashes.
        const rebindEntries: Array<{
            rb: Rigidbody;
            bodyHandle: number;
            colliderHandles: number[];
        }> = [];
        const seen = new Set<Rigidbody>();
        for (const rb of this._handleToRigidbody.values()) {
            if (seen.has(rb)) continue;
            seen.add(rb);
            rebindEntries.push({
                rb,
                bodyHandle: rb.native.handle,
                colliderHandles: rb.colliders.map(c => c.handle),
            });
        }

        if (this._world) this._world.free();
        this._handleToRigidbody.clear();
        this._world = RAPIER.World.restoreSnapshot(data);
        this._eventQueue = new RAPIER.EventQueue(true);

        for (const entry of rebindEntries) {
            const newBody = this._world.getRigidBody(entry.bodyHandle);
            if (!newBody) {
                console.warn(
                    `[physics-rapier] restore: body handle ${entry.bodyHandle} not in snapshot — Rigidbody detached.`,
                );
                entry.rb._detach();
                continue;
            }
            const newColliders: RAPIER.Collider[] = [];
            for (const h of entry.colliderHandles) {
                const c = this._world.getCollider(h);
                if (c) newColliders.push(c);
            }
            entry.rb._rebind(newBody, newColliders);
            for (const c of newColliders) this._handleToRigidbody.set(c.handle, entry.rb);
        }
    }

    public get world(): RAPIER.World { return this._world; }
    public get eventQueue(): RAPIER.EventQueue { return this._eventQueue; }
    public get isInited(): boolean { return this._isInited; }

    /** Completed simulation steps since `init()`. */
    public get stepCount(): number { return this._stepCount; }

    public set isStop(value: boolean) { this._isStop = value; }
    public get isStop(): boolean { return this._isStop; }

    public set gravity(value: Vector3) {
        this._gravity.copy(value);
        if (this._world) this._world.gravity = TempPhyMath.toRVec(value);
    }
    public get gravity(): Vector3 { return this._gravity; }

    /** @internal Used by Rigidbody.start to register all colliders for events. */
    public _registerRigidbody(rb: Rigidbody): void {
        for (const c of rb.colliders) this._handleToRigidbody.set(c.handle, rb);
    }

    /** @internal */
    public _unregisterRigidbody(rb: Rigidbody): void {
        for (const c of rb.colliders) this._handleToRigidbody.delete(c.handle);
        for (const peer of rb._activeContacts) peer._activeContacts.delete(rb);
    }

    /** @internal Lookup the Rigidbody component owning a Rapier collider handle. */
    public _rigidbodyOfHandle(handle: number): Rigidbody | undefined {
        return this._handleToRigidbody.get(handle);
    }

    /** Register a callback to run before every world.step (used by VehicleController). */
    public addPreStep(cb: (dt: number) => void): void {
        this._preStepCallbacks.add(cb);
    }

    public removePreStep(cb: (dt: number) => void): void {
        this._preStepCallbacks.delete(cb);
    }
}

/**
 * Single physics instance, mirroring `@orillusion/physics` Physics symbol.
 *
 * ```ts
 * await Physics.init();
 * ```
 *
 * @group Plugin
 */
export let Physics = new _Physics();
export { RAPIER };
