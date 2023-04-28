import { ComponentBase } from '../components/ComponentBase';
import { Engine3D } from '../Engine3D';
import { HaltonSeq } from '../math/HaltonSeq';
import { MathUtil } from '../math/MathUtil';
import { Matrix4, matrixMultiply } from '../math/Matrix4';
import { Ray } from '../math/Ray';
import { Rect } from '../math/Rect';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { CameraUtil } from '../util/CameraUtil';
import { Frustum } from './bound/Frustum';
import { CameraType } from './CameraType';
import { CubeCamera } from './CubeCamera';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';

/**
 * Camera components
 * @group Components
 */
export class Camera3D extends ComponentBase {
    /**
     * camera Perspective
     */
    public fov: number = 1;

    /**
     * camera use name
     */
    public name: string;

    /**
     * Viewport width and height Scale
     */
    public aspect: number = 1;

    /**
     * camera near plane
     */
    public near: number = 1;

    /**
     * camera far plane
     */
    public far: number = 5000;

    /**
     * camera view port size
     */
    public viewPort: Rect = new Rect();

    /**
     * camera frustum
     */
    public frustum: Frustum;

    /**
     * this camera is shadow camera
     */
    public isShadowCamera: boolean = false;

    /**
   * @internal
   */
    private _projectionMatrixInv: Matrix4 = new Matrix4();
    private _projectionMatrix: Matrix4 = new Matrix4();
    private _viewMatrix: Matrix4 = new Matrix4();
    private _unprojection: Matrix4 = new Matrix4();
    private _pvMatrixInv: Matrix4 = new Matrix4();
    private _pvMatrix: Matrix4 = new Matrix4();
    private _halfw: number;
    private _halfh: number;
    private _ray: Ray;

    /**
     * @internal
     */
    public get projectionMatrix() {
        return this._projectionMatrix;
    }


    /**
     * camera look at from where point
     */
    public lookTarget: Vector3;

    /**
     * camera type 
     */
    public type: CameraType = CameraType.perspective;

    /**
     * @internal
     */
    public cubeShadowCameras: CubeCamera[] = [];


    constructor() {
        super();
    }

    public init() {
        super.init();
        this._ray = new Ray();
        this.frustum = new Frustum();

        this.viewPort.x = 0;
        this.viewPort.y = 0;
        this.viewPort.w = webGPUContext.presentationSize[0];
        this.viewPort.h = webGPUContext.presentationSize[1];
        this.lookTarget = new Vector3(0, 0, 0);
    }

    /**
     * Create a perspective camera
     * @param fov 
     * @param aspect 
     * @param near  
     * @param far 
     */
    public perspective(fov: number, aspect: number, near: number, far: number) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this._projectionMatrix.perspective(fov, aspect, near, far);
        this.type = CameraType.perspective;
    }

    /**
     * Create an orthographic camera
     * @param width screen width
     * @param height screen height
     * @param znear camera near plane
     * @param zfar camera far plane
     */
    public ortho(width: number, height: number, znear: number, zfar: number) {
        this.near = Math.max(znear, 0.1);
        this.far = zfar;
        this._projectionMatrix.ortho(width, height, znear, zfar);
        this.type = CameraType.ortho;
    }

    /**
     *
     * Create an orthographic camera
     * @param l 
     * @param r 
     * @param b 
     * @param t 
     * @param zn camera near plane
     * @param zf camera far plane
     */
    public orthoOffCenter(l: number, r: number, b: number, t: number, zn: number, zf: number) {
        this.near = Math.max(zn, 0.01);
        this.far = zf;
        this._projectionMatrix.orthoOffCenter(l, r, b, t, zn, zf);
        this.type = CameraType.ortho;
    }

    public orthoZo(l: number, r: number, b: number, t: number, zn: number, zf: number) {
        this.near = Math.max(zn, 0.01);
        this.far = zf;
        this._projectionMatrix.orthoZO(l, r, b, t, zn, zf);
        this.type = CameraType.ortho;
    }

    /**
     *
     * view invert matrix
     */
    public get viewMatrix(): Matrix4 {
        this._viewMatrix.copyFrom(this.transform.worldMatrix);
        this._viewMatrix.invert();
        return this._viewMatrix;
    }

    /**
     *
     * shadow camera view invert matrix
     */
    public get shadowViewMatrix(): Matrix4 {
        this._viewMatrix.copyFrom(this.transform.worldMatrix);
        this._viewMatrix.appendScale(1, 1.0, 1.0);
        this._viewMatrix.invert();
        return this._viewMatrix;
    }

    /**
     * world space object to screen 
     * @param n world space
     * @param target Creating an orthogonal camera with 2D screen coordinates that default to null will return a new object
     */
    public object3DToScreenRay(n: Vector3, target: Vector3 = null): Vector3 {
        if (!target) {
            target = new Vector3(0, 0, 0, 1);
        }
        this._halfw = this.viewPort.width * 0.5;
        this._halfh = this.viewPort.height * 0.5;

        MathUtil.transformVector(this.viewMatrix, n, target);
        this.project(target, target);

        target.x = this._halfw + target.x * this._halfw;
        target.y = this.viewPort.height - (this._halfh - target.y * this._halfh);
        return target;
    }

    /**
     * Convert 2D screen coordinates to 3D coordinates as world space
     * @param n 2D screen coordinates
     * @param target 3D coordinates as world space
     */
    public screenRayToObject3D(n: Vector3, target: Vector3 = null): Vector3 {
        if (!target) {
            target = new Vector3();
        }
        this._halfw = this.viewPort.width * 0.5;
        this._halfh = this.viewPort.height * 0.5;

        let fScreenPtX = n.x;
        let fScreenPtY = n.y;
        let m_fRadius = 1;
        target.x = fScreenPtX / this.viewPort.width - 0.25;
        target.y = fScreenPtY / this.viewPort.height - 0.25;

        this.unProject(target.x, target.y, n.z, target);
        // this.transform.localMatrix.transformVector4(target, target);

        return target;
    }

    /**
     * get project * view matrix
     */
    public get pvMatrix(): Matrix4 {
        matrixMultiply(this._projectionMatrix, this.viewMatrix, this._pvMatrix);
        return this._pvMatrix;
    }

    public get pvMatrix2(): Matrix4 {
        matrixMultiply(this._projectionMatrix, this.transform.worldMatrix, this._pvMatrix);
        return this._pvMatrix;
    }

    /**
     * get (project * view) invert matrix
     */
    public get pvMatrixInv(): Matrix4 {
        let pvMatrixInv = this._pvMatrixInv.copyFrom(this.pvMatrix);
        pvMatrixInv.invert();
        return pvMatrixInv;
    }

    /**
     * get project invert matrix
     */
    public get projectionMatrixInv(): Matrix4 {
        this._projectionMatrixInv.copyFrom(this._projectionMatrix);
        this._projectionMatrixInv.invert();
        return this._projectionMatrixInv;
    }

    /**
     * Enter a 3D coordinate point to obtain the projected coordinate point
     * @param nX 3D x
     * @param nY 3D y
     * @param sZ 3D z
     * @param target The projected coordinate point can be empty
     * @returns Coordinates after projection
     */
    public unProject(nX: number, nY: number, sZ: number, target?: Vector3): Vector3 {
        if (!target) target = new Vector3();
        target.x = nX;
        target.y = -nY;
        target.z = sZ;
        target.w = 1.0;

        target.x *= sZ;
        target.y *= sZ;

        this._unprojection.copyFrom(this._projectionMatrix);
        this._unprojection.invert();

        MathUtil.transformVector(this._unprojection, target, target);
        target.z = sZ;

        return target;
    }

    /**
     * Enter the projected coordinate points to obtain a 3D coordinate point.
     * @param n Coordinate points after photography
     * @param target 3D coordinate points
     * @returns 3D coordinate points
     */
    private project(n: Vector3, target: Vector3): Vector3 {
        this._projectionMatrix.perspectiveMultiplyPoint3(n, target);
        target.x = target.x / target.w;
        target.y = -target.y / target.w;
        target.z = n.z;
        return target;
    }

    /**
     * Enter the 2D coordinates of the screen to obtain a ray that starts from the camera position and passes through the corresponding 3D position of the screen.
     * @param viewPortPosX Screen x coordinate
     * @param viewPortPosY Screen y coordinate
     * @returns ray
     */
    public screenPointToRay(viewPortPosX: number, viewPortPosY: number): Ray {
        let ray: Ray = this._ray;

        let start = CameraUtil.UnProjection(viewPortPosX, viewPortPosY, 0.01, this);
        let end = CameraUtil.UnProjection(viewPortPosX, viewPortPosY, 1.0, this);
        end = end.subtract(start).normalize();

        ray.origin.copyFrom(start);
        // ray.dir.copyFrom(end);
        ray.direction = end;

        return ray;
    }

    /**
     * Convert screen coordinates to world coordinates
     * @param viewPortPosX Screen x coordinate
     * @param viewPortPosY Screen y coordinate
     * @param z Screen z coordinate
     * @returns World coordinates
     */
    public screenPointToWorld(viewPortPosX: number, viewPortPosY: number, z: number): Vector3 {
        let pos = CameraUtil.UnProjection(viewPortPosX, viewPortPosY, z, this);
        return pos;
    }

    /**
     * Convert world coordinates to screen coordinates
     * @param viewPortPosX Screen x coordinate
     * @param viewPortPosY Screen y coordinate
     * @param z Screen z coordinate
     * @returns World coordinates
     */
    public worldToScreenPoint(point: Vector3, target?: Vector3): Vector3 {
        let pos = CameraUtil.Projection(point, this, target);
        return pos;
    }

    /**
     * Current object's gaze position (global) (modified by its own global transformation)
     * @param pos Own position (global)
     * @param target Location of the target (global)
     * @param up Upward direction
     */
    public lookAt(pos: Vector3, target: Vector3, up: Vector3 = Vector3.Y_AXIS) {
        this.transform.lookAt(pos, target, up);
        if (target) this.lookTarget.copyFrom(target);
    }

    /**
     * @internal
     */
    public resetProjectMatrix() {
        this.perspective(this.fov, this.aspect, this.near, this.far);
    }

    /**
     * @internal
     */
    public onUpdate() {
        if (this.type == CameraType.perspective) {
            this.aspect = webGPUContext.aspect;
            this.resetProjectMatrix();
        }
        if (this._useJitterProjection) {
            this.getJitteredProjectionMatrix();
        }
        this.frustum.update(this.pvMatrix);
    }

    private _haltonSeq: HaltonSeq;
    private _jitterOffsetList: Vector2[];
    private _useJitterProjection: boolean = false;
    private _jitterFrameIndex: number = 0;
    private _sampleIndex: number = 0;
    private _jitterX: number = 0;
    private _jitterY: number = 0;

    public get jitterFrameIndex() {
        return this._jitterFrameIndex;
    }

    public get jitterX(): number {
        return this._jitterX;
    }

    public get jitterY(): number {
        return this._jitterY;
    }

    public enableJitterProjection(value: boolean) {
        this._jitterFrameIndex = 0;
        this._useJitterProjection = value;
        this._haltonSeq ||= new HaltonSeq();
        this._jitterOffsetList = [];
        for (let i = 0; i < 8; i++) {
            let offset = this.generateRandomOffset();
            this._jitterOffsetList.push(offset);
        }
        this._jitterOffsetList.reverse();
    }

    private generateRandomOffset(): Vector2 {
        let offset = new Vector2(HaltonSeq.get((this._sampleIndex & 1023) + 1, 2) - 0.5, HaltonSeq.get((this._sampleIndex & 1023) + 1, 3) - 0.5);
        const k_SampleCount = 8;
        if (++this._sampleIndex >= k_SampleCount) this._sampleIndex = 0;

        return offset;
    }

    private getJitteredProjectionMatrix() {
        let setting = Engine3D.setting.render.postProcessing.taa;
        let mat = this._projectionMatrix;
        let temporalJitterScale: number = setting.temporalJitterScale;
        let offsetIndex = this._jitterFrameIndex % setting.jitterSeedCount;
        let num1 = this._jitterOffsetList[offsetIndex].x * temporalJitterScale;
        let num2 = this._jitterOffsetList[offsetIndex].y * temporalJitterScale;

        let jitX = mat.get(0, 2);
        let jitY = mat.get(1, 2);

        this._jitterX = num1 / this.viewPort.width;
        this._jitterY = num2 / this.viewPort.height;
        jitX += this._jitterX;
        jitY += this._jitterY;
        mat.set(0, 2, jitX);
        mat.set(1, 2, jitY);

        this._jitterFrameIndex++;
    }

    /**
     *
     * @param shadowCamera
     * @param lightDir
     */
    public getCastShadowLightSpaceMatrix(shadowCamera: Camera3D, lightDir: Vector3) {
        let frustum: Frustum = this.frustum;

        let proMat = this.projectionMatrixInv;
        let wMat = this.transform.worldMatrix;
        Matrix4.helpMatrix.copyFrom(proMat);
        Matrix4.helpMatrix.multiply(wMat);

        frustum.setFrustumCorners(Matrix4.helpMatrix);

        let corners = frustum.corners;
        let center = Vector3.HELP_6;
        center.set(0, 0, 0);

        for (const iterator of corners) {
            center.add(iterator, center);
        }

        center.div(corners.length, center);

        let lookTarget = Vector3.HELP_5;
        lookTarget.copyFrom(center);
        Vector3.HELP_0.copyFrom(lightDir);
        lookTarget.add(Vector3.HELP_0, lookTarget);
        shadowCamera.lookAt(lookTarget, center, Vector3.UP);

        let minX = Number.MAX_VALUE;
        let maxX = -Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        let minZ = Number.MAX_VALUE;
        let maxZ = -Number.MAX_VALUE;

        for (const iterator of corners) {
            minX = Math.min(minX, iterator.x);
            maxX = Math.max(maxX, iterator.x);
            minY = Math.min(minY, iterator.y);
            maxY = Math.max(maxY, iterator.y);
            minZ = Math.min(minZ, iterator.z);
            maxZ = Math.max(maxZ, iterator.z);
        }

        // Tune this parameter according to the scene
        let zMult = Engine3D.setting.shadow.shadowQuality;

        if (minZ < 0) {
            minZ *= zMult;
        } else {
            minZ /= zMult;
        }
        if (maxZ < 0) {
            maxZ /= zMult;
        } else {
            maxZ *= zMult;
        }

        shadowCamera.orthoOffCenter(minX, maxX, minY, maxY, minZ, maxZ);
    }

    public getWorldDirection(target?: Vector3) {
        target ||= new Vector3();
        this.transform.updateWorldMatrix();
        const e = this.transform._worldMatrix.rawData;
        return target.set(-e[8], -e[9], -e[10]).normalize();
    }

}
