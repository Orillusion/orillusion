import { CEvent } from '../event/CEvent';
import { CEventDispatcher } from '../event/CEventDispatcher';
import { CResizeEvent } from '../event/CResizeEvent';
import { KeyEvent } from '../event/eventConst/KeyEvent';
import { PointerEvent3D } from '../event/eventConst/PointerEvent3D';
import { KeyCode } from '../event/KeyCode';
import { MouseCode } from '../event/MouseCode';
import { Vector3 } from '../math/Vector3';
import { Time } from '../util/Time';
import { TouchData } from './TouchData';

/**
 *
 * Processing input devices, such as mouse, keyboard, and touch.
 * If the current event does not occur within the View3D, it will not be dispatched
 * @group IO
 */
export class InputSystem extends CEventDispatcher {
    /**
     * coord x of canvas
     */
    public canvasX: number = 0;
    /**
     * coord y of canvas
     */
    public canvasY: number = 0;

    /**
     *  whether the mouse is down now
     */
    public isMouseDown: boolean = false;

    /**
     * whether the mouse right key is down now
     */
    public isRightMouseDown: boolean = false;

    /**
     * reference of canvas
     */
    public canvas: HTMLCanvasElement;

    /**
     * current mouse coordinate x of Canvas
     */
    public mouseX: number = 0;

    /**
     * current mouse coordinate y of Canvas
     */
    public mouseY: number = 0;

    /**
     * the delta value when mouse wheeled
     */
    public wheelDelta: number = 0;

    /**
     * the delta value of mouse x
     */
    public mouseOffsetX: number = 0;

    /**
     * the delta value of mouse y
     */
    public mouseOffsetY: number = 0;

    /**
     * the history value of mouse x
     */
    public mouseLastX: number = 0;

    /**
     *
     * the history value of mouse y
     *
     */
    public mouseLastY: number = 0;

    private _time: number = 0;

    private _keyStatus: { [key: number]: boolean };
    private _mouseStatus: { [key: number]: boolean };
    private _isTouchStart: boolean;
    protected _keyEvent3d: KeyEvent;
    protected _pointerEvent3D: PointerEvent3D;
    protected _windowsEvent3d: CEvent;



    /**
     * init the input system
     * @param canvas the reference of canvas
     */
    public initCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        // canvas.style.position = 'absolute';
        // canvas.style.zIndex = '0';
        canvas.onpointerdown = (ev: PointerEvent) => {
            if (ev.button == 0) {
                this.mouseStart(ev);
            } else if (ev.button == 1) {
                this.middleDown(ev);
            } else if (ev.button == 2) {
                this.mouseStart(ev);
            }
        }
        canvas.onpointerup = (ev: PointerEvent) => {
            if (ev.button == 0) {
                this.mouseEnd(ev);
            } else if (ev.button == 1) {
                this.middleUp(ev);
            } else if (ev.button == 2) {
                this.mouseEnd(ev);
            }
        }
        canvas.onpointerenter = (ev: PointerEvent) => {
            this.mouseOver(ev);
        }

        canvas.onpointermove = (ev: PointerEvent) => {
            this.mouseMove(ev);
        }
        canvas.onpointercancel = (ev: PointerEvent) => {
            this.mouseEnd(ev);
        }
        canvas.onpointerleave = (ev: PointerEvent) => {
            this.mouseEnd(ev);
        }
        canvas.onpointerout = (ev: PointerEvent) => {
            this.mouseEnd(ev);
        }

        canvas.addEventListener(
            'click',
            (e: MouseEvent) => {
                //if right click
                if (e.button == 2) {
                    this.isRightMouseDown = false;
                    this.rightClick(e);
                } else if (e.button == 0) {
                    this.isMouseDown = false;
                    this.mouseClick(e);
                }
            },
            true,
        );


        canvas.addEventListener(`wheel`, (e: WheelEvent) => this.mouseWheel(e), { passive: false });

        window.addEventListener('keydown', (e: KeyboardEvent) => this.keyDown(e), true);

        window.addEventListener('keyup', (e: KeyboardEvent) => this.keyUp(e), true);

        canvas.oncontextmenu = function () {
            return false;
        };

        //window.addEventListener("resize", (e: UIEvent) => this.onWindowsResize(e), true);
        let rect: DOMRect = this.canvas.getBoundingClientRect();

        this.canvasX = rect.left; // parseInt( this.canvas.style.left.split("px")[0] );
        this.canvasY = rect.top; //rect parseInt(this.canvas.style.top.split("px")[0]);

        this._keyStatus = {};
        this._mouseStatus = {};
        this._isTouchStart = false;
        this._keyEvent3d = new KeyEvent();
        this._pointerEvent3D = new PointerEvent3D();
        this._windowsEvent3d = new CEvent();
    }



    private _gp: boolean = false;




    private onPinch(x1: number, y1: number, x2: number, y2: number) {
        this._oldPosition1 = new Vector3(x1, y1);
        this._oldPosition2 = new Vector3(x2, y2);
    }

    private onSwipe(x: number, y: number) {
        this.mouseX = x;
        this.mouseY = y;

        this._oldPosition1 = null;
        this._oldPosition2 = null;

        this._time = new Date().getTime();
    }

    private _oldPosition1: Vector3 = null;
    private _oldPosition2: Vector3 = null;

    private GetTargetTouches(targetTouches: TouchList): Array<TouchData> {
        var array: Array<TouchData> = new Array<TouchData>();
        for (var i = 0; i < targetTouches.length; i++) {
            var touchData = new TouchData(targetTouches[i]);
            array.push(touchData);
        }
        return array;
    }

    private rightClick(e: MouseEvent) {
        this._pointerEvent3D.reset();
        this._pointerEvent3D.mouseCode = e.button;
        this._pointerEvent3D.mouseX = e.clientX - this.canvasX;
        this._pointerEvent3D.mouseY = e.clientY - this.canvasY;
        // this._pointerEvent3D.target = this;
        this._pointerEvent3D.type = PointerEvent3D.POINTER_RIGHT_CLICK;

        this._pointerEvent3D.ctrlKey = e.ctrlKey;
        this._pointerEvent3D.altKey = e.altKey;
        this._pointerEvent3D.shiftKey = e.shiftKey;
        this.dispatchEvent(this._pointerEvent3D);
    }

    private middleDown(e: PointerEvent) {
        this._pointerEvent3D.reset();
        this._pointerEvent3D.mouseCode = e.button;
        this._pointerEvent3D.mouseX = e.clientX - this.canvasX;
        this._pointerEvent3D.mouseY = e.clientY - this.canvasY;
        // this._pointerEvent3D.target = this;
        this._pointerEvent3D.type = PointerEvent3D.POINTER_MID_DOWN;
        this._pointerEvent3D.ctrlKey = e.ctrlKey;
        this._pointerEvent3D.altKey = e.altKey;
        this._pointerEvent3D.shiftKey = e.shiftKey;
        this._pointerEvent3D.pointerId = e.pointerId;
        this._pointerEvent3D.pointerType = e.pointerType;
        this._pointerEvent3D.isPrimary = e.isPrimary;
        this._pointerEvent3D.pressure = e.pressure;
        this.dispatchEvent(this._pointerEvent3D);
    }

    private middleUp(e: PointerEvent) {
        this._pointerEvent3D.reset();
        this._pointerEvent3D.mouseCode = e.button;
        this._pointerEvent3D.mouseX = e.clientX - this.canvasX;
        this._pointerEvent3D.mouseY = e.clientY - this.canvasY;
        this._pointerEvent3D.type = PointerEvent3D.POINTER_MID_UP;
        this._pointerEvent3D.ctrlKey = e.ctrlKey;
        this._pointerEvent3D.altKey = e.altKey;
        this._pointerEvent3D.shiftKey = e.shiftKey;
        this._pointerEvent3D.pointerId = e.pointerId;
        this._pointerEvent3D.pointerType = e.pointerType;
        this._pointerEvent3D.isPrimary = e.isPrimary;
        this._pointerEvent3D.pressure = e.pressure;
        this.dispatchEvent(this._pointerEvent3D);
    }

    private mouseClick(e: MouseEvent) {
        this._pointerEvent3D.reset();
        this._pointerEvent3D.mouseCode = e.button;
        this._pointerEvent3D.mouseX = e.clientX - this.canvasX;
        this._pointerEvent3D.mouseY = e.clientY - this.canvasY;
        this._pointerEvent3D.type = PointerEvent3D.POINTER_CLICK;
        this._pointerEvent3D.ctrlKey = e.ctrlKey;
        this._pointerEvent3D.altKey = e.altKey;
        this._pointerEvent3D.shiftKey = e.shiftKey;

        this.dispatchEvent(this._pointerEvent3D);
    }

    private _downTime = 0;
    private mouseEnd(e: PointerEvent) {

        this.isMouseDown = false;

        this.mouseLastX = this.mouseX;
        this.mouseLastY = this.mouseY;

        this.mouseX = e.clientX - this.canvasX; /*- Input.canvas.x + Input.canvas.offsetX*/
        this.mouseY = e.clientY - this.canvasY; /*- Input.canvas.y + Input.canvas.offsetY*/

        this.mouseOffsetX = this.mouseX - this.mouseLastX;
        this.mouseOffsetY = this.mouseY - this.mouseLastY;
        this._pointerEvent3D.reset();
        this._pointerEvent3D.mouseCode = e.button;

        this._mouseStatus[this._pointerEvent3D.mouseCode] = false;
        this._pointerEvent3D.type = PointerEvent3D.POINTER_UP;
        this._pointerEvent3D.ctrlKey = e.ctrlKey;
        this._pointerEvent3D.altKey = e.altKey;
        this._pointerEvent3D.shiftKey = e.shiftKey;
        this._pointerEvent3D.pointerId = e.pointerId;
        this._pointerEvent3D.pointerType = e.pointerType;
        this._pointerEvent3D.isPrimary = e.isPrimary;
        this._pointerEvent3D.pressure = e.pressure;
        this._pointerEvent3D.mouseX = this.mouseX;
        this._pointerEvent3D.mouseY = this.mouseY;

        this.dispatchEvent(this._pointerEvent3D);
    }


    private mouseStart(e: PointerEvent) {
        this.isMouseDown = true;

        this.mouseLastX = this.mouseX;
        this.mouseLastY = this.mouseY;

        this.mouseX = e.clientX - this.canvasX; /*- Input.canvas.x + Input.canvas.offsetX*/
        this.mouseY = e.clientY - this.canvasY; /*- Input.canvas.y + Input.canvas.offsetY*/

        this.mouseOffsetX = this.mouseX - this.mouseLastX;
        this.mouseOffsetY = this.mouseY - this.mouseLastY;

        this._pointerEvent3D.reset();
        this._pointerEvent3D.mouseCode = e.button;
        this._pointerEvent3D.ctrlKey = e.ctrlKey;
        this._pointerEvent3D.altKey = e.altKey;
        this._pointerEvent3D.shiftKey = e.shiftKey;
        this._pointerEvent3D.pointerId = e.pointerId;
        this._pointerEvent3D.pointerType = e.pointerType;
        this._pointerEvent3D.isPrimary = e.isPrimary;
        this._pointerEvent3D.pressure = e.pressure;
        this._pointerEvent3D.mouseX = this.mouseX;
        this._pointerEvent3D.mouseY = this.mouseY;
        // if (!this._mouseStatus[this._touchEvent3d.mouseCode]) {
        //     this._mouseStatus[this._touchEvent3d.mouseCode] = true;
        this._pointerEvent3D.type = PointerEvent3D.POINTER_DOWN;
        this.dispatchEvent(this._pointerEvent3D);
        // }
    }

    private mouseMove(e: PointerEvent) {
        this.mouseLastX = this.mouseX;
        this.mouseLastY = this.mouseY;

        this.mouseX = e.clientX - this.canvasX; /*- Input.canvas.x + Input.canvas.offsetX*/
        this.mouseY = e.clientY - this.canvasY; /*- Input.canvas.y + Input.canvas.offsetY*/

        this.mouseOffsetX = this.mouseX - this.mouseLastX;
        this.mouseOffsetY = this.mouseY - this.mouseLastY;

        this._pointerEvent3D.reset();
        this._pointerEvent3D.type = PointerEvent3D.POINTER_MOVE;
        this._pointerEvent3D.ctrlKey = e.ctrlKey;
        this._pointerEvent3D.altKey = e.altKey;
        this._pointerEvent3D.shiftKey = e.shiftKey;
        this._pointerEvent3D.pointerId = e.pointerId;
        this._pointerEvent3D.pointerType = e.pointerType;
        this._pointerEvent3D.isPrimary = e.isPrimary;
        this._pointerEvent3D.pressure = e.pressure;
        this._pointerEvent3D.mouseX = this.mouseX;
        this._pointerEvent3D.mouseY = this.mouseY;

        this._pointerEvent3D.movementX = e.movementX;
        this._pointerEvent3D.movementY = e.movementY;
        this.dispatchEvent(this._pointerEvent3D);
    }

    private mouseOver(e: PointerEvent) {

        this.isMouseDown = false;

        this.mouseLastX = this.mouseX;
        this.mouseLastY = this.mouseY;

        this.mouseX = e.clientX - this.canvasX; /*- Input.canvas.x + Input.canvas.offsetX*/
        this.mouseY = e.clientY - this.canvasY; /*- Input.canvas.y + Input.canvas.offsetY*/

        this.mouseOffsetX = this.mouseX - this.mouseLastX;
        this.mouseOffsetY = this.mouseY - this.mouseLastY;

        this._pointerEvent3D.reset();
        this._pointerEvent3D.type = PointerEvent3D.POINTER_OVER;
        this._pointerEvent3D.ctrlKey = e.ctrlKey;
        this._pointerEvent3D.altKey = e.altKey;
        this._pointerEvent3D.shiftKey = e.shiftKey;
        this._pointerEvent3D.pointerId = e.pointerId;
        this._pointerEvent3D.pointerType = e.pointerType;
        this._pointerEvent3D.isPrimary = e.isPrimary;
        this._pointerEvent3D.pressure = e.pressure;
        this._pointerEvent3D.mouseX = this.mouseX;
        this._pointerEvent3D.mouseY = this.mouseY;
        this.dispatchEvent(this._pointerEvent3D);
    }

    private mouseWheel(e: WheelEvent) {
        //            e.stopImmediatePropagation();
        e.preventDefault();

        this.mouseLastX = this.mouseX;
        this.mouseLastY = this.mouseY;

        this.mouseX = e.clientX - this.canvasX; /*- Input.canvas.x + Input.canvas.offsetX*/
        this.mouseY = e.clientY - this.canvasY; /*- Input.canvas.y + Input.canvas.offsetY*/

        this.mouseOffsetX = this.mouseX - this.mouseLastX;
        this.mouseOffsetY = this.mouseY - this.mouseLastY;

        if (`wheelDelta` in e) {
            this._pointerEvent3D.delay = e[`wheelDelta`] as number;
            this.wheelDelta = e[`wheelDelta`] as number;
        } else if (`delta` in e) {
            this.wheelDelta = e[`delta`] as number;
        }

        this._pointerEvent3D.reset();
        this._pointerEvent3D.type = PointerEvent3D.POINTER_WHEEL;
        this._pointerEvent3D.ctrlKey = e.ctrlKey;
        this._pointerEvent3D.altKey = e.altKey;
        this._pointerEvent3D.shiftKey = e.shiftKey;
        this._pointerEvent3D.mouseX = this.mouseX;
        this._pointerEvent3D.mouseY = this.mouseY;
        this._pointerEvent3D.deltaX = e.deltaX;
        this._pointerEvent3D.deltaY = e.deltaY;
        this._pointerEvent3D.deltaZ = e.deltaZ;
        this.dispatchEvent(this._pointerEvent3D);
    }

    private keyDown(e: KeyboardEvent) {
        this._keyEvent3d.reset();
        this._keyEvent3d.keyCode = e.keyCode;
        this._keyEvent3d.ctrlKey = e.ctrlKey;
        this._keyEvent3d.altKey = e.altKey;
        this._keyEvent3d.shiftKey = e.shiftKey;

        if (!this._keyStatus[e.keyCode]) {
            this._keyStatus[e.keyCode] = true;
            this._keyEvent3d.type = KeyEvent.KEY_DOWN;
            this.dispatchEvent(this._keyEvent3d);
        }
    }

    private keyUp(e: KeyboardEvent) {
        this._keyEvent3d.reset();
        this._keyEvent3d.keyCode = e.keyCode;
        this._keyStatus[e.keyCode] = false;
        this._keyEvent3d.type = KeyEvent.KEY_UP;
        this.dispatchEvent(this._keyEvent3d);
    }


    private GetSlideAngle(dx: number, dy: number) {
        return (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    /**
     *
     * @param  startX {Number} 
     * @param  startY {Number} 
     * @param  endX   {Number} 
     * @param  endY   {Number} 
     * @returns result {number} 1: up, 2: down, 3: left, 4: right, 0: not move
     */
    public GetSlideDirection(startX: number, startY: number, endX: number, endY: number): number {
        var dy = startY - endY;
        var dx = endX - startX;
        var result = 0;

        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
            return result;
        }

        var angle = this.GetSlideAngle(dx, dy);
        if (angle >= -45 && angle < 45) {
            result = 4;
        } else if (angle >= 45 && angle < 135) {
            result = 1;
        } else if (angle >= -135 && angle < -45) {
            result = 2;
        } else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
            result = 3;
        }

        return result;
    }
}
