import { Engine3D } from "../../Engine3D";
import { Camera3D } from "../../core/Camera3D";
import { Object3D } from "../../core/entities/Object3D";
import { PointerEvent3D } from "../../event/eventConst/PointerEvent3D";
import { clamp } from "../../math/MathUtil";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { Object3DUtil } from "../../util/Object3DUtil";
import { Time } from "../../util/Time";
import { Vector3Ex } from "../../util/Vector3Ex";
import { ComponentBase } from "../ComponentBase";

/**
 * Hovering camera controller
 * @group CameraController 
 */
export class HoverCameraController extends ComponentBase {
    /**
     * camera controlling
     */
    public camera: Camera3D;

    /**
     * The closest distance that the mouse wheel can operate
     */
    public minDistance: number = 0.1;

    /**
     * The farthest distance that the mouse wheel can operate
     */
    public maxDistance: number = 500;

    /**
     * Smoothing coefficient of rolling angle
     */
    public rollSmooth: number = 15.0;

    /**
     * Smoothing coefficient of dragging
     */
    public dragSmooth: number = 20;

    /**
     * Smoothing coefficient of rolling
     */
    public wheelSmooth: number = 10;

    /**
     * Mouse scrolling step coefficient
     */
    public wheelStep: number = 0.002;

    /**
     * Right mouse movement coefficient
     */
    public mouseRightFactor: number = 0.5;

    /**
     * Left mouse movement coefficient
     */
    public mouseLeftFactor: number = 20;

    /**
     * Whether to enable smooth mode
     */
    public smooth: boolean = true;

    /**
     * @internal
     */
    private _wheelStep: number = 0.002;

    private _distance: number = 0;

    /**
     * Distance between camera and target
     */
    public distance: number = 10;
    private _roll: number = 0;

    /**
     * Roll angle around y-axis
     */
    public roll: number = 0;
    private _pitch: number = 0;

    /**
     * Pitch angle around x-axis
     */
    public pitch: number = 0;

    private _currentPos: Object3D;

    /**
     * @internal
     */
    private _targetPos: Object3D;

    private _mouseLeftDown: boolean = false;
    private _mouseRightDown: boolean = false;
    private _bottomClamp: number = 89.99;
    private _topClamp: number = -89.99;
    private _tempDir = new Vector3();
    private _tempPos = new Vector3();

    /**
     * @constructor
     */
    constructor() {
        super();
        this._currentPos = new Object3D();
        this._targetPos = new Object3D();
    }

    /**
     * @internal
     */
    public start(): void {
        this.camera = this.object3D.getOrAddComponent(Camera3D);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onMouseDown, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onMouseMove, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_WHEEL, this.onMouseWheel, this);

    }

    /**
     * Initialize Camera
     * @param roll  Roll angle around y-axis
     * @param pitch Pitch angle around x-axis
     * @param distance max distance to target
     * @param target coordinates of the target
     */
    public setCamera(roll: number, pitch: number, distance: number, target?: Vector3) {
        this.roll = roll;
        this.pitch = pitch;
        this.distance = distance;
        this.maxDistance = distance * 1.2;
        if (target) {
            this._targetPos.transform.localPosition.copy(target);
        }
    }

    public focusByBounds(obj: Object3D) {
        let bounds = Object3DUtil.genMeshBounds(obj);
        this.target = bounds.center;
        console.log(bounds.size);
        console.log(bounds.center);
    }

    /**
     * Set target position
     */
    public set target(target: Vector3) {
        this._targetPos.transform.localPosition.copy(target);
    }

    /**
     * Get target position
     * @return {Vector3}
     */
    public get target(): Vector3 {
        return this._targetPos.transform.localPosition;
    }

    private onMouseWheel(e: PointerEvent3D) {
        if (!this.enable) return;
        this._wheelStep = (this.wheelStep * Vector3Ex.distance(this._currentPos.transform.worldPosition, this.camera.transform.worldPosition)) / 10;
        this.distance -= Engine3D.inputSystem.wheelDelta * this._wheelStep;
        this.distance = clamp(this.distance, this.minDistance, this.maxDistance);
    }

    private onMouseDown(e: PointerEvent3D) {
        if (!this.enable) return;
        switch (e.mouseCode) {
            case 0:
                this._mouseLeftDown = true;
                break;
            case 1:
                break;
            case 2:
                this._mouseRightDown = true;
                break;
            default:
                break;
        }
    }

    private onMouseUp(e: PointerEvent3D) {
        // if (!this._enable) return;
        this._mouseLeftDown = false;
        this._mouseRightDown = false;
        // console.log("mouseup");
    }

    /**
     * @internal
     */
    private onMouseMove(e: PointerEvent3D) {
        // return;
        if (!this.enable) return;
        if (this._mouseRightDown) {
            let p = 0.25; //this.distance / (this.camera.far - this.camera.near);
            let f = this.camera.transform.forward;
            Vector3Ex.mulScale(f, e.movementY * p * this.camera.aspect, Vector3.HELP_1);
            this._targetPos.x += Vector3.HELP_1.x * this.mouseRightFactor;
            // this._targetPos.y -= Vector3.HELP_1.y;
            this._targetPos.z += Vector3.HELP_1.z * this.mouseRightFactor;

            let f2 = this.camera.transform.right;
            Vector3Ex.mulScale(f2, -e.movementX * p, Vector3.HELP_1);
            this._targetPos.x -= Vector3.HELP_1.x * this.mouseRightFactor;
            // this._targetPos.y -= Vector3.HELP_1.y;
            this._targetPos.z -= Vector3.HELP_1.z * this.mouseRightFactor;
        }

        if (this._mouseLeftDown) {
            this.roll -= e.movementX * Time.delta * 0.001 * this.mouseLeftFactor;
            this.pitch -= e.movementY * Time.delta * 0.001 * this.mouseLeftFactor;
            this.pitch = clamp(this.pitch, this._topClamp, this._bottomClamp);
        }
    }

    public onUpdate(): void {
        if (!this.enable) return;

        let dt = clamp(Time.delta, 0.0, 0.016);
        if (this.smooth) {
            this._currentPos.x += (this._targetPos.x - this._currentPos.x) * dt * this.dragSmooth;
            this._currentPos.y += (this._targetPos.y - this._currentPos.y) * dt * this.dragSmooth;
            this._currentPos.z += (this._targetPos.z - this._currentPos.z) * dt * this.dragSmooth;

            this._distance += (this.distance - this._distance) * dt * this.wheelSmooth;

            this._roll += (this.roll - this._roll) * dt * this.rollSmooth;
            this._pitch += (this.pitch - this._pitch) * dt * this.rollSmooth;
        } else {
            this._currentPos.x = this._targetPos.x;
            this._currentPos.y = this._targetPos.y;
            this._currentPos.z = this._targetPos.z;

            this._distance = this.distance;

            this._roll = this.roll;
            this._pitch = this.pitch;
        }

        this._tempDir.set(0, 0, 1);

        let q = Quaternion.HELP_0;
        q.fromEulerAngles(this._pitch, this._roll, 0.0);
        this._tempDir.applyQuaternion(q);

        this._tempPos = Vector3Ex.mulScale(this._tempDir, this._distance, this._tempPos);
        this._tempPos.add(this._currentPos.transform.localPosition, this._tempPos);

        this.transform.lookAt(this._tempPos, this._currentPos.transform.localPosition, Vector3.UP);
        this.camera.lookTarget.copy(this._currentPos.transform.localPosition);
    }

    /**
     * @internal
     */
    public destroy() {
        this.camera = null;
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_DOWN, this.onMouseDown, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_MOVE, this.onMouseMove, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_WHEEL, this.onMouseWheel, this);
        super.destroy();
    }
}
