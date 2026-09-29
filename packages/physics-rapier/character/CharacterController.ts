import { ComponentBase, Vector3 } from '@orillusion/core';
import RAPIER from '@dimforge/rapier3d-compat';
import { Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';

/**
 * Kinematic character controller — Rapier-only, no ammo equivalent.
 *
 * Owns its own kinematic-position-based body and collider; user calls `move()`
 * each frame with a desired translation, controller resolves penetration,
 * slope climbing, snap-to-ground.
 *
 * @group Components
 */
export class CharacterController extends ComponentBase {
    private _initResolve!: () => void;
    private _initializationPromise: Promise<void> = new Promise<void>(r => this._initResolve = r);

    private _body: RAPIER.RigidBody;
    private _collider: RAPIER.Collider;
    private _controller: RAPIER.KinematicCharacterController;
    private _bodyInited = false;
    private _grounded = false;
    /** `Physics.stepCount` when our body was created; see `move()`. */
    private _bornStep = 0;

    /** Collider descriptor (typically a capsule). Set BEFORE `start()`. */
    public shape: RAPIER.ColliderDesc;

    /** Penetration prediction offset. Default `0.01`. */
    public offset: number = 0.01;
    /** Maximum slope angle the character can walk up (radians). */
    public maxSlopeClimbAngle: number = (45 * Math.PI) / 180;
    /** Below this slope angle the character starts sliding (radians). */
    public minSlopeSlideAngle: number = (30 * Math.PI) / 180;
    /** Snap-to-ground distance. `0` disables snapping. */
    public snapToGround: number = 0.5;
    /** Whether character pushes dynamic bodies it collides with. */
    public applyImpulsesToDynamicBodies: boolean = true;
    /** Auto-step config: `null` to disable. */
    public autoStep: { maxHeight: number; minWidth: number; includeDynamic: boolean } | null = null;

    public start(): void {
        if (!Physics.isInited) throw new Error('CharacterController.start: Physics not initialized.');
        if (!this.shape) throw new Error('CharacterController.start: `shape` is required.');

        const pos = this.transform.localPosition;
        const rot = this.transform.localRotQuat;
        const desc = RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(pos.x, pos.y, pos.z)
            .setRotation({ x: rot.x, y: rot.y, z: rot.z, w: rot.w });
        this._body = Physics.world.createRigidBody(desc);
        this._collider = Physics.world.createCollider(this.shape, this._body);

        const cc = Physics.world.createCharacterController(this.offset);
        cc.setMaxSlopeClimbAngle(this.maxSlopeClimbAngle);
        cc.setMinSlopeSlideAngle(this.minSlopeSlideAngle);
        if (this.snapToGround > 0) cc.enableSnapToGround(this.snapToGround);
        cc.setApplyImpulsesToDynamicBodies(this.applyImpulsesToDynamicBodies);
        if (this.autoStep) {
            cc.enableAutostep(this.autoStep.maxHeight, this.autoStep.minWidth, this.autoStep.includeDynamic);
        }

        this._controller = cc;
        this._bornStep = Physics.stepCount;
        this._bodyInited = true;
        this._initResolve();
    }

    /**
     * Compute and apply a movement step. Internal pipeline:
     * 1. computeColliderMovement(desired) → resolves penetration / slopes
     * 2. read computedMovement() & computedGrounded()
     * 3. setNextKinematicTranslation to apply
     */
    public move(desiredTranslation: Vector3): void {
        if (!this._bodyInited) return;
        // Engine3D runs component onUpdate BEFORE the renderLoop that calls
        // Physics.update(), so on the frame this controller (and typically the
        // whole level) was created, no world.step() has run yet and the
        // broad-phase BVH used by computeColliderMovement is empty: the sweep
        // finds nothing, returns the full desired translation and the
        // character falls straight through the floor. Wait for one step.
        if (Physics.stepCount <= this._bornStep) return;

        // Push any CPU-side body pose changes into the colliders before the
        // query. world.step() already does this, but Engine3D runs the
        // renderLoop (Physics.update) AFTER component onUpdate, so a pose set
        // this frame would otherwise not be visible to computeColliderMovement.
        // (Rapier ≥0.15 removed `World.updateSceneQueries()` — the query
        // pipeline now lives in the broad-phase and is refreshed by `step()`;
        // this is the remaining pre-step hook.)
        Physics.world.propagateModifiedBodyPositionsToColliders();

        this._controller.computeColliderMovement(this._collider, TempPhyMath.toRVec(desiredTranslation));
        const m = this._controller.computedMovement();
        this._grounded = this._controller.computedGrounded();

        const cur = this._body.translation();
        this._body.setNextKinematicTranslation({ x: cur.x + m.x, y: cur.y + m.y, z: cur.z + m.z });
    }

    public onUpdate(): void {
        if (!this._bodyInited) return;
        const t = this._body.translation();
        this.transform.localPosition = Vector3.HELP_0.set(t.x, t.y, t.z);
    }

    public destroy(force?: boolean): void {
        if (this._controller && Physics.world) Physics.world.removeCharacterController(this._controller);
        if (this._body && Physics.world) Physics.world.removeRigidBody(this._body);
        this._body = null;
        this._collider = null;
        this._controller = null;
        this._bodyInited = false;
        super.destroy(force);
    }

    public async wait(): Promise<void> { await this._initializationPromise; }

    /** Whether the character is touching the ground after the last `move()`. */
    public isGrounded(): boolean { return this._grounded; }

    public get body(): RAPIER.RigidBody { return this._body; }
    public get collider(): RAPIER.Collider { return this._collider; }
    public get native(): RAPIER.KinematicCharacterController { return this._controller; }
}
