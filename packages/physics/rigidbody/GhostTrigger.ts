import { ComponentBase, Vector3 } from '@orillusion/core';
import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { CollisionEventHandler } from './RigidbodyExpansion'
import { CollisionFlags } from './RigidbodyEnum';

/**
 * The GhostTrigger Component represents a non-physical trigger in the physics world.
 * It uses a ghost object to detect overlapping collisions without producing physical responses.
 */
export class GhostTrigger extends ComponentBase {
    private _initResolve!: () => void;
    private _initializationPromise: Promise<void> = new Promise<void>(r => this._initResolve = r);
    private _ghostObject: Ammo.btPairCachingGhostObject;
    private _userIndex: number;
    private _shape: Ammo.btCollisionShape;
    private collisionEventHandler: CollisionEventHandler = new CollisionEventHandler();

    public get shape() {
        return this._shape
    }
    public set shape(value: Ammo.btCollisionShape) {
        this._shape = value;
        if (this._ghostObject) {
            Ammo.destroy(this._ghostObject.getCollisionShape());
            this._ghostObject.setCollisionShape(value);
            // Physics.world.updateSingleAabb(this._ghostObject);  // 更新世界中的碰撞体状态
        }
    }

    public get userIndex() {
        return this._userIndex;
    }

    public set userIndex(value: number) {
        this._userIndex = value;
        this._ghostObject?.setUserIndex(value)
    }

    private _collisionFlags: CollisionFlags = CollisionFlags.NO_CONTACT_RESPONSE;

    /**
     * 获取碰撞标志
     */
    public get collisionFlags(): number {
        return this._ghostObject?.getCollisionFlags() ?? this._collisionFlags;
    }

    /**
     * 添加单个碰撞标志
     */
    public addCollisionFlag(value: CollisionFlags) {
        this._collisionFlags = this.collisionFlags | value;
        this._ghostObject?.setCollisionFlags(this._collisionFlags);
    }
    /**
     * 删除单个碰撞标志
     */
    public removeCollisionFlag(value: CollisionFlags) {
        this._collisionFlags = this.collisionFlags & ~value;
        this._ghostObject?.setCollisionFlags(this._collisionFlags);
    }

    async start() {

        if (!this._shape) throw new Error('Ghost object need collision shape')

        let position = this.object3D.localPosition;
        let rotation = this.object3D.localRotation;

        this._ghostObject = GhostTrigger.createAndAddGhostObject(this._shape, position, rotation, this._collisionFlags, this._userIndex);


        // 变换更新，确保三维对象更新变换时同步到幽灵对象
        this.transform.onPositionChange = (oldValue: Vector3, newValue: Vector3) => {
            newValue ||= this.transform.localPosition;
            this._ghostObject.getWorldTransform().setOrigin(TempPhyMath.toBtVec(newValue))
        };
        this.transform.onRotationChange = (oldValue: Vector3, newValue: Vector3) => {
            newValue ||= this.transform.localRotation;
            this._ghostObject.getWorldTransform().setRotation(TempPhyMath.eulerToBtQua(newValue))
        };
        this.transform.onScaleChange = (oldValue: Vector3, newValue: Vector3) => {
            newValue ||= this.transform.localScale;
            this._shape.setLocalScaling(TempPhyMath.toBtVec(newValue))
        };

        this._initResolve();

        this.collisionEventHandler.configure(Ammo.getPointer(this._ghostObject));

    }

    /**
     * 创建幽灵对象并添加到物理世界。
     * @param shape - 碰撞形状。
     * @param position - 幽灵对象的位置。
     * @param rotation - 幽灵对象的旋转。
     * @param collisionFlags - 可选参数，碰撞标志，默认值为 4 `NO_CONTACT_RESPONSE` 表示对象不参与碰撞响应，但仍会触发碰撞事件。
     * @param userIndex - 可选参数，用户索引，可作为物理对象标识。
     * @returns 新创建的 Ammo.btPairCachingGhostObject 对象。
     */
    public static createAndAddGhostObject(shape: Ammo.btCollisionShape, position: Vector3, rotation: Vector3, collisionFlags?: number, userIndex?: number) {
        let ghostObject = new Ammo.btPairCachingGhostObject();
        let transform = Physics.TEMP_TRANSFORM;
        transform.setIdentity();
        transform.setOrigin(TempPhyMath.toBtVec(position));
        transform.setRotation(TempPhyMath.eulerToBtQua(rotation));
        ghostObject.setWorldTransform(transform);

        // 设置形状和属性
        ghostObject.setCollisionShape(shape);
        collisionFlags ??= CollisionFlags.NO_CONTACT_RESPONSE;
        ghostObject.setCollisionFlags(ghostObject.getCollisionFlags() | collisionFlags);

        if (userIndex != null) {
            ghostObject.setUserIndex(userIndex);
        }

        // 将 Ghost Object 添加到物理世界
        Physics.world.addCollisionObject(ghostObject);

        return ghostObject;
    }

    /**
     * 获取幽灵对象
     */
    public get ghostObject() {
        return this._ghostObject;
    }

    /**
     * 异步获取完成初始化的幽灵对象
     */
    public async wait() {
        await this._initializationPromise;
        return this._ghostObject!;
    }

    /**
     * 启用/禁用碰撞回调
     */
    public get enableCollisionEvent(): boolean {
        return this.collisionEventHandler.enableCollisionEvent;
    }
    public set enableCollisionEvent(value: boolean) {
        this.collisionEventHandler.enableCollisionEvent = value;

    }

    /**
     * 碰撞事件回调
     */
    public get collisionEvent() {
        return this.collisionEventHandler.collisionEvent;
    }
    public set collisionEvent(callback: (contactPoint: Ammo.btManifoldPoint, selfBody: Ammo.btRigidBody, otherBody: Ammo.btRigidBody) => void) {
        this.collisionEventHandler.collisionEvent = callback;
    }

    public destroy(force?: boolean): void {
        if (this._ghostObject) {
            Physics.world.removeCollisionObject(this._ghostObject);
            Ammo.destroy(this._ghostObject.getCollisionShape());
            Ammo.destroy(this._ghostObject);
            this._ghostObject = null;
        }

        this._shape = null;
        this.transform.onPositionChange = null;
        this.transform.onRotationChange = null;
        this.transform.onScaleChange = null;
        this.collisionEventHandler.destroy();

        super.destroy(force);
    }
}
