import { View3D } from '../core/View3D';
import { Object3D } from '../core/entities/Object3D';
import { TouchData } from '../io/TouchData';
import { CEventListener } from './CEventListener';
/**
 * Basic class of Event
 * @group Events
 */
export class CEvent {
    /**
     * Event target, it's usually event dispatcher
     */
    public target: Object3D;

    /**
     * Current event target, it's current bubble object
     */
    public currentTarget: CEventListener;

    /**
     * event type, it's registered string of key
     */
    public type: string;

    /**
     * extra data.Used for the transmission process of events, carrying data
     */
    public data: any;

    /**
     *
     * The param data when event is registered
     */
    public param: any;

    /**
     *
     * the time when event is
     */
    public time: number = 0;

    /**
     *
     *the delay time when event is dispatched.
     */
    public delay: number = 0;

    /**
     *
     * mouse code, see @MouseCode {@link MouseCode}
     */
    public mouseCode: number = 0;

    /**
     * Is Ctrl key pressed when the event occurs
     */
    public ctrlKey: boolean;

    /**
     * Is Alt key pressed when the event occurs
     */
    public altKey: boolean;

    /**
     * Is Shift key pressed when the event occurs
     */
    public shiftKey: boolean;

    /**
     * Collection of finger touch points, which registered
     */
    public targetTouches: Array<TouchData>;

    /**
     * Collection of finger touch points changed
     */
    public changedTouches: Array<TouchData>;

    /**
     * Collection of finger touch points
     */
    public touches: Array<TouchData>;

    private _stopImmediatePropagation: boolean = false;

    /**
     * binded view3D object in event.
     */
    public view: View3D;

    /**
     *
     * Create a new event, with type and data
     * @param eventType {any} eventType
     * @param data {any} param
     */
    constructor(eventType: string = null, data: any = null) {
        this.type = eventType;
        this.data = data;
    }
    /**
     *
     * Prevent bubbling of all event listeners in subsequent nodes of the current node in the event flow.
     */
    public stopImmediatePropagation() {
        this._stopImmediatePropagation = true;
    }

    /**
     * @internal
     * set stopImmediatePropagation as false
     */
    public reset() {
        this._stopImmediatePropagation = false;
    }

    /**
     * Returns stopImmediatePropagation value
     */
    public get isStopImmediatePropagation(): boolean {
        return this._stopImmediatePropagation;
    }
}
