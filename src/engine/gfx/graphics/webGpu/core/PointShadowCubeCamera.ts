import { Vector3 } from '../math/Vector3';
import { CameraUtil } from '../util/CameraUtil';
import { Camera3D } from './Camera3D';
import { CameraType } from './CameraType';
import { Object3D } from './entities/Object3D';

/**
 * A cubic camera containing 6 perspective cameras.
 * @internal
 * @group Entity
 */
export class PointShadowCubeCamera extends Object3D {
    public up_camera: Camera3D;
    public down_camera: Camera3D;
    public left_camera: Camera3D;
    public right_camera: Camera3D;
    public front_camera: Camera3D;
    public back_camera: Camera3D;
    public set label(v: string) {
        this.up_camera.name = v + 'up';
        this.down_camera.name = v + 'down';
        this.left_camera.name = v + 'left';
        this.right_camera.name = v + 'right';
        this.front_camera.name = v + 'front';
        this.back_camera.name = v + 'back';
    }
    /**
     *
     * @constructor
     * @param near distance from origin to near plane of frustum
     * @param far distance from origin to far plane of frustum
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
        this.up_camera.object3D.scaleX = -1;
        this.up_camera.object3D.rotationY = 180;

        this.down_camera.perspective(fov, aspect, near, far);
        this.down_camera.lookAt(Vector3.ZERO, Vector3.DOWN, Vector3.DOWN);
        this.down_camera.object3D.scaleX = -1;
        this.down_camera.object3D.rotationY = 180;

        this.left_camera.perspective(fov, aspect, near, far);
        this.left_camera.lookAt(Vector3.ZERO, Vector3.LEFT);
        this.left_camera.object3D.scaleX = -1;

        this.right_camera.perspective(fov, aspect, near, far);
        this.right_camera.lookAt(Vector3.ZERO, Vector3.RIGHT);
        this.right_camera.object3D.scaleX = -1;

        this.front_camera.perspective(fov, aspect, near, far);
        this.front_camera.lookAt(Vector3.ZERO, Vector3.FORWARD);
        this.front_camera.object3D.scaleX = -1;

        this.back_camera.perspective(fov, aspect, near, far);
        this.back_camera.lookAt(Vector3.ZERO, Vector3.BACK);
        this.back_camera.object3D.scaleX = -1;

        this.up_camera.type = CameraType.shadow;
        this.down_camera.type = CameraType.shadow;
        this.left_camera.type = CameraType.shadow;
        this.right_camera.type = CameraType.shadow;
        this.front_camera.type = CameraType.shadow;
        this.back_camera.type = CameraType.shadow;

    }

}
