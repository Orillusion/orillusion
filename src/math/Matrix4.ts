import { DEGREES_TO_RADIANS, clamp, RADIANS_TO_DEGREES } from './MathUtil';
import { Orientation3D } from './Orientation3D';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

const EPSILON: number = 0.000001;

/**
 * math 4*4 matrix
 * @group Math
 */
export class Matrix4 {

    /**
     * matrix44 bytes block size 
     */
    public static blockBytes: number = 16 * 4;

    /**
     * @internal
     */
    public static block: number = 16;

    /**
     * matrix do total count 
     */
    public static allocCount: number = 0;

    /**
     * matrix has max limit count
     */
    public static maxCount: number = 200000;

    /**
     * current matrix use count 
     */
    public static useCount: number = 0;

    /**
     * @internal
     */
    public static buffer: ArrayBuffer;

    /**
     * @internal
     * wasm use memory use first ptr
     */
    public static wasmMatrixPtr: number = 0;

    /**
     * matrix do use share bytesArray
     */
    public static matrixBytes: Float32Array;

    /**
     * cache all use do matrix 
     */
    public static globalMatrixRef: Matrix4[];

    /**
     * @internal
     */
    public static wasm: any;

    /**
     * help fix global matrix 0 
     */
    public static help_matrix_0: Matrix4;

    /**
     * help fix global matrix 1 
     */
    public static help_matrix_1: Matrix4;

    /**
     * help fix global matrix 2 
     */
    public static help_matrix_2: Matrix4;

    /**
     * help fix global matrix 3 
     */
    public static helpMatrix: Matrix4;

    /**
     * help fix global matrix 4 
     */
    public static helpMatrix2: Matrix4;

    private static _getEulerMatrix: Matrix4;
    private static _zero: Vector3 = new Vector3(0, 0, 0);
    private static _one: Vector3 = new Vector3(1, 1, 1);
    private static _prs: Vector3[] = [new Vector3(), new Vector3(), new Vector3()];


    /**
    * matrix index at global matrix list 
    */
    public index: number = 0;

    /**
     * @internal
     */
    public offset: number = 0;

    /**
     * matrix raw data format Float32Array
     * @see {@link Float32Array}
     * @version Orillusion3D  0.5.1
     */
    public rawData: Float32Array;

    private _position: Vector3;


    /**
    * alloc web runtime cpu memory totalCount * 4(float) * 4
    * init matrix memory by totalCount * 4(float) * 4
    * @param count every alloc matrix count
    * @version Orillusion3D  0.5.1
    */
    public static allocMatrix(allocCount: number) {
        this.allocCount = allocCount;

        Matrix4.matrixBytes = new Float32Array(allocCount * 16);
        Matrix4.buffer = Matrix4.matrixBytes.buffer;
        Matrix4.wasmMatrixPtr = 0;

        this.globalMatrixRef ||= [];
        this.globalMatrixRef.forEach((m) => {
            let rawData = m.rawData;
            m.rawData = new Float32Array(Matrix4.matrixBytes.buffer, m.offset, 16);
            for (let i = 0; i < rawData.length; i++) {
                m.rawData[i] = rawData[i];
            }
        });

        Matrix4.help_matrix_0 ||= new Matrix4();
        Matrix4.help_matrix_1 ||= new Matrix4();
        Matrix4.help_matrix_2 ||= new Matrix4();
        Matrix4.helpMatrix ||= new Matrix4();
        Matrix4.helpMatrix2 ||= new Matrix4();
        Matrix4._getEulerMatrix ||= new Matrix4();
        Matrix4._getEulerMatrix.identity();
    }

    /**
     * create matrix from two direction
     * @param fromDirection first direction
     * @param toDirection  second direction
     * @param target ref matrix
     * @returns return new one matrix
     * @version Orillusion3D  0.5.1
     */
    public static fromToRotation(fromDirection: Vector3, toDirection: Vector3, target?: Matrix4): Matrix4 {
        target ||= new Matrix4();
        target.transformDir(fromDirection, toDirection);
        return target;
    }

    /**
     * Generate a matrix (rotate degrees with x,y,z as the center axis)
     * @param x x on the central axis
     * @param y y on the central axis
     * @param z z on the central axis
     * @param degrees rotation angle
     * @returns Matrix4 result
     * @version Orillusion3D  0.5.1
     */
    public static getAxisRotation(x: number, y: number, z: number, degrees: number): Matrix4 {
        let m: Matrix4 = new Matrix4();

        let rad = degrees * (Math.PI / 180);
        let c: number = Math.cos(rad);
        let s: number = Math.sin(rad);
        let t: number = 1 - c;
        let tmp1: number, tmp2: number;

        m.rawData[0] = c + x * x * t;
        m.rawData[5] = c + y * y * t;
        m.rawData[10] = c + z * z * t;

        tmp1 = x * y * t;
        tmp2 = z * s;
        m.rawData[1] = tmp1 + tmp2;
        m.rawData[4] = tmp1 - tmp2;
        tmp1 = x * z * t;
        tmp2 = y * s;
        m.rawData[8] = tmp1 + tmp2;
        m.rawData[2] = tmp1 - tmp2;
        tmp1 = y * z * t;
        tmp2 = x * s;
        m.rawData[9] = tmp1 - tmp2;
        m.rawData[6] = tmp1 + tmp2;

        return m;
    }


    /**
     * Arrange the Euler values
     * @param euler Euler values
     */
    public static sanitizeEuler(euler: Vector3): void {
        Matrix4.makePositive(euler);
    }

    /**
     *
     * @param euler
     */
    public static makePositive(euler: Vector3): void {
        let negativeFlip = -0.0001;
        let positiveFlip = Math.PI * 2.0 - 0.0001;

        if (euler.x < negativeFlip) {
            euler.x += 2.0 * Math.PI;
        }
        else if (euler.x > positiveFlip) {
            euler.x -= 2.0 * Math.PI;
        }

        if (euler.y < negativeFlip) {
            euler.y += 2.0 * Math.PI;
        }
        else if (euler.y > positiveFlip) {
            euler.y -= 2.0 * Math.PI;
        }

        if (euler.z < negativeFlip) {
            euler.z += 2.0 * Math.PI;
        }
        else if (euler.z > positiveFlip) {
            euler.z -= 2.0 * Math.PI;
        }
    }

    /**
     * Convert the matrix to Euler angles
     * @param matrix Matrix to be transformed
     * @param v euler angle
     * @returns
     */
    public static matrixToEuler(matrix: Matrix4, v: Vector3) {
        // from http://www.geometrictools.com/Documentation/EulerAngles.pdf
        // YXZ order
        if (matrix.get(1, 2) < 0.999) {
            // some fudge for imprecision
            if (matrix.get(1, 2) > -0.999) {
                // some fudge for imprecision
                v.x = Math.asin(-matrix.get(1, 2));
                v.y = Math.atan2(matrix.get(0, 2), matrix.get(2, 2));
                v.z = Math.atan2(matrix.get(1, 0), matrix.get(1, 1));
                Matrix4.sanitizeEuler(v);
                return true;
            } else {
                // WARNING.  Not unique.  YA - ZA = atan2(r01,r00)
                v.x = Math.PI * 0.5;
                v.y = Math.atan2(matrix.get(0, 1), matrix.get(0, 0));
                v.z = 0.0;
                Matrix4.sanitizeEuler(v);
                return false;
            }
        } else {
            // WARNING.  Not unique.  YA + ZA = atan2(-r01,r00)
            v.x = -Math.PI * 0.5;
            v.y = Math.atan2(-matrix.get(0, 1), matrix.get(0, 0));
            v.z = 0.0;
            Matrix4.sanitizeEuler(v);
            return false;
        }
    }


    /**
     * Multiply the world matrix, specifying parameters and results according to the index
     * @param aMat Matrix to be multiplied (please specify index)
     * @param bMat Matrix to be multiplied (please specify index)
     * @param target_Mat Result matrix (get results based on index)
     */
    public static matrixMultiply(aMat: Matrix4, bMat: Matrix4, target_Mat: Matrix4): void {
        Matrix4.wasm.Matrix_Multiply(aMat.index, bMat.index, target_Mat.index);
    }

    /**
     * World matrix extension, according to the index to specify parameters and results
     * @param aMat Matrix to be multiplied (please specify index)
     * @param bMat Matrix to be multiplied (please specify index)
     * @param target_Mat Result matrix (get results based on index)
     */
    public static matrixAppend(aMat: Matrix4, bMat: Matrix4, target_Mat: Matrix4): void {
        Matrix4.wasm.Matrix_Append(aMat.index, bMat.index, target_Mat.index);
    }

    /**
     * The Y-axis is rotated between the world matrix, and the parameters and results are specified according to the index
     * @param aMat Matrix to be multiplied (please specify index)
     * @param bMat Matrix to be multiplied (please specify index)
     * @param target_Mat Result matrix (get results based on index)
     */
    public static matrixRotateY(rad: number, target_Mat: Matrix4): void {
        Matrix4.wasm.Matrix_Append(rad, target_Mat.index);
    }

    /**
     * Rotate the world matrix, specifying parameters and results according to the index
     * @param aMat Matrix to be multiplied (please specify index)
     * @param bMat Matrix to be multiplied (please specify index)
     * @param target_Mat Result matrix (get results based on index)
     */
    public static matrixRotate(rad: number, axis: Vector3, target_Mat: Matrix4): void {
        Matrix4.wasm.Matrix_Rotate(rad, axis, target_Mat.index);
    }


    /**
     * 
     * @param local -- 
     */
    constructor(doMatrix: boolean = false) {
        // if (doMatrix) {
        if (Matrix4.useCount >= Matrix4.allocCount) {
            Matrix4.allocMatrix(Matrix4.allocCount + 1000);
        }

        this.index = Matrix4.useCount;
        this.offset = Matrix4.useCount * Matrix4.blockBytes + Matrix4.wasmMatrixPtr;

        Matrix4.globalMatrixRef[this.index] = this;
        Matrix4.useCount++;
        // console.log(this.index);
        this.rawData = new Float32Array(Matrix4.matrixBytes.buffer, this.offset, 16);
        // } else {
        //     this.rawData = new Float32Array(16);
        // }

        this._position = new Vector3();

        this.identity();
    }

    /**
     * current matrix move position and rotation to target 
     * @param eye eye position
     * @param at target position
     * @param up normalize axis way
     * @version Orillusion3D  0.5.1
     */
    public lookAt(eye: Vector3, at: Vector3, up: Vector3 = Vector3.Y_AXIS): void {
        let data = this.rawData;
        at.subtract(eye, Vector3.HELP_0);
        let zAxis: Vector3 = Vector3.HELP_0;
        if (zAxis.length < 0.0001) {
            zAxis.z = 1;
        }
        zAxis.normalize();
        let xAxis: Vector3 = up.crossProduct(zAxis, Vector3.HELP_1);

        if (xAxis.length < 0.0001) {
            if (Math.abs(up.z) > 0.9999) {
                zAxis.x += 0.0001;
            } else {
                zAxis.z += 0.0001;
            }
        }

        zAxis.normalize();
        up.cross(zAxis, xAxis);


        xAxis.normalize(); //
        let yAxis = zAxis.crossProduct(xAxis, Vector3.HELP_2);

        data[0] = xAxis.x;
        data[1] = yAxis.x;
        data[2] = zAxis.x;
        data[3] = 0;

        data[4] = xAxis.y;
        data[5] = yAxis.y;
        data[6] = zAxis.y;
        data[7] = 0;

        data[8] = xAxis.z;
        data[9] = yAxis.z;
        data[10] = zAxis.z;
        data[11] = 0;

        data[12] = -xAxis.dotProduct(eye);
        data[13] = -yAxis.dotProduct(eye);
        data[14] = -zAxis.dotProduct(eye);

        data[15] = 1;
    }

    private static float32Array = new Float32Array(16).fill(0);

    /**
     * matrix multiply
     * @param mat4 multiply target
     * @version Orillusion3D  0.5.1
     */
    public multiply(mat4: Matrix4): void {
        let a = this.rawData;
        let b = mat4.rawData;
        let r = Matrix4.float32Array;

        r[0] = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
        r[1] = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
        r[2] = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
        r[3] = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];

        r[4] = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
        r[5] = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
        r[6] = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
        r[7] = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];

        r[8] = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
        r[9] = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
        r[10] = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
        r[11] = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];

        r[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
        r[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
        r[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
        r[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];

        a[0] = r[0];
        a[1] = r[1];
        a[2] = r[2];
        a[3] = r[3];
        a[4] = r[4];
        a[5] = r[5];
        a[6] = r[6];
        a[7] = r[7];
        a[8] = r[8];
        a[9] = r[9];
        a[10] = r[10];
        a[11] = r[11];
        a[12] = r[12];
        a[13] = r[13];
        a[14] = r[14];
        a[15] = r[15];
    }

    /**
     * 
     * @param a 
     * @param b 
     * @returns 
     */
    public multiplyMatrices(a: Matrix4, b: Matrix4) {

        const ae = a.rawData;
        const be = b.rawData;
        const te = this.rawData;

        const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
        const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
        const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
        const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

        const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
        const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
        const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
        const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

        te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

        te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

        te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

        te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

        return this;

    }

    /**
     * convert a vector3 to this matrix space
     * if output not set , return a new one
     * @param v target vector3
     * @param output save target
     * @returns save target
     */
    public multiplyPoint3(v: Vector3, output?: Vector3): Vector3 {
        output ||= new Vector3();
        let rawData = this.rawData;
        output.x = rawData[0] * v.x + rawData[4] * v.y + rawData[8] * v.z + rawData[12];
        output.y = rawData[1] * v.x + rawData[5] * v.y + rawData[9] * v.z + rawData[13];
        output.z = rawData[2] * v.x + rawData[6] * v.y + rawData[10] * v.z + rawData[14];
        return output;
    }

    public multiplyVector4(a: Vector3, out?: Vector3) {
        out ||= new Vector3();
        let m = this.rawData;
        let x = a.x;
        let y = a.y;
        let z = a.z;
        let w = m[3] * x + m[7] * y + m[11] * z + m[15];
        w = w || 1.0;
        out.x = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
        out.y = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
        out.z = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
        out.w = 1;
        return out;
    }

    /**
     * @private
     */
    public perspectiveB(fov: number, aspect: number, near: number, far: number): Matrix4 {
        let y = Math.tan((fov * Math.PI) / 360) * near;
        let x = y * aspect;
        return this.frustum(-x, x, -y, y, near, far);
    }

    /**
     * convert a vector3 to this matrix space
     * if output not set , return a new one
     * @param v convert target
     * @param target ref one vector3
     * @returns Vector3 
     * @version Orillusion3D  0.5.1
     */
    public transformVector4(v: Vector3, target?: Vector3): Vector3 {
        let data: Float32Array = this.rawData;

        target ||= new Vector3();

        let x: number = v.x;
        let y: number = v.y;
        let z: number = v.z;
        let w: number = v.w;

        target.x = x * data[0] + y * data[4] + z * data[8] + w * data[12];
        target.y = x * data[1] + y * data[5] + z * data[9] + w * data[13];
        target.z = x * data[2] + y * data[6] + z * data[10] + w * data[14];
        target.w = x * data[3] + y * data[7] + z * data[11] + w * data[15];

        return target;
    }

    /**
     * Convert projection coordinates to 3D coordinates
     * @param v vector3 target
     * @param output ref vector3d
     * @returns
     */
    public perspectiveMultiplyPoint3(v: Vector3, output: Vector3): boolean {
        let res: Vector3 = Vector3.HELP_2;
        let w: number;
        let rawData = this.rawData;
        res.x = rawData[0] * v.x + rawData[4] * v.y + rawData[8] * v.z + rawData[12];
        res.y = rawData[1] * v.x + rawData[5] * v.y + rawData[9] * v.z + rawData[13];
        res.z = rawData[2] * v.x + rawData[6] * v.y + rawData[10] * v.z + rawData[14];
        w = rawData[3] * v.x + rawData[7] * v.y + rawData[11] * v.z + rawData[15];
        if (Math.abs(w) > 1.0e-7) {
            let invW = 1.0 / w;
            output.x = res.x * invW;
            output.y = res.y * invW;
            output.z = res.z * invW;
            return true;
        } else {
            output.x = 0.0;
            output.y = 0.0;
            output.z = 0.0;
            return false;
        }
    }

    /**
     * set matrix perspective 
     * @param fov perspective angle 0 ~ 90
     * @param aspect aspect ratio
     * @param zn near plane
     * @param zf far plane
     * @version Orillusion3D  0.5.1
     */
    public perspective(fov: number, aspect: number, zn: number, zf: number) {
        let data = this.rawData;
        // let angle: number = (Math.Math.PI - fov * DEGREES_TO_RADIANS) / 2.0;
        // let yScale: number = Math.tan(angle);
        // let xScale: number = yScale / aspect;

        let angle: number = (fov * DEGREES_TO_RADIANS) / 2.0;
        let f = Math.cos(angle) / Math.sin(angle);
        // 0.5 / tan
        data[0] = -f / aspect;
        // data[0] = xScale;
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;

        data[4] = 0;
        data[5] = f;
        data[6] = 0;
        data[7] = 0;

        data[8] = 0;
        data[9] = 0;
        data[10] = zf / (zf - zn);
        data[11] = 1;

        data[12] = 0;
        data[13] = 0;
        data[14] = (-zn * zf) / (zf - zn);
        data[15] = 0;
    }

    /**
     * @version Orillusion3D  0.5.1
     * set matrix orthogonal projection
     * @param w screen width
     * @param h screen height
     * @param zn camera near plane
     * @param zf camera far plane
     * @returns this matrix
     */
    public ortho(w: number, h: number, zn: number, zf: number) {
        let data = this.rawData;

        data[0] = 2 / w;
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;

        data[4] = 0;
        data[5] = 2 / h;
        data[6] = 0;
        data[7] = 0;

        data[8] = 0;
        data[9] = 0;
        data[10] = 1 / (zf - zn);
        data[11] = 0;

        data[12] = 0;
        data[13] = 0;
        data[14] = zn / (zn - zf);
        data[15] = 1;

        return this
    }

    /**
     * set matrix orthogonal projection by view side
     * @param left orthogonal view left
     * @param right orthogonal view right
     * @param bottom orthogonal view bottom
     * @param top orthogonal view top
     * @param near camera near plane
     * @param far camera far plane
     * @returns this matrix
     */
    public orthoZO(left: number, right: number, bottom: number, top: number, near: number, far: number) {
        let data = this.rawData;
        let lr = 1 / (left - right);
        let bt = 1 / (bottom - top);
        let nf = 1 / (near - far);
        data[0] = -2 * lr;
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;
        data[4] = 0;
        data[5] = -2 * bt;
        data[6] = 0;
        data[7] = 0;
        data[8] = 0;
        data[9] = 0;
        data[10] = nf;
        data[11] = 0;
        data[12] = (left + right) * lr;
        data[13] = (top + bottom) * bt;
        data[14] = near * nf;
        data[15] = 1;
        return this;
    }

    /**
     * set matrix orthogonal projection by view center
     */
    public orthoOffCenter(l: number, r: number, b: number, t: number, zn: number, zf: number) {
        let data = this.rawData;

        data[0] = 2 / (r - l);
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;

        data[4] = 0;
        data[5] = 2 / (t - b);
        data[6] = 0;
        data[7] = 0;

        data[8] = 0;
        data[9] = 0;
        data[10] = 1.0 / (zf - zn);
        data[11] = 0;

        data[12] = (l + r) / (l - r);
        data[13] = (t + b) / (b - t);
        data[14] = zn / (zn - zf);
        data[15] = 1;
    }

    /**
     * set matrix from two direction
     * @param fromDirection first direction
     * @param toDirection second direction
     * @version Orillusion3D  0.5.1
     */
    public transformDir(fromDirection: Vector3, toDirection: Vector3) {
        let data = this.rawData;

        let EPSILON: number = 0.000001;
        let v: Vector3 = Vector3.HELP_0;
        toDirection.crossProduct(fromDirection, v);
        let e: number = toDirection.dotProduct(fromDirection);

        if (e > 1.0 - EPSILON) {
            this.identity();
        } else if (3 < -1.0 + EPSILON) {
            let up: Vector3 = Vector3.HELP_1;
            let left: Vector3 = Vector3.HELP_2; //
            let invLen: number = 0;

            let fxx;
            let fyy;
            let fzz;
            let fxy;
            let fxz;
            let fyz;
            let uxx;
            let uyy;
            let uzz;
            let uxy;
            let uxz;
            let uyz;
            let lxx;
            let lyy;
            let lzz;
            let lxy;
            let lxz;
            let lyz;

            left.x = 0.0;
            left.y = fromDirection.z;
            left.z = -fromDirection.y;
            if (left.dotProduct(left) < EPSILON) {
                left.x = -fromDirection.z;
                left.y = 0.0;
                left.z = fromDirection.x;
            }
            /* normalize "left" */
            invLen = 1.0 / Math.sqrt(left.dotProduct(left));
            left.x *= invLen;
            left.y *= invLen;
            left.z *= invLen;

            left.crossProduct(fromDirection, up);

            fxx = -fromDirection.x * fromDirection.x;
            fyy = -fromDirection.y * fromDirection.y;
            fzz = -fromDirection.z * fromDirection.z;
            fxy = -fromDirection.x * fromDirection.y;
            fxz = -fromDirection.x * fromDirection.z;
            fyz = -fromDirection.y * fromDirection.z;

            uxx = up.x * up.x;
            uyy = up.y * up.y;
            uzz = up.z * up.z;
            uxy = up.x * up.y;
            uxz = up.x * up.z;
            uyz = up.y * up.z;

            lxx = -left.x * left.x;
            lyy = -left.y * left.y;
            lzz = -left.z * left.z;
            lxy = -left.x * left.y;
            lxz = -left.x * left.z;
            lyz = -left.y * left.z;

            data[0] = fxx + uxx + lxx;
            data[1] = fxy + uxy + lxy;
            data[2] = fxz + uxz + lxz;
            data[4] = data[1];
            data[5] = fyy + uyy + lyy;
            data[6] = fyz + uyz + lyz;
            data[8] = data[2];
            data[9] = data[6];
            data[10] = fzz + uzz + lzz;

            data[3] = 0;
            data[7] = 0;
            data[11] = 0;
            data[15] = 1;
        } else {
            let hvx;
            let hvz;
            let hvxy;
            let hvxz;
            let hvyz;

            let h = (1.0 - e) / v.dotProduct(v);
            hvx = h * v.x;
            hvz = h * v.z;
            hvxy = hvx * v.y;
            hvxz = hvx * v.z;
            hvyz = hvz * v.y;
            data[0] = e + hvx * v.x;
            data[1] = hvxy - v.z;
            data[2] = hvxz + v.y;
            data[4] = hvxy + v.z;
            data[5] = e + h * v.y * v.y;
            data[6] = hvyz - v.x;
            data[8] = hvxz - v.y;
            data[9] = hvyz + v.x;
            data[10] = e + hvz * v.z;

            data[3] = 0;
            data[7] = 0;
            data[11] = 0;
            data[15] = 1;
        }
    }

    /**
     * multiply matrix a b
     * @param lhs target matrix
     * @version Orillusion3D  0.5.1
     */
    public append(lhs: Matrix4): void {
        let data = this.rawData;
        let m111: number = data[0];
        let m121: number = data[4];
        let m131: number = data[8];
        let m141: number = data[12];
        let m112: number = data[1];
        let m122: number = data[5];
        let m132: number = data[9];
        let m142: number = data[13];
        let m113: number = data[2];
        let m123: number = data[6];
        let m133: number = data[10];
        let m143: number = data[14];
        let m114: number = data[3];
        let m124: number = data[7];
        let m134: number = data[11];
        let m144: number = data[15];

        data[0] = m111 * lhs.rawData[0] + m112 * lhs.rawData[4] + m113 * lhs.rawData[8] + m114 * lhs.rawData[12];
        data[1] = m111 * lhs.rawData[1] + m112 * lhs.rawData[5] + m113 * lhs.rawData[9] + m114 * lhs.rawData[13];
        data[2] = m111 * lhs.rawData[2] + m112 * lhs.rawData[6] + m113 * lhs.rawData[10] + m114 * lhs.rawData[14];
        data[3] = m111 * lhs.rawData[3] + m112 * lhs.rawData[7] + m113 * lhs.rawData[11] + m114 * lhs.rawData[15];

        data[4] = m121 * lhs.rawData[0] + m122 * lhs.rawData[4] + m123 * lhs.rawData[8] + m124 * lhs.rawData[12];
        data[5] = m121 * lhs.rawData[1] + m122 * lhs.rawData[5] + m123 * lhs.rawData[9] + m124 * lhs.rawData[13];
        data[6] = m121 * lhs.rawData[2] + m122 * lhs.rawData[6] + m123 * lhs.rawData[10] + m124 * lhs.rawData[14];
        data[7] = m121 * lhs.rawData[3] + m122 * lhs.rawData[7] + m123 * lhs.rawData[11] + m124 * lhs.rawData[15];

        data[8] = m131 * lhs.rawData[0] + m132 * lhs.rawData[4] + m133 * lhs.rawData[8] + m134 * lhs.rawData[12];
        data[9] = m131 * lhs.rawData[1] + m132 * lhs.rawData[5] + m133 * lhs.rawData[9] + m134 * lhs.rawData[13];
        data[10] = m131 * lhs.rawData[2] + m132 * lhs.rawData[6] + m133 * lhs.rawData[10] + m134 * lhs.rawData[14];
        data[11] = m131 * lhs.rawData[3] + m132 * lhs.rawData[7] + m133 * lhs.rawData[11] + m134 * lhs.rawData[15];

        data[12] = m141 * lhs.rawData[0] + m142 * lhs.rawData[4] + m143 * lhs.rawData[8] + m144 * lhs.rawData[12];
        data[13] = m141 * lhs.rawData[1] + m142 * lhs.rawData[5] + m143 * lhs.rawData[9] + m144 * lhs.rawData[13];
        data[14] = m141 * lhs.rawData[2] + m142 * lhs.rawData[6] + m143 * lhs.rawData[10] + m144 * lhs.rawData[14];
        data[15] = m141 * lhs.rawData[3] + m142 * lhs.rawData[7] + m143 * lhs.rawData[11] + m144 * lhs.rawData[15];
    }

    /**
     * matrix a add matrix b
     * @param lhs target matrix.
     * @returns Matrix4 result.
     * @version Orillusion3D  0.5.1
     */
    public add(lhs: Matrix4): Matrix4 {
        let data = this.rawData;
        let m111: number = data[0];
        let m121: number = data[4];
        let m131: number = data[8];
        let m141: number = data[12];
        let m112: number = data[1];
        let m122: number = data[5];
        let m132: number = data[9];
        let m142: number = data[13];
        let m113: number = data[2];
        let m123: number = data[6];
        let m133: number = data[10];
        let m143: number = data[14];
        let m114: number = data[3];
        let m124: number = data[7];
        let m134: number = data[11];
        let m144: number = data[15];
        let m211: number = lhs.rawData[0];
        let m221: number = lhs.rawData[4];
        let m231: number = lhs.rawData[8];
        let m241: number = lhs.rawData[12];
        let m212: number = lhs.rawData[1];
        let m222: number = lhs.rawData[5];
        let m232: number = lhs.rawData[9];
        let m242: number = lhs.rawData[13];
        let m213: number = lhs.rawData[2];
        let m223: number = lhs.rawData[6];
        let m233: number = lhs.rawData[10];
        let m243: number = lhs.rawData[14];
        let m214: number = lhs.rawData[3];
        let m224: number = lhs.rawData[7];
        let m234: number = lhs.rawData[11];
        let m244: number = lhs.rawData[15];

        data[0] = m111 + m211;
        data[1] = m112 + m212;
        data[2] = m113 + m213;
        data[3] = m114 + m214;

        data[4] = m121 + m221;
        data[5] = m122 + m222;
        data[6] = m123 + m223;
        data[7] = m124 + m224;

        data[8] = m131 + m231;
        data[9] = m132 + m232;
        data[10] = m133 + m233;
        data[11] = m134 + m234;

        data[12] = m141 + m241;
        data[13] = m142 + m242;
        data[14] = m143 + m243;
        data[15] = m144 + m244;
        return this;
    }

    /**
     * matrix a sub matrix b
     * @param lhs target matrix b.
     * @returns Matrix4 .
     * @version Orillusion3D  0.5.1
     */
    public sub(lhs: Matrix4): Matrix4 {
        let data = this.rawData;

        let m111: number = data[0];
        let m121: number = data[4];
        let m131: number = data[8];
        let m141: number = data[12];
        let m112: number = data[1];
        let m122: number = data[5];
        let m132: number = data[9];
        let m142: number = data[13];
        let m113: number = data[2];
        let m123: number = data[6];
        let m133: number = data[10];
        let m143: number = data[14];
        let m114: number = data[3];
        let m124: number = data[7];
        let m134: number = data[11];
        let m144: number = data[15];
        let m211: number = lhs.rawData[0];
        let m221: number = lhs.rawData[4];
        let m231: number = lhs.rawData[8];
        let m241: number = lhs.rawData[12];
        let m212: number = lhs.rawData[1];
        let m222: number = lhs.rawData[5];
        let m232: number = lhs.rawData[9];
        let m242: number = lhs.rawData[13];
        let m213: number = lhs.rawData[2];
        let m223: number = lhs.rawData[6];
        let m233: number = lhs.rawData[10];
        let m243: number = lhs.rawData[14];
        let m214: number = lhs.rawData[3];
        let m224: number = lhs.rawData[7];
        let m234: number = lhs.rawData[11];
        let m244: number = lhs.rawData[15];

        data[0] = m111 - m211;
        data[1] = m112 - m212;
        data[2] = m113 - m213;
        data[3] = m114 - m214;

        data[4] = m121 - m221;
        data[5] = m122 - m222;
        data[6] = m123 - m223;
        data[7] = m124 - m224;

        data[8] = m131 - m231;
        data[9] = m132 - m232;
        data[10] = m133 - m233;
        data[11] = m134 - m234;

        data[12] = m141 - m241;
        data[13] = m142 - m242;
        data[14] = m143 - m243;
        data[15] = m144 - m244;
        return this;
    }

    /**
     * Matrix times components.
     * @param v This matrix is going to be multiplied by this value
     * @returns Matrix4 Returns a multiplicative result matrix.
     * @version Orillusion3D  0.5.1
     */
    public mult(v: number): Matrix4 {
        let data = this.rawData;

        data[0] *= v;
        data[1] *= v;
        data[2] *= v;
        data[3] *= v;

        data[4] *= v;
        data[5] *= v;
        data[6] *= v;
        data[7] *= v;

        data[8] *= v;
        data[9] *= v;
        data[10] *= v;
        data[11] *= v;

        data[12] *= v;
        data[13] *= v;
        data[14] *= v;
        data[15] *= v;
        return this;
    }

    // /**
    //  * Create an Euler rotation matrix.
    //  * @param x Angle of rotation around the x axis.
    //  * @param y Angle of rotation around the y axis.
    //  * @param z Angle of rotation around the z axis.
    //  * @version Orillusion3D  0.5.1
    //  */
    // public rotation(x: number, y: number, z: number) {
    //   Quaternion.CALCULATION_QUATERNION.fromEulerAngles(x, y, z);
    //   this.makeTransform(
    //     Matrix4.position_000,
    //     Matrix4.scale_111,
    //     Quaternion.CALCULATION_QUATERNION,
    //   );
    // }

    /**
     Add a direction Angle rotation to the current matrix (the matrix created by rotating degrees according to axis)
     @param degrees Angle of rotation.
     @param axis Angle of rotation around axis axis
     @version Orillusion3D  0.5.1
    */
    public appendRotation(degrees: number, axis: Vector3): void {
        let m: Matrix4 = Matrix4.getAxisRotation(axis.x, axis.y, axis.z, degrees);
        this.append(m);
    }

    /**
     * Create a matrix based on the axis and rotation Angle (the matrix created by rotating the degrees according to the axis)
     * @param degrees Angle of rotation.
     * @param axis Rotation Angle around axis axis. Axis needs to be specified as the orientation of an axis between x/y/z
     * @version Orillusion3D  0.5.1
     */
    public createByRotation(degrees: number, axis: Vector3): void {
        let tmp: Matrix4 = Matrix4.helpMatrix;
        let s: number;
        let c: number;

        let angle: number = degrees * DEGREES_TO_RADIANS;
        s = Math.sin(angle);
        c = Math.cos(angle);

        if (axis.x == 1) {
            tmp.rawData[0] = 1.0;
            tmp.rawData[1] = 0.0;
            tmp.rawData[2] = 0.0;
            tmp.rawData[3] = 0.0;
            tmp.rawData[4] = 0.0;
            tmp.rawData[5] = c;
            tmp.rawData[6] = s;
            tmp.rawData[7] = 0.0;
            tmp.rawData[8] = 0.0;
            tmp.rawData[9] = -s;
            tmp.rawData[10] = c;
            tmp.rawData[11] = 0.0;
            tmp.rawData[12] = 0.0;
            tmp.rawData[13] = 0.0;
            tmp.rawData[14] = 0.0;
            tmp.rawData[15] = 1.0;
        }

        if (axis.y == 1) {
            tmp.rawData[0] = c;
            tmp.rawData[1] = 0.0;
            tmp.rawData[2] = -s;
            tmp.rawData[3] = 0.0;
            tmp.rawData[4] = 0.0;
            tmp.rawData[5] = 1.0;
            tmp.rawData[6] = 0.0;
            tmp.rawData[7] = 0.0;
            tmp.rawData[8] = s;
            tmp.rawData[9] = 0.0;
            tmp.rawData[10] = c;
            tmp.rawData[11] = 0.0;
            tmp.rawData[12] = 0.0;
            tmp.rawData[13] = 0.0;
            tmp.rawData[14] = 0.0;
            tmp.rawData[15] = 1.0;
        }

        if (axis.z == 1) {
            tmp.rawData[0] = c;
            tmp.rawData[1] = s;
            tmp.rawData[2] = 0.0;
            tmp.rawData[3] = 0.0;
            tmp.rawData[4] = -s;
            tmp.rawData[5] = c;
            tmp.rawData[6] = 0.0;
            tmp.rawData[7] = 0.0;
            tmp.rawData[8] = 0.0;
            tmp.rawData[9] = 0.0;
            tmp.rawData[10] = 1.0;
            tmp.rawData[11] = 0.0;
            tmp.rawData[12] = 0.0;
            tmp.rawData[13] = 0.0;
            tmp.rawData[14] = 0.0;
            tmp.rawData[15] = 1.0;
        }

        this.append(tmp);
    }

    /**
     * Append the triaxial scaling value
     * @param xScale x axis scaling
     * @param yScale y axis scaling
     * @param zScale z axis scaling
     * @version Orillusion3D  0.5.1
     */
    public appendScale(xScale: number, yScale: number, zScale: number) {
        Matrix4.helpMatrix.createByScale(xScale, yScale, zScale);
        this.append(Matrix4.helpMatrix);
    }

    /**
     * A scaling matrix is generated and other properties are reset
     * @param xScale x axis scaling
     * @param yScale y axis scaling
     * @param zScale z axis scaling
     * @version Orillusion3D  0.5.1
     */
    public createByScale(xScale: number, yScale: number, zScale: number): void {
        let data = this.rawData;
        data[0] = xScale;
        data[1] = 0.0;
        data[2] = 0.0;
        data[3] = 0.0;
        data[4] = 0.0;
        data[5] = yScale;
        data[6] = 0.0;
        data[7] = 0.0;
        data[8] = 0.0;
        data[9] = 0.0;
        data[10] = zScale;
        data[11] = 0.0;
        data[12] = 0.0;
        data[13] = 0.0;
        data[14] = 0.0;
        data[15] = 1.0;
    }

    /**
     * Plus a translation matrix
     * @param x x axis scaling
     * @param y y axis scaling
     * @param z z axis scaling
     * @version Orillusion3D  0.5.1
     */
    public appendTranslation(x: number, y: number, z: number) {
        let data = this.rawData;
        data[12] += x;
        data[13] += y;
        data[14] += z;
    }

    /**
     * Returns a clone of the current matrix
     * @returns Matrix4 The cloned matrix
     * @version Orillusion3D  0.5.1
     */
    public clone(): Matrix4 {
        let ret: Matrix4 = new Matrix4();
        ret.copyFrom(this);
        return ret;
    }

    /**
     * Assigns a value to one row of the current matrix
     * @param row Row of copy
     * @param Vector3 Value of copy
     * @version Orillusion3D  0.5.1
     */
    public copyRowFrom(row: number, Vector3: Vector3) {
        let data = this.rawData;
        switch (row) {
            case 0:
                data[0] = Vector3.x;
                data[1] = Vector3.y;
                data[2] = Vector3.z;
                data[3] = Vector3.w;
                break;
            case 1:
                data[4] = Vector3.x;
                data[5] = Vector3.y;
                data[6] = Vector3.z;
                data[7] = Vector3.w;
                break;
            case 2:
                data[8] = Vector3.x;
                data[9] = Vector3.y;
                data[10] = Vector3.z;
                data[11] = Vector3.w;
                break;
            case 3:
                data[12] = Vector3.x;
                data[13] = Vector3.y;
                data[14] = Vector3.z;
                data[15] = Vector3.w;
                break;
            default:
            ///throw new ArgumentError("ArgumentError, Column " + column + " out of bounds [0, ..., 3]");
        }
    }

    /**
     * One of the rows in the copy matrix stores the values in Vector3.
     * @param row Row of copy
     * @param Vector3 Copy the storage target
     * @version Orillusion3D  0.5.1
     */
    public copyRowTo(row: number, Vector3: Vector3) {
        let data = this.rawData;
        switch (row) {
            case 0:
                Vector3.x = data[0];
                Vector3.y = data[1];
                Vector3.z = data[2];
                Vector3.w = data[3];
                break;
            case 1:
                Vector3.x = data[4];
                Vector3.y = data[5];
                Vector3.z = data[6];
                Vector3.w = data[7];
                break;
            case 2:
                Vector3.x = data[8];
                Vector3.y = data[9];
                Vector3.z = data[10];
                Vector3.w = data[11];
                break;
            case 3:
                Vector3.x = data[12];
                Vector3.y = data[13];
                Vector3.z = data[14];
                Vector3.w = data[15];
                break;
            default:
            /// throw new ArgumentError("ArgumentError, Column " + column + " out of bounds [0, ..., 3]");
        }
    }

    /**
     * Assigns the value of a matrix to the current matrix.
     * @param sourceMatrix3D source Matrix
     * @returns Returns the current matrix
     * @version Orillusion3D  0.5.1
     */
    public copyFrom(sourceMatrix3D: Matrix4): Matrix4 {
        let data: Float32Array = this.rawData;
        data[0] = sourceMatrix3D.rawData[0];
        data[1] = sourceMatrix3D.rawData[1];
        data[2] = sourceMatrix3D.rawData[2];
        data[3] = sourceMatrix3D.rawData[3];
        data[4] = sourceMatrix3D.rawData[4];
        data[5] = sourceMatrix3D.rawData[5];
        data[6] = sourceMatrix3D.rawData[6];
        data[7] = sourceMatrix3D.rawData[7];
        data[8] = sourceMatrix3D.rawData[8];
        data[9] = sourceMatrix3D.rawData[9];
        data[10] = sourceMatrix3D.rawData[10];
        data[11] = sourceMatrix3D.rawData[11];
        data[12] = sourceMatrix3D.rawData[12];
        data[13] = sourceMatrix3D.rawData[13];
        data[14] = sourceMatrix3D.rawData[14];
        data[15] = sourceMatrix3D.rawData[15];
        return this;
    }

    /**
     * CoMath.PIes the value of the current matrix to a float array.
     * @param vector The target array.
     * @param index copy from the index of the array.
     * @param transpose Whether to transpose the current matrix.
     * @version Orillusion3D  0.5.1
     */
    public copyRawDataTo(vector: Float32Array, index: number = 0, transpose: boolean = false) {
        let data: Float32Array = this.rawData;
        vector[0 + index] = data[0];
        vector[1 + index] = data[1];
        vector[2 + index] = data[2];
        vector[3 + index] = data[3];
        vector[4 + index] = data[4];
        vector[5 + index] = data[5];
        vector[6 + index] = data[6];
        vector[7 + index] = data[7];
        vector[8 + index] = data[8];
        vector[9 + index] = data[9];
        vector[10 + index] = data[10];
        vector[11 + index] = data[11];
        vector[12 + index] = data[12];
        vector[13 + index] = data[13];
        vector[14 + index] = data[14];
        vector[15 + index] = data[15];
    }

    /**
     * Assigns a value to a column of the current matrix
     * @param col column
     * @param Vector3 Source of value
     * @version Orillusion3D  0.5.1
     */
    public copyColFrom(col: number, Vector3: Vector3) {
        let data: Float32Array = this.rawData;
        switch (col) {
            case 0:
                data[0] = Vector3.x;
                data[4] = Vector3.y;
                data[8] = Vector3.z;
                data[12] = Vector3.w;
                break;
            case 1:
                data[1] = Vector3.x;
                data[5] = Vector3.y;
                data[9] = Vector3.z;
                data[13] = Vector3.w;
                break;
            case 2:
                data[2] = Vector3.x;
                data[6] = Vector3.y;
                data[10] = Vector3.z;
                data[14] = Vector3.w;
                break;
            case 3:
                data[3] = Vector3.x;
                data[7] = Vector3.y;
                data[11] = Vector3.z;
                data[15] = Vector3.w;
                break;
            default:
                new Error('no more raw!');
        }
    }

    /**
     * Copy a column of the current matrix
     * @param col column
     * @param Vector3 Target of copy
     * @version Orillusion3D  0.5.1
     */
    public copyColTo(col: number, Vector3: Vector3) {
        let data: Float32Array = this.rawData;
        switch (col) {
            case 0:
                Vector3.x = data[0];
                Vector3.y = data[4];
                Vector3.z = data[8];
                Vector3.w = data[12];
                break;
            case 1:
                Vector3.x = data[1];
                Vector3.y = data[5];
                Vector3.z = data[9];
                Vector3.w = data[13];
                break;
            case 2:
                Vector3.x = data[2];
                Vector3.y = data[6];
                Vector3.z = data[10];
                Vector3.w = data[14];
                break;
            case 3:
                Vector3.x = data[3];
                Vector3.y = data[7];
                Vector3.z = data[11];
                Vector3.w = data[15];
                break;
            default:
                new Error('no more raw!');
        }
    }

    /**
     * Copy the current matrix
     * @param dest Target of copy
     * @version Orillusion3D  0.5.1
     */
    public copyToMatrix3D(dest: Matrix4) {
        dest.rawData = this.rawData.slice(0);
    }

    /**
     * Calculate rotation matrix
     * @param quaternion Rotate the quaternion
     * @returns
     */
    public makeRotationFromQuaternion(quaternion: Quaternion): Matrix4 {
        this.compose(Matrix4._zero, quaternion, Matrix4._one);
        return this;
    }

    /**
     * Decompose the current matrix
     * @param orientationStyle The default decomposition type is Orientation3D.EULER_ANGLES
     * @see Orientation3D.AXIS_ANGLE
     * @see Orientation3D.EULER_ANGLES
     * @see Orientation3D.QUATERNION
     * @returns Vector3[3] pos rot scale
     * @version Orillusion3D  0.5.1
     */
    public decompose(orientationStyle: string = 'eulerAngles', target?: Vector3[]): Vector3[] {
        let q: Quaternion = Quaternion.CALCULATION_QUATERNION;
        let vec: Vector3[] = target ? target : Matrix4._prs;
        this.copyRawDataTo(Matrix4.helpMatrix.rawData);
        let mr = Matrix4.helpMatrix.rawData;

        let pos: Vector3 = vec[0];
        pos.x = mr[12];
        pos.y = mr[13];
        pos.z = mr[14];
        mr[12] = 0;
        mr[13] = 0;
        mr[14] = 0;

        let scale: Vector3 = vec[2];

        scale.x = Math.sqrt(mr[0] * mr[0] + mr[1] * mr[1] + mr[2] * mr[2]);
        scale.y = Math.sqrt(mr[4] * mr[4] + mr[5] * mr[5] + mr[6] * mr[6]);
        scale.z = Math.sqrt(mr[8] * mr[8] + mr[9] * mr[9] + mr[10] * mr[10]);

        if (mr[0] * (mr[5] * mr[10] - mr[6] * mr[9])
            - mr[1] * (mr[4] * mr[10] - mr[6] * mr[8])
            + mr[2] * (mr[4] * mr[9] - mr[5] * mr[8]) < 0) {
            scale.z = -scale.z;
        }

        mr[0] /= scale.x;
        mr[1] /= scale.x;
        mr[2] /= scale.x;
        mr[4] /= scale.y;
        mr[5] /= scale.y;
        mr[6] /= scale.y;
        mr[8] /= scale.z;
        mr[9] /= scale.z;
        mr[10] /= scale.z;

        let rot = vec[1];

        switch (orientationStyle) {
            case Orientation3D.AXIS_ANGLE:
                rot.w = Math.acos((mr[0] + mr[5] + mr[10] - 1) / 2);

                let len: number = Math.sqrt((mr[6] - mr[9]) * (mr[6] - mr[9]) + (mr[8] - mr[2]) * (mr[8] - mr[2]) + (mr[1] - mr[4]) * (mr[1] - mr[4]));
                rot.x = (mr[6] - mr[9]) / len;
                rot.y = (mr[8] - mr[2]) / len;
                rot.z = (mr[1] - mr[4]) / len;

                break;
            case Orientation3D.QUATERNION:
                let tr = mr[0] + mr[5] + mr[10];

                if (tr > 0) {
                    rot.w = Math.sqrt(1 + tr) / 2;

                    rot.x = (mr[6] - mr[9]) / (4 * rot.w);
                    rot.y = (mr[8] - mr[2]) / (4 * rot.w);
                    rot.z = (mr[1] - mr[4]) / (4 * rot.w);
                } else if (mr[0] > mr[5] && mr[0] > mr[10]) {
                    rot.x = Math.sqrt(1 + mr[0] - mr[5] - mr[10]) / 2;

                    rot.w = (mr[6] - mr[9]) / (4 * rot.x);
                    rot.y = (mr[1] + mr[4]) / (4 * rot.x);
                    rot.z = (mr[8] + mr[2]) / (4 * rot.x);
                } else if (mr[5] > mr[10]) {
                    rot.y = Math.sqrt(1 + mr[5] - mr[0] - mr[10]) / 2;

                    rot.x = (mr[1] + mr[4]) / (4 * rot.y);
                    rot.w = (mr[8] - mr[2]) / (4 * rot.y);
                    rot.z = (mr[6] + mr[9]) / (4 * rot.y);
                } else {
                    rot.z = Math.sqrt(1 + mr[10] - mr[0] - mr[5]) / 2;

                    rot.x = (mr[8] + mr[2]) / (4 * rot.z);
                    rot.y = (mr[6] + mr[9]) / (4 * rot.z);
                    rot.w = (mr[1] - mr[4]) / (4 * rot.z);
                }

                break;
            case Orientation3D.EULER_ANGLES:
                tr = mr[0] + mr[5] + mr[10];

                if (tr > 0) {
                    q.w = Math.sqrt(1 + tr) / 2;

                    q.x = (mr[6] - mr[9]) / (4 * q.w);
                    q.y = (mr[8] - mr[2]) / (4 * q.w);
                    q.z = (mr[1] - mr[4]) / (4 * q.w);
                } else if (mr[0] > mr[5] && mr[0] > mr[10]) {
                    q.x = Math.sqrt(1 + mr[0] - mr[5] - mr[10]) / 2;

                    q.w = (mr[6] - mr[9]) / (4 * q.x);
                    q.y = (mr[1] + mr[4]) / (4 * q.x);
                    q.z = (mr[8] + mr[2]) / (4 * q.x);
                } else if (mr[5] > mr[10]) {
                    rot.y = Math.sqrt(1 + mr[5] - mr[0] - mr[10]) / 2;

                    q.x = (mr[1] + mr[4]) / (4 * q.y);
                    q.w = (mr[8] - mr[2]) / (4 * q.y);
                    q.z = (mr[6] + mr[9]) / (4 * q.y);
                } else {
                    q.z = Math.sqrt(1 + mr[10] - mr[0] - mr[5]) / 2;

                    q.x = (mr[8] + mr[2]) / (4 * q.z);
                    q.y = (mr[6] + mr[9]) / (4 * q.z);
                    q.w = (mr[1] - mr[4]) / (4 * q.z);
                }
                q.toEulerAngles(rot);

                break;
        }

        vec[0] = pos;
        vec[1] = rot;
        vec[2] = scale;

        return vec;
    }



    /**
     * Get the Euler vector
     * @param target Vector of results
     * @param quaternion Rotate the quaternion
     * @param isDegree Whether to convert to Angle
     * @param order convert order
     * @returns
     */
    static getEuler(target: Vector3, quaternion: Quaternion, isDegree: boolean = true, order?: string) {
        target ||= new Vector3();
        Matrix4._getEulerMatrix.makeRotationFromQuaternion(quaternion).makeEuler(target, isDegree, order);
        return target;
    }

    /**
     * Calculate the combined matrix of displacement, rotation and scaling
     * @param position translation
     * @param quaternion rotation
     * @param scale scale
     * @returns
     */
    public compose(position: Vector3, quaternion: Quaternion, scale: Vector3) {
        const te = this.rawData;

        const x = quaternion.x;
        const y = quaternion.y;
        const z = quaternion.z;
        const w = quaternion.w;
        const x2 = x + x;
        const y2 = y + y;
        const z2 = z + z;
        const xx = x * x2;
        const xy = x * y2;
        const xz = x * z2;
        const yy = y * y2;
        const yz = y * z2;
        const zz = z * z2;
        const wx = w * x2;
        const wy = w * y2;
        const wz = w * z2;

        const sx = scale.x;
        const sy = scale.y;
        const sz = scale.z;

        te[0] = (1 - (yy + zz)) * sx;
        te[1] = (xy + wz) * sx;
        te[2] = (xz - wy) * sx;
        te[3] = 0;

        te[4] = (xy - wz) * sy;
        te[5] = (1 - (xx + zz)) * sy;
        te[6] = (yz + wx) * sy;
        te[7] = 0;

        te[8] = (xz + wy) * sz;
        te[9] = (yz - wx) * sz;
        te[10] = (1 - (xx + yy)) * sz;
        te[11] = 0;

        te[12] = position.x;
        te[13] = position.y;
        te[14] = position.z;
        te[15] = 1;

        return this;
    }

    /**
     * The current matrix transforms a vector
     * @param v Vector to transform
     * @param target The default is null and if the current argument is null then a new Vector3 will be returned
     * @returns Vector3 The transformed vector
     * @version Orillusion3D  0.5.1
     */
    public deltaTransformVector(v: Vector3, target?: Vector3): Vector3 {
        target ||= new Vector3();

        let data: Float32Array = this.rawData;
        let x: number = v.x;
        let y: number = v.y;
        let z: number = v.z;

        target.x = x * data[0] + y * data[4] + z * data[8];
        target.y = x * data[1] + y * data[5] + z * data[9];
        target.z = x * data[2] + y * data[6] + z * data[10];
        target.w = x * data[3] + y * data[7] + z * data[11];
        return target;
    }

    /**
     * Unifies the current matrix
     * @version Orillusion3D  0.5.1
     */
    public identity() {
        let data: Float32Array = this.rawData;
        //1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
        data[0] = 1;
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;
        data[4] = 0;
        data[5] = 1;
        data[6] = 0;
        data[7] = 0;
        data[8] = 0;
        data[9] = 0;
        data[10] = 1;
        data[11] = 0;
        data[12] = 0;
        data[13] = 0;
        data[14] = 0;
        data[15] = 1;
        return this;
    }

    /**
     * Fill the current matrix
     * @param value The filled value
     * @version Orillusion3D  0.5.1
     */
    public fill(value: number) {
        let data: Float32Array = this.rawData;
        data[1] = value;
        data[2] = value;
        data[3] = value;
        data[4] = value;
        data[6] = value;
        data[7] = value;
        data[8] = value;
        data[9] = value;
        data[11] = value;
        data[12] = value;
        data[13] = value;
        data[14] = value;
        data[0] = value;
        data[5] = value;
        data[10] = value;
        data[15] = value;
    }

    /**
     * Invert the current matrix
     * @version Orillusion3D  0.5.1
     */
    public invers33() {
        /// Invert a 3x3 using cofactors.  This is about 8 times faster than
        /// the Numerical Recipes code which uses Gaussian elimination.
        let data: Float32Array = this.rawData;

        let rkInverse_00 = data[5] * data[10] - data[9] * data[6];
        let rkInverse_01 = data[8] * data[6] - data[4] * data[10];
        let rkInverse_02 = data[4] * data[9] - data[8] * data[5];
        let rkInverse_10 = data[9] * data[2] - data[1] * data[10];
        let rkInverse_11 = data[0] * data[10] - data[8] * data[2];
        let rkInverse_12 = data[8] * data[1] - data[0] * data[9];
        let rkInverse_20 = data[1] * data[6] - data[5] * data[2];
        let rkInverse_21 = data[4] * data[2] - data[0] * data[6];
        let rkInverse_22 = data[0] * data[5] - data[4] * data[1];

        let fDet: number = data[0] * rkInverse_00 + data[4] * rkInverse_10 + data[8] * rkInverse_20;

        if (Math.abs(fDet) > 0.00000000001) {
            let fInvDet: number = 1.0 / fDet;

            data[0] = fInvDet * rkInverse_00;
            data[4] = fInvDet * rkInverse_01;
            data[8] = fInvDet * rkInverse_02;
            data[1] = fInvDet * rkInverse_10;
            data[5] = fInvDet * rkInverse_11;
            data[9] = fInvDet * rkInverse_12;
            data[2] = fInvDet * rkInverse_20;
            data[6] = fInvDet * rkInverse_21;
            data[10] = fInvDet * rkInverse_22;
        }
    }

    /**
     * Invert the current matrix
     * @returns boolean Whether can invert it
     * @version Orillusion3D  0.5.1
     */
    public invert(): boolean {
        let d = this.determinant;
        let invertable = Math.abs(d) > 0.00000000001;
        let data: Float32Array = this.rawData;

        if (invertable) {
            d = 1 / d;
            let m11: number = data[0];
            let m21: number = data[4];
            let m31: number = data[8];
            let m41: number = data[12];
            let m12: number = data[1];
            let m22: number = data[5];
            let m32: number = data[9];
            let m42: number = data[13];
            let m13: number = data[2];
            let m23: number = data[6];
            let m33: number = data[10];
            let m43: number = data[14];
            let m14: number = data[3];
            let m24: number = data[7];
            let m34: number = data[11];
            let m44: number = data[15];

            data[0] = d * (m22 * (m33 * m44 - m43 * m34) - m32 * (m23 * m44 - m43 * m24) + m42 * (m23 * m34 - m33 * m24));
            data[1] = -d * (m12 * (m33 * m44 - m43 * m34) - m32 * (m13 * m44 - m43 * m14) + m42 * (m13 * m34 - m33 * m14));
            data[2] = d * (m12 * (m23 * m44 - m43 * m24) - m22 * (m13 * m44 - m43 * m14) + m42 * (m13 * m24 - m23 * m14));
            data[3] = -d * (m12 * (m23 * m34 - m33 * m24) - m22 * (m13 * m34 - m33 * m14) + m32 * (m13 * m24 - m23 * m14));
            data[4] = -d * (m21 * (m33 * m44 - m43 * m34) - m31 * (m23 * m44 - m43 * m24) + m41 * (m23 * m34 - m33 * m24));
            data[5] = d * (m11 * (m33 * m44 - m43 * m34) - m31 * (m13 * m44 - m43 * m14) + m41 * (m13 * m34 - m33 * m14));
            data[6] = -d * (m11 * (m23 * m44 - m43 * m24) - m21 * (m13 * m44 - m43 * m14) + m41 * (m13 * m24 - m23 * m14));
            data[7] = d * (m11 * (m23 * m34 - m33 * m24) - m21 * (m13 * m34 - m33 * m14) + m31 * (m13 * m24 - m23 * m14));
            data[8] = d * (m21 * (m32 * m44 - m42 * m34) - m31 * (m22 * m44 - m42 * m24) + m41 * (m22 * m34 - m32 * m24));
            data[9] = -d * (m11 * (m32 * m44 - m42 * m34) - m31 * (m12 * m44 - m42 * m14) + m41 * (m12 * m34 - m32 * m14));
            data[10] = d * (m11 * (m22 * m44 - m42 * m24) - m21 * (m12 * m44 - m42 * m14) + m41 * (m12 * m24 - m22 * m14));
            data[11] = -d * (m11 * (m22 * m34 - m32 * m24) - m21 * (m12 * m34 - m32 * m14) + m31 * (m12 * m24 - m22 * m14));
            data[12] = -d * (m21 * (m32 * m43 - m42 * m33) - m31 * (m22 * m43 - m42 * m23) + m41 * (m22 * m33 - m32 * m23));
            data[13] = d * (m11 * (m32 * m43 - m42 * m33) - m31 * (m12 * m43 - m42 * m13) + m41 * (m12 * m33 - m32 * m13));
            data[14] = -d * (m11 * (m22 * m43 - m42 * m23) - m21 * (m12 * m43 - m42 * m13) + m41 * (m12 * m23 - m22 * m13));
            data[15] = d * (m11 * (m22 * m33 - m32 * m23) - m21 * (m12 * m33 - m32 * m13) + m31 * (m12 * m23 - m22 * m13));
        }
        return invertable;
    }

    /**
     * Converts the current coordinates to the world coordinates
     * @param v Current coordinates
     * @param target world coordinate
     * @returns world coordinate
     */
    public transformPoint(v: Vector3, target?: Vector3): Vector3 {
        let data: Float32Array = this.rawData;
        target ||= new Vector3();

        let x: number = v.x;
        let y: number = v.y;
        let z: number = v.z;

        target.x = x * data[0] + y * data[4] + z * data[8] + data[12];
        target.y = x * data[1] + y * data[5] + z * data[9] + data[13];
        target.z = x * data[2] + y * data[6] + z * data[10] + data[14];

        return target;
    }

    /**
     * Transforming a 3D vector with the current matrix does not deal with displacement
     * @param v Vector of transformation
     * @param target If the current argument is null then a new Vector3 will be returned
     * @returns Vector3 The transformed vector
     * @version Orillusion3D  0.5.1
     */
    public transformVector(v: Vector3, target?: Vector3): Vector3 {
        let data: Float32Array = this.rawData;

        target ||= new Vector3();

        let x: number = v.x;
        let y: number = v.y;
        let z: number = v.z;

        target.x = x * data[0] + y * data[4] + z * data[8];
        target.y = x * data[1] + y * data[5] + z * data[9];
        target.z = x * data[2] + y * data[6] + z * data[10];

        return target;
    }

    /**
     * The current matrix transpose
     * @version Orillusion3D  0.5.1
     */
    public transpose() {
        let data: Float32Array = this.rawData;

        for (let i: number = 0; i < Matrix4.helpMatrix.rawData.length; i++) {
            Matrix4.helpMatrix.rawData[i] = data[i];
        }

        data[1] = Matrix4.helpMatrix.rawData[4];
        data[2] = Matrix4.helpMatrix.rawData[8];
        data[3] = Matrix4.helpMatrix.rawData[12];
        data[4] = Matrix4.helpMatrix.rawData[1];
        data[6] = Matrix4.helpMatrix.rawData[9];
        data[7] = Matrix4.helpMatrix.rawData[13];
        data[8] = Matrix4.helpMatrix.rawData[2];
        data[9] = Matrix4.helpMatrix.rawData[6];
        data[11] = Matrix4.helpMatrix.rawData[14];
        data[12] = Matrix4.helpMatrix.rawData[3];
        data[13] = Matrix4.helpMatrix.rawData[7];
        data[14] = Matrix4.helpMatrix.rawData[11];
    }

    /**
     * Returns the matrix determinant
     * @returns number determinant
     * @version Orillusion3D  0.5.1
     */
    public get determinant(): number {
        let data: Float32Array = this.rawData;
        return (
            (data[0] * data[5] - data[4] * data[1]) * (data[10] * data[15] - data[14] * data[11]) -
            (data[0] * data[9] - data[8] * data[1]) * (data[6] * data[15] - data[14] * data[7]) +
            (data[0] * data[13] - data[12] * data[1]) * (data[6] * data[11] - data[10] * data[7]) +
            (data[4] * data[9] - data[8] * data[5]) * (data[2] * data[15] - data[14] * data[3]) -
            (data[4] * data[13] - data[12] * data[5]) * (data[2] * data[11] - data[10] * data[3]) +
            (data[8] * data[13] - data[12] * data[9]) * (data[2] * data[7] - data[6] * data[3])
        );
    }

    /**
     * Return matrix displacement
     * @param out Position of translation
     * @returns Position of translation
     */
    public getPosition(out?: Vector3): Vector3 {
        out ||= new Vector3();
        let data: Float32Array = this.rawData;
        out.x = data[12];
        out.y = data[13];
        out.z = data[14];
        return out;
    }

    /**
     * Return translation
     * @returns Vector3 Position of translation
     * @version Orillusion3D  0.5.1
     */
    public get position(): Vector3 {
        this._position.set(this.rawData[12], this.rawData[13], this.rawData[14]);
        return this._position;
    }

    /**
     * Set Position of translation
     * @param value Position of translation
     * @version Orillusion3D  0.5.1
     */
    public set position(value: Vector3) {
        let data: Float32Array = this.rawData;
        data[12] = value.x;
        data[13] = value.y;
        data[14] = value.z;
    }

    /**
     * get Component of scale
     *
     * @returns Vector3 scale
     * @version Orillusion3D  0.5.1
     */
    public get scale(): Vector3 {
        let data: Float32Array = this.rawData;
        return new Vector3(data[0], data[5], data[10]);
    }

    /**
     * Set component of scale
     */
    public set scale(value: Vector3) {
        let data: Float32Array = this.rawData;
        data[0] = value.x;
        data[5] = value.y;
        data[10] = value.z;
    }

    // public setWorldTrans( pos:Vector3 , rotQ:Quaternion,scale:Vector3 = Vector3.SCALE){
    //     this.makeTransform(pos,scale,rotQ);
    // }

    /**
     * Returns the value of the matrix as a string
     *
     * @returns string 
     * @version Orillusion3D  0.5.1
     */
    public toString(): string {
        let data = this.rawData;
        return (
            'matrix3d(' +
            Math.round(data[0] * 1000) / 1000 +
            ',' +
            Math.round(data[1] * 1000) / 1000 +
            ',' +
            Math.round(data[2] * 1000) / 1000 +
            ',' +
            Math.round(data[3] * 1000) / 1000 +
            ',' +
            Math.round(data[4] * 1000) / 1000 +
            ',' +
            Math.round(data[5] * 1000) / 1000 +
            ',' +
            Math.round(data[6] * 1000) / 1000 +
            ',' +
            Math.round(data[7] * 1000) / 1000 +
            ',' +
            Math.round(data[8] * 1000) / 1000 +
            ',' +
            Math.round(data[9] * 1000) / 1000 +
            ',' +
            Math.round(data[10] * 1000) / 1000 +
            ',' +
            Math.round(data[11] * 1000) / 1000 +
            ',' +
            Math.round(data[12] * 1000) / 1000 +
            ',' +
            Math.round(data[13] * 1000) / 1000 +
            ',' +
            Math.round(data[14] * 1000) / 1000 +
            ',' +
            Math.round(data[15] * 1000) / 1000 +
            ')'
        );
    }

    /**
     * Interpolate between two matrices
     * @param m0 Matrix 0
     * @param m1 Matrix 1
     * @param t Factor of interpolation 0.0 - 1.0
     * @version Orillusion3D  0.5.1
     */
    public lerp(m0: Matrix4, m1: Matrix4, t: number): void {
        ///t(m1 - m0) + m0
        this.copyFrom(m1).sub(m0).mult(t).add(m0);
    }

    /**
     * Read matrix element values
     * @param row row
     * @param column column
     * @returns
     */
    public get(row: number, column: number) {
        return this.rawData[row + column * 4];
    }

    /**
     * Sets the matrix element values
     * @param row row
     * @param column column
     * @param v value
     */
    public set(row: number, column: number, v: number) {
        this.rawData[row + column * 4] = v;
    }

    /**
     * Get the maximum value of the matrix scaled on each axis
     * @version Orillusion3D  0.5.1 4.0
     */
    public getMaxScaleOnAxis(): number {
        let te = this.rawData;

        let scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
        let scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
        let scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];

        return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
    }

    /**
     * Calculate the displacement from the vector
     * @param inTrans Vector
     * @returns current matrix
     */
    public translate(inTrans: Vector3) {
        // let Get = this.Get ;
        let x = this.get(0, 0) * inTrans.x + this.get(0, 1) * inTrans.y + this.get(0, 2) * inTrans.z + this.get(0, 3);
        let y = this.get(1, 0) * inTrans.x + this.get(1, 1) * inTrans.y + this.get(1, 2) * inTrans.z + this.get(1, 3);
        let z = this.get(2, 0) * inTrans.x + this.get(2, 1) * inTrans.y + this.get(2, 2) * inTrans.z + this.get(2, 3);
        let w = this.get(3, 0) * inTrans.x + this.get(3, 1) * inTrans.y + this.get(3, 2) * inTrans.z + this.get(3, 3);

        this.set(0, 3, x);
        this.set(1, 3, y);
        this.set(2, 3, z);
        this.set(3, 3, w);
        return this;
    }

    /**
     * from unity AMath.PI
     */
    public setTRInverse(pos: Vector3, q: Quaternion) {
        q = q.inverse();
        Quaternion.quaternionToMatrix(q, this);
        this.translate(new Vector3(-pos.x, -pos.y, -pos.z));
    }

    /**
     * Set scale value
     * @param inScale scale value
     * @returns this matrix
     */
    public setScale(inScale: Vector3) {
        this.set(0, 0, inScale.x);
        this.set(0, 1, 0.0);
        this.set(0, 2, 0.0);
        this.set(0, 3, 0.0);
        this.set(1, 0, 0.0);
        this.set(1, 1, inScale.y);
        this.set(1, 2, 0.0);
        this.set(1, 3, 0.0);
        this.set(2, 0, 0.0);
        this.set(2, 1, 0.0);
        this.set(2, 2, inScale.z);
        this.set(2, 3, 0.0);
        this.set(3, 0, 0.0);
        this.set(3, 1, 0.0);
        this.set(3, 2, 0.0);
        this.set(3, 3, 1.0);
        return this;
    }

    /**
     * Generate the matrix according to the three axes
     * @param xAxis
     * @param yAxis
     * @param zAxis
     */
    public makeBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3) {
        this.setElements(
            xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            0, 0, 0, 1
        );
        return this;
    }

    public makeRotationAxis(axis: Vector3, angle: number) {

        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        const x = axis.x, y = axis.y, z = axis.z;
        const tx = t * x, ty = t * y;

        this.setElements(
            tx * x + c, tx * y - s * z, tx * z + s * y, 0,
            tx * y + s * z, ty * y + c, ty * z - s * x, 0,
            tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
            0, 0, 0, 1
        );

        return this;

    }


    /**
     * private
     */
    private static transpose(matrix: Matrix4, result: Matrix4) {
        result ||= new Matrix4();
        let m = matrix.rawData;
        let r = result.rawData;
        r[0] = m[0];
        r[1] = m[4];
        r[2] = m[8];
        r[3] = m[12];
        r[4] = m[1];
        r[5] = m[5];
        r[6] = m[9];
        r[7] = m[13];
        r[8] = m[2];
        r[9] = m[6];
        r[10] = m[10];
        r[11] = m[14];
        r[12] = m[3];
        r[13] = m[7];
        r[14] = m[11];
        r[15] = m[15];
        return result;
    }

    /**
     * private
     */
    private static inverse(matrix: Matrix4, result: Matrix4) {
        result ||= new Matrix4();
        let m = matrix.rawData;
        let r = result.rawData;

        r[0] = m[5] * m[10] * m[15] - m[5] * m[14] * m[11] - m[6] * m[9] * m[15] + m[6] * m[13] * m[11] + m[7] * m[9] * m[14] - m[7] * m[13] * m[10];
        r[1] = -m[1] * m[10] * m[15] + m[1] * m[14] * m[11] + m[2] * m[9] * m[15] - m[2] * m[13] * m[11] - m[3] * m[9] * m[14] + m[3] * m[13] * m[10];
        r[2] = m[1] * m[6] * m[15] - m[1] * m[14] * m[7] - m[2] * m[5] * m[15] + m[2] * m[13] * m[7] + m[3] * m[5] * m[14] - m[3] * m[13] * m[6];
        r[3] = -m[1] * m[6] * m[11] + m[1] * m[10] * m[7] + m[2] * m[5] * m[11] - m[2] * m[9] * m[7] - m[3] * m[5] * m[10] + m[3] * m[9] * m[6];

        r[4] = -m[4] * m[10] * m[15] + m[4] * m[14] * m[11] + m[6] * m[8] * m[15] - m[6] * m[12] * m[11] - m[7] * m[8] * m[14] + m[7] * m[12] * m[10];
        r[5] = m[0] * m[10] * m[15] - m[0] * m[14] * m[11] - m[2] * m[8] * m[15] + m[2] * m[12] * m[11] + m[3] * m[8] * m[14] - m[3] * m[12] * m[10];
        r[6] = -m[0] * m[6] * m[15] + m[0] * m[14] * m[7] + m[2] * m[4] * m[15] - m[2] * m[12] * m[7] - m[3] * m[4] * m[14] + m[3] * m[12] * m[6];
        r[7] = m[0] * m[6] * m[11] - m[0] * m[10] * m[7] - m[2] * m[4] * m[11] + m[2] * m[8] * m[7] + m[3] * m[4] * m[10] - m[3] * m[8] * m[6];

        r[8] = m[4] * m[9] * m[15] - m[4] * m[13] * m[11] - m[5] * m[8] * m[15] + m[5] * m[12] * m[11] + m[7] * m[8] * m[13] - m[7] * m[12] * m[9];
        r[9] = -m[0] * m[9] * m[15] + m[0] * m[13] * m[11] + m[1] * m[8] * m[15] - m[1] * m[12] * m[11] - m[3] * m[8] * m[13] + m[3] * m[12] * m[9];
        r[10] = m[0] * m[5] * m[15] - m[0] * m[13] * m[7] - m[1] * m[4] * m[15] + m[1] * m[12] * m[7] + m[3] * m[4] * m[13] - m[3] * m[12] * m[5];
        r[11] = -m[0] * m[5] * m[11] + m[0] * m[9] * m[7] + m[1] * m[4] * m[11] - m[1] * m[8] * m[7] - m[3] * m[4] * m[9] + m[3] * m[8] * m[5];

        r[12] = -m[4] * m[9] * m[14] + m[4] * m[13] * m[10] + m[5] * m[8] * m[14] - m[5] * m[12] * m[10] - m[6] * m[8] * m[13] + m[6] * m[12] * m[9];
        r[13] = m[0] * m[9] * m[14] - m[0] * m[13] * m[10] - m[1] * m[8] * m[14] + m[1] * m[12] * m[10] + m[2] * m[8] * m[13] - m[2] * m[12] * m[9];
        r[14] = -m[0] * m[5] * m[14] + m[0] * m[13] * m[6] + m[1] * m[4] * m[14] - m[1] * m[12] * m[6] - m[2] * m[4] * m[13] + m[2] * m[12] * m[5];
        r[15] = m[0] * m[5] * m[10] - m[0] * m[9] * m[6] - m[1] * m[4] * m[10] + m[1] * m[8] * m[6] + m[2] * m[4] * m[9] - m[2] * m[8] * m[5];

        let det = m[0] * r[0] + m[1] * r[4] + m[2] * r[8] + m[3] * r[12];
        for (let i = 0; i < 16; i++) {
            r[i] /= det;
        }
        return result;
    }

    private makeEuler(target: Vector3, toDegree: boolean, order: string = 'XYZ'): Vector3 {
        const te = this.rawData;
        const m11 = te[0];
        const m12 = te[4];
        const m13 = te[8];
        const m21 = te[1];
        const m22 = te[5];
        const m23 = te[9];
        const m31 = te[2];
        const m32 = te[6];
        const m33 = te[10];

        switch (order) {
            case 'XYZ':
                target.y = Math.asin(clamp(m13, -1, 1));

                if (Math.abs(m13) < 0.9999999) {
                    target.x = Math.atan2(-m23, m33);
                    target.z = Math.atan2(-m12, m11);
                } else {
                    target.x = Math.atan2(m32, m22);
                    target.z = 0;
                }

                break;

            case 'YXZ':
                target.x = Math.asin(-clamp(m23, -1, 1));

                if (Math.abs(m23) < 0.9999999) {
                    target.y = Math.atan2(m13, m33);
                    target.z = Math.atan2(m21, m22);
                } else {
                    target.y = Math.atan2(-m31, m11);
                    target.z = 0;
                }

                break;

            case 'ZXY':
                target.x = Math.asin(clamp(m32, -1, 1));

                if (Math.abs(m32) < 0.9999999) {
                    target.y = Math.atan2(-m31, m33);
                    target.z = Math.atan2(-m12, m22);
                } else {
                    target.y = 0;
                    target.z = Math.atan2(m21, m11);
                }

                break;

            case 'ZYX':
                target.y = Math.asin(-clamp(m31, -1, 1));

                if (Math.abs(m31) < 0.9999999) {
                    target.x = Math.atan2(m32, m33);
                    target.z = Math.atan2(m21, m11);
                } else {
                    target.x = 0;
                    target.z = Math.atan2(-m12, m22);
                }

                break;

            case 'YZX':
                target.z = Math.asin(clamp(m21, -1, 1));

                if (Math.abs(m21) < 0.9999999) {
                    target.x = Math.atan2(-m23, m22);
                    target.y = Math.atan2(-m31, m11);
                } else {
                    target.x = 0;
                    target.y = Math.atan2(m13, m33);
                }

                break;

            case 'XZY':
                target.z = Math.asin(-clamp(m12, -1, 1));

                if (Math.abs(m12) < 0.9999999) {
                    target.x = Math.atan2(m32, m22);
                    target.y = Math.atan2(m13, m11);
                } else {
                    target.x = Math.atan2(-m23, m33);
                    target.y = 0;
                }

                break;

            default: {
            }
        }
        if (toDegree) {
            target.multiplyScalar(RADIANS_TO_DEGREES);
        }
        return target;
    }

    private frustum(l: number, r: number, b: number, t: number, n: number, f: number): Matrix4 {
        let m = this.rawData;

        m[0] = (2 * n) / (r - l);
        m[1] = 0;
        m[2] = (r + l) / (r - l);
        m[3] = 0;

        m[4] = 0;
        m[5] = (2 * n) / (t - b);
        m[6] = (t + b) / (t - b);
        m[7] = 0;

        m[8] = 0;
        m[9] = 0;
        m[10] = -(f + n) / (f - n);
        m[11] = (-2 * f * n) / (f - n);

        m[12] = 0;
        m[13] = 0;
        m[14] = -1;
        m[15] = 0;

        return this;
    }

    private setElements(
        n11: number, n12: number, n13: number, n14: number,
        n21: number, n22: number, n23: number, n24: number,
        n31: number, n32: number, n33: number, n34: number,
        n41: number, n42: number, n43: number, n44: number) {

        const te = this.rawData;

        te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
        te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
        te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
        te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;

        return this;

    }

    /**
     * @internal
     */
    public makeMatrix44ByQuaternion(pos: Vector3, scale: Vector3, rot: Quaternion) {
        this.identity();
        Quaternion.quaternionToMatrix(rot, this);
        this.appendTranslation(pos.x, pos.y, pos.z);
        this.appendScale(scale.x, scale.y, scale.z);
    }
}

/**
 * @internal
 */
export function multiplyMatrices4x4REF(lhs: Matrix4, rhs: Matrix4, res: Matrix4) {
    for (let i = 0; i < 4; i++) {
        res.rawData[i] = lhs.rawData[i] * rhs.rawData[0] + lhs.rawData[i + 4] * rhs.rawData[1] + lhs.rawData[i + 8] * rhs.rawData[2] + lhs.rawData[i + 12] * rhs.rawData[3];
        res.rawData[i + 4] = lhs.rawData[i] * rhs.rawData[4] + lhs.rawData[i + 4] * rhs.rawData[5] + lhs.rawData[i + 8] * rhs.rawData[6] + lhs.rawData[i + 12] * rhs.rawData[7];
        res.rawData[i + 8] = lhs.rawData[i] * rhs.rawData[8] + lhs.rawData[i + 4] * rhs.rawData[9] + lhs.rawData[i + 8] * rhs.rawData[10] + lhs.rawData[i + 12] * rhs.rawData[11];
        res.rawData[i + 12] = lhs.rawData[i] * rhs.rawData[12] + lhs.rawData[i + 4] * rhs.rawData[13] + lhs.rawData[i + 8] * rhs.rawData[14] + lhs.rawData[i + 12] * rhs.rawData[15];
    }
}



/**
 * @internal
 */
export function makeMatrix44(r: Vector3, p: Vector3, s: Vector3, outMat: Matrix4) {
    // Quaternion.CALCULATION_QUATERNION.fromEulerAngles(r.x, r.y, r.z);

    let rawData = outMat.rawData;

    let x: number = r.x * DEGREES_TO_RADIANS;
    let y: number = r.y * DEGREES_TO_RADIANS;
    let z: number = r.z * DEGREES_TO_RADIANS;
    let w: number = 0;

    let halfX: number = x * 0.5;
    let halfY: number = y * 0.5;
    let halfZ: number = z * 0.5;

    let cosX: number = Math.cos(halfX);
    let sinX: number = Math.sin(halfX);
    let cosY: number = Math.cos(halfY);
    let sinY: number = Math.sin(halfY);
    let cosZ: number = Math.cos(halfZ);
    let sinZ: number = Math.sin(halfZ);

    w = cosX * cosY * cosZ + sinX * sinY * sinZ;
    x = sinX * cosY * cosZ - cosX * sinY * sinZ;
    y = cosX * sinY * cosZ + sinX * cosY * sinZ;
    z = cosX * cosY * sinZ - sinX * sinY * cosZ;

    let x2 = x + x;
    let y2 = y + y;
    let z2 = z + z;

    let xx = x * x2;
    let xy = x * y2;
    let xz = x * z2;
    let yy = y * y2;
    let yz = y * z2;
    let zz = z * z2;
    let wx = w * x2;
    let wy = w * y2;
    let wz = w * z2;
    let sx = s.x;
    let sy = s.y;
    let sz = s.z;

    rawData[0] = (1 - (yy + zz)) * sx;
    rawData[1] = (xy + wz) * sx;
    rawData[2] = (xz - wy) * sx;
    rawData[3] = 0;
    rawData[4] = (xy - wz) * sy;
    rawData[5] = (1 - (xx + zz)) * sy;
    rawData[6] = (yz + wx) * sy;
    rawData[7] = 0;
    rawData[8] = (xz + wy) * sz;
    rawData[9] = (yz - wx) * sz;
    rawData[10] = (1 - (xx + yy)) * sz;
    rawData[11] = 0;
    rawData[12] = p.x;
    rawData[13] = p.y;
    rawData[14] = p.z;
    rawData[15] = 1;
}

/**
 * @internal
 */
export function append(src: Matrix4, lhs: Matrix4, target: Matrix4): void {
    let data = src.rawData;
    let targetData = target.rawData;
    let m111: number = data[0];
    let m121: number = data[4];
    let m131: number = data[8];
    let m141: number = data[12];
    let m112: number = data[1];
    let m122: number = data[5];
    let m132: number = data[9];
    let m142: number = data[13];
    let m113: number = data[2];
    let m123: number = data[6];
    let m133: number = data[10];
    let m143: number = data[14];
    let m114: number = data[3];
    let m124: number = data[7];
    let m134: number = data[11];
    let m144: number = data[15];

    targetData[0] = m111 * lhs.rawData[0] + m112 * lhs.rawData[4] + m113 * lhs.rawData[8] + m114 * lhs.rawData[12];
    targetData[1] = m111 * lhs.rawData[1] + m112 * lhs.rawData[5] + m113 * lhs.rawData[9] + m114 * lhs.rawData[13];
    targetData[2] = m111 * lhs.rawData[2] + m112 * lhs.rawData[6] + m113 * lhs.rawData[10] + m114 * lhs.rawData[14];
    targetData[3] = m111 * lhs.rawData[3] + m112 * lhs.rawData[7] + m113 * lhs.rawData[11] + m114 * lhs.rawData[15];

    targetData[4] = m121 * lhs.rawData[0] + m122 * lhs.rawData[4] + m123 * lhs.rawData[8] + m124 * lhs.rawData[12];
    targetData[5] = m121 * lhs.rawData[1] + m122 * lhs.rawData[5] + m123 * lhs.rawData[9] + m124 * lhs.rawData[13];
    targetData[6] = m121 * lhs.rawData[2] + m122 * lhs.rawData[6] + m123 * lhs.rawData[10] + m124 * lhs.rawData[14];
    targetData[7] = m121 * lhs.rawData[3] + m122 * lhs.rawData[7] + m123 * lhs.rawData[11] + m124 * lhs.rawData[15];

    targetData[8] = m131 * lhs.rawData[0] + m132 * lhs.rawData[4] + m133 * lhs.rawData[8] + m134 * lhs.rawData[12];
    targetData[9] = m131 * lhs.rawData[1] + m132 * lhs.rawData[5] + m133 * lhs.rawData[9] + m134 * lhs.rawData[13];
    targetData[10] = m131 * lhs.rawData[2] + m132 * lhs.rawData[6] + m133 * lhs.rawData[10] + m134 * lhs.rawData[14];
    targetData[11] = m131 * lhs.rawData[3] + m132 * lhs.rawData[7] + m133 * lhs.rawData[11] + m134 * lhs.rawData[15];

    targetData[12] = m141 * lhs.rawData[0] + m142 * lhs.rawData[4] + m143 * lhs.rawData[8] + m144 * lhs.rawData[12];
    targetData[13] = m141 * lhs.rawData[1] + m142 * lhs.rawData[5] + m143 * lhs.rawData[9] + m144 * lhs.rawData[13];
    targetData[14] = m141 * lhs.rawData[2] + m142 * lhs.rawData[6] + m143 * lhs.rawData[10] + m144 * lhs.rawData[14];
    targetData[15] = m141 * lhs.rawData[3] + m142 * lhs.rawData[7] + m143 * lhs.rawData[11] + m144 * lhs.rawData[15];
}

/**
 * @internal
 */
export function rotMatrix(mat: Matrix4, q: Quaternion) {
    let x: number = q.x;
    let y: number = q.y;
    let z: number = q.z;
    let w: number = q.w;

    let rawData: Float32Array = mat.rawData;
    let xy2: number = 2.0 * x * y;
    let xz2: number = 2.0 * x * z;
    let xw2: number = 2.0 * x * w;
    let yz2: number = 2.0 * y * z;
    let yw2: number = 2.0 * y * w;
    let zw2: number = 2.0 * z * w;
    let xx: number = x * x;
    let yy: number = y * y;
    let zz: number = z * z;
    let ww: number = w * w;

    rawData[0] = xx - yy - zz + ww;
    rawData[4] = xy2 - zw2;
    rawData[8] = xz2 + yw2;
    rawData[12] = 0;
    rawData[1] = xy2 + zw2;
    rawData[5] = -xx + yy - zz + ww;
    rawData[9] = yz2 - xw2;
    rawData[13] = 0;
    rawData[2] = xz2 - yw2;
    rawData[6] = yz2 + xw2;
    rawData[10] = -xx - yy + zz + ww;
    rawData[14] = 0;
    rawData[3] = 0.0;
    rawData[7] = 0.0;
    rawData[11] = 0;
    rawData[15] = 1;
    return mat;
}

/**
 * @internal
 */
export function matrixRotateY(rad: number, target: Matrix4) {
    let out = target.rawData;
    let s = Math.sin(rad);
    let c = Math.cos(rad);
    out[0] = c;
    out[1] = 0;
    out[2] = -s;
    out[3] = 0;
    out[8] = s;
    out[9] = 0;
    out[10] = c;
    out[11] = 0;
    return out;
}

/**
 * Rotates a mat4 by the given angle around the given axis
 * @internal
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */
export function matrixRotate(rad: number, axis: Vector3, target: Matrix4) {
    let x = axis.x;
    let y = axis.y;
    let z = axis.z;
    let len = Math.hypot(x, y, z);
    let s;
    let c;
    let t;
    let a23;
    let b00;
    let b01;
    let b02;
    let b10;
    let b11;
    let b12;
    let b20;
    let b21;
    let b22;

    if (len < EPSILON) {
        return null;
    }

    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    a23 = 0; // Construct the elements of the rotation matrix

    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

    let out = target.rawData;
    out[0] = b00;
    out[1] = b01;
    out[2] = b02;
    out[3] = 0;
    out[4] = b10;
    out[5] = b11;
    out[6] = b12;
    out[7] = 0;
    out[8] = b20;
    out[9] = b21;
    out[10] = b22;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
}

/**
 * @internal
 */
export function matrixMultiply(aMat: Matrix4, bMat: Matrix4, target: Matrix4) {
    let a = aMat.rawData;
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a03 = a[3];
    let a10 = a[4];
    let a11 = a[5];
    let a12 = a[6];
    let a13 = a[7];
    let a20 = a[8];
    let a21 = a[9];
    let a22 = a[10];
    let a23 = a[11];
    let a30 = a[12];
    let a31 = a[13];
    let a32 = a[14];
    let a33 = a[15]; // Cache only the current line of the second matrix

    let b = bMat.rawData;
    let out = target.rawData;

    let b0 = b[0];
    let b1 = b[1];
    let b2 = b[2];
    let b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    return out;
}
