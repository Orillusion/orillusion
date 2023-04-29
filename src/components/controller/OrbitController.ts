import { Engine3D } from '../../Engine3D';
import { Camera3D } from '../../core/Camera3D';
import { ComponentBase } from '../ComponentBase';
import { Vector3 } from '../../math/Vector3';
import { Vector3Ex } from '../../util/Vector3Ex';
import { clamp } from '../../math/MathUtil';
import { PointerEvent3D } from '../../event/eventConst/PointerEvent3D';

/**
 * Orbit Camera Controller
 * @group CameraController
 */
export class OrbitController extends ComponentBase {
    /**
     * internal camera
     */
    private _camera: Camera3D;
    /**
     * Whether to enable automatic rotation
     */
    public autoRotate: boolean = false;
    /**
     * Automatic rotation speed coefficient
     */
    public autoRotateSpeed: number = 0.1;
    /**
     * Rotation speed coefficient
     */
    public rotateFactor: number = 0.5;
    /**
     * Scale speed coefficient
     */
    public zoomFactor: number = 0.1;
    /**
     * Angle translation velocity coefficient
     */
    public panFactor: number = 0.25;

    private _smooth: number = 5;
    private _minDistance: number = 1;
    private _maxDistance: number = 100000;
    private _maxPolarAngle: number = 90;
    private _minPolarAngle: number = -90;
    private _target: Vector3 = new Vector3(0, 0, 0);
    private _cTarget: Vector3 = new Vector3(0, 0, 0);
    private _position: Vector3 = new Vector3(0, 0, 0);
    private _cPosition: Vector3 = new Vector3(0, 0, 0);
    private _spherical: Spherical = new Spherical()
    private _isMouseDown: boolean = false;
    private _lastMouseX: number = -1;
    private _lastMouseY: number = -1;
    private _isPanning: boolean = false

    /**
     * @constructor
     */
    constructor() {
        super();
    }
    /**
     * Get the target position
     */
    public get target(): Vector3 {
        return this._target;
    }
    /**
     * Set the target position
     */
    public set target(v: Vector3) {
        this._target = v;
    }

    /**
     * Set smoothing coefficient of controller
     */
    public get smooth(): number {
        return this._smooth;
    }
    /**
     * Get smoothing coefficient of controller
     */
    public set smooth(v: number) {
        this._smooth = Math.max(v, 1)
    }
    /**
     * Get the minimum distance between the camera and the target coordinate
     * @defaultValue 1
     */
    public get minDistance(): number {
        return this._minDistance;
    }
    /**
     * Set the minimum distance between the camera and the target position
     * min value: 0.000002
     * max value: `this._maxDistance` {@link maxDistance}
     */
    public set minDistance(v: number) {
        this._minDistance = clamp(v, 0.000002, this._maxDistance);
    }
    /**
     * Get the max distance between the camera and the target position
     * @defaultValue 100000
     */
    public get maxDistance(): number {
        return this._maxDistance;
    }
    /**
     * Set the max distance between the camera and the target position
     * min - `this._maxDistance`
     * max - Infinity
     */
    public set maxDistance(v: number) {
        this._maxDistance = clamp(v, this._minDistance, Infinity);
    }

    /**
     * Get the lower elevation limit of the camera from the xz plane
     * @defaultValue -90
     */
    public get minPolarAngle(): number {
        return this._minPolarAngle;
    }
    /**
     * Set the lower elevation limit of the camera from the xz plane
     * min - -90
     * max - {@link maxPolarAngle}
     */
    public set minPolarAngle(v: number) {
        this._minPolarAngle = clamp(v, -90, this._maxPolarAngle);
    }
    /**
     * Get the upper elevation limit of the camera from the xz plane
     * @defaultValue 90
     */
    public get maxPolarAngle(): number {
        return this._maxPolarAngle;
    }
    /**
     * Set the upper elevation limit of the camera to the xz plane
     * min - less than {@link minPolarAngle}   
     * max - 90
     */
    public set maxPolarAngle(v: number) {
        this._maxPolarAngle = clamp(v, this._minPolarAngle, 90);
    }
    /**
     * @internal
     */
    public start() {
        this._camera = this.object3D.getComponent(Camera3D);
        this._position = this.object3D.transform.localPosition.clone();
        this._cPosition = this._position.clone();
        this._target = this._camera.lookTarget.clone()
        this._cTarget = this._target.clone()
        this._spherical.setCoords(this._position.x - this._target.x, this._position.y - this._target.y, this._position.z - this._target.z)
        this._camera.lookAt(this._cPosition, this._cTarget, Vector3.UP);
        this.addEventListener()
    }
    /**
     * @internal
     */
    public onEnable() {
        this.addEventListener()
    }
    /**
     * @internal
     */
    public onDisable() {
        this.removeEventListener()
    }
    /**
     * @internal
     */
    public onUpdate() {
        let step = this._isPanning ? 1 : this.smooth
        let changed = false
        if (!this._cPosition.equals(this.object3D.transform.localPosition)) {
            this._position.copyFrom(this.object3D.transform.localPosition)
            step = 1
            changed = true
        }
        if (!this._cTarget.equals(this._target)) {
            this._cTarget.copyFrom(this._target)
            step = 1
            changed = true
        }
        if (changed) {
            this._spherical.setCoords(this._position.x - this._target.x, this._position.y - this._target.y, this._position.z - this._target.z)
        } else if (!this._isMouseDown && this.autoRotate) {
            this._spherical.theta -= this.autoRotateSpeed * Math.PI / 180;
            this.updateCamera();
        }
        let x = (this._position.x - this._cPosition.x) / step
        let y = (this._position.y - this._cPosition.y) / step
        let z = (this._position.z - this._cPosition.z) / step
        this._cPosition.x = Math.abs(x) > 1e-10 ? this._cPosition.x + x : this._position.x
        this._cPosition.y = Math.abs(y) > 1e-10 ? this._cPosition.y + y : this._position.y
        this._cPosition.z = Math.abs(z) > 1e-10 ? this._cPosition.z + z : this._position.z
        this._camera.lookAt(this._cPosition, this._cTarget, Vector3.UP);
    }
    /**
     * @internal
     */
    private onWheel(e: PointerEvent3D) {
        this._spherical.radius += e.deltaY * this.zoomFactor;
        this._spherical.radius = clamp(this._spherical.radius, this.minDistance, this.maxDistance);
        this.updateCamera();
    }
    /**
     * @internal
     */
    private onPointerDown(e: PointerEvent3D) {
        this._isMouseDown = true;
        this._lastMouseX = e.mouseX;
        this._lastMouseY = e.mouseY;
        if (e.mouseCode === 2)
            this._isPanning = true
    }
    /**
     * @internal
     */
    private onPointerMove(e: PointerEvent3D) {
        if (!this._isMouseDown || !this.enable) return;
        let mousex = e.mouseX;
        let mousey = e.mouseY;
        // rotate
        if (e.mouseCode === 0 && this._lastMouseX > 0 && this._lastMouseY > 0) {
            const ra = -(mousex - this._lastMouseX) * this.rotateFactor;
            const rb = (mousey - this._lastMouseY) * this.rotateFactor;
            this._spherical.theta += ra * Math.PI / 180;
            this._spherical.phi -= rb * Math.PI / 180;
            this._spherical.phi = clamp(this._spherical.phi, this.minPolarAngle, this.maxPolarAngle);
            this.updateCamera();
            // pan
        } else if (e.mouseCode === 2) {
            Vector3Ex.mulScale(this.object3D.transform.up, e.movementY * this.panFactor * this._camera.aspect, Vector3.HELP_1);
            this._target.y += Vector3.HELP_1.y;
            Vector3Ex.mulScale(this.object3D.transform.right, -e.movementX * this.panFactor, Vector3.HELP_1);
            this._target.x -= Vector3.HELP_1.x;
            this._target.z -= Vector3.HELP_1.z;
            this._cTarget.copyFrom(this._target)
            this.updateCamera();
        }
        this._lastMouseX = mousex;
        this._lastMouseY = mousey;
    }
    /**
     * @internal
     */
    private onPointerUp(e: PointerEvent3D) {
        this._isMouseDown = false;
        if (e.mouseCode === 2) {
            this._isPanning = false;
        }
    }
    private onPointerLeave() {
        this._isMouseDown = false;
        this._isPanning = false;
    }
    /**
     * @internal
     */
    private updateCamera() {
        this._spherical.makeSafe();
        let pos = this._spherical.getCoords();
        this._position.set(pos.x + this._target.x, pos.y + this._target.y, pos.z + this._target.z);
    }
    /**
     * @internal
     */
    private addEventListener() {
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_WHEEL, this.onWheel, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onPointerDown, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onPointerMove, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onPointerUp, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_OUT, this.onPointerLeave, this);
    }
    /**
     * @internal
     */
    private removeEventListener() {
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_WHEEL, this.onWheel, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_DOWN, this.onPointerDown, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_MOVE, this.onPointerMove, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_UP, this.onPointerUp, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_OUT, this.onPointerLeave, this);
    }
}

/**
 * @internal
 */
class Spherical {
    public radius: number;
    public phi: number;
    public theta: number;
    public coords: Vector3;
    constructor(radius = 1, phi = 0, theta = 0) {
        this.radius = radius;
        this.phi = phi; // polar angle
        this.theta = theta; // azimuthal angle
        this.coords = new Vector3()
        return this;
    }
    public set(radius: number, phi: number, theta: number) {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
        return this;
    }
    // restrict phi to be between EPS and PI-EPS
    public makeSafe(): this {
        const EPS = 0.0002;
        this.phi = Math.max(EPS, Math.min(Math.PI - EPS, this.phi));
        return this;
    }
    public setFromVector3(v: Vector3): this {
        return this.setCoords(v.x, v.y, v.z);
    }
    public setCoords(x: number, y: number, z: number): this {
        this.radius = Math.sqrt(x * x + y * y + z * z);
        if (this.radius === 0) {
            this.theta = 0;
            this.phi = 0;
        } else {
            this.theta = Math.atan2(x, z);
            this.phi = Math.acos(clamp(y / this.radius, - 1, 1));
        }
        return this;
    }
    public getCoords(): Vector3 {
        const sinPhiRadius = Math.sin(this.phi) * this.radius;
        this.coords.x = sinPhiRadius * Math.sin(this.theta);
        this.coords.y = Math.cos(this.phi) * this.radius;
        this.coords.z = sinPhiRadius * Math.cos(this.theta);
        return this.coords;
    }
}