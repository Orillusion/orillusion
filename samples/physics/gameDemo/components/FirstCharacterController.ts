
import { ComponentBase, Engine3D, KeyCode, KeyEvent, MouseCode, PointerEvent3D, Time, View3D } from "@orillusion/core";
import { PhysicTransformController } from "@samples/physics/helps/components/PhysicTransformController";


export class FirstCharacterController extends ComponentBase {

    private _actions = {};
    private _syncList = [];
    private _mouseLeftState: boolean = false;
    private _mouseRightState: boolean = false;
    private _mouseCacheX: number = 0;
    private _mouseCacheY: number = 0;
    private transformCtl: PhysicTransformController;
    onShot: Function;
    beginShot: boolean = false;


    private rotationXScaler: number = 50;
    private rotationYScaler: number = 50;

    private keysActions = {
        KeyUp: 'forward',
        KeyDown: 'back',
        KeyLeft: 'left',
        KeyRight: 'right',
        keyFlyUp: 'flyUp',
        keyFlyDown: 'flyDown',
        KeySpace: 'space',
    };
    shotTime: number = 0;
    shotRate: number = 100;

    public init(param?: any): void {
        this.transformCtl = this.object3D.addComponent(PhysicTransformController);
        this.transform.y = 4.6;

    }

    start(): void {
        this.activeKeyBord();
        this.activeMouse();
    }

    stop(): void {
        this.unActiveKeyBord();
        this.unActiveMouse();
    }

    public onBeforeUpdate(view?: View3D) {
        if (this._mouseRightState || Engine3D.inputSystem.mouseLock) {
            let mouseOffsetX = Engine3D.inputSystem.mouseOffsetX * this.rotationXScaler;
            this.transformCtl.rotationYDetail(-mouseOffsetX);
            this._mouseCacheX = Engine3D.inputSystem.mouseX;

            let mouseOffsetY = Engine3D.inputSystem.mouseOffsetY * this.rotationYScaler;
            this.transformCtl.rotationXDetail(mouseOffsetY);
            this._mouseCacheY = Engine3D.inputSystem.mouseY;

            Engine3D.inputSystem.mouseOffsetX = 0;
            Engine3D.inputSystem.mouseOffsetY = 0;
        }

        let speed = Time.delta * 0.001 * 600;
        if (this._actions[this.keysActions.KeyUp]) {
            this.transformCtl.moveForward(speed);
        }
        if (this._actions[this.keysActions.KeyDown]) {
            this.transformCtl.moveBack(speed);
        }
        if (this._actions[this.keysActions.KeyLeft]) {
            this.transformCtl.moveLeft(speed);
        }
        if (this._actions[this.keysActions.KeyRight]) {
            this.transformCtl.moveRight(speed);
        }
        if (this._actions[this.keysActions.keyFlyUp]) {
            this.transformCtl.flyUp(speed);
        }
        if (this._actions[this.keysActions.keyFlyDown]) {
            this.transformCtl.flyDown(speed);
        }
        if (this._actions[this.keysActions.KeySpace]) {
            // if (moveAbility.controller.onGround())
            // moveAbility.jump();
        }
    }

    private activeKeyBord() {
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.keyUp, this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
    }

    private unActiveKeyBord() {
        Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_UP, this.keyUp, this);
        Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
    }

    private activeMouse() {
        let inputSystem = Engine3D.inputSystem;

        inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onMouseDown, this);
        inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);
    }

    private unActiveMouse() {
        let inputSystem = Engine3D.inputSystem;

        inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onMouseDown, this);
        inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);
    }

    private destroyKeyBoard() {
        Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_UP, this.keyUp, this);
        Engine3D.inputSystem.removeEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
    }

    private onMouseDown(e: PointerEvent3D) {
        if (e.mouseCode == MouseCode.MOUSE_LEFT) {
            this._mouseLeftState = true;
            Engine3D.inputSystem.useMouseLock();

            // if (e.altKey) {
            //     if (!Engine3D.inputSystem.mouseLock) {
            //         Engine3D.inputSystem.useMouseLock();
            //     } else {
            //         Engine3D.inputSystem.releaseMouseLock();
            //     }
            // }

            if (this.onShot) {
                this.beginShot = true;
                this.shotTime = this.shotRate;
            }
        }

        if (e.mouseCode == MouseCode.MOUSE_RIGHT) {
            this._mouseRightState = true;
            this._mouseCacheX = Engine3D.inputSystem.mouseX;
            this._mouseCacheY = Engine3D.inputSystem.mouseY;
        }
    }

    private onMouseUp(e: PointerEvent3D) {
        if (e.mouseCode == MouseCode.MOUSE_LEFT) {
            this.beginShot = false;
            this._mouseLeftState = false;
        }

        if (e.mouseCode == MouseCode.MOUSE_RIGHT) {
            this._mouseRightState = false;
            this._mouseCacheX = Engine3D.inputSystem.mouseX;
            this._mouseCacheY = Engine3D.inputSystem.mouseY;
        }
    }

    private keyUp(e) {
        switch (e.keyCode) {
            case KeyCode.Key_W:
                console.log(e.keyCode, this.keysActions.KeyUp);
                this._actions[this.keysActions.KeyUp] = false;
                break;
            case KeyCode.Key_S:
                console.log(e.keyCode, this.keysActions.KeyDown);
                this._actions[this.keysActions.KeyDown] = false;
                break;
            case KeyCode.Key_A:
                console.log(e.keyCode, this.keysActions.KeyLeft);
                this._actions[this.keysActions.KeyLeft] = false;
                break;
            case KeyCode.Key_D:
                console.log(e.keyCode, this.keysActions.KeyRight);
                this._actions[this.keysActions.KeyRight] = false;
                break;
            case KeyCode.Key_Space:
                console.log(e.keyCode, this.keysActions.KeySpace);
                this._actions[this.keysActions.KeySpace] = false;
                break;
            case KeyCode.Key_Q:
                console.log(e.keyCode, this.keysActions.keyFlyUp);
                this._actions[this.keysActions.keyFlyUp] = false;
                break;
            case KeyCode.Key_E:
                console.log(e.keyCode, this.keysActions.keyFlyDown);
                this._actions[this.keysActions.keyFlyDown] = false;
                break;
        }
    }

    private keyDown(e: KeyEvent) {
        console.log(e.keyCode);
        switch (e.keyCode) {
            case KeyCode.Key_W:
                console.log(e.keyCode, "Key_Up");
                this._actions[this.keysActions.KeyUp] = true;
                break;
            case KeyCode.Key_S:
                console.log(e.keyCode, "Key_Down");
                this._actions[this.keysActions.KeyDown] = true;
                break;
            case KeyCode.Key_A:
                console.log(e.keyCode, "Key_Left");
                this._actions[this.keysActions.KeyLeft] = true;
                break;
            case KeyCode.Key_D:
                console.log(e.keyCode, "Key_Right");
                this._actions[this.keysActions.KeyRight] = true;
                break;
            case KeyCode.Key_Space:
                console.log(e.keyCode, this.keysActions.KeySpace);
                this._actions[this.keysActions.KeySpace] = true;
                break;

            case KeyCode.Key_Q:
                console.log(e.keyCode, this.keysActions.keyFlyUp);
                this._actions[this.keysActions.keyFlyUp] = true;
                break;

            case KeyCode.Key_E:
                console.log(e.keyCode, this.keysActions.keyFlyDown);
                this._actions[this.keysActions.keyFlyDown] = true;
                break;


        }

        if (e.keyCode == KeyCode.Key_Alt_L && e.altKey || e.keyCode == KeyCode.Key_Esc) {
            Engine3D.inputSystem.releaseMouseLock();
        }
    }

    public onUpdate(view?: View3D) {
        if (this.beginShot && this.onShot) {
            if (this.shotTime >= this.shotRate) {
                this.onShot();
                this.shotTime = 0;
            }
            this.shotTime += Time.delta;
        }
    }
}