import { getFloatFromInt } from './MathUtil';

/**
 * 'Rand' is a random number generator based on an improved xorshift algorithm, 
 * which is a modification of the Linear Congruential Generator (LCG) method.
 * @group Math
 */
export class Rand {
    private _x: number = 0;
    private _y: number = 0;
    private _z: number = 0;
    private _w: number = 0;

    /**
     * Create a random number generator object with a specified seed.
     * @param seed Random seed
     */
    constructor(seed = 0) {
        this.seed = seed;
    }

    /**
     * Random seed
     */
    public get seed(): number {
        return this._x;
    }

    public set seed(value: number) {
        this._x = value;
        this._y = this._x * 1812433253 + 1;
        this._z = this._y * 1812433253 + 1;
        this._w = this._z * 1812433253 + 1;
    }

    /**
     * Convert an integer to a floating-point number
     * @param value integer
     * @returns 
     */
    public static getFloatFromInt(value) {
        // take 23 bits of integer, and divide by 2^23-1
        return Math.floor((value & 0x007fffff) * (1.0 / 8388607.0));
    }

    /**
     * Converts an integer to a single-byte integer
     * @param value integer
     * @returns 
     */
    public static getByteFromInt(value) {
        // take the most significant byte from the 23-bit value
        return value >> (23 - 8);
    }

    /**
     * Returns a new random number generator object with the same seed state as 
     * the current random number generator object
     * @returns 
     */
    public clone(): Rand {
        let result = new Rand();
        result._x = this._x;
        result._y = this._y;
        result._z = this._z;
        result._w = this._w;
        return result;
    }

    /**
     * Generate a random number
     * @returns 
     */
    public get() {
        let t = this._x ^ (this._x << 11);
        this._x = this._y;
        this._y = this._z;
        this._z = this._w;
        return (this._w = this._w ^ (this._w >> 19) ^ (t ^ (t >> 8)));
    }

    /**
     * Randomly generate a floating-point number 0.0 to 1.0
     * @returns 
     */
    public getFloat() {
        return getFloatFromInt(this.get());
    }

    /**
     * Randomly generates signed floating-point numbers -1.0 to 1.0
     * @returns 
     */
    public getSignedFloat() {
        return this.getFloat() * 2.0 - 1.0;
    }
}
