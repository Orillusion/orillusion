import { Vector3 } from './Vector3';

/**
 * Cylindrical coordinates (radius from the Y axis, azimuth `theta` around +Y
 * measured from +Z toward +X, height `y`). Same convention as three.js.
 * @group Math
 */
export class Cylindrical {
    /** Distance from the Y axis. */
    public radius: number;
    /** Azimuth around +Y from +Z, radians. */
    public theta: number;
    /** Height along Y. */
    public y: number;

    constructor(radius = 1, theta = 0, y = 0) {
        this.radius = radius;
        this.theta = theta;
        this.y = y;
    }

    public set(radius: number, theta: number, y: number): this {
        this.radius = radius;
        this.theta = theta;
        this.y = y;
        return this;
    }

    public copy(other: Cylindrical): this {
        return this.set(other.radius, other.theta, other.y);
    }

    public clone(): Cylindrical {
        return new Cylindrical(this.radius, this.theta, this.y);
    }

    public setFromVector3(v: Vector3): this {
        return this.setFromCartesianCoords(v.x, v.y, v.z);
    }

    public setFromCartesianCoords(x: number, y: number, z: number): this {
        this.radius = Math.sqrt(x * x + z * z);
        this.theta = Math.atan2(x, z);
        this.y = y;
        return this;
    }

    public toVector3(out: Vector3 = new Vector3()): Vector3 {
        out.x = this.radius * Math.sin(this.theta);
        out.y = this.y;
        out.z = this.radius * Math.cos(this.theta);
        return out;
    }
}
