import { Vector3, Transform } from '@orillusion/core'
import { Ammo, Physics } from '../Physics'
import { RigidBodyUtil } from '../utils/RigidBodyUtil';
import { ContactProcessedUtil } from '../utils/ContactProcessedUtil';


/**
 * @class PhysicsTransformSync
 * @description This class manages the synchronization between the physics engine's rigid body and the 3D object's transform.
 * It allows enabling or disabling the automatic update of the physics body when the transform changes.
 */
export class PhysicsTransformSync {
    public isUpdatingFromPhysics: boolean = false;
    private _btRigidbody: Ammo.btRigidBody;
    private _mass: number;

    private _enablePhysicsTransformSync: boolean = false;
    private transform: Transform;

    constructor(transform: Transform) {
        this.transform = transform;
    }

    public configure(body: Ammo.btRigidBody, mass: number) {
        this._btRigidbody = body;
        this._mass = mass;
    }

    /**
     * Enables or disables the transform sync with physics.
     * If enabled, changes to the transform will automatically update the physics body.
     */
    public set enablePhysicsTransformSync(value: boolean) {
        if (this._enablePhysicsTransformSync === value) return;
        this._enablePhysicsTransformSync = value;
        this.isUpdatingFromPhysics = !value;

        this.transform.onPositionChange = value ? this.onPositionChange.bind(this) : null;
        this.transform.onRotationChange = value ? this.onRotationChange.bind(this) : null;
        this.transform.onScaleChange = value ? this.onScaleChange.bind(this) : null;

        if (value && this._btRigidbody) {
            RigidBodyUtil.updateTransform(this._btRigidbody, this.transform.localPosition, this.transform.localRotation, false);
            Physics.syncGraphic(this.transform.object3D, this._btRigidbody.getWorldTransform());
            this.onScaleChange();
        }
    }

    public get enablePhysicsTransformSync() {
        return this._enablePhysicsTransformSync;
    }

    private onPositionChange(oldValue?: Vector3, newValue?: Vector3) {
        if (this.isUpdatingFromPhysics) return;
        newValue ||= this.transform.localPosition;
        RigidBodyUtil.updatePosition(this._btRigidbody, newValue);
    };

    private onRotationChange(oldValue?: Vector3, newValue?: Vector3) {
        if (this.isUpdatingFromPhysics) return;
        newValue ||= this.transform.localRotation;
        RigidBodyUtil.updateRotation(this._btRigidbody, newValue);
    }

    private onScaleChange(oldValue?: Vector3, newValue?: Vector3) {
        newValue ||= this.transform.localScale;
        RigidBodyUtil.updateScale(this._btRigidbody, newValue, this._mass);
    }

    public destroy() {
        this._btRigidbody = null;
        if (this._enablePhysicsTransformSync) {
            this.transform.onPositionChange = null;
            this.transform.onRotationChange = null;
            this.transform.onScaleChange = null;
        }
        this.transform = null;
    }
}


/**
 * @class CollisionEventHandler
 * @description This class handles the registration and configuration of collision events for physics bodies.
 * It allows enabling or disabling collision events and setting custom collision callbacks.
 */
export class CollisionEventHandler {
    private _pointer: number;
    private _collisionEvent: (contactPoint: Ammo.btManifoldPoint, selfBody: Ammo.btRigidBody, otherBody: Ammo.btRigidBody) => void;
    private _enableCollisionEvent: boolean = true;

    public configure(pointer: number) {
        this._pointer && ContactProcessedUtil.unregisterCollisionCallback(this._pointer);
        this._pointer = pointer;
        this.configureCollisionEvent();
    }

    public get enableCollisionEvent() {
        return this._enableCollisionEvent;
    }

    public set enableCollisionEvent(value: boolean) {
        if (this._enableCollisionEvent !== value) {
            this._enableCollisionEvent = value;
            this.configureCollisionEvent();
        }
    }

    public get collisionEvent() {
        return this._collisionEvent;
    }

    public set collisionEvent(callback: (contactPoint: Ammo.btManifoldPoint, selfBody: Ammo.btRigidBody, otherBody: Ammo.btRigidBody) => void) {
        this._collisionEvent = callback;
        this.configureCollisionEvent()
    }

    private configureCollisionEvent() {
        if (this._pointer && this._collisionEvent) {
            if (this._enableCollisionEvent) {
                ContactProcessedUtil.registerCollisionCallback(this._pointer, this.collisionEvent);
            } else {
                ContactProcessedUtil.unregisterCollisionCallback(this._pointer);
            }
        }
    }

    public destroy() {
        ContactProcessedUtil.unregisterCollisionCallback(this._pointer);
        this._collisionEvent = null;
    }
}