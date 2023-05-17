import Ammo from '@orillusion/ammo';
import { Vector3, BoxColliderShape, CapsuleColliderShape, ColliderComponent, ComponentBase, MeshColliderShape, Quaternion, SphereColliderShape } from '@orillusion/core'
import { Physics } from './Physics';

enum CollisionFlags {
    STATIC_OBJECT = 1,
    KINEMATIC_OBJECT = 2,
    NO_CONTACT_RESPONSE = 4,
    CUSTOM_MATERIAL_CALLBACK = 8,
    CHARACTER_OBJECT = 16,
    DISABLE_VISUALIZE_OBJECT = 32,
    DISABLE_SPU_COLLISION_PROCESSING = 64,
    HAS_CONTACT_STIFFNESS_DAMPING = 128,
    HAS_CUSTOM_DEBUG_RENDERING_COLOR = 256,
    HAS_FRICTION_ANCHOR = 512,
    HAS_COLLISION_SOUND_TRIGGER = 1024
}

enum CollisionObjectTypes {
    COLLISION_OBJECT = 1,
    RIGID_BODY = 2,
    GHOST_OBJECT = 4,
    SOFT_BODY = 8,
    HF_FLUID = 16,
    USER_TYPE = 32,
    FEATHERSTONE_LINK = 64
}

/**
 * Rigidbody Component
 * Rigid bodies can endow game objects with physical properties, allowing them to be controlled by the physics system and subjected to forces and torques, thus achieving realistic motion effects.
 * @group Components
 */
export class Rigidbody extends ComponentBase {
    private _mass: number = 0.01;
    private _velocity: Vector3 = new Vector3();
    private _angularVelocity: Vector3 = new Vector3();
    private _force: Vector3 = new Vector3();
    private _useGravity: boolean = true;
    private _isKinematic: boolean = false;
    private _isStatic: boolean = false;
    private _isTrigger: boolean = false;
    private _btRigidbody: Ammo.btRigidBody;
    private _btRigidbodyInited: boolean = false;
    private _friction: number = 0.6;
    private _rollingFriction: number = 0.1;
    private _restitution: number = 0.8

    private _initedFunctions: { fun: Function; thisObj: Object }[] = [];

    init(): void {

    }

    public start(): void {
        if (!this.object3D.getComponent(ColliderComponent)) {
            console.error('rigidbody need collider');
            return;
        }
        this.initRigidbody();
    }

    /**
     * Get friction value
     */
    public get friction() {
        return this._friction;
    }
    /**
     * Set friction value
     */
    public set friction(value: number) {
        this._friction = value;
        if (this._btRigidbody) this._btRigidbody.setFriction(value);
    }
    /**
     * Get rolling friction value
     */
    public get rollingFriction(): number {
        return this._rollingFriction;
    }
    /**
     * Set rolling friction value
     */
    public set rollingFriction(value: number) {
        this._rollingFriction = value;
        if (this._btRigidbody) this._btRigidbody.setRollingFriction(value);
    }
    /**
     * Get restitution value
     */
    public get restitution(): number {
        return this._restitution;
    }
    /**
     * Set restitution value
     */
    public set restitution(value: number) {
        this._restitution = value;
        if (this._btRigidbody) this._btRigidbody.setRestitution(value);
    }
    /**
     * Check if rigidbody inited
     */
    public get btRigidbodyInited(): boolean {
        return this._btRigidbodyInited;
    }

    private addAmmoRigidbody(): void {
        var shape = this.getPhysicShape();
        var btTransform = new Ammo.btTransform();
        btTransform.setIdentity();
        var localInertia = new Ammo.btVector3(0, 0, 0);

        shape.calculateLocalInertia(this.mass, localInertia);

        btTransform.setOrigin(new Ammo.btVector3(this.object3D.x, this.object3D.y, this.object3D.z));
        let t = this.object3D.transform;

        Quaternion.HELP_0.fromEulerAngles(t.rotationX, t.rotationY, t.rotationZ);
        let btq = new Ammo.btQuaternion(Quaternion.HELP_0.x, Quaternion.HELP_0.y, Quaternion.HELP_0.z, Quaternion.HELP_0.w);
        btTransform.setRotation(btq);

        var motionState = new Ammo.btDefaultMotionState(btTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, motionState, shape, localInertia);

        this._btRigidbody = new Ammo.btRigidBody(rbInfo);
        this._btRigidbody.setRestitution(this.restitution);
        this.btRigidbody.setFriction(this.friction);
        this.btRigidbody.setRollingFriction(this.rollingFriction);
        Physics.addRigidbody(this);
    }
    private initRigidbody(): void {
        this.addAmmoRigidbody();

        for (let i = 0; i < this._initedFunctions.length; i++) {
            let fun = this._initedFunctions[i];
            fun.fun.call(fun.thisObj);
        }
        this._btRigidbodyInited = true;
    }

    /**
     * Add init callback
     * @param fun callback function
     * @param thisObj this
     */
    public addInitedFunction(fun: Function, thisObj: Object) {
        this._initedFunctions.push({ fun: fun, thisObj: thisObj });
    }
    /**
     * Remove init callback
     * @param fun callback function
     * @param thisObj this
     */
    public removeInitedFunction(fun: Function, thisObj: Object) {
        for (let i = 0; i < this._initedFunctions.length; i++) {
            let item = this._initedFunctions[i];
            if (item.fun === fun && item.thisObj === thisObj) {
                this._initedFunctions.splice(i, 1);
                break;
            }
        }
    }

    private getPhysicShape() {
        let collider = this.object3D.getComponent(ColliderComponent);
        let colliderShape = collider.shape;

        var shape: Ammo.btCollisionShape;

        if (colliderShape instanceof BoxColliderShape) {
            shape = new Ammo.btBoxShape(new Ammo.btVector3(colliderShape.halfSize.x, colliderShape.halfSize.y, colliderShape.halfSize.z));
        } else if (colliderShape instanceof CapsuleColliderShape) {
            shape = new Ammo.btCapsuleShape(colliderShape.radius, colliderShape.height);
        } else if (colliderShape instanceof MeshColliderShape) {
            // let  triangleMeshShape = new Ammo.btTriangleMeshShape();
        } else if (colliderShape instanceof SphereColliderShape) {
            shape = new Ammo.btSphereShape(colliderShape.radius);
        }
        return shape;
    }

    /**
     * Return internal Ammo.btRigidBody
     */
    public get btRigidbody(): Ammo.btRigidBody {
        return this._btRigidbody;
    }

    onUpdate(): void {
        if (this._btRigidbody && this._btRigidbody.getMotionState()) {
            this._btRigidbody.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);

            this.transform.x = Physics.TEMP_TRANSFORM.getOrigin().x();
            this.transform.y = Physics.TEMP_TRANSFORM.getOrigin().y();
            this.transform.z = Physics.TEMP_TRANSFORM.getOrigin().z();

            let q = Quaternion.HELP_0;
            q.set(Physics.TEMP_TRANSFORM.getRotation().x(), Physics.TEMP_TRANSFORM.getRotation().y(), Physics.TEMP_TRANSFORM.getRotation().z(), Physics.TEMP_TRANSFORM.getRotation().w());

            this.object3D.transform.localRotQuat = q;

            Physics.checkBound(this);
        }
    }

    public destroy(force?: boolean): void {
        Physics.removeRigidbody(this);
        this._initedFunctions = null;
        super.destroy(force);
    }

    /**
     * Get mass value。
     */
    public get mass(): number {
        return this._mass;
    }
    /**
     * Set mass value。
     */
    public set mass(value: number) {
        this._mass = value;
        if (this._btRigidbody) {
            Physics.world.removeRigidBody(this._btRigidbody);
            this.addAmmoRigidbody();
            // console.log("setMassProps", "mass: " + value, "flag: " + this._btRigidbody.getCollisionFlags());
            // this._btRigidbody.setMassProps(value, new Ammo.btVector3(0, 0, 0));
            // this._btRigidbody.setCollisionFlags(this._btRigidbody.getCollisionFlags());
            // console.log("setMassProps", "mass: " + value, "flag: " + this._btRigidbody.getCollisionFlags());
            // if(this.mass <= 0) {
            //     this._btRigidbody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            //     this._btRigidbody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
            // }
        }
    }
    /**
     * Get velocity value of current object
     */
    public get velocity(): Vector3 {
        return this._velocity;
    }
    /**
     * Set velocity value of current object
     */
    public set velocity(value: Vector3) {
        this._velocity = value.clone();
        if (this._btRigidbody) {
            this._btRigidbody.applyForce(new Ammo.btVector3(value.x, value.y, value.z), new Ammo.btVector3(0, 0, 0));
        }
    }
    /**
     * Get the angular velocity value of current object
     */
    public get angularVelocity(): Vector3 {
        return this._angularVelocity;
    }

    /**
     * Set the angular velocity value of current object
     */
    public set angularVelocity(value: Vector3) {
        this._angularVelocity = value;
    }
    /**
     * Check if the rigidbody affect physics system
     */
    public get isKinematic(): boolean {
        return this._isKinematic;
    }
    /**
     * Set if the rigidbody affect physics system
     */
    public set isKinematic(value: boolean) {
        this._isKinematic = value;
    }

    public get isTrigger(): boolean {
        return this._isTrigger;
    }

    public set isTrigger(value: boolean) {
        this._isTrigger = value;
    }
}
