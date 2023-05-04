import { Object3D } from '../../core/entities/Object3D';
import { Vector3 } from '../../math/Vector3';

/**
 * The base class of camera controllers
 * @internal
 * @group CameraController 
 */
export class CameraControllerBase {
    protected _autoUpdate: boolean = true;
    protected _target: Object3D | null;
    protected _lookAtObject: Object3D | null;
    protected _origin: Vector3 = new Vector3(0.0, 0.0, 0.0);
    protected _speed: number = 300;

    /**
     *
     * @constructor
     * @param targetObject control object3D
     * @param lookAtObject observational object3D
     */
    constructor(targetObject: Object3D | null = null, lookAtObject: Object3D | null = null) {
        this._target = targetObject;
        this._lookAtObject = lookAtObject;
    }

    /**
     *
     * Get the control object3D
     * @returns Object3D
     */
    public get target(): Object3D | null {
        return this._target;
    }

    /**
     *
     * Set the control object3D
     * @param val Object3D
     */
    public set target(val: Object3D | null) {
        if (this._target == val) return;
        this._target = val;
    }

    /**
     *
     * Get observational object3D
     * @returns Object3D
     */
    public get lookAtObject(): Object3D | null {
        return this._lookAtObject;
    }

    /**
     *
     * Set observational object3D
     * @param val Object3D
     */
    public set lookAtObject(val: Object3D | null) {
        if (this._lookAtObject == val) return;
        this._lookAtObject = val;
    }

    /**
     *
     * Get moving speed
     * @returns number
     * @version FlyEngine
     */
    public get speed(): number {
        return this._speed;
    }

    /**
     *
     * Set moving speed
     * @returns number
     * @version FlyEngine
     */
    public set speed(val: number) {
        this._speed = val;
    }

    /**
     * update(tick)
     */
    public update() { }
}
