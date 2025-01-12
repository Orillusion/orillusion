import { Vector3, BoxColliderShape, CapsuleColliderShape, ColliderComponent, ComponentBase, Quaternion, SphereColliderShape } from '@orillusion/core'
import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { ActivationState, CollisionFlags } from './RigidbodyEnum';
import { PhysicsTransformSync, CollisionEventHandler } from './RigidbodyExpansion'
import { CollisionShapeUtil } from '../utils/CollisionShapeUtil';
import { ContactProcessedUtil } from '../utils/ContactProcessedUtil';
import { RigidBodyUtil } from '../utils/RigidBodyUtil';

/**
 * Rigidbody Component
 * Rigid bodies can endow game objects with physical properties, allowing them to be controlled by the physics system and subjected to forces and torques, thus achieving realistic motion effects.
 * @group Components
 */
export class Rigidbody extends ComponentBase {
    private _initResolve!: () => void;
    private _initializationPromise: Promise<void> = new Promise<void>(r => this._initResolve = r);
    private _btBodyInited: boolean = false;
    private _btRigidbody: Ammo.btRigidBody;
    private _shape: Ammo.btCollisionShape;
    private _mass: number = 0.01;
    private _margin: number = 0.02;
    private _velocity: Vector3 = new Vector3();
    private _angularVelocity: Vector3 = new Vector3();
    private _linearVelocity: Vector3 = new Vector3();
    private _gravity: Vector3 = Physics.gravity.clone();
    private _restitution: number = 0.5; // 低恢复系数以减少弹跳
    private _friction: number = 0.5; // 高摩擦系数以防止滑动
    private _rollingFriction: number;
    private _contactProcessingThreshold: number; // 接触处理阈值 值越小，精度越高
    private _damping: [number, number];
    private _ccdSettings: [number, number];
    private _activationState: ActivationState;
    private _collisionFlags: CollisionFlags; // Default static: 1, dynamic: 0
    private _userIndex: number;
    private _isSilent: boolean = false;

    private collisionEventHandler: CollisionEventHandler;
    private physicsTransformSync: PhysicsTransformSync;
    public static readonly collisionShape = CollisionShapeUtil;

    init() {
        this.physicsTransformSync = new PhysicsTransformSync(this.transform);
        this.collisionEventHandler = new CollisionEventHandler();
    }

    public start(): void {

        this.initRigidbody();

        this.physicsTransformSync.configure(this._btRigidbody, this._mass);
        this.collisionEventHandler.configure(this._btRigidbody.kB);

        this._isSilent && ContactProcessedUtil.addIgnoredPointer(this._btRigidbody.kB);

        this._btBodyInited = true;
        this._initResolve();
    }

    private initRigidbody(): void {
        // 如果未传入形状则应用碰撞组件的形状与参数构建碰撞体
        if (!this._shape) this._shape = this.createColliderComponentShape();

        let position: Vector3 = this.object3D.localPosition;

        // 处理特殊形状 高度场地形
        if (this._shape instanceof Ammo.btHeightfieldTerrainShape) {
            // averageHeight 是碰撞体对象中自定义的属性，应用该值以调整刚体的位置
            position = position.clone();
            position.y += (this._shape as any)?.averageHeight || 0;
        }

        this._shape.setMargin(this._margin);

        this._btRigidbody = RigidBodyUtil.createRigidBody(this.object3D, this._shape, this._mass, position);

        // 刚体配置信息
        this._btRigidbody.setRestitution(this._restitution);
        this._btRigidbody.setFriction(this._friction);

        if (this._rollingFriction != null) {
            this._btRigidbody.setRollingFriction(this._rollingFriction);
        }

        if (this._damping != null) {
            this._btRigidbody.setDamping(...this._damping);
        }

        if (this._userIndex != null) {
            this._btRigidbody.setUserIndex(this._userIndex);
        }

        if (this._activationState != null) {
            this._btRigidbody.setActivationState(this._activationState);
        }

        if (this._contactProcessingThreshold != null) {
            this._btRigidbody.setContactProcessingThreshold(this._contactProcessingThreshold);
        }

        if (this._collisionFlags != null) {
            this._btRigidbody.setCollisionFlags(this._collisionFlags);
        }

        if (this.group != null && this.mask != null) {
            Physics.world.addRigidBody(this._btRigidbody, this.group, this.mask);
        } else {
            Physics.world.addRigidBody(this._btRigidbody);
        }

        // The gravity setting is done after the rigid body is added to the physical world.
        if (!this._gravity.equals(Physics.gravity)) {
            this._btRigidbody.setGravity(TempPhyMath.toBtVec(this._gravity));
        }

        // Continuous Collision Detection
        if (this._ccdSettings != null) {
            this._btRigidbody.setCcdMotionThreshold(this._ccdSettings[0]);
            this._btRigidbody.setCcdSweptSphereRadius(this._ccdSettings[1]);
        }
    }

    public onUpdate(): void {
        // Check if the rigid body is active in the physics simulation.
        if (this._btRigidbody?.isActive()) {
            // Retrieve the current interpolated world transform of the rigid body from its motion state.
            // The motion state provides an interpolated transformation, which is smoother and more suitable
            this._btRigidbody.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);
            let pos = Physics.TEMP_TRANSFORM.getOrigin();
            let qua = Physics.TEMP_TRANSFORM.getRotation();

            // When physicsTransformSync is enabled, setting isUpdatingFromPhysics to true
            // prevents the 3D object's onChange event from reacting to this automatic update.
            // This is used to distinguish between automatic synchronization and manual transformations.
            this.physicsTransformSync.isUpdatingFromPhysics = true;

            // Synchronize the position and rotation of the 3D object with the rigid body's transform.
            this.transform.localPosition = Vector3.HELP_0.set(pos.x(), pos.y(), pos.z());
            this.transform.localRotQuat = Quaternion.HELP_0.set(qua.x(), qua.y(), qua.z(), qua.w());

            // Re-enable onChange event handling for manual transformations.
            this.physicsTransformSync.isUpdatingFromPhysics = false;

            Physics.checkBound(this);
        }
    }

    private createColliderComponentShape(): Ammo.btCollisionShape {
        let collider = this.object3D.getComponent(ColliderComponent);
        if (!collider) throw new Error("Rigid bodies need collision shape");

        let colliderShape = collider.shape;
        let shape: Ammo.btCollisionShape;
        if (colliderShape instanceof BoxColliderShape) {
            shape = new Ammo.btBoxShape(TempPhyMath.toBtVec(colliderShape.halfSize));
        } else if (colliderShape instanceof CapsuleColliderShape) {
            shape = new Ammo.btCapsuleShape(colliderShape.radius, colliderShape.height);
        } else if (colliderShape instanceof SphereColliderShape) {
            shape = new Ammo.btSphereShape(colliderShape.radius);
        } else {
            throw new Error("Wrong collision shape");
        }

        return shape;
    }

    /**
     * 更新刚体的位置和旋转，并同步三维对象
     * @param position 可选，默认为三维对象的位置
     * @param rotation 可选，默认为三维对象的欧拉角旋转
     * @param clearFV  可选，清除刚体的力和速度，默认为 false
     */
    public updateTransform(position?: Vector3, rotation?: Vector3 | Quaternion, clearFV?: boolean): void {
        if (!this._btRigidbody) return;
        position ||= this.transform.localPosition;
        rotation ||= this.transform.localRotation;
        RigidBodyUtil.updateTransform(this._btRigidbody, position, rotation, clearFV);
        Physics.syncGraphic(this.object3D, this._btRigidbody.getWorldTransform());
    }

    /**
     * Remove the force and velocity of the rigid body
     */
    public clearForcesAndVelocities() {
        if (this._btRigidbody) {
            RigidBodyUtil.clearForcesAndVelocities(this._btRigidbody);
        }
    }

    /**
     * Check if rigidbody inited
     */
    public get btBodyInited(): boolean {
        return this._btBodyInited;
    }

    /**
     * Return internal Ammo.btRigidBody
     */
    public get btRigidbody(): Ammo.btRigidBody {
        return this._btRigidbody;
    }
    /**
     * Asynchronously retrieves the fully initialized rigid body instance.
     */
    public async wait(): Promise<Ammo.btRigidBody> {
        await this._initializationPromise;
        return this._btRigidbody!;
    }

    /**
     * The collision shape of the rigid body.
     */
    public get shape() {
        return this._shape;
    }
    public set shape(value: Ammo.btCollisionShape) {
        this._shape = value;
        if (this._btRigidbody) {
            Ammo.destroy(this._btRigidbody.getCollisionShape());
            this._btRigidbody.setCollisionShape(value);
            // Physics.world.updateSingleAabb(this._btRigidbody);  // 更新世界中的碰撞体状态
            // 对于高度场形状，需要调整其刚体的位置以匹配三维对象
            if (value instanceof Ammo.btHeightfieldTerrainShape) {
                this._btRigidbody.getWorldTransform().getOrigin().setY((value as any).averageHeight + this.object3D.y)
            }
        }
    }

    /**
     * The collision group of the rigid body.
     */
    public group: number;

    /**
     * The collision mask of the rigid body.
     */
    public mask: number;

    /**
     * User index, which can be used as an identifier for the rigid body.
     */
    public get userIndex() {
        return this._userIndex
    }

    /**
     * Sets the user index for the rigid body.
     */
    public set userIndex(value: number) {
        this._userIndex = value;
        this._btRigidbody?.setUserIndex(value);
    }

    /**
     * Activation state of the rigid body.
     */
    public get activationState() {
        return this._activationState;
    }

    /**
     * Sets the activation state of the rigid body.
     */
    public set activationState(value: ActivationState) {
        this._activationState = value;
        this._btRigidbody?.setActivationState(value);
    }

    /**
     * Collision flags of the rigid body.
     */
    public get collisionFlags(): number {
        return this._btRigidbody?.getCollisionFlags() ?? (this.mass === 0 ? 1 : 0);
    }

    /**
     * Adds a collision flag to the rigid body.
     */
    public addCollisionFlag(value: CollisionFlags) {
        this._collisionFlags = this.collisionFlags | value;
        this._btRigidbody?.setCollisionFlags(this._collisionFlags);
    }
    /**
     * Removes a collision flag from the rigid body.
     */
    public removeCollisionFlag(value: CollisionFlags) {
        this._collisionFlags = this.collisionFlags & ~value;
        this._btRigidbody?.setCollisionFlags(this._collisionFlags);
    }

    /**
     * Check if the rigidbody affect physics system
     */
    public get isKinematic(): boolean {
        return Boolean(this._btRigidbody?.isKinematicObject());
    }
    /**
     * Set the rigid body to a kinematic object
     */
    public set isKinematic(value: boolean) {
        if (value === this.isKinematic) return;
        let flag = CollisionFlags.KINEMATIC_OBJECT;
        value ? this.addCollisionFlag(flag) : this.removeCollisionFlag(flag);
        if (!this._btRigidbody) return;
        this.enablePhysicsTransformSync = value;

        if (value) {
            // pause onUpdate
            this.enable = false
            this._btRigidbody.setActivationState(ActivationState.DISABLE_DEACTIVATION)
            // sync transfrom
            this.updateTransform();
        } else {
            // resume onUpdate
            this.enable = true
            const state = this._activationState ?? ((this._btRigidbody.isStaticObject()
                ? ActivationState.ISLAND_SLEEPING
                : ActivationState.ACTIVE_TAG));
            this._btRigidbody.forceActivationState(state);
            this._btRigidbody.activate()
        }
    }
    /**
     * Check if the rigid body is a trigger
     */
    public get isTrigger(): boolean {
        return (this.collisionFlags & CollisionFlags.NO_CONTACT_RESPONSE) !== 0;
    }
    /**
     * Set the rigid body as a trigger
     */
    public set isTrigger(value: boolean) {
        let flag = CollisionFlags.NO_CONTACT_RESPONSE;
        value ? this.addCollisionFlag(flag) : this.removeCollisionFlag(flag);
    }
    /**
     * Check if the rigid body is visible in debug mode
     */
    public get isDisableDebugVisible(): boolean {
        return (this.collisionFlags & CollisionFlags.DISABLE_VISUALIZE_OBJECT) !== 0;
    }
    /**
     * Set the rigid body to be visible in debug mode
     */
    public set isDisableDebugVisible(value: boolean) {
        let flag = CollisionFlags.DISABLE_VISUALIZE_OBJECT;
        value ? this.addCollisionFlag(flag) : this.removeCollisionFlag(flag);
    }
    /**
     * Margin of the collision shape.
     */
    public get margin() {
        return this._margin;
    }
    /**
     * Sets the margin of the collision shape.
     * @default 0.02
     */
    public set margin(value: number) {
        this._margin = value;
        this._shape?.setMargin(value)
    }

    /**
     * Damping of the rigid body. 
     * 
     * Sets the damping parameters. The first value is the linear damping, the second is the angular damping.
     * @param params - [linear damping, angular damping]
     */
    public get damping(): [number, number] {
        return this._damping;
    }

    public set damping(params: [number, number]) {
        this._damping = [params[0], params[1]];
        this._btRigidbody?.setDamping(...params);
    }
    /**
     * Contact processing threshold of the rigid body.
     */
    public get contactProcessingThreshold() {
        return this._contactProcessingThreshold
    }
    /**
     * Sets the contact processing threshold of the rigid body.
     */
    public set contactProcessingThreshold(value: number) {
        this._contactProcessingThreshold = value;
        this._btRigidbody?.setContactProcessingThreshold(value)
    }
    /**
     * Gravity vector applied to the rigid body.
     */
    public get gravity() {
        return this._gravity
    }
    /**
     * Sets the gravity vector applied to the rigid body.
     */
    public set gravity(value: Vector3) {
        this._gravity.copyFrom(value);
        this._btRigidbody?.setGravity(TempPhyMath.toBtVec(value));
    }
    /**
     * Get friction value
     */
    public get friction() {
        return this._friction;
    }
    /**
     * Set friction value. default `0.5`
     */
    public set friction(value: number) {
        this._friction = value;
        this._btRigidbody?.setFriction(value);
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
        this._btRigidbody?.setRollingFriction(value);
    }
    /**
     * Get restitution value
     */
    public get restitution(): number {
        return this._restitution;
    }
    /**
     * Set restitution value default `0.5`
     */
    public set restitution(value: number) {
        this._restitution = value;
        this._btRigidbody?.setRestitution(value);
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
        this._velocity.copyFrom(value);
        this.wait().then(rb => rb.applyForce(TempPhyMath.toBtVec(this._velocity), TempPhyMath.zeroBtVec(TempPhyMath.tmpVecB)));
    }

    /**
     * Get the angular velocity value of current object
     */
    public get angularVelocity(): Vector3 {
        if (this._btBodyInited) {
            return TempPhyMath.fromBtVec(this._btRigidbody.getAngularVelocity(), this._angularVelocity);
        }
        return this._angularVelocity;
    }
    /**
     * Set the angular velocity value of current object
     */
    public set angularVelocity(value: Vector3) {
        this._angularVelocity.copyFrom(value)
        this.wait().then(rb => rb.setAngularVelocity(TempPhyMath.toBtVec(this._angularVelocity)));
    }
    /**
     * Get the linear velocity value of current object
     */
    public get linearVelocity(): Vector3 {
        if (this._btBodyInited) {
            return TempPhyMath.fromBtVec(this._btRigidbody.getLinearVelocity(), this._linearVelocity);
        }
        return this._linearVelocity;
    }
    /**
     * Set the linear velocity value of current object
     */
    public set linearVelocity(value: Vector3) {
        this._linearVelocity.copyFrom(value)
        this.wait().then(rb => rb.setLinearVelocity(TempPhyMath.toBtVec(this._linearVelocity)));
    }
    /**
     * Get mass value
     */
    public get mass(): number {
        return this._mass;
    }
    /**
     * Set mass value. default `0.01`
     */
    public set mass(value: number) {
        const oldMass = this._mass;
        this._mass = value;
        if (this._btRigidbody && oldMass !== value) {
            if (oldMass === 0 || value === 0) {
                ContactProcessedUtil.removeIgnoredPointer(this._btRigidbody.kB); // 指针将会无效，从静默状态表中移除
                Physics.world.removeRigidBody(this._btRigidbody); // 删除刚体
                this.initRigidbody(); // 重新创建刚体
                this.collisionEventHandler.configure(this._btRigidbody.kB);
                this._isSilent && ContactProcessedUtil.addIgnoredPointer(this._btRigidbody.kB);

            } else {
                // 根据碰撞形状计算新的惯性进行更新
                const localInertia = TempPhyMath.zeroBtVec();
                this._btRigidbody.getCollisionShape().calculateLocalInertia(value, localInertia);
                this._btRigidbody.setMassProps(value, localInertia);
                this._btRigidbody.updateInertiaTensor();
                this.clearForcesAndVelocities();
            }
            this.physicsTransformSync.configure(this._btRigidbody, value);
        }
    }

    /**
     * 刚体的静默状态。
     * 如果为 true 则任何物理对象与静默状态的对象发生碰撞时都不会触发双方的碰撞回调。
     */
    public get isSilent(): boolean {
        return this._isSilent;
    }
    public set isSilent(value: boolean) {
        this._isSilent = value;
        if (value) {
            ContactProcessedUtil.addIgnoredPointer(this._btRigidbody?.kB)
        } else {
            ContactProcessedUtil.removeIgnoredPointer(this._btRigidbody?.kB)
        }
    }

    /**
     * CCD (Continuous Collision Detection)
     * 
     * Sets the CCD parameters. The first value is the motion threshold, the second is the swept sphere radius.
     * @param params - [motion threshold, swept sphere radius]
     */
    public set ccdSettings(params: [number, number]) {
        this._ccdSettings = [params[0], params[1]];
        this._btRigidbody?.setCcdMotionThreshold(params[0]);
        this._btRigidbody?.setCcdSweptSphereRadius(params[1]);
    }

    public get ccdSettings(): [number, number] {
        return this._ccdSettings;
    }

    /**
     * Enable/disable collision callbacks
     */
    public get enableCollisionEvent(): boolean {
        return this.collisionEventHandler.enableCollisionEvent;
    }
    public set enableCollisionEvent(value: boolean) {
        this.collisionEventHandler.enableCollisionEvent = value;

    }

    /**
     * Collision callbacks
     */
    public get collisionEvent() {
        return this.collisionEventHandler.collisionEvent;
    }
    public set collisionEvent(callback: (contactPoint: Ammo.btManifoldPoint, selfBody: Ammo.btRigidBody, otherBody: Ammo.btRigidBody) => void) {
        this.collisionEventHandler.collisionEvent = callback;
    }

    /**
     * Enables or disables the transform sync with physics.
     * If enabled, changes to the transform will automatically update the physics body.
     */
    public get enablePhysicsTransformSync() {
        return this.physicsTransformSync.enablePhysicsTransformSync;
    }
    public set enablePhysicsTransformSync(value: boolean) {
        if (this.isDestroyed) return;
        this.physicsTransformSync.enablePhysicsTransformSync = value;
    }

    public destroy(force?: boolean): void {
        if (this._btRigidbody) {
            ContactProcessedUtil.removeIgnoredPointer(this._btRigidbody.kB);
            RigidBodyUtil.destroyRigidBody(this._btRigidbody)
        }
        this._btRigidbody = null;
        this._btBodyInited = false;
        this._shape = null;

        this.physicsTransformSync.destroy()
        this.collisionEventHandler.destroy()
        super.destroy(force);
    }
}
