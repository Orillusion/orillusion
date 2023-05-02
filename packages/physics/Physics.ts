import Ammo from '@orillusion/ammo';
import {BoundingBox, Vector3, Time} from '@orillusion/core'
import { Rigidbody } from './Rigidbody';

/**
 * Physics Engine
 * @group Plugin
 * @notExported
 */
class _Physics {
    private _world: Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld;
    private _isStop: boolean = false;
    private _gravity: Vector3 = new Vector3(0, -9.8, 0);
    private _gravityEnabled: boolean = true;
    private _maxSubSteps: number = 10;
    private _fixedTimeStep: number = 1 / 60;
    private _maxVelocity: number = 1000;
    private _maxAngularVelocity: number = 1000;
    private _maxForce: number = 1000;
    private _maxTorque: number = 1000;
    private _maxLinearCorrection: number = 0.2;
    private _maxAngularCorrection: number = 0.2;
    private _maxTranslation: number = 1000;
    private _maxRotation: number = 1000;
    private _maxSolverIterations: number = 20;
    private _enableFriction: boolean = true;
    private _enableCollisionEvents: boolean = true;
    private _enableContinuous: boolean = true;
    private _enableCCD: boolean = true;
    private _enableWarmStarting: boolean = true;
    private _enableTOI: boolean = true;
    private _enableSAT: boolean = true;
    private _enableSATNormal: boolean = true;

    private physicBound: BoundingBox;
    private _isInited: boolean = false;

    public TEMP_TRANSFORM: Ammo.btTransform; //Temp cache, save results from body.getWorldTransform()

    constructor() { }

    /**
     * Init Physics Engine
     */
    public async init() {
        await Ammo(Ammo);
        this.TEMP_TRANSFORM = new Ammo.btTransform();
        var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        var overlappingPairCache = new Ammo.btDbvtBroadphase();
        var solver = new Ammo.btSequentialImpulseConstraintSolver();
        this._world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        this._world.setGravity(new Ammo.btVector3(this._gravity.x, this._gravity.y, this._gravity.z));
        this._isInited = true;

        this.physicBound = new BoundingBox(new Vector3(), new Vector3(2000, 2000, 2000));
    }

    public get maxSubSteps(): number {
        return this._maxSubSteps;
    }
    public set maxSubSteps(value: number) {
        this._maxSubSteps = value;
    }

    public get fixedTimeStep(): number {
        return this._fixedTimeStep;
    }
    public set fixedTimeStep(value: number) {
        this._fixedTimeStep = value;
    }

    public get isStop(): boolean {
        return this._isStop;
    }

    public set isStop(value: boolean) {
        this._isStop = value;
    }

    public set gravity(gravity: Vector3) {
        this._gravity = gravity;
    }

    public get gravity(): Vector3 {
        return this._gravity;
    }

    public get world(): Ammo.btDiscreteDynamicsWorld {
        return this._world;
    }

    private initByDefault() {
        var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        var overlappingPairCache = new Ammo.btDbvtBroadphase();
        var solver = new Ammo.btSequentialImpulseConstraintSolver();
        this._world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        this._world.setGravity(new Ammo.btVector3(this._gravity.x, this._gravity.y, this._gravity.z));
        this._isInited = true;
        this.physicBound = new BoundingBox(new Vector3(), new Vector3(2000, 2000, 2000));
    }

    private initBySoft() {
        var collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
        var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        var broadphase = new Ammo.btDbvtBroadphase();
        var solver = new Ammo.btSequentialImpulseConstraintSolver();
        var softBodySolver = new Ammo.btDefaultSoftBodySolver();
        this._world = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
        this._world.setGravity(new Ammo.btVector3(this._gravity.x, this._gravity.y, this._gravity.z));
        this._isInited = true;
        this.physicBound = new BoundingBox(new Vector3(), new Vector3(2000, 2000, 2000));
    }

    public get isInited(): boolean {
        return this._isInited;
    }

    private __updateWithDelta(time:number ) {
        if(!this._isInited) return;
        if(this.isStop) return;
        this._world.stepSimulation(time);
    }

    private __updateWithFixedTimeStep(time:number, maxSubSteps:number, fixedTimeStep:number ) {
        if(!this._isInited) return;
        if(this.isStop) return;
        this.world.stepSimulation(time, maxSubSteps, fixedTimeStep);
    }


    public update() {
        if (!this._isInited) {
            return;
        }
        if (this.isStop) return;

        // let fix = Math.max(this._fixedTimeStep, Time.detail);

        this.__updateWithFixedTimeStep(Time.delta, 1, this._fixedTimeStep);
        // this._world.stepSimulation(Time.delta, 1, this._fixedTimeStep);
    }

    public addRigidbody(rigidBody: Rigidbody) {
        this._world.addRigidBody(rigidBody.btRigidbody);
    }

    public removeRigidbody(rigidBody: Rigidbody) {
        this._world.removeRigidBody(rigidBody.btRigidbody);
    }

    checkBound(body: Rigidbody) {
        if (body) {
            let wp = body.transform.worldPosition;
            let inside = this.physicBound.containsPoint(wp);
            if (!inside) {
                body.btRigidbody.activate(false);
                // this._world.removeRigidBody(body.btRigidbody);
                body.destroy();
            }
        }
    }
}

/**
 * Only init one physics instance
 * ```ts
 * await Physics.init();  
 * ```
 * @group Plugin
 */
export let Physics = new _Physics();
export {Ammo}
