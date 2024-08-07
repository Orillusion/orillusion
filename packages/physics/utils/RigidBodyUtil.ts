import { Vector3, Quaternion, Object3D } from '@orillusion/core';
import { Physics, Ammo } from '../Physics';
import { TempPhyMath } from './TempPhyMath';

/**
 * 提供一系列AMMO刚体相关的方法
 */
export class RigidBodyUtil {
    /**
     * 创建 Ammo 刚体。
     * @param object3D - 三维对象。
     * @param shape - 碰撞形状。
     * @param mass - 碰撞体的质量。
     * @param position - 可选参数，刚体的位置，默认使用三维对象的 `localPosition`
     * @param rotation - 可选参数，刚体的旋转，默认使用三维对象的 `localRotation`
     * @returns 新创建的 Ammo.btRigidBody 对象。
     */
    public static createRigidBody(object3D: Object3D, shape: Ammo.btCollisionShape, mass: number, position?: Vector3, rotation?: Vector3 | Quaternion): Ammo.btRigidBody {
        position ||= object3D.localPosition;
        rotation ||= object3D.localRotation;

        const transform = Physics.TEMP_TRANSFORM;
        transform.setIdentity();
        transform.setOrigin(TempPhyMath.toBtVec(position));
        let rotQuat = (rotation instanceof Vector3) ? TempPhyMath.eulerToBtQua(rotation) : TempPhyMath.toBtQua(rotation);
        transform.setRotation(rotQuat);

        const motionState = new Ammo.btDefaultMotionState(transform);
        const localInertia = TempPhyMath.zeroBtVec();
        shape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const bodyRb = new Ammo.btRigidBody(rbInfo);

        return bodyRb;
    }

    /**  
     * 更新刚体的位置和旋转。  
     * 此函数将新的位置和旋转应用到刚体上。  
     * @param bodyRb - 刚体对象。  
     * @param position - 刚体的新位置，以 Vector3 形式表示。  
     * @param rotation - 刚体的新旋转，可选，可以是 Vector3 形式表示的欧拉角（将自动转换为四元数），默认为四元数零值。
     * @param clearFV - 清除力和速度，可选，默认为 false 。 
     */
    public static updateTransform(bodyRb: Ammo.btRigidBody, position: Vector3, rotation: Vector3 | Quaternion, clearFV?: boolean) {
        rotation ||= Quaternion._zero;

        const transform = bodyRb.getWorldTransform();
        transform.setOrigin(TempPhyMath.toBtVec(position));
        let rotQuat = (rotation instanceof Vector3) ? TempPhyMath.eulerToBtQua(rotation) : TempPhyMath.toBtQua(rotation);
        transform.setRotation(rotQuat);

        bodyRb.setWorldTransform(transform);
        bodyRb.getMotionState().setWorldTransform(transform);
        bodyRb.activate();

        if (clearFV) {
            this.clearForcesAndVelocities(bodyRb);
        }
    }

    /**
     * 更新刚体位置
     * @param bodyRb
     * @param value
     */
    public static updatePosition(bodyRb: Ammo.btRigidBody, value: Vector3) {
        if (bodyRb.isKinematicObject()) {
            bodyRb.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);
            Physics.TEMP_TRANSFORM.setOrigin(TempPhyMath.toBtVec(value));
            bodyRb.getMotionState().setWorldTransform(Physics.TEMP_TRANSFORM);
        } else {
            bodyRb.getWorldTransform().getOrigin().setValue(value.x, value.y, value.z);
            bodyRb.activate();
        }
    }

    /**
     * 更新刚体旋转
     * @param bodyRb
     * @param value
     */
    public static updateRotation(bodyRb: Ammo.btRigidBody, value: Vector3) {
        if (bodyRb.isKinematicObject()) {
            bodyRb.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);
            Physics.TEMP_TRANSFORM.setRotation(TempPhyMath.eulerToBtQua(value));
            bodyRb.getMotionState().setWorldTransform(Physics.TEMP_TRANSFORM);
        } else {
            bodyRb.getWorldTransform().setRotation(TempPhyMath.eulerToBtQua(value));
            bodyRb.activate();
        }
    }

    /**
     * 更新刚体缩放
     * @param bodyRb
     * @param value
     * @param mass
     */
    public static updateScale(bodyRb: Ammo.btRigidBody, value: Vector3, mass: number) {
        const shape = bodyRb.getCollisionShape();
        shape.setLocalScaling(TempPhyMath.toBtVec(value));
        if (mass > 0) {
            const localInertia = TempPhyMath.zeroBtVec();
            shape.calculateLocalInertia(mass, localInertia);
            bodyRb.setMassProps(mass, localInertia);
            bodyRb.activate();
        }
    }

    /**
     * 清除力和速度
     * @param bodyRb 
     */
    public static clearForcesAndVelocities(bodyRb: Ammo.btRigidBody) {
        bodyRb.clearForces();
        bodyRb.setLinearVelocity(TempPhyMath.zeroBtVec());
        bodyRb.setAngularVelocity(TempPhyMath.zeroBtVec());
    }

    /**
     * 激活物理世界中的全部碰撞对
     */
    public static activateCollisionBodies(): void {
        const dispatcher = Physics.world.getDispatcher();
        const numManifolds = dispatcher.getNumManifolds();

        for (let i = 0; i < numManifolds; i++) {
            const manifold = dispatcher.getManifoldByIndexInternal(i);

            const body0 = Ammo.castObject(manifold.getBody0(), Ammo.btRigidBody);
            const body1 = Ammo.castObject(manifold.getBody1(), Ammo.btRigidBody);

            if (body0 && body0.getMotionState()) {
                body0.activate();
            }

            if (body1 && body1.getMotionState()) {
                body1.activate();
            }
        }
    }

    /**
     * 销毁刚体及其状态和形状
     * @param bodyRb
     */
    public static destroyRigidBody(bodyRb: Ammo.btRigidBody): void {
        if (!bodyRb) return console.warn('There is no rigid body');

        Physics.world.removeRigidBody(bodyRb);
        Ammo.destroy(bodyRb.getCollisionShape());
        Ammo.destroy(bodyRb.getMotionState());
        Ammo.destroy(bodyRb);
    }

    /**
     * 销毁约束
     * @param constraint
     */
    public static destroyConstraint(constraint: Ammo.btTypedConstraint) {
        if (constraint) {
            Physics.world.removeConstraint(constraint);
            Ammo.destroy(constraint);
            constraint = null;
        }
    }
}
