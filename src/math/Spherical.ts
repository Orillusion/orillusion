import { clamp } from './MathUtil';
import { Vector3 } from './Vector3';

const EPS = Math.PI / 180 / 100;

/**
 * Spherical coordinates (radius, polar angle `phi` from +Y, azimuth `theta`
 * around +Y measured from +Z). Same convention as three.js `Spherical`, and
 * what `OrbitController` uses to orbit a target.
 * @group Math
 */
export class Spherical {
    /** Distance from the origin. */
    public radius: number;
    /** Polar angle from the +Y axis, radians, 0..π. */
    public phi: number;
    /** Azimuth around +Y measured from +Z toward +X, radians. */
    public theta: number;
    /** Scratch vector returned by `getCoords()`. */
    public coords: Vector3;

    constructor(radius = 1, phi = 0, theta = 0) {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
        this.coords = new Vector3();
    }

    public set(radius: number, phi: number, theta: number): this {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
        return this;
    }

    public copy(other: Spherical): this {
        return this.set(other.radius, other.phi, other.theta);
    }

    public clone(): Spherical {
        return new Spherical(this.radius, this.phi, this.theta);
    }

    /** Keep `phi` strictly inside (0, π) so the up vector never degenerates. */
    public makeSafe(): this {
        this.phi = Math.max(EPS, Math.min(Math.PI - EPS, this.phi));
        return this;
    }

    public setFromVector3(v: Vector3): this {
        return this.setCoords(v.x, v.y, v.z);
    }

    /** Set from cartesian coordinates. */
    public setCoords(x: number, y: number, z: number): this {
        this.radius = Math.sqrt(x * x + y * y + z * z);
        if (this.radius === 0) {
            this.theta = 0;
            this.phi = 0;
        } else {
            this.theta = Math.atan2(x, z);
            this.phi = Math.acos(clamp(y / this.radius, -1, 1));
        }
        return this;
    }

    /** three.js-compatible alias of `setCoords`. */
    public setFromCartesianCoords(x: number, y: number, z: number): this {
        return this.setCoords(x, y, z);
    }

    /** Cartesian position, written into the shared `coords` scratch vector. */
    public getCoords(): Vector3 {
        return this.toVector3(this.coords);
    }

    /** Cartesian position written into `out` (no shared state). */
    public toVector3(out: Vector3 = new Vector3()): Vector3 {
        const sinPhiRadius = Math.sin(this.phi) * this.radius;
        out.x = sinPhiRadius * Math.sin(this.theta);
        out.y = Math.cos(this.phi) * this.radius;
        out.z = sinPhiRadius * Math.cos(this.theta);
        return out;
    }
}
