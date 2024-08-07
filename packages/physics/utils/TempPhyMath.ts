import { Vector3, Quaternion, DEGREES_TO_RADIANS } from '@orillusion/core';
import { Ammo } from '../Physics';

/**
 * Temporary Physics Math Utility
 * 
 * 提供临时的 Ammo btVector3 和 btQuaternion 实例，并支持与引擎数据相互转换
 */
export class TempPhyMath {
    public static readonly tmpVecA: Ammo.btVector3;
    public static readonly tmpVecB: Ammo.btVector3;
    public static readonly tmpVecC: Ammo.btVector3;
    public static readonly tmpVecD: Ammo.btVector3;
    public static readonly tmpQuaA: Ammo.btQuaternion;
    public static readonly tmpQuaB: Ammo.btQuaternion;

    /**
     * 初始化 Ammo 后创建预定义的 btVector3 和 btQuaternion 实例，以便复用
     */
    public static init() {
        (this as any).tmpVecA = new Ammo.btVector3(0, 0, 0);
        (this as any).tmpVecB = new Ammo.btVector3(0, 0, 0);
        (this as any).tmpVecC = new Ammo.btVector3(0, 0, 0);
        (this as any).tmpVecD = new Ammo.btVector3(0, 0, 0);
        (this as any).tmpQuaA = new Ammo.btQuaternion(0, 0, 0, 1);
        (this as any).tmpQuaB = new Ammo.btQuaternion(0, 0, 0, 1);
    }

    /**
     * Quaternion to Ammo.btQuaternion
     */
    public static toBtQua(qua: Quaternion, btQua?: Ammo.btQuaternion): Ammo.btQuaternion {
        btQua ||= this.tmpQuaA;
        btQua.setValue(qua.x, qua.y, qua.z, qua.w);
        return btQua;
    }

    /**
     * Vector3 to Ammo.btVector3 
     */
    public static toBtVec(vec: Vector3, btVec?: Ammo.btVector3): Ammo.btVector3 {
        btVec ||= this.tmpVecA;
        btVec.setValue(vec.x, vec.y, vec.z);
        return btVec;
    }

    /**
     * Set Ammo.btVector3 using x, y, z
     */
    public static setBtVec(x: number, y: number, z: number, btVec?: Ammo.btVector3): Ammo.btVector3 {
        btVec ||= this.tmpVecA;
        btVec.setValue(x, y, z);
        return btVec;
    }

    /**
     * Set Ammo.btQuaternion using x, y, z, w
     */
    public static setBtQua(x: number, y: number, z: number, w: number, btQua?: Ammo.btQuaternion): Ammo.btQuaternion {
        btQua ||= this.tmpQuaA;
        btQua.setValue(x, y, z, w);
        return btQua;
    }

    /**
     * Ammo.btVector3 to Vector3
     */
    public static fromBtVec(btVec: Ammo.btVector3, vec?: Vector3): Vector3 {
        vec ||= new Vector3();
        vec.set(btVec.x(), btVec.y(), btVec.z());
        return vec;
    }

    /**
     * Ammo.btQuaternion to Quaternion
     */
    public static fromBtQua(btQua: Ammo.btQuaternion, qua?: Quaternion): Quaternion {
        qua ||= new Quaternion();
        qua.set(btQua.x(), btQua.y(), btQua.z(), btQua.w());
        return qua;
    }

    /**
     * Euler Vector3 to Ammo.Quaternion
     */
    public static eulerToBtQua(vec: Vector3, qua?: Ammo.btQuaternion): Ammo.btQuaternion {
        qua ||= this.tmpQuaA;
        qua.setEulerZYX(vec.z * DEGREES_TO_RADIANS, vec.y * DEGREES_TO_RADIANS, vec.x * DEGREES_TO_RADIANS);
        return qua;
    }

    /**
     * Sets the given Ammo.btVector3 to (0, 0, 0)
     */
    public static zeroBtVec(btVec?: Ammo.btVector3): Ammo.btVector3 {
        return this.setBtVec(0, 0, 0, btVec);
    }

    /**
     * Sets the given Ammo.btQuaternion to (0, 0, 0, 1)
     */
    public static resetBtQua(btQua?: Ammo.btQuaternion): Ammo.btQuaternion {
        return this.setBtQua(0, 0, 0, 1, btQua);
    }
}
