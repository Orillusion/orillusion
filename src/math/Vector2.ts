
/***
 * Vector 2D
 * @group Math
 */
export class Vector2 {

    /**
     * @internal
     */
    public static HELP_0: Vector2 = new Vector2();

    /**
     * @internal
     */
    public static HELP_1: Vector2 = new Vector2();

    /**
     * @internal
     */
    public static HELP_2: Vector2 = new Vector2();

    /** A zero vector (0, 0). */
    public static readonly ZERO: Vector2 = new Vector2(0, 0);

    /** A vector whose components are the maximum safe integer. */
    public static readonly SAFE_MAX: Vector2 = new Vector2(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

    /** A vector whose components are the minimum safe integer. */
    public static readonly SAFE_MIN: Vector2 = new Vector2(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

    /**
     * The x component of the vector, the default value is 0.
    */
    public x: number = 0.0;

    /**
     * The y component of the vector, the default value is 0.
     */
    public y: number = 0.0;

    /**
     * Create a new Vector2.
     * @param x The x component of the vector, which defaults to 0.
     * @param y The y component of the vector, which defaults to 0.
     */
    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns the Angle, in radians, between two vectors.
     * @param a Vector a
     * @param b Vector b
     * @returns result
     */
    public static getAngle(a: Vector2, b: Vector2): number {
        return Math.atan2(b.y - a.y, b.x - a.x);
    }

    /**
     * Computes linear interpolation between two vectors.
     * @param from starting vector
     * @param to The vector in which you interpolate
     * @param t 
     */
    public static slerp(from: Vector2, to: Vector2, t: number): Vector2 {
        let v = new Vector2();
        let dot = from.dot(to);
        if (dot < 0) {
            to.x = -to.x;
            to.y = -to.y;
            dot = -dot;
        }
        if (dot > 0.9995) {
            v.x = from.x + t * (to.x - from.x);
            v.y = from.y + t * (to.y - from.y);
            return v;
        }
        let theta = Math.acos(dot);
        let sinTheta = Math.sin(theta);
        let scale0 = Math.sin((1 - t) * theta) / sinTheta;
        let scale1 = Math.sin(t * theta) / sinTheta;
        v.x = scale0 * from.x + scale1 * to.x;
        v.y = scale0 * from.y + scale1 * to.y;
        return v;
    }

    /**
     * Linear interpolation between two vectors.
     * @param from starting vector
     * @param to  The vector in which you interpolate
     * @param t 
     * @returns 
     */
    public static lerp(from: Vector2, to: Vector2, t: number) {
        Vector2.HELP_0.copy(from);
        Vector2.HELP_1.copy(to);
        Vector2.HELP_0.multiplyScalar(1.0 - t);
        Vector2.HELP_1.multiplyScalar(t);
        return new Vector2(Vector2.HELP_0.x + Vector2.HELP_1.x, Vector2.HELP_0.y + Vector2.HELP_1.y);
    }

    /**
     * Add two vectors
     */
    public static add(a: Vector2, b: Vector2, result?: Vector2): Vector2 {
        result ||= new Vector2();
        result.x = a.x + b.x;
        result.y = a.y + b.y;
        return result;
    }

    /**
     * Subtract two vectors
     */
    public static sub(a: Vector2, b: Vector2, result?: Vector2): Vector2 {
        result ||= new Vector2();
        result.x = a.x - b.x;
        result.y = a.y - b.y;
        return result;
    }

    /**
     * Component-wise multiply two vectors
     */
    public static multiply(a: Vector2, b: Vector2, result?: Vector2): Vector2 {
        result ||= new Vector2();
        result.x = a.x * b.x;
        result.y = a.y * b.y;
        return result;
    }

    /**
     * Component-wise divide two vectors
     */
    public static divide(a: Vector2, b: Vector2, result?: Vector2): Vector2 {
        result ||= new Vector2();
        result.x = a.x / b.x;
        result.y = a.y / b.y;
        return result;
    }

    /**
     * Multiply a vector by a scalar
     */
    public static multiplyScalar(a: Vector2, s: number, result?: Vector2): Vector2 {
        result ||= new Vector2();
        result.x = a.x * s;
        result.y = a.y * s;
        return result;
    }

    /**
     * Negate a vector
     */
    public static negate(a: Vector2, result?: Vector2): Vector2 {
        result ||= new Vector2();
        result.x = -a.x;
        result.y = -a.y;
        return result;
    }

    /**
     * Sets the x and y components of this vector.
     * @param x The x component of the vector, which defaults to 0.
     * @param y The y component of the vector, which defaults to 0.
     */
    public set(x: number = 0, y: number = 0): this {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Calculate the distance between this vector and the incoming vector.
     * @param a Target vector
     * @returns
     */
    public distance(a: Vector2): number {
        return Math.sqrt(Math.pow(this.x - a.x, 2) + Math.pow(this.y - a.y, 2));
    }

    /**
     * Adds vector `a` to this vector. Mutates and returns this.
     */
    public add(a: Vector2): this {
        return Vector2.add(this, a, this) as this;
    }

    /**
     * Subtracts vector `a` from this vector. Mutates and returns this.
     */
    public sub(a: Vector2): this {
        return Vector2.sub(this, a, this) as this;
    }

    /**
     * Multiplies x/y of this vector by scalar s. Mutates and returns this.
     */
    public multiplyScalar(s: number): this {
        return Vector2.multiplyScalar(this, s, this) as this;
    }

    /**
     * Multiplies x/y of this vector by scalar a. Mutates and returns this.
     * Kept as an alternative name for the scalar `multiplyScalar`.
     */
    public multiply(a: number): this {
        return Vector2.multiplyScalar(this, a, this) as this;
    }

    /**
     * Divides x/y of this vector by scalar v. Mutates and returns this.
     */
    public divide(v: number): this {
        return Vector2.multiplyScalar(this, 1 / v, this) as this;
    }

    /**
     * Negates this vector. Mutates and returns this.
     */
    public neg(): this {
        return Vector2.negate(this, this) as this;
    }

    /** Returns the Euclidean length of this vector. */
    public abs() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Length of vector
     * @returns 
     */
    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Returns the Angle, in radians, between the current vector and the target vector.
     * @param target Target vector
     * @returns 
     */
    public getAngle(target: Vector2): number {
        return Math.atan2(target.y - this.y, target.x - this.x);
    }

    /**
     * Normalizes this vector to unit length. Mutates and returns this.
     */
    public unt(): this {
        let d = this.abs();
        this.x = this.x / d;
        this.y = this.y / d;
        return this;
    }

    /** Returns the angle, in radians, from this vector to v. */
    public angleTo(v: Vector2): number {
        let dx = v.x - this.x;
        let dy = v.y - this.y;
        return Math.atan2(dy, dx);
    }

    /**
     * Whether two vectors are equal
     * @param a Vector of comparison
     * @returns 
     */
    public equals(a: Vector2): boolean {
        if (Math.abs(this.x - a.x) < 1e-6 && Math.abs(this.y - a.y) < 1e-6) return true;
        return false;
    }

    /** Tests parallelism with a: 1 if same direction, -1 if opposite, 0 otherwise. */
    public pal(a: Vector2): number {
        let u1 = this.clone().unt();
        let u2 = a.clone().unt();
        if (u1.equals(u2)) return 1;
        if (u1.equals(u2.neg())) return -1;
        return 0;
    }

    /**
     * Returns a new vector that has the same x and y as the current vector.
     * @returns 
     */
    public clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    /**
     * Copy the x and y properties of the source vector to this vector
     * @param v Source vector
     * @returns 
     */
    public copy(v: Vector2): this {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    /**
     * Add scaling vector
     * @param v Source vector
     * @param size Scale size
     * @returns 
     */
    public addScaledVector(v: Vector2, size: number): Vector2 {
        this.x += v.x * size;
        this.y += v.y * size;
        return this;
    }

    /**
     * Take the dot product of two vectors.
     * @param value Target vector
     * @returns 
     */
    public dot(value: Vector2): number {
        return this.x * value.x + this.y * value.y;
    }

    /**
     * Convert this vector to a unit vector.
     */
    public normalize(): this {
        let d = this.abs();
        this.x = this.x / d;
        this.y = this.y / d;
        return this;
    }

    /**
     * Add the scalar to the x and y of this vector.
     * @param s Additive scalar
     * @returns 
     */
    public addScalar(s: number): this {
        this.x += s;
        this.y += s;

        return this;
    }

    /**
     * 
     * @param minVal Component will be limited to the minimum value of
     * @param maxVal The component will be limited to the maximum value of
     * @returns 
     */
    public clampScalar(minVal: number, maxVal: number) {
        this.x = Math.max(minVal, Math.min(maxVal, this.x));
        this.y = Math.max(minVal, Math.min(maxVal, this.y));

        return this;
    }

    // -------- Standard instance API --------

    /** Set this = a + b. */
    public addVectors(a: Vector2, b: Vector2): this {
        return Vector2.add(a, b, this) as this;
    }

    /** Set this = a - b. */
    public subVectors(a: Vector2, b: Vector2): this {
        return Vector2.sub(a, b, this) as this;
    }

    /** Set this = a * b component-wise. */
    public multiplyVectors(a: Vector2, b: Vector2): this {
        return Vector2.multiply(a, b, this) as this;
    }

    /** Negate this vector. Canonical alias of {@link neg}. */
    public negate(): this {
        return Vector2.negate(this, this) as this;
    }

    /** Squared length. */
    public lengthSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    /** Euclidean distance to v. Canonical alias of {@link distance}. */
    public distanceTo(v: Vector2): number {
        return this.distance(v);
    }

    /** Squared distance to v. */
    public distanceToSquared(v: Vector2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    /** Linearly interpolate this towards v by alpha. */
    public lerp(v: Vector2, alpha: number): this {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        return this;
    }

    /** Set this = v1 + (v2 - v1) * alpha. */
    public lerpVectors(v1: Vector2, v2: Vector2, alpha: number): this {
        this.x = v1.x + (v2.x - v1.x) * alpha;
        this.y = v1.y + (v2.y - v1.y) * alpha;
        return this;
    }

    /** Component-wise min/max/clamp. */
    public min(v: Vector2): this {
        this.x = Math.min(this.x, v.x);
        this.y = Math.min(this.y, v.y);
        return this;
    }

    /** Component-wise maximum with v. Mutates and returns this. */
    public max(v: Vector2): this {
        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);
        return this;
    }

    /** Component-wise clamp into [min, max]. Mutates and returns this. */
    public clamp(min: Vector2, max: Vector2): this {
        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        return this;
    }

    /** Floors each component. Mutates and returns this. */
    public floor(): this {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    /** Ceils each component. Mutates and returns this. */
    public ceil(): this {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    /** Rounds each component to the nearest integer. Mutates and returns this. */
    public round(): this {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    /** Rounds each component toward zero. Mutates and returns this. */
    public roundToZero(): this {
        this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x);
        this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y);
        return this;
    }

    /** Set x/y from array starting at offset. Mutates and returns this. */
    public fromArray(array: ArrayLike<number>, offset: number = 0): this {
        this.x = array[offset];
        this.y = array[offset + 1];
        return this;
    }

    /** Write x/y into array starting at offset and return the array. */
    public toArray(array: number[] = [], offset: number = 0): number[] {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        return array;
    }

    /** Rotate this around `center` by angle (radians). */
    public rotateAround(center: Vector2, angle: number): this {
        const c = Math.cos(angle), s = Math.sin(angle);
        const x = this.x - center.x;
        const y = this.y - center.y;
        this.x = x * c - y * s + center.x;
        this.y = x * s + y * c + center.y;
        return this;
    }

    /** Fill this with components in [0, 1). Mutates and returns this. */
    public random(): this {
        this.x = Math.random();
        this.y = Math.random();
        return this;
    }
}
