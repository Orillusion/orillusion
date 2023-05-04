
/**
 * Vector 3D
 * @group Math
 */
export class Vector3 {

    /**
     * Vector maximum
     */
    public static readonly MAX: Vector3 = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

    /**
     * Vector minimum
     */
    public static readonly MIN: Vector3 = new Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

    /**
     * Vector maximum integer value
     */
    public static readonly SAFE_MAX: Vector3 = new Vector3(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

    /**
     * Vector minimum integer value
     */
    public static readonly SAFE_MIN: Vector3 = new Vector3(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

    /**
     * X axis positive axis coordinate (1, 0, 0).
     */
    public static readonly X_AXIS: Vector3 = new Vector3(1, 0, 0);

    /**
     * The X-axis is negative (-1, 0, 0).
     */
    public static readonly neg_X_AXIS: Vector3 = new Vector3(-1, 0, 0);

    /**
     * The y axis defined as a Vector3 object with coordinates (0,1,0).
     */
    public static readonly Y_AXIS: Vector3 = new Vector3(0, 1, 0);

    /**
     * The z axis defined as a Vector3 object with coordinates (0,0,1).
     */
    public static readonly Z_AXIS: Vector3 = new Vector3(0, 0, 1);

    /**
     * @internal
     */
    public static HELP_0: Vector3 = new Vector3();

    /**
     * @internal
     */
    public static HELP_1: Vector3 = new Vector3();

    /**
     * @internal
     */
    public static HELP_2: Vector3 = new Vector3();

    /**
     * @internal
     */
    public static readonly EPSILON: number = 0.00001;

    /**
     * @internal
     */
    public static HELP_3: Vector3 = new Vector3();

    /**
     * @internal
     */
    public static HELP_4: Vector3 = new Vector3();

    /**
     * @internal
     */
    public static HELP_5: Vector3 = new Vector3();

    /**
     * @internal
     */
    public static HELP_6: Vector3 = new Vector3();

    /**
     * Returns a new vector with zero x, y, and z components
     */
    public static get ZERO(): Vector3 {
        return new Vector3(0, 0, 0);
    }

    /**
     * Returns a new vector whose x, y, and z components are all 1
     */
    public static get ONE(): Vector3 {
        return new Vector3(1, 1, 1);
    };

    /**
     * Returns a new vector pointing to the left, x is -1, y is 0, and z is 0
     */
    public static get LEFT(): Vector3 {
        return new Vector3(-1, 0, 0);
    };

    /**
     * Returns a new vector pointing in the right direction, where x is 1, y is 0, and z is 0
     */
    public static get RIGHT(): Vector3 {
        return new Vector3(1, 0, 0);
    };

    /**
     * Returns a new vector pointing upwards, that is, x equals 0, y equals 1, and z equals 0
     */
    public static get UP(): Vector3 {
        return new Vector3(0, 1, 0);
    };

    /**
     * Returns a new vector pointing down, where x is 0, y is -1, and z is 0
     */
    public static get DOWN(): Vector3 {
        return new Vector3(0, -1, 0);
    };

    /** 
     * Returns a new backward vector, x equals 0, y equals 0, and z equals negative 1
     */
    public static get BACK(): Vector3 {
        return new Vector3(0, 0, -1);
    };

    /**
     * Returns a new forward-pointing vector, that is, x is 0, y is 0, and z is 1
     */
    public static get FORWARD(): Vector3 {
        return new Vector3(0, 0, 1);
    };

    /**
     * The first element of a Vector3 object, such as the x coordinate of
     * a point in the three-dimensional space. The default value is 0.
     */
    public x: number = 0;

    /**
     * The second element of a Vector3 object, such as the y coordinate of
     * a point in the three-dimensional space. The default value is 0.
     */
    public y: number = 0;

    /**
     * The third element of a Vector3 object, such as the y coordinate of
     * a point in the three-dimensional space. The default value is 0.
     */
    public z: number = 0;

    /**
     * The z component of the vector,
     * A three-dimensional position or projection that can be used as a perspective projection
     * We can also do w in the quaternion
     */
    public w: number = 1;

    /**
     * @internal
     */
    public index: number = 0;

    /**
     * @internal
     */
    private static _index: number = 0;


    /**
     * Creates an instance of a Vector3 object. If you do not specify a.
     * parameter for the constructor, a Vector3 object is created with
     * the elements (0,0,0,0).
     *
     * @param x The first element, such as the x coordinate.
     * @param y The second element, such as the y coordinate.
     * @param z The third element, such as the z coordinate.
     * @param w An optional element for additional data such as the angle
     *          of rotation.
     */
    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.set(x, y, z, w);

        this.index = Vector3._index++;
    }

    /**
     *  Set w component
     * @param value
     */
    public set a(value: number) {
        this.w = value;
    }

    /**
     *  Set x component
     * @param value 
     */
    public set r(value: number) {
        this.x = value;
    }

    /**
     *  Set the y component
     * @param value 
     */
    public set g(value: number) {
        this.y = value;
    }

    /**
     *  Set z component
     * @param value 
     */
    public set b(value: number) {
        this.z = value;
    }

    /**
     *  get the w component
     * @returns value of w
     */
    public get a(): number {
        return this.w;
    }

    /**
     *  get the x component
     * @returns value of x
     */
    public get r(): number {
        return this.x;
    }

    /**
     *  get the y component
     * @returns value of y
     */
    public get g(): number {
        return this.y;
    }

    /**
     *  get the z component
     * @returns value of z
     */
    public get b(): number {
        return this.z;
    }

    /**
     * The length of the vector, the distance from the origin (0, 0, 0) to (x, y, z)
     */
    public get length(): number {
        return Math.sqrt(this.lengthSquared);
    }

    /**
     * You get the square of the length of the vector
     * @returns 
     */
    public get lengthSquared(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    /**
     * Get the current vector
     */
    public get position() {
        return this;
    }

    /**
     *  Obtain a vertical line segment with width through an orientation
     * @param dir
     * @param tp1
     * @param tp2
     * @param width
     */
    public static getTowPointbyDir(dir: Vector3, tp1: Vector3, tp2: Vector3, width: number, aix: Vector3) {
        if (aix == Vector3.Z_AXIS) {
            tp1.x = dir.y;
            tp1.y = -dir.x;

            tp2.x = -dir.y;
            tp2.y = dir.x;

            tp1.scaleBy(width * 0.5);
            tp2.scaleBy(width * 0.5);
        } else if (aix == Vector3.Y_AXIS) {
            tp1.x = dir.z;
            tp1.z = -dir.x;

            tp2.x = -dir.z;
            tp2.z = dir.x;

            tp1.scaleBy(width * 0.5);
            tp2.scaleBy(width * 0.5);
        }
    }

    /**
     * Calculate the distance from the point to the line
     * @param point1 Starting point of line segment
     * @param point2 End point of line segment
     * @param position Point position
     * @returns Distance from a point to a line segment
     */
    public static pointToLine(point1: Vector3, point2: Vector3, position: Vector3) {
        let space = 0;
        let a, b, c;
        a = Vector3.distance(point1, point2);
        b = Vector3.distance(point1, position);
        c = Vector3.distance(point2, position);
        if (c <= 0.000001 || b <= 0.000001) {
            space = 0;
            return space;
        }
        if (a <= 0.000001) {
            space = b;
            return space;
        }
        if (c * c >= a * a + b * b) {
            space = b;
            return space;
        }
        if (b * b >= a * a + c * c) {
            space = c;
            return space;
        }
        let p = (a + b + c) / 2;
        let s = Math.sqrt(p * (p - a) * (p - b) * (p - c));
        space = (2 * s) / a;
        return space;
    }

    public static cross(a: Vector3, b: Vector3, target: Vector3 = null): Vector3 {
        target = target || new Vector3();
        target.x = a.y * b.z - a.z * b.y;
        target.y = a.z * b.x - a.x * b.z;
        target.z = a.x * b.y - a.y * b.x;
        target.w = 1;
        return target;
    }

    /**
     * Take the dot product of two vectors.
     * @param a Vector a
     * @param b Vector b
     * @returns 
     */
    public static dot(a: Vector3, b: Vector3): number {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    public static getPoints(total: number, randSeed: number) {
        let points = [];
        for (let index = 0; index < total; index++) {
            const element = new Vector3(Math.random() * randSeed - randSeed * 0.5, Math.random() * randSeed - randSeed * 0.5, Math.random() * randSeed - randSeed * 0.5);
            points.push(element);
        }
        return points;
    }

    public static getPointNumbers(total: number, randSeed: number) {
        let points = [];
        for (let index = 0; index < total; index++) {
            points.push(Math.random() * randSeed - randSeed * 0.5, Math.random() * randSeed - randSeed * 0.5, Math.random() * randSeed - randSeed * 0.5);
        }
        return points;
    }

    /**
     * Returns the Angle, in degrees, between the source vector and the target vector.
     * @param from source vector.
     * @param to target vector.
     * @returns 
     */
    public static getAngle(from: Vector3, to: Vector3): number {
        let t = from.dotProduct(to) / (from.length * to.length);
        return (Math.acos(t) * 180) / Math.PI;
    }

    public static sqrMagnitude(arg0: Vector3): number {
        return arg0.x * arg0.x + arg0.y * arg0.y + arg0.z * arg0.z;
    }

    public static getZYAngle(zd: Vector3, yd: Vector3) {
        return this.calAngle(zd.y, zd.z, yd.y, yd.z);
    }
    /**
     * Subtract two vectors
     * @param a Vector a
     * @param b Vector b
     * @param target output vector
     * @returns 
     */
    public static sub(a: Vector3, b: Vector3, target: Vector3 = null): Vector3 {
        target = target || new Vector3();
        target.x = a.x - b.x;
        target.y = a.y - b.y;
        target.z = a.z - b.z;

        return target;
    }

    /**
     * Add two vectors
     * @param a Vector a
     * @param b Vector b
     * @param target output vector
     * @returns 
     */
    public static add(a: Vector3, b: Vector3, target: Vector3 = null): Vector3 {
        target = target || new Vector3();
        target.x = a.x + b.x;
        target.y = a.y + b.y;
        target.z = a.z + b.z;
        return target;
    }

    /**
     * @internal
     * @param current 
     * @param target 
     * @param currentVelocity 
     * @param smoothTime 
     * @param maxSpeed 
     * @param deltaTime 
     * @returns 
     */
    public static smoothDamp(current: Vector3, target: Vector3, currentVelocity: Vector3, smoothTime: number, maxSpeed: number, deltaTime: number) {
        // smoothTime = Math.max(0.0001, smoothTime);
        // let num = 2 / smoothTime;
        // let num2 = num * deltaTime;
        // let num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
        // let vector = Vector3.Sub(current, target);
        // let vector2 = target;
        // let maxLength = maxSpeed * smoothTime;
        // vector.clampLength(-maxLength, maxLength);
        // target = Vector3.Sub(current, vector, target);
        // let vector3 = Vector3.Add(currentVelocity, vector.scaleBy(num));
        // vector3.x = vector3.x + (vector.x - vector3.x) * num3;
        // vector3.y = vector3.y + (vector.y - vector3.y) * num3;
        // vector3.z = vector3.z + (vector.z - vector3.z) * num3;
        // currentVelocity = Vector3.Sub( vector3 , vector);
        // return target + (vector - vector2) * num3;
        return null;
    }

    /**
     * Calculate the distance between two vectors
     * @param pt1 Vector 1
     * @param pt2 Vector 2
     * @returns number The distance between two vectors
     */
    public static distance(pt1: Vector3, pt2: Vector3): number {
        var x: number = pt1.x - pt2.x;
        var y: number = pt1.y - pt2.y;
        var z: number = pt1.z - pt2.z;
        return Math.sqrt(x * x + y * y + z * z);
    }

    /**
     * Calculate the distance between two vectors XZ axes
     * @param pt1 Vector 1
     * @param pt2 Vector 2
     * @returns number The distance between two vectors
     */
    public static distanceXZ(pt1: Vector3, pt2: Vector3): number {
        var x: number = pt1.x - pt2.x;
        var y: number = 0;
        var z: number = pt1.z - pt2.z;
        return Math.sqrt(x * x + y * y + z * z);
    }

    /**
     * Sets the current vector x, y, z, and w components
     * @param x 
     * @param y 
     * @param z 
     * @param w 
     * @returns 
     */
    public set(x: number, y: number, z: number, w: number = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    /**
     * The vector is added to the vector
     * @param a Additive vector
     * @param target Return vector
     * @returns result
    */
    public add(a: Vector3, target: Vector3 = null): Vector3 {
        if (!target) {
            target = new Vector3();
        }

        var a0x: number = this.x;
        var a0y: number = this.y;
        var a0z: number = this.z;
        var a0w: number = this.w;
        var a1x: number = a.x;
        var a1y: number = a.y;
        var a1z: number = a.z;
        var a1w: number = a.w;
        target.setTo(a0x + a1x, a0y + a1y, a0z + a1z, a0w + a1w);
        return target;
    }

    public addXYZW(x: number, y: number, z: number, w: number, target: Vector3 = null): Vector3 {
        if (!target) {
            target = new Vector3();
        }
        var a0x: number = this.x;
        var a0y: number = this.y;
        var a0z: number = this.z;
        var a0w: number = this.w;
        var a1x: number = x;
        var a1y: number = y;
        var a1z: number = z;
        var a1w: number = w;
        target.setTo(a0x + a1x, a0y + a1y, a0z + a1z, a0w + a1w);
        return target;
    }

    /**
     * Clone a vector with the same components as the current vector
     */
    public clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z, this.w);
    }

    /**
     * The components of the source vector are set to the current vector
     * @param src Original vector
     * @returns 
     */
    public copyFrom(src: Vector3): Vector3 {
        var v = this;
        v.x = src.x;
        v.y = src.y;
        v.z = src.z;
        v.w = src.w;
        return v;
    }

    /**
     * You take the cross product of two vectors,
     * The cross product is going to be the perpendicular vector between these two vectors
     * @param a Take the cross product of another vector
     * @returns Vector3 returns the cross product vector
     */
    public crossProduct(a: Vector3, target: Vector3 = null): Vector3 {
        target = target || new Vector3();
        target.x = this.y * a.z - this.z * a.y;
        target.y = this.z * a.x - this.x * a.z;
        target.z = this.x * a.y - this.y * a.x;
        target.w = 1;
        return target;
    }

    /**
     * Subtract two vectors and assign the result to yourself
     * @param a Minus vector
     */
    public decrementBy(a: Vector3): void {
        this.x -= a.x;
        this.y -= a.y;
        this.z -= a.z;
    }

    /**
     * 
     * Calculate the dot product of two vectors and return the Angle relationship between the two vectors
     * @param a The vector that you need to compute
     * @returns number Returns the Angle relationship between two vectors
     */
    public dotProduct(a: Vector3): number {
        return this.x * a.x + this.y * a.y + this.z * a.z;
    }

    // /**
    //  * @language en_US
    //  * @param toCompare The Vector3 object to be compared with the current
    //  *                  Vector3 object.
    //  * @param allFour   An optional parameter that specifies whether the w
    //  *                  property of the Vector3 objects is used in the
    //  *                  comparison.
    //  * @returns 
    //  *          to the current Vector3 object; false if it is not equal.
    //  */

    /**
     * 
     * Find whether the values of two vectors are identical
     * @param toCompare The vector to compare
     * @param allFour The default parameter is 1, whether to compare the w component
     * @returns A value of true if the specified Vector3 object is equal to the current Vector3 object; false if it is not equal.
     */
    public equals(toCompare: Vector3, allFour: boolean = false): boolean {
        return this.x == toCompare.x && this.y == toCompare.y && this.z == toCompare.z && (!allFour || this.w == toCompare.w);
    }

    // /**
    //  * @language en_US
    //  * Increments the value of the x, y, and z elements of the current
    //  * Vector3 object by the values of the x, y, and z elements of a
    //  * specified Vector3 object. Unlike the <code>Vector3.add()</code>
    //  * method, the <code>incrementBy()</code> method changes the current
    //  * Vector3 object and does not return a new Vector3 object.
    //  *
    //  * @param a The Vector3 object to be added to the current Vector3
    //  *          object.
    //  */

    /**
     * The current vector plus is equal to the vector, plus just the x, y, and z components
     * @param a vector
     */
    public incrementBy(a: Vector3) {
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;
    }


    /**
     * The current vector divided by the vector or component
     * @param v The vector or component that you want to divide
     * @returns Vector3 Returns the result of the calculation
     */
    public divide(v): Vector3 {
        if (v instanceof Vector3) return new Vector3(this.x / v.x, this.y / v.y, this.z / v.z);
        else {
            this.x = this.x / v;
            this.y = this.y / v;
            this.z = this.z / v;
        }
        return this;
    }


    /**
     * Sets the current Vector3 object to its inverse. The inverse object
     * is also considered the opposite of the original object. The value of
     * the x, y, and z properties of the current Vector3 object is changed
     * to -x, -y, and -z.
     */
    public negate() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    /**
     * Scales the line segment between(0,0) and the current point to a set
     * length.
     *
     * @param thickness The scaling value. For example, if the current
     * Vector3 object is (0,3,4), and you normalize it to
     * 1, the point returned is at(0,0.6,0.8).
     */
    public normalize(thickness: number = 1): Vector3 {
        let self = this;
        if (this.length != 0) {
            var invLength = thickness / this.length;
            this.x *= invLength;
            this.y *= invLength;
            this.z *= invLength;
            return self;
        }
        return self;
    }

    /**
     * Apply the rotation quaternion
     * @param q quaternion
     * @returns 
     */
    public applyQuaternion(q) {
        const x = this.x,
            y = this.y,
            z = this.z;
        const qx = q.x,
            qy = q.y,
            qz = q.z,
            qw = q.w;

        // calculate quat * vector

        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

        return this;
    }

    /**
     * Scales the current Vector3 object by a scalar, a magnitude. The
     * Vector3 object's x, y, and z elements are multiplied by the scalar
     * number specified in the parameter. For example, if the vector is
     * scaled by ten, the result is a vector that is ten times longer. The
     * scalar can also change the direction of the vector. Multiplying the
     * vector by a negative number reverses its direction.
     *
     * @param s A multiplier (scalar) used to scale a Vector3 object.
     */
    public scaleBy(s: number): Vector3 {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    /**
     * The current vector times the scalar s
     * @param s scalar s
     * @returns 
     */
    public mul(s: number): Vector3 {
        let v = new Vector3();
        v.x = this.x * s;
        v.y = this.y * s;
        v.z = this.z * s;
        return v;
    }

    public scale(s: Vector3): Vector3 {
        this.x *= s.x;
        this.y *= s.y;
        this.z *= s.z;
        return this;
    }

    public scaleToRef(s: number, ref: Vector3): Vector3 {
        if (!ref) {
            ref = new Vector3();
        }

        ref.x = this.x * s;
        ref.y = this.y * s;
        ref.z = this.z * s;
        return ref;
    }

    /**
     * @language en_US
     * Sets the members of Vector3 to the specified values
     *
     * @param xa The first element, such as the x coordinate.
     * @param ya The second element, such as the y coordinate.
     * @param za The third element, such as the z coordinate.
     */
    public setTo(xa: number, ya: number, za: number, wa: number = 1): void {
        this.x = xa;
        this.y = ya;
        this.z = za;
        this.w = wa;
    }

    /**
     * Copy the components of the source vector to this vector
     * @param src Source vector
     * @returns 
     */
    public copy(src: Vector3): this {
        this.x = src.x;
        this.y = src.y;
        this.z = src.z;
        this.w = src.w;
        return this;
    }

    /**
     * @language en_US
     * Subtracts the value of the x, y, and z elements of the current
     * Vector3 object from the values of the x, y, and z elements of
     * another Vector3 object. The <code>subtract()</code> method does not
     * change the current Vector3 object. Instead, this method returns a
     * new Vector3 object with the new values.
     *
     * @param a The Vector3 object to be subtracted from the current
     *          Vector3 object.
     * @returns A new Vector3 object that is the difference between the
     *          current Vector3 and the specified Vector3 object.
     */
    public subtract(a: Vector3, target: Vector3 = null): Vector3 {
        if (!target) {
            target = new Vector3();
        }
        target.setTo(this.x - a.x, this.y - a.y, this.z - a.z);
        return target;
    }

    /**
     * Let's multiply that vector times that vector.
     * @param other Multiplied vectors
     * @param target Returned vector
     * @returns 
     */
    public multiply(other: Vector3, target: Vector3 = null): Vector3 {
        if (!target) {
            target = new Vector3();
        }

        var x0: number = this.x;
        var y0: number = this.y;
        var z0: number = this.z;

        var x1: number = other.x;
        var y1: number = other.y;
        var z1: number = other.z;

        target.setTo(x0 * x1, y0 * y1, z0 * z1);
        return target;
    }

    /**
     * Let's divide this vector by this vector.
     * @param other The vector that divides
     * @param target Returned vector
     * @returns 
     */
    public divided(other: Vector3, target: Vector3 = null): Vector3 {
        if (!target) {
            target = new Vector3();
        }

        var x0: number = this.x;
        var y0: number = this.y;
        var z0: number = this.z;

        var x1: number = other.x;
        var y1: number = other.y;
        var z1: number = other.z;

        target.setTo(x0 / x1, y0 / y1, z0 / z1);
        return target;
    }

    /**
     * Divide that vector by the scalar
     * @param v The scalar that divides
     * @param target Output a Vector3 vector
     * @returns 
     */
    public div(v: number, target?: Vector3): Vector3 {
        if (!target) {
            target = new Vector3();
        }

        var x0: number = this.x;
        var y0: number = this.y;
        var z0: number = this.z;
        var w0: number = this.w;

        target.setTo(x0 / v, y0 / v, z0 / v, w0 / v);
        return target;
    }

    /**
    * Computes the linear interpolation between two Vector3, and the result is the current object
    * @param v0 Vector 1
    * @param v1 Vector 2
    * @param t Interpolation factor
    */
    public lerp(v0: Vector3, v1: Vector3, t: number): void {
        var v0x: number = v0.x,
            v0y: number = v0.y,
            v0z: number = v0.z,
            v0w: number = v0.w;
        var v1x: number = v1.x,
            v1y: number = v1.y,
            v1z: number = v1.z,
            v1w: number = v1.w;

        this.x = (v1x - v0x) * t + v0x;
        this.y = (v1y - v0y) * t + v0y;
        this.z = (v1z - v0z) * t + v0z;
        this.w = (v1w - v0w) * t + v0w;
    }

    /**
     * The x, y, and z components of this vector are rounded upward to the nearest integers.
     * @param min minimum value
     * @param max maximum value
     * @returns 
     */
    public clamp(min: Vector3, max: Vector3): Vector3 {
        // assumes min < max, componentwise

        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        this.z = Math.max(min.z, Math.min(max.z, this.z));

        return this;
    }

    //     /**
    //    *
    //    * Computes the linear interpolation between two Vector3, and the result is the current object
    //    * @param lhs Vector3 1
    //    * @param rhs Vector3 2
    //    * @param t Interpolation factor
    //    */
    //     public slerp(lhs: Vector3, rhs: Vector3, t: number): void {
    //         var lhsMag: number = Math.sqrt(this.Dot(lhs, lhs));
    //         var rhsMag: number = Math.sqrt(this.Dot(rhs, rhs));

    //         if (lhsMag < 0.00001 || rhsMag < 0.00001) {
    //             return this.lerp(lhs, rhs, t);
    //         }

    //         var lerpedMagnitude: number = lhsMag + t * (rhsMag - lhsMag);

    //         var dot: number = this.Dot(lhs, rhs) / (lhsMag * rhsMag);

    //         // direction is almost the same
    //         if (dot > 1.0 - 0.00001) {
    //             return this.lerp(lhs, rhs, t);
    //         }
    //         // directions are almost opposite
    //         else if (dot < -1.0 + 0.00001) {
    //             Vector3.HELP_0.copyFrom(lhs);
    //             var lhsNorm: Vector3 = Vector3.HELP_0.divide(lhsMag);
    //             this.OrthoNormalVectorFast(lhsNorm, Vector3.HELP_1);
    //             var axis: Vector3 = Vector3.HELP_1;
    //             Quaternion.HELP_0.fromAxisAngle(Vector3.HELP_1, 3.1415926 * t * MathConfig.RADIANS_TO_DEGREES);
    //             var m: Matrix4 = Quaternion.HELP_0.toMatrix3D(Matrix4.helpMatrix);
    //             m.transformVector4(lhsNorm, this);
    //             this.scaleBy(lerpedMagnitude);
    //             return;
    //         }
    //         // normal case
    //         else {
    //             lhs.dotProduct;
    //             this.Cross(lhs, rhs, Vector3.HELP_0);
    //             var axis: Vector3 = Vector3.HELP_0;
    //             Vector3.HELP_1.copyFrom(lhs);
    //             var lhsNorm: Vector3 = Vector3.HELP_1.divide(lhsMag);
    //             axis.normalize();
    //             var angle: number = Math.acos(dot) * t;
    //             Quaternion.HELP_0.fromAxisAngle(axis, angle * MathConfig.RADIANS_TO_DEGREES);
    //             var m: Matrix4 = Quaternion.HELP_0.toMatrix3D(Matrix4.helpMatrix);
    //             m.transformVector4(lhsNorm, this);
    //             this.scaleBy(lerpedMagnitude);
    //             return;
    //         }
    //     }

    /**
     * Returns the string form of the current vector
     * @returns 
     */
    public toString(): string {
        return '<' + this.x + ', ' + this.y + ', ' + this.z + '>';
    }

    //  */
    // public vertical(a: Vector3, dir: Vector3, target: Vector3) {
    //   let DoT = Vector3.dot(dir, target);
    //   if (DoT > 0) {
    //     target.x = a.y;
    //     target.y = -a.x;
    //   } else {
    //     target.x = -a.y;
    //     target.y = a.x;
    //   }
    // }

    public normalizeToWay2D_XY() {
        let tx = Math.abs(this.x);
        let ty = Math.abs(this.y);
        if (tx > ty) {
            if (this.x > 0) {
                this.copyFrom(Vector3.RIGHT);
            } else {
                this.copyFrom(Vector3.LEFT);
            }
        } else {
            if (this.y > 0) {
                this.copyFrom(Vector3.DOWN);
            } else {
                this.copyFrom(Vector3.UP);
            }
        }
    }

    public toArray() {
        return [this.x, this.y, this.z];
    }

    public copyToBytes(byte: DataView) {
        byte.setFloat32(0 * Float32Array.BYTES_PER_ELEMENT, this.x, true);
        byte.setFloat32(1 * Float32Array.BYTES_PER_ELEMENT, this.y, true);
        byte.setFloat32(2 * Float32Array.BYTES_PER_ELEMENT, this.z, true);
    }

    /**
     * The cross product of two Vector3s is this cross product of a
     * The cross product is going to be the perpendicular vector between these two vectors
     * @param a Take the cross product of another vector
     * @returns Vector3 Returns the cross product vector
     */
    public cross(a: Vector3, target: Vector3 = null): Vector3 {
        target = target || new Vector3();
        target.x = this.y * a.z - this.z * a.y;
        target.y = this.z * a.x - this.x * a.z;
        target.z = this.x * a.y - this.y * a.x;
        target.w = 1;
        return target;
    }

    public multiplyScalar(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;

        return this;
    }

    public setFromArray(array: number[], firstElementPos: number = 0) {
        this.x = array[firstElementPos];
        this.y = array[firstElementPos + 1];
        this.z = array[firstElementPos + 2];
    }

    public divideScalar(scalar) {
        return this.multiplyScalar(1 / scalar);
    }

    public clampLength(min: number, max: number) {
        let length = this.length;
        return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
    }

    public setScalar(value: number) {
        this.x = value;
        this.y = value;
        this.z = value;
        return this;
    }

    private static calAngle(cx, cy, x, y) {
        const radian = getCosBy2pt(x, y, cx, cy);
        let angle = (Math.acos(radian) * 180) / Math.PI;

        if (x < cx) angle = -angle;
        // console.log(angle)
        return angle;

        // Calculate the vector formed by point 1 and point 2
        function getCosBy2pt(x, y, cx, cy) {
            // Dot product formula
            let a = [x - cx, y - cy];
            let b = [0, -1];
            return calCos(a, b);
        }
        function calCos(a, b) {
            let dotProduct = a[0] * b[0] + a[1] * b[1];
            let d = Math.sqrt(a[0] * a[0] + a[1] * a[1]) * Math.sqrt(b[0] * b[0] + b[1] * b[1]);
            return dotProduct / d;
        }
    }
}


