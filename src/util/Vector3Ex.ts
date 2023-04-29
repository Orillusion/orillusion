import { Vector3 } from '../math/Vector3';

/**
 * extra function of vector3
 * @group Util
 */
export class Vector3Ex {
    /**
     * vector3 add
     * @param v1
     * @param v2
     * @param target
     * @returns
     */
    public static add(v1: Vector3, v2: Vector3, target?: Vector3): Vector3 {
        if (!target) {
            target = new Vector3();
        }
        target.x = v1.x + v2.x;
        target.y = v1.y + v2.y;
        target.z = v1.z + v2.z;
        return target;
    }

    /**
     * vector3 sub
     * @param v1
     * @param v2
     * @param target
     * @returns
     */
    public static sub(v1: Vector3, v2: Vector3, target?: Vector3): Vector3 {
        if (!target) {
            target = new Vector3();
        }
        target.x = v1.x - v2.x;
        target.y = v1.y - v2.y;
        target.z = v1.z - v2.z;
        return target;
    }

    /**
     * vector3 mul
     * @param v1
     * @param v2
     * @param target
     * @returns
     */
    public static mul(v1: Vector3, v2: Vector3, target?: Vector3): Vector3 {
        if (!target) {
            target = new Vector3();
        }
        target.x = v1.x * v2.x;
        target.y = v1.y * v2.y;
        target.z = v1.z * v2.z;
        return target;
    }

    /**
     * vector3 mul
     * @param v1
     * @param v2
     * @param target
     * @returns
     */
    public static mulScale(v1: Vector3, v: number, target?: Vector3): Vector3 {
        if (!target) {
            target = new Vector3();
        }
        target.x = v1.x * v;
        target.y = v1.y * v;
        target.z = v1.z * v;
        return target;
    }

    /**
     * vector3 div
     * @param v1
     * @param v2
     * @param target
     * @returns
     */
    public static div(v1: Vector3, v2: Vector3, target?: Vector3): Vector3 {
        if (!target) {
            target = new Vector3();
        }
        target.x = v1.x / v2.x;
        target.y = v1.y / v2.y;
        target.z = v1.z / v2.z;
        return target;
    }

    /**
     * normalize
     * @param v1 source vector
     * @returns result vector
     */
    public static normalize(v1: Vector3) {
        let t = v1.clone();
        return t.normalize();
    }

    /**
     * dot
     * @param v1 first vector
     * @param v2 second vector
     * @returns result
     */
    public static dot(v1: Vector3, v2: Vector3): number {
        let v = Vector3.HELP_0;
        v.copyFrom(v1);
        return v.dotProduct(v2);
    }

    /**
     * Calculate the angle between two vectors
     * @param v1 first vector
     * @param v2 second vector
     * @returns Angle result in radians
     */
    public static calculateVectorAngle_xz(v1: Vector3, v2: Vector3) {
        //acos return radian,we should transform it into degree
        // return acos((x1*x2 + y1*y2) / sqrt((x1*x1 + y1*y1)*(x2*x2 + y2*y2)) * 180 / 3.14;
        return Math.acos((v1.x * v2.x + v1.y * v2.y) / Math.sqrt((v1.x * v1.x + v1.y * v1.y) * (v2.x * v2.x + v2.y * v2.y)));
    }

    /**
     *
     * Calculate the distance between two points
     * @static
     * @param {Vector3} v1 first vector
     * @param {Vector3} v2 second vector
     * @return {*} distance
     */
    public static distance(v1: Vector3, v2: Vector3) {
        return Vector3.distance(v1, v2);
    }

    /**
     * make a Random 3D Vector
     * @param min The min random value of vector components
     * @param max The max random value of vector components
     * @returns random vector
     */
    public static getRandomXYZ(min: number = -100, max: number = 100): Vector3 {
        return new Vector3(Math.random() * max + min, Math.random() * max + min, Math.random() * max + min);
    }

    /**
     * make a Random 3D Vector
     * @param min The min random value of vector component-x
     * @param max The max random value of vector component-x
     * @param yMin The min random value of vector component-y
     * @param yMax The max random value of vector component-y
     * @returns random vector
     */
    public static getRandomV3(min: number = -100, max: number = 100, yMin: number, yMax: number): Vector3 {
        return new Vector3(Math.random() * max + min, Math.random() * yMax + yMin, Math.random() * max + min);
    }
}
