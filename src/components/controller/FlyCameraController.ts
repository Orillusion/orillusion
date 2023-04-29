import { Engine3D } from "../../Engine3D";
import { KeyCode } from "../../event/KeyCode";
import { KeyEvent } from "../../event/eventConst/KeyEvent";
import { PointerEvent3D } from "../../event/eventConst/PointerEvent3D";
import { clamp, lerp } from "../../math/MathUtil";
import { Vector3 } from "../../math/Vector3";
import { Time } from "../../util/Time";
import { ComponentBase } from "../ComponentBase";

/**
 * Free camera controller.
 * Move forward, backward, left, and right in the direction of W A S D.
 * Control the camera's movement direction by holding down the left mouse button
 * @group CameraController 
 */
export class FlyCameraController extends ComponentBase {
    /**
     *  Camera movement speed
     */
    public moveSpeed: number = 2;
    /**
     *
     * Coordinates of specific objects
     */
    public targetPos: Vector3 = new Vector3(0, 0, 10);
    /**
     *
     * Camera orientation coordinates
     */
    public lookAtPos: Vector3 = new Vector3(0, 0, 0);

    /**
     * @internal
     */
    public config: { shiftMoveScale: number } = { shiftMoveScale: 20.0 };

    private _moveScale: number = 1;
    private _dir: Vector3;
    private _mouseFactory: number = 25;
    private _factory: number = 1.5;
    private _mouseDown: boolean = false;
    private _lastPos: Vector3;

    private _keyState: {
        front: boolean;
        back: boolean;
        left: boolean;
        right: boolean;
        q: boolean;
        e: boolean;
    };


    constructor() {
        super();
        this._lastPos = new Vector3();
        this._keyState = {
            front: false,
            back: false,
            left: false,
            right: false,
            q: false,
            e: false,
        };
        this.setCamera(new Vector3(0, 0, 100), new Vector3(0, 0, 0));
    }

    /**
     *
     * Initialize camera data
     * @param cameraPos source position 
     * @param lookAt target position
     */
    public setCamera(cameraPos: Vector3, lookAt: Vector3) {
        this.targetPos.copyFrom(cameraPos);
        this.lookAtPos.copyFrom(lookAt);
        this.Reset();
    }

    /**
     * @internal
     */
    public start(): void {
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_WHEEL, this.mouseWheel, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.mouseUp, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.mouseDown, this);

        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.keyUp, this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);

        this.transform.lookAt(this.targetPos, this.lookAtPos);


    }

    private mouseWheel(e: PointerEvent3D) { }

    private keyUp(e: KeyEvent) {
        switch (e.keyCode) {
            case KeyCode.Key_W:
                this._keyState.front = false;
                break;
            case KeyCode.Key_S:
                this._keyState.back = false;
                break;
            case KeyCode.Key_A:
                this._keyState.left = false;
                break;
            case KeyCode.Key_D:
                this._keyState.right = false;
                break;
            case KeyCode.Key_Shift_L:
                this._moveScale = 1.0;
                break;
            case KeyCode.Key_Q:
                this._keyState.q = false;
                break;
            case KeyCode.Key_E:
                this._keyState.e = false;
                break;

            case KeyCode.Key_F:
                this.transform.lookAt(this.targetPos, this.lookAtPos);
                break;
            default:
                break;
        }
    }

    private keyDown(e: KeyEvent) {
        switch (e.keyCode) {
            case KeyCode.Key_W:
                this._keyState.front = true;
                break;
            case KeyCode.Key_S:
                this._keyState.back = true;
                break;
            case KeyCode.Key_A:
                this._keyState.left = true;
                break;
            case KeyCode.Key_D:
                this._keyState.right = true;
                break;
            case KeyCode.Key_Q:
                this._keyState.q = true;
                break;
            case KeyCode.Key_E:
                this._keyState.e = true;
                break;
            case KeyCode.Key_Shift_L:
                this._moveScale = this.config.shiftMoveScale;
            default:
                break;
        }
    }

    private Reset() {
        this._lastPos.x = Engine3D.inputSystem.mouseLastX;
        this._lastPos.y = Engine3D.inputSystem.mouseLastY;
    }

    private mouseDown(e: PointerEvent3D) {
        this.Reset();
        this._mouseDown = true;
    }

    private mouseUp(e: PointerEvent3D) {
        this.Reset();
        this._mouseDown = false;
    }

    /**
     *
     * Get the smoothness of the camera by keyboard control
     */
    public get factory(): number {
        return this._factory;
    }

    /**
     *
     * Set the smoothness of the camera by keyboard control
     */
    public set factory(value: number) {
        this._factory = value;
    }

    /**
     *
     * Get the smoothness of the camera by mouse control
     */
    public get mouseFactory(): number {
        return this._mouseFactory;
    }

    /**
     *
     * Set the smoothness of the camera by mouse control
     */
    public set mouseFactory(value: number) {
        this._mouseFactory = value;
    }

    /**
     * @internal
     * @param target 
     * @param current 
     * @param t 
     * @returns 
     */
    private internal(target: number, current: number, t: number) {
        return (current - target) * t;
    }

    public onUpdate(): void {
        this.transform.updateWorldMatrix();
        let transform = this.transform;
        let dt = clamp(Time.delta, 0.0, 0.016);

        if (this._mouseDown) {
            // let rX = Lerp(transform.rotationY, transform.rotationY + (inputSystem.mouseLastX - this._lastPos.x) * 0.25, Time.detail * this._mouseFactory);
            // let rY = Lerp(transform.rotationX, transform.rotationX + (inputSystem.mouseLastY - this._lastPos.y) * 0.25, Time.detail * this._mouseFactory);
            transform.rotationY -= this.internal(transform.rotationY + (Engine3D.inputSystem.mouseLastX - this._lastPos.x) * 0.25, transform.rotationY, dt * this._mouseFactory);
            transform.rotationX -= this.internal(transform.rotationX + (Engine3D.inputSystem.mouseLastY - this._lastPos.y) * 0.25, transform.rotationX, dt * this._mouseFactory);
            this.Reset();
        }

        if (this._keyState.front) {
            let forward = transform.forward;
            transform.x -= this.internal(transform.x + forward.x * this.moveSpeed * this._moveScale, transform.x, dt * this._factory);
            transform.y -= this.internal(transform.y + forward.y * this.moveSpeed * this._moveScale, transform.y, dt * this._factory);
            transform.z -= this.internal(transform.z + forward.z * this.moveSpeed * this._moveScale, transform.z, dt * this._factory);
        }

        if (this._keyState.back) {
            let forward = transform.forward;
            transform.x += this.internal(transform.x + forward.x * this.moveSpeed * this._moveScale, transform.x, dt * this._factory);
            transform.y += this.internal(transform.y + forward.y * this.moveSpeed * this._moveScale, transform.y, dt * this._factory);
            transform.z += this.internal(transform.z + forward.z * this.moveSpeed * this._moveScale, transform.z, dt * this._factory);
        }

        if (this._keyState.left) {
            let right = transform.left;
            transform.x += this.internal(transform.x + right.x * this.moveSpeed * this._moveScale, transform.x, dt * this._factory);
            transform.y += this.internal(transform.y + right.y * this.moveSpeed * this._moveScale, transform.y, dt * this._factory);
            transform.z += this.internal(transform.z + right.z * this.moveSpeed * this._moveScale, transform.z, dt * this._factory);
        }

        if (this._keyState.right) {
            let right = transform.left;
            transform.x -= this.internal(transform.x + right.x * this.moveSpeed * this._moveScale, transform.x, dt * this._factory);
            transform.y -= this.internal(transform.y + right.y * this.moveSpeed * this._moveScale, transform.y, dt * this._factory);
            transform.z -= this.internal(transform.z + right.z * this.moveSpeed * this._moveScale, transform.z, dt * this._factory);
        }

        if (this._keyState.q) {
            transform.y = lerp(transform.y, transform.y - this.moveSpeed * this._moveScale, dt * this._factory);
        }

        if (this._keyState.e) {
            transform.y = lerp(transform.y, transform.y + this.moveSpeed * this._moveScale, dt * this._factory);
            // transform.y -= this.moveSpeed * this._moveScale * Time.detail ;
        }

        // if (Input.GetKey(KeyCode.E))
        //   transform.position += transform.up * speed * Time.deltaTime;
        // if (Input.GetKey(KeyCode.Q))
        //   transform.position -= transform.up * speed * Time.deltaTime;
    }

    /**
     * @internal
     */
    public destroy(): void {
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_WHEEL, this.mouseWheel, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_UP, this.mouseUp, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_DOWN, this.mouseDown, this);

        Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_UP, this.keyUp, this);
        Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
        super.destroy();
    }
}
