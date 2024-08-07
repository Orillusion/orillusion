import Ammo from '@orillusion/ammo';
import { Vector3, Time, BoundingBox, Object3D, Quaternion } from '@orillusion/core';
import { ContactProcessedUtil } from './utils/ContactProcessedUtil';
import { RigidBodyUtil } from './utils/RigidBodyUtil';
import { TempPhyMath } from './utils/TempPhyMath';
import { Rigidbody } from './rigidbody/Rigidbody';
import { PhysicsDebugDrawer } from './visualDebug/PhysicsDebugDrawer';
import { DebugDrawerOptions } from './visualDebug/DebugDrawModeEnum';

class _Physics {
    private _world: Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld;
    private _isInited: boolean = false;
    private _isStop: boolean = false;
    private _gravity: Vector3 = new Vector3(0, -9.8, 0);
    private _worldInfo: Ammo.btSoftBodyWorldInfo | null = null;
    private _debugDrawer: PhysicsDebugDrawer;
    private _physicBound: BoundingBox;
    private _destroyObjectBeyondBounds: boolean;

    public readonly contactProcessedUtil = ContactProcessedUtil;
    public readonly rigidBodyUtil = RigidBodyUtil;

    public maxSubSteps: number = 10;
    public fixedTimeStep: number = 1 / 60;

    /**
     * 物理调试绘制器
     */
    public get debugDrawer() {
        if (!this._debugDrawer) {
            console.warn('To enable debugging, configure with: Physics.initDebugDrawer');
        }
        return this._debugDrawer;
    }

    public TEMP_TRANSFORM: Ammo.btTransform; // Temp cache, save results from body.getWorldTransform()

    /**
     * 初始化物理引擎和相关配置。
     *
     * @param options - 初始化选项参数对象。
     * @param options.useSoftBody - 是否启用软体模拟，目前仅支持布料软体类型。
     * @param options.physicBound - 物理边界，默认范围：2000 2000 2000，超出边界时将会销毁该刚体。
     * @param options.destroyObjectBeyondBounds - 是否在超出边界时销毁3D对象。默认 `false` 仅销毁刚体。
     */
    public async init(options: { useSoftBody?: boolean, physicBound?: Vector3, destroyObjectBeyondBounds?: boolean } = {}) {
        await Ammo.bind(window)(Ammo);

        TempPhyMath.init();

        this.TEMP_TRANSFORM = new Ammo.btTransform();
        this.initWorld(options.useSoftBody);

        this._isInited = true;
        this._destroyObjectBeyondBounds = options.destroyObjectBeyondBounds;
        this._physicBound = new BoundingBox(new Vector3(), options.physicBound || new Vector3(2000, 2000, 2000));
    }

    /**
     * 初始化物理调试绘制器
     *
     * @param {Graphic3D} graphic3D - Type: `Graphic3D` A graphic object used to draw lines. 
     * @param {DebugDrawerOptions} [options] - 调试绘制选项，用于配置物理调试绘制器。 {@link DebugDrawerOptions}
     */
    public initDebugDrawer(graphic3D: Object3D, options?: DebugDrawerOptions) {
        this._debugDrawer = new PhysicsDebugDrawer(this.world, graphic3D, options);
    }

    private initWorld(useSoftBody: boolean) {
        const collisionConfiguration = useSoftBody
            ? new Ammo.btSoftBodyRigidBodyCollisionConfiguration()
            : new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const broadphase = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();

        if (useSoftBody) {
            const softBodySolver = new Ammo.btDefaultSoftBodySolver();
            this._world = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
            this._worldInfo = (this.world as Ammo.btSoftRigidDynamicsWorld).getWorldInfo();
            this._worldInfo.set_m_broadphase(broadphase);
            this._worldInfo.set_m_dispatcher(dispatcher);
            this._worldInfo.set_m_gravity(TempPhyMath.toBtVec(this._gravity));
            this._worldInfo.set_air_density(1.2);
            this._worldInfo.set_water_density(0);
            this._worldInfo.set_water_offset(0);
            this._worldInfo.set_water_normal(TempPhyMath.setBtVec(0, 0, 0));
            this._worldInfo.set_m_maxDisplacement(0.5);
        } else {
            this._world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
        }

        this._world.setGravity(TempPhyMath.toBtVec(this._gravity));
    }

    /**
     * 物理模拟更新
     * @param timeStep - 时间步长
     * @default Time.delta * 0.001
     */
    public update(timeStep: number = Time.delta * 0.001) {
        if (!this._isInited || this.isStop) return;
        this.world.stepSimulation(timeStep, this.maxSubSteps, this.fixedTimeStep);
        // this.world.stepSimulation(Time.delta, 1, this.fixedTimeStep);

        this._debugDrawer?.update();
    }

    public get world(): Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld {
        return this._world;
    }

    public get isInited(): boolean {
        return this._isInited;
    }

    public set isStop(value: boolean) {
        this._isStop = value;
    }

    public get isStop() {
        return this._isStop;
    }

    public set gravity(value: Vector3) {
        this._gravity.copyFrom(value);
        this._world?.setGravity(TempPhyMath.toBtVec(value)); // 设置刚体物理重力
        this._worldInfo?.set_m_gravity(TempPhyMath.toBtVec(value)); // 设置软体物理重力
    }

    public get gravity(): Vector3 {
        return this._gravity;
    }

    public get worldInfo(): Ammo.btSoftBodyWorldInfo {
        return this._worldInfo;
    }

    public get isSoftBodyWord() {
        return this._world instanceof Ammo.btSoftRigidDynamicsWorld;
    }

    public checkBound(body: Rigidbody) {
        if (body) {
            let wp = body.transform.worldPosition;
            let inside = this._physicBound.containsPoint(wp);
            if (!inside) {
                if (this._destroyObjectBeyondBounds) {
                    body.object3D.destroy();
                } else {
                    body.btRigidbody.activate(false);
                    body.destroy();
                }
            }
        }
    }

    /**
     * 将物理对象的位置和旋转同步至三维对象
     * @param object3D - 三维对象
     * @param tm - 物理对象变换
     */
    public syncGraphic(object3D: Object3D, tm: Ammo.btTransform): void {
        object3D.localPosition = TempPhyMath.fromBtVec(tm.getOrigin(), Vector3.HELP_0);
        object3D.localQuaternion = TempPhyMath.fromBtQua(tm.getRotation(), Quaternion.HELP_0);
    }
}

/**
 * Only init one physics instance
 * ```ts
 * await Physics.init();  
 * ```
 * @group Plugin
 */
/**
 * @internal
 */
export let Physics = new _Physics();
export { Ammo };
