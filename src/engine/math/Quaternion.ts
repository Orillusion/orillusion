import { DEGREES_TO_RADIANS, RADIANS_TO_DEGREES } from './MathUtil';
import { Orientation3D } from './Orientation3D';
import { Vector3 } from './Vector3';

/**
 * Quaternions are used to represent rotations.
 * @group Math
 */
export class Quaternion {
    public static HELP_0: Quaternion = new Quaternion();
    public static HELP_1: Quaternion = new Quaternion();
    public static HELP_2: Quaternion = new Quaternion();
    public static _zero: Quaternion = new Quaternion(0, 0, 0, 1);
    public static CALCULATION_QUATERNION: Quaternion = new Quaternion();
    /**
     * @internal
     */
    public x: number = 0;
    /**
     * @internal
     */
    public y: number = 0;
    /**
     * @internal
     */
    public z: number = 0;
    /**
     * @internal
     */
    public w: number = 1;

    /**
     * Create a new quaternion object
     * @param x The X component of a quaternion.
     * @param y The Y component of a quaternion.
     * @param z The Z component of a quaternion.
     * @param w The W component of a quaternion.
     */
    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * Identity quaternion
     * @returns 
     */
    public static identity() {
        return Quaternion._zero;
    }

    /**
     * Converts quaternions to matrices
     * @param q Quaternion
     * @param m Matrix
     */
    public static quaternionToMatrix(q: Quaternion, m: any) {
        // If q is guaranteed to be a unit quaternion, s will always
        // be 1.  In that case, this calculation can be optimized out.
        //float norm = GetNorm (q);
        //float s = (norm > 0.0) ? 2.0/norm : 0;

        // Precalculate coordinate products
        let x = q.x * 2.0;
        let y = q.y * 2.0;
        let z = q.z * 2.0;
        let xx = q.x * x;
        let yy = q.y * y;
        let zz = q.z * z;
        let xy = q.x * y;
        let xz = q.x * z;
        let yz = q.y * z;
        let wx = q.w * x;
        let wy = q.w * y;
        let wz = q.w * z;

        // Calculate 3x3 matrix from orthonormal basis
        m.rawData[0] = 1.0 - (yy + zz);
        m.rawData[1] = xy + wz;
        m.rawData[2] = xz - wy;
        m.rawData[3] = 0.0;

        m.rawData[4] = xy - wz;
        m.rawData[5] = 1.0 - (xx + zz);
        m.rawData[6] = yz + wx;
        m.rawData[7] = 0.0;

        m.rawData[8] = xz + wy;
        m.rawData[9] = yz - wx;
        m.rawData[10] = 1.0 - (xx + yy);
        m.rawData[11] = 0.0;

        m.rawData[12] = 0.0;
        m.rawData[13] = 0.0;
        m.rawData[14] = 0.0;
        m.rawData[15] = 1.0;
    }

    public get magnitude(): number {
        return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
    }

    /**
     * Set the x, y, z, and w components of the existing quaternions.
     * @param x The X component of a quaternion.
     * @param y The Y component of a quaternion.
     * @param z The Z component of a quaternion.
     * @param w The W component of a quaternion.
     */
    public set(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public divide(v): Quaternion {
        if (v instanceof Quaternion) {
            return new Quaternion(this.x / v.x, this.y / v.y, this.z / v.z);
        }
        else {
            this.x = this.x / v;
            this.y = this.y / v;
            this.z = this.z / v;
        }
        return this;
    }

    /**
     * @internal
     */
    public setFromArray(d: Float32Array | number[]) {
        this.x = d[0];
        this.y = d[1];
        this.z = d[2];
        this.w = d[3];
        return this;
    }

    /**
     * Multiply two quaternions
     * @param qa Quaternion 1
     * @param qb Quaternion 2
     */
    public multiply(qa: Quaternion, qb: Quaternion) {
        var w1: number = qa.w;
        var x1: number = qa.x;
        var y1: number = qa.y;
        var z1: number = qa.z;
        var w2: number = qb.w;
        var x2: number = qb.x;
        var y2: number = qb.y;
        var z2: number = qb.z;

        this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
        this.x = w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2;
        this.y = w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2;
        this.z = w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2;
    }

    public multiplyVector(vector: Vector3, target: Quaternion = null): Quaternion {
        target ||= new Quaternion();
        var x2: number = vector.x;
        var y2: number = vector.y;
        var z2: number = vector.z;

        target.w = -this.x * x2 - this.y * y2 - this.z * z2;
        target.x = this.w * x2 + this.y * z2 - this.z * y2;
        target.y = this.w * y2 - this.x * z2 + this.z * x2;
        target.z = this.w * z2 + this.x * y2 - this.y * x2;

        return target;
    }

    /**
     * Set the quaternion with a given rotation of the axis and Angle.
     * @param axis  axis
     * @param angle angle
     */
    public fromAxisAngle(axis: Vector3, angle: number) {
        angle *= Math.PI / 180.0;
        var halfAngle: number = angle * 0.5;
        var sinA: number = Math.sin(halfAngle);

        this.w = Math.cos(halfAngle);
        this.x = axis.x * sinA;
        this.y = axis.y * sinA;
        this.z = axis.z * sinA;

        this.normalize();
    }

    /**
     * Turn quaternions into angles
     * @param axis axis
     * @returns 
     */
    public toAxisAngle(axis: Vector3): number {
        var sqrLength: number = this.x * this.x + this.y * this.y + this.z * this.z;
        var angle: number = 0;
        if (sqrLength > 0.0) {
            angle = 2.0 * Math.acos(this.w);
            sqrLength = 1.0 / Math.sqrt(sqrLength);
            axis.x = this.x * sqrLength;
            axis.y = this.y * sqrLength;
            axis.z = this.z * sqrLength;
        } else {
            angle = 0;
            axis.x = 1.0;
            axis.y = 0;
            axis.z = 0;
        }
        // angle /= Math.PI / 180.0;
        return angle;
    }

    /**
     * Spherically interpolates between two quaternions, providing an interpolation between rotations with constant angle change rate.
     * @param qa The first quaternion to interpolate.
     * @param qb The second quaternion to interpolate.
     * @param t The interpolation weight, a value between 0 and 1.
     */
    public slerp(qa: Quaternion, qb: Quaternion, t: number) {
        var w1: number = qa.w;
        var x1: number = qa.x;
        var y1: number = qa.y;
        var z1: number = qa.z;
        var w2: number = qb.w;
        var x2: number = qb.x;
        var y2: number = qb.y;
        var z2: number = qb.z;
        var dot: number = w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2;

        // shortest direction
        if (dot < 0) {
            dot = -dot;
            w2 = -w2;
            x2 = -x2;
            y2 = -y2;
            z2 = -z2;
        }

        if (dot < 0.95) {
            // interpolate angle linearly
            var angle: number = Math.acos(dot);
            var s: number = 1 / Math.sin(angle);
            var s1: number = Math.sin(angle * (1 - t)) * s;
            var s2: number = Math.sin(angle * t) * s;
            this.w = w1 * s1 + w2 * s2;
            this.x = x1 * s1 + x2 * s2;
            this.y = y1 * s1 + y2 * s2;
            this.z = z1 * s1 + z2 * s2;
        } else {
            // nearly identical angle, interpolate linearly
            this.w = w1 + t * (w2 - w1);
            this.x = x1 + t * (x2 - x1);
            this.y = y1 + t * (y2 - y1);
            this.z = z1 + t * (z2 - z1);
            var len: number = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
            this.w *= len;
            this.x *= len;
            this.y *= len;
            this.z *= len;
        }
    }

    /**
     * Linearly interpolates between two quaternions.
     * @param qa The first quaternion to interpolate.
     * @param qb The second quaternion to interpolate.
     * @param t The interpolation weight, a value between 0 and 1.
     */
    public lerp(qa: Quaternion, qb: Quaternion, t: number) {
        var w1: number = qa.w;
        var x1: number = qa.x;
        var y1: number = qa.y;
        var z1: number = qa.z;
        var w2: number = qb.w;
        var x2: number = qb.x;
        var y2: number = qb.y;
        var z2: number = qb.z;
        var len: number;

        // shortest direction
        if (w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2 < 0) {
            w2 = -w2;
            x2 = -x2;
            y2 = -y2;
            z2 = -z2;
        }

        this.w = w1 + t * (w2 - w1);
        this.x = x1 + t * (x2 - x1);
        this.y = y1 + t * (y2 - y1);
        this.z = z1 + t * (z2 - z1);

        len = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
        this.w *= len;
        this.x *= len;
        this.y *= len;
        this.z *= len;
    }

    /**
     * Fills the quaternion object with values representing the given euler rotation.
     * @param    ax        The angle in radians of the rotation around the ax axis.
     * @param    ay        The angle in radians of the rotation around the ay axis.
     * @param    az        The angle in radians of the rotation around the az axis.
     */
    public fromEulerAngles(ax: number, ay: number, az: number): Quaternion {
        ax *= DEGREES_TO_RADIANS;
        ay *= DEGREES_TO_RADIANS;
        az *= DEGREES_TO_RADIANS;

        var halfX: number = ax * 0.5;
        var halfY: number = ay * 0.5;
        var halfZ: number = az * 0.5;
        var cosX: number = Math.cos(halfX);
        var sinX: number = Math.sin(halfX);
        var cosY: number = Math.cos(halfY);
        var sinY: number = Math.sin(halfY);
        var cosZ: number = Math.cos(halfZ);
        var sinZ: number = Math.sin(halfZ);

        this.w = cosX * cosY * cosZ + sinX * sinY * sinZ;
        this.x = sinX * cosY * cosZ - cosX * sinY * sinZ;
        this.y = cosX * sinY * cosZ + sinX * cosY * sinZ;
        this.z = cosX * cosY * sinZ - sinX * sinY * cosZ;

        return this;
    }

    /**
     * Fills a target Vector3D object with the Euler angles that form the rotation represented by this quaternion.
     * @param target An optional Vector3D object to contain the Euler angles. If not provided, a new object is created.
     * @returns The Vector3D containing the Euler angles.
     */
    public toEulerAngles(target: Vector3 = null): Vector3 {
        target ||= new Vector3();
        target.x = Math.atan2(2.0 * (this.w * this.x + this.y * this.z), 1.0 - 2.0 * (this.x * this.x + this.y * this.y));

        var temp: number = 2.0 * (this.w * this.y - this.z * this.x);
        temp = this.clampf(temp, -1.0, 1.0);
        target.y = Math.asin(temp);
        target.z = Math.atan2(2.0 * (this.w * this.z + this.x * this.y), 1.0 - 2.0 * (this.y * this.y + this.z * this.z));

        target.x /= DEGREES_TO_RADIANS;
        target.y /= DEGREES_TO_RADIANS;
        target.z /= DEGREES_TO_RADIANS;
        return target;
    }

    /**
     * Sets the current quaternion from the rotation matrix
     * @param m 
     * @returns 
     */
    public setFromRotationMatrix(m: any) {
        const te = m.rawData;
        const m11 = te[0];
        const m12 = te[4];
        const m13 = te[8];
        const m21 = te[1];
        const m22 = te[5];
        const m23 = te[9];
        const m31 = te[2];
        const m32 = te[6];
        const m33 = te[10];
        const trace = m11 + m22 + m33;

        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);

            this.w = 0.25 / s;
            this.x = (m32 - m23) * s;
            this.y = (m13 - m31) * s;
            this.z = (m21 - m12) * s;
        } else if (m11 > m22 && m11 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

            this.w = (m32 - m23) / s;
            this.x = 0.25 * s;
            this.y = (m12 + m21) / s;
            this.z = (m13 + m31) / s;
        } else if (m22 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

            this.w = (m13 - m31) / s;
            this.x = (m12 + m21) / s;
            this.y = 0.25 * s;
            this.z = (m23 + m32) / s;
        } else {
            const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

            this.w = (m21 - m12) / s;
            this.x = (m13 + m31) / s;
            this.y = (m23 + m32) / s;
            this.z = 0.25 * s;
        }

        return this;
    }

    /**
     * Get the Euler Angle
     * @param eulers 
     * @returns 
     */
    public getEulerAngles(eulers?: Vector3) {
        var x;
        var y;
        var z;
        var qx;
        var qy;
        var qz;
        var qw;
        var a2;

        eulers = eulers === undefined ? new Vector3() : eulers;

        qx = this.x;
        qy = this.y;
        qz = this.z;
        qw = this.w;

        a2 = 2 * (qw * qy - qx * qz);
        if (a2 <= -0.99999) {
            x = 2 * Math.atan2(qx, qw);
            y = -Math.PI / 2;
            z = 0;
        } else if (a2 >= 0.99999) {
            x = 2 * Math.atan2(qx, qw);
            y = Math.PI / 2;
            z = 0;
        } else {
            x = Math.atan2(2 * (qw * qx + qy * qz), 1 - 2 * (qx * qx + qy * qy));
            y = Math.asin(a2);
            z = Math.atan2(2 * (qw * qz + qx * qy), 1 - 2 * (qy * qy + qz * qz));
        }

        return eulers.set(x, y, z).scaleBy(RADIANS_TO_DEGREES);
    }

    /**
     * The normalize of the quaternion. Convert this quaternion to a normalize coefficient.
     * @param val normalize coefficient, which is 1 by default
     */
    public normalize(val: number = 1): void {
        var mag: number = val / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);

        this.x *= mag;
        this.y *= mag;
        this.z *= mag;
        this.w *= mag;
    }

    /**
     * Returns the value of a quaternion as a string
     * @returns 
     */
    public toString(): string {
        return '{x:' + this.x + ' y:' + this.y + ' z:' + this.z + ' w:' + this.w + '}';
    }

    /**
     * Extracts a quaternion rotation matrix out of a given Matrix3D object.
     * @param matrix The Matrix3D out of which the rotation will be extracted.
     */
    public fromMatrix(matrix: any) {
        var v: Vector3 = matrix.decompose(Orientation3D.QUATERNION)[1];
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        this.w = v.w;
    }

    /**
     * Returns a quaternion that inverts the current quaternion
     * @param target The default parameter is null. If the current parameter is null, a new quaternion object is returned
     * @returns Quaternion Result
     */
    public inverse(target: Quaternion = null): Quaternion {
        target ||= new Quaternion();

        var norm: number = this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;

        if (norm > 0.0) {
            var invNorm = 1.0 / norm;
            target.w = this.w * invNorm;
            target.x = -this.x * invNorm;
            target.y = -this.y * invNorm;
            target.z = -this.z * invNorm;
        }

        return target;
    }

    /**
     * Clones the quaternion.
     * @returns An exact duplicate of the current Quaternion.
     */
    public clone(): Quaternion {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }

    /**
     * Rotates a point.
     * @param vector The Vector3D object to be rotated.
     * @param target An optional Vector3D object that will contain the rotated coordinates. If not provided, a new object will be created.
     * @returns A Vector3D object containing the rotated point.
     */
    public transformVector(vector: Vector3, target: Vector3 = null): Vector3 {
        var x1: number;
        var y1: number;
        var z1: number;
        var w1: number;
        var x2: number = vector.x;
        var y2: number = vector.y;
        var z2: number = vector.z;

        target ||= new Vector3();

        // p*q'
        w1 = -this.x * x2 - this.y * y2 - this.z * z2;
        x1 = this.w * x2 + this.y * z2 - this.z * y2;
        y1 = this.w * y2 - this.x * z2 + this.z * x2;
        z1 = this.w * z2 + this.x * y2 - this.y * x2;

        target.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
        target.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
        target.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;
        return target;
    }

    /**
     * Copies the data from a quaternion into this instance.
     * @param q The quaternion to copy from.
     */
    public copyFrom(q: Quaternion | Vector3) {
        var v = this;
        v.x = q.x;
        v.y = q.y;
        v.z = q.z;
        v.w = q.w;
    }

    /**
     * from untiy API
     * op
     */
    public mul(lhs: Quaternion, rhs: Quaternion, target?: Quaternion) {
        let ret = target || new Quaternion();
        ret.x = lhs.w * rhs.x + lhs.x * rhs.w + lhs.y * rhs.z - lhs.z * rhs.y;
        ret.y = lhs.w * rhs.y + lhs.y * rhs.w + lhs.z * rhs.x - lhs.x * rhs.z;
        ret.z = lhs.w * rhs.z + lhs.z * rhs.w + lhs.x * rhs.y - lhs.y * rhs.x;
        ret.w = lhs.w * rhs.w - lhs.x * rhs.x - lhs.y * rhs.y - lhs.z * rhs.z;
        return ret;
    }

    private clampf(value: number, minInclusive: number, maxInclusive: number): number {
        if (minInclusive > maxInclusive) {
            var temp: number = minInclusive;
            minInclusive = maxInclusive;
            maxInclusive = temp;
        }
        return value < minInclusive ? minInclusive : value < maxInclusive ? value : maxInclusive;
    }
}

/**
 * @internal
 */
export function rotateVectorByQuat(lhs: Quaternion, rhs: Vector3, target: Vector3) {
    let x = lhs.x * 2.0;
    let y = lhs.y * 2.0;
    let z = lhs.z * 2.0;
    let xx = lhs.x * x;
    let yy = lhs.y * y;
    let zz = lhs.z * z;
    let xy = lhs.x * y;
    let xz = lhs.x * z;
    let yz = lhs.y * z;
    let wx = lhs.w * x;
    let wy = lhs.w * y;
    let wz = lhs.w * z;

    let res = target ? target : new Vector3();
    res.x = (1.0 - (yy + zz)) * rhs.x + (xy - wz) * rhs.y + (xz + wy) * rhs.z;
    res.y = (xy + wz) * rhs.x + (1.0 - (xx + zz)) * rhs.y + (yz - wx) * rhs.z;
    res.z = (xz - wy) * rhs.x + (yz + wx) * rhs.y + (1.0 - (xx + yy)) * rhs.z;

    //	AssertIf (!CompareApproximately (restest, res));
    return res;
}
