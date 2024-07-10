import { Vector3 } from '../math/Vector3';
import { CameraUtil } from '../util/CameraUtil';
import { Camera3D } from './Camera3D';
import { CameraType } from './CameraType';
import { Object3D } from './entities/Object3D';

/**
 * A cube camera containing 6 perspective cameras.
 * @internal
 * @group Entity
 */
export class CubeCamera extends Object3D {
    public up_camera: Camera3D;
    public down_camera: Camera3D;
    public left_camera: Camera3D;
    public right_camera: Camera3D;
    public front_camera: Camera3D;
    public back_camera: Camera3D;
    private _near: number;
    private _far: number;

    /**
     *
     * Construct a cube camera with 6 perspective cameras,
     * @param near  near plane
     * @param far far plane
     */
    constructor(near: number = 0.001, far: number = 10000, fov: number = 90, isShadow: boolean = false) {
        super();
        this.initCubeCamera(near, far, fov, isShadow);
    }

    initCubeCamera(near: number, far: number, fov: number = 90, isShadow: boolean = false) {
        this.up_camera = CameraUtil.createCamera3DObject(this, 'up');
        this.down_camera = CameraUtil.createCamera3DObject(this, 'down');
        this.left_camera = CameraUtil.createCamera3DObject(this, 'left');
        this.right_camera = CameraUtil.createCamera3DObject(this, 'right');
        this.front_camera = CameraUtil.createCamera3DObject(this, 'front');
        this.back_camera = CameraUtil.createCamera3DObject(this, 'back');

        this.up_camera.isShadowCamera = isShadow;
        this.down_camera.isShadowCamera = isShadow;
        this.left_camera.isShadowCamera = isShadow;
        this.right_camera.isShadowCamera = isShadow;
        this.front_camera.isShadowCamera = isShadow;
        this.back_camera.isShadowCamera = isShadow;

        let aspect = 1.0; // webGPUContext.aspect;
        this.up_camera.perspective(fov, aspect, near, far);
        this.up_camera.lookAt(Vector3.ZERO, Vector3.UP, Vector3.DOWN);

        this.down_camera.perspective(fov, aspect, near, far);
        this.down_camera.lookAt(Vector3.ZERO, Vector3.DOWN, Vector3.DOWN);

        this.left_camera.perspective(fov, aspect, near, far);
        this.left_camera.lookAt(Vector3.ZERO, Vector3.LEFT);

        this.right_camera.perspective(fov, aspect, near, far);
        this.right_camera.lookAt(Vector3.ZERO, Vector3.RIGHT);

        this.front_camera.perspective(fov, aspect, near, far);
        this.front_camera.lookAt(Vector3.ZERO, Vector3.FORWARD);

        this.back_camera.perspective(fov, aspect, near, far);
        this.back_camera.lookAt(Vector3.ZERO, Vector3.BACK);

        this.up_camera.type = CameraType.shadow;
        this.down_camera.type = CameraType.shadow;
        this.left_camera.type = CameraType.shadow;
        this.right_camera.type = CameraType.shadow;
        this.front_camera.type = CameraType.shadow;
        this.back_camera.type = CameraType.shadow;
    }

    public set near(value: number) {
        this._near = value;
        this.up_camera.near = value;
        this.down_camera.near = value;
        this.left_camera.near = value;
        this.right_camera.near = value;
        this.front_camera.near = value;
        this.back_camera.near = value;
    }

    public get near() {
        return this._near;
    }


    public set far(value: number) {
        this._far = value;
        this.up_camera.far = value;
        this.down_camera.far = value;
        this.left_camera.far = value;
        this.right_camera.far = value;
        this.front_camera.far = value;
        this.back_camera.far = value;
    }

    public get far() {
        return this._far;
    }
}
