import Ammo from "@orillusion/ammo/ammo";
import { CEvent, Color, ComponentBase, Object3D, Time, Vector3, View3D } from "@orillusion/core";
import { RigidBody3D } from "./RigidBody3D";
import { PhysicDebugDraw } from "../debug/PhysicDebugDraw";
import { BtVector3 } from "../PhysicTransformUtils";

export class PhysicsWorld extends ComponentBase {

    public collisionShapes: Ammo.btCollisionShape[];
    public broadphase: Ammo.btBroadphaseInterface;
    public solver: Ammo.btSequentialImpulseConstraintSolver;
    public softBodySolver: Ammo.btSoftBodySolver;

    public dynamicsWorld: Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld;
    public groundShape: Ammo.btBoxShape;
    public collisionConfiguration: Ammo.btDefaultCollisionConfiguration;
    public dispatcher: Ammo.btCollisionDispatcher;
    public items: Map<number, Object3D>;
    public hitMap: Map<number, number>;
    private _countID: number = 0;

    private _debugDraw: PhysicDebugDraw;
    public init(param?: any): void {
        this.items = new Map<number, Object3D>();
        this.hitMap = new Map<number, number>();
        this.collisionShapes = [];
    }

    public async createWorld() {
        this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration);
        this.dynamicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));

        let { PhysicDebugDraw } = await import("../debug/PhysicDebugDraw");
        this._debugDraw = new PhysicDebugDraw(this.transform.view3D);

        this.dynamicsWorld.setDebugDrawer(this._debugDraw);
        this.dynamicsWorld.debugDrawWorld();

        console.log(`PhysicWorld is created!`);
    }

    public async creatSoftWorld() {
        this.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.softBodySolver = new Ammo.btDefaultSoftBodySolver();
        this.dynamicsWorld = new Ammo.btSoftRigidDynamicsWorld(this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration, this.softBodySolver);
        this.dynamicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));

        let { PhysicDebugDraw } = await import("../debug/PhysicDebugDraw");
        this._debugDraw = new PhysicDebugDraw(this.transform.view3D);
        this.dynamicsWorld.setDebugDrawer(this._debugDraw);
        // this.dynamicsWorld.debugDrawWorld();
        console.log(`SoftWorld is created!`);
    }

    getSoftWorldInfo(): Ammo.btSoftBodyWorldInfo {
        return (this.dynamicsWorld as Ammo.btSoftRigidDynamicsWorld).getWorldInfo();
    }

    getObject(userID: number) {
        return this.items.get(userID);
    }

    public onAddChild(child: Object3D) {
        let rigidBody = child.getComponent(RigidBody3D);
        if (rigidBody) {
            rigidBody.btBody.setUserIndex(this._countID++);
            this.items.set(rigidBody.btBody.getUserIndex(), rigidBody.object3D);
            if (rigidBody.btBody instanceof Ammo.btRigidBody) {
                this.addRigidBody(rigidBody.btBody);
            }

            if (rigidBody.useCollision) {
                this.items.set(rigidBody.btBody.getUserIndex(), child);
                // this.addCollisionObject(rigidBody.btBody);
                // this.dynamicsWorld.addCollisionObject(rigidBody.btBody, rigidBody.collisionFilterGroup, rigidBody.collisionFilterMask);
            }

            console.log(`add one rigidBody!`);
        }
    }

    public onRemoveChild(child: Object3D) {
        console.log(child.name);
        let rigidBody = child.getComponent(RigidBody3D);
        if (rigidBody) {
            let rigidBody = child.getOrAddComponent(RigidBody3D);
            this.items.delete(rigidBody.btBody.getUserIndex());

            if (rigidBody.btBody instanceof Ammo.btRigidBody) {
                this.removeRigidBody(rigidBody.btBody);
            }

            if (rigidBody.useCollision) {
                // this.removeCollisionObject(rigidBody.btBody);
            }
            // console.log(`remove on rigidBody!`, child.name);
        }
    }

    public addRigidBody(rigidBody: Ammo.btRigidBody) {
        this.dynamicsWorld.addRigidBody(rigidBody);
    }

    public removeRigidBody(rigidBody: Ammo.btRigidBody) {
        this.dynamicsWorld.removeRigidBody(rigidBody);
    }

    public addCollisionObject(rigidBody: Ammo.btRigidBody) {
        // this.dynamicsWorld.addCollisionObject(rigidBody);
    }

    public removeCollisionObject(rigidBody: Ammo.btRigidBody) {
        // this.dynamicsWorld.removeCollisionObject(rigidBody);
    }

    public addSoftBody(softBody: Ammo.btSoftBody, collisionFilterGroup: number = 1, collisionFilterMask: number = -1) {
        (this.dynamicsWorld as Ammo.btSoftRigidDynamicsWorld).addSoftBody(softBody, 1, -1);
    }

    public removeSoftBody(softBody: Ammo.btSoftBody) {
        (this.dynamicsWorld as Ammo.btSoftRigidDynamicsWorld).removeSoftBody(softBody);
    }


    public addConstraint(constraint: Ammo.btTypedConstraint, disableCollisionsBetweenLinkedBodies = false) {
        this.dynamicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies);
    }

    public removeConstraint(constraint: Ammo.btTypedConstraint) {
        this.dynamicsWorld.removeConstraint(constraint);
    }

    public onUpdate(view?: View3D) {
        if (this._debugDraw)
            this._debugDraw.draw();
        this.dynamicsWorld.stepSimulation(Time.delta, 2);

        let count = this.dynamicsWorld.getDispatcher().getNumManifolds();
        for (let i = 0; i < count; i++) {
            const element = this.dispatcher.getManifoldByIndexInternal(i);
            const contacts = element.getNumContacts();
            const body0 = element.getBody0();
            const body1 = element.getBody1();

            const body0_Index = body0.getUserIndex();
            const body1_Index = body1.getUserIndex();
            if (body0_Index != body1_Index) {

                let a = this.items.get(body0_Index);
                let b = this.items.get(body1_Index);
                if (a && b) {
                    a.dispatchEvent(new CEvent("hit", b));
                    b.dispatchEvent(new CEvent("hit", a));
                }
            }
        }
    }



    public rayCast(origin: Vector3, dest: Vector3, intersectionPoint?: Vector3, intersectionNormal?: Vector3) {
        let tempVRayOrigin = BtVector3(origin);
        let tempVRayDest = BtVector3(dest);
        // Reset closestRayResultCallback to reuse it
        var closestRayResultCallback = new Ammo.ClosestRayResultCallback(tempVRayOrigin, tempVRayDest);
        var rayCallBack = Ammo.castObject(closestRayResultCallback, Ammo.RayResultCallback);
        rayCallBack.set_m_closestHitFraction(1);
        rayCallBack.set_m_collisionObject(null);

        // Set closestRayResultCallback origin and dest
        closestRayResultCallback.get_m_rayFromWorld().setValue(origin.x, origin.y, origin.z);
        closestRayResultCallback.get_m_rayToWorld().setValue(dest.x, dest.y, dest.z);

        // Perform ray test
        this.dynamicsWorld.rayTest(tempVRayOrigin, tempVRayDest, closestRayResultCallback);

        if (closestRayResultCallback.hasHit()) {

            let userIndex = closestRayResultCallback.get_m_collisionObject().getUserIndex();

            if (intersectionPoint) {
                var point = closestRayResultCallback.get_m_hitPointWorld();
                intersectionPoint.set(point.x(), point.y(), point.z());
            }

            if (intersectionNormal) {
                var normal = closestRayResultCallback.get_m_hitNormalWorld();
                intersectionNormal.set(normal.x(), normal.y(), normal.z());
            }
            return userIndex;
        }
        else {
            return -1;
        }
    }

    private onHit() {

    }

}