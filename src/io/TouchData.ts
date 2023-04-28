/**
 * the param of touch event.
 * Save as the basic data for touch events in touch event. see InputSystem.
 * @internal
 * @group IO
 */
export class TouchData {
    constructor(touch: Touch) {
        this.canvasX = touch.clientX; //- Input.canvas.x + Input.canvas.offsetX;
        this.canvasY = touch.clientY; // Input.canvas.y + Input.canvas.offsetY;
        this.identifier = touch.identifier;
        this.clientX = touch.clientX;
        this.clientY = touch.clientY;
        this.pageX = touch.pageX;
        this.pageY = touch.pageY;
        this.screenX = touch.screenX;
        this.screenY = touch.screenY;
    }

    /**
     * The horizontal offset relative to the position of the upper left corner of Canvas.
     */
    public canvasX: number;

    /**
     * The vertical offset relative to the position of the upper left corner of Canvas.
     */
    public canvasY: number;

    /**
     * touch id
     */
    public identifier: number;

    /**
     * The horizontal offset relative to the top left corner of the browser content area
     * It will change with the movement of the scroll bar.
     */
    public clientX: number;

    /**
     * The ertical offset relative to the top left corner of the browser content area
     * It will change with the movement of the scroll bar.
     */
    public clientY: number;

    /**
     * The horizontal offset relative to the top left corner of the browser content area
     * It won't change with the movement of the scroll bar.
     */
    public pageX: number;

    /**
     * The ertical offset relative to the top left corner of the browser content area
     * It won't change with the movement of the scroll bar.
     */
    public pageY: number;

    /**
     * The horizontal offset relative to the position of the top left corner of the user screen.
     */
    public screenX: number;

    /**
     * The vertical offset relative to the position of the top left corner of the user screen.
     */
    public screenY: number;
}
