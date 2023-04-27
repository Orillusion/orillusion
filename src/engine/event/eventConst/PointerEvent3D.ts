import { CEvent } from '../CEvent';

/**
 * enum event type of pointer.
 * {@link InputSystem}
 * @group Events
 */
export class PointerEvent3D extends CEvent {

    /**
     * Triggered when the touch point enters the collision
     */
    public static PICK_OVER = 'onPickOver';

    /**
     * Triggered when the touch point enters the interactive GUI
     */
    public static PICK_OVER_GUI = 'onPickOverGUI';

    /**
     * Triggered when the touch point clicked the collision
     */
    public static PICK_CLICK = 'onPickClick';

    /**
    * Triggered when the touch point clicked the interactive GUI
    */
    public static PICK_CLICK_GUI = 'onPickClickGUI';

    /**
    * Triggered when the touch point leave the collision
    */
    public static PICK_OUT = 'onPickOut';

    /**
     * Triggered when the touch point leave the interactive GUI
     */
    public static PICK_OUT_GUI = 'onPickOutGUI';

    /**
    * Triggered when the touch point move on the collision
    */
    public static PICK_MOVE = 'onPickMove';

    /**
     * Triggered when the touch point release from the collision
     */
    public static PICK_UP = 'onPickUp';

    /**
     * Triggered when the touch point release from the interactive GUI
     */
    public static PICK_UP_GUI = 'onPickUpGUI';

    /**
     * Triggered when the touch point pressed the collision
     */
    public static PICK_DOWN = 'onPickDown';

    /**
     * Triggered when the touch point pressed the interactive GUI
     */
    public static PICK_DOWN_GUI = 'onPickDownGUI';

    /**
     *
     * Triggered when the right pointer clicked
     */
    static POINTER_RIGHT_CLICK: string = 'onPointerRightClick';
    /**
     *
     * Triggered when the middle pointer released
     */
    static POINTER_MID_UP: string = 'onPointerMidUp';
    /**
     *
     * Triggered when the middle pointer pressed
     */
    static POINTER_MID_DOWN: string = 'onPointerMidDown';

    /**
     * Triggered when the pointer clicked  
     */
    static POINTER_CLICK: string = 'onPointerClick';

    /**
     *
     * Triggered when the pointer moved  
     */
    static POINTER_MOVE: string = 'onPointerMove';

    /**
     *
     * Triggered when the pointer pressed  
     */
    static POINTER_DOWN: string = 'onPointerDown';

    /**
     *
     * Triggered when the pointer released  
     */
    static POINTER_UP: string = 'onPointerUp';

    /**
     *
     * Triggered when the pointer move out  
     */
    static POINTER_OUT: string = 'onPointerOut';

    /**
     *
     * Triggered when the pointer move over  
     */
    static POINTER_OVER: string = 'onPointerOver';

    /**
     *
     * Triggered when the wheel pointer is used
     */
    static POINTER_WHEEL: string = 'onPointerWheel';

    /**
     * A unique identifier for an event caused by a pointer.
     */
    public pointerId: number;

    /**
     * event type
     */
    public pointerType: string;

    /**
     * whether it's the preferred pointer in this type of pointer.
     */
    public isPrimary: boolean;

    /**
     * Normalize values
     */
    public pressure: number;

    /**
     * coord x of mouse
     */
    public mouseX: number;

    /**
     * coord y of mouse
     */
    public mouseY: number;

    /**
     * delta of coord x of mouse
     */
    public movementX: number;

    /**
     * delta of coord y of mouse
     */
    public movementY: number;

    /**
     * Returns a negative value when scrolling left, 
     * a positive value when scrolling right, otherwise 0.
     */
    public deltaX: number;

    /**
     * Returns a positive value when scrolling down,
     *  a negative value when scrolling up, otherwise 0.
     */
    public deltaY: number;

    /**
     * @internal
     */
    public deltaZ: number;

    /**
     * @internal
     */
    public reset() {
        super.reset();
        this.mouseX = 0;
        this.mouseY = 0;
        this.movementX = 0;
        this.movementY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.deltaZ = 0;
    }
}
