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
import { FrustumCSM } from './csm/FrustumCSM';
import { CSM } from './csm/CSM';
import { CResizeEvent } from '../event/CResizeEvent';

/**
 * Camera components
 * @group Components
 */
export class Camera3D extends ComponentBase {

    /**
     * camera Perspective
     */
    public fov: number = 60;

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
     * orth camera right plane
     */
    public left: number = -100;

    /**
     * orth camera left plane
     */
    public right: number = 100;

    /**
     * orth camera top plane
     */
    public top: number = 100;

    /**
     * orth camera bottom plane
     */
    public bottom: number = -100;

    /**
     * orth view size
     */
    public frustumSize: number = 100;

    /**
     * camera view port size
     */
    public viewPort: Rect = new Rect();

    /**
     * camera frustum
     */
    public frustum: Frustum;

    // public sh_bak: Float32Array = new Float32Array([
    //     2.485296, 2.52417, 2.683965, 3.544894,
    //     0.2323964, 0.1813751, 0.08516902, -4.860471E-05,
    //     -0.2744142, -0.04131086, 0.2248164, -0.005996059,
    //     0.1551732, 0.137717, 0.1002693, -0.0006728604,
    //     0.2209381, 0.2109673, 0.1770538, -1.395991E-05,
    //     0.3529238, 0.2824739, 0.1817433, -0.0005164869,
    //     -0.1344275, -0.1289607, -0.1347626, 7.825881E-06,
    //     0.2125785, 0.1779549, 0.124602, 0.000503074,
    //     -0.1039777, -0.09676537, -0.07681116, -0.0004372867,
    // ]);

    public sh: Float32Array = new Float32Array(36);

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
    private _viewMatrixInv: Matrix4 = new Matrix4();
    private _unprojection: Matrix4 = new Matrix4();
    private _pvMatrixInv: Matrix4 = new Matrix4();
    private _pvMatrix: Matrix4 = new Matrix4();
    private _halfw: number;
    private _halfh: number;
    private _ray: Ray;
    private _enableCSM: boolean = false;
    public mainCamera: Camera3D;

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

    public csm: FrustumCSM;

    /**
     * @internal
     */
    public cubeShadowCameras: CubeCamera[] = [];

    public get enableCSM(): boolean {
        return this._enableCSM;
    }
    public set enableCSM(value: boolean) {
        if (value && !this.csm) {
            this.csm = new FrustumCSM(CSM.Cascades);
        }
        this._enableCSM = value;
    }
    constructor() {
        super();        
    }

    public init() {
        super.init();
        this._ray = new Ray();
        this.frustum = new Frustum();
        this.lookTarget = new Vector3(0, 0, 0);

        // TODO: set viewport based on View3D size
        this.viewPort.x = 0;
        this.viewPort.y = 0;
        this.viewPort.w = webGPUContext.presentationSize[0];
        this.viewPort.h = webGPUContext.presentationSize[1];

        this.updateProjection();        
        webGPUContext.addEventListener(CResizeEvent.RESIZE, this.updateProjection, this)
    }

    public updateProjection() {
        this.aspect = webGPUContext.aspect;
        if (this.type == CameraType.perspective) {
            this.perspective(this.fov, this.aspect, this.near, this.far);
        }else if(this.type == CameraType.ortho) {
            if(this.frustumSize)
                this.ortho(this.frustumSize, this.near, this.far);
            else
                this.orthoOffCenter(this.left, this.right, this.bottom, this.top, this.near, this.far);
        }  
    }

    public getShadowBias(depthTexSize: number): number {
        let sizeOnePixel = 2.0 * this.getShadowWorldExtents() / depthTexSize;
        let depth = this.far - this.near;
        return sizeOnePixel / depth - Engine3D.setting.shadow.shadowBias * 0.01;
    }

    public getShadowWorldExtents(): number {
        let shadowBound = Engine3D.setting.shadow.shadowBound;
        if (!shadowBound) {
            shadowBound = Math.round(0.05 * this.frustum.boundingBox.extents.length);
        } else {
            shadowBound *= 0.5;
        }
        return shadowBound;
    }

    // public getCSMShadowBias(index: number, depthTexSize: number): number {
    //     let sizeOnePixel = 2.0 * this.getCSMShadowWorldExtents(index) / depthTexSize;
    //     let depth = this.far - this.near;
    //     return sizeOnePixel / depth;
    // }

    public getCSMShadowBiasScale(shadowCamera: Camera3D): number {
        if (shadowCamera == this)
            return 1.0;

        let currentSize = this.far - this.near;
        let baseCamera = this.csm.children[0].shadowCamera;
        let baseSize = baseCamera.far - baseCamera.near;
        return baseSize / currentSize;
    }

    public getCSMShadowWorldExtents(index: number): number {
        return Math.round(this.csm.children[index].bound.extents.length);
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
        this.near = Math.max(0.001, near);
        this.far = far;
        this._projectionMatrix.perspective(this.fov, this.aspect, this.near, this.far);
        this.type = CameraType.perspective;
    }

    /**
     * set an orthographic camera with a frustumSize
     * @param frustumSize the frustum size 
     * @param near camera near plane
     * @param far camera far plane
     */
    public ortho(frustumSize: number, near: number, far: number) {
        this.frustumSize = frustumSize;
        let w = frustumSize * 0.5 * this.aspect;
        let h = frustumSize * 0.5;
        let left = -w / 2;
        let right = w / 2;
        let top = h / 2;
        let bottom = -h / 2;
        this.orthoOffCenter(left, right, bottom, top, near, far);
    }

    /**
     * set an orthographic camera with specified frustum space
     * @param left camera left plane
     * @param right camera right plane
     * @param bottom camera bottom plane
     * @param top camera top plane
     * @param near camera near plane
     * @param far camera far plane
     */
    public orthoOffCenter(left: number, right: number, bottom: number, top: number, near: number, far: number){
        this.near = near;
        this.far = far;
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.type = CameraType.ortho;
        this._projectionMatrix.orthoOffCenter(this.left, this.right, this.bottom, this.top, this.near, this.far);
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
        target.x = fScreenPtX / this.viewPort.width - 0.25;
        target.y = fScreenPtY / this.viewPort.height - 0.25;

        this.unProject(target.x, target.y, n.z, target);
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
        let matrix = this._pvMatrixInv.copyFrom(this.pvMatrix);
        matrix.invert();
        return matrix;
    }

    /**
     * get (project * view) invert matrix
     */
    public get pvMatrixInv(): Matrix4 {
        let matrix = this._pvMatrixInv.copyFrom(this.pvMatrix);
        matrix.invert();
        return matrix;
    }

    public get vMatrixInv(): Matrix4 {
        let matrix = this._viewMatrixInv.copyFrom(this.viewMatrix);
        matrix.invert();
        return matrix;
    }

    public get cameraToWorld(): Matrix4 {
        let cameraToWorld = Matrix4.helpMatrix;
        cameraToWorld.identity();
        cameraToWorld.copyFrom(this.projectionMatrixInv);
        cameraToWorld.multiply(this.vMatrixInv);
        return cameraToWorld;
    }

    public get ndcToView(): Matrix4 {
        let cameraToWorld = Matrix4.helpMatrix;
        cameraToWorld.identity();
        cameraToWorld.copyFrom(this.projectionMatrixInv);
        return cameraToWorld;
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
    public onUpdate() {
        if (this._useJitterProjection) {
            this.getJitteredProjectionMatrix();
        }
        this.frustum.update(this.pvMatrix);
        this.frustum.updateBoundBox(this.pvMatrixInv);
        let shadow = Engine3D.setting.shadow;
        this.enableCSM && this.csm?.update(this._projectionMatrix, this._pvMatrixInv, this.near, this.far, shadow);
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
        for (let i = 0; i < 32; i++) {
            let offset = this.generateRandomOffset();
            this._jitterOffsetList.push(offset);
        }
        this._jitterOffsetList.reverse();
    }

    private generateRandomOffset(): Vector2 {
        let offset = new Vector2(HaltonSeq.get((this._sampleIndex & 1023) + 1, 2) - 0.5, HaltonSeq.get((this._sampleIndex & 1023) + 1, 3) - 0.5);
        const k_SampleCount = 32;
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

    // /**
    //  *
    //  * @param shadowCamera
    //  * @param lightDir
    //  */
    // public getCastShadowLightSpaceMatrix(shadowCamera: Camera3D, lightDir: Vector3) {
    //     let frustum: Frustum = this.frustum;

    //     let proMat = this.projectionMatrixInv;
    //     let wMat = this.transform.worldMatrix;
    //     Matrix4.helpMatrix.copyFrom(proMat);
    //     Matrix4.helpMatrix.multiply(wMat);

    //     frustum.setFrustumCorners(Matrix4.helpMatrix);

    //     let corners = frustum.corners;
    //     let center = Vector3.HELP_6;
    //     center.set(0, 0, 0);

    //     for (const iterator of corners) {
    //         center.add(iterator, center);
    //     }

    //     center.div(corners.length, center);

    //     let lookTarget = Vector3.HELP_5;
    //     lookTarget.copyFrom(center);
    //     Vector3.HELP_0.copyFrom(lightDir);
    //     lookTarget.add(Vector3.HELP_0, lookTarget);
    //     shadowCamera.lookAt(lookTarget, center, Vector3.UP);

    //     let minX = Number.MAX_VALUE;
    //     let maxX = -Number.MAX_VALUE;
    //     let minY = Number.MAX_VALUE;
    //     let maxY = -Number.MAX_VALUE;
    //     let minZ = Number.MAX_VALUE;
    //     let maxZ = -Number.MAX_VALUE;

    //     for (const iterator of corners) {
    //         minX = Math.min(minX, iterator.x);
    //         maxX = Math.max(maxX, iterator.x);
    //         minY = Math.min(minY, iterator.y);
    //         maxY = Math.max(maxY, iterator.y);
    //         minZ = Math.min(minZ, iterator.z);
    //         maxZ = Math.max(maxZ, iterator.z);
    //     }

    //     // Tune this parameter according to the scene
    //     let zMult = Engine3D.setting.shadow.shadowQuality;

    //     if (minZ < 0) {
    //         minZ *= zMult;
    //     } else {
    //         minZ /= zMult;
    //     }
    //     if (maxZ < 0) {
    //         maxZ /= zMult;
    //     } else {
    //         maxZ *= zMult;
    //     }

    //     shadowCamera.orthoOffCenter(minX, maxX, minY, maxY, minZ, maxZ);
    // }

    public getWorldDirection(target?: Vector3) {
        target ||= new Vector3();
        // this.transform.updateWorldMatrix();
        const e = this.transform._worldMatrix.rawData;
        return target.set(-e[8], -e[9], -e[10]).normalize();
    }

}
